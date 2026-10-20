use std::collections::HashMap;

use chrono::{Duration, NaiveDate, SecondsFormat};
use sea_orm::{
    AccessMode, ColumnTrait, ConnectionTrait, DatabaseConnection, EntityTrait, IsolationLevel,
    QueryFilter, QueryOrder, QuerySelect, TransactionTrait,
};

use crate::entities::activity::{daily_summary, event, hydration, sleep, sync_state, workout};

use super::ActivityError;
use crate::domain::activity::{
    ActivityKind, ActivityPayload, ActivityRecord, Changes, Day, Days, DurationSource,
    HydrationPayload, Source, WorkoutPayload, WorkoutStatus,
    input::{InputError, parse_cursor, parse_days_range, validate_change_limit},
};

/// Returns one snapshot-bounded page of changes for a user-local stream.
pub async fn get_changes(
    db: &DatabaseConnection,
    user_id: &str,
    cursor: &str,
    limit: u64,
) -> Result<Changes, ActivityError> {
    let cursor = parse_cursor(cursor).map_err(|error| match error {
        InputError::InvalidCursor => ActivityError::InvalidCursor,
        other => ActivityError::Input(other),
    })?;
    let limit = validate_change_limit(limit)?;
    let transaction = db
        .begin_with_config(
            Some(IsolationLevel::RepeatableRead),
            Some(AccessMode::ReadOnly),
        )
        .await?;
    let db = &transaction;
    let upper = require_sync(db, user_id).await?.last_sequence;
    if cursor > upper {
        return Err(ActivityError::InvalidCursor);
    }

    let rows = event::Entity::find()
        .filter(event::Column::UserId.eq(user_id))
        .filter(event::Column::Sequence.gt(cursor))
        .filter(event::Column::Sequence.lte(upper))
        .order_by_asc(event::Column::Sequence)
        .limit((limit + 1) as u64)
        .all(db)
        .await?;
    let has_more = rows.len() > limit;
    let page = &rows[..rows.len().min(limit)];
    let mut records = Vec::with_capacity(page.len());
    for row in page {
        records.push(to_record(db, user_id, row).await?);
    }
    let next_cursor = if has_more {
        page.last()
            .map(|row| row.sequence.to_string())
            .ok_or(ActivityError::Invariant("changes page had no final row"))?
    } else {
        upper.to_string()
    };
    let result = Changes {
        records,
        next_cursor,
        has_more,
    };
    transaction.commit().await?;
    Ok(result)
}

/// Returns inclusive daily summaries for a user-local date range.
pub async fn get_days(
    db: &DatabaseConnection,
    user_id: &str,
    from: &str,
    to: &str,
) -> Result<Days, ActivityError> {
    let (from, to) = parse_days_range(from, to)?;
    let transaction = db
        .begin_with_config(
            Some(IsolationLevel::RepeatableRead),
            Some(AccessMode::ReadOnly),
        )
        .await?;
    let db = &transaction;
    require_sync(db, user_id).await?;
    let summaries = daily_summary::Entity::find()
        .filter(daily_summary::Column::UserId.eq(user_id))
        .filter(daily_summary::Column::Date.gte(from))
        .filter(daily_summary::Column::Date.lte(to))
        .all(db)
        .await?;
    let by_date: HashMap<NaiveDate, daily_summary::Model> = summaries
        .into_iter()
        .map(|summary| (summary.date, summary))
        .collect();
    let mut days = Vec::new();
    let mut date = from;
    while date <= to {
        let summary = by_date.get(&date);
        days.push(day_from_summary(date, summary));
        date = date
            .checked_add_signed(Duration::days(1))
            .ok_or(ActivityError::Invariant("date range overflowed"))?;
    }
    transaction.commit().await?;
    Ok(Days { days })
}

fn day_from_summary(date: NaiveDate, summary: Option<&daily_summary::Model>) -> Day {
    let water_ml = summary.map_or(0, |value| value.water_ml);
    let sleep_minutes = summary.and_then(|value| value.sleep_minutes);
    let workout_count = summary.map_or(0, |value| value.workout_count);
    let workout_seconds = summary.map_or(0, |value| value.workout_seconds);
    let task_count =
        i32::from(water_ml > 0) + i32::from(sleep_minutes.is_some()) + i32::from(workout_count > 0);
    Day {
        date: date.to_string(),
        water_ml,
        sleep_minutes,
        workout_count,
        workout_seconds,
        task_count,
        has_record: task_count > 0,
    }
}

async fn require_sync<C: ConnectionTrait>(
    db: &C,
    user_id: &str,
) -> Result<sync_state::Model, ActivityError> {
    sync_state::Entity::find_by_id(user_id.to_owned())
        .one(db)
        .await?
        .filter(|state| {
            state.enabled
                && state.consent_version.as_deref()
                    == Some(crate::domain::activity::SYNC_CONSENT_VERSION)
        })
        .ok_or(ActivityError::SyncDisabled)
}

async fn to_record<C>(
    db: &C,
    user_id: &str,
    row: &event::Model,
) -> Result<ActivityRecord, ActivityError>
where
    C: ConnectionTrait,
{
    let kind = kind_from_db(&row.kind)?;
    let source = source_from_db(&row.source)?;
    let payload = if row.deleted_at.is_some() {
        None
    } else {
        Some(load_payload(db, user_id, row.id, kind).await?)
    };
    Ok(ActivityRecord {
        id: row.id,
        kind,
        source,
        occurred_at: row.occurred_at.to_rfc3339_opts(SecondsFormat::Millis, true),
        time_zone: row.time_zone.clone(),
        local_date: row.local_date.to_string(),
        revision: row.revision,
        sequence: row.sequence.to_string(),
        updated_at: row.updated_at.to_rfc3339_opts(SecondsFormat::Millis, true),
        deleted_at: row
            .deleted_at
            .map(|value| value.to_rfc3339_opts(SecondsFormat::Millis, true)),
        payload,
    })
}

async fn load_payload<C>(
    db: &C,
    user_id: &str,
    event_id: uuid::Uuid,
    kind: ActivityKind,
) -> Result<ActivityPayload, ActivityError>
where
    C: ConnectionTrait,
{
    match kind {
        ActivityKind::Hydration => hydration::Entity::find_by_id((user_id.to_owned(), event_id))
            .one(db)
            .await?
            .map(|value| {
                ActivityPayload::Hydration(HydrationPayload {
                    amount_ml: value.amount_ml,
                })
            })
            .ok_or(ActivityError::Invariant(
                "hydration event payload is missing",
            )),
        ActivityKind::Sleep => sleep::Entity::find_by_id((user_id.to_owned(), event_id))
            .one(db)
            .await?
            .map(|value| {
                ActivityPayload::Sleep(crate::domain::activity::SleepPayload {
                    duration_minutes: value.duration_minutes,
                })
            })
            .ok_or(ActivityError::Invariant("sleep event payload is missing")),
        ActivityKind::Workout => workout::Entity::find_by_id((user_id.to_owned(), event_id))
            .one(db)
            .await?
            .map(|value| {
                let duration_source = duration_source_from_db(&value.duration_source)?;
                let status = workout_status_from_db(&value.status)?;
                Ok::<ActivityPayload, ActivityError>(ActivityPayload::Workout(WorkoutPayload {
                    workout_id: value.workout_id,
                    workout_version: value.workout_version,
                    duration_seconds: value.duration_seconds,
                    duration_source,
                    status,
                }))
            })
            .transpose()?
            .ok_or(ActivityError::Invariant("workout event payload is missing")),
    }
}

pub(super) fn kind_from_db(value: &str) -> Result<ActivityKind, ActivityError> {
    match value {
        "hydration" => Ok(ActivityKind::Hydration),
        "sleep" => Ok(ActivityKind::Sleep),
        "workout" => Ok(ActivityKind::Workout),
        _ => Err(ActivityError::Invariant("event kind is not supported")),
    }
}

pub(super) fn source_from_db(value: &str) -> Result<Source, ActivityError> {
    match value {
        "manual" => Ok(Source::Manual),
        "app" => Ok(Source::App),
        "import" => Ok(Source::Import),
        _ => Err(ActivityError::Invariant("event source is not supported")),
    }
}

fn duration_source_from_db(value: &str) -> Result<DurationSource, ActivityError> {
    match value {
        "measured" => Ok(DurationSource::Measured),
        "estimated" => Ok(DurationSource::Estimated),
        _ => Err(ActivityError::Invariant("duration source is not supported")),
    }
}

fn workout_status_from_db(value: &str) -> Result<WorkoutStatus, ActivityError> {
    match value {
        "completed" => Ok(WorkoutStatus::Completed),
        "abandoned" => Ok(WorkoutStatus::Abandoned),
        _ => Err(ActivityError::Invariant("workout status is not supported")),
    }
}

#[cfg(test)]
mod tests {
    use chrono::{NaiveDate, Utc};

    use super::*;

    #[test]
    fn daily_summary_counts_each_completed_category_once() {
        let date = NaiveDate::from_ymd_opt(2024, 1, 2).expect("test date is valid");
        let summary = daily_summary::Model {
            user_id: "user-1".to_owned(),
            date,
            water_ml: 600,
            sleep_minutes: Some(420),
            workout_count: 2,
            workout_seconds: 3_600,
            updated_at: Utc::now(),
        };
        let day = day_from_summary(date, Some(&summary));
        assert_eq!(day.task_count, 3);
        assert!(day.has_record);
        assert_eq!(day.workout_seconds, 3_600);
    }

    #[test]
    fn missing_daily_summary_is_an_empty_day() {
        let date = NaiveDate::from_ymd_opt(2024, 1, 2).expect("test date is valid");
        let day = day_from_summary(date, None);
        assert_eq!(day.task_count, 0);
        assert!(!day.has_record);
        assert_eq!(day.water_ml, 0);
        assert_eq!(day.sleep_minutes, None);
    }
}
