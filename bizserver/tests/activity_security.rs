//! Stateful activity invariants exercised against an explicitly selected test DB.

use boji_bizserver::{
    auth_schema::user,
    domain::activity::{self as d, *},
    migrations,
};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, Database, DatabaseConnection, EntityTrait, Set};
use uuid::Uuid;

async fn setup() -> (DatabaseConnection, String, String) {
    let db = Database::connect(
        std::env::var("TEST_DATABASE_URL").expect("isolated TEST_DATABASE_URL is required"),
    )
    .await
    .unwrap();
    migrations::migrate(&db).await.unwrap();
    let mut users = Vec::new();
    for _ in 0..2 {
        let id = Uuid::new_v4().to_string();
        user::ActiveModel {
            id: Set(id.clone()),
            name: Set(Some("Activity boundary test".into())),
            email: Set(Some(format!("{id}@example.test"))),
            email_verified: Set(true),
            image: Set(None),
            role: Set(None),
            created_at: Set(Utc::now()),
            updated_at: Set(Utc::now()),
        }
        .insert(&db)
        .await
        .unwrap();
        users.push(id);
    }
    (db, users.remove(0), users.remove(0))
}
fn hydration(id: Uuid, revision: i32, amount: i32) -> Operation {
    Operation::Upsert {
        mutation_id: Uuid::new_v4(),
        id,
        expected_revision: revision,
        occurred_at: Utc::now(),
        time_zone: "UTC".into(),
        source: Source::Manual,
        payload: ActivityPayload::Hydration(HydrationPayload { amount_ml: amount }),
    }
}
async fn cleanup(db: &DatabaseConnection, a: String, b: String) {
    user::Entity::delete_by_id(a).exec(db).await.unwrap();
    user::Entity::delete_by_id(b).exec(db).await.unwrap();
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL"]
async fn consent_and_batch_validation_fail_closed() {
    let (db, a, b) = setup().await;
    assert!(matches!(
        get_changes(&db, &a, "0", 100).await,
        Err(ActivityError::SyncDisabled)
    ));
    let day = Utc::now().format("%Y-%m-%d").to_string();
    assert!(matches!(
        get_days(&db, &a, &day, &day).await,
        Err(ActivityError::SyncDisabled)
    ));
    set_sync(&db, &a, true, Some(SYNC_CONSENT_VERSION))
        .await
        .unwrap();
    let invalid_batch = vec![
        hydration(Uuid::new_v4(), 0, 100),
        hydration(Uuid::new_v4(), 0, 0),
    ];
    assert!(matches!(
        apply_batch(&db, &a, invalid_batch).await,
        Err(ActivityError::Input(_))
    ));
    assert!(
        get_changes(&db, &a, "0", 100)
            .await
            .unwrap()
            .records
            .is_empty()
    );
    set_sync(&db, &a, false, None).await.unwrap();
    assert!(matches!(
        apply_batch(&db, &a, vec![hydration(Uuid::new_v4(), 0, 100)]).await,
        Err(ActivityError::SyncDisabled)
    ));
    assert!(matches!(
        get_changes(&db, &a, "0", 100).await,
        Err(ActivityError::SyncDisabled)
    ));
    cleanup(&db, a, b).await;
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL"]
async fn concurrent_revisions_receipts_and_user_isolation() {
    let (db, a, b) = setup().await;
    for id in [&a, &b] {
        set_sync(&db, id, true, Some(SYNC_CONSENT_VERSION))
            .await
            .unwrap();
    }
    let id = Uuid::new_v4();
    let original = hydration(id, 0, 100);
    let first = apply_batch(&db, &a, vec![original.clone()]).await.unwrap();
    let retry = apply_batch(&db, &a, vec![original.clone()]).await.unwrap();
    assert_eq!(first, retry);
    let mut changed = original;
    if let Operation::Upsert { payload, .. } = &mut changed {
        *payload = ActivityPayload::Hydration(HydrationPayload { amount_ml: 200 });
    }
    let reused = apply_batch(&db, &a, vec![changed]).await.unwrap();
    assert_eq!(
        reused.results[0].code,
        Some(MutationConflictCode::MutationReused)
    );
    assert!(
        get_changes(&db, &b, "0", 100)
            .await
            .unwrap()
            .records
            .is_empty()
    );
    let other_delete = apply_batch(
        &db,
        &b,
        vec![Operation::Delete {
            mutation_id: Uuid::new_v4(),
            id,
            expected_revision: 1,
        }],
    )
    .await
    .unwrap();
    assert_eq!(
        other_delete.results[0].code,
        Some(MutationConflictCode::RecordNotFound)
    );
    let left = vec![hydration(id, 1, 300)];
    let right = vec![hydration(id, 1, 400)];
    let (left, right) = tokio::join!(
        d::apply_batch(&db, &a, left),
        d::apply_batch(&db, &a, right)
    );
    let statuses = [
        left.unwrap().results[0].status,
        right.unwrap().results[0].status,
    ];
    assert_eq!(
        statuses
            .iter()
            .filter(|&&status| status == MutationStatus::Applied)
            .count(),
        1
    );
    assert_eq!(
        statuses
            .iter()
            .filter(|&&status| status == MutationStatus::Conflict)
            .count(),
        1
    );
    let changes = get_changes(&db, &a, "0", 1).await.unwrap();
    assert_eq!(changes.records.len(), 1);
    assert_eq!(changes.records[0].revision, 2);
    assert_eq!(changes.next_cursor, "2");
    cleanup(&db, a, b).await;
}
