//! SMTP relay delivery through `lettre` with rustls.

use std::time::Duration;

use better_auth::error::AuthResult;
use lettre::message::{Mailbox, MultiPart};
use lettre::transport::smtp::authentication::Credentials;
use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};

use super::{MailFailure, delivery_failed};

/// Time limit for each SMTP connection and command.
const TIMEOUT: Duration = Duration::from_secs(15);

/// Transport security between the service and the relay.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SmtpSecurity {
    /// TLS from the first byte, usually port 465.
    Tls,
    /// Plain connection upgraded with a required `STARTTLS`, usually port 587.
    StartTls,
    /// No TLS. Only for a relay on a trusted local network or a test server.
    None,
}

impl SmtpSecurity {
    /// Parse `SMTP_TLS`: `tls`, `starttls` or `none`.
    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "tls" => Some(Self::Tls),
            "starttls" => Some(Self::StartTls),
            "none" => Some(Self::None),
            _ => None,
        }
    }

    /// The port that this mode usually uses.
    pub fn default_port(self) -> u16 {
        match self {
            Self::Tls => 465,
            Self::StartTls => 587,
            Self::None => 25,
        }
    }
}

/// SMTP user name and password. `Debug` hides the password.
#[derive(Clone)]
pub struct SmtpCredentials {
    /// SMTP user name.
    pub username: String,
    /// SMTP password. Never log this field.
    pub password: String,
}

impl std::fmt::Debug for SmtpCredentials {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("SmtpCredentials")
            .field("username", &self.username)
            .field("password", &"<redacted>")
            .finish()
    }
}

/// SMTP relay settings.
#[derive(Clone, Debug)]
pub struct SmtpRelay {
    /// Host name of the relay. TLS checks the certificate against it.
    pub host: String,
    /// TCP port of the relay.
    pub port: u16,
    /// Transport security.
    pub security: SmtpSecurity,
    /// Credentials, or `None` for a relay without authentication.
    pub credentials: Option<SmtpCredentials>,
    /// `From` address of every message.
    pub from: Mailbox,
}

/// A pooled SMTP transport and the sender address.
pub(super) struct SmtpMailer {
    transport: AsyncSmtpTransport<Tokio1Executor>,
    from: Mailbox,
}

impl SmtpMailer {
    pub(super) fn new(relay: SmtpRelay) -> Result<Self, MailFailure> {
        let builder = match relay.security {
            SmtpSecurity::Tls => AsyncSmtpTransport::<Tokio1Executor>::relay(&relay.host),
            SmtpSecurity::StartTls => {
                AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&relay.host)
            }
            SmtpSecurity::None => Ok(AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous(
                relay.host.as_str(),
            )),
        }
        .map_err(MailFailure::SmtpConfig)?;
        let mut builder = builder.port(relay.port).timeout(Some(TIMEOUT));
        if let Some(credentials) = relay.credentials {
            builder =
                builder.credentials(Credentials::new(credentials.username, credentials.password));
        }
        Ok(Self {
            transport: builder.build(),
            from: relay.from,
        })
    }

    pub(super) async fn send(
        &self,
        to: &str,
        subject: &str,
        html: &str,
        text: &str,
    ) -> AuthResult<()> {
        let recipient: Mailbox = to.parse().map_err(|_| {
            tracing::error!(
                event = "mail_delivery_failed",
                transport = "smtp",
                stage = "recipient"
            );
            delivery_failed()
        })?;
        let message = Message::builder()
            .from(self.from.clone())
            .to(recipient)
            .subject(subject)
            .multipart(MultiPart::alternative_plain_html(
                text.to_owned(),
                html.to_owned(),
            ))
            .map_err(|_| {
                tracing::error!(
                    event = "mail_delivery_failed",
                    transport = "smtp",
                    stage = "build"
                );
                delivery_failed()
            })?;
        self.transport.send(message).await.map_err(|error| {
            // The reply text of a relay can repeat the recipient, so log only its kind and code.
            tracing::error!(
                event = "mail_delivery_failed",
                transport = "smtp",
                stage = "send",
                permanent = error.is_permanent(),
                transient = error.is_transient(),
                timeout = error.is_timeout(),
                tls = error.is_tls(),
                code = error.status().map(|code| code.to_string()),
            );
            delivery_failed()
        })?;
        Ok(())
    }
}
