//! Conversions between protobuf messages and domain values.
//!
//! Input: generated `boji.v1` messages and domain records.
//! Output: domain operations, resource messages and well-known types.
//! Pos: transport only. Validation that needs the database stays in the domain.

use super::{error::invalid_input, names};
use crate::{
    domain::activity as d,
    proto::{boji::v1 as p, google::r#type::Date},
};
use buffa::{MessageField, ProtoBox};
use buffa_types::google::protobuf::{Duration, Timestamp};
use chrono::{DateTime, Datelike, NaiveDate, Utc};
use connectrpc::ConnectError;
use p::__buffa::oneof::{activity::Payload, activity_write::Operation};
use uuid::Uuid;

/// Convert a stored time to a `Timestamp` field.
pub fn timestamp<P: ProtoBox<Timestamp>>(value: DateTime<Utc>) -> MessageField<Timestamp, P> {
    Timestamp::from(value).into()
}

/// Convert an optional stored time to a `Timestamp` field.
pub fn optional_timestamp<P: ProtoBox<Timestamp>>(
    value: Option<DateTime<Utc>>,
) -> MessageField<Timestamp, P> {
    value.map(Timestamp::from).into()
}

/// Convert a stored RFC 3339 string to a `Timestamp` field.
fn stored_timestamp<P: ProtoBox<Timestamp>>(
    value: &str,
) -> Result<MessageField<Timestamp, P>, ConnectError> {
    DateTime::parse_from_rfc3339(value)
        .map(|time| timestamp(time.with_timezone(&Utc)))
        .map_err(|_| super::error::internal("activity_stored_time_invalid"))
}

/// Convert a request `Timestamp` to a UTC time.
pub fn request_time<P: ProtoBox<Timestamp>>(
    field: &str,
    value: &MessageField<Timestamp, P>,
) -> Result<DateTime<Utc>, ConnectError> {
    let value = value
        .as_option()
        .ok_or_else(|| invalid_input(field, "The field is required."))?;
    DateTime::<Utc>::try_from(value.clone())
        .map_err(|_| invalid_input(field, "The time is outside the supported range."))
}

/// Convert a calendar date to a `google.type.Date`.
pub fn date(value: NaiveDate) -> Date {
    Date {
        year: value.year(),
        // Calendar months and days are 1 through 12 and 1 through 31.
        month: value.month() as i32,
        day: value.day() as i32,
        ..Default::default()
    }
}

/// Convert a full `google.type.Date` to a calendar date.
pub fn request_date<P: ProtoBox<Date>>(
    field: &str,
    value: &MessageField<Date, P>,
) -> Result<NaiveDate, ConnectError> {
    let value = value
        .as_option()
        .ok_or_else(|| invalid_input(field, "The field is required."))?;
    u32::try_from(value.month)
        .ok()
        .zip(u32::try_from(value.day).ok())
        .and_then(|(month, day)| NaiveDate::from_ymd_opt(value.year, month, day))
        .ok_or_else(|| invalid_input(field, "The value must be a full calendar date."))
}

/// Convert a stored `YYYY-MM-DD` string to a `google.type.Date` field.
fn stored_date<P: ProtoBox<Date>>(value: &str) -> Result<MessageField<Date, P>, ConnectError> {
    NaiveDate::parse_from_str(value, "%Y-%m-%d")
        .map(|value| date(value).into())
        .map_err(|_| super::error::internal("activity_stored_date_invalid"))
}

/// Build a duration of whole seconds.
pub fn seconds(value: i64) -> Duration {
    Duration {
        seconds: value,
        ..Default::default()
    }
}

/// Format a revision as a strong entity tag (AIP-154), for example `"3"`.
pub fn etag(revision: i32) -> String {
    format!("\"{revision}\"")
}

/// Parse a strong entity tag back to its revision.
fn parse_etag(field: &str, value: &str) -> Result<i32, ConnectError> {
    value
        .strip_prefix('"')
        .and_then(|value| value.strip_suffix('"'))
        .and_then(|value| value.parse::<i32>().ok())
        .filter(|revision| *revision >= 1)
        .ok_or_else(|| invalid_input(field, "The value must be an etag returned by the server."))
}

/// One write of a batch after conversion.
pub struct ConvertedWrite {
    /// The domain operation.
    pub operation: d::Operation,
    /// True when the write sent an etag.
    pub has_etag: bool,
}

/// Convert write `index` of a batch for the user `caller`.
pub fn write(
    index: usize,
    caller: &str,
    value: p::ActivityWrite,
) -> Result<ConvertedWrite, ConnectError> {
    let prefix = format!("writes[{index}]");
    let mutation_id = Uuid::parse_str(&value.request_id)
        .map_err(|_| invalid_input(&format!("{prefix}.request_id"), "The value must be a UUID."))?;
    let has_etag = !value.etag.is_empty();
    let expected_revision = if has_etag {
        parse_etag(&format!("{prefix}.etag"), &value.etag)?
    } else {
        0
    };
    let operation = match value.operation {
        None => {
            return Err(invalid_input(
                &prefix,
                "Set exactly one of `upsert` and `deletion`.",
            ));
        }
        Some(Operation::Deletion(name)) => {
            if !has_etag {
                return Err(invalid_input(
                    &format!("{prefix}.etag"),
                    "A deletion requires the etag of the activity.",
                ));
            }
            d::Operation::Delete {
                mutation_id,
                id: activity_id(&format!("{prefix}.deletion"), caller, &name)?,
                expected_revision,
            }
        }
        Some(Operation::Upsert(activity)) => upsert(
            &format!("{prefix}.upsert"),
            caller,
            mutation_id,
            expected_revision,
            *activity,
        )?,
    };
    operation
        .validate()
        .map_err(|error| input_error(&prefix, &error))?;
    Ok(ConvertedWrite {
        operation,
        has_etag,
    })
}

fn upsert(
    prefix: &str,
    caller: &str,
    mutation_id: Uuid,
    expected_revision: i32,
    value: p::Activity,
) -> Result<d::Operation, ConnectError> {
    let id = activity_id(&format!("{prefix}.name"), caller, &value.name)?;
    let source = match value.source.as_known() {
        Some(p::activity::Source::MANUAL) => d::Source::Manual,
        Some(p::activity::Source::APP) => d::Source::App,
        Some(p::activity::Source::IMPORT) => d::Source::Import,
        _ => {
            return Err(invalid_input(
                &format!("{prefix}.source"),
                "The value must be MANUAL, APP or IMPORT.",
            ));
        }
    };
    let occurred_at = request_time(&format!("{prefix}.occur_time"), &value.occur_time)?;
    let payload = match value.payload {
        None => {
            return Err(invalid_input(
                prefix,
                "Set exactly one of `hydration`, `sleep` and `workout`.",
            ));
        }
        Some(Payload::Hydration(value)) => d::ActivityPayload::Hydration(d::HydrationPayload {
            amount_ml: value.amount_ml,
        }),
        Some(Payload::Sleep(value)) => {
            let field = format!("{prefix}.sleep.duration");
            let seconds = whole_seconds(&field, &value.duration)?;
            if seconds % 60 != 0 {
                return Err(invalid_input(&field, "The value must be whole minutes."));
            }
            d::ActivityPayload::Sleep(d::SleepPayload {
                duration_minutes: bounded(&field, seconds / 60)?,
            })
        }
        Some(Payload::Workout(value)) => {
            let field = format!("{prefix}.workout.duration");
            let duration_seconds = bounded(&field, whole_seconds(&field, &value.duration)?)?;
            let duration_source = match value.duration_source.as_known() {
                Some(p::activity::workout::DurationSource::MEASURED) => d::DurationSource::Measured,
                Some(p::activity::workout::DurationSource::ESTIMATED) => {
                    d::DurationSource::Estimated
                }
                _ => {
                    return Err(invalid_input(
                        &format!("{prefix}.workout.duration_source"),
                        "The value must be MEASURED or ESTIMATED.",
                    ));
                }
            };
            let status = match value.outcome.as_known() {
                Some(p::activity::workout::Outcome::COMPLETED) => d::WorkoutStatus::Completed,
                Some(p::activity::workout::Outcome::ABANDONED) => d::WorkoutStatus::Abandoned,
                _ => {
                    return Err(invalid_input(
                        &format!("{prefix}.workout.outcome"),
                        "The value must be COMPLETED or ABANDONED.",
                    ));
                }
            };
            d::ActivityPayload::Workout(d::WorkoutPayload {
                workout_id: value.workout_id,
                workout_version: value.workout_version,
                duration_seconds,
                duration_source,
                status,
            })
        }
    };
    Ok(d::Operation::Upsert {
        mutation_id,
        id,
        expected_revision,
        occurred_at,
        time_zone: value.time_zone,
        source,
        payload,
    })
}

/// Parse an activity name whose `{user}` segment names the caller.
pub fn activity_id(field: &str, caller: &str, name: &str) -> Result<Uuid, ConnectError> {
    let [user, id] = names::parse(
        field,
        name,
        ["users", "activities"],
        None,
        "users/{user}/activities/{activity}",
    )?;
    if user != names::ME && user != caller {
        return Err(invalid_input(
            field,
            "The activity must be a child of `parent`.",
        ));
    }
    names::uuid(field, id)
}

fn whole_seconds<P: ProtoBox<Duration>>(
    field: &str,
    value: &MessageField<Duration, P>,
) -> Result<i64, ConnectError> {
    let value = value
        .as_option()
        .ok_or_else(|| invalid_input(field, "The field is required."))?;
    if value.nanos != 0 {
        return Err(invalid_input(field, "The value must be whole seconds."));
    }
    Ok(value.seconds)
}

fn bounded(field: &str, value: i64) -> Result<i32, ConnectError> {
    i32::try_from(value)
        .map_err(|_| invalid_input(field, "The value is outside the supported range."))
}

/// Map a domain validation error of write `prefix` to the field it names.
fn input_error(prefix: &str, error: &d::InputError) -> ConnectError {
    let field = match error {
        d::InputError::InvalidRevision => format!("{prefix}.etag"),
        d::InputError::InvalidTimestamp => format!("{prefix}.upsert.occur_time"),
        d::InputError::InvalidTimeZone => format!("{prefix}.upsert.time_zone"),
        d::InputError::InvalidHydrationAmount => format!("{prefix}.upsert.hydration.amount_ml"),
        d::InputError::InvalidSleepDuration => format!("{prefix}.upsert.sleep.duration"),
        d::InputError::InvalidWorkoutDuration => format!("{prefix}.upsert.workout.duration"),
        d::InputError::InvalidWorkoutReference => format!("{prefix}.upsert.workout"),
        _ => prefix.to_owned(),
    };
    invalid_input(&field, &sentence(error))
}

/// Turn a domain error message into a sentence.
pub fn sentence(error: &impl std::fmt::Display) -> String {
    let message = error.to_string();
    let mut characters = message.chars();
    match characters.next() {
        Some(first) => format!("{}{}.", first.to_uppercase(), characters.as_str()),
        None => message,
    }
}

/// Convert a domain record to an `Activity` resource of `user`.
pub fn activity(user: &str, value: d::ActivityRecord) -> Result<p::Activity, ConnectError> {
    let payload = value.payload.map(|payload| match payload {
        d::ActivityPayload::Hydration(value) => {
            Payload::Hydration(Box::new(p::activity::Hydration {
                amount_ml: value.amount_ml,
                ..Default::default()
            }))
        }
        d::ActivityPayload::Sleep(value) => Payload::Sleep(Box::new(p::activity::Sleep {
            duration: seconds(i64::from(value.duration_minutes) * 60).into(),
            ..Default::default()
        })),
        d::ActivityPayload::Workout(value) => Payload::Workout(Box::new(p::activity::Workout {
            workout_id: value.workout_id,
            workout_version: value.workout_version,
            duration: seconds(i64::from(value.duration_seconds)).into(),
            duration_source: match value.duration_source {
                d::DurationSource::Measured => p::activity::workout::DurationSource::MEASURED,
                d::DurationSource::Estimated => p::activity::workout::DurationSource::ESTIMATED,
            }
            .into(),
            outcome: match value.status {
                d::WorkoutStatus::Completed => p::activity::workout::Outcome::COMPLETED,
                d::WorkoutStatus::Abandoned => p::activity::workout::Outcome::ABANDONED,
            }
            .into(),
            ..Default::default()
        })),
    });
    Ok(p::Activity {
        name: names::activity(user, &value.id.to_string()),
        payload,
        source: match value.source {
            d::Source::Manual => p::activity::Source::MANUAL,
            d::Source::App => p::activity::Source::APP,
            d::Source::Import => p::activity::Source::IMPORT,
        }
        .into(),
        occur_time: stored_timestamp(&value.occurred_at)?,
        time_zone: value.time_zone,
        local_date: stored_date(&value.local_date)?,
        update_time: stored_timestamp(&value.updated_at)?,
        delete_time: match value.deleted_at {
            Some(time) => stored_timestamp(&time)?,
            None => MessageField::default(),
        },
        etag: etag(value.revision),
        ..Default::default()
    })
}

/// Convert the domain synchronization settings of `user`.
pub fn sync_state(user: &str, value: d::SyncState) -> Result<p::SyncState, ConnectError> {
    Ok(p::SyncState {
        name: names::sync_state(user),
        enabled: value.enabled,
        consent_version: value.consent_version.unwrap_or_default(),
        required_consent_version: value.required_consent_version,
        consent_time: match value.consented_at {
            Some(time) => stored_timestamp(&time)?,
            None => MessageField::default(),
        },
        ..Default::default()
    })
}

/// Convert one domain day summary.
pub fn daily_summary(value: d::Day) -> Result<p::DailySummary, ConnectError> {
    Ok(p::DailySummary {
        date: stored_date(&value.date)?,
        water_ml: value.water_ml,
        sleep_duration: value
            .sleep_minutes
            .map(|minutes| seconds(i64::from(minutes) * 60))
            .into(),
        workout_count: value.workout_count,
        workout_duration: seconds(i64::from(value.workout_seconds)).into(),
        task_count: value.task_count,
        has_record: value.has_record,
        ..Default::default()
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn hydration_write() -> p::ActivityWrite {
        p::ActivityWrite {
            request_id: Uuid::new_v4().to_string(),
            operation: Some(Operation::Upsert(Box::new(p::Activity {
                name: format!("users/me/activities/{}", Uuid::new_v4()),
                source: p::activity::Source::MANUAL.into(),
                occur_time: Timestamp {
                    seconds: 1_767_225_600,
                    ..Default::default()
                }
                .into(),
                time_zone: "UTC".to_owned(),
                payload: Some(Payload::Hydration(Box::new(p::activity::Hydration {
                    amount_ml: 250,
                    ..Default::default()
                }))),
                ..Default::default()
            }))),
            ..Default::default()
        }
    }

    #[test]
    fn converts_a_valid_create() {
        let converted = write(0, "u1", hydration_write()).expect("valid write");
        assert!(!converted.has_etag);
        assert!(matches!(
            converted.operation,
            d::Operation::Upsert {
                expected_revision: 0,
                ..
            }
        ));
    }

    #[test]
    fn rejects_missing_operation_unknown_source_and_foreign_user() {
        let mut value = hydration_write();
        value.operation = None;
        assert!(write(0, "u1", value).is_err());

        let mut value = hydration_write();
        if let Some(Operation::Upsert(activity)) = value.operation.as_mut() {
            activity.source = p::activity::Source::SOURCE_UNSPECIFIED.into();
        }
        assert!(write(0, "u1", value).is_err());

        let mut value = hydration_write();
        if let Some(Operation::Upsert(activity)) = value.operation.as_mut() {
            activity.name = format!("users/u2/activities/{}", Uuid::new_v4());
        }
        assert!(write(0, "u1", value).is_err());
    }

    #[test]
    fn deletion_requires_a_strong_etag() {
        let name = format!("users/me/activities/{}", Uuid::new_v4());
        let mut value = p::ActivityWrite {
            request_id: Uuid::new_v4().to_string(),
            operation: Some(Operation::Deletion(name)),
            ..Default::default()
        };
        assert!(write(0, "u1", value.clone()).is_err());
        value.etag = "W/\"1\"".to_owned();
        assert!(write(0, "u1", value.clone()).is_err());
        value.etag = etag(1);
        assert!(write(0, "u1", value).is_ok());
    }

    #[test]
    fn sleep_requires_whole_minutes() {
        let mut value = hydration_write();
        if let Some(Operation::Upsert(activity)) = value.operation.as_mut() {
            activity.payload = Some(Payload::Sleep(Box::new(p::activity::Sleep {
                duration: seconds(90).into(),
                ..Default::default()
            })));
        }
        assert!(write(0, "u1", value).is_err());
    }

    #[test]
    fn dates_round_trip() {
        let day = NaiveDate::from_ymd_opt(2026, 2, 28).expect("date");
        let value: MessageField<Date> = MessageField::from(date(day));
        assert_eq!(request_date("start_date", &value).ok(), Some(day));
        let invalid: MessageField<Date> = MessageField::from(Date {
            year: 2026,
            month: 2,
            day: 30,
            ..Default::default()
        });
        assert!(request_date("start_date", &invalid).is_err());
    }
}
