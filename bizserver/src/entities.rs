//! SeaORM entities for Boji business tables.

/// Activity synchronization entities owned by the activity domain.
pub mod activity;
/// Free-membership entitlement catalog entries.
pub mod entitlement;
/// Free-membership card records.
pub mod membership;
/// Auditable membership entitlement grants.
pub mod membership_entitlement;
/// Singleton membership-number allocation cursor.
pub mod membership_number_counter;
