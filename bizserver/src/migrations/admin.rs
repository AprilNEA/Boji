//! PostgreSQL schema creation for membership-administration auditing.

use sea_orm_migration::prelude::*;

/// Create append-only audit storage and indexes for administrative queries.
///
/// Authentication fields belong to the separate `admin_auth` migration.
pub async fn up(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    manager
        .create_table(
            Table::create()
                .table(AdminAuditEvent::Table)
                .col(
                    ColumnDef::new(AdminAuditEvent::Id)
                        .uuid()
                        .not_null()
                        .primary_key(),
                )
                .col(ColumnDef::new(AdminAuditEvent::ActorUserId).text())
                .col(ColumnDef::new(AdminAuditEvent::TargetUserId).text())
                .col(ColumnDef::new(AdminAuditEvent::Action).text().not_null())
                .col(ColumnDef::new(AdminAuditEvent::Reason).text().not_null())
                .col(
                    ColumnDef::new(AdminAuditEvent::Metadata)
                        .json_binary()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(AdminAuditEvent::CreatedAt)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("admin_audit_event_actor_user_id_fkey")
                        .from(AdminAuditEvent::Table, AdminAuditEvent::ActorUserId)
                        .to(Alias::new("user"), Alias::new("id"))
                        .on_delete(ForeignKeyAction::SetNull),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("admin_audit_event_target_user_id_fkey")
                        .from(AdminAuditEvent::Table, AdminAuditEvent::TargetUserId)
                        .to(Alias::new("user"), Alias::new("id"))
                        .on_delete(ForeignKeyAction::SetNull),
                )
                .to_owned(),
        )
        .await?;

    for index in [
        Index::create()
            .name("admin_audit_event_actor_user_id_idx")
            .table(AdminAuditEvent::Table)
            .col(AdminAuditEvent::ActorUserId)
            .to_owned(),
        Index::create()
            .name("admin_audit_event_target_user_id_idx")
            .table(AdminAuditEvent::Table)
            .col(AdminAuditEvent::TargetUserId)
            .to_owned(),
        Index::create()
            .name("admin_audit_event_created_at_idx")
            .table(AdminAuditEvent::Table)
            .col(AdminAuditEvent::CreatedAt)
            .to_owned(),
        Index::create()
            .name("membership_admin_joined_id_idx")
            .table(Membership::Table)
            .col(Membership::JoinedAt)
            .col(Membership::Id)
            .to_owned(),
        Index::create()
            .name("membership_admin_status_joined_id_idx")
            .table(Membership::Table)
            .col(Membership::Status)
            .col(Membership::JoinedAt)
            .col(Membership::Id)
            .to_owned(),
    ] {
        manager.create_index(index).await?;
    }
    Ok(())
}

#[derive(DeriveIden)]
enum AdminAuditEvent {
    Table,
    Id,
    ActorUserId,
    TargetUserId,
    Action,
    Reason,
    Metadata,
    CreatedAt,
}

#[derive(DeriveIden)]
enum Membership {
    Table,
    Id,
    Status,
    JoinedAt,
}
