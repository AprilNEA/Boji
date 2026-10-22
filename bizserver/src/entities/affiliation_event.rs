//! SeaORM entity for the events of affiliations.

use sea_orm::entity::prelude::*;

/// One change of the affiliation of one user.
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "affiliation_event")]
pub struct Model {
    /// Event identifier.
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    /// Foreign key to `user.id`.
    pub user_id: String,
    /// Foreign key to `organization.id`.
    pub organization_id: Uuid,
    /// `verified`, `renewed`, `changed`, `left`, `displaced` or `revoked`.
    pub action: String,
    /// When the change happened.
    pub created_at: DateTimeUtc,
}

/// Relations from an affiliation event.
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
