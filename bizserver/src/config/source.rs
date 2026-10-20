//! Configuration sources and the raw shape of the configuration.
//!
//! Input: environment variables, read through the table [`VARIABLES`].
//! Output: a figment [`Provider`] and the raw [`Settings`] it deserializes to.
//! Pos: the only code that names environment variables. Validation lives in
//! the parent module.

use figment::{
    Error, Metadata, Profile, Provider,
    error::Kind,
    value::{Dict, Map, Value},
};
use serde::Deserialize;

/// Every environment variable of the service and its figment key path.
///
/// A key path with a `.` places the value in a group, for example
/// `APPLE_TEAM_ID` becomes `apple.team_id`. The process ignores variables
/// that are not in this table.
pub const VARIABLES: [(&str, &str); 31] = [
    ("APP_ENV", "app_env"),
    ("HOST", "host"),
    ("PORT", "port"),
    ("DATABASE_URL", "database_url"),
    ("BETTER_AUTH_SECRET", "better_auth_secret"),
    ("BETTER_AUTH_URL", "better_auth_url"),
    ("CORS_ORIGINS", "cors_origins"),
    ("TRUSTED_ORIGINS", "trusted_origins"),
    ("ACCOUNT_LINKING", "account_linking"),
    ("RUST_LOG", "rust_log"),
    ("CLIENT_IP_HEADER", "client_ip_header"),
    ("TRUSTED_PROXIES", "trusted_proxies"),
    ("MAIL_FROM", "mail.from"),
    ("MAIL_OUTPUT_DIR", "mail.output_dir"),
    ("SMTP_HOST", "smtp.host"),
    ("SMTP_PORT", "smtp.port"),
    ("SMTP_TLS", "smtp.tls"),
    ("SMTP_USERNAME", "smtp.username"),
    ("SMTP_PASSWORD", "smtp.password"),
    ("APPLE_CLIENT_ID", "apple.client_id"),
    ("APPLE_APP_BUNDLE_IDENTIFIER", "apple.app_bundle_identifier"),
    ("APPLE_TEAM_ID", "apple.team_id"),
    ("APPLE_KEY_ID", "apple.key_id"),
    ("APPLE_PRIVATE_KEY", "apple.private_key"),
    ("WALLET_PASS_TYPE_IDENTIFIER", "wallet.pass_type_identifier"),
    ("WALLET_TEAM_IDENTIFIER", "wallet.team_identifier"),
    ("WALLET_ORGANIZATION_NAME", "wallet.organization_name"),
    ("WALLET_SIGNER_CERT", "wallet.signer_cert"),
    ("WALLET_SIGNER_KEY", "wallet.signer_key"),
    (
        "WALLET_SIGNER_KEY_PASSPHRASE",
        "wallet.signer_key_passphrase",
    ),
    ("WALLET_WWDR_CERT", "wallet.wwdr_cert"),
];

/// Return the environment variable for a figment key path.
pub fn variable(key_path: &str) -> Option<&'static str> {
    VARIABLES
        .iter()
        .find(|(_, path)| *path == key_path)
        .map(|(name, _)| *name)
}

/// Describe an extraction error by variable name, without the rejected value.
pub fn describe(error: Error) -> String {
    let name = variable(&error.path.join(".")).unwrap_or("A configuration variable");
    match &error.kind {
        Kind::InvalidType(_, expected) | Kind::InvalidValue(_, expected) => {
            format!("{name} has an invalid value: expected {expected}")
        }
        _ => format!("{name} has an invalid value"),
    }
}

/// A figment provider over the variables in [`VARIABLES`].
///
/// Values stay strings. [`figment::Figment::extract_lossy`] converts a value
/// only when the target field is a number or a boolean, so `0123` stays a
/// string where a string is expected. An empty or blank value counts as unset,
/// because `.env.example` lists optional variables with empty values.
pub struct Environment {
    values: Vec<(&'static str, String)>,
}

impl Environment {
    /// Read the variables of the current process.
    ///
    /// A listed variable that is not valid UTF-8 is an error. The error names
    /// the variable and omits the value.
    pub fn process() -> Result<Self, NotUnicode> {
        for (name, _) in VARIABLES {
            if let Err(std::env::VarError::NotUnicode(_)) = std::env::var(name) {
                return Err(NotUnicode(name));
            }
        }
        Ok(Self::from_lookup(|name| std::env::var(name).ok()))
    }

    /// Read the variables through `lookup`, which returns a variable's value.
    pub fn from_lookup(lookup: impl Fn(&str) -> Option<String>) -> Self {
        let values = VARIABLES
            .iter()
            .filter_map(|(name, path)| Some((*path, lookup(name)?)))
            .filter(|(_, value)| !value.trim().is_empty())
            .collect();
        Self { values }
    }
}

/// A listed environment variable is not valid UTF-8.
#[derive(Debug, thiserror::Error)]
#[error("{0} must be valid UTF-8")]
pub struct NotUnicode(&'static str);

impl Provider for Environment {
    fn metadata(&self) -> Metadata {
        // Errors name the variable, for example `PORT`, not the key `port`.
        Metadata::named("environment variable").interpolater(|_: &Profile, keys: &[&str]| {
            let path = keys.join(".");
            variable(&path).map_or(path, str::to_owned)
        })
    }

    fn data(&self) -> Result<Map<Profile, Dict>, Error> {
        let mut root = Dict::new();
        for (path, value) in &self.values {
            let value = Value::from(value.clone());
            match path.split_once('.') {
                Some((group, key)) => {
                    let entry = root
                        .entry(group.to_owned())
                        .or_insert_with(|| Value::from(Dict::new()));
                    if let Value::Dict(_, dict) = entry {
                        let _ = dict.insert(key.to_owned(), value);
                    }
                }
                None => {
                    let _ = root.insert((*path).to_owned(), value);
                }
            }
        }
        Ok(Profile::Default.collect(root))
    }
}

/// The raw configuration before validation.
///
/// Every field is optional, so the parent module can report missing values
/// with the variable name. This type has no `Debug`, because it holds secrets.
#[derive(Default, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct Settings {
    pub app_env: Option<String>,
    pub host: Option<String>,
    pub port: Option<u16>,
    pub database_url: Option<String>,
    pub better_auth_secret: Option<String>,
    pub better_auth_url: Option<String>,
    pub cors_origins: Option<String>,
    pub trusted_origins: Option<String>,
    pub account_linking: Option<String>,
    pub rust_log: Option<String>,
    pub client_ip_header: Option<String>,
    pub trusted_proxies: Option<String>,
    pub mail: MailSettings,
    pub smtp: SmtpSettings,
    pub apple: AppleSettings,
    pub wallet: WalletSettings,
}

/// `MAIL_*` variables.
#[derive(Default, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct MailSettings {
    pub from: Option<String>,
    pub output_dir: Option<String>,
}

/// `SMTP_*` variables.
#[derive(Default, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct SmtpSettings {
    pub host: Option<String>,
    pub port: Option<u16>,
    pub tls: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
}

/// `APPLE_*` variables.
#[derive(Default, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct AppleSettings {
    pub client_id: Option<String>,
    pub app_bundle_identifier: Option<String>,
    pub team_id: Option<String>,
    pub key_id: Option<String>,
    pub private_key: Option<String>,
}

/// `WALLET_*` variables.
#[derive(Default, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct WalletSettings {
    pub pass_type_identifier: Option<String>,
    pub team_identifier: Option<String>,
    pub organization_name: Option<String>,
    pub signer_cert: Option<String>,
    pub signer_key: Option<String>,
    pub signer_key_passphrase: Option<String>,
    pub wwdr_cert: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use figment::Figment;
    use std::collections::{BTreeSet, HashMap};

    /// Extract the settings, or return the message that [`describe`] makes.
    fn extract(values: &[(&str, &str)]) -> Result<Settings, String> {
        let values: HashMap<&str, &str> = values.iter().copied().collect();
        Figment::from(Environment::from_lookup(|name| {
            values.get(name).map(|value| (*value).to_owned())
        }))
        .extract_lossy()
        .map_err(describe)
    }

    #[test]
    fn variables_and_key_paths_are_unique() {
        let names: BTreeSet<_> = VARIABLES.iter().map(|(name, _)| name).collect();
        let paths: BTreeSet<_> = VARIABLES.iter().map(|(_, path)| path).collect();
        assert_eq!(names.len(), VARIABLES.len());
        assert_eq!(paths.len(), VARIABLES.len());
    }

    #[test]
    fn every_key_path_deserializes() {
        let values: Vec<(&str, &str)> = VARIABLES
            .iter()
            .map(|(name, path)| (*name, if path.ends_with("port") { "25" } else { "x" }))
            .collect();
        let settings = extract(&values).unwrap();
        assert_eq!(settings.port, Some(25));
        assert_eq!(settings.smtp.port, Some(25));
        assert_eq!(settings.wallet.wwdr_cert.as_deref(), Some("x"));
        assert_eq!(settings.apple.private_key.as_deref(), Some("x"));
        assert_eq!(settings.mail.output_dir.as_deref(), Some("x"));
    }

    #[test]
    fn blank_values_are_unset_and_strings_keep_leading_zeros() {
        let settings = extract(&[("HOST", "  "), ("SMTP_USERNAME", "0123")]).unwrap();
        assert!(settings.host.is_none());
        assert_eq!(settings.smtp.username.as_deref(), Some("0123"));
    }

    #[test]
    fn errors_name_the_environment_variable() {
        let error = extract(&[("SMTP_PORT", "abc")]).err().unwrap();
        assert_eq!(error, "SMTP_PORT has an invalid value: expected u16");
    }
}
