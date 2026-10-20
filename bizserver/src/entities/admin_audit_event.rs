//! SeaORM entity for append-only membership-administration audit events.

use sea_orm::entity::prelude::*;

/// One auditable administrator mutation without credentials or health data.
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "admin_audit_event")]
pub struct Model {
    /// Stable audit-event UUID.
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    /// Administrator identifier, cleared when the actor user is deleted.
    pub actor_user_id: Option<String>,
    /// Target membership owner identifier, cleared when that user is deleted.
    pub target_user_id: Option<String>,
    /// Stable action name for the mutation.
    pub action: String,
    /// Operator-supplied, normalized explanation.
    pub reason: String,
    /// Affected IDs and status only. This value contains no identity profile data.
    pub metadata: Json,
    /// UTC time when the mutation was committed.
    pub created_at: DateTimeUtc,
}

/// Audit events have no SeaORM relations because their user references are optional.
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
