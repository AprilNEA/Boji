//! Optional Sentry error reporting for the business server.
//!
//! Reporting starts only when `SENTRY_DSN` is set. An event carries the
//! request ID, the HTTP method and a redacted path. It never carries request
//! headers, bodies, query strings, cookies or user identity. Performance
//! tracing stays off: the outer router cannot see route templates, so a
//! transaction name would contain raw paths such as password-reset tokens.

use anyhow::{Context as _, Result, bail};
use axum::http::Method;
use sentry::{
    ClientInitGuard, ClientOptions, Level as SentryLevel,
    integrations::tracing::{self as sentry_tracing, EventMapping, SentryLayer},
    protocol::{Context as SentryContext, Event as SentryEvent, Value},
    types::{Dsn, Scheme},
};
use std::{borrow::Cow, env};
use tracing::{Event, Level, Subscriber};
use tracing_subscriber::{layer::Context, registry::LookupSpan};

/// Text that replaces a redacted path segment.
const REDACTED: &str = "[Filtered]";
/// Path segments whose next segment is a credential.
const SECRET_PARENTS: &[&str] = &["reset-password"];
/// Sentry drops tag values longer than 200 characters.
const MAX_TAG_CHARS: usize = 200;
/// The `sentry-tracing` context that holds the fields of a log event.
const TRACING_FIELDS: &str = "Rust Tracing Fields";

/// Sentry settings read from the environment.
#[derive(Debug, Clone, PartialEq)]
pub struct SentryConfig {
    dsn: Dsn,
    environment: String,
    release: String,
}

impl SentryConfig {
    /// Read `SENTRY_DSN`, `SENTRY_ENVIRONMENT` and `SENTRY_RELEASE`.
    ///
    /// Returns `None` when `SENTRY_DSN` is unset or empty. The environment
    /// defaults to `APP_ENV`, and the release defaults to
    /// `boji-bizserver@<package version>`. A production DSN must use HTTPS.
    pub fn from_env() -> Result<Option<Self>> {
        Self::from_lookup(|name| env::var(name).ok())
    }

    fn from_lookup(read: impl Fn(&str) -> Option<String>) -> Result<Option<Self>> {
        let value = |name: &str| {
            read(name)
                .map(|value| value.trim().to_owned())
                .filter(|value| !value.is_empty())
        };
        let Some(raw_dsn) = value("SENTRY_DSN") else {
            return Ok(None);
        };
        let dsn: Dsn = raw_dsn
            .parse()
            .context("SENTRY_DSN is not a valid Sentry DSN")?;
        let app_env = value("APP_ENV").unwrap_or_else(|| "development".into());
        if app_env == "production" && dsn.scheme() != Scheme::Https {
            bail!("SENTRY_DSN must use https in production");
        }
        Ok(Some(Self {
            dsn,
            environment: value("SENTRY_ENVIRONMENT").unwrap_or(app_env),
            release: value("SENTRY_RELEASE").unwrap_or_else(|| {
                concat!(env!("CARGO_PKG_NAME"), "@", env!("CARGO_PKG_VERSION")).into()
            }),
        }))
    }
}

/// Start the Sentry client and install its panic handler.
///
/// Call this before the async runtime starts. Keep the guard until the
/// process exits, because dropping it flushes queued events.
pub fn init(config: SentryConfig) -> ClientInitGuard {
    sentry::init((
        config.dsn,
        ClientOptions::new()
            .environment(config.environment)
            .release(config.release)
            .send_default_pii(false),
    ))
}

/// Report an error that stops the process.
///
/// Only the outermost error message is sent, as on standard error. Source
/// chains can hold database details and stay local.
pub fn report_exit(error: &anyhow::Error) {
    sentry::capture_message(&error.to_string(), SentryLevel::Fatal);
}

/// Build the tracing layer that forwards server log events to Sentry.
///
/// An `ERROR` event becomes a Sentry event. Its `event` field becomes the
/// title, because server logs carry no message text. `WARN` and `INFO` events
/// become breadcrumbs. Span fields are not attached.
pub fn tracing_layer<S>() -> SentryLayer<S>
where
    S: Subscriber + for<'a> LookupSpan<'a>,
{
    sentry_tracing::layer().event_mapper(map_event::<S>)
}

fn map_event<S>(event: &Event<'_>, _context: Context<'_, S>) -> EventMapping
where
    S: Subscriber + for<'a> LookupSpan<'a>,
{
    let level = *event.metadata().level();
    if level == Level::ERROR {
        let mut report = sentry_tracing::event_from_event::<S>(event, None);
        if report.message.is_none() {
            report.message = event_name(&report);
        }
        EventMapping::Event(Box::new(report))
    } else if level == Level::WARN || level == Level::INFO {
        EventMapping::Breadcrumb(sentry_tracing::breadcrumb_from_event::<S>(event, None))
    } else {
        EventMapping::Ignore
    }
}

fn event_name(report: &SentryEvent<'_>) -> Option<String> {
    let Some(SentryContext::Other(fields)) = report.contexts.get(TRACING_FIELDS) else {
        return None;
    };
    match fields.get("event") {
        Some(Value::String(name)) => Some(name.clone()),
        _ => None,
    }
}

/// Describe the current request on the Sentry scope.
///
/// Call this inside a request future that runs on its own hub, as
/// `sentry::integrations::tower::NewSentryLayer` provides. The scope gets the
/// tags `request_id`, `http.method` and `http.path`, and the transaction name
/// `METHOD path`. The path is redacted and truncated to fit a tag value.
pub fn describe_request(request_id: &str, method: &Method, path: &str) {
    let path = redact_path(path);
    let path = truncate(
        &path,
        MAX_TAG_CHARS.saturating_sub(method.as_str().len() + 1),
    );
    sentry::configure_scope(|scope| {
        scope.set_tag("request_id", request_id);
        scope.set_tag("http.method", method);
        scope.set_tag("http.path", path);
        scope.set_transaction(Some(&format!("{method} {path}")));
    });
}

/// Replace each path segment that follows a segment in [`SECRET_PARENTS`].
fn redact_path(path: &str) -> Cow<'_, str> {
    if !SECRET_PARENTS.iter().any(|parent| path.contains(parent)) {
        return Cow::Borrowed(path);
    }
    let mut redact_next = false;
    let mut segments = Vec::new();
    for segment in path.split('/') {
        if redact_next && !segment.is_empty() {
            segments.push(REDACTED);
            redact_next = false;
        } else {
            segments.push(segment);
            redact_next |= SECRET_PARENTS.contains(&segment);
        }
    }
    Cow::Owned(segments.join("/"))
}

fn truncate(value: &str, max_chars: usize) -> &str {
    match value.char_indices().nth(max_chars) {
        Some((end, _)) => &value[..end],
        None => value,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const DSN: &str = "https://public@o1.ingest.sentry.io/2";

    fn config_from(values: &[(&str, &str)]) -> Result<Option<SentryConfig>> {
        SentryConfig::from_lookup(|name| {
            values
                .iter()
                .find(|(key, _)| *key == name)
                .map(|(_, value)| (*value).to_owned())
        })
    }

    #[test]
    fn sentry_is_off_without_a_dsn() {
        assert_eq!(config_from(&[]).unwrap(), None);
        assert_eq!(config_from(&[("SENTRY_DSN", "  ")]).unwrap(), None);
    }

    #[test]
    fn sentry_settings_default_to_the_app_environment_and_package_release() {
        let config = config_from(&[("SENTRY_DSN", DSN), ("APP_ENV", "test")])
            .unwrap()
            .unwrap();
        assert_eq!(config.environment, "test");
        assert_eq!(
            config.release,
            concat!("boji-bizserver@", env!("CARGO_PKG_VERSION"))
        );

        let config = config_from(&[
            ("SENTRY_DSN", DSN),
            ("SENTRY_ENVIRONMENT", "staging"),
            ("SENTRY_RELEASE", "boji-bizserver@abc123"),
        ])
        .unwrap()
        .unwrap();
        assert_eq!(config.environment, "staging");
        assert_eq!(config.release, "boji-bizserver@abc123");
    }

    #[test]
    fn sentry_settings_reject_invalid_and_cleartext_production_dsns() {
        assert!(config_from(&[("SENTRY_DSN", "not a dsn")]).is_err());
        let cleartext = "http://public@sentry.internal/2";
        assert!(config_from(&[("SENTRY_DSN", cleartext), ("APP_ENV", "production")]).is_err());
        assert!(config_from(&[("SENTRY_DSN", cleartext)]).unwrap().is_some());
    }

    #[test]
    fn redaction_removes_reset_tokens_and_keeps_other_paths() {
        assert_eq!(
            redact_path("/api/auth/reset-password/secret-token"),
            "/api/auth/reset-password/[Filtered]"
        );
        assert_eq!(
            redact_path("/api/auth/reset-password//secret-token/"),
            "/api/auth/reset-password//[Filtered]/"
        );
        assert_eq!(
            redact_path("/api/auth/reset-password"),
            "/api/auth/reset-password"
        );
        let rpc = "/boji.v1.MembershipService/GetMembership";
        assert!(matches!(redact_path(rpc), Cow::Borrowed(path) if path == rpc));
    }

    #[test]
    fn truncation_keeps_whole_characters() {
        assert_eq!(truncate("/会员/abc", 3), "/会员");
        assert_eq!(truncate("/short", 200), "/short");
    }
}
