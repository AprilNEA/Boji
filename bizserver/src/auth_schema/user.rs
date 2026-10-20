//! SeaORM entity for the `user` authentication table.

use better_auth::seaorm::AuthEntity;
use sea_orm::entity::prelude::*;
use serde::Serialize;

/// A Boji user managed by Better Auth.
#[derive(Clone, Debug, PartialEq, Serialize, DeriveEntityModel, AuthEntity)]
#[auth(role = "user")]
#[sea_orm(table_name = "user")]
pub struct Model {
    /// Stable application user identifier.
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    /// User-provided display name.
    pub name: Option<String>,
    /// User email address.
    pub email: Option<String>,
    /// Whether the user completed email verification.
    pub email_verified: bool,
    /// Optional profile image URL.
    pub image: Option<String>,
    /// Optional application role.
    pub role: Option<String>,
    /// Creation time in UTC.
    pub created_at: DateTimeUtc,
    /// Last update time in UTC.
    pub updated_at: DateTimeUtc,
}

/// Relations for the `user` entity.
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
