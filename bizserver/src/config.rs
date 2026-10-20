//! Validated process configuration without secret-bearing Debug output.

use crate::apple::AppleSignIn;
use crate::auth::AccountLinking;
use anyhow::{Context, Result, bail};
use better_auth::plugins::oauth::AppleClientSecretSigner;
use std::{
    env,
    net::{IpAddr, SocketAddr},
    path::PathBuf,
};
use url::Url;

/// Sign in with Apple variables. Set all of them or none of them.
const APPLE_VARIABLES: [&str; 5] = [
    "APPLE_CLIENT_ID",
    "APPLE_APP_BUNDLE_IDENTIFIER",
    "APPLE_TEAM_ID",
    "APPLE_KEY_ID",
    "APPLE_PRIVATE_KEY",
];

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
    /// Local development email destination.
    pub mail_dir: PathBuf,
    /// Sign in with Apple settings. `None` when no `APPLE_*` variable is set.
    pub apple: Option<AppleSignIn>,
    /// Rule for a social sign-in whose email already belongs to a user.
    pub account_linking: AccountLinking,
}

impl Config {
    /// Load configuration from environment variables, rejecting unsafe values.
    pub fn from_env() -> Result<Self> {
        let production = match env::var("APP_ENV").as_deref().unwrap_or("development") {
            "production" => true,
            "development" | "test" => false,
            _ => bail!("APP_ENV must be development, test or production"),
        };
        let database_url = env::var("DATABASE_URL").context("DATABASE_URL is required")?;
        let parsed = Url::parse(&database_url)
            .map_err(|_| anyhow::anyhow!("DATABASE_URL must be a PostgreSQL URL"))?;
        if !matches!(parsed.scheme(), "postgres" | "postgresql") {
            bail!("DATABASE_URL must use PostgreSQL");
        }
        let auth_secret =
            env::var("BETTER_AUTH_SECRET").context("BETTER_AUTH_SECRET is required")?;
        if auth_secret.len() < 32 {
            bail!("BETTER_AUTH_SECRET must contain at least 32 bytes");
        }
        let auth_url =
            env::var("BETTER_AUTH_URL").unwrap_or_else(|_| "http://localhost:3000".into());
        let auth_origin = validate_origin(&auth_url, production)?;
        let cors_origins = origins(&env::var("CORS_ORIGINS").unwrap_or_default(), production)?;
        let mut trusted_origins =
            origins(&env::var("TRUSTED_ORIGINS").unwrap_or_default(), production)?;
        trusted_origins.push(auth_origin);
        trusted_origins.extend(cors_origins.iter().cloned());
        trusted_origins.sort();
        trusted_origins.dedup();
        let host: IpAddr = env::var("HOST")
            .unwrap_or_else(|_| "127.0.0.1".into())
            .parse()
            .context("HOST must be an IP address")?;
        let mail_dir = env::var("MAIL_OUTPUT_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from(".data/mail"));
        let mail_dir = if mail_dir.is_absolute() {
            mail_dir
        } else {
            env::current_dir()
                .context("Cannot resolve mail directory")?
                .join(mail_dir)
        };
        let port: u16 = env::var("PORT")
            .unwrap_or_else(|_| "3000".into())
            .parse()
            .context("PORT must be a valid TCP port")?;
        if port == 0 {
            bail!("PORT must not be zero");
        }
        let apple = apple(|name| env::var(name).ok())?;
        let account_linking = account_linking(env::var("ACCOUNT_LINKING").ok().as_deref())?;
        Ok(Self {
            database_url,
            bind: SocketAddr::new(host, port),
            auth_secret,
            auth_url,
            trusted_origins,
            cors_origins,
            production,
            mail_dir,
            apple,
            account_linking,
        })
    }
}

/// Parse `ACCOUNT_LINKING`. An unset or empty value keeps linking disabled.
fn account_linking(value: Option<&str>) -> Result<AccountLinking> {
    match value.map(str::trim).unwrap_or_default() {
        "" | "disabled" => Ok(AccountLinking::Disabled),
        "enabled" => Ok(AccountLinking::Enabled),
        _ => bail!("ACCOUNT_LINKING must be disabled or enabled"),
    }
}

/// Read Apple settings through `read`, which returns a variable's value.
///
/// `APPLE_PRIVATE_KEY` may encode line breaks as `\n` so it fits on one line.
/// The key is checked with a trial signature, so a bad key stops startup.
fn apple(read: impl Fn(&str) -> Option<String>) -> Result<Option<AppleSignIn>> {
    let values = APPLE_VARIABLES.map(|name| {
        read(name)
            .map(|value| value.trim().to_owned())
            .filter(|value| !value.is_empty())
    });
    if values.iter().all(Option::is_none) {
        return Ok(None);
    }
    let missing: Vec<&str> = APPLE_VARIABLES
        .iter()
        .zip(&values)
        .filter(|(_, value)| value.is_none())
        .map(|(name, _)| *name)
        .collect();
    if !missing.is_empty() {
        bail!(
            "Sign in with Apple requires every APPLE_* variable; missing {}",
            missing.join(", ")
        );
    }
    let [
        services_id,
        app_bundle_identifier,
        team_id,
        key_id,
        private_key,
    ] = values.map(Option::unwrap_or_default);
    let private_key = private_key.replace("\\n", "\n");
    let client_secret_signer = AppleClientSecretSigner::new(
        &team_id,
        &key_id,
        private_key.as_bytes(),
    )
    .map_err(|error| {
        anyhow::anyhow!("APPLE_TEAM_ID, APPLE_KEY_ID or APPLE_PRIVATE_KEY is invalid: {error}")
    })?;
    Ok(Some(AppleSignIn {
        services_id,
        app_bundle_identifier,
        client_secret_signer,
    }))
}

fn origins(value: &str, production: bool) -> Result<Vec<String>> {
    value
        .split(',')
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(|value| validate_origin(value, production))
        .collect()
}

fn validate_origin(value: &str, production: bool) -> Result<String> {
    let url =
        Url::parse(value).map_err(|_| anyhow::anyhow!("Origin must be an absolute HTTP(S) URL"))?;
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

    fn apple_from(values: &[(&str, &str)]) -> Result<Option<AppleSignIn>> {
        let values: HashMap<&str, &str> = values.iter().copied().collect();
        apple(|name| values.get(name).map(|value| (*value).to_owned()))
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
    fn apple_settings_are_all_or_nothing() {
        assert!(apple_from(&[]).unwrap().is_none());
        assert!(apple_from(&[("APPLE_CLIENT_ID", "  ")]).unwrap().is_none());
        let error = apple_from(&[
            ("APPLE_CLIENT_ID", "club.example.web"),
            ("APPLE_KEY_ID", "KEY"),
        ])
        .err()
        .unwrap()
        .to_string();
        assert_eq!(
            error,
            "Sign in with Apple requires every APPLE_* variable; missing \
             APPLE_APP_BUNDLE_IDENTIFIER, APPLE_TEAM_ID, APPLE_PRIVATE_KEY"
        );
    }

    #[test]
    fn apple_settings_accept_an_escaped_private_key() {
        let key = escaped_test_key();
        let settings = apple_from(&[
            ("APPLE_CLIENT_ID", "club.example.web"),
            ("APPLE_APP_BUNDLE_IDENTIFIER", "club.example"),
            ("APPLE_TEAM_ID", "TEAM123456"),
            ("APPLE_KEY_ID", "KEY1234567"),
            ("APPLE_PRIVATE_KEY", &key),
        ])
        .unwrap()
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
        let error = apple_from(&[
            ("APPLE_CLIENT_ID", "club.example.web"),
            ("APPLE_APP_BUNDLE_IDENTIFIER", "club.example"),
            ("APPLE_TEAM_ID", "TEAM123456"),
            ("APPLE_KEY_ID", "KEY1234567"),
            (
                "APPLE_PRIVATE_KEY",
                "-----BEGIN PRIVATE KEY-----\\nAAAA\\n-----END PRIVATE KEY-----",
            ),
        ])
        .err()
        .unwrap()
        .to_string();
        assert_eq!(
            error,
            "APPLE_TEAM_ID, APPLE_KEY_ID or APPLE_PRIVATE_KEY is invalid: \
             Apple private key must be a PKCS #8 PEM key for ES256"
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
