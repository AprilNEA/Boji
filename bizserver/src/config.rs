//! Validated process configuration without secret-bearing Debug output.

use anyhow::{Context, Result, bail};
use std::{
    env,
    net::{IpAddr, SocketAddr},
    path::PathBuf,
};
use url::Url;

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
        Ok(Self {
            database_url,
            bind: SocketAddr::new(host, port),
            auth_secret,
            auth_url,
            trusted_origins,
            cors_origins,
            production,
            mail_dir,
        })
    }
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
