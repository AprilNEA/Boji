//! The organization list, organization email verification and the public organization ranking.
//!
//! Input: the bundled organization list, affiliation email addresses, verification codes
//! and the database.
//! Output: organizations, the affiliation of each user and ranking
//! snapshots.
//! Pos: domain. The transport converts these values to `boji.v1` messages.
//! `docs/developers/school-ranking.mdx` in the repository root is the design document.

mod affiliation;
mod catalog;
mod email;
pub mod import;
mod operation;
mod secret;
mod standing;
mod verification;

pub use affiliation::{
    Affiliation, AffiliationState, get_affiliation, leave_organization, list_user_affiliations,
};
pub use catalog::{
    Organization, OrganizationPage, OrganizationQuery, get_organization, list_organizations,
};
pub use email::AffiliationEmail;
pub use operation::{
    AffiliationListing, AffiliationQuery, ListingPosition, freeze_standing, list_affiliations,
    revoke_affiliation, unfreeze_standing,
};
pub use secret::{AffiliationEmailKey, KeyError, VerificationCode};
pub use standing::{Placement, RankedOrganization, Ranking, RankingCache, week_start};
pub use verification::{
    ConfirmRequest, IssuedVerification, Verification, confirm_verification, discard_verification,
    get_verification, issue_verification,
};

use chrono::{DateTime, TimeDelta, Utc};
use sea_orm::{ConnectionTrait, DatabaseTransaction, DbBackend, DbErr, EntityTrait, Statement};
use thiserror::Error;

use crate::entities::membership;
use sea_orm::{ColumnTrait, QueryFilter};

/// The fixed rules of affiliation and of the ranking.
///
/// `docs/developers/school-ranking.mdx` explains each value. The public guide
/// `docs/guide/school-ranking.mdx` repeats the values that users
/// see. Change all three places together.
pub mod policy {
    use chrono::TimeDelta;

    /// The number of digits of a verification code.
    pub const CODE_DIGITS: usize = 6;
    /// How long a code stays valid.
    pub const CODE_LIFETIME: TimeDelta = TimeDelta::minutes(10);
    /// The number of wrong codes after which a verification expires.
    pub const MAX_FAILED_ATTEMPTS: i32 = 5;
    /// The minimum time between two codes for one account.
    pub const RESEND_INTERVAL: TimeDelta = TimeDelta::seconds(60);
    /// The maximum number of codes for one account in [`ACCOUNT_WINDOW`].
    pub const ACCOUNT_LIMIT: usize = 5;
    /// The window of [`ACCOUNT_LIMIT`].
    pub const ACCOUNT_WINDOW: TimeDelta = TimeDelta::hours(24);
    /// The maximum number of codes for one address in [`ADDRESS_WINDOW`].
    pub const ADDRESS_LIMIT: usize = 3;
    /// The window of [`ADDRESS_LIMIT`].
    pub const ADDRESS_WINDOW: TimeDelta = TimeDelta::hours(1);
    /// How long the server keeps a verification row.
    pub const VERIFICATION_RETENTION: TimeDelta = TimeDelta::hours(24);
    /// The rules of [`OrganizationType::School`](super::OrganizationType::School).
    pub const SCHOOL: super::TypePolicy = super::TypePolicy {
        affiliation_lifetime: TimeDelta::days(365),
        change_cooldown: TimeDelta::days(30),
        public_threshold: 3,
    };
    /// How long the server reuses a computed ranking.
    pub const RANKING_CACHE_LIFETIME: TimeDelta = TimeDelta::seconds(60);
}

/// The type of an organization.
///
/// Each type has its own organization list, its own [`TypePolicy`] and its own
/// ranking. Add a type here, in `ORGANIZATION_TYPES` of the migration and in
/// `boji.v1.OrganizationType` together.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum OrganizationType {
    /// A university or college of the Hipo university-domains-list.
    School,
}

impl OrganizationType {
    /// Every type, in the order of `boji.v1.OrganizationType`.
    pub const ALL: [Self; 1] = [Self::School];

    /// The stored value and the resource ID segment, for example `school`.
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::School => "school",
        }
    }

    /// Parse a stored value or a resource ID segment.
    pub fn parse(value: &str) -> Option<Self> {
        Self::ALL.into_iter().find(|kind| kind.as_str() == value)
    }

    /// The rules of the type.
    pub const fn policy(self) -> &'static TypePolicy {
        match self {
            Self::School => &policy::SCHOOL,
        }
    }
}

/// The rules that can differ between organization types. The rules in
/// [`policy`] apply to every type.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct TypePolicy {
    /// How long an affiliation stays valid after each verification.
    pub affiliation_lifetime: TimeDelta,
    /// The minimum time between two organization changes of one user.
    pub change_cooldown: TimeDelta,
    /// The minimum number of counted members before the ranking shows an
    /// organization.
    pub public_threshold: i64,
}

/// Typed organization-domain errors for RPC error mapping.
#[derive(Debug, Error)]
pub enum OrganizationError {
    /// No organization has the ID.
    #[error("the organization does not exist")]
    OrganizationNotFound,
    /// The text is not an email address that the server can verify.
    #[error("the affiliation email address is invalid: {0}")]
    InvalidEmail(&'static str),
    /// No active organization accepts the domain, or the domain is excluded.
    #[error("no organization accepts the email domain")]
    DomainUnknown,
    /// The caller has no membership card.
    #[error("the user has no membership card")]
    MembershipRequired,
    /// The membership card of the caller is suspended.
    #[error("the membership card is suspended")]
    MembershipSuspended,
    /// The caller or the address reached a sending limit.
    #[error("the sending limit is reached")]
    RateLimited {
        /// The earliest time when the next code can be sent.
        retry_at: DateTime<Utc>,
    },
    /// The caller has no verification with the ID.
    #[error("the organization email verification does not exist")]
    VerificationNotFound,
    /// The code expired, was used, or received too many wrong codes.
    #[error("the organization email verification expired")]
    VerificationExpired,
    /// The code is wrong.
    #[error("the verification code is wrong")]
    CodeInvalid,
    /// The verification lists several organizations, and the request chose none.
    #[error("the request must choose an organization")]
    OrganizationChoiceRequired,
    /// The chosen organization is not a candidate of the verification.
    #[error("the chosen organization is not a candidate")]
    OrganizationNotCandidate,
    /// The organization would change within the cooldown period.
    #[error("the organization changed too recently")]
    ChangeTooSoon {
        /// The earliest time when an organization change can succeed.
        available_at: DateTime<Utc>,
    },
    /// The user has no active affiliation to end.
    #[error("the user has no affiliation")]
    AffiliationInactive,
    /// An operator froze an organization that is already frozen.
    #[error("the organization standing is already frozen")]
    StandingAlreadyFrozen,
    /// An operator unfroze an organization that is not frozen.
    #[error("the organization standing is not frozen")]
    StandingNotFrozen,
    /// A stored value violates an invariant of this module.
    #[error("stored organization data is invalid: {0}")]
    Corrupt(&'static str),
    /// An OpenSSL operation failed.
    #[error("a cryptographic operation failed: {0}")]
    Crypto(#[from] openssl::error::ErrorStack),
    /// A database operation failed.
    #[error("organization database operation failed: {0}")]
    Database(#[from] DbErr),
}

/// The SQL condition under which the row `a` of `affiliation` counts.
///
/// The ranking and `Affiliation.counted` use the same condition. `$1`
/// is the current time. The query must join `membership AS m` and
/// `"user" AS u` on `a.user_id`.
const COUNTED_CONDITION: &str = "a.state = 'active' \
     AND a.expires_at > $1 \
     AND m.status = 'active' \
     AND (m.expires_at IS NULL OR m.expires_at > $1) \
     AND (NOT u.banned OR (u.ban_expires IS NOT NULL AND u.ban_expires <= $1))";

/// Lock the authentication row of a user for the rest of the transaction.
///
/// Every write of this module for one user takes this lock first, so the
/// sending limits and the verification state change one at a time.
async fn lock_user(
    transaction: &DatabaseTransaction,
    user_id: &str,
) -> Result<(), OrganizationError> {
    if !try_lock_user(transaction, user_id).await? {
        return Err(OrganizationError::Corrupt(
            "authenticated user does not exist",
        ));
    }
    Ok(())
}

/// Lock the authentication row of a user, or return false when the user does
/// not exist. Operations methods name users that can be absent.
async fn try_lock_user(
    transaction: &DatabaseTransaction,
    user_id: &str,
) -> Result<bool, OrganizationError> {
    let statement = Statement::from_sql_and_values(
        DbBackend::Postgres,
        "SELECT id FROM \"user\" WHERE id = $1 FOR UPDATE",
        [user_id.into()],
    );
    Ok(transaction.query_one_raw(statement).await?.is_some())
}

/// Require an active membership card for the user.
async fn require_active_membership<C: ConnectionTrait>(
    db: &C,
    user_id: &str,
    now: DateTime<Utc>,
) -> Result<(), OrganizationError> {
    let card = membership::Entity::find()
        .filter(membership::Column::UserId.eq(user_id))
        .one(db)
        .await?
        .ok_or(OrganizationError::MembershipRequired)?;
    let expired = card.expires_at.is_some_and(|expires_at| expires_at <= now);
    if card.status != "active" || expired {
        return Err(OrganizationError::MembershipSuspended);
    }
    Ok(())
}

/// Return `time + delta`, or the latest representable time on overflow.
fn after(time: DateTime<Utc>, delta: TimeDelta) -> DateTime<Utc> {
    time.checked_add_signed(delta)
        .unwrap_or(DateTime::<Utc>::MAX_UTC)
}
