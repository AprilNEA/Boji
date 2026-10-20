//! SeaORM entity for the `session` authentication table.

use better_auth::seaorm::AuthEntity;
use sea_orm::entity::prelude::*;
use serde::Serialize;

/// A server-side Better Auth session.
#[derive(Clone, Debug, PartialEq, Serialize, DeriveEntityModel, AuthEntity)]
#[auth(role = "session")]
#[sea_orm(table_name = "session")]
pub struct Model {
    /// Stable session identifier.
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: String,
    /// Session expiry time in UTC.
    pub expires_at: DateTimeUtc,
    /// Opaque session token stored server-side.
    pub token: String,
    /// Creation time in UTC.
    pub created_at: DateTimeUtc,
    /// Last update time in UTC.
    pub updated_at: DateTimeUtc,
    /// Client IP address captured by Better Auth, if available.
    pub ip_address: Option<String>,
    /// Client user agent captured by Better Auth, if available.
    pub user_agent: Option<String>,
    /// Owning `user.id` value.
    pub user_id: String,
    /// Whether this session can authenticate requests.
    pub active: bool,
    /// Original actor for a Better Auth impersonation session.
    pub impersonated_by: Option<String>,
}

/// Relations for the `session` entity.
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
