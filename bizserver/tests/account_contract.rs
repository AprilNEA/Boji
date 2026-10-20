//! Account deletion and email change over real HTTP and PostgreSQL.
//!
//! Every test creates an isolated schema in the database named by the explicit
//! `TEST_DATABASE_URL` environment variable. The tests are ignored by default.

#[path = "support/admin_harness.rs"]
mod admin_harness;

use admin_harness::{Harness, Identity, VERIFY_EMAIL_SUBJECT};
use boji_bizserver::{auth_schema::user, entities::membership};
use reqwest::{Response, StatusCode};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use serde_json::{Value, json};
use uuid::Uuid;

const DELETE_SUBJECT: &str = "确认注销薄肌账号";
const CHANGE_SUBJECT: &str = "确认更换薄肌邮箱";
const GET_MEMBERSHIP: &str = "boji.v1.MembershipService/GetMembership";

async fn auth_post(harness: &Harness, path: &str, token: Option<&str>, body: Value) -> Response {
    let mut request = harness
        .client
        .post(format!("{}{path}", harness.origin))
        .header("origin", &harness.origin)
        .json(&body);
    if let Some(token) = token {
        request = request.bearer_auth(token);
    }
    request.send().await.expect("send auth request")
}

/// Return the confirmation code of a deletion message.
fn deletion_code(message: &str) -> String {
    let (_, rest) = message
        .split_once("完成注销：\n\n")
        .expect("deletion message introduces its code");
    rest.lines()
        .next()
        .expect("deletion code line")
        .trim()
        .to_owned()
}

async fn stored_user(harness: &Harness, user_id: &str) -> Option<user::Model> {
    user::Entity::find_by_id(user_id.to_owned())
        .one(&harness.database)
        .await
        .expect("read user")
}

async fn has_membership(harness: &Harness, identity: &Identity) -> bool {
    membership::Entity::find()
        .filter(membership::Column::UserId.eq(identity.user_id.as_str()))
        .one(&harness.database)
        .await
        .expect("read membership")
        .is_some()
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn account_deletion_needs_the_emailed_code_of_the_same_user() {
    let mut harness = Harness::setup().await;
    let owner = harness.register_verified("delete-owner").await;
    let card = harness.enroll(&owner, "注销测试").await;
    let other = harness.register_verified("delete-other").await;

    let anonymous = auth_post(&harness, "/api/auth/delete-user", None, json!({})).await;
    assert_eq!(anonymous.status(), StatusCode::UNAUTHORIZED);

    let requested = auth_post(
        &harness,
        "/api/auth/delete-user",
        Some(&owner.token),
        json!({}),
    )
    .await;
    assert_eq!(requested.status(), StatusCode::OK);
    let message = harness.read_mail(&owner.email, DELETE_SUBJECT).await;
    assert!(
        !message.contains("http://") && !message.contains("https://"),
        "the deletion message must not hold a link"
    );
    let first_code = deletion_code(&message);
    assert!(stored_user(&harness, &owner.user_id).await.is_some());

    let wrong = auth_post(
        &harness,
        "/api/auth/delete-user",
        Some(&owner.token),
        json!({ "token": format!("delete-account-{}", Uuid::new_v4().simple()) }),
    )
    .await;
    assert!(wrong.status().is_client_error(), "a wrong code must fail");
    // Another session cannot use the code of the owner.
    let foreign = auth_post(
        &harness,
        "/api/auth/delete-user",
        Some(&other.token),
        json!({ "token": first_code }),
    )
    .await;
    assert!(
        foreign.status().is_client_error(),
        "a foreign code must fail"
    );
    assert!(stored_user(&harness, &owner.user_id).await.is_some());
    assert!(stored_user(&harness, &other.user_id).await.is_some());

    // The foreign attempt may consume the first code, so request a new one.
    let again = auth_post(
        &harness,
        "/api/auth/delete-user",
        Some(&owner.token),
        json!({}),
    )
    .await;
    assert_eq!(again.status(), StatusCode::OK);
    let mut code = None;
    for _ in 0..50 {
        code = harness
            .mails(&owner.email, DELETE_SUBJECT)
            .iter()
            .map(|message| deletion_code(message))
            .find(|candidate| *candidate != first_code);
        if code.is_some() {
            break;
        }
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    }
    let code = code.expect("a second deletion code");

    let deleted = auth_post(
        &harness,
        "/api/auth/delete-user",
        Some(&owner.token),
        json!({ "token": code }),
    )
    .await;
    let status = deleted.status();
    let body = deleted.text().await.unwrap_or_default();
    assert_eq!(status, StatusCode::OK, "deletion failed: {body}");
    assert!(stored_user(&harness, &owner.user_id).await.is_none());
    assert!(
        !has_membership(&harness, &owner).await,
        "deleting the user deletes the membership card"
    );
    assert!(!harness.session_is_active(&owner.user_id).await);
    let after = harness
        .rpc_json(
            GET_MEMBERSHIP,
            Some(&owner.token),
            json!({ "name": card.name }),
        )
        .await;
    assert_eq!(after.status(), StatusCode::UNAUTHORIZED);
    assert!(stored_user(&harness, &other.user_id).await.is_some());
    harness.shutdown().await;
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn email_change_needs_the_old_and_the_new_address() {
    let mut harness = Harness::setup().await;
    let owner = harness.register_verified("change-owner").await;
    let new_email = format!("changed-{}@example.test", Uuid::new_v4());

    let anonymous = auth_post(
        &harness,
        "/api/auth/change-email",
        None,
        json!({ "newEmail": new_email }),
    )
    .await;
    assert_eq!(anonymous.status(), StatusCode::UNAUTHORIZED);

    let requested = auth_post(
        &harness,
        "/api/auth/change-email",
        Some(&owner.token),
        json!({ "newEmail": new_email }),
    )
    .await;
    assert_eq!(requested.status(), StatusCode::OK);
    let confirmation = harness.read_mail(&owner.email, CHANGE_SUBJECT).await;
    assert!(confirmation.contains(&new_email));
    let stored = stored_user(&harness, &owner.user_id).await.expect("user");
    assert_eq!(stored.email.as_deref(), Some(owner.email.as_str()));
    assert!(
        harness.mails(&new_email, VERIFY_EMAIL_SUBJECT).is_empty(),
        "the new address gets nothing before the old address confirms"
    );

    let link = harness
        .read_mail_url(&owner.email, CHANGE_SUBJECT, "/verify-email")
        .await;
    let confirmed = harness.client.get(link).send().await.expect("open link");
    assert!(
        confirmed.status().is_success() || confirmed.status().is_redirection(),
        "confirmation failed with {}",
        confirmed.status()
    );
    let link = harness
        .read_mail_url(&new_email, VERIFY_EMAIL_SUBJECT, "/verify-email")
        .await;
    let verified = harness.client.get(link).send().await.expect("open link");
    assert!(
        verified.status().is_success() || verified.status().is_redirection(),
        "verification failed with {}",
        verified.status()
    );

    let stored = stored_user(&harness, &owner.user_id).await.expect("user");
    assert_eq!(stored.email.as_deref(), Some(new_email.as_str()));
    assert!(stored.email_verified);
    let signed_in = auth_post(
        &harness,
        "/api/auth/sign-in/email",
        None,
        json!({ "email": new_email, "password": owner.password }),
    )
    .await;
    assert_eq!(signed_in.status(), StatusCode::OK);
    let old_address = auth_post(
        &harness,
        "/api/auth/sign-in/email",
        None,
        json!({ "email": owner.email, "password": owner.password }),
    )
    .await;
    assert!(old_address.status().is_client_error());
    harness.shutdown().await;
}
