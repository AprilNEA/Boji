use std::env;

use boji_bizserver::domain::membership::{
    Enrollment, Entitlement, MemberNumber, Membership, MembershipError, MembershipStatus,
    MembershipTier, TERMS_VERSION, enroll,
};
use chrono::{TimeZone, Utc};
use sea_orm::{
    ConnectOptions, ConnectionTrait, Database, DatabaseConnection, DbBackend, Statement,
};
use sea_orm_migration::SchemaManager;
use uuid::Uuid;

#[test]
fn enrollment_normalizes_and_validates_the_old_contract() {
    let enrollment = Enrollment::parse("user-1", "  阿明  ", TERMS_VERSION).unwrap();
    assert_eq!(enrollment.user_id(), "user-1");
    assert_eq!(enrollment.display_name(), "阿明");

    assert!(matches!(
        Enrollment::parse("user-1", "", TERMS_VERSION),
        Err(MembershipError::InvalidInput {
            field: "displayName"
        })
    ));
    assert!(matches!(
        Enrollment::parse("user-1", "a< b", TERMS_VERSION),
        Err(MembershipError::InvalidInput {
            field: "displayName"
        })
    ));
    assert!(matches!(
        Enrollment::parse("user-1", "zero\u{200B}width", TERMS_VERSION),
        Err(MembershipError::InvalidInput {
            field: "displayName"
        })
    ));
    assert!(matches!(
        Enrollment::parse("user-1", "name", "community-v0"),
        Err(MembershipError::TermsNotAccepted)
    ));
    assert!(matches!(
        Enrollment::parse("", "name", TERMS_VERSION),
        Err(MembershipError::InvalidInput { field: "userId" })
    ));
}

#[test]
fn member_numbers_are_opaque_strings_with_a_six_digit_minimum() {
    assert_eq!(MemberNumber::after(999).unwrap().as_str(), "001000");
    assert_eq!(MemberNumber::after(999_999).unwrap().as_str(), "1000000");
    assert!(matches!(
        MemberNumber::after(-1),
        Err(MembershipError::Database(_))
    ));
    assert!(matches!(
        MemberNumber::after(i64::MAX),
        Err(MembershipError::Database(_))
    ));
}

#[test]
fn membership_serde_uses_the_existing_camel_case_contract() {
    let joined_at = Utc.with_ymd_and_hms(2026, 10, 20, 11, 19, 9).unwrap();
    let membership = Membership {
        id: "card-1".to_owned(),
        user_id: "user-1".to_owned(),
        member_number: "001000".to_owned(),
        display_name: "阿明".to_owned(),
        joined_at,
        tier: MembershipTier::Community,
        status: MembershipStatus::Active,
        entitlements: vec![Entitlement {
            id: "entitlement-1".to_owned(),
            code: "local_tracking".to_owned(),
            name: "本地记录".to_owned(),
            description: "本地饮水、睡眠和训练记录。".to_owned(),
            granted_at: joined_at,
            expires_at: None,
        }],
        expires_at: None,
    };

    let value = serde_json::to_value(membership).unwrap();
    assert_eq!(value["userId"], "user-1");
    assert_eq!(value["memberNumber"], "001000");
    assert_eq!(value["joinedAt"], "2026-10-20T11:19:09Z");
    assert_eq!(value["tier"], "community");
    assert_eq!(
        value["entitlements"][0]["grantedAt"],
        "2026-10-20T11:19:09Z"
    );
    assert!(value.get("user_id").is_none());
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL database"]
async fn concurrent_enrollment_returns_one_card_without_public_schema_changes() {
    let url = env::var("TEST_DATABASE_URL").expect("set an isolated TEST_DATABASE_URL");
    let setup = Database::connect(url.as_str()).await.unwrap();
    let schema = format!("membership_test_{}", Uuid::new_v4().simple());
    setup
        .execute_raw(Statement::from_string(
            DbBackend::Postgres,
            format!("CREATE SCHEMA \"{schema}\""),
        ))
        .await
        .unwrap();

    let db = schema_connection(&url, &schema).await;
    db.execute_raw(Statement::from_string(
        DbBackend::Postgres,
        "CREATE TABLE \"user\" (id text PRIMARY KEY)".to_owned(),
    ))
    .await
    .unwrap();
    db.execute_raw(Statement::from_sql_and_values(
        DbBackend::Postgres,
        "INSERT INTO \"user\" (id) VALUES ($1)",
        ["user-1".into()],
    ))
    .await
    .unwrap();
    boji_bizserver::migrations::business::up(&SchemaManager::new(&db))
        .await
        .unwrap();

    let mut tasks = Vec::new();
    for _ in 0..8 {
        let db = db.clone();
        tasks.push(tokio::spawn(async move {
            enroll(&db, "user-1", "阿明", TERMS_VERSION).await.unwrap()
        }));
    }
    let mut cards = Vec::with_capacity(tasks.len());
    for task in tasks {
        cards.push(task.await.unwrap());
    }

    assert!(cards.iter().all(|card| card.id == cards[0].id));
    assert!(cards.iter().all(|card| card.member_number == "001000"));
    assert!(cards.iter().all(|card| card.display_name == "阿明"));

    setup
        .execute_raw(Statement::from_string(
            DbBackend::Postgres,
            format!("DROP SCHEMA \"{schema}\" CASCADE"),
        ))
        .await
        .unwrap();
}

async fn schema_connection(url: &str, schema: &str) -> DatabaseConnection {
    let mut options = ConnectOptions::new(url);
    options.max_connections(8).set_schema_search_path(schema);
    Database::connect(options).await.unwrap()
}
