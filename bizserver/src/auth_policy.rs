//! Fail-closed compatibility guard for the pinned alpha authentication provider.
//!
//! The pinned email/password implementation issues a session before enforcing its
//! verification flag. This boundary withholds the entire response and revokes that
//! session using Better Auth. Password validation and session creation remain native.

use crate::auth::{self, Auth, AuthFailure};
use axum::{
    Json,
    extract::{Request, State},
    http::{HeaderMap, HeaderValue, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use better_auth::prelude::{AuthRequest, HttpMethod};
use std::{collections::HashMap, sync::Arc};

pub(crate) async fn verified_session_response(
    State(auth): State<Arc<Auth>>,
    request: Request,
    next: Next,
) -> Response {
    let response = next.run(request).await;
    let Some(token) = response.headers().get("set-auth-token") else {
        return response;
    };
    let Ok(token) = token.to_str() else {
        return unavailable();
    };
    let mut headers = HeaderMap::new();
    let Ok(authorization) = HeaderValue::from_str(&format!("Bearer {token}")) else {
        return unavailable();
    };
    headers.insert("authorization", authorization);
    match auth::authenticate(&auth, &headers).await {
        Ok(_) => response,
        Err(AuthFailure::EmailUnverified) => {
            if revoke_issued_session(&auth, token).await.is_err() {
                return unavailable();
            }
            (StatusCode::FORBIDDEN, Json(serde_json::json!({"code":"EMAIL_NOT_VERIFIED","message":"Email verification is required"}))).into_response()
        }
        Err(_) => unavailable(),
    }
}

async fn revoke_issued_session(auth: &Auth, signed_token: &str) -> Result<(), ()> {
    let request = AuthRequest::from_parts(
        HttpMethod::Get,
        "/api/auth/get-session".into(),
        HashMap::from([("authorization".into(), format!("Bearer {signed_token}"))]),
        None,
        HashMap::new(),
    );
    let token = auth
        .session_manager()
        .extract_session_token(&request)
        .ok_or(())?;
    auth.session_manager()
        .delete_session(&token)
        .await
        .map_err(|_| ())
}

fn unavailable() -> Response {
    tracing::error!(event = "auth_session_policy_failed");
    (StatusCode::SERVICE_UNAVAILABLE, Json(serde_json::json!({"code":"AUTH_UNAVAILABLE","message":"Authentication is temporarily unavailable"}))).into_response()
}
