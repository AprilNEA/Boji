//! Concurrent mutation and transaction-rollback administration contracts.

use super::{
    ADMIN_MEMBERSHIPS, MEMBERSHIPS, admin_harness::Harness, assert_connect_error, ok_json,
};
use reqwest::StatusCode;
use serde_json::json;

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn concurrent_identical_suspensions_write_one_audit_event() {
    let mut harness = Harness::setup().await;
    let operator = harness.register_verified("concurrent-operator").await;
    harness.set_role(&operator.user_id, "operator").await;
    let owner = harness.register_verified("concurrent-owner").await;
    let card = harness.enroll(&owner, "Concurrent owner").await;
    let request = json!({"name":card.name,"reason":"same concurrent suspension"});

    let method = format!("{ADMIN_MEMBERSHIPS}/SuspendMembership");
    let (left, right) = tokio::join!(
        harness.rpc_json(&method, Some(&operator.token), request.clone()),
        harness.rpc_json(&method, Some(&operator.token), request.clone()),
    );
    let (succeeded, failed) = if left.status() == StatusCode::OK {
        (left, right)
    } else {
        (right, left)
    };
    assert_eq!(ok_json(succeeded).await["state"], "SUSPENDED");
    assert_connect_error(
        failed,
        StatusCode::BAD_REQUEST,
        "failed_precondition",
        "MEMBERSHIP_ALREADY_SUSPENDED",
    )
    .await;
    assert_eq!(harness.audit_count().await, 1);

    assert_connect_error(
        harness
            .rpc_json(&method, Some(&operator.token), request)
            .await,
        StatusCode::BAD_REQUEST,
        "failed_precondition",
        "MEMBERSHIP_ALREADY_SUSPENDED",
    )
    .await;
    assert_eq!(harness.audit_count().await, 1);

    harness.shutdown().await;
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn audit_write_failure_rolls_back_the_admin_mutation() {
    let mut harness = Harness::setup().await;
    let operator = harness.register_verified("rollback-operator").await;
    harness.set_role(&operator.user_id, "operator").await;
    let owner = harness.register_verified("rollback-owner").await;
    let card = harness.enroll(&owner, "Rollback owner").await;
    harness.make_audit_insert_fail().await;

    assert_connect_error(
        harness
            .rpc_json(
                &format!("{ADMIN_MEMBERSHIPS}/SuspendMembership"),
                Some(&operator.token),
                json!({"name":card.name,"reason":"prove transaction rollback"}),
            )
            .await,
        StatusCode::INTERNAL_SERVER_ERROR,
        "internal",
        "INTERNAL_ERROR",
    )
    .await;
    let own_card = ok_json(
        harness
            .rpc_json(
                &format!("{MEMBERSHIPS}/GetMembership"),
                Some(&owner.token),
                json!({"name":format!("users/me/memberships/{}", card.membership_id)}),
            )
            .await,
    )
    .await;
    assert_eq!(own_card["state"], "ACTIVE");
    assert_eq!(
        own_card["entitlements"]
            .as_array()
            .expect("entitlements")
            .len(),
        3
    );
    assert!(harness.session_is_active(&owner.user_id).await);
    assert_eq!(harness.audit_count().await, 0);

    harness.shutdown().await;
}
