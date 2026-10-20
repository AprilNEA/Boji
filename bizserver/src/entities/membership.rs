//! SeaORM entity for membership cards.

use sea_orm::entity::prelude::*;

/// A free membership card stored for one authenticated user.
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "membership")]
pub struct Model {
    /// Stable membership-card identifier.
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    /// Foreign key to `user.id`.
    pub user_id: String,
    /// Opaque, server-issued member number.
    pub member_number: String,
    /// Immutable card display name.
    pub display_name: String,
    /// UTC time when the card was issued.
    pub joined_at: DateTimeUtc,
    /// Persisted membership tier. Current value: `community`.
    pub tier: String,
    /// Persisted membership status. Values: `active` or `suspended`.
    pub status: String,
    /// Optional UTC membership expiry time.
    pub expires_at: Option<DateTimeUtc>,
    /// Accepted membership terms version.
    pub terms_version: String,
    /// UTC time when the terms were accepted.
    pub accepted_at: DateTimeUtc,
}

/// Relations from a membership card.
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// The grants issued to this membership card.
    #[sea_orm(has_many = "super::membership_entitlement::Entity")]
    MembershipEntitlement,
}

impl Related<super::membership_entitlement::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::MembershipEntitlement.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
