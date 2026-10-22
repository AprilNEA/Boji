//! SeaORM entity for the frozen ranking counts of organizations.

use sea_orm::entity::prelude::*;

/// The counts of one organization at freeze time. The row exists while the organization
/// is frozen.
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "organization_standing_freeze")]
pub struct Model {
    /// Foreign key to `organization.id`.
    #[sea_orm(primary_key, auto_increment = false)]
    pub organization_id: Uuid,
    /// The number of counted members at freeze time.
    pub member_count: i64,
    /// The counted members whose counting started in the week of the freeze.
    pub weekly_new_count: i64,
    /// When the organization reached `member_count`. `None` when it is zero.
    pub reach_time: Option<DateTimeUtc>,
    /// The operator who froze the organization. `None` after that account is deleted.
    pub actor_user_id: Option<String>,
    /// When the organization was frozen.
    pub created_at: DateTimeUtc,
}

/// Relations from a frozen organization.
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
