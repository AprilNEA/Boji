//! SeaORM entities for Boji business tables.

/// Activity synchronization entities owned by the activity domain.
pub mod activity;
/// Transactional audit records for membership operations.
pub mod admin_audit_event;
/// Organization verifications of users.
pub mod affiliation;
/// Short-lived organization email verification codes.
pub mod affiliation_email_verification;
/// Events of affiliations.
pub mod affiliation_event;
/// Free-membership entitlement catalog entries.
pub mod entitlement;
/// Free-membership card records.
pub mod membership;
/// Auditable membership entitlement grants.
pub mod membership_entitlement;
/// Singleton membership-number allocation cursor.
pub mod membership_number_counter;
/// The organization list of the organization ranking.
pub mod organization;
/// The email domains of organizations.
pub mod organization_domain;
/// The frozen ranking counts of organizations.
pub mod organization_standing_freeze;
