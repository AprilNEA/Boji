//! Sensitive business authorization through the native Better Auth permission API.

use std::collections::HashMap;

use better_auth::plugins::admin::AdminPermissionError;
use better_auth::prelude::{SessionView, UserView};
use chrono::{Duration, Utc};
use connectrpc::{ConnectError, ErrorCode};
use http::HeaderMap;

use crate::auth::{self, Auth};
use crate::proto::boji::v1::ErrorReason;
use crate::rpc::{error, session_required};

/// Require a signed Bearer, native permissions, verified email, and fresh session.
///
/// Credentials only come from one Authorization header. Cookies, asserted user
/// IDs, and asserted roles never participate. Results must not be cached.
/// Permission changes after this check are not serialized with business writes.
pub async fn authorize(
    auth: &Auth,
    headers: &HeaderMap,
    permissions: &[(&str, &[&str])],
) -> Result<String, ConnectError> {
    let credential = auth::signed_bearer(headers).map_err(|_| session_required())?;
    let native_headers =
        HashMap::from([("authorization".to_owned(), format!("Bearer {credential}"))]);
    let required = permissions
        .iter()
        .map(|(resource, actions)| {
            (
                (*resource).to_owned(),
                actions.iter().map(|action| (*action).to_owned()).collect(),
            )
        })
        .collect();
    let checks = auth.admin_permissions().map_err(permission_error)?;
    // The public API reads authoritative user/session state and returns the same
    // snapshot used by its permission decision. No synthetic HTTP call is needed.
    let caller = checks
        .authorize_request(&native_headers, &required)
        .await
        .map_err(permission_error)?;
    require_fresh_verified(caller.user(), caller.session())?;
    caller
        .user()
        .id
        .as_str()
        .map(str::to_owned)
        .ok_or_else(authorization_failed)
}

fn require_fresh_verified(user: &UserView, session: &SessionView) -> Result<(), ConnectError> {
    if user.banned {
        let expires = user
            .ban_expires
            .as_ref()
            .map(|expiry| expiry.to_datetime())
            .transpose()
            .map_err(|_| authorization_failed())?
            .flatten();
        if expires.is_none_or(|expiry| expiry > Utc::now()) {
            return Err(forbidden());
        }
    }
    if !user.email_verified {
        return Err(error::error(
            ErrorCode::PermissionDenied,
            ErrorReason::EMAIL_NOT_VERIFIED,
            "Verify the email address of the account first.",
        ));
    }
    let created = session
        .created_at
        .to_datetime()
        .map_err(|_| authorization_failed())?
        .ok_or_else(authorization_failed)?;
    let age = Utc::now().signed_duration_since(created);
    if age < Duration::zero() || age > Duration::minutes(15) {
        return Err(error::error(
            ErrorCode::PermissionDenied,
            ErrorReason::FRESH_SESSION_REQUIRED,
            "Sign in again. Operations require a session created within 15 minutes.",
        ));
    }
    if session.impersonated_by.is_some() {
        return Err(forbidden());
    }
    Ok(())
}

fn permission_error(error: AdminPermissionError) -> ConnectError {
    match error {
        AdminPermissionError::Unauthenticated => session_required(),
        AdminPermissionError::Forbidden => forbidden(),
        AdminPermissionError::Internal(error) if error.status_code() == 403 => forbidden(),
        _ => authorization_failed(),
    }
}

/// Return the `PERMISSION_DENIED` `ADMIN_FORBIDDEN` error.
///
/// One reason covers a missing permission, a banned account and an
/// impersonation session, so the response does not reveal which applies.
fn forbidden() -> ConnectError {
    error::error(
        ErrorCode::PermissionDenied,
        ErrorReason::ADMIN_FORBIDDEN,
        "The caller is not allowed to perform this operation.",
    )
}

fn authorization_failed() -> ConnectError {
    error::internal("admin_authorization_failed")
}
