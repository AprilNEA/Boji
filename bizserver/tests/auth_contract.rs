//! PostgreSQL-backed contracts for the public authentication boundary.
//!
//! These tests are intentionally ignored. Run them only against an isolated
//! disposable PostgreSQL database supplied in `TEST_DATABASE_URL`.

use std::sync::Arc;

use axum::http::{HeaderMap, header::AUTHORIZATION};
use boji_bizserver::auth::{Auth, AuthFailure, AuthOptions, authenticate, build};
use sea_orm::Database;
use tempfile::TempDir;

async fn test_auth() -> Arc<Auth> {
    let database_url = std::env::var("TEST_DATABASE_URL")
        .expect("auth contract tests require an isolated TEST_DATABASE_URL");
    let database = Database::connect(database_url)
        .await
        .expect("connect to isolated auth contract database");
    let mail_directory = TempDir::new().expect("create private test mail directory");
    let options = AuthOptions {
        secret: "auth-contract-secret-with-at-least-32-characters".to_string(),
        base_url: "http://localhost:3000".to_string(),
        trusted_origins: Vec::new(),
        mail: boji_bizserver::mail::MailTransport::Files {
            directory: mail_directory.keep(),
        },
        client_ip: Default::default(),
        apple: None,
        google: None,
        account_linking: Default::default(),
    };
    build(database, options)
        .await
        .expect("build auth service against isolated database")
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL"]
async fn raw_bearer_token_is_never_sent_to_storage() {
    let auth = test_auth().await;
    let mut headers = HeaderMap::new();
    headers.insert(AUTHORIZATION, "Bearer session_raw_token".parse().unwrap());

    assert!(matches!(
        authenticate(&auth, &headers).await,
        Err(AuthFailure::UnsignedBearer)
    ));
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL"]
async fn cookie_only_business_request_is_rejected() {
    let auth = test_auth().await;
    let mut headers = HeaderMap::new();
    headers.insert(
        "cookie",
        "better-auth.session_token=signed.value".parse().unwrap(),
    );

    assert!(matches!(
        authenticate(&auth, &headers).await,
        Err(AuthFailure::MissingBearer)
    ));
}
