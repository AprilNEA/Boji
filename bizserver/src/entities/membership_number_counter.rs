//! SeaORM entity for the membership-number allocation cursor.

use sea_orm::entity::prelude::*;

/// The singleton cursor used to allocate sequential membership numbers.
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "membership_number_counter")]
pub struct Model {
    /// Singleton primary key. The migration constrains this value to `1`.
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: i32,
    /// The last allocated positive membership number.
    pub last_number: i64,
}

/// The counter has no entity relations.
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
