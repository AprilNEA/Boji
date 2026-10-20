//! PostgreSQL integration coverage for the activity synchronization domain.
//!
//! Run explicitly with an isolated `TEST_DATABASE_URL`. This test intentionally
//! does not skip when that variable is absent.

use boji_bizserver::{
    auth_schema::user,
    domain::activity::{
        ActivityPayload, DurationSource, HydrationPayload, Operation, SYNC_CONSENT_VERSION,
        SleepPayload, Source, WorkoutPayload, WorkoutStatus, apply_batch, get_changes, get_days,
        set_sync,
    },
    migrations,
};
use chrono::{TimeZone, Utc};
use sea_orm::{ActiveModelTrait, Database, EntityTrait, Set};
use uuid::Uuid;

#[ignore = "requires an isolated PostgreSQL database in TEST_DATABASE_URL"]
#[tokio::test]
async fn activity_domain_syncs_idempotently_and_rebuilds_summaries() {
    let url = std::env::var("TEST_DATABASE_URL")
        .expect("TEST_DATABASE_URL must point to an isolated PostgreSQL database");
    assert!(url.starts_with("postgres://") || url.starts_with("postgresql://"));

    let db = Database::connect(url)
        .await
        .expect("the isolated PostgreSQL database must connect");
    migrations::migrate(&db)
        .await
        .expect("the isolated PostgreSQL database must migrate");
    let user_id = format!("activity-domain-test-{}", Uuid::new_v4());
    let now = Utc::now();
    user::ActiveModel {
        id: Set(user_id.clone()),
        name: Set(Some("Activity domain test".to_owned())),
        email: Set(Some(format!("{user_id}@example.invalid"))),
        email_verified: Set(true),
        image: Set(None),
        role: Set(Some("user".to_owned())),
        created_at: Set(now),
        updated_at: Set(now),
    }
    .insert(&db)
    .await
    .expect("the isolated test user must insert");

    set_sync(&db, &user_id, true, Some(SYNC_CONSENT_VERSION))
        .await
        .expect("explicit v1 consent must enable sync");
    let occurred_at = Utc
        .with_ymd_and_hms(2024, 1, 1, 16, 30, 0)
        .single()
        .expect("test timestamp is valid");
    let hydration_id = Uuid::new_v4();
    let operations = vec![
        Operation::Upsert {
            mutation_id: Uuid::new_v4(),
            id: hydration_id,
            expected_revision: 0,
            occurred_at,
            time_zone: "Asia/Shanghai".to_owned(),
            source: Source::App,
            payload: ActivityPayload::Hydration(HydrationPayload { amount_ml: 600 }),
        },
        Operation::Upsert {
            mutation_id: Uuid::new_v4(),
            id: Uuid::new_v4(),
            expected_revision: 0,
            occurred_at,
            time_zone: "Asia/Shanghai".to_owned(),
            source: Source::Manual,
            payload: ActivityPayload::Sleep(SleepPayload {
                duration_minutes: 420,
            }),
        },
        Operation::Upsert {
            mutation_id: Uuid::new_v4(),
            id: Uuid::new_v4(),
            expected_revision: 0,
            occurred_at,
            time_zone: "Asia/Shanghai".to_owned(),
            source: Source::Import,
            payload: ActivityPayload::Workout(WorkoutPayload {
                workout_id: "base-strength".to_owned(),
                workout_version: "v1".to_owned(),
                duration_seconds: 1_800,
                duration_source: DurationSource::Measured,
                status: WorkoutStatus::Completed,
            }),
        },
    ];
    let batch = apply_batch(&db, &user_id, operations.clone())
        .await
        .expect("valid operations must apply");
    assert_eq!(batch.server_cursor, "3");
    assert!(
        batch
            .results
            .iter()
            .all(|result| result.revision == Some(1))
    );

    let duplicate = apply_batch(&db, &user_id, operations)
        .await
        .expect("identical mutations must replay their receipts");
    assert_eq!(duplicate, batch);
    let changes = get_changes(&db, &user_id, "0", 100)
        .await
        .expect("the initial changes page must load");
    assert_eq!(changes.records.len(), 3);
    assert_eq!(changes.next_cursor, "3");
    let days = get_days(&db, &user_id, "2024-01-02", "2024-01-02")
        .await
        .expect("daily summary must load");
    assert_eq!(days.days[0].water_ml, 600);
    assert_eq!(days.days[0].sleep_minutes, Some(420));
    assert_eq!(days.days[0].workout_count, 1);
    assert_eq!(days.days[0].workout_seconds, 1_800);
    assert_eq!(days.days[0].task_count, 3);

    let deletion = apply_batch(
        &db,
        &user_id,
        vec![Operation::Delete {
            mutation_id: Uuid::new_v4(),
            id: hydration_id,
            expected_revision: 1,
        }],
    )
    .await
    .expect("a matching revision must create a tombstone");
    assert_eq!(deletion.server_cursor, "4");
    let tombstones = get_changes(&db, &user_id, &changes.next_cursor, 100)
        .await
        .expect("tombstone change must load");
    assert_eq!(tombstones.records.len(), 1);
    assert_eq!(tombstones.records[0].id, hydration_id);
    assert!(tombstones.records[0].deleted_at.is_some());
    assert_eq!(tombstones.records[0].payload, None);

    user::Entity::delete_by_id(user_id)
        .exec(&db)
        .await
        .expect("the isolated test user must clean up");
}
