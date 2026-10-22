//! SeaORM entity for the email domains of organizations.

use sea_orm::entity::prelude::*;

/// One email domain of one organization.
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "organization_domain")]
pub struct Model {
    /// A lowercase ASCII domain without `www.`, for example `xjtlu.edu.cn`.
    #[sea_orm(primary_key, auto_increment = false)]
    pub domain: String,
    /// Foreign key to `organization.id`.
    #[sea_orm(primary_key, auto_increment = false)]
    pub organization_id: Uuid,
    /// `allow` accepts the domain and its subdomains. `exclude` rejects them,
    /// for example an alumni domain.
    pub kind: String,
    /// `hipo` for the snapshot, `override` for `data/schools/overrides.json`.
    pub source: String,
}

/// Relations from an organization domain.
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
