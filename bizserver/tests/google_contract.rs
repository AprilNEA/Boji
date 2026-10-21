//! PostgreSQL-backed contracts for Sign in with Google.
//!
//! These tests are ignored by default. Run them only against an isolated
//! disposable PostgreSQL database supplied in `TEST_DATABASE_URL`.

use std::{env, time::Duration};

use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use boji_bizserver::google::GoogleSignIn;
use boji_bizserver::{
    app, auth, mail::MailTransport, migrations, proto::boji::v1 as p, rpc::Capabilities,
};
use reqwest::{Client, StatusCode};
use sea_orm::{ConnectOptions, Database, DatabaseConnection};
use serde_json::{Value, json};
use tempfile::TempDir;

const WEB_CLIENT_ID: &str = "web.apps.googleusercontent.com";

fn settings() -> GoogleSignIn {
    GoogleSignIn {
        client_id: WEB_CLIENT_ID.into(),
        client_secret: String::new(),
        additional_client_ids: vec!["ios.apps.googleusercontent.com".into()],
    }
}

async fn database() -> DatabaseConnection {
    let url = env::var("TEST_DATABASE_URL").expect("set isolated TEST_DATABASE_URL");
    let mut options = ConnectOptions::new(url);
    options.max_connections(4).sqlx_logging(false);
    let database = Database::connect(options).await.unwrap();
    migrations::migrate(&database).await.unwrap();
    database
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn google_provider_is_advertised_and_rejects_untrusted_tokens() {
    let database = database().await;
    let mail = TempDir::new().unwrap();
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let origin = format!("http://{}", listener.local_addr().unwrap());
    let authentication = auth::build(
        database.clone(),
        auth::AuthOptions {
            secret: "local-google-contract-signing-key-not-for-production".into(),
            base_url: origin.clone(),
            trusted_origins: vec![origin.clone()],
            mail: MailTransport::Files {
                directory: mail.path().to_owned(),
            },
            client_ip: auth::ClientIp::default(),
            apple: None,
            google: Some(settings()),
            account_linking: auth::AccountLinking::Disabled,
        },
    )
    .await
    .unwrap();
    let router = app::router(
        database.clone(),
        authentication,
        std::slice::from_ref(&origin),
        Capabilities {
            google_sign_in: true,
            ..Capabilities::default()
        },
    )
    .unwrap();
    let (stop, stopped) = tokio::sync::oneshot::channel();
    let server = tokio::spawn(async move {
        axum::serve(listener, router)
            .with_graceful_shutdown(async {
                let _ = stopped.await;
            })
            .await
            .unwrap();
    });
    let client = Client::builder()
        .timeout(Duration::from_secs(15))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .unwrap();

    let config: p::ServerConfig = client
        .post(format!("{origin}/boji.v1.SystemService/GetServerConfig"))
        .header("connect-protocol-version", "1")
        .json(&json!({"name":"serverConfig"}))
        .send()
        .await
        .unwrap()
        .json()
        .await
        .unwrap();
    assert!(config.google_login_enabled);
    assert!(!config.apple_login_enabled);

    // A malformed token and a token that Google did not sign both fail before
    // any user or session exists. The second token carries the right claims,
    // so only the signature check can reject it.
    let now = chrono::Utc::now().timestamp();
    let forged = [
        r#"{"alg":"RS256","kid":"not-a-google-key"}"#.to_owned(),
        json!({
            "iss": "https://accounts.google.com",
            "aud": WEB_CLIENT_ID,
            "sub": "1234567890",
            "email": "forged@example.test",
            "email_verified": true,
            "iat": now,
            "exp": now + 600,
        })
        .to_string(),
    ]
    .map(|part| URL_SAFE_NO_PAD.encode(part))
    .join(".")
        + ".c2lnbmF0dXJl";
    for token in ["not-a-jwt", forged.as_str()] {
        let rejected = client
            .post(format!("{origin}/api/auth/sign-in/social"))
            .header("origin", &origin)
            .json(&json!({"provider":"google","idToken":{"token":token}}))
            .send()
            .await
            .unwrap();
        assert_eq!(rejected.status(), StatusCode::UNAUTHORIZED, "{token}");
        assert!(rejected.headers().get("set-auth-token").is_none());
        let body: Value = rejected.json().await.unwrap();
        assert_eq!(body["code"], "INVALID_TOKEN");
    }

    // Apple stays unregistered when only Google is configured.
    let apple = client
        .post(format!("{origin}/api/auth/sign-in/social"))
        .header("origin", &origin)
        .json(&json!({"provider":"apple","idToken":{"token":"not-a-jwt"}}))
        .send()
        .await
        .unwrap();
    assert!(apple.status().is_client_error());
    assert!(apple.headers().get("set-auth-token").is_none());

    stop.send(()).unwrap();
    server.await.unwrap();
    database.close().await.unwrap();
}
