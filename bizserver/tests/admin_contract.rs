//! End-to-end `boji.admin.v1` contracts over real HTTP and PostgreSQL.
//!
//! Every test creates an isolated schema in the database named by the explicit
//! `TEST_DATABASE_URL` environment variable. The tests are ignored by default.

#[path = "support/admin_harness.rs"]
mod admin_harness;
#[path = "admin_contract/lifecycle.rs"]
mod lifecycle;
#[path = "admin_contract/mutations.rs"]
mod mutations;
#[path = "admin_contract/policy.rs"]
mod policy;
#[path = "admin_contract/security.rs"]
mod security;

use admin_harness::{Harness, Identity};
use base64::{Engine, engine::general_purpose::STANDARD_NO_PAD};
use boji_bizserver::proto::google::rpc::{BadRequest, ErrorInfo};
use buffa::Message;
use chrono::{DateTime, Utc};
use reqwest::{Response, StatusCode};
use serde_json::{Value, json};

const ADMIN_MEMBERSHIPS: &str = "boji.admin.v1.MembershipService";
const ADMIN_ENTITLEMENTS: &str = "boji.admin.v1.EntitlementService";
const MEMBERSHIPS: &str = "boji.v1.MembershipService";
const ACTIVITIES: &str = "boji.v1.ActivityService";

/// Return every catalog entry.
async fn catalog(harness: &Harness, operator: &Identity) -> Vec<Value> {
    let body = ok_json(
        harness
            .rpc_json(
                &format!("{ADMIN_ENTITLEMENTS}/ListEntitlements"),
                Some(&operator.token),
                json!({"pageSize":100}),
            )
            .await,
    )
    .await;
    body["entitlements"]
        .as_array()
        .expect("catalog entries")
        .clone()
}

/// Return the resource name of the catalog entry with `code`.
fn entitlement_name(catalog: &[Value], code: &str) -> String {
    catalog
        .iter()
        .find(|entry| entry["code"] == code)
        .and_then(|entry| entry["name"].as_str())
        .unwrap_or_else(|| panic!("catalog entry {code}"))
        .to_owned()
}

/// Return the last segment of a resource name.
fn last_segment(name: &str) -> &str {
    name.rsplit('/').next().expect("resource ID segment")
}

async fn ok_json(response: Response) -> Value {
    let status = response.status();
    let body: Value = response.json().await.expect("Connect JSON body");
    assert_eq!(status, StatusCode::OK, "expected success, got {body}");
    body
}

/// Assert a Connect error with an AIP-193 `ErrorInfo` and return its body.
async fn assert_connect_error(
    response: Response,
    status: StatusCode,
    code: &str,
    reason: &str,
) -> Value {
    let actual = response.status();
    let body: Value = response.json().await.expect("Connect error JSON body");
    assert_eq!(actual, status, "unexpected HTTP status for {body}");
    assert_eq!(body["code"], code, "unexpected Connect code for {body}");
    let info: ErrorInfo = detail(&body, "google.rpc.ErrorInfo");
    assert_eq!(info.reason, reason, "unexpected reason for {body}");
    assert_eq!(info.domain, "boji.leanmuscle.club");
    body
}

/// Assert that an error names `field` in its `google.rpc.BadRequest`.
fn assert_field_violation(body: &Value, field: &str) {
    let request: BadRequest = detail(body, "google.rpc.BadRequest");
    assert!(
        request
            .field_violations
            .iter()
            .any(|violation| violation.field == field),
        "expected a violation of {field} in {body}"
    );
}

fn detail<T: Message + Default>(body: &Value, type_name: &str) -> T {
    let value = body["details"]
        .as_array()
        .expect("error details")
        .iter()
        .find(|detail| detail["type"] == type_name)
        .and_then(|detail| detail["value"].as_str())
        .unwrap_or_else(|| panic!("{type_name} detail in {body}"));
    let bytes = STANDARD_NO_PAD
        .decode(value.trim_end_matches('='))
        .expect("base64 error detail");
    T::decode_from_slice(&bytes).expect("protobuf error detail")
}

fn parse_rfc3339(value: &str) -> DateTime<Utc> {
    DateTime::parse_from_rfc3339(value)
        .expect("RFC 3339 timestamp")
        .with_timezone(&Utc)
}
