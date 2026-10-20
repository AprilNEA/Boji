//! Membership-card enrollment and entitlement projection.
//!
//! The public DTO uses UTC `chrono::DateTime<Utc>` fields. Serde serializes
//! these fields as RFC 3339 UTC strings under the existing camel-case API keys.

use std::collections::HashMap;

use chrono::{DateTime, Utc};
use sea_orm::sea_query::LockType;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, Condition, ConnectionTrait, DatabaseConnection,
    DatabaseTransaction, DbBackend, DbErr, EntityTrait, QueryFilter, QueryOrder, QuerySelect, Set,
    Statement, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use uuid::Uuid;

use crate::entities::{entitlement, membership, membership_entitlement, membership_number_counter};

/// The only currently accepted community-membership terms version.
pub const TERMS_VERSION: &str = "community-v1";

/// Server-controlled codes granted to each community membership card.
pub const COMMUNITY_ENTITLEMENT_CODES: [&str; 3] =
    ["local_tracking", "training_library", "progress_history"];

/// Membership tier exposed by the membership API.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MembershipTier {
    /// Free community membership.
    Community,
}

/// Membership status exposed by the membership API.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MembershipStatus {
    /// The membership card can expose effective grants.
    Active,
    /// The card remains visible, but it exposes no effective grants.
    Suspended,
}

/// One effective entitlement returned with a membership card.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Entitlement {
    /// Stable catalog identifier.
    pub id: String,
    /// Stable machine-readable catalog code.
    pub code: String,
    /// Server-controlled display name.
    pub name: String,
    /// Server-controlled display description.
    pub description: String,
    /// UTC time when this membership received the grant.
    pub granted_at: DateTime<Utc>,
    /// Optional UTC time when this grant expires.
    pub expires_at: Option<DateTime<Utc>>,
}

/// Membership card returned by the membership API.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Membership {
    /// Stable membership-card identifier.
    pub id: String,
    /// Authenticated user identifier that owns this card.
    pub user_id: String,
    /// Opaque server-issued membership number.
    pub member_number: String,
    /// Immutable display name selected during enrollment.
    pub display_name: String,
    /// UTC time when the membership card was issued.
    pub joined_at: DateTime<Utc>,
    /// Card tier. Current cards always use `Community`.
    pub tier: MembershipTier,
    /// Current membership status.
    pub status: MembershipStatus,
    /// Effective server-authorized entitlements only.
    pub entitlements: Vec<Entitlement>,
    /// Optional UTC time when the membership card expires.
    pub expires_at: Option<DateTime<Utc>>,
}

/// Typed membership-domain errors for RPC error mapping.
#[derive(Debug, Error)]
pub enum MembershipError {
    /// A required caller input is empty or violates the display-name policy.
    #[error("invalid membership input: {field}")]
    InvalidInput {
        /// Input field that failed validation.
        field: &'static str,
    },
    /// The caller did not accept the current membership terms.
    #[error("the current membership terms were not accepted")]
    TermsNotAccepted,
    /// Required counter or catalog defaults have not been initialized.
    #[error("membership defaults are missing: {name}")]
    MissingDefaults {
        /// Missing database default or seed set.
        name: &'static str,
    },
    /// A database operation failed.
    #[error("membership database operation failed: {0}")]
    Database(#[from] DbErr),
}

/// Validated enrollment inputs used inside the membership transaction.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Enrollment {
    user_id: String,
    display_name: String,
}

impl Enrollment {
    /// Validate and normalize inputs from the enrollment boundary.
    pub fn parse(
        user_id: &str,
        display_name: &str,
        terms_version: &str,
    ) -> Result<Self, MembershipError> {
        validate_user_id(user_id)?;
        if terms_version != TERMS_VERSION {
            return Err(MembershipError::TermsNotAccepted);
        }

        let display_name = display_name.trim();
        if !is_valid_display_name(display_name) {
            return Err(MembershipError::InvalidInput {
                field: "displayName",
            });
        }

        Ok(Self {
            user_id: user_id.to_owned(),
            display_name: display_name.to_owned(),
        })
    }

    /// Return the authenticated user identifier.
    pub fn user_id(&self) -> &str {
        &self.user_id
    }

    /// Return the normalized immutable card display name.
    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}

/// An allocated opaque member number.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct MemberNumber(String);

impl MemberNumber {
    /// Allocate the number immediately after a persisted counter value.
    pub fn after(last_number: i64) -> Result<Self, MembershipError> {
        let next_number = last_number.checked_add(1).ok_or_else(|| {
            MembershipError::Database(DbErr::Custom(
                "membership number counter has reached its maximum".to_owned(),
            ))
        })?;
        if next_number < 1 {
            return Err(MembershipError::Database(DbErr::Custom(
                "membership number counter must remain positive".to_owned(),
            )));
        }

        Ok(Self(format!("{next_number:0>6}")))
    }

    /// Return the member number as the opaque external string.
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Get the caller's membership card, if the caller has enrolled.
pub async fn get(
    db: &DatabaseConnection,
    user_id: &str,
) -> Result<Option<Membership>, MembershipError> {
    validate_user_id(user_id)?;
    match find_membership(db, user_id).await? {
        Some(record) => Ok(Some(to_membership(db, record).await?)),
        None => Ok(None),
    }
}

/// Enroll a user once and return the existing or newly issued membership card.
///
/// This function validates the display name and terms before it locks the user.
/// It locks that user's authentication row before it locks the number cursor.
/// Any failure rolls back the cursor update and all entitlement grants.
pub async fn enroll(
    db: &DatabaseConnection,
    user_id: &str,
    display_name: &str,
    terms_version: &str,
) -> Result<Membership, MembershipError> {
    let enrollment = Enrollment::parse(user_id, display_name, terms_version)?;
    let transaction = db.begin().await?;
    let result = enroll_in_transaction(&transaction, &enrollment).await;

    match result {
        Ok(membership) => {
            transaction.commit().await?;
            Ok(membership)
        }
        Err(error) => {
            transaction.rollback().await?;
            Err(error)
        }
    }
}

async fn enroll_in_transaction(
    transaction: &DatabaseTransaction,
    enrollment: &Enrollment,
) -> Result<Membership, MembershipError> {
    lock_user(transaction, enrollment.user_id()).await?;

    if let Some(record) = find_membership(transaction, enrollment.user_id()).await? {
        return to_membership(transaction, record).await;
    }

    let counter = membership_number_counter::Entity::find_by_id(1)
        .lock(LockType::Update)
        .one(transaction)
        .await?
        .ok_or(MembershipError::MissingDefaults {
            name: "membership_number_counter",
        })?;
    let next_number = counter.last_number.checked_add(1).ok_or_else(|| {
        MembershipError::Database(DbErr::Custom(
            "membership number counter has reached its maximum".to_owned(),
        ))
    })?;
    let member_number = MemberNumber::after(counter.last_number)?;

    let mut counter_update: membership_number_counter::ActiveModel = counter.into();
    counter_update.last_number = Set(next_number);
    counter_update.update(transaction).await?;

    let accepted_at = Utc::now();
    let record = membership::ActiveModel {
        id: Set(Uuid::new_v4()),
        user_id: Set(enrollment.user_id().to_owned()),
        member_number: Set(member_number.as_str().to_owned()),
        display_name: Set(enrollment.display_name().to_owned()),
        joined_at: Set(accepted_at),
        tier: Set("community".to_owned()),
        status: Set("active".to_owned()),
        expires_at: Set(None),
        terms_version: Set(TERMS_VERSION.to_owned()),
        accepted_at: Set(accepted_at),
    }
    .insert(transaction)
    .await?;

    grant_community_entitlements(transaction, record.id, accepted_at).await?;
    to_membership(transaction, record).await
}

async fn lock_user(
    transaction: &DatabaseTransaction,
    user_id: &str,
) -> Result<(), MembershipError> {
    let statement = Statement::from_sql_and_values(
        DbBackend::Postgres,
        "SELECT id FROM \"user\" WHERE id = $1 FOR UPDATE",
        [user_id.into()],
    );
    if transaction.query_one_raw(statement).await?.is_none() {
        return Err(MembershipError::Database(DbErr::Custom(
            "authenticated user does not exist".to_owned(),
        )));
    }
    Ok(())
}

async fn find_membership<C>(
    db: &C,
    user_id: &str,
) -> Result<Option<membership::Model>, MembershipError>
where
    C: ConnectionTrait,
{
    membership::Entity::find()
        .filter(membership::Column::UserId.eq(user_id))
        .one(db)
        .await
        .map_err(MembershipError::from)
}

async fn grant_community_entitlements<C>(
    db: &C,
    membership_id: Uuid,
    granted_at: DateTime<Utc>,
) -> Result<(), MembershipError>
where
    C: ConnectionTrait,
{
    let definitions = entitlement::Entity::find()
        .filter(entitlement::Column::Code.is_in(COMMUNITY_ENTITLEMENT_CODES))
        .all(db)
        .await?;
    if definitions.len() != COMMUNITY_ENTITLEMENT_CODES.len() {
        return Err(MembershipError::MissingDefaults {
            name: "community entitlement catalog",
        });
    }

    let grants = definitions
        .into_iter()
        .map(|definition| membership_entitlement::ActiveModel {
            membership_id: Set(membership_id),
            entitlement_id: Set(definition.id),
            granted_at: Set(granted_at),
            expires_at: Set(None),
            revoked_at: Set(None),
        });
    membership_entitlement::Entity::insert_many(grants)
        .exec(db)
        .await?;
    Ok(())
}

async fn to_membership<C>(db: &C, record: membership::Model) -> Result<Membership, MembershipError>
where
    C: ConnectionTrait,
{
    let tier = parse_tier(&record.tier)?;
    let status = parse_status(&record.status)?;
    let entitlements = if status == MembershipStatus::Active {
        list_effective_entitlements(db, record.id).await?
    } else {
        Vec::new()
    };

    Ok(Membership {
        id: record.id.to_string(),
        user_id: record.user_id,
        member_number: record.member_number,
        display_name: record.display_name,
        joined_at: record.joined_at,
        tier,
        status,
        entitlements,
        expires_at: record.expires_at,
    })
}

async fn list_effective_entitlements<C>(
    db: &C,
    membership_id: Uuid,
) -> Result<Vec<Entitlement>, MembershipError>
where
    C: ConnectionTrait,
{
    let now = Utc::now();
    let grants = membership_entitlement::Entity::find()
        .filter(membership_entitlement::Column::MembershipId.eq(membership_id))
        .filter(membership_entitlement::Column::RevokedAt.is_null())
        .filter(membership_entitlement::Column::GrantedAt.lte(now))
        .filter(
            Condition::any()
                .add(membership_entitlement::Column::ExpiresAt.is_null())
                .add(membership_entitlement::Column::ExpiresAt.gt(now)),
        )
        .all(db)
        .await?;
    if grants.is_empty() {
        return Ok(Vec::new());
    }

    let grant_by_entitlement = grants
        .into_iter()
        .map(|grant| (grant.entitlement_id, grant))
        .collect::<HashMap<_, _>>();
    let entitlement_ids = grant_by_entitlement.keys().copied().collect::<Vec<_>>();
    let definitions = entitlement::Entity::find()
        .filter(entitlement::Column::Id.is_in(entitlement_ids))
        .filter(entitlement::Column::IsActive.eq(true))
        .order_by_asc(entitlement::Column::CreatedAt)
        .order_by_asc(entitlement::Column::Id)
        .all(db)
        .await?;

    Ok(definitions
        .into_iter()
        .filter_map(|definition| {
            grant_by_entitlement
                .get(&definition.id)
                .map(|grant| Entitlement {
                    id: definition.id.to_string(),
                    code: definition.code,
                    name: definition.name,
                    description: definition.description,
                    granted_at: grant.granted_at,
                    expires_at: grant.expires_at,
                })
        })
        .collect())
}

fn validate_user_id(user_id: &str) -> Result<(), MembershipError> {
    if user_id.is_empty() || user_id.chars().any(char::is_control) {
        return Err(MembershipError::InvalidInput { field: "userId" });
    }
    Ok(())
}

fn is_valid_display_name(value: &str) -> bool {
    !value.is_empty()
        && value.chars().count() <= 40
        && !value.chars().any(is_disallowed_display_character)
}

fn is_disallowed_display_character(character: char) -> bool {
    character.is_control()
        || matches!(
            character as u32,
            0x00AD
                | 0x0600..=0x0605
                | 0x061C
                | 0x06DD
                | 0x070F
                | 0x0890..=0x0891
                | 0x08E2
                | 0x180E
                | 0x200B..=0x200F
                | 0x202A..=0x202E
                | 0x2060..=0x2064
                | 0x2066..=0x206F
                | 0xFEFF
                | 0xFFF9..=0xFFFB
                | 0x110BD
                | 0x110CD
                | 0x13430..=0x1343F
                | 0x1BCA0..=0x1BCA3
                | 0x1D173..=0x1D17A
                | 0xE0001
                | 0xE0020..=0xE007F
                | 0xE000..=0xF8FF
                | 0xF0000..=0xFFFFD
                | 0x100000..=0x10FFFD
                | 0x003C
                | 0x003E
                | 0x0026
        )
}

fn parse_tier(value: &str) -> Result<MembershipTier, MembershipError> {
    match value {
        "community" => Ok(MembershipTier::Community),
        _ => Err(MembershipError::Database(DbErr::Custom(
            "membership tier is not recognized".to_owned(),
        ))),
    }
}

fn parse_status(value: &str) -> Result<MembershipStatus, MembershipError> {
    match value {
        "active" => Ok(MembershipStatus::Active),
        "suspended" => Ok(MembershipStatus::Suspended),
        _ => Err(MembershipError::Database(DbErr::Custom(
            "membership status is not recognized".to_owned(),
        ))),
    }
}
