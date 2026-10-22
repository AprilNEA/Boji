//! SeaORM entity for the affiliation of a user.

use sea_orm::entity::prelude::*;

/// The affiliation of one user with one organization type. A user has at most
/// one row for each type.
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "affiliation")]
pub struct Model {
    /// Foreign key to `user.id`.
    #[sea_orm(primary_key, auto_increment = false)]
    pub user_id: String,
    /// The stored organization type, for example `school`. Part of the
    /// composite foreign key to `organization (id, organization_type)`.
    #[sea_orm(primary_key, auto_increment = false)]
    pub organization_type: String,
    /// Foreign key to `organization.id`. The organization has the type
    /// `organization_type`.
    pub organization_id: Uuid,
    /// `active` or `ended`. Expiry does not change the state: readers compare
    /// `expires_at` with the current time.
    pub state: String,
    /// HMAC-SHA256 of the canonical email address. Unique per type. NULL after
    /// the verification ends.
    pub email_hmac: Option<Vec<u8>>,
    /// The domain of the verified address.
    pub email_domain: String,
    /// The last successful code check.
    pub verified_at: DateTimeUtc,
    /// The start of the current continuous counting.
    pub counted_since: DateTimeUtc,
    /// When the user first verified the current organization. The organization change
    /// cooldown starts here.
    pub organization_since: DateTimeUtc,
    /// When the verification expires.
    pub expires_at: DateTimeUtc,
    /// When the user left, or another account took over the address.
    pub ended_at: Option<DateTimeUtc>,
}

/// Relations from an affiliation.
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
