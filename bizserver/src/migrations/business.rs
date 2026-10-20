//! Business-table migration helpers.

use sea_orm_migration::prelude::*;
use uuid::Uuid;

/// Create and seed the membership business tables.
///
/// The authentication migration must create `user(id text)` before this runs.
/// This migration intentionally excludes activity tables and historical imports.
pub async fn up(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    manager
        .create_table(
            Table::create()
                .table(MembershipNumberCounter::Table)
                .col(
                    ColumnDef::new(MembershipNumberCounter::Id)
                        .integer()
                        .not_null()
                        .primary_key(),
                )
                .col(
                    ColumnDef::new(MembershipNumberCounter::LastNumber)
                        .big_integer()
                        .not_null()
                        .default(999_i64),
                )
                .check(Check::named(
                    "membership_number_counter_singleton",
                    Expr::col(MembershipNumberCounter::Id).eq(1),
                ))
                .check(Check::named(
                    "membership_number_counter_nonnegative",
                    Expr::col(MembershipNumberCounter::LastNumber).gte(0),
                ))
                .to_owned(),
        )
        .await?;

    manager
        .create_table(
            Table::create()
                .table(Membership::Table)
                .col(
                    ColumnDef::new(Membership::Id)
                        .uuid()
                        .not_null()
                        .primary_key(),
                )
                .col(
                    ColumnDef::new(Membership::UserId)
                        .text()
                        .not_null()
                        .unique_key(),
                )
                .col(
                    ColumnDef::new(Membership::MemberNumber)
                        .text()
                        .not_null()
                        .unique_key(),
                )
                .col(ColumnDef::new(Membership::DisplayName).text().not_null())
                .col(
                    ColumnDef::new(Membership::JoinedAt)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .col(ColumnDef::new(Membership::Tier).text().not_null())
                .col(ColumnDef::new(Membership::Status).text().not_null())
                .col(ColumnDef::new(Membership::ExpiresAt).timestamp_with_time_zone())
                .col(ColumnDef::new(Membership::TermsVersion).text().not_null())
                .col(
                    ColumnDef::new(Membership::AcceptedAt)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("membership_user_id_fkey")
                        .from(Membership::Table, Membership::UserId)
                        .to(User::Table, User::Id)
                        .on_delete(ForeignKeyAction::Cascade),
                )
                .check(Check::named(
                    "membership_member_number_digits",
                    Expr::cust(
                        "\"member_number\" ~ '^0*[1-9][0-9]*$' \
                         AND char_length(\"member_number\") >= 6",
                    ),
                ))
                .check(Check::named(
                    "membership_tier_check",
                    Expr::col(Membership::Tier).eq("community"),
                ))
                .check(Check::named(
                    "membership_status_check",
                    Expr::col(Membership::Status).is_in(["active", "suspended"]),
                ))
                .to_owned(),
        )
        .await?;

    manager
        .create_table(
            Table::create()
                .table(Entitlement::Table)
                .col(
                    ColumnDef::new(Entitlement::Id)
                        .uuid()
                        .not_null()
                        .primary_key(),
                )
                .col(
                    ColumnDef::new(Entitlement::Code)
                        .text()
                        .not_null()
                        .unique_key(),
                )
                .col(ColumnDef::new(Entitlement::Name).text().not_null())
                .col(ColumnDef::new(Entitlement::Description).text().not_null())
                .col(
                    ColumnDef::new(Entitlement::IsActive)
                        .boolean()
                        .not_null()
                        .default(true),
                )
                .col(
                    ColumnDef::new(Entitlement::CreatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::current_timestamp()),
                )
                .col(
                    ColumnDef::new(Entitlement::UpdatedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::current_timestamp()),
                )
                .to_owned(),
        )
        .await?;

    manager
        .create_table(
            Table::create()
                .table(MembershipEntitlement::Table)
                .col(
                    ColumnDef::new(MembershipEntitlement::MembershipId)
                        .uuid()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(MembershipEntitlement::EntitlementId)
                        .uuid()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(MembershipEntitlement::GrantedAt)
                        .timestamp_with_time_zone()
                        .not_null()
                        .default(Expr::current_timestamp()),
                )
                .col(ColumnDef::new(MembershipEntitlement::ExpiresAt).timestamp_with_time_zone())
                .col(ColumnDef::new(MembershipEntitlement::RevokedAt).timestamp_with_time_zone())
                .primary_key(
                    Index::create()
                        .col(MembershipEntitlement::MembershipId)
                        .col(MembershipEntitlement::EntitlementId),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("membership_entitlement_membership_id_fkey")
                        .from(
                            MembershipEntitlement::Table,
                            MembershipEntitlement::MembershipId,
                        )
                        .to(Membership::Table, Membership::Id)
                        .on_delete(ForeignKeyAction::Cascade),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("membership_entitlement_entitlement_id_fkey")
                        .from(
                            MembershipEntitlement::Table,
                            MembershipEntitlement::EntitlementId,
                        )
                        .to(Entitlement::Table, Entitlement::Id)
                        .on_delete(ForeignKeyAction::Restrict),
                )
                .to_owned(),
        )
        .await?;

    manager
        .create_index(
            Index::create()
                .name("membership_entitlement_entitlement_id_idx")
                .table(MembershipEntitlement::Table)
                .col(MembershipEntitlement::EntitlementId)
                .to_owned(),
        )
        .await?;

    seed_counter(manager).await?;
    seed_community_entitlements(manager).await
}

async fn seed_counter(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    manager
        .execute(
            Query::insert()
                .into_table(MembershipNumberCounter::Table)
                .columns([
                    MembershipNumberCounter::Id,
                    MembershipNumberCounter::LastNumber,
                ])
                .values_panic([1.into(), 999_i64.into()])
                .on_conflict(
                    OnConflict::column(MembershipNumberCounter::Id)
                        .do_nothing()
                        .to_owned(),
                )
                .to_owned(),
        )
        .await
}

async fn seed_community_entitlements(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    for (id, code, name, description) in COMMUNITY_ENTITLEMENTS {
        manager
            .execute(
                Query::insert()
                    .into_table(Entitlement::Table)
                    .columns([
                        Entitlement::Id,
                        Entitlement::Code,
                        Entitlement::Name,
                        Entitlement::Description,
                        Entitlement::IsActive,
                    ])
                    .values_panic([
                        Uuid::from_u128(id).into(),
                        code.into(),
                        name.into(),
                        description.into(),
                        true.into(),
                    ])
                    .on_conflict(
                        OnConflict::column(Entitlement::Code)
                            .do_nothing()
                            .to_owned(),
                    )
                    .to_owned(),
            )
            .await?;
    }
    Ok(())
}

const COMMUNITY_ENTITLEMENTS: [(u128, &str, &str, &str); 3] = [
    (
        0x10000000000040008000000000000001,
        "local_tracking",
        "本地记录",
        "本地饮水、睡眠和训练记录。",
    ),
    (
        0x10000000000040008000000000000002,
        "training_library",
        "训练库",
        "内置基础训练与逐组执行。",
    ),
    (
        0x10000000000040008000000000000003,
        "progress_history",
        "历史趋势",
        "身体和训练历史趋势。",
    ),
];

#[derive(DeriveIden)]
enum User {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum MembershipNumberCounter {
    Table,
    Id,
    LastNumber,
}

#[derive(DeriveIden)]
enum Membership {
    Table,
    Id,
    UserId,
    MemberNumber,
    DisplayName,
    JoinedAt,
    Tier,
    Status,
    ExpiresAt,
    TermsVersion,
    AcceptedAt,
}

#[derive(DeriveIden)]
enum Entitlement {
    Table,
    Id,
    Code,
    Name,
    Description,
    IsActive,
    CreatedAt,
    UpdatedAt,
}

#[derive(DeriveIden)]
enum MembershipEntitlement {
    Table,
    MembershipId,
    EntitlementId,
    GrantedAt,
    ExpiresAt,
    RevokedAt,
}
