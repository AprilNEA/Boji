//! Additional application policies and PostgreSQL precision regressions.

use super::{
    ADMIN_MEMBERSHIPS, admin_harness::Harness, assert_connect_error, catalog, last_segment, ok_json,
};
use boji_bizserver::auth_schema::{session, user};
use chrono::{SecondsFormat, Timelike, Utc};
use reqwest::StatusCode;
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter, sea_query::Expr};
use serde_json::json;

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn operators_cannot_escalate_roles_or_use_banned_or_impersonated_sessions() {
    let mut h = Harness::setup().await;
    let actor = h.register_verified("policy").await;
    for role in ["operator", "admin"] {
        h.set_role(&actor.user_id, role).await;
        let response = h
            .client
            .post(format!("{}/api/auth/admin/set-role", h.origin))
            .header("origin", &h.origin)
            .bearer_auth(&actor.token)
            .json(&json!({"userId":actor.user_id,"role":"admin"}))
            .send()
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::FORBIDDEN);
    }
    h.set_role(&actor.user_id, "operator").await;
    let method = format!("{ADMIN_MEMBERSHIPS}/ListMemberships");
    let request = json!({"parent":"users/-","pageSize":1});
    user::Entity::update_many()
        .col_expr(user::Column::Banned, Expr::value(true))
        .filter(user::Column::Id.eq(&actor.user_id))
        .exec(&h.database)
        .await
        .unwrap();
    assert_connect_error(
        h.rpc_json(&method, Some(&actor.token), request.clone())
            .await,
        StatusCode::FORBIDDEN,
        "permission_denied",
        "ADMIN_FORBIDDEN",
    )
    .await;
    user::Entity::update_many()
        .col_expr(user::Column::Banned, Expr::value(false))
        .filter(user::Column::Id.eq(&actor.user_id))
        .exec(&h.database)
        .await
        .unwrap();
    session::Entity::update_many()
        .col_expr(
            session::Column::ImpersonatedBy,
            Expr::value(actor.user_id.clone()),
        )
        .filter(session::Column::UserId.eq(&actor.user_id))
        .exec(&h.database)
        .await
        .unwrap();
    assert_connect_error(
        h.rpc_json(&method, Some(&actor.token), request.clone())
            .await,
        StatusCode::FORBIDDEN,
        "permission_denied",
        "ADMIN_FORBIDDEN",
    )
    .await;
    session::Entity::update_many()
        .col_expr(session::Column::ImpersonatedBy, Expr::value(None::<String>))
        .filter(session::Column::UserId.eq(&actor.user_id))
        .exec(&h.database)
        .await
        .unwrap();
    h.set_session_created_at(&actor.user_id, Utc::now() + chrono::Duration::minutes(1))
        .await;
    assert_connect_error(
        h.rpc_json(&method, Some(&actor.token), request).await,
        StatusCode::FORBIDDEN,
        "permission_denied",
        "FRESH_SESSION_REQUIRED",
    )
    .await;
    h.shutdown().await;
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn grant_retries_normalize_precision_and_revoke_is_atomic() {
    let mut h = Harness::setup().await;
    let actor = h.register_verified("precision").await;
    h.set_role(&actor.user_id, "operator").await;
    let card = h.enroll(&actor, "Precision test").await;
    let entries = catalog(&h, &actor).await;
    let entitlement = entries[0]["name"].as_str().unwrap().to_owned();
    let expire_time = (Utc::now() + chrono::Duration::days(1))
        .with_nanosecond(123_456_789)
        .unwrap()
        .to_rfc3339_opts(SecondsFormat::Nanos, true);
    let method = format!("{ADMIN_MEMBERSHIPS}/GrantEntitlement");
    let request = json!({"parent":card.name,"entitlement":entitlement,
        "expireTime":expire_time,"reason":"precision retry"});
    let initial = ok_json(
        h.rpc_json(&method, Some(&actor.token), request.clone())
            .await,
    )
    .await;
    assert_eq!(h.audit_count().await, 1);
    let retry = ok_json(h.rpc_json(&method, Some(&actor.token), request).await).await;
    assert_eq!(
        retry, initial,
        "an identical grant returns the stored grant"
    );
    assert_eq!(
        h.audit_count().await,
        1,
        "an identical grant writes no audit event"
    );
    let cleared = ok_json(
        h.rpc_json(
            &method,
            Some(&actor.token),
            json!({"parent":card.name,"entitlement":entitlement,"reason":"clear expiry"}),
        )
        .await,
    )
    .await;
    assert!(cleared["entitlementGrant"].get("expireTime").is_none());
    assert_eq!(
        cleared["entitlementGrant"]["grantTime"],
        initial["entitlementGrant"]["grantTime"]
    );
    assert_eq!(h.audit_count().await, 2);

    let grant_name = format!(
        "{}/entitlementGrants/{}",
        card.name,
        last_segment(&entitlement)
    );
    let revoke_method = format!("{ADMIN_MEMBERSHIPS}/RevokeEntitlementGrant");
    let revoke = json!({"name":grant_name,"reason":"concurrent revoke"});
    let (left, right) = tokio::join!(
        h.rpc_json(&revoke_method, Some(&actor.token), revoke.clone()),
        h.rpc_json(&revoke_method, Some(&actor.token), revoke)
    );
    let (succeeded, failed) = if left.status() == StatusCode::OK {
        (left, right)
    } else {
        (right, left)
    };
    assert!(ok_json(succeeded).await["revokeTime"].is_string());
    assert_connect_error(
        failed,
        StatusCode::BAD_REQUEST,
        "failed_precondition",
        "ENTITLEMENT_GRANT_ALREADY_REVOKED",
    )
    .await;
    assert_eq!(h.audit_count().await, 3);

    h.make_audit_insert_fail().await;
    assert_connect_error(
        h.rpc_json(
            &method,
            Some(&actor.token),
            json!({"parent":card.name,"entitlement":entitlement,"reason":"failed restoration"}),
        )
        .await,
        StatusCode::INTERNAL_SERVER_ERROR,
        "internal",
        "INTERNAL_ERROR",
    )
    .await;
    let grant = ok_json(
        h.rpc_json(
            &format!("{ADMIN_MEMBERSHIPS}/GetEntitlementGrant"),
            Some(&actor.token),
            json!({"name":grant_name}),
        )
        .await,
    )
    .await;
    assert!(grant["revokeTime"].is_string());
    assert_eq!(h.audit_count().await, 3);
    h.shutdown().await;
}
