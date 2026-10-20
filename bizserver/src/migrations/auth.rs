//! Versioned authentication schema creation.
//!
//! The parent migrator owns migration ordering and calls [`up`] explicitly. This
//! module never connects to or modifies a database by itself.

use sea_orm_migration::prelude::*;
use sea_orm_migration::schema::*;

/// Creates the Better Auth tables used by Boji.
///
/// The tables are named `user`, `session`, `account`, and `verification`.
/// Every primary key is a `String`-compatible PostgreSQL `TEXT` value so that
/// business tables can reference `user.id` without an ID conversion.
pub async fn up(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    manager
        .create_table(
            Table::create()
                .table("user")
                .col(text("id").primary_key())
                .col(text_null("name"))
                .col(text_null("email").unique_key())
                .col(boolean("email_verified").not_null().default(false))
                .col(text_null("image"))
                .col(text_null("role"))
                .col(timestamp_with_time_zone("created_at"))
                .col(timestamp_with_time_zone("updated_at"))
                .to_owned(),
        )
        .await?;

    manager
        .create_table(
            Table::create()
                .table("session")
                .col(text("id").primary_key())
                .col(timestamp_with_time_zone("expires_at"))
                .col(text("token").unique_key())
                .col(timestamp_with_time_zone("created_at"))
                .col(timestamp_with_time_zone("updated_at"))
                .col(text_null("ip_address"))
                .col(text_null("user_agent"))
                .col(text("user_id"))
                .col(boolean("active").not_null().default(true))
                .foreign_key(
                    ForeignKey::create()
                        .name("session_user_id_fkey")
                        .from("session", "user_id")
                        .to("user", "id")
                        .on_delete(ForeignKeyAction::Cascade),
                )
                .to_owned(),
        )
        .await?;

    manager
        .create_table(
            Table::create()
                .table("account")
                .col(text("id").primary_key())
                .col(text("account_id"))
                .col(text("provider_id"))
                .col(text("user_id"))
                .col(text_null("access_token"))
                .col(text_null("refresh_token"))
                .col(text_null("id_token"))
                .col(timestamp_with_time_zone_null("access_token_expires_at"))
                .col(timestamp_with_time_zone_null("refresh_token_expires_at"))
                .col(text_null("scope"))
                .col(text_null("password"))
                .col(timestamp_with_time_zone("created_at"))
                .col(timestamp_with_time_zone("updated_at"))
                .foreign_key(
                    ForeignKey::create()
                        .name("account_user_id_fkey")
                        .from("account", "user_id")
                        .to("user", "id")
                        .on_delete(ForeignKeyAction::Cascade),
                )
                .to_owned(),
        )
        .await?;

    manager
        .create_table(
            Table::create()
                .table("verification")
                .col(text("id").primary_key())
                .col(text("identifier"))
                .col(text("value"))
                .col(timestamp_with_time_zone("expires_at"))
                .col(timestamp_with_time_zone("created_at"))
                .col(timestamp_with_time_zone("updated_at"))
                .to_owned(),
        )
        .await?;

    manager
        .create_index(
            Index::create()
                .name("session_user_id_idx")
                .table("session")
                .col("user_id")
                .to_owned(),
        )
        .await?;
    manager
        .create_index(
            Index::create()
                .name("account_provider_account_idx")
                .table("account")
                .col("provider_id")
                .col("account_id")
                .unique()
                .to_owned(),
        )
        .await?;
    manager
        .create_index(
            Index::create()
                .name("verification_identifier_idx")
                .table("verification")
                .col("identifier")
                .to_owned(),
        )
        .await
}
