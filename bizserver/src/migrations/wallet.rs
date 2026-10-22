//! Tables of the Apple Wallet web service.
//!
//! `wallet_pass` records when the content of a membership pass last changed.
//! `wallet_registration` records which devices receive update notifications
//! for a pass, and their push tokens. Both rows go away with the membership.

use sea_orm_migration::prelude::*;

/// Create the Wallet web service tables.
///
/// The membership migration must create `membership(id uuid)` before this runs.
pub async fn up(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    manager
        .create_table(
            Table::create()
                .table(WalletPass::Table)
                .col(
                    ColumnDef::new(WalletPass::MembershipId)
                        .uuid()
                        .not_null()
                        .primary_key(),
                )
                .col(
                    ColumnDef::new(WalletPass::UpdateTime)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("wallet_pass_membership_fk")
                        .from(WalletPass::Table, WalletPass::MembershipId)
                        .to(Membership::Table, Membership::Id)
                        .on_delete(ForeignKeyAction::Cascade),
                )
                .to_owned(),
        )
        .await?;
    manager
        .create_table(
            Table::create()
                .table(WalletRegistration::Table)
                .col(
                    ColumnDef::new(WalletRegistration::DeviceLibraryIdentifier)
                        .text()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(WalletRegistration::MembershipId)
                        .uuid()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(WalletRegistration::PushToken)
                        .text()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(WalletRegistration::CreateTime)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(WalletRegistration::UpdateTime)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .primary_key(
                    Index::create()
                        .col(WalletRegistration::DeviceLibraryIdentifier)
                        .col(WalletRegistration::MembershipId),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("wallet_registration_pass_fk")
                        .from(WalletRegistration::Table, WalletRegistration::MembershipId)
                        .to(WalletPass::Table, WalletPass::MembershipId)
                        .on_delete(ForeignKeyAction::Cascade),
                )
                .check(Check::named(
                    "wallet_registration_device_length",
                    Expr::cust("char_length(device_library_identifier) BETWEEN 1 AND 128"),
                ))
                .check(Check::named(
                    "wallet_registration_push_token_length",
                    Expr::cust("char_length(push_token) BETWEEN 1 AND 256"),
                ))
                .to_owned(),
        )
        .await?;
    manager
        .create_index(
            Index::create()
                .name("wallet_registration_membership_idx")
                .table(WalletRegistration::Table)
                .col(WalletRegistration::MembershipId)
                .to_owned(),
        )
        .await?;
    manager
        .create_index(
            Index::create()
                .name("wallet_registration_push_token_idx")
                .table(WalletRegistration::Table)
                .col(WalletRegistration::PushToken)
                .to_owned(),
        )
        .await
}

#[derive(DeriveIden)]
enum Membership {
    Table,
    Id,
}

#[derive(DeriveIden)]
enum WalletPass {
    Table,
    MembershipId,
    UpdateTime,
}

#[derive(DeriveIden)]
enum WalletRegistration {
    Table,
    DeviceLibraryIdentifier,
    MembershipId,
    PushToken,
    CreateTime,
    UpdateTime,
}
