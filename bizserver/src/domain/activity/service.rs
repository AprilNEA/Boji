//! Activity synchronization persistence services.

mod batch;
mod read;
mod state;
mod summary;

use sea_orm::{DbErr, TransactionError};
use thiserror::Error;

pub use batch::apply_batch;
pub use read::{get_changes, get_days};
pub use state::{get_sync, set_sync};

use super::input::InputError;

/// Typed errors emitted by the activity synchronization domain.
#[derive(Debug, Error)]
pub enum ActivityError {
    /// The user has not enabled the required synchronization consent.
    #[error("activity synchronization is disabled")]
    SyncDisabled,
    /// The request did not explicitly accept `activity-sync-v1`.
    #[error("activity synchronization requires activity-sync-v1 consent")]
    ConsentRequired,
    /// The requested changes cursor is not valid for this user.
    #[error("the changes cursor is invalid")]
    InvalidCursor,
    /// The request violated a typed activity-input constraint.
    #[error("activity input is invalid: {0}")]
    Input(#[from] InputError),
    /// A stored activity row violated an internal invariant.
    #[error("activity data invariant failed: {0}")]
    Invariant(&'static str),
    /// JSON serialization of an idempotency receipt failed.
    #[error("activity receipt serialization failed: {0}")]
    Serialization(#[from] serde_json::Error),
    /// SeaORM or PostgreSQL returned an error.
    #[error("activity database operation failed: {0}")]
    Database(#[from] DbErr),
}

pub(super) fn map_transaction<T>(
    result: Result<T, TransactionError<ActivityError>>,
) -> Result<T, ActivityError> {
    match result {
        Ok(value) => Ok(value),
        Err(TransactionError::Connection(error)) => Err(ActivityError::Database(error)),
        Err(TransactionError::Transaction(error)) => Err(error),
    }
}
