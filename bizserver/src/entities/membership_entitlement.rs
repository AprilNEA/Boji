//! SeaORM entity for auditable membership entitlement grants.

use sea_orm::entity::prelude::*;

/// A grant of one catalog entitlement to one membership card.
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "membership_entitlement")]
pub struct Model {
    /// Membership-card component of the composite primary key.
    #[sea_orm(primary_key, auto_increment = false)]
    pub membership_id: Uuid,
    /// Catalog-entitlement component of the composite primary key.
    #[sea_orm(primary_key, auto_increment = false)]
    pub entitlement_id: Uuid,
    /// UTC time when the server granted the entitlement.
    pub granted_at: DateTimeUtc,
    /// Optional UTC expiry time for this grant.
    pub expires_at: Option<DateTimeUtc>,
    /// Optional UTC revocation time for this grant.
    pub revoked_at: Option<DateTimeUtc>,
}

/// Relations from a membership entitlement grant.
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// The card that owns this grant.
    #[sea_orm(
        belongs_to = "super::membership::Entity",
        from = "Column::MembershipId",
        to = "super::membership::Column::Id",
        on_delete = "Cascade"
    )]
    Membership,
    /// The catalog definition granted to the card.
    #[sea_orm(
        belongs_to = "super::entitlement::Entity",
        from = "Column::EntitlementId",
        to = "super::entitlement::Column::Id",
        on_delete = "Restrict"
    )]
    Entitlement,
}

impl Related<super::membership::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Membership.def()
    }
}

impl Related<super::entitlement::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Entitlement.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
