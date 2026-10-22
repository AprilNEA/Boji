//! `boji.v1.MembershipCodeService` and
//! `boji.admin.v1.MembershipService.VerifyMembershipCode`.
//!
//! The tests need the isolated PostgreSQL database named by
//! `TEST_DATABASE_URL`, so they are ignored by default. The dynamic code test
//! computes TOTP values with its own RFC 6238 code, as an app would, and checks
//! them with the server code.
#[path = "support/admin_harness.rs"]
mod admin_harness;
use admin_harness::Harness;
use aip_193::proto::ErrorInfo;
use base64::{
    Engine,
    engine::general_purpose::{STANDARD, STANDARD_NO_PAD},
};
use boji_bizserver::{
    domain::membership_code::{CodeKind, MembershipCodes, VerifiedCode},
    rpc::Capabilities,
};
use buffa::Message;
use chrono::{DateTime, Duration, Utc};
use openssl::{hash::MessageDigest, pkey::PKey, sign::Signer};
use reqwest::{Response, StatusCode};
use serde_json::{Value, json};
use std::sync::Arc;
use uuid::Uuid;

const GET_CODE: &str = "boji.v1.MembershipCodeService/GetMembershipCode";
const GET_SERVER_CONFIG: &str = "boji.v1.SystemService/GetServerConfig";
const VERIFY_CODE: &str = "boji.admin.v1.MembershipCodeService/VerifyMembershipCode";
const SUSPEND: &str = "boji.admin.v1.MembershipService/SuspendMembership";
const KEY: &[u8] = b"membership-code-contract-test-key-0123456789";

fn codes() -> MembershipCodes {
    MembershipCodes::new(KEY).expect("test key")
}

/// RFC 6238 with HMAC-SHA1 and steps from the Unix epoch, written apart from
/// the server code.
fn totp(secret: &[u8], digits: u32, period: i64, at: DateTime<Utc>) -> String {
    let step = u64::try_from(at.timestamp().div_euclid(period)).expect("time after 1970");
    let key = PKey::hmac(secret).expect("HMAC key");
    let mut signer = Signer::new(MessageDigest::sha1(), &key).expect("HMAC signer");
    signer.update(&step.to_be_bytes()).expect("HMAC update");
    let mac = signer.sign_to_vec().expect("HMAC");
    let offset = usize::from(mac[19] & 0x0f);
    let binary = u32::from_be_bytes([
        mac[offset] & 0x7f,
        mac[offset + 1],
        mac[offset + 2],
        mac[offset + 3],
    ]);
    let width = usize::try_from(digits).expect("digits");
    format!("{:0width$}", binary % 10_u32.pow(digits))
}

async fn ok_json(response: Response) -> Value {
    let status = response.status();
    let body: Value = response.json().await.expect("Connect JSON body");
    assert_eq!(status, StatusCode::OK, "expected success, got {body}");
    body
}

/// Assert a Connect error with an AIP-193 `ErrorInfo`.
async fn assert_connect_error(response: Response, status: StatusCode, code: &str, reason: &str) {
    let actual = response.status();
    let body: Value = response.json().await.expect("Connect error JSON body");
    assert_eq!(actual, status, "unexpected HTTP status for {body}");
    assert_eq!(body["code"], code, "unexpected Connect code for {body}");
    let value = body["details"]
        .as_array()
        .expect("error details")
        .iter()
        .find(|detail| detail["type"] == "google.rpc.ErrorInfo")
        .and_then(|detail| detail["value"].as_str())
        .unwrap_or_else(|| panic!("ErrorInfo detail in {body}"));
    let bytes = STANDARD_NO_PAD
        .decode(value.trim_end_matches('='))
        .expect("base64 error detail");
    let info = ErrorInfo::decode_from_slice(&bytes).expect("protobuf ErrorInfo");
    assert_eq!(info.reason, reason, "unexpected reason for {body}");
    assert_eq!(info.domain, "boji.leanmuscle.club");
}

async fn get_code(harness: &Harness, token: &str, name: &str) -> Response {
    harness
        .rpc_json(GET_CODE, Some(token), json!({ "name": name }))
        .await
}

async fn server_config(harness: &Harness) -> Value {
    ok_json(
        harness
            .rpc_json(GET_SERVER_CONFIG, None, json!({ "name": "serverConfig" }))
            .await,
    )
    .await
}

async fn verify(harness: &Harness, token: Option<&str>, code: &str) -> Response {
    harness
        .rpc_json(VERIFY_CODE, token, json!({ "code": code }))
        .await
}

/// Ask Better Auth whether the caller may read memberships, as the apps do
/// before they show the scanner.
async fn may_scan(harness: &Harness, token: &str) -> bool {
    let response = harness
        .client
        .post(format!("{}/api/auth/admin/has-permission", harness.origin))
        .bearer_auth(token)
        .json(&json!({ "permissions": { "membership": ["read"] } }))
        .send()
        .await
        .expect("send has-permission request");
    let body = ok_json(response).await;
    body["success"].as_bool().expect("success flag")
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn the_owner_reads_the_code_of_an_active_card() {
    let mut harness = Harness::with_capabilities(Capabilities {
        membership_codes: Some(Arc::new(codes())),
        ..Capabilities::default()
    })
    .await;
    assert_eq!(server_config(&harness).await["membershipCodeEnabled"], true);

    let owner = harness.register_verified("code-owner").await;
    let missing = format!("users/me/memberships/{}/code", Uuid::new_v4());
    assert_connect_error(
        get_code(&harness, &owner.token, &missing).await,
        StatusCode::NOT_FOUND,
        "not_found",
        "MEMBERSHIP_NOT_FOUND",
    )
    .await;

    let card = harness.enroll(&owner, "会员码测试").await;
    let code_name = format!("{}/code", card.name);
    assert_connect_error(
        get_code(&harness, &owner.token, &card.name).await,
        StatusCode::BAD_REQUEST,
        "invalid_argument",
        "INVALID_INPUT",
    )
    .await;
    let other = harness.register_verified("code-other").await;
    assert_connect_error(
        get_code(&harness, &other.token, &code_name).await,
        StatusCode::FORBIDDEN,
        "permission_denied",
        "RESOURCE_ACCESS_DENIED",
    )
    .await;

    let response = get_code(
        &harness,
        &owner.token,
        &format!("users/me/memberships/{}/code", card.membership_id),
    )
    .await;
    assert_eq!(
        response.headers()["cache-control"],
        "no-store",
        "a code must not be cached"
    );
    let body = ok_json(response).await;
    assert_eq!(body["name"], code_name);
    let id = Uuid::parse_str(&card.membership_id).expect("membership UUID");
    let codes = codes();

    let static_value = body["staticValue"].as_str().expect("static value");
    assert_eq!(static_value, codes.static_value(id).expect("static value"));
    assert!(
        static_value
            .chars()
            .all(|c| c.is_ascii_uppercase() || c.is_ascii_digit() || c == '.' || c == '-'),
        "a static value must fit the QR alphanumeric mode: {static_value}"
    );
    let now = Utc::now();
    assert_eq!(
        codes
            .verify(static_value, now)
            .expect("static value verifies"),
        VerifiedCode {
            kind: CodeKind::Static,
            membership_id: id
        }
    );

    let prefix = body["dynamicValuePrefix"].as_str().expect("prefix");
    assert_eq!(prefix, MembershipCodes::dynamic_prefix(id));
    let totp_params = &body["totp"];
    assert_eq!(totp_params["digits"], 8);
    assert_eq!(totp_params["period"], "30s");
    let secret = STANDARD
        .decode(totp_params["secret"].as_str().expect("base64 secret"))
        .expect("standard base64");
    assert_eq!(secret.len(), 20);
    let value = format!("{prefix}{}", totp(&secret, 8, 30, now));
    assert_eq!(
        codes.verify(&value, now).expect("dynamic value verifies"),
        VerifiedCode {
            kind: CodeKind::Dynamic,
            membership_id: id
        }
    );

    // The values depend only on the card and the key.
    let again = ok_json(get_code(&harness, &owner.token, &code_name).await).await;
    assert_eq!(again, body);
    assert!(!body.to_string().contains(&owner.email));

    harness
        .set_membership_status(&card.membership_id, "suspended")
        .await;
    assert_connect_error(
        get_code(&harness, &owner.token, &code_name).await,
        StatusCode::BAD_REQUEST,
        "failed_precondition",
        "MEMBERSHIP_SUSPENDED",
    )
    .await;
    harness.shutdown().await;
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn codes_need_a_server_key() {
    let mut harness = Harness::setup().await;
    // Connect JSON omits a false boolean.
    assert_ne!(server_config(&harness).await["membershipCodeEnabled"], true);

    let owner = harness.register_verified("code-no-key").await;
    // A missing card is reported before the missing key.
    let missing = format!("users/me/memberships/{}/code", Uuid::new_v4());
    assert_connect_error(
        get_code(&harness, &owner.token, &missing).await,
        StatusCode::NOT_FOUND,
        "not_found",
        "MEMBERSHIP_NOT_FOUND",
    )
    .await;
    let card = harness.enroll(&owner, "无密钥").await;
    assert_connect_error(
        get_code(&harness, &owner.token, &format!("{}/code", card.name)).await,
        StatusCode::BAD_REQUEST,
        "failed_precondition",
        "MEMBERSHIP_CODE_NOT_CONFIGURED",
    )
    .await;

    // Authorization comes before the key check.
    assert_connect_error(
        verify(&harness, Some(&owner.token), "BOJI.S.X.Y").await,
        StatusCode::FORBIDDEN,
        "permission_denied",
        "ADMIN_FORBIDDEN",
    )
    .await;
    let staff = harness.register_verified("code-no-key-staff").await;
    harness.set_role(&staff.user_id, "operator").await;
    assert_connect_error(
        verify(&harness, Some(&staff.token), "BOJI.S.X.Y").await,
        StatusCode::BAD_REQUEST,
        "failed_precondition",
        "MEMBERSHIP_CODE_NOT_CONFIGURED",
    )
    .await;
    harness.shutdown().await;
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn staff_verify_static_and_dynamic_codes() {
    let mut harness = Harness::with_capabilities(Capabilities {
        membership_codes: Some(Arc::new(codes())),
        ..Capabilities::default()
    })
    .await;
    let owner = harness.register_verified("verify-owner").await;
    let card = harness.enroll(&owner, "校验测试").await;
    let id = Uuid::parse_str(&card.membership_id).expect("membership UUID");
    let codes = codes();
    let static_value = codes.static_value(id).expect("static value");

    // Members cannot verify codes, not even their own, and learn nothing
    // about the value.
    assert_connect_error(
        verify(&harness, None, &static_value).await,
        StatusCode::UNAUTHORIZED,
        "unauthenticated",
        "SESSION_REQUIRED",
    )
    .await;
    assert_connect_error(
        verify(&harness, Some(&owner.token), &static_value).await,
        StatusCode::FORBIDDEN,
        "permission_denied",
        "ADMIN_FORBIDDEN",
    )
    .await;
    assert!(!may_scan(&harness, &owner.token).await);

    let staff = harness.register_verified("verify-staff").await;
    harness.set_role(&staff.user_id, "operator").await;
    assert!(may_scan(&harness, &staff.token).await);

    let body = ok_json(verify(&harness, Some(&staff.token), &static_value).await).await;
    assert_eq!(body["codeKind"], "MEMBERSHIP_CODE_KIND_STATIC");
    let membership = &body["membership"];
    assert_eq!(membership["name"], card.name);
    assert_eq!(membership["memberNumber"], card.member_number);
    assert_eq!(membership["nickname"], "校验测试");
    assert_eq!(membership["state"], "ACTIVE");
    assert!(
        membership.get("entitlements").is_none(),
        "the basic view: {body}"
    );
    assert!(!body.to_string().contains(&owner.email));

    // Scanners can read a lower-case value with white space around it.
    let relaxed = format!("  {}\n", static_value.to_ascii_lowercase());
    ok_json(verify(&harness, Some(&staff.token), &relaxed).await).await;

    // The dynamic code, as the member app computes it.
    let params =
        ok_json(get_code(&harness, &owner.token, &format!("{}/code", card.name)).await).await;
    let prefix = params["dynamicValuePrefix"].as_str().expect("prefix");
    let secret = STANDARD
        .decode(params["totp"]["secret"].as_str().expect("secret"))
        .expect("standard base64");
    let now = Utc::now();
    let current = format!("{prefix}{}", totp(&secret, 8, 30, now));
    let body = ok_json(verify(&harness, Some(&staff.token), &current).await).await;
    assert_eq!(body["codeKind"], "MEMBERSHIP_CODE_KIND_DYNAMIC");
    assert_eq!(body["membership"]["name"], card.name);

    let old = format!(
        "{prefix}{}",
        totp(&secret, 8, 30, now - Duration::minutes(3))
    );
    assert_connect_error(
        verify(&harness, Some(&staff.token), &old).await,
        StatusCode::BAD_REQUEST,
        "failed_precondition",
        "MEMBERSHIP_CODE_EXPIRED",
    )
    .await;

    let mut forged = static_value.clone();
    let last = if forged.ends_with('0') { '1' } else { '0' };
    forged.pop();
    forged.push(last);
    for value in [
        forged.as_str(),
        "",
        "BOJI.S.NOT-A-UUID.00",
        &"A".repeat(300),
    ] {
        assert_connect_error(
            verify(&harness, Some(&staff.token), value).await,
            StatusCode::BAD_REQUEST,
            "invalid_argument",
            "MEMBERSHIP_CODE_INVALID",
        )
        .await;
    }

    // A genuine code of a card that does not exist.
    let gone = codes.static_value(Uuid::new_v4()).expect("static value");
    assert_connect_error(
        verify(&harness, Some(&staff.token), &gone).await,
        StatusCode::NOT_FOUND,
        "not_found",
        "MEMBERSHIP_NOT_FOUND",
    )
    .await;

    // A suspended card still verifies and reports its state.
    harness
        .set_membership_status(&card.membership_id, "suspended")
        .await;
    let body = ok_json(verify(&harness, Some(&staff.token), &static_value).await).await;
    assert_eq!(body["membership"]["state"], "SUSPENDED");

    // Verification accepts a session from earlier in the day. State changes
    // still need a session from the last 15 minutes.
    harness
        .set_session_created_at(&staff.user_id, Utc::now() - Duration::hours(2))
        .await;
    ok_json(verify(&harness, Some(&staff.token), &static_value).await).await;
    assert_connect_error(
        harness
            .rpc_json(
                SUSPEND,
                Some(&staff.token),
                json!({ "name": card.name, "reason": "contract test" }),
            )
            .await,
        StatusCode::FORBIDDEN,
        "permission_denied",
        "FRESH_SESSION_REQUIRED",
    )
    .await;
    harness
        .set_session_created_at(&staff.user_id, Utc::now() - Duration::hours(13))
        .await;
    assert_connect_error(
        verify(&harness, Some(&staff.token), &static_value).await,
        StatusCode::FORBIDDEN,
        "permission_denied",
        "FRESH_SESSION_REQUIRED",
    )
    .await;
    harness.shutdown().await;
}
