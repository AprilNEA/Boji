//! Explicit versioned migrations for the new Rust service.

pub mod activity;
pub mod admin;
pub mod admin_auth;
pub mod auth;
pub mod business;

use sea_orm::{ConnectionTrait, DatabaseConnection, DbErr, Statement};
use sea_orm_migration::prelude::*;

/// Migration set owned by the Rust backend.
pub struct Migrator;
#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(AuthMigration),
            Box::new(BusinessMigration),
            Box::new(ActivityMigration),
            Box::new(AdminMigration),
        ]
    }
}

/// Apply every pending migration.
///
/// PostgreSQL runs each migration in its own transaction. The migrations
/// create tables and indexes without `IF NOT EXISTS`, so an existing object
/// with the same name fails that migration and rolls back its changes.
pub async fn migrate(database: &DatabaseConnection) -> Result<(), DbErr> {
    Migrator::up(database, None).await
}

/// Check the version registry without installing metadata or changing any table.
pub async fn ensure_current(database: &DatabaseConnection) -> Result<(), DbErr> {
    let manager = SchemaManager::new(database);
    if !manager.has_table("seaql_migrations").await? {
        return Err(DbErr::Custom(
            "Database is not initialized for the Rust service".into(),
        ));
    }
    let rows = database
        .query_all_raw(Statement::from_string(
            database.get_database_backend(),
            "SELECT version FROM seaql_migrations",
        ))
        .await?;
    let actual = rows
        .iter()
        .map(|row| row.try_get::<String>("", "version"))
        .collect::<Result<std::collections::BTreeSet<_>, _>>()?;
    let expected = Migrator::migrations()
        .iter()
        .map(|migration| migration.name().to_owned())
        .collect::<std::collections::BTreeSet<_>>();
    if actual != expected {
        return Err(DbErr::Custom(
            "Database migration versions do not match this service".into(),
        ));
    }
    Ok(())
}

struct AuthMigration;
impl MigrationName for AuthMigration {
    fn name(&self) -> &str {
        "m20261020_000001_auth"
    }
}
#[async_trait::async_trait]
impl MigrationTrait for AuthMigration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        auth::up(manager).await
    }
    async fn down(&self, _: &SchemaManager) -> Result<(), DbErr> {
        Err(DbErr::Custom(
            "Destructive rollback is deliberately disabled".into(),
        ))
    }
}
struct BusinessMigration;
impl MigrationName for BusinessMigration {
    fn name(&self) -> &str {
        "m20261020_000002_membership"
    }
}
#[async_trait::async_trait]
impl MigrationTrait for BusinessMigration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        business::up(manager).await
    }
    async fn down(&self, _: &SchemaManager) -> Result<(), DbErr> {
        Err(DbErr::Custom(
            "Destructive rollback is deliberately disabled".into(),
        ))
    }
}
struct ActivityMigration;
struct AdminMigration;
impl MigrationName for AdminMigration {
    fn name(&self) -> &str {
        "m20261020_000004_admin"
    }
}
#[async_trait::async_trait]
impl MigrationTrait for AdminMigration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        admin_auth::up(manager).await?;
        admin::up(manager).await
    }
    async fn down(&self, _: &SchemaManager) -> Result<(), DbErr> {
        Err(DbErr::Custom(
            "Destructive rollback is deliberately disabled".into(),
        ))
    }
}

impl MigrationName for ActivityMigration {
    fn name(&self) -> &str {
        "m20261020_000003_activity"
    }
}
#[async_trait::async_trait]
impl MigrationTrait for ActivityMigration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        activity::up(manager).await
    }
    async fn down(&self, _: &SchemaManager) -> Result<(), DbErr> {
        Err(DbErr::Custom(
            "Destructive rollback is deliberately disabled".into(),
        ))
    }
}
