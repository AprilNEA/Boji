//! SeaORM entity for the organization list.

use sea_orm::entity::prelude::*;

/// One organization of an organization list.
///
/// Each type has its own list. Only `boji-bizserver import-schools` writes the
/// `school` rows. The Git history of `data/schools/` records every change.
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "organization")]
pub struct Model {
    /// Stable organization identifier, assigned at the first import.
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    /// The stored organization type, for example `school`.
    pub organization_type: String,
    /// The source record, unique per type. For `school`:
    /// `{alpha_two_code}:{name}` of the Hipo record.
    pub source_key: String,
    /// The English name from the Hipo record.
    pub english_name: String,
    /// The Chinese name from `data/schools/overrides.json`.
    pub chinese_name: Option<String>,
    /// The ISO 3166-1 alpha-2 code from the Hipo record.
    pub region_code: String,
    /// `active`, or `retired` when the latest snapshot no longer lists it.
    pub state: String,
    /// The import run that last listed the organization.
    pub imported_at: DateTimeUtc,
    /// The first import that listed the organization.
    pub created_at: DateTimeUtc,
}

/// Relations from an organization.
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
