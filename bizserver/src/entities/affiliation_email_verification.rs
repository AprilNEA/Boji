//! SeaORM entity for organization email verification codes.

use sea_orm::entity::prelude::*;

/// One code sent to an affiliation email address. Rows older than 24 hours are
/// deleted when a new code is created.
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "affiliation_email_verification")]
pub struct Model {
    /// Verification identifier.
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    /// Foreign key to `user.id`.
    pub user_id: String,
    /// The stored organization type of the parent affiliation, for example
    /// `school`.
    pub organization_type: String,
    /// HMAC-SHA256 of the canonical affiliation email address.
    pub email_hmac: Vec<u8>,
    /// The domain of the address.
    pub email_domain: String,
    /// The address with most of its local part hidden.
    pub masked_email: String,
    /// A JSON array of the UUIDs of the matching organizations.
    pub candidate_organization_ids: Json,
    /// HMAC-SHA256 of the verification ID and the code.
    pub code_hmac: Vec<u8>,
    /// The number of wrong codes.
    pub failed_attempts: i32,
    /// When the code was sent.
    pub created_at: DateTimeUtc,
    /// When the code expires.
    pub expires_at: DateTimeUtc,
    /// When a correct code was used.
    pub consumed_at: Option<DateTimeUtc>,
}

/// Relations from an affiliation email verification.
#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
