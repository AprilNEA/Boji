//! End-to-end contracts against a dedicated PostgreSQL database and real HTTP.

use aip_193::proto::ErrorInfo;
use base64::{Engine, engine::general_purpose::STANDARD_NO_PAD};
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
            mail: boji_bizserver::mail::MailTransport::Files {
                directory: mail.path().to_owned(),
            },
            client_ip: auth::ClientIp::default(),
            apple: None,
            google: None,
            account_linking: auth::AccountLinking::Disabled,
        },
    )
    .await
    .unwrap();
    let router = app::router(
        database.clone(),
        authentication,
        std::slice::from_ref(&origin),
        boji_bizserver::rpc::Capabilities::default(),
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
        "SystemService/GetServerConfig",
        None,
        json!({"name":"serverConfig"}),
    )
    .await;
    assert_eq!(response.status(), StatusCode::OK);
    let config: p::ServerConfig = response.json().await.unwrap();
    assert_eq!(config.name, "serverConfig");
    assert!(
        !config.apple_login_enabled && !config.wallet_pass_enabled && config.activity_sync_enabled
    );
    assert_eq!(
        rpc(
            &client,
            &origin,
            "MembershipService/ListMemberships",
            None,
            json!({"parent":"users/me"})
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
            "MembershipService/ListMemberships",
            Some(raw_token),
            json!({"parent":"users/me"})
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

    let enrollment = json!({"parent":"users/me","membership":{"nickname":"RPC Test","termsVersion":"community-v1"}});
    let response = rpc(
        &client,
        &origin,
        "MembershipService/CreateMembership",
        Some(&token),
        enrollment.clone(),
    )
    .await;
    assert_eq!(response.status(), StatusCode::OK);
    let first: Value = response.json().await.unwrap();
    let membership_name = first["name"].as_str().unwrap().to_owned();
    assert!(membership_name.starts_with("users/") && membership_name.contains("/memberships/"));
    assert!(first["memberNumber"].is_string());
    assert_eq!(first["state"], "ACTIVE");
    assert_eq!(first["entitlements"].as_array().unwrap().len(), 3);
    let second = rpc(
        &client,
        &origin,
        "MembershipService/CreateMembership",
        Some(&token),
        enrollment,
    )
    .await;
    assert_eq!(second.status(), StatusCode::CONFLICT);
    let second: Value = second.json().await.unwrap();
    assert_eq!(second["code"], "already_exists");
    let listed: Value = rpc(
        &client,
        &origin,
        "MembershipService/ListMemberships",
        Some(&token),
        json!({"parent":"users/me"}),
    )
    .await
    .json()
    .await
    .unwrap();
    assert_eq!(listed["memberships"][0], first);
    // The same generated route also accepts binary protobuf.
    let request = p::GetMembershipRequest {
        name: membership_name.clone(),
        ..Default::default()
    };
    let binary = client
        .post(format!("{origin}/boji.v1.MembershipService/GetMembership"))
        .bearer_auth(&token)
        .header("content-type", "application/proto")
        .header("connect-protocol-version", "1")
        .body(buffa::Message::encode_to_vec(&request))
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
    let card = <p::Membership as buffa::Message>::decode_from_slice(&binary.bytes().await.unwrap())
        .unwrap();
    assert_eq!(card.name, membership_name);

    assert_eq!(
        rpc(
            &client,
            &origin,
            "ActivityService/SyncActivities",
            Some(&token),
            json!({"parent":"users/me"})
        )
        .await
        .status(),
        StatusCode::BAD_REQUEST
    );
    assert_eq!(
        rpc(
            &client,
            &origin,
            "ActivityService/UpdateSyncState",
            Some(&token),
            json!({"syncState":{"name":"users/me/syncState","enabled":true}})
        )
        .await
        .status(),
        StatusCode::BAD_REQUEST
    );
    assert_eq!(
        rpc(
            &client,
            &origin,
            "ActivityService/UpdateSyncState",
            Some(&token),
            json!({"syncState":{"name":"users/me/syncState","enabled":true,"consentVersion":"activity-sync-v1"}})
        )
        .await
        .status(),
        StatusCode::OK
    );
    let now = chrono::Utc::now();
    let request_id = Uuid::new_v4().to_string();
    let activity_name = format!("users/me/activities/{}", Uuid::new_v4());
    let write = json!({"requestId":request_id,"upsert":{"name":activity_name,"occurTime":now.to_rfc3339(),"timeZone":"UTC","source":"MANUAL","hydration":{"amountMl":250}}});
    let response = rpc(
        &client,
        &origin,
        "ActivityService/BatchWriteActivities",
        Some(&token),
        json!({"parent":"users/me","writes":[write.clone()]}),
    )
    .await;
    assert_eq!(response.status(), StatusCode::OK);
    let first_mutation: Value = response.json().await.unwrap();
    let result = &first_mutation["writeResults"][0];
    assert!(result["status"].get("code").is_none(), "{first_mutation}");
    let etag = result["etag"].as_str().unwrap().to_owned();
    let stored_name = result["activity"].as_str().unwrap().to_owned();
    let retry: Value = rpc(
        &client,
        &origin,
        "ActivityService/BatchWriteActivities",
        Some(&token),
        json!({"parent":"users/me","writes":[write.clone()]}),
    )
    .await
    .json()
    .await
    .unwrap();
    assert_eq!(first_mutation, retry);
    // A stale etag fails only its own write, and the result carries the
    // current etag.
    let mut stale = write.clone();
    stale["requestId"] = json!(Uuid::new_v4().to_string());
    stale["etag"] = json!("\"99\"");
    let stale: Value = rpc(
        &client,
        &origin,
        "ActivityService/BatchWriteActivities",
        Some(&token),
        json!({"parent":"users/me","writes":[stale]}),
    )
    .await
    .json()
    .await
    .unwrap();
    let stale = &stale["writeResults"][0];
    assert_eq!(stale["status"]["code"], 10, "ABORTED: {stale}");
    assert!(
        stale["status"]
            .to_string()
            .contains("ACTIVITY_ETAG_MISMATCH"),
        "{stale}"
    );
    assert_eq!(stale["etag"], etag);
    // A resource name of another user fails before the lookup.
    let foreign = rpc(
        &client,
        &origin,
        "ActivityService/GetActivity",
        Some(&token),
        json!({"name":format!("users/{}/activities/{}", Uuid::new_v4(), Uuid::new_v4())}),
    )
    .await;
    assert_eq!(foreign.status(), StatusCode::FORBIDDEN);
    let foreign: Value = foreign.json().await.unwrap();
    assert_eq!(foreign["code"], "permission_denied");
    assert_eq!(foreign["details"][0]["type"], "google.rpc.ErrorInfo");
    let bytes = STANDARD_NO_PAD
        .decode(
            foreign["details"][0]["value"]
                .as_str()
                .unwrap()
                .trim_end_matches('='),
        )
        .unwrap();
    let info = <ErrorInfo as buffa::Message>::decode_from_slice(&bytes).unwrap();
    assert_eq!(info.reason, "RESOURCE_ACCESS_DENIED");
    assert_eq!(info.domain, "boji.leanmuscle.club");
    let changes: Value = rpc(
        &client,
        &origin,
        "ActivityService/SyncActivities",
        Some(&token),
        json!({"parent":"users/me"}),
    )
    .await
    .json()
    .await
    .unwrap();
    assert_eq!(changes["activities"].as_array().unwrap().len(), 1);
    assert_eq!(changes["activities"][0]["name"], stored_name);
    assert_eq!(changes["activities"][0]["etag"], etag);
    let fetched: Value = rpc(
        &client,
        &origin,
        "ActivityService/GetActivity",
        Some(&token),
        json!({"name":activity_name}),
    )
    .await
    .json()
    .await
    .unwrap();
    assert_eq!(fetched, changes["activities"][0]);
    let day = json!({"year":chrono::Datelike::year(&now),"month":chrono::Datelike::month(&now),"day":chrono::Datelike::day(&now)});
    let days: Value = rpc(
        &client,
        &origin,
        "ActivityService/SummarizeActivities",
        Some(&token),
        json!({"parent":"users/me","startDate":day,"endDate":day}),
    )
    .await
    .json()
    .await
    .unwrap();
    assert_eq!(days["dailySummaries"][0]["waterMl"], 250);
    let mut invalid = write;
    invalid["upsert"]["source"] = json!("HEALTHKIT");
    let rejected = rpc(
        &client,
        &origin,
        "ActivityService/BatchWriteActivities",
        Some(&token),
        json!({"parent":"users/me","writes":[invalid]}),
    )
    .await;
    assert_eq!(rejected.status(), StatusCode::BAD_REQUEST);
    // The framework rejects an undecodable request before the service runs,
    // so the error carries no `ErrorInfo`.
    let rejected: Value = rejected.json().await.unwrap();
    assert_eq!(rejected["code"], "invalid_argument");
    assert!(rejected.get("details").is_none(), "{rejected}");
    let deleted: Value = rpc(
        &client,
        &origin,
        "ActivityService/BatchWriteActivities",
        Some(&token),
        json!({"parent":"users/me","writes":[{"requestId":Uuid::new_v4().to_string(),"deletion":activity_name,"etag":etag}]}),
    )
    .await
    .json()
    .await
    .unwrap();
    assert!(
        deleted["writeResults"][0]["status"].get("code").is_none(),
        "{deleted}"
    );
    let changes: Value = rpc(
        &client,
        &origin,
        "ActivityService/SyncActivities",
        Some(&token),
        json!({"parent":"users/me","syncToken":changes["nextSyncToken"]}),
    )
    .await
    .json()
    .await
    .unwrap();
    assert!(changes["activities"][0]["deleteTime"].is_string());
    let listed: Value = rpc(
        &client,
        &origin,
        "ActivityService/ListActivities",
        Some(&token),
        json!({"parent":"users/me"}),
    )
    .await
    .json()
    .await
    .unwrap();
    assert!(
        listed.get("activities").is_none(),
        "ListActivities omits deleted activities"
    );

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
            "MembershipService/ListMemberships",
            Some(&token),
            json!({"parent":"users/me"})
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
            "MembershipService/ListMemberships",
            Some(&token),
            json!({"parent":"users/me"})
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
