//! Native Better Auth admin fields; no account receives elevated privileges.

use sea_orm_migration::prelude::*;

/// Add optional admin fields while retaining existing users and sessions.
pub async fn up(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    manager
        .alter_table(
            Table::alter()
                .table(Alias::new("user"))
                .add_column(
                    ColumnDef::new(Alias::new("banned"))
                        .boolean()
                        .not_null()
                        .default(false),
                )
                .add_column(ColumnDef::new(Alias::new("ban_reason")).text())
                .add_column(ColumnDef::new(Alias::new("ban_expires")).timestamp_with_time_zone())
                .to_owned(),
        )
        .await?;
    manager
        .alter_table(
            Table::alter()
                .table(Alias::new("session"))
                .add_column(ColumnDef::new(Alias::new("impersonated_by")).text())
                .to_owned(),
        )
        .await
}
