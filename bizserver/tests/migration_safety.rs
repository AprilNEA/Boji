//! Migration safety checks use a uniquely named schema in the isolated test DB.

use boji_bizserver::migrations;
use sea_orm::{ConnectOptions, ConnectionTrait, Database, DbBackend, Statement};
use sea_orm_migration::SchemaManager;
use uuid::Uuid;

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL"]
async fn ensure_current_rejects_uninitialized_and_future_versions() {
    let url = std::env::var("TEST_DATABASE_URL").expect("isolated TEST_DATABASE_URL is required");
    let admin = Database::connect(&url).await.unwrap();
    let schema = format!("migration_test_{}", Uuid::new_v4().simple());
    admin
        .execute_raw(Statement::from_string(
            DbBackend::Postgres,
            format!("CREATE SCHEMA {schema}"),
        ))
        .await
        .unwrap();
    let mut options = ConnectOptions::new(url);
    options.set_schema_search_path(&schema).sqlx_logging(false);
    let db = Database::connect(options).await.unwrap();
    let manager = SchemaManager::new(&db);
    assert!(migrations::ensure_current(&db).await.is_err());
    assert!(!manager.has_table("seaql_migrations").await.unwrap());
    migrations::migrate(&db).await.unwrap();
    migrations::ensure_current(&db).await.unwrap();
    migrations::migrate(&db).await.unwrap();
    migrations::ensure_current(&db).await.unwrap();
    db.execute_raw(Statement::from_string(
        DbBackend::Postgres,
        "INSERT INTO seaql_migrations (version, applied_at) VALUES ('future-version-test', 0)",
    ))
    .await
    .unwrap();
    assert!(migrations::ensure_current(&db).await.is_err());
    db.close().await.unwrap();
    admin
        .execute_raw(Statement::from_string(
            DbBackend::Postgres,
            format!("DROP SCHEMA {schema} CASCADE"),
        ))
        .await
        .unwrap();
    admin.close().await.unwrap();
}
