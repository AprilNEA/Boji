//! SeaORM entity for the entitlement catalog.

use sea_orm::entity::prelude::*;

/// A stable entitlement definition owned by the server catalog.
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "entitlement")]
pub struct Model {
    /// Stable catalog identifier.
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    /// Stable machine-readable entitlement code.
    pub code: String,
    /// Server-controlled display name.
    pub name: String,
    /// Server-controlled display description.
    pub description: String,
    /// Whether new and existing grants can be effective.
    pub is_active: bool,
    /// UTC catalog creation time.
    pub created_at: DateTimeUtc,
    /// UTC catalog update time.
    pub updated_at: DateTimeUtc,
}

/// Relations from an entitlement catalog definition.
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    /// The membership grants for this catalog entry.
    #[sea_orm(has_many = "super::membership_entitlement::Entity")]
    MembershipEntitlement,
}

impl Related<super::membership_entitlement::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::MembershipEntitlement.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
