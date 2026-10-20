use std::collections::BTreeSet;

use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, ConnectionTrait, DatabaseConnection, EntityTrait, QueryFilter,
    Set, TransactionTrait,
};
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::entities::activity::{event, hydration, mutation, sleep, sync_state, workout};

use super::{ActivityError, map_transaction, state::lock_state, summary::rebuild_day};
use crate::domain::activity::{
    ActivityPayload, BatchResult, MutationConflictCode, MutationResult, MutationStatus, Operation,
    SYNC_CONSENT_VERSION, input::validate_operations,
};

/// Applies an ordered, atomic activity-mutation batch for one user.
///
/// The function validates the input before opening its transaction. It then
/// holds that user's synchronization-state row lock until it commits or rolls
/// back, which serializes sequence allocation and mutation receipts per user.
pub async fn apply_batch(
    db: &DatabaseConnection,
    user_id: &str,
    operations: Vec<Operation>,
) -> Result<BatchResult, ActivityError> {
    validate_operations(&operations)?;
    let user_id = user_id.to_owned();
    let result = db
        .transaction(move |transaction| {
            Box::pin(async move {
                let state = lock_state(transaction, &user_id).await?;
                if !state.enabled || state.consent_version.as_deref() != Some(SYNC_CONSENT_VERSION)
                {
                    return Err(ActivityError::SyncDisabled);
                }
                let mut sequence = state.last_sequence;
                let mut results = Vec::with_capacity(operations.len());
                let mut dirty_days = BTreeSet::new();
                for operation in &operations {
                    let result = apply_operation(
                        transaction,
                        &user_id,
                        operation,
                        &mut sequence,
                        &mut dirty_days,
                    )
                    .await?;
                    results.push(result);
                }
                for day in dirty_days {
                    rebuild_day(transaction, &user_id, day).await?;
                }
                let mut active: sync_state::ActiveModel = state.into();
                active.last_sequence = Set(sequence);
                active.update(transaction).await?;
                Ok::<_, ActivityError>(BatchResult {
                    results,
                    server_cursor: sequence.to_string(),
                })
            })
        })
        .await;
    map_transaction(result)
}

async fn apply_operation<C>(
    db: &C,
    user_id: &str,
    operation: &Operation,
    sequence: &mut i64,
    dirty_days: &mut BTreeSet<chrono::NaiveDate>,
) -> Result<MutationResult, ActivityError>
where
    C: ConnectionTrait,
{
    let request_hash = operation_hash(operation)?;
    if let Some(receipt) =
        mutation::Entity::find_by_id((user_id.to_owned(), operation.mutation_id()))
            .one(db)
            .await?
    {
        return if receipt.request_hash == request_hash {
            Ok(serde_json::from_value(receipt.result)?)
        } else {
            Ok(conflict(
                operation,
                MutationConflictCode::MutationReused,
                None,
            ))
        };
    }

    let current = event::Entity::find_by_id((user_id.to_owned(), operation.id()))
        .one(db)
        .await?;
    let result = match conflict_for(operation, current.as_ref())? {
        Some(conflict) => conflict,
        None => apply_live_operation(db, user_id, operation, current, sequence, dirty_days).await?,
    };
    mutation::ActiveModel {
        user_id: Set(user_id.to_owned()),
        mutation_id: Set(operation.mutation_id()),
        request_hash: Set(request_hash),
        result: Set(serde_json::to_value(&result)?),
        created_at: Set(Utc::now()),
    }
    .insert(db)
    .await?;
    Ok(result)
}

fn conflict_for(
    operation: &Operation,
    current: Option<&event::Model>,
) -> Result<Option<MutationResult>, ActivityError> {
    let conflict = match current {
        Some(current) if current.deleted_at.is_some() => Some(conflict(
            operation,
            MutationConflictCode::RecordDeleted,
            Some(current.revision),
        )),
        None if matches!(operation, Operation::Delete { .. })
            || operation.expected_revision() != 0 =>
        {
            Some(conflict(
                operation,
                MutationConflictCode::RecordNotFound,
                None,
            ))
        }
        Some(current) if current.revision != operation.expected_revision() => Some(conflict(
            operation,
            MutationConflictCode::RevisionConflict,
            Some(current.revision),
        )),
        Some(current) if matches!(operation, Operation::Upsert { payload, .. } if current.kind != payload.kind().as_str()) => {
            Some(conflict(
                operation,
                MutationConflictCode::KindConflict,
                Some(current.revision),
            ))
        }
        _ => None,
    };
    Ok(conflict)
}

async fn apply_live_operation<C>(
    db: &C,
    user_id: &str,
    operation: &Operation,
    current: Option<event::Model>,
    sequence: &mut i64,
    dirty_days: &mut BTreeSet<chrono::NaiveDate>,
) -> Result<MutationResult, ActivityError>
where
    C: ConnectionTrait,
{
    let day = match operation {
        Operation::Upsert { .. } => Some(operation.local_date()?),
        Operation::Delete { .. } => current.as_ref().map(|row| row.local_date),
    };
    let previous_day = current.as_ref().map(|row| row.local_date);
    if let (Operation::Upsert { payload, .. }, Some(day)) = (operation, day)
        && matches!(payload, ActivityPayload::Sleep(_))
        && sleep_exists_on_other_record(db, user_id, operation.id(), day).await?
    {
        return Ok(conflict(
            operation,
            MutationConflictCode::DayConflict,
            current.as_ref().map(|row| row.revision),
        ));
    }

    *sequence = sequence
        .checked_add(1)
        .ok_or(ActivityError::Invariant("activity sequence overflowed"))?;
    let revision = current
        .as_ref()
        .map_or(1, |row| row.revision.saturating_add(1));
    if revision <= 0 {
        return Err(ActivityError::Invariant("activity revision overflowed"));
    }
    let now = Utc::now();
    match operation {
        Operation::Delete { .. } => {
            let row = current.ok_or(ActivityError::Invariant("delete record disappeared"))?;
            let mut active: event::ActiveModel = row.into();
            active.deleted_at = Set(Some(now));
            active.updated_at = Set(now);
            active.sequence = Set(*sequence);
            active.revision = Set(revision);
            active.update(db).await?;
            delete_payloads(db, user_id, operation.id()).await?;
        }
        Operation::Upsert {
            occurred_at,
            time_zone,
            source,
            payload,
            ..
        } => {
            let local_date = day.ok_or(ActivityError::Invariant("upsert has no local date"))?;
            if let Some(row) = current {
                let mut active: event::ActiveModel = row.into();
                active.kind = Set(payload.kind().as_str().to_owned());
                active.source = Set(source.as_str().to_owned());
                active.occurred_at = Set(*occurred_at);
                active.time_zone = Set(time_zone.clone());
                active.local_date = Set(local_date);
                active.revision = Set(revision);
                active.sequence = Set(*sequence);
                active.updated_at = Set(now);
                active.deleted_at = Set(None);
                active.update(db).await?;
            } else {
                event::ActiveModel {
                    user_id: Set(user_id.to_owned()),
                    id: Set(operation.id()),
                    kind: Set(payload.kind().as_str().to_owned()),
                    source: Set(source.as_str().to_owned()),
                    occurred_at: Set(*occurred_at),
                    time_zone: Set(time_zone.clone()),
                    local_date: Set(local_date),
                    revision: Set(revision),
                    sequence: Set(*sequence),
                    updated_at: Set(now),
                    deleted_at: Set(None),
                }
                .insert(db)
                .await?;
            }
            delete_payloads(db, user_id, operation.id()).await?;
            insert_payload(db, user_id, operation.id(), payload).await?;
        }
    }
    if let Some(previous_day) = previous_day {
        dirty_days.insert(previous_day);
    }
    if let Some(day) = day {
        dirty_days.insert(day);
    }
    Ok(MutationResult {
        mutation_id: operation.mutation_id(),
        id: operation.id(),
        status: MutationStatus::Applied,
        revision: Some(revision),
        sequence: Some(sequence.to_string()),
        code: None,
        current_revision: None,
    })
}

async fn sleep_exists_on_other_record<C>(
    db: &C,
    user_id: &str,
    id: Uuid,
    day: chrono::NaiveDate,
) -> Result<bool, ActivityError>
where
    C: ConnectionTrait,
{
    Ok(event::Entity::find()
        .filter(event::Column::UserId.eq(user_id))
        .filter(event::Column::Kind.eq("sleep"))
        .filter(event::Column::LocalDate.eq(day))
        .filter(event::Column::Id.ne(id))
        .filter(event::Column::DeletedAt.is_null())
        .one(db)
        .await?
        .is_some())
}

async fn delete_payloads<C>(db: &C, user_id: &str, event_id: Uuid) -> Result<(), ActivityError>
where
    C: ConnectionTrait,
{
    hydration::Entity::delete_many()
        .filter(hydration::Column::UserId.eq(user_id))
        .filter(hydration::Column::EventId.eq(event_id))
        .exec(db)
        .await?;
    sleep::Entity::delete_many()
        .filter(sleep::Column::UserId.eq(user_id))
        .filter(sleep::Column::EventId.eq(event_id))
        .exec(db)
        .await?;
    workout::Entity::delete_many()
        .filter(workout::Column::UserId.eq(user_id))
        .filter(workout::Column::EventId.eq(event_id))
        .exec(db)
        .await?;
    Ok(())
}

async fn insert_payload<C>(
    db: &C,
    user_id: &str,
    event_id: Uuid,
    payload: &ActivityPayload,
) -> Result<(), ActivityError>
where
    C: ConnectionTrait,
{
    match payload {
        ActivityPayload::Hydration(payload) => {
            hydration::ActiveModel {
                user_id: Set(user_id.to_owned()),
                event_id: Set(event_id),
                amount_ml: Set(payload.amount_ml),
            }
            .insert(db)
            .await?;
        }
        ActivityPayload::Sleep(payload) => {
            sleep::ActiveModel {
                user_id: Set(user_id.to_owned()),
                event_id: Set(event_id),
                duration_minutes: Set(payload.duration_minutes),
            }
            .insert(db)
            .await?;
        }
        ActivityPayload::Workout(payload) => {
            workout::ActiveModel {
                user_id: Set(user_id.to_owned()),
                event_id: Set(event_id),
                workout_id: Set(payload.workout_id.clone()),
                workout_version: Set(payload.workout_version.clone()),
                duration_seconds: Set(payload.duration_seconds),
                duration_source: Set(payload.duration_source.as_str().to_owned()),
                status: Set(payload.status.as_str().to_owned()),
            }
            .insert(db)
            .await?;
        }
    }
    Ok(())
}

fn conflict(
    operation: &Operation,
    code: MutationConflictCode,
    current_revision: Option<i32>,
) -> MutationResult {
    MutationResult {
        mutation_id: operation.mutation_id(),
        id: operation.id(),
        status: MutationStatus::Conflict,
        revision: None,
        sequence: None,
        code: Some(code),
        current_revision,
    }
}

fn operation_hash(operation: &Operation) -> Result<String, ActivityError> {
    let canonical = serde_json::to_vec(operation)?;
    Ok(hex::encode(Sha256::digest(canonical)))
}
