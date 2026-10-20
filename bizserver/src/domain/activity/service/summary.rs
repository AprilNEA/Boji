use chrono::{NaiveDate, Utc};
use sea_orm::{ActiveModelTrait, ColumnTrait, ConnectionTrait, EntityTrait, QueryFilter, Set};
use uuid::Uuid;

use crate::entities::activity::{daily_summary, event, hydration, sleep, workout};

use super::ActivityError;

pub(super) async fn rebuild_day<C>(
    db: &C,
    user_id: &str,
    day: NaiveDate,
) -> Result<(), ActivityError>
where
    C: ConnectionTrait,
{
    let events = event::Entity::find()
        .filter(event::Column::UserId.eq(user_id))
        .filter(event::Column::LocalDate.eq(day))
        .filter(event::Column::DeletedAt.is_null())
        .all(db)
        .await?;

    let mut water_ml = 0_i32;
    let mut sleep_minutes: Option<i32> = None;
    let mut workout_count = 0_i32;
    let mut workout_seconds = 0_i32;
    for item in events {
        match item.kind.as_str() {
            "hydration" => {
                let payload = hydration_payload(db, user_id, item.id).await?;
                water_ml = water_ml
                    .checked_add(payload.amount_ml)
                    .ok_or(ActivityError::Invariant("hydration total overflowed"))?;
            }
            "sleep" => {
                let payload = sleep_payload(db, user_id, item.id).await?;
                sleep_minutes = Some(sleep_minutes.map_or(payload.duration_minutes, |current| {
                    current.max(payload.duration_minutes)
                }));
            }
            "workout" => {
                let payload = workout_payload(db, user_id, item.id).await?;
                if payload.status == "completed" {
                    workout_count = workout_count
                        .checked_add(1)
                        .ok_or(ActivityError::Invariant("workout count overflowed"))?;
                    workout_seconds = workout_seconds
                        .checked_add(payload.duration_seconds)
                        .ok_or(ActivityError::Invariant("workout total overflowed"))?;
                }
            }
            _ => return Err(ActivityError::Invariant("event kind is not supported")),
        }
    }

    let now = Utc::now();
    if let Some(row) = daily_summary::Entity::find_by_id((user_id.to_owned(), day))
        .one(db)
        .await?
    {
        let mut active: daily_summary::ActiveModel = row.into();
        active.water_ml = Set(water_ml);
        active.sleep_minutes = Set(sleep_minutes);
        active.workout_count = Set(workout_count);
        active.workout_seconds = Set(workout_seconds);
        active.updated_at = Set(now);
        active.update(db).await?;
    } else {
        daily_summary::ActiveModel {
            user_id: Set(user_id.to_owned()),
            date: Set(day),
            water_ml: Set(water_ml),
            sleep_minutes: Set(sleep_minutes),
            workout_count: Set(workout_count),
            workout_seconds: Set(workout_seconds),
            updated_at: Set(now),
        }
        .insert(db)
        .await?;
    }
    Ok(())
}

async fn hydration_payload<C>(
    db: &C,
    user_id: &str,
    event_id: Uuid,
) -> Result<hydration::Model, ActivityError>
where
    C: ConnectionTrait,
{
    hydration::Entity::find_by_id((user_id.to_owned(), event_id))
        .one(db)
        .await?
        .ok_or(ActivityError::Invariant(
            "hydration event payload is missing",
        ))
}

async fn sleep_payload<C>(
    db: &C,
    user_id: &str,
    event_id: Uuid,
) -> Result<sleep::Model, ActivityError>
where
    C: ConnectionTrait,
{
    sleep::Entity::find_by_id((user_id.to_owned(), event_id))
        .one(db)
        .await?
        .ok_or(ActivityError::Invariant("sleep event payload is missing"))
}

async fn workout_payload<C>(
    db: &C,
    user_id: &str,
    event_id: Uuid,
) -> Result<workout::Model, ActivityError>
where
    C: ConnectionTrait,
{
    workout::Entity::find_by_id((user_id.to_owned(), event_id))
        .one(db)
        .await?
        .ok_or(ActivityError::Invariant("workout event payload is missing"))
}
