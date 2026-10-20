//! Transport-independent activity synchronization domain.
//!
//! This module owns consent, optimistic revisions, idempotent mutation receipts,
//! per-user change cursors, tombstones, and daily summaries.

/// Typed activity synchronization requests and responses.
pub mod input;
mod service;

pub use input::{
    ActivityKind, ActivityPayload, ActivityRecord, BatchInput, BatchResult, Changes, Day, Days,
    DurationSource, HydrationPayload, InputError, MutationConflictCode, MutationResult,
    MutationStatus, Operation, SYNC_CONSENT_VERSION, SleepPayload, Source, SyncState,
    WorkoutPayload, WorkoutStatus,
};
pub use service::{ActivityError, apply_batch, get_changes, get_days, get_sync, set_sync};
