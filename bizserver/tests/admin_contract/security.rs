//! Authorization, validation, and inactive-catalog administration contracts.

use super::{
    ADMIN_ENTITLEMENTS, ADMIN_MEMBERSHIPS,
    admin_harness::{Harness, Identity},
    assert_connect_error, assert_field_violation, catalog, last_segment, ok_json,
};
use chrono::Utc;
use reqwest::{
    Response, StatusCode,
    header::{AUTHORIZATION, HeaderMap, HeaderValue},
};
use serde_json::{Value, json};
use uuid::Uuid;

const GET_MEMBERSHIP: &str = "boji.admin.v1.MembershipService/GetMembership";

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn admin_authentication_and_permission_gates_precede_target_lookup() {
    let mut harness = Harness::setup().await;
    let caller = harness.register_verified("authorization").await;
    let protected = json!({"name":format!("users/-/memberships/{}", Uuid::new_v4())});

    assert_connect_error(
        harness
            .rpc_json(GET_MEMBERSHIP, None, protected.clone())
            .await,
        StatusCode::UNAUTHORIZED,
        "unauthenticated",
        "SESSION_REQUIRED",
    )
    .await;
    let cookie_only = harness
        .client
        .post(harness.rpc_url(GET_MEMBERSHIP))
        .header("connect-protocol-version", "1")
        .header(
            "cookie",
            format!("better-auth.session_token={}", caller.token),
        )
        .json(&protected)
        .send()
        .await
        .expect("send cookie-only request");
    assert_connect_error(
        cookie_only,
        StatusCode::UNAUTHORIZED,
        "unauthenticated",
        "SESSION_REQUIRED",
    )
    .await;
    assert_connect_error(
        harness
            .rpc_json(GET_MEMBERSHIP, Some(&caller.raw_token), protected.clone())
            .await,
        StatusCode::UNAUTHORIZED,
        "unauthenticated",
        "SESSION_REQUIRED",
    )
    .await;
    assert_connect_error(
        duplicate_authorization(&harness, &caller, protected.clone()).await,
        StatusCode::UNAUTHORIZED,
        "unauthenticated",
        "SESSION_REQUIRED",
    )
    .await;

    harness.set_role(&caller.user_id, "operator").await;
    harness.set_email_verified(&caller.user_id, false).await;
    assert_connect_error(
        harness
            .rpc_json(GET_MEMBERSHIP, Some(&caller.token), protected.clone())
            .await,
        StatusCode::FORBIDDEN,
        "permission_denied",
        "EMAIL_NOT_VERIFIED",
    )
    .await;
    harness.set_email_verified(&caller.user_id, true).await;
    harness
        .set_session_created_at(&caller.user_id, Utc::now() - chrono::Duration::minutes(16))
        .await;
    assert_connect_error(
        harness
            .rpc_json(GET_MEMBERSHIP, Some(&caller.token), protected.clone())
            .await,
        StatusCode::FORBIDDEN,
        "permission_denied",
        "FRESH_SESSION_REQUIRED",
    )
    .await;
    harness
        .set_session_created_at(&caller.user_id, Utc::now())
        .await;
    // An operator reaches validation. Other roles fail the permission gate
    // first, even with an invalid name.
    invalid(
        &harness,
        &caller,
        GET_MEMBERSHIP,
        json!({"name":"not-a-name"}),
        "name",
        "INVALID_INPUT",
    )
    .await;
    for role in ["user", "unexpected-role"] {
        harness.set_role(&caller.user_id, role).await;
        for request in [protected.clone(), json!({"name":"not-a-name"})] {
            assert_connect_error(
                harness
                    .rpc_json(GET_MEMBERSHIP, Some(&caller.token), request)
                    .await,
                StatusCode::FORBIDDEN,
                "permission_denied",
                "ADMIN_FORBIDDEN",
            )
            .await;
        }
    }
    harness.set_role(&caller.user_id, "admin").await;
    ok_json(
        harness
            .rpc_json(
                &format!("{ADMIN_MEMBERSHIPS}/ListMemberships"),
                Some(&caller.token),
                json!({"parent":"users/-","pageSize":1}),
            )
            .await,
    )
    .await;
    harness.set_role(&caller.user_id, "operator").await;
    harness.revoke_sessions(&caller.user_id).await;
    assert_connect_error(
        harness
            .rpc_json(GET_MEMBERSHIP, Some(&caller.token), protected)
            .await,
        StatusCode::UNAUTHORIZED,
        "unauthenticated",
        "SESSION_REQUIRED",
    )
    .await;

    harness.shutdown().await;
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn admin_validates_names_reasons_expiry_filters_and_catalog_rules() {
    let mut harness = Harness::setup().await;
    let operator = harness.register_verified("validation-operator").await;
    harness.set_role(&operator.user_id, "operator").await;
    let owner = harness.register_verified("validation-owner").await;
    let card = harness.enroll(&owner, "Validation owner").await;
    let entries = catalog(&harness, &operator).await;
    let entitlement = entries[0]["name"]
        .as_str()
        .expect("catalog name")
        .to_owned();
    let suspend = format!("{ADMIN_MEMBERSHIPS}/SuspendMembership");
    let resume = format!("{ADMIN_MEMBERSHIPS}/ResumeMembership");
    let grant = format!("{ADMIN_MEMBERSHIPS}/GrantEntitlement");
    let list = format!("{ADMIN_MEMBERSHIPS}/ListMemberships");

    for reason in [" ", "has\ncontrol", &"x".repeat(501)] {
        invalid(
            &harness,
            &operator,
            &suspend,
            json!({"name":card.name,"reason":reason}),
            "reason",
            "INVALID_INPUT",
        )
        .await;
    }
    invalid(
        &harness,
        &operator,
        &suspend,
        json!({"name":format!("users/{}/memberships/not-a-uuid", owner.user_id),"reason":"valid"}),
        "name",
        "INVALID_INPUT",
    )
    .await;
    invalid(
        &harness,
        &operator,
        &suspend,
        json!({"name":format!("memberships/{}", card.membership_id),"reason":"valid"}),
        "name",
        "INVALID_INPUT",
    )
    .await;
    invalid(
        &harness,
        &operator,
        &grant,
        json!({"parent":card.name,"entitlement":"entitlements/not-a-uuid","reason":"valid"}),
        "entitlement",
        "INVALID_INPUT",
    )
    .await;
    invalid(
        &harness,
        &operator,
        &grant,
        json!({"parent":card.name,"entitlement":entitlement,
            "expireTime":"2000-01-01T00:00:00Z","reason":"valid"}),
        "expire_time",
        "INVALID_INPUT",
    )
    .await;
    invalid(
        &harness,
        &operator,
        &list,
        json!({"parent":"users/-","pageSize":-1}),
        "page_size",
        "INVALID_INPUT",
    )
    .await;
    invalid(
        &harness,
        &operator,
        &list,
        json!({"parent":"users/-","view":7}),
        "view",
        "INVALID_INPUT",
    )
    .await;
    for filter in [
        "state = active",
        "nickname = \"x\"",
        "state = ACTIVE OR state = SUSPENDED",
    ] {
        invalid(
            &harness,
            &operator,
            &list,
            json!({"parent":"users/-","filter":filter}),
            "filter",
            "INVALID_FILTER",
        )
        .await;
    }
    invalid(
        &harness,
        &operator,
        &format!("{ADMIN_ENTITLEMENTS}/ListEntitlements"),
        json!({"pageToken":"not-an-opaque-token"}),
        "page_token",
        "INVALID_PAGE_TOKEN",
    )
    .await;

    let large = ok_json(
        harness
            .rpc_json(
                &list,
                Some(&operator.token),
                json!({"parent":"users/-","pageSize":1000}),
            )
            .await,
    )
    .await;
    assert_eq!(large["memberships"].as_array().expect("cards").len(), 1);
    let suspended = ok_json(
        harness
            .rpc_json(
                &list,
                Some(&operator.token),
                json!({"parent":"users/-","filter":"state = SUSPENDED"}),
            )
            .await,
    )
    .await;
    assert!(suspended.get("memberships").is_none());
    let mine = ok_json(
        harness
            .rpc_json(
                &list,
                Some(&operator.token),
                json!({"parent":format!("users/{}", owner.user_id),"filter":"state = ACTIVE"}),
            )
            .await,
    )
    .await;
    assert_eq!(mine["memberships"][0]["name"], card.name);

    let missing = format!("users/-/memberships/{}", Uuid::new_v4());
    let other_owner = format!(
        "users/{}/memberships/{}",
        operator.user_id, card.membership_id
    );
    for name in [&missing, &other_owner] {
        assert_connect_error(
            harness
                .rpc_json(GET_MEMBERSHIP, Some(&operator.token), json!({"name":name}))
                .await,
            StatusCode::NOT_FOUND,
            "not_found",
            "MEMBERSHIP_NOT_FOUND",
        )
        .await;
    }
    assert_connect_error(
        harness
            .rpc_json(
                &suspend,
                Some(&operator.token),
                json!({"name":other_owner,"reason":"valid"}),
            )
            .await,
        StatusCode::NOT_FOUND,
        "not_found",
        "MEMBERSHIP_NOT_FOUND",
    )
    .await;
    assert_connect_error(
        harness
            .rpc_json(
                &grant,
                Some(&operator.token),
                json!({"parent":card.name,"entitlement":format!("entitlements/{}", Uuid::new_v4()),"reason":"valid"}),
            )
            .await,
        StatusCode::NOT_FOUND,
        "not_found",
        "ENTITLEMENT_NOT_FOUND",
    )
    .await;
    assert_connect_error(
        harness
            .rpc_json(
                &format!("{ADMIN_MEMBERSHIPS}/GetEntitlementGrant"),
                Some(&operator.token),
                json!({"name":format!("{}/entitlementGrants/{}", card.name, Uuid::new_v4())}),
            )
            .await,
        StatusCode::NOT_FOUND,
        "not_found",
        "ENTITLEMENT_GRANT_NOT_FOUND",
    )
    .await;
    assert_eq!(
        harness.audit_count().await,
        0,
        "rejected requests write no audit event"
    );

    assert_connect_error(
        harness
            .rpc_json(
                &resume,
                Some(&operator.token),
                json!({"name":card.name,"reason":"valid"}),
            )
            .await,
        StatusCode::BAD_REQUEST,
        "failed_precondition",
        "MEMBERSHIP_ALREADY_ACTIVE",
    )
    .await;

    let entitlement_id = Uuid::parse_str(last_segment(&entitlement)).expect("catalog UUID");
    harness.set_entitlement_active(entitlement_id, false).await;
    assert_connect_error(
        harness
            .rpc_json(
                &grant,
                Some(&operator.token),
                json!({"parent":card.name,"entitlement":entitlement,"reason":"new access blocked"}),
            )
            .await,
        StatusCode::BAD_REQUEST,
        "failed_precondition",
        "ENTITLEMENT_INACTIVE",
    )
    .await;
    let revoked = ok_json(
        harness
            .rpc_json(
                &format!("{ADMIN_MEMBERSHIPS}/RevokeEntitlementGrant"),
                Some(&operator.token),
                json!({
                    "name":format!("{}/entitlementGrants/{}", card.name, entitlement_id),
                    "reason":"  inactive catalog cleanup  ",
                }),
            )
            .await,
    )
    .await;
    assert!(revoked["revokeTime"].is_string());
    assert_eq!(
        harness.latest_audit().await,
        (
            "membership.entitlement.revoked".into(),
            "inactive catalog cleanup".into()
        )
    );
    assert_eq!(harness.audit_count().await, 1);

    harness.shutdown().await;
}

async fn invalid(
    harness: &Harness,
    caller: &Identity,
    method: &str,
    request: Value,
    field: &str,
    reason: &str,
) {
    let body = assert_connect_error(
        harness.rpc_json(method, Some(&caller.token), request).await,
        StatusCode::BAD_REQUEST,
        "invalid_argument",
        reason,
    )
    .await;
    assert_field_violation(&body, field);
}

async fn duplicate_authorization(harness: &Harness, identity: &Identity, body: Value) -> Response {
    let mut headers = HeaderMap::new();
    let value = HeaderValue::from_str(&format!("Bearer {}", identity.token))
        .expect("signed Authorization header");
    headers.append(AUTHORIZATION, value.clone());
    headers.append(AUTHORIZATION, value);
    harness
        .client
        .post(harness.rpc_url(GET_MEMBERSHIP))
        .header("connect-protocol-version", "1")
        .headers(headers)
        .json(&body)
        .send()
        .await
        .expect("send duplicate Authorization request")
}
