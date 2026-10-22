//! Sign in with Google provider assembly.
//!
//! Native clients send Google ID tokens to `POST /api/auth/sign-in/social`.
//! better-auth-rs checks the token signature against Google's published keys,
//! the issuer, the audience and the expiry. The web code flow uses the same
//! provider when a client secret is configured.

use std::fmt;

use better_auth::plugins::oauth::{GoogleOptions, OAuthProvider};

/// Provider ID in Better Auth routes and in `account.provider_id`.
pub const PROVIDER_ID: &str = "google";

/// Validated Sign in with Google settings.
///
/// `Debug` output omits the client secret.
#[derive(Clone)]
pub struct GoogleSignIn {
    /// Web client ID. Android requests ID tokens for this audience, and the
    /// web flow uses it as the client ID.
    pub client_id: String,
    /// Web client secret for the token endpoint of the web flow. Empty when
    /// unset: native ID-token sign-in does not use it.
    pub client_secret: String,
    /// Other accepted ID-token audiences, for example an iOS client ID.
    pub additional_client_ids: Vec<String>,
}

impl fmt::Debug for GoogleSignIn {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter
            .debug_struct("GoogleSignIn")
            .field("client_id", &self.client_id)
            .field("client_secret_set", &!self.client_secret.is_empty())
            .field("additional_client_ids", &self.additional_client_ids)
            .finish()
    }
}

/// Build the Google provider for the Better Auth OAuth plugin.
///
/// The provider accepts ID tokens whose audience is the web client ID or one
/// of the additional client IDs.
pub fn provider(settings: &GoogleSignIn) -> OAuthProvider {
    OAuthProvider::google_with_options(
        &settings.client_id,
        &settings.client_secret,
        GoogleOptions {
            additional_client_ids: settings.additional_client_ids.clone(),
        },
    )
}
