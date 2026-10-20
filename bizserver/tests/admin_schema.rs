//! Incremental admin migration must not grant privileges or lose account data.

use boji_bizserver::migrations::{self, Migrator};
use sea_orm::{ConnectOptions, ConnectionTrait, Database, DbBackend, Statement};
use sea_orm_migration::{MigratorTrait, SchemaManager};
use uuid::Uuid;

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL"]
async fn admin_migration_preserves_users_without_granting_roles() {
    let url = std::env::var("TEST_DATABASE_URL").expect("isolated TEST_DATABASE_URL");
    let control = Database::connect(&url).await.unwrap();
    let schema = format!("admin_migration_{}", Uuid::new_v4().simple());
    control
        .execute_raw(Statement::from_string(
            DbBackend::Postgres,
            format!("CREATE SCHEMA {schema}"),
        ))
        .await
        .unwrap();
    let mut options = ConnectOptions::new(url);
    options.set_schema_search_path(&schema).sqlx_logging(false);
    let db = Database::connect(options).await.unwrap();
    Migrator::up(&db, Some(3)).await.unwrap();
    db.execute_raw(Statement::from_string(
        DbBackend::Postgres,
        "INSERT INTO \"user\" (id, name, email, email_verified, created_at, updated_at)
         VALUES ('migration-user', 'Test', 'migration@example.test', true, now(), now())",
    ))
    .await
    .unwrap();
    assert!(migrations::ensure_current(&db).await.is_err());
    migrations::migrate(&db).await.unwrap();
    migrations::migrate(&db).await.unwrap();
    migrations::ensure_current(&db).await.unwrap();
    let user = db
        .query_one_raw(Statement::from_string(
            DbBackend::Postgres,
            "SELECT role, banned, ban_reason, ban_expires FROM \"user\" WHERE id='migration-user'",
        ))
        .await
        .unwrap()
        .unwrap();
    assert_eq!(user.try_get::<Option<String>>("", "role").unwrap(), None);
    assert!(
        !user
            .try_get::<Option<bool>>("", "banned")
            .unwrap()
            .unwrap_or(false)
    );
    assert_eq!(
        user.try_get::<Option<String>>("", "ban_reason").unwrap(),
        None
    );
    let manager = SchemaManager::new(&db);
    assert!(manager.has_table("admin_audit_event").await.unwrap());
    assert!(
        manager
            .has_column("session", "impersonated_by")
            .await
            .unwrap()
    );
    db.close().await.unwrap();
    control
        .execute_raw(Statement::from_string(
            DbBackend::Postgres,
            format!("DROP SCHEMA {schema} CASCADE"),
        ))
        .await
        .unwrap();
    control.close().await.unwrap();
}
