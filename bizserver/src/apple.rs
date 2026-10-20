//! Sign in with Apple provider assembly.
//!
//! Native clients send Apple identity tokens to `POST /api/auth/sign-in/social`.
//! Web clients use Apple's `form_post` code flow. Both flows share one provider.
//! better-auth-rs verifies identity tokens and signs the Apple client secret.

use std::sync::Arc;

use async_trait::async_trait;
use better_auth::SchemaValue;
use better_auth::error::{AuthError, AuthResult};
use better_auth::plugins::oauth::{
    AppleClientSecretSigner, AppleOptions, OAuthProfile, OAuthProfileMapper, OAuthProvider,
};
use sea_orm::{ColumnTrait, DatabaseConnection, DbErr, EntityTrait, QueryFilter};
use serde_json::Value;

use crate::auth_schema::{account, user};

/// Provider ID in Better Auth routes and in `account.provider_id`.
pub const PROVIDER_ID: &str = "apple";

/// Origin that posts the web authorization response to the callback route.
pub const ORIGIN: &str = "https://appleid.apple.com";

/// Validated Sign in with Apple settings.
///
/// `Debug` output omits the private key held by the signer.
#[derive(Clone, Debug)]
pub struct AppleSignIn {
    /// Services ID. Web authorization and the token endpoint use it as the client ID.
    pub services_id: String,
    /// iOS bundle ID. Native identity tokens carry it as the audience.
    pub app_bundle_identifier: String,
    /// Signs the client secret from the Team ID, the key ID and the `.p8` key.
    pub client_secret_signer: AppleClientSecretSigner,
}

/// Build the Apple provider for the Better Auth OAuth plugin.
///
/// The provider accepts identity tokens whose audience is the Services ID or
/// the bundle ID. Token requests use a client secret from the signer.
pub fn provider(settings: &AppleSignIn, db: DatabaseConnection) -> OAuthProvider {
    let mut provider = OAuthProvider::apple(
        &settings.services_id,
        "",
        AppleOptions {
            audience: Some(vec![
                settings.services_id.clone(),
                settings.app_bundle_identifier.clone(),
            ]),
            client_secret_signer: Some(settings.client_secret_signer.clone()),
            ..AppleOptions::default()
        },
    );
    provider.map_profile_to_user = Some(Arc::new(StoredEmail { db }));
    provider
}

/// Restores the stored email when a later Apple identity token omits it.
///
/// Better Auth rejects a social sign-in without an email. A returning Apple
/// user keeps the email that the first sign-in stored. A new user without an
/// email is still rejected.
struct StoredEmail {
    db: DatabaseConnection,
}

#[async_trait]
impl OAuthProfileMapper for StoredEmail {
    async fn map_profile(&self, profile: &Value) -> AuthResult<OAuthProfile> {
        let has_email = profile
            .get("email")
            .and_then(Value::as_str)
            .is_some_and(|email| !email.is_empty());
        let subject = profile.get("sub").and_then(Value::as_str);
        let Some(subject) = subject.filter(|_| !has_email) else {
            return Ok(OAuthProfile::default());
        };
        let email = stored_email(&self.db, subject).await.map_err(|_| {
            tracing::error!(event = "apple_email_lookup_failed");
            AuthError::internal("Apple account lookup failed")
        })?;
        Ok(OAuthProfile {
            email: email.map(|email| SchemaValue::Typed(Some(email))),
            ..OAuthProfile::default()
        })
    }
}

async fn stored_email(db: &DatabaseConnection, subject: &str) -> Result<Option<String>, DbErr> {
    let Some(account) = account::Entity::find()
        .filter(account::Column::ProviderId.eq(PROVIDER_ID))
        .filter(account::Column::AccountId.eq(subject))
        .one(db)
        .await?
    else {
        return Ok(None);
    };
    let user = user::Entity::find_by_id(account.user_id).one(db).await?;
    Ok(user
        .and_then(|user| user.email)
        .filter(|email| !email.is_empty()))
}
