//! Validated process configuration without secret-bearing Debug output.
//!
//! Input: the environment variables in [`source::VARIABLES`], read through figment.
//! Output: [`Config`], whose fields hold checked values.
//! Pos: the only place that reads service configuration.

pub mod source;

use crate::apple::AppleSignIn;
use crate::auth::{AccountLinking, ClientIp};
use crate::domain::organization::AffiliationEmailKey;
use crate::mail::{MailTransport, SmtpCredentials, SmtpRelay, SmtpSecurity};
use crate::wallet::{PassSigner, WalletCredentials};
use anyhow::{Context, Result, anyhow, bail};
use better_auth::plugins::oauth::AppleClientSecretSigner;
use figment::{Figment, Provider};
use source::{AppleSettings, Environment, MailSettings, Settings, SmtpSettings, WalletSettings};
use std::{
    net::{IpAddr, SocketAddr},
    path::PathBuf,
};
use url::Url;

/// Log filter when `RUST_LOG` is unset.
const DEFAULT_LOG_FILTER: &str = "off,boji_bizserver=info";

/// Runtime configuration shared by HTTP and database initialization.
pub struct Config {
    /// PostgreSQL connection string. Never log this field.
    pub database_url: String,
    /// Local listening address.
    pub bind: SocketAddr,
    /// Stable authentication signing secret. Never log this field.
    pub auth_secret: String,
    /// Public service URL.
    pub auth_url: String,
    /// Exact allowed authentication origins.
    pub trusted_origins: Vec<String>,
    /// Exact browser origins allowed to read responses.
    pub cors_origins: Vec<String>,
    /// Whether production restrictions apply.
    pub production: bool,
    /// `tracing` filter directives.
    pub log_filter: String,
    /// Where the client address of a session comes from.
    pub client_ip: ClientIp,
    /// Authentication mail delivery.
    pub mail: MailTransport,
    /// Sign in with Apple settings. `None` when no `APPLE_*` variable is set.
    pub apple: Option<AppleSignIn>,
    /// Apple Wallet pass signing. `None` when no `WALLET_*` variable is set.
    pub wallet: Option<PassSigner>,
    /// Rule for a social sign-in whose email already belongs to a user.
    pub account_linking: AccountLinking,
    /// The key of the organization email and code digests. `None` when
    /// `AFFILIATION_EMAIL_HMAC_KEY` is unset, which turns affiliation off.
    /// Never log this field.
    pub affiliation_email_key: Option<AffiliationEmailKey>,
}

impl Config {
    /// Load configuration from the process environment, rejecting unsafe values.
    pub fn load() -> Result<Self> {
        Self::from_provider(Environment::process()?)
    }

    /// Load configuration from `provider`, rejecting unsafe values.
    pub fn from_provider(provider: impl Provider) -> Result<Self> {
        let settings: Settings = Figment::from(provider)
            .extract_lossy()
            .map_err(|error| anyhow!(source::describe(error)))?;
        Self::from_settings(settings)
    }

    fn from_settings(settings: Settings) -> Result<Self> {
        let production = match settings.app_env.as_deref().unwrap_or("development") {
            "production" => true,
            "development" | "test" => false,
            _ => bail!("APP_ENV must be development, test or production"),
        };
        let database_url = settings.database_url.context("DATABASE_URL is required")?;
        let parsed = Url::parse(&database_url)
            .map_err(|_| anyhow!("DATABASE_URL must be a PostgreSQL URL"))?;
        if !matches!(parsed.scheme(), "postgres" | "postgresql") {
            bail!("DATABASE_URL must use PostgreSQL");
        }
        let auth_secret = settings
            .better_auth_secret
            .context("BETTER_AUTH_SECRET is required")?;
        if auth_secret.len() < 32 {
            bail!("BETTER_AUTH_SECRET must contain at least 32 bytes");
        }
        let auth_url = match settings.better_auth_url {
            Some(url) => url,
            None if production => bail!("BETTER_AUTH_URL is required in production"),
            None => "http://localhost:3000".into(),
        };
        let auth_origin = validate_origin(&auth_url, production)?;
        let cors_origins = origins(settings.cors_origins.as_deref(), production)?;
        let mut trusted_origins = origins(settings.trusted_origins.as_deref(), production)?;
        trusted_origins.push(auth_origin);
        trusted_origins.extend(cors_origins.iter().cloned());
        trusted_origins.sort();
        trusted_origins.dedup();
        let host: IpAddr = settings
            .host
            .as_deref()
            .unwrap_or("127.0.0.1")
            .parse()
            .context("HOST must be an IP address")?;
        let port = settings.port.unwrap_or(3000);
        if port == 0 {
            bail!("PORT must not be zero");
        }
        let log_filter = settings
            .rust_log
            .unwrap_or_else(|| DEFAULT_LOG_FILTER.to_owned());
        tracing_subscriber::EnvFilter::try_new(&log_filter)
            .map_err(|_| anyhow!("RUST_LOG must contain tracing filter directives"))?;
        let affiliation_email_key =
            affiliation_email_key(settings.affiliation_email_hmac_key, &auth_secret)?;
        Ok(Self {
            database_url,
            bind: SocketAddr::new(host, port),
            auth_secret,
            auth_url,
            trusted_origins,
            cors_origins,
            production,
            log_filter,
            client_ip: client_ip(settings.client_ip_header, settings.trusted_proxies)?,
            mail: mail(settings.mail, settings.smtp, production)?,
            apple: apple(settings.apple)?,
            wallet: wallet(settings.wallet)?,
            account_linking: account_linking(settings.account_linking.as_deref())?,
            affiliation_email_key,
        })
    }
}

/// Parse `AFFILIATION_EMAIL_HMAC_KEY`. An unset value turns affiliation
/// off.
///
/// The key must differ from `BETTER_AUTH_SECRET`, so that rotating one secret
/// never changes the other. Changing this key later makes every stored
/// address hash unusable, so users must verify again.
fn affiliation_email_key(
    value: Option<String>,
    auth_secret: &str,
) -> Result<Option<AffiliationEmailKey>> {
    let Some(value) = value else {
        return Ok(None);
    };
    if value == auth_secret {
        bail!("AFFILIATION_EMAIL_HMAC_KEY must differ from BETTER_AUTH_SECRET");
    }
    AffiliationEmailKey::new(value.into_bytes())
        .map(Some)
        .map_err(|_| anyhow!("AFFILIATION_EMAIL_HMAC_KEY must contain at least 32 bytes"))
}

/// Parse `ACCOUNT_LINKING`. An unset value keeps linking disabled.
fn account_linking(value: Option<&str>) -> Result<AccountLinking> {
    match value.map(str::trim).unwrap_or_default() {
        "" | "disabled" => Ok(AccountLinking::Disabled),
        "enabled" => Ok(AccountLinking::Enabled),
        _ => bail!("ACCOUNT_LINKING must be disabled or enabled"),
    }
}

/// Parse `CLIENT_IP_HEADER` and `TRUSTED_PROXIES`.
///
/// Without a header the service stores no client address. Only the gateway in
/// front of the service may set the header, so it must overwrite client values.
fn client_ip(header: Option<String>, proxies: Option<String>) -> Result<ClientIp> {
    let Some(header) = header else {
        if proxies.is_some() {
            bail!("TRUSTED_PROXIES requires CLIENT_IP_HEADER");
        }
        return Ok(ClientIp::Untracked);
    };
    let header = http::HeaderName::from_bytes(header.trim().as_bytes())
        .map_err(|_| anyhow!("CLIENT_IP_HEADER must be an HTTP header name"))?;
    let trusted_proxies = list(proxies.as_deref())
        .map(|value| {
            proxy(value)
                .then(|| value.to_owned())
                .ok_or_else(|| anyhow!("TRUSTED_PROXIES must list IP addresses or CIDR ranges"))
        })
        .collect::<Result<_>>()?;
    Ok(ClientIp::Header {
        header: header.as_str().to_owned(),
        trusted_proxies,
    })
}

/// Whether `value` is an IP address or a CIDR range.
fn proxy(value: &str) -> bool {
    let Some((address, prefix)) = value.split_once('/') else {
        return value.parse::<IpAddr>().is_ok();
    };
    let limit = match address.parse::<IpAddr>() {
        Ok(IpAddr::V4(_)) => 32,
        Ok(IpAddr::V6(_)) => 128,
        Err(_) => return false,
    };
    prefix.parse::<u8>().is_ok_and(|prefix| prefix <= limit)
}

/// Choose the mail transport.
///
/// Without `SMTP_HOST`, development writes mail files and production stops.
fn mail(mail: MailSettings, smtp: SmtpSettings, production: bool) -> Result<MailTransport> {
    let Some(host) = smtp.host else {
        if smtp.port.is_some()
            || smtp.tls.is_some()
            || smtp.username.is_some()
            || smtp.password.is_some()
        {
            bail!("SMTP_PORT, SMTP_TLS, SMTP_USERNAME and SMTP_PASSWORD require SMTP_HOST");
        }
        if production {
            bail!("Production requires SMTP_HOST and MAIL_FROM");
        }
        let directory = PathBuf::from(mail.output_dir.as_deref().unwrap_or(".data/mail"));
        let directory = if directory.is_absolute() {
            directory
        } else {
            std::env::current_dir()
                .context("Cannot resolve MAIL_OUTPUT_DIR")?
                .join(directory)
        };
        return Ok(MailTransport::Files { directory });
    };
    let from = mail.from.context("SMTP_HOST requires MAIL_FROM")?;
    let from = from
        .trim()
        .parse()
        .map_err(|_| anyhow!("MAIL_FROM must be an address such as 薄肌 <no-reply@example.com>"))?;
    let security = match smtp.tls.as_deref().map(str::trim) {
        None => SmtpSecurity::StartTls,
        Some(value) => {
            SmtpSecurity::parse(value).context("SMTP_TLS must be tls, starttls or none")?
        }
    };
    if production && security == SmtpSecurity::None {
        bail!("Production requires SMTP_TLS to be tls or starttls");
    }
    let port = smtp.port.unwrap_or_else(|| security.default_port());
    if port == 0 {
        bail!("SMTP_PORT must not be zero");
    }
    let credentials = match (smtp.username, smtp.password) {
        (Some(username), Some(password)) => Some(SmtpCredentials { username, password }),
        (None, None) => None,
        _ => bail!("SMTP_USERNAME and SMTP_PASSWORD must be set together"),
    };
    Ok(MailTransport::Smtp(SmtpRelay {
        host: host.trim().to_owned(),
        port,
        security,
        credentials,
        from,
    }))
}

/// Return the names of the variables in `values` that are unset.
fn missing<const N: usize>(values: [(&'static str, bool); N]) -> Vec<&'static str> {
    values
        .into_iter()
        .filter(|(_, present)| !present)
        .map(|(name, _)| name)
        .collect()
}

/// Check the Apple settings.
///
/// `APPLE_PRIVATE_KEY` may encode line breaks as `\n` so it fits on one line.
/// The key is checked with a trial signature, so a bad key stops startup.
fn apple(settings: AppleSettings) -> Result<Option<AppleSignIn>> {
    let AppleSettings {
        client_id,
        app_bundle_identifier,
        team_id,
        key_id,
        private_key,
    } = settings;
    let missing = missing([
        ("APPLE_CLIENT_ID", client_id.is_some()),
        (
            "APPLE_APP_BUNDLE_IDENTIFIER",
            app_bundle_identifier.is_some(),
        ),
        ("APPLE_TEAM_ID", team_id.is_some()),
        ("APPLE_KEY_ID", key_id.is_some()),
        ("APPLE_PRIVATE_KEY", private_key.is_some()),
    ]);
    if missing.len() == 5 {
        return Ok(None);
    }
    let (
        Some(services_id),
        Some(app_bundle_identifier),
        Some(team_id),
        Some(key_id),
        Some(private_key),
    ) = (
        client_id,
        app_bundle_identifier,
        team_id,
        key_id,
        private_key,
    )
    else {
        bail!(
            "Sign in with Apple requires every APPLE_* variable; missing {}",
            missing.join(", ")
        );
    };
    let private_key = private_key.trim().replace("\\n", "\n");
    let client_secret_signer =
        AppleClientSecretSigner::new(team_id.trim(), key_id.trim(), private_key.as_bytes())
            .map_err(|error| {
                anyhow!("APPLE_TEAM_ID, APPLE_KEY_ID or APPLE_PRIVATE_KEY is invalid: {error}")
            })?;
    Ok(Some(AppleSignIn {
        services_id: services_id.trim().to_owned(),
        app_bundle_identifier: app_bundle_identifier.trim().to_owned(),
        client_secret_signer,
    }))
}

/// Check the Wallet settings and the certificate chain.
fn wallet(settings: WalletSettings) -> Result<Option<PassSigner>> {
    let WalletSettings {
        pass_type_identifier,
        team_identifier,
        organization_name,
        signer_cert,
        signer_key,
        signer_key_passphrase,
        wwdr_cert,
    } = settings;
    let missing = missing([
        (
            "WALLET_PASS_TYPE_IDENTIFIER",
            pass_type_identifier.is_some(),
        ),
        ("WALLET_TEAM_IDENTIFIER", team_identifier.is_some()),
        ("WALLET_ORGANIZATION_NAME", organization_name.is_some()),
        ("WALLET_SIGNER_CERT", signer_cert.is_some()),
        ("WALLET_SIGNER_KEY", signer_key.is_some()),
        ("WALLET_WWDR_CERT", wwdr_cert.is_some()),
    ]);
    if missing.len() == 6 && signer_key_passphrase.is_none() {
        return Ok(None);
    }
    let (
        Some(pass_type_identifier),
        Some(team_identifier),
        Some(organization_name),
        Some(signer_cert),
        Some(signer_key),
        Some(wwdr_cert),
    ) = (
        pass_type_identifier,
        team_identifier,
        organization_name,
        signer_cert,
        signer_key,
        wwdr_cert,
    )
    else {
        bail!(
            "Apple Wallet requires every WALLET_* variable except \
             WALLET_SIGNER_KEY_PASSPHRASE; missing {}",
            missing.join(", ")
        );
    };
    let signer = PassSigner::new(WalletCredentials {
        pass_type_identifier: pass_type_identifier.trim().to_owned(),
        team_identifier: team_identifier.trim().to_owned(),
        organization_name: organization_name.trim().to_owned(),
        signer_cert,
        signer_key,
        signer_key_passphrase,
        wwdr_cert,
    })?;
    Ok(Some(signer))
}

/// Split a comma-separated list and drop empty items.
fn list(value: Option<&str>) -> impl Iterator<Item = &str> {
    value
        .unwrap_or_default()
        .split(',')
        .map(str::trim)
        .filter(|value| !value.is_empty())
}

fn origins(value: Option<&str>, production: bool) -> Result<Vec<String>> {
    list(value)
        .map(|value| validate_origin(value, production))
        .collect()
}

fn validate_origin(value: &str, production: bool) -> Result<String> {
    let url = Url::parse(value).map_err(|_| anyhow!("Origin must be an absolute HTTP(S) URL"))?;
    if !matches!(url.scheme(), "http" | "https")
        || url.host_str().is_none()
        || !url.username().is_empty()
        || url.password().is_some()
        || url.path() != "/"
        || url.query().is_some()
        || url.fragment().is_some()
        || value.contains('*')
    {
        bail!("Origins must not contain credentials, paths, queries, fragments or wildcards");
    }
    if production && url.scheme() != "https" {
        bail!("Production origins must use HTTPS");
    }
    Ok(url.origin().ascii_serialization())
}

#[cfg(test)]
mod tests {
    use super::*;
    use p256::pkcs8::{EncodePrivateKey, LineEnding};
    use std::collections::HashMap;

    const BASE: [(&str, &str); 2] = [
        ("DATABASE_URL", "postgres://localhost/boji"),
        ("BETTER_AUTH_SECRET", "0123456789abcdef0123456789abcdef"),
    ];

    fn load(values: &[(&str, &str)]) -> Result<Config> {
        let values: HashMap<&str, &str> = BASE.iter().chain(values).copied().collect();
        Config::from_provider(Environment::from_lookup(|name| {
            values.get(name).map(|value| (*value).to_owned())
        }))
    }

    fn error(values: &[(&str, &str)]) -> String {
        load(values).err().unwrap().to_string()
    }

    /// A fixed P-256 test key in single-line form, as a `.env` file stores it.
    fn escaped_test_key() -> String {
        let key = p256::SecretKey::from_slice(&[7; 32]).unwrap();
        key.to_pkcs8_pem(LineEnding::LF)
            .unwrap()
            .trim_end()
            .replace('\n', "\\n")
    }

    #[test]
    fn defaults_suit_local_development() {
        let config = load(&[]).unwrap();
        assert!(!config.production);
        assert_eq!(config.bind.to_string(), "127.0.0.1:3000");
        assert_eq!(config.auth_url, "http://localhost:3000");
        assert_eq!(config.log_filter, DEFAULT_LOG_FILTER);
        assert_eq!(config.client_ip, ClientIp::Untracked);
        assert!(config.apple.is_none() && config.wallet.is_none());
        let MailTransport::Files { directory } = config.mail else {
            panic!("development without SMTP_HOST must write mail files");
        };
        assert!(directory.is_absolute() && directory.ends_with(".data/mail"));
    }

    #[test]
    fn numbers_come_from_strings_and_bad_numbers_name_the_variable() {
        assert_eq!(load(&[("PORT", "8080")]).unwrap().bind.port(), 8080);
        assert_eq!(
            error(&[("PORT", "eighty")]),
            "PORT has an invalid value: expected u16"
        );
        assert_eq!(error(&[("PORT", "0")]), "PORT must not be zero");
        assert_eq!(
            error(&[("RUST_LOG", "boji=nonsense=1")]),
            "RUST_LOG must contain tracing filter directives"
        );
    }

    #[test]
    fn production_requires_a_public_url_and_smtp() {
        let production = [("APP_ENV", "production")];
        assert_eq!(
            error(&production),
            "BETTER_AUTH_URL is required in production"
        );
        let url = [
            ("APP_ENV", "production"),
            ("BETTER_AUTH_URL", "https://api.example.com"),
        ];
        assert_eq!(error(&url), "Production requires SMTP_HOST and MAIL_FROM");
        let cleartext = [
            ("APP_ENV", "production"),
            ("BETTER_AUTH_URL", "https://api.example.com"),
            ("SMTP_HOST", "smtp.example.com"),
            ("MAIL_FROM", "薄肌 <no-reply@example.com>"),
            ("SMTP_TLS", "none"),
        ];
        assert_eq!(
            error(&cleartext),
            "Production requires SMTP_TLS to be tls or starttls"
        );
        let config = load(&cleartext[..4]).unwrap();
        assert!(config.production);
        let MailTransport::Smtp(relay) = config.mail else {
            panic!("production must use SMTP");
        };
        assert_eq!(relay.security, SmtpSecurity::StartTls);
        assert_eq!(relay.port, 587);
        assert!(relay.credentials.is_none());
        assert_eq!(relay.from.to_string(), "薄肌 <no-reply@example.com>");
    }

    #[test]
    fn smtp_settings_are_checked_together() {
        assert_eq!(
            error(&[("SMTP_PORT", "2525")]),
            "SMTP_PORT, SMTP_TLS, SMTP_USERNAME and SMTP_PASSWORD require SMTP_HOST"
        );
        assert_eq!(
            error(&[("SMTP_HOST", "smtp.example.com")]),
            "SMTP_HOST requires MAIL_FROM"
        );
        let relay = [
            ("SMTP_HOST", "smtp.example.com"),
            ("MAIL_FROM", "no-reply@example.com"),
        ];
        assert_eq!(
            error(&[relay[0], relay[1], ("SMTP_USERNAME", "boji")]),
            "SMTP_USERNAME and SMTP_PASSWORD must be set together"
        );
        assert_eq!(
            error(&[relay[0], relay[1], ("SMTP_TLS", "ssl")]),
            "SMTP_TLS must be tls, starttls or none"
        );
        assert_eq!(
            error(&[relay[0], ("MAIL_FROM", "Boji")]),
            "MAIL_FROM must be an address such as 薄肌 <no-reply@example.com>"
        );
        let config = load(&[
            relay[0],
            relay[1],
            ("SMTP_TLS", "tls"),
            ("SMTP_USERNAME", "0123"),
            ("SMTP_PASSWORD", "secret value"),
        ])
        .unwrap();
        let MailTransport::Smtp(relay) = config.mail else {
            panic!("SMTP_HOST must select SMTP");
        };
        assert_eq!((relay.security, relay.port), (SmtpSecurity::Tls, 465));
        let credentials = relay.credentials.unwrap();
        assert_eq!(credentials.username, "0123");
        assert!(!format!("{credentials:?}").contains("secret value"));
    }

    #[test]
    fn client_ip_tracking_needs_an_explicit_header() {
        assert_eq!(
            error(&[("TRUSTED_PROXIES", "10.0.0.0/8")]),
            "TRUSTED_PROXIES requires CLIENT_IP_HEADER"
        );
        assert_eq!(
            error(&[("CLIENT_IP_HEADER", "bad header")]),
            "CLIENT_IP_HEADER must be an HTTP header name"
        );
        for proxies in ["10.0.0.0/33", "gateway", "::1/129"] {
            assert_eq!(
                error(&[
                    ("CLIENT_IP_HEADER", "x-forwarded-for"),
                    ("TRUSTED_PROXIES", proxies)
                ]),
                "TRUSTED_PROXIES must list IP addresses or CIDR ranges"
            );
        }
        let config = load(&[
            ("CLIENT_IP_HEADER", "CF-Connecting-IP"),
            ("TRUSTED_PROXIES", "10.0.0.0/8, 2001:db8::/32 ,192.0.2.1"),
        ])
        .unwrap();
        assert_eq!(
            config.client_ip,
            ClientIp::Header {
                header: "cf-connecting-ip".to_owned(),
                trusted_proxies: vec![
                    "10.0.0.0/8".to_owned(),
                    "2001:db8::/32".to_owned(),
                    "192.0.2.1".to_owned()
                ],
            }
        );
    }

    #[test]
    fn apple_settings_are_all_or_nothing() {
        assert!(load(&[("APPLE_CLIENT_ID", "  ")]).unwrap().apple.is_none());
        assert_eq!(
            error(&[
                ("APPLE_CLIENT_ID", "club.example.web"),
                ("APPLE_KEY_ID", "KEY")
            ]),
            "Sign in with Apple requires every APPLE_* variable; missing \
             APPLE_APP_BUNDLE_IDENTIFIER, APPLE_TEAM_ID, APPLE_PRIVATE_KEY"
        );
    }

    #[test]
    fn apple_settings_accept_an_escaped_private_key() {
        let key = escaped_test_key();
        let settings = load(&[
            ("APPLE_CLIENT_ID", "club.example.web"),
            ("APPLE_APP_BUNDLE_IDENTIFIER", "club.example"),
            ("APPLE_TEAM_ID", "TEAM123456"),
            ("APPLE_KEY_ID", "KEY1234567"),
            ("APPLE_PRIVATE_KEY", &key),
        ])
        .unwrap()
        .apple
        .unwrap();
        assert_eq!(settings.services_id, "club.example.web");
        assert_eq!(settings.app_bundle_identifier, "club.example");
        let secret = settings
            .client_secret_signer
            .client_secret("club.example.web")
            .unwrap();
        assert_eq!(secret.split('.').count(), 3);
        let debug = format!("{settings:?}");
        assert!(debug.contains("TEAM123456") && !debug.contains("PRIVATE KEY"));
    }

    #[test]
    fn apple_settings_reject_an_unusable_private_key() {
        assert_eq!(
            error(&[
                ("APPLE_CLIENT_ID", "club.example.web"),
                ("APPLE_APP_BUNDLE_IDENTIFIER", "club.example"),
                ("APPLE_TEAM_ID", "TEAM123456"),
                ("APPLE_KEY_ID", "KEY1234567"),
                (
                    "APPLE_PRIVATE_KEY",
                    "-----BEGIN PRIVATE KEY-----\\nAAAA\\n-----END PRIVATE KEY-----",
                ),
            ]),
            "APPLE_TEAM_ID, APPLE_KEY_ID or APPLE_PRIVATE_KEY is invalid: \
             Apple private key must be a PKCS #8 PEM key for ES256"
        );
    }

    #[test]
    fn wallet_settings_are_all_or_nothing() {
        assert_eq!(
            error(&[("WALLET_SIGNER_KEY_PASSPHRASE", "x")]),
            "Apple Wallet requires every WALLET_* variable except \
             WALLET_SIGNER_KEY_PASSPHRASE; missing WALLET_PASS_TYPE_IDENTIFIER, \
             WALLET_TEAM_IDENTIFIER, WALLET_ORGANIZATION_NAME, WALLET_SIGNER_CERT, \
             WALLET_SIGNER_KEY, WALLET_WWDR_CERT"
        );
        assert_eq!(
            error(&[
                ("WALLET_PASS_TYPE_IDENTIFIER", "pass.club.example"),
                ("WALLET_TEAM_IDENTIFIER", "TEAM123456"),
                ("WALLET_ORGANIZATION_NAME", "Boji"),
                ("WALLET_SIGNER_CERT", "not a certificate"),
                ("WALLET_SIGNER_KEY", "not a key"),
                ("WALLET_WWDR_CERT", "not a certificate"),
            ]),
            "WALLET_SIGNER_CERT must be a PEM certificate"
        );
    }

    #[test]
    fn account_linking_defaults_to_disabled_and_rejects_unknown_values() {
        for value in [None, Some(""), Some(" disabled ")] {
            assert_eq!(account_linking(value).unwrap(), AccountLinking::Disabled);
        }
        assert_eq!(
            account_linking(Some("enabled")).unwrap(),
            AccountLinking::Enabled
        );
        for value in ["true", "Enabled", "on"] {
            assert_eq!(
                account_linking(Some(value)).err().unwrap().to_string(),
                "ACCOUNT_LINKING must be disabled or enabled"
            );
        }
    }

    #[test]
    fn the_affiliation_email_key_is_optional_long_and_separate() {
        assert!(load(&[]).unwrap().affiliation_email_key.is_none());
        assert!(
            load(&[(
                "AFFILIATION_EMAIL_HMAC_KEY",
                "fedcba9876543210fedcba9876543210"
            )])
            .unwrap()
            .affiliation_email_key
            .is_some()
        );
        assert_eq!(
            error(&[("AFFILIATION_EMAIL_HMAC_KEY", "short")]),
            "AFFILIATION_EMAIL_HMAC_KEY must contain at least 32 bytes"
        );
        assert_eq!(
            error(&[(
                "AFFILIATION_EMAIL_HMAC_KEY",
                "0123456789abcdef0123456789abcdef"
            )]),
            "AFFILIATION_EMAIL_HMAC_KEY must differ from BETTER_AUTH_SECRET"
        );
    }

    #[test]
    fn origins_reject_wildcards_paths_and_cleartext_production() {
        for value in [
            "*",
            "https://*.example.com",
            "https://example.com/private",
            "https://x:y@example.com",
            "https://example.com?x=1",
        ] {
            assert!(validate_origin(value, false).is_err());
        }
        assert!(validate_origin("http://example.com", true).is_err());
        assert_eq!(
            validate_origin("https://example.com", true).unwrap(),
            "https://example.com"
        );
    }
}
