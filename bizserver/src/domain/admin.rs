//! Transport-independent membership administration operations.
//!
//! This module owns validated administrative reads, mutations, and audit writes.
//! Transport code supplies an authorized actor and maps `AdminError` to Connect errors.

mod mutation;
mod read;
mod types;

pub use mutation::{change_status, grant_entitlement, revoke_entitlement};
pub use read::{get_entitlement, list_entitlements, list_memberships, lookup_membership};
pub use types::{
    AdminError, CatalogPage, GrantMutation, GrantRecord, GrantResult, ListEntitlements,
    ListMemberships, LookupKey, MembershipDetail, MembershipPage, MembershipStatus, RevokeMutation,
    StatusMutation, StatusResult,
};
pub(crate) use types::{future_expiry, normalized_reason};
