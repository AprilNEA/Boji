use chrono::{DateTime, Utc};
use sea_orm::DbErr;
use thiserror::Error;
use uuid::Uuid;

use crate::entities::{entitlement, membership, membership_entitlement};

/// Errors produced by membership-administration domain operations.
#[derive(Debug, Error)]
pub enum AdminError {
    /// A request field, filter, cursor, identifier, time, or reason is invalid.
    #[error("admin input field `{field}` is invalid")]
    InvalidInput {
        /// The domain field that failed validation, for example `reason`.
        field: &'static str,
    },
    /// No membership card matches the requested key.
    #[error("membership was not found")]
    MembershipNotFound,
    /// No entitlement catalog definition matches the requested identifier.
    #[error("entitlement was not found")]
    EntitlementNotFound,
    /// The membership card has never received the requested entitlement.
    #[error("entitlement grant was not found")]
    GrantNotFound,
    /// A grant request targeted an inactive catalog definition.
    #[error("entitlement is inactive")]
    EntitlementInactive,
    /// Storage failed without exposing storage details to transport callers.
    #[error("admin storage operation failed")]
    Storage(#[from] DbErr),
}

/// A requested membership status.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum MembershipStatus {
    /// The card can expose qualifying grants.
    Active,
    /// The card remains visible but exposes no effective grants.
    Suspended,
}

impl MembershipStatus {
    /// Return the persisted status value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Active => "active",
            Self::Suspended => "suspended",
        }
    }
}

/// Input for a stable membership-card list page.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ListMemberships {
    /// Empty for the first page. Later pages use the prior response cursor.
    pub cursor: String,
    /// Requested record count from one through 100.
    pub limit: u32,
    /// Optional exact persisted status filter.
    pub status: Option<String>,
}

/// Input for a stable entitlement-catalog list page.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ListEntitlements {
    /// Empty for the first page. Later pages use the prior response cursor.
    pub cursor: String,
    /// Requested record count from one through 100.
    pub limit: u32,
}

/// Exactly one supported membership-card lookup key.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum LookupKey {
    /// Stable membership-card UUID.
    MembershipId(String),
    /// Exact authenticated owner identifier.
    UserId(String),
    /// Exact opaque member-number string without normalization.
    MemberNumber(String),
}

/// Input for a status mutation.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct StatusMutation {
    /// Authorized administrator identifier.
    pub actor_user_id: String,
    /// Target membership-card UUID.
    pub membership_id: String,
    /// Required operator explanation.
    pub reason: String,
    /// Requested persisted card status.
    pub status: MembershipStatus,
}

/// Input for a grant creation, restoration, or expiry update.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct GrantMutation {
    /// Authorized administrator identifier.
    pub actor_user_id: String,
    /// Target membership-card UUID.
    pub membership_id: String,
    /// Target entitlement-catalog UUID.
    pub entitlement_id: String,
    /// Required operator explanation.
    pub reason: String,
    /// Optional future RFC 3339 expiry time.
    pub expires_at: Option<String>,
}

/// Input for an entitlement revocation.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RevokeMutation {
    /// Authorized administrator identifier.
    pub actor_user_id: String,
    /// Target membership-card UUID.
    pub membership_id: String,
    /// Target entitlement-catalog UUID.
    pub entitlement_id: String,
    /// Required operator explanation.
    pub reason: String,
}

/// One keyset page of membership-card records.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct MembershipPage {
    /// Membership cards in `joined_at DESC, id DESC` order.
    pub records: Vec<membership::Model>,
    /// Cursor for the following page, or empty when no following page exists.
    pub next_cursor: String,
    /// Whether a following page exists.
    pub has_more: bool,
}

/// One keyset page of entitlement-catalog records.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct CatalogPage {
    /// Catalog definitions in `code ASC, id ASC` order.
    pub records: Vec<entitlement::Model>,
    /// Cursor for the following page, or empty when no following page exists.
    pub next_cursor: String,
    /// Whether a following page exists.
    pub has_more: bool,
}

/// One stored grant with its catalog definition and current effectiveness.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct GrantRecord {
    /// The stored grant, including expiry and revocation history.
    pub grant: membership_entitlement::Model,
    /// The catalog definition referenced by the grant.
    pub entitlement: entitlement::Model,
    /// Whether MembershipService would expose this grant at the evaluation time.
    pub effective: bool,
}

/// A membership card and every stored grant for an operator lookup.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct MembershipDetail {
    /// Target membership card.
    pub membership: membership::Model,
    /// All grants, ordered by catalog code.
    pub grants: Vec<GrantRecord>,
}

/// Result of an idempotent status mutation.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct StatusResult {
    /// Membership state after the request.
    pub membership: membership::Model,
    /// Whether the request changed stored state.
    pub changed: bool,
    /// Audit event UUID when `changed` is true.
    pub audit_event_id: Option<String>,
}

/// Result of an idempotent grant or revocation mutation.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct GrantResult {
    /// Grant state after the request.
    pub grant: GrantRecord,
    /// Whether the request changed stored state.
    pub changed: bool,
    /// Audit event UUID when `changed` is true.
    pub audit_event_id: Option<String>,
}

pub(crate) fn page_limit(value: u32) -> Result<u64, AdminError> {
    if !(1..=100).contains(&value) {
        return Err(AdminError::InvalidInput { field: "limit" });
    }
    Ok(u64::from(value))
}

pub(crate) fn status_filter(value: Option<&str>) -> Result<Option<&str>, AdminError> {
    match value {
        None => Ok(None),
        Some("active") => Ok(Some("active")),
        Some("suspended") => Ok(Some("suspended")),
        Some(_) => Err(AdminError::InvalidInput { field: "status" }),
    }
}

pub(crate) fn parse_uuid(value: &str, field: &'static str) -> Result<Uuid, AdminError> {
    Uuid::parse_str(value).map_err(|_| AdminError::InvalidInput { field })
}

pub(crate) fn validate_text(value: &str, field: &'static str) -> Result<(), AdminError> {
    if value.is_empty() || value.chars().any(char::is_control) {
        return Err(AdminError::InvalidInput { field });
    }
    Ok(())
}

pub(crate) fn normalized_reason(value: &str) -> Result<String, AdminError> {
    let value = value.trim();
    if value.chars().any(char::is_control) {
        return Err(AdminError::InvalidInput { field: "reason" });
    }
    if value.is_empty() || value.chars().count() > 500 {
        return Err(AdminError::InvalidInput { field: "reason" });
    }
    Ok(value.to_owned())
}

/// The domain field name of a grant expiry.
pub(crate) const EXPIRES_AT: &str = "expires_at";

pub(crate) fn future_expiry(value: &Option<String>) -> Result<Option<DateTime<Utc>>, AdminError> {
    let Some(value) = value else {
        return Ok(None);
    };
    let value = DateTime::parse_from_rfc3339(value)
        .map_err(|_| AdminError::InvalidInput { field: EXPIRES_AT })?
        .with_timezone(&Utc);
    // PostgreSQL timestamps store microseconds; canonicalize before equality checks.
    let value = DateTime::from_timestamp_micros(value.timestamp_micros())
        .ok_or(AdminError::InvalidInput { field: EXPIRES_AT })?;
    if value <= Utc::now() {
        return Err(AdminError::InvalidInput { field: EXPIRES_AT });
    }
    Ok(Some(value))
}
