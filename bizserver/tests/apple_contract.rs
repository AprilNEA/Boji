//! PostgreSQL-backed contracts for Sign in with Apple.
//!
//! These tests are ignored by default. Run them only against an isolated
//! disposable PostgreSQL database supplied in `TEST_DATABASE_URL`.

use std::collections::HashMap;
use std::{env, time::Duration};

use better_auth::SchemaValue;
use better_auth::plugins::oauth::AppleClientSecretSigner;
use boji_bizserver::apple::{self, AppleSignIn};
use boji_bizserver::auth_schema::{account, user};
use boji_bizserver::{app, auth, migrations, proto::boji::v1 as p, rpc::Capabilities};
use p256::pkcs8::{EncodePrivateKey, LineEnding};
use reqwest::{Client, StatusCode};
use sea_orm::{ActiveModelTrait, ConnectOptions, Database, DatabaseConnection, Set};
use serde_json::{Value, json};
use tempfile::TempDir;
use uuid::Uuid;

const SERVICES_ID: &str = "club.example.web";
const BUNDLE_ID: &str = "club.example";

/// Apple settings with a fixed P-256 test key. The key signs nothing that Apple accepts.
fn settings() -> AppleSignIn {
    let key = p256::SecretKey::from_slice(&[7; 32]).unwrap();
    let pem = key.to_pkcs8_pem(LineEnding::LF).unwrap();
    AppleSignIn {
        services_id: SERVICES_ID.into(),
        app_bundle_identifier: BUNDLE_ID.into(),
        client_secret_signer: AppleClientSecretSigner::new(
            "TEAM123456",
            "KEY1234567",
            pem.as_bytes(),
        )
        .unwrap(),
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
async fn apple_provider_is_advertised_and_routed_over_real_http() {
    let database = database().await;
    let mail = TempDir::new().unwrap();
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let origin = format!("http://{}", listener.local_addr().unwrap());
    let authentication = auth::build(
        database.clone(),
        auth::AuthOptions {
            secret: "local-apple-contract-signing-key-not-for-production".into(),
            base_url: origin.clone(),
            trusted_origins: vec![origin.clone()],
            mail_output_directory: mail.path().to_owned(),
            apple: Some(settings()),
            account_linking: auth::AccountLinking::Enabled,
        },
    )
    .await
    .unwrap();
    let linking = &authentication.config().account.account_linking;
    assert!(linking.enabled() && linking.require_local_email_verified);
    assert!(!linking.allow_different_emails);
    let router = app::router(
        database.clone(),
        authentication,
        std::slice::from_ref(&origin),
        Capabilities {
            apple_sign_in: true,
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
    assert!(config.apple_login_enabled);

    // The native flow rejects a malformed identity token and issues no session.
    let rejected = client
        .post(format!("{origin}/api/auth/sign-in/social"))
        .header("origin", &origin)
        .json(&json!({"provider":"apple","idToken":{"token":"not-a-jwt","nonce":"raw-nonce"}}))
        .send()
        .await
        .unwrap();
    assert_eq!(rejected.status(), StatusCode::UNAUTHORIZED);
    assert!(rejected.headers().get("set-auth-token").is_none());
    let body: Value = rejected.json().await.unwrap();
    assert_eq!(body["code"], "INVALID_TOKEN");

    // The web flow starts with the generated client secret and no static secret.
    let started = client
        .post(format!("{origin}/api/auth/sign-in/social"))
        .header("origin", &origin)
        .json(&json!({"provider":"apple","callbackURL":format!("{origin}/welcome"),"disableRedirect":true}))
        .send()
        .await
        .unwrap();
    assert_eq!(started.status(), StatusCode::OK);
    let body: Value = started.json().await.unwrap();
    let url = url::Url::parse(body["url"].as_str().unwrap()).unwrap();
    assert_eq!(
        url.origin().ascii_serialization(),
        "https://appleid.apple.com"
    );
    assert_eq!(url.path(), "/auth/authorize");
    let query: HashMap<String, String> = url.query_pairs().into_owned().collect();
    let callback = format!("{origin}/api/auth/callback/apple");
    for (name, value) in [
        ("client_id", SERVICES_ID),
        ("response_mode", "form_post"),
        ("response_type", "code id_token"),
        ("redirect_uri", callback.as_str()),
    ] {
        assert_eq!(query.get(name).map(String::as_str), Some(value), "{name}");
    }
    assert!(!query.contains_key("client_secret"));

    stop.send(()).unwrap();
    server.await.unwrap();
    database.close().await.unwrap();
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL"]
async fn returning_apple_user_keeps_the_stored_email() {
    let database = database().await;
    let now = chrono::Utc::now();
    let user_id = Uuid::new_v4().to_string();
    let subject = format!("apple-{}", Uuid::new_v4());
    let email = format!("{}@privaterelay.example.test", Uuid::new_v4());
    user::ActiveModel {
        id: Set(user_id.clone()),
        name: Set(None),
        email: Set(Some(email.clone())),
        email_verified: Set(true),
        image: Set(None),
        role: Set(None),
        banned: Set(false),
        ban_reason: Set(None),
        ban_expires: Set(None),
        created_at: Set(now),
        updated_at: Set(now),
    }
    .insert(&database)
    .await
    .unwrap();
    account::ActiveModel {
        id: Set(Uuid::new_v4().to_string()),
        account_id: Set(subject.clone()),
        provider_id: Set(apple::PROVIDER_ID.into()),
        user_id: Set(user_id),
        access_token: Set(None),
        refresh_token: Set(None),
        id_token: Set(None),
        access_token_expires_at: Set(None),
        refresh_token_expires_at: Set(None),
        scope: Set(None),
        password: Set(None),
        created_at: Set(now),
        updated_at: Set(now),
    }
    .insert(&database)
    .await
    .unwrap();
    let provider = apple::provider(&settings(), database.clone());
    let mapper = provider.map_profile_to_user.clone().unwrap();

    let restored = mapper
        .map_profile(&json!({"sub": subject, "email_verified": false}))
        .await
        .unwrap();
    assert!(
        matches!(&restored.email, Some(SchemaValue::Typed(Some(value))) if value == &email),
        "stored email was not restored"
    );
    let supplied = mapper
        .map_profile(&json!({"sub": subject, "email": "new@example.test"}))
        .await
        .unwrap();
    assert!(supplied.email.is_none());
    let unknown = mapper
        .map_profile(&json!({"sub": format!("apple-{}", Uuid::new_v4())}))
        .await
        .unwrap();
    assert!(unknown.email.is_none());

    database.close().await.unwrap();
}
