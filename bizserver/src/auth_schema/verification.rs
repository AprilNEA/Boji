//! SeaORM entity for the `verification` authentication table.

use better_auth::seaorm::AuthEntity;
use sea_orm::entity::prelude::*;
use serde::Serialize;

/// A short-lived Better Auth verification record.
#[derive(Clone, Debug, PartialEq, Serialize, DeriveEntityModel, AuthEntity)]
#[auth(role = "verification")]
#[sea_orm(table_name = "verification")]
pub struct Model {
    /// Stable verification identifier.
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    /// Subject that owns this verification record.
    pub identifier: String,
    /// Opaque verification value.
    pub value: String,
    /// Expiry time in UTC.
    pub expires_at: DateTimeUtc,
    /// Creation time in UTC.
    pub created_at: DateTimeUtc,
    /// Last update time in UTC.
    pub updated_at: DateTimeUtc,
}

/// Relations for the `verification` entity.
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
