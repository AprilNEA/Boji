//! Authentication mail delivery.
//!
//! Input: a [`MailTransport`] from the configuration.
//! Output: [`Mailer`], the Better Auth [`EmailProvider`], and the senders in
//! [`messages`].
//! Pos: the only code that delivers mail. It never logs recipients, tokens,
//! URLs or message bodies.

mod file;
pub mod messages;
mod smtp;

use std::{path::PathBuf, sync::Arc};

use async_trait::async_trait;
use better_auth::email::EmailProvider;
use better_auth::error::{AuthError, AuthResult};
use thiserror::Error;

pub use file::PrivateFileEmailProvider;
pub use messages::{
    ChangeEmailConfirmationSender, DeleteAccountEmailSender, PasswordResetEmailSender,
    VerificationEmailSender,
};
pub use smtp::{SmtpCredentials, SmtpRelay, SmtpSecurity};

/// How the service delivers authentication mail.
#[derive(Clone, Debug)]
pub enum MailTransport {
    /// Write each message to a private local directory. Production rejects it.
    Files {
        /// Absolute directory that receives one `.eml` file per message.
        directory: PathBuf,
    },
    /// Send each message through an SMTP relay.
    Smtp(SmtpRelay),
}

/// Errors returned while configuring or delivering mail.
#[derive(Debug, Error)]
pub enum MailFailure {
    /// The configured directory is not an absolute local path.
    #[error("private mail output directory must be an absolute path")]
    RelativeDirectory,
    /// A private mail filesystem operation failed.
    #[error("private mail output operation failed")]
    Io(#[source] std::io::Error),
    /// The SMTP relay settings cannot build a transport.
    #[error("SMTP relay configuration is invalid")]
    SmtpConfig(#[source] lettre::transport::smtp::Error),
    /// The user record has no usable email address.
    #[error("mail recipient is unavailable")]
    MissingRecipient,
}

/// The [`EmailProvider`] of the service. Cloning shares the transport.
#[derive(Clone)]
pub struct Mailer {
    transport: Arc<Transport>,
}

enum Transport {
    Files(PrivateFileEmailProvider),
    Smtp(smtp::SmtpMailer),
}

impl Mailer {
    /// Build the transport. No connection is opened until the first message.
    pub fn new(transport: MailTransport) -> Result<Self, MailFailure> {
        let transport = match transport {
            MailTransport::Files { directory } => {
                Transport::Files(PrivateFileEmailProvider::new(directory)?)
            }
            MailTransport::Smtp(relay) => Transport::Smtp(smtp::SmtpMailer::new(relay)?),
        };
        Ok(Self {
            transport: Arc::new(transport),
        })
    }
}

impl std::fmt::Debug for Mailer {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let transport = match self.transport.as_ref() {
            Transport::Files(_) => "files",
            Transport::Smtp(_) => "smtp",
        };
        f.debug_struct("Mailer")
            .field("transport", &transport)
            .finish()
    }
}

#[async_trait]
impl EmailProvider for Mailer {
    async fn send(&self, to: &str, subject: &str, html: &str, text: &str) -> AuthResult<()> {
        match self.transport.as_ref() {
            Transport::Files(provider) => provider.send(to, subject, html, text).await,
            Transport::Smtp(mailer) => mailer.send(to, subject, html, text).await,
        }
    }
}

/// Return the error that Better Auth receives when delivery fails.
///
/// The message is generic, so a client never learns about the relay.
fn delivery_failed() -> AuthError {
    AuthError::internal("email delivery failed")
}
