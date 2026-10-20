//! SeaORM entity for the `account` authentication table.

use better_auth::seaorm::AuthEntity;
use sea_orm::entity::prelude::*;
use serde::Serialize;

/// An authentication account, including the email-password credential record.
#[derive(Clone, Debug, PartialEq, Serialize, DeriveEntityModel, AuthEntity)]
#[auth(role = "account")]
#[sea_orm(table_name = "account")]
pub struct Model {
    /// Stable account identifier.
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    /// Provider-local account identifier.
    pub account_id: String,
    /// Authentication provider identifier, such as `credential`.
    pub provider_id: String,
    /// Owning `user.id` value.
    pub user_id: String,
    /// Optional OAuth access token. OAuth is not enabled in this migration.
    pub access_token: Option<String>,
    /// Optional OAuth refresh token. OAuth is not enabled in this migration.
    pub refresh_token: Option<String>,
    /// Optional OAuth ID token. OAuth is not enabled in this migration.
    pub id_token: Option<String>,
    /// Optional OAuth access-token expiry time.
    pub access_token_expires_at: Option<DateTimeUtc>,
    /// Optional OAuth refresh-token expiry time.
    pub refresh_token_expires_at: Option<DateTimeUtc>,
    /// Optional OAuth scope.
    pub scope: Option<String>,
    /// Password hash for the `credential` provider.
    pub password: Option<String>,
    /// Creation time in UTC.
    pub created_at: DateTimeUtc,
    /// Last update time in UTC.
    pub updated_at: DateTimeUtc,
}

/// Relations for the `account` entity.
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
