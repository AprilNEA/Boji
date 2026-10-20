//! Better Auth integration and bearer-only business authentication.
//!
//! The router returned by [`router`] is designed for the parent application to
//! nest at `/api/auth`. Business handlers must use [`authenticate`] instead of
//! accepting cookies or raw session tokens directly.

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;

use anyhow::Context;
use better_auth::integrations::axum::AxumIntegration;
use better_auth::plugins::{
    EmailPasswordPlugin, EmailVerificationPlugin, PasswordManagementPlugin, SessionManagementPlugin,
};
use better_auth::prelude::{AuthRequest, AuthSession, AuthUser, HttpMethod};
use better_auth::seaorm::{DatabaseConnection, SeaOrmStore};
use better_auth::{AuthConfig, BetterAuth};
use http::{HeaderMap, header::AUTHORIZATION};
use thiserror::Error;

use crate::auth_schema::BojiAuthSchema;
use crate::mail::{PasswordResetEmailSender, PrivateFileEmailProvider, VerificationEmailSender};

/// Concrete Better Auth instance used by the Boji service.
pub type Auth = BetterAuth<BojiAuthSchema>;

/// Immutable inputs used to build [`Auth`].
///
/// Keep `secret` outside logs, diagnostics, and error messages. The caller must
/// supply a secret of at least 32 characters.
pub struct AuthOptions {
    /// Secret used to validate signed Bearer credentials and Better Auth cookies.
    pub secret: String,
    /// Public base URL of this server, without the `/api/auth` suffix.
    pub base_url: String,
    /// Additional origins allowed by Better Auth's CSRF and redirect checks.
    pub trusted_origins: Vec<String>,
    /// Absolute private directory for verification and password-reset mail files.
    pub mail_output_directory: PathBuf,
}

/// Identity returned after a signed Bearer session passes server-side checks.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Principal {
    /// Authenticated `user.id` value.
    pub user_id: String,
    /// Whether the authenticated user's email was verified.
    pub email_verified: bool,
    /// Optional application role carried by the user record.
    pub role: Option<String>,
}

/// Typed failure returned by [`authenticate`].
#[derive(Debug, Error)]
pub enum AuthFailure {
    /// The request did not carry an Authorization header.
    #[error("signed Bearer authentication is required")]
    MissingBearer,
    /// The request carried more than one Authorization header.
    #[error("multiple Authorization headers are not allowed")]
    MultipleAuthorization,
    /// The Authorization header could not be decoded or has an invalid scheme.
    #[error("Authorization must contain one Bearer credential")]
    InvalidAuthorization,
    /// The Bearer credential is an unsigned raw token.
    #[error("raw Bearer tokens are not accepted")]
    UnsignedBearer,
    /// The signed credential failed Better Auth signature validation.
    #[error("signed Bearer credential is invalid")]
    InvalidSignedBearer,
    /// The signed credential does not identify a current active session.
    #[error("session is not active")]
    SessionNotFound,
    /// The session user no longer exists.
    #[error("session user does not exist")]
    UserNotFound,
    /// The user has not completed email verification.
    #[error("verified email is required")]
    EmailUnverified,
    /// Better Auth storage failed while validating a session.
    #[error("authentication storage is unavailable")]
    Storage(#[source] better_auth::AuthError),
}

/// Builds the production authentication service from application-owned entities.
///
/// This enables email/password registration, session management, email
/// verification, and password management. It deliberately does not install Apple
/// OAuth or Wallet plugins.
pub async fn build(db: DatabaseConnection, options: AuthOptions) -> anyhow::Result<Arc<Auth>> {
    let provider = PrivateFileEmailProvider::new(options.mail_output_directory)
        .context("configure private authentication mail output")?;
    let reset_sender = PasswordResetEmailSender::new(provider.clone());
    let verification_sender = VerificationEmailSender::new(provider.clone());

    let mut config = AuthConfig::new(options.secret)
        .app_name("Boji")
        .base_url(format!(
            "{}/api/auth",
            options.base_url.trim_end_matches('/')
        ))
        .base_path("/api/auth")
        .trusted_origins(options.trusted_origins)
        .password_min_length(8);
    config.session.bearer = Some(better_auth::__private_core::BearerConfig {
        require_signature: true,
    });
    config.account.account_linking.enabled = false;

    let email_verification_for_login = Arc::new(
        EmailVerificationPlugin::new()
            .require_verification_for_signin(true)
            .send_on_sign_up(true)
            .send_on_sign_in(true)
            .auto_sign_in_after_verification(false)
            .custom_send_verification_email(Arc::new(verification_sender.clone())),
    );
    let store = SeaOrmStore::<BojiAuthSchema>::new(config.clone(), db);
    let auth = BetterAuth::<BojiAuthSchema>::new(config)
        .store(store)
        .email_provider(provider)
        .plugin(
            EmailPasswordPlugin::new()
                .enable_signup(true)
                .require_email_verification(true)
                .auto_sign_in(false)
                .with_email_verification(email_verification_for_login),
        )
        .plugin(SessionManagementPlugin::new())
        .plugin(
            EmailVerificationPlugin::new()
                .require_verification_for_signin(true)
                .send_on_sign_up(true)
                .send_on_sign_in(true)
                .auto_sign_in_after_verification(false)
                .custom_send_verification_email(Arc::new(verification_sender)),
        )
        .plugin(
            PasswordManagementPlugin::new()
                .reset_token_expiry_hours(1)
                .revoke_sessions_on_password_reset(true)
                .send_reset_password(Arc::new(reset_sender)),
        )
        .build()
        .await
        .context("build Better Auth service")?;

    Ok(Arc::new(auth))
}

/// Returns Better Auth's native route router.
///
/// The parent application must nest this router at `/api/auth`. This function
/// does not implement registration, login, sign-out, or password endpoints.
pub fn router(auth: Arc<Auth>) -> axum::Router {
    auth.clone().axum_router().with_state(auth)
}

/// Authenticates one business request with a signed Bearer session only.
///
/// Cookie-only requests and raw session-token Bearer values are rejected before
/// Better Auth reads storage. A signed value is unwrapped by Better Auth, then
/// its backing session and user are loaded authoritatively from SeaORM.
pub async fn authenticate(auth: &Auth, headers: &HeaderMap) -> Result<Principal, AuthFailure> {
    let credential = signed_bearer(headers)?;
    let mut request_headers = HashMap::new();
    let _ = request_headers.insert("authorization".to_string(), format!("Bearer {credential}"));
    let request = AuthRequest::from_parts(
        HttpMethod::Get,
        "/api/auth/get-session".to_string(),
        request_headers,
        None,
        HashMap::new(),
    );

    let token = auth
        .session_manager()
        .extract_session_token(&request)
        .ok_or(AuthFailure::InvalidSignedBearer)?;
    let session = auth
        .session_manager()
        .get_session(&token)
        .await
        .map_err(AuthFailure::Storage)?
        .ok_or(AuthFailure::SessionNotFound)?;
    let user = auth
        .store()
        .get_user_by_id(&session.user_id())
        .await
        .map_err(AuthFailure::Storage)?
        .ok_or(AuthFailure::UserNotFound)?;

    if !user.email_verified() {
        return Err(AuthFailure::EmailUnverified);
    }

    Ok(Principal {
        user_id: user.id().into_owned(),
        email_verified: user.email_verified(),
        role: user.role().map(ToOwned::to_owned),
    })
}

fn signed_bearer(headers: &HeaderMap) -> Result<&str, AuthFailure> {
    let mut values = headers.get_all(AUTHORIZATION).iter();
    let value = values.next().ok_or(AuthFailure::MissingBearer)?;
    if values.next().is_some() {
        return Err(AuthFailure::MultipleAuthorization);
    }
    let value = value
        .to_str()
        .map_err(|_| AuthFailure::InvalidAuthorization)?;
    let (scheme, credential) = value
        .split_once(' ')
        .ok_or(AuthFailure::InvalidAuthorization)?;
    if !scheme.eq_ignore_ascii_case("Bearer")
        || credential.is_empty()
        || credential.chars().any(char::is_whitespace)
    {
        return Err(AuthFailure::InvalidAuthorization);
    }
    if !credential.contains('.') {
        return Err(AuthFailure::UnsignedBearer);
    }
    Ok(credential)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn raw_bearer_token_is_rejected_before_storage_access() {
        let mut headers = HeaderMap::new();
        headers.insert(AUTHORIZATION, "Bearer session_raw_token".parse().unwrap());

        assert!(matches!(
            signed_bearer(&headers),
            Err(AuthFailure::UnsignedBearer)
        ));
    }

    #[test]
    fn cookie_only_request_is_rejected_before_storage_access() {
        let mut headers = HeaderMap::new();
        headers.insert(
            "cookie",
            "better-auth.session_token=signed.value".parse().unwrap(),
        );

        assert!(matches!(
            signed_bearer(&headers),
            Err(AuthFailure::MissingBearer)
        ));
    }

    #[test]
    fn duplicate_authorization_headers_are_rejected() {
        let mut headers = HeaderMap::new();
        headers.append(AUTHORIZATION, "Bearer signed.one".parse().unwrap());
        headers.append(AUTHORIZATION, "Bearer signed.two".parse().unwrap());

        assert!(matches!(
            signed_bearer(&headers),
            Err(AuthFailure::MultipleAuthorization)
        ));
    }
}
