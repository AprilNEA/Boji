//! End-to-end contracts against a dedicated PostgreSQL database and real HTTP.

use boji_bizserver::{app, auth, migrations, proto::boji::v1 as p};
use reqwest::{Client, StatusCode};
use sea_orm::{ConnectOptions, Database};
use serde_json::{Value, json};
use std::{env, time::Duration};
use tempfile::TempDir;
use uuid::Uuid;

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn native_auth_and_business_rpc_over_real_http() {
    let url = env::var("TEST_DATABASE_URL").expect("set isolated TEST_DATABASE_URL");
    let mut options = ConnectOptions::new(url);
    options.max_connections(8).sqlx_logging(false);
    let database = Database::connect(options).await.unwrap();
    migrations::migrate(&database).await.unwrap();
    migrations::migrate(&database).await.unwrap(); // Versioning is idempotent.
    let mail = TempDir::new().unwrap();
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let origin = format!("http://{}", listener.local_addr().unwrap());
    let authentication = auth::build(
        database.clone(),
        auth::AuthOptions {
            secret: "local-http-contract-signing-key-not-for-production".into(),
            base_url: origin.clone(),
            trusted_origins: vec![origin.clone()],
            mail_output_directory: mail.path().to_owned(),
        },
    )
    .await
    .unwrap();
    let router = app::router(
        database.clone(),
        authentication,
        std::slice::from_ref(&origin),
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
    let email = format!("{}@example.test", Uuid::new_v4());
    let password = "test-only-not-a-real-account-Password!123";

    assert!(
        client
            .get(format!("{origin}/healthz"))
            .send()
            .await
            .unwrap()
            .status()
            .is_success()
    );
    assert!(
        client
            .get(format!("{origin}/readyz"))
            .send()
            .await
            .unwrap()
            .status()
            .is_success()
    );
    let response = rpc(
        &client,
        &origin,
        "SystemService/GetCapabilities",
        None,
        json!({}),
    )
    .await;
    assert_eq!(response.status(), StatusCode::OK);
    let capabilities: p::GetCapabilitiesResponse = response.json().await.unwrap();
    assert!(!capabilities.apple_sign_in && !capabilities.wallet_pass && capabilities.activity_sync);
    assert_eq!(
        rpc(
            &client,
            &origin,
            "MembershipService/GetMembership",
            None,
            json!({})
        )
        .await
        .status(),
        StatusCode::UNAUTHORIZED
    );

    let sign_up = client
        .post(format!("{origin}/api/auth/sign-up/email"))
        .header("origin", &origin)
        .json(&json!({"name":"RPC Test","email":email,"password":password}))
        .send()
        .await
        .unwrap();
    assert!(
        sign_up.status().is_success(),
        "registration status: {}",
        sign_up.status()
    );
    let send_verification = client
        .post(format!("{origin}/api/auth/send-verification-email"))
        .header("origin", &origin)
        .json(&json!({"email":email}))
        .send()
        .await
        .unwrap();
    assert_eq!(send_verification.status(), StatusCode::OK);
    let unverified = client
        .post(format!("{origin}/api/auth/sign-in/email"))
        .header("origin", &origin)
        .json(&json!({"email":email,"password":password}))
        .send()
        .await
        .unwrap();
    assert_eq!(unverified.status(), StatusCode::FORBIDDEN);
    assert!(unverified.headers().get("set-auth-token").is_none());
    assert!(unverified.headers().get("set-cookie").is_none());
    let verification = read_mail_url(&mail, "/verify-email").await;
    let verified = client.get(verification).send().await.unwrap();
    assert!(
        verified.status().is_success() || verified.status().is_redirection(),
        "verification status: {}",
        verified.status()
    );
    let signed_in = client
        .post(format!("{origin}/api/auth/sign-in/email"))
        .header("origin", &origin)
        .json(&json!({"email":email,"password":password}))
        .send()
        .await
        .unwrap();
    assert_eq!(signed_in.status(), StatusCode::OK);
    let token = signed_in
        .headers()
        .get("set-auth-token")
        .expect("signed token header")
        .to_str()
        .unwrap()
        .to_owned();
    let signed_in: Value = signed_in.json().await.unwrap();
    let raw_token = signed_in
        .get("token")
        .and_then(Value::as_str)
        .expect("raw session token is present in framework response");
    assert!(token.contains('.'));
    assert_eq!(
        rpc(
            &client,
            &origin,
            "MembershipService/GetMembership",
            Some(raw_token),
            json!({})
        )
        .await
        .status(),
        StatusCode::UNAUTHORIZED
    );
    assert!(
        client
            .get(format!("{origin}/api/auth/get-session"))
            .bearer_auth(&token)
            .send()
            .await
            .unwrap()
            .status()
            .is_success()
    );

    let enrollment = json!({"displayName":"RPC Test", "termsVersion":"community-v1"});
    let response = rpc(
        &client,
        &origin,
        "MembershipService/EnrollMembership",
        Some(&token),
        enrollment.clone(),
    )
    .await;
    assert_eq!(response.status(), StatusCode::OK);
    let first: Value = response.json().await.unwrap();
    let response = rpc(
        &client,
        &origin,
        "MembershipService/EnrollMembership",
        Some(&token),
        enrollment,
    )
    .await;
    let second: Value = response.json().await.unwrap();
    assert_eq!(first["membership"]["id"], second["membership"]["id"]);
    assert!(first["membership"]["memberNumber"].is_string());
    assert_eq!(
        first["membership"]["entitlements"]
            .as_array()
            .unwrap()
            .len(),
        3
    );
    // The same generated route also accepts binary protobuf.
    let binary = client
        .post(format!("{origin}/boji.v1.MembershipService/GetMembership"))
        .bearer_auth(&token)
        .header("content-type", "application/proto")
        .header("connect-protocol-version", "1")
        .body(Vec::new())
        .send()
        .await
        .unwrap();
    assert_eq!(binary.status(), StatusCode::OK);
    assert!(
        binary
            .headers()
            .get("content-type")
            .unwrap()
            .to_str()
            .unwrap()
            .starts_with("application/proto")
    );
    assert!(!binary.bytes().await.unwrap().is_empty());

    assert_eq!(
        rpc(
            &client,
            &origin,
            "ActivityService/ListChanges",
            Some(&token),
            json!({})
        )
        .await
        .status(),
        StatusCode::FORBIDDEN
    );
    assert_eq!(
        rpc(
            &client,
            &origin,
            "ActivityService/SetSyncState",
            Some(&token),
            json!({"enabled":true})
        )
        .await
        .status(),
        StatusCode::BAD_REQUEST
    );
    assert_eq!(
        rpc(
            &client,
            &origin,
            "ActivityService/SetSyncState",
            Some(&token),
            json!({"enabled":true,"consentVersion":"activity-sync-v1"})
        )
        .await
        .status(),
        StatusCode::OK
    );
    let now = chrono::Utc::now();
    let mutation_id = Uuid::new_v4().to_string();
    let record_id = Uuid::new_v4().to_string();
    let operation = json!({"mutationId":mutation_id,"id":record_id,"expectedRevision":0,"upsert":{"occurredAt":now.to_rfc3339(),"timeZone":"UTC","source":"manual","hydration":{"amountMl":250}}});
    let response = rpc(
        &client,
        &origin,
        "ActivityService/ApplyBatch",
        Some(&token),
        json!({"operations":[operation.clone()]}),
    )
    .await;
    assert_eq!(response.status(), StatusCode::OK);
    let first_mutation: Value = response.json().await.unwrap();
    assert_eq!(first_mutation["results"][0]["status"], "applied");
    let retry: Value = rpc(
        &client,
        &origin,
        "ActivityService/ApplyBatch",
        Some(&token),
        json!({"operations":[operation.clone()]}),
    )
    .await
    .json()
    .await
    .unwrap();
    assert_eq!(first_mutation, retry);
    let changes: Value = rpc(
        &client,
        &origin,
        "ActivityService/ListChanges",
        Some(&token),
        json!({}),
    )
    .await
    .json()
    .await
    .unwrap();
    assert_eq!(changes["records"].as_array().unwrap().len(), 1);
    let date = now.format("%Y-%m-%d").to_string();
    let days: Value = rpc(
        &client,
        &origin,
        "ActivityService/GetDays",
        Some(&token),
        json!({"from":date,"to":date}),
    )
    .await
    .json()
    .await
    .unwrap();
    assert_eq!(days["days"][0]["waterMl"], 250);
    let mut invalid = operation;
    invalid["upsert"]["source"] = json!("healthkit");
    assert_eq!(
        rpc(
            &client,
            &origin,
            "ActivityService/ApplyBatch",
            Some(&token),
            json!({"operations":[invalid]})
        )
        .await
        .status(),
        StatusCode::BAD_REQUEST
    );
    let deleted: Value = rpc(&client, &origin, "ActivityService/ApplyBatch", Some(&token), json!({"operations":[{"mutationId":Uuid::new_v4().to_string(),"id":record_id,"expectedRevision":1,"delete":{}}]})).await.json().await.unwrap();
    assert_eq!(deleted["results"][0]["status"], "applied");
    let changes: Value = rpc(
        &client,
        &origin,
        "ActivityService/ListChanges",
        Some(&token),
        json!({"cursor":changes["nextCursor"]}),
    )
    .await
    .json()
    .await
    .unwrap();
    assert!(changes["records"][0]["deletedAt"].is_string());

    let preflight = client
        .request(
            reqwest::Method::OPTIONS,
            format!("{origin}/boji.v1.MembershipService/GetMembership"),
        )
        .header("origin", &origin)
        .header("access-control-request-method", "POST")
        .header(
            "access-control-request-headers",
            "authorization,content-type",
        )
        .send()
        .await
        .unwrap();
    assert_eq!(
        preflight
            .headers()
            .get("access-control-allow-origin")
            .unwrap(),
        origin.as_str()
    );
    let reset = client
        .post(format!("{origin}/api/auth/request-password-reset"))
        .header("origin", &origin)
        .json(&json!({"email":email}))
        .send()
        .await
        .unwrap();
    assert_eq!(reset.status(), StatusCode::OK);
    let reset_url = url::Url::parse(&read_mail_url(&mail, "/reset-password/").await).unwrap();
    let reset_token = reset_url.path_segments().unwrap().next_back().unwrap();
    let new_password = "another-test-only-Password!456";
    let changed = client
        .post(format!("{origin}/api/auth/reset-password"))
        .header("origin", &origin)
        .json(&json!({"token":reset_token,"newPassword":new_password}))
        .send()
        .await
        .unwrap();
    assert_eq!(changed.status(), StatusCode::OK);
    assert_eq!(
        rpc(
            &client,
            &origin,
            "MembershipService/GetMembership",
            Some(&token),
            json!({})
        )
        .await
        .status(),
        StatusCode::UNAUTHORIZED
    );
    let old_password = client
        .post(format!("{origin}/api/auth/sign-in/email"))
        .header("origin", &origin)
        .json(&json!({"email":email,"password":password}))
        .send()
        .await
        .unwrap();
    assert_eq!(old_password.status(), StatusCode::UNAUTHORIZED);
    let new_login = client
        .post(format!("{origin}/api/auth/sign-in/email"))
        .header("origin", &origin)
        .json(&json!({"email":email,"password":new_password}))
        .send()
        .await
        .unwrap();
    assert_eq!(new_login.status(), StatusCode::OK);
    let token = new_login
        .headers()
        .get("set-auth-token")
        .unwrap()
        .to_str()
        .unwrap()
        .to_owned();
    let signed_out = client
        .post(format!("{origin}/api/auth/sign-out"))
        .header("origin", &origin)
        .bearer_auth(&token)
        .json(&json!({}))
        .send()
        .await
        .unwrap();
    assert_eq!(signed_out.status(), StatusCode::OK);
    assert_eq!(
        rpc(
            &client,
            &origin,
            "MembershipService/GetMembership",
            Some(&token),
            json!({})
        )
        .await
        .status(),
        StatusCode::UNAUTHORIZED
    );

    stop.send(()).unwrap();
    server.await.unwrap();
    database.close().await.unwrap();
}

async fn rpc(
    client: &Client,
    origin: &str,
    method: &str,
    token: Option<&str>,
    body: Value,
) -> reqwest::Response {
    let mut request = client
        .post(format!("{origin}/boji.v1.{method}"))
        .header("connect-protocol-version", "1")
        .json(&body);
    if let Some(token) = token {
        request = request.bearer_auth(token);
    }
    request.send().await.unwrap()
}

async fn read_mail_url(directory: &TempDir, path: &str) -> String {
    for _ in 0..50 {
        for entry in std::fs::read_dir(directory.path()).unwrap() {
            let text = std::fs::read_to_string(entry.unwrap().path()).unwrap();
            for word in text.split_whitespace() {
                if word.starts_with("http://") && word.contains(path) {
                    return word.to_owned();
                }
            }
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
    panic!("Expected local test email was not produced");
}
