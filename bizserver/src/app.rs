//! Axum composition for native authentication and ConnectRPC business methods.

use crate::{
    auth::{self, Auth},
    rpc::{self, Capabilities},
    telemetry,
};
use anyhow::Result;
use axum::{
    Json, Router,
    body::Body,
    extract::{Request, State},
    http::{HeaderValue, Method, StatusCode},
    middleware::{self, Next},
    response::Response,
    routing::get,
};
use sea_orm::DatabaseConnection;
use sentry::integrations::tower::NewSentryLayer;
use std::{sync::Arc, time::Instant};
use tower_http::cors::CorsLayer;
use uuid::Uuid;

/// Build the HTTP router without opening a port or mutating the database.
///
/// `capabilities` must describe the integrations installed in `auth`.
pub fn router(
    db: DatabaseConnection,
    auth: Arc<Auth>,
    cors_origins: &[String],
    capabilities: Capabilities,
) -> Result<Router> {
    let origins = cors_origins
        .iter()
        .map(|value| HeaderValue::from_str(value))
        .collect::<Result<Vec<_>, _>>()?;
    let cors = CorsLayer::new()
        .allow_origin(origins)
        .allow_credentials(true)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers(
            [
                "authorization",
                "content-type",
                "connect-protocol-version",
                "connect-timeout-ms",
                "x-user-agent",
                "grpc-timeout",
            ]
            .map(axum::http::HeaderName::from_static),
        )
        .expose_headers(
            [
                "set-auth-token",
                "x-request-id",
                "retry-after",
                "grpc-status",
                "grpc-message",
            ]
            .map(axum::http::HeaderName::from_static),
        );
    let connect = rpc::router(db.clone(), auth.clone(), capabilities)
        .into_axum_service()
        .with_limits(
            connectrpc::Limits::default()
                .with_max_message_size(65_536)
                .with_max_request_body_size(65_536),
        );
    Ok(Router::new()
        .route(
            "/healthz",
            get(|| async { Json(serde_json::json!({"status":"ok"})) }),
        )
        .route("/readyz", get(ready).with_state(db))
        .nest(
            "/api/auth",
            auth::router(auth.clone()).layer(middleware::from_fn_with_state(
                auth,
                crate::auth_policy::verified_session_response,
            )),
        )
        .fallback_service(connect)
        .layer(cors)
        .layer(middleware::from_fn(request_metadata))
        // Outermost, so that each request reports on its own Sentry hub.
        .layer(NewSentryLayer::<Request>::new_from_top()))
}

async fn ready(State(db): State<DatabaseConnection>) -> (StatusCode, Json<serde_json::Value>) {
    if db.ping().await.is_ok() {
        (StatusCode::OK, Json(serde_json::json!({"status":"ok"})))
    } else {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(serde_json::json!({"status":"unavailable"})),
        )
    }
}

async fn request_metadata(request: Request<Body>, next: Next) -> Response {
    let started = Instant::now();
    let method = request.method().clone();
    let request_id = Uuid::new_v4().to_string();
    telemetry::describe_request(&request_id, &method, request.uri().path());
    let mut response = next.run(request).await;
    if let Ok(value) = HeaderValue::from_str(&request_id) {
        response.headers_mut().insert("x-request-id", value);
    }
    response
        .headers_mut()
        .insert("cache-control", HeaderValue::from_static("no-store"));
    response
        .headers_mut()
        .insert("referrer-policy", HeaderValue::from_static("no-referrer"));
    tracing::info!(event = "http_request", %request_id, %method, status = response.status().as_u16(), elapsed_ms = started.elapsed().as_millis() as u64);
    response
}
