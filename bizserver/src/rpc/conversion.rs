use crate::{domain::activity as d, proto::boji::v1 as p};
use chrono::{DateTime, Utc};
use connectrpc::ConnectError;
use p::__buffa::oneof::{
    activity_operation::Action, activity_record::Payload as RecordPayload, upsert_activity::Payload,
};
use uuid::Uuid;

fn invalid() -> ConnectError {
    ConnectError::invalid_argument("INVALID_INPUT")
}
fn signed(value: u32) -> Result<i32, ConnectError> {
    value.try_into().map_err(|_| invalid())
}
fn unsigned(value: i32) -> Result<u32, ConnectError> {
    value
        .try_into()
        .map_err(|_| ConnectError::internal("Invalid stored activity value"))
}

impl TryFrom<p::ActivityOperation> for d::Operation {
    type Error = ConnectError;
    fn try_from(value: p::ActivityOperation) -> Result<Self, Self::Error> {
        let mutation_id = Uuid::parse_str(&value.mutation_id).map_err(|_| invalid())?;
        let id = Uuid::parse_str(&value.id).map_err(|_| invalid())?;
        let expected_revision = signed(value.expected_revision)?;
        let operation = match value.action.ok_or_else(invalid)? {
            Action::Delete(_) => Self::Delete {
                mutation_id,
                id,
                expected_revision,
            },
            Action::Upsert(value) => {
                let occurred_at = DateTime::parse_from_rfc3339(&value.occurred_at)
                    .map_err(|_| invalid())?
                    .with_timezone(&Utc);
                let source = match value.source.as_str() {
                    "manual" => d::Source::Manual,
                    "app" => d::Source::App,
                    "import" => d::Source::Import,
                    _ => return Err(invalid()),
                };
                let payload = match value.payload.ok_or_else(invalid)? {
                    Payload::Hydration(value) => {
                        d::ActivityPayload::Hydration(d::HydrationPayload {
                            amount_ml: signed(value.amount_ml)?,
                        })
                    }
                    Payload::Sleep(value) => d::ActivityPayload::Sleep(d::SleepPayload {
                        duration_minutes: signed(value.duration_minutes)?,
                    }),
                    Payload::Workout(value) => {
                        let duration_source = match value.duration_source.as_str() {
                            "measured" => d::DurationSource::Measured,
                            "estimated" => d::DurationSource::Estimated,
                            _ => return Err(invalid()),
                        };
                        let status = match value.status.as_str() {
                            "completed" => d::WorkoutStatus::Completed,
                            "abandoned" => d::WorkoutStatus::Abandoned,
                            _ => return Err(invalid()),
                        };
                        d::ActivityPayload::Workout(d::WorkoutPayload {
                            workout_id: value.workout_id,
                            workout_version: value.workout_version,
                            duration_seconds: signed(value.duration_seconds)?,
                            duration_source,
                            status,
                        })
                    }
                };
                Self::Upsert {
                    mutation_id,
                    id,
                    expected_revision,
                    occurred_at,
                    time_zone: value.time_zone,
                    source,
                    payload,
                }
            }
        };
        operation.validate().map_err(|_| invalid())?;
        Ok(operation)
    }
}

impl From<d::SyncState> for p::SyncState {
    fn from(value: d::SyncState) -> Self {
        Self {
            enabled: value.enabled,
            consent_version: value.consent_version,
            required_consent_version: value.required_consent_version,
            consented_at: value.consented_at,
            ..Default::default()
        }
    }
}
impl TryFrom<d::MutationResult> for p::MutationResult {
    type Error = ConnectError;
    fn try_from(value: d::MutationResult) -> Result<Self, Self::Error> {
        let code = value.code.map(|code| {
            match code {
                d::MutationConflictCode::RevisionConflict => "REVISION_CONFLICT",
                d::MutationConflictCode::RecordNotFound => "RECORD_NOT_FOUND",
                d::MutationConflictCode::RecordDeleted => "RECORD_DELETED",
                d::MutationConflictCode::KindConflict => "KIND_CONFLICT",
                d::MutationConflictCode::DayConflict => "DAY_CONFLICT",
                d::MutationConflictCode::MutationReused => "MUTATION_REUSED",
            }
            .to_owned()
        });
        Ok(Self {
            mutation_id: value.mutation_id.to_string(),
            id: value.id.to_string(),
            status: match value.status {
                d::MutationStatus::Applied => "applied",
                d::MutationStatus::Conflict => "conflict",
            }
            .into(),
            revision: value.revision.map(unsigned).transpose()?,
            sequence: value.sequence,
            code,
            current_revision: value.current_revision.map(unsigned).transpose()?,
            ..Default::default()
        })
    }
}
impl TryFrom<d::ActivityRecord> for p::ActivityRecord {
    type Error = ConnectError;
    fn try_from(value: d::ActivityRecord) -> Result<Self, Self::Error> {
        let payload = value
            .payload
            .map(|payload| -> Result<RecordPayload, ConnectError> {
                Ok(match payload {
                    d::ActivityPayload::Hydration(value) => {
                        RecordPayload::Hydration(Box::new(p::Hydration {
                            amount_ml: unsigned(value.amount_ml)?,
                            ..Default::default()
                        }))
                    }
                    d::ActivityPayload::Sleep(value) => RecordPayload::Sleep(Box::new(p::Sleep {
                        duration_minutes: unsigned(value.duration_minutes)?,
                        ..Default::default()
                    })),
                    d::ActivityPayload::Workout(value) => {
                        RecordPayload::Workout(Box::new(p::Workout {
                            workout_id: value.workout_id,
                            workout_version: value.workout_version,
                            duration_seconds: unsigned(value.duration_seconds)?,
                            duration_source: value.duration_source.as_str().into(),
                            status: value.status.as_str().into(),
                            ..Default::default()
                        }))
                    }
                })
            })
            .transpose()?;
        Ok(Self {
            id: value.id.to_string(),
            kind: value.kind.as_str().into(),
            source: value.source.as_str().into(),
            occurred_at: value.occurred_at,
            time_zone: value.time_zone,
            local_date: value.local_date,
            revision: unsigned(value.revision)?,
            sequence: value.sequence,
            updated_at: value.updated_at,
            deleted_at: value.deleted_at,
            payload,
            ..Default::default()
        })
    }
}
impl TryFrom<d::Day> for p::DailySummary {
    type Error = ConnectError;
    fn try_from(value: d::Day) -> Result<Self, Self::Error> {
        Ok(Self {
            date: value.date,
            water_ml: unsigned(value.water_ml)?,
            sleep_minutes: value.sleep_minutes.map(unsigned).transpose()?,
            workout_count: unsigned(value.workout_count)?,
            workout_seconds: u64::from(unsigned(value.workout_seconds)?),
            task_count: unsigned(value.task_count)?,
            has_record: value.has_record,
            ..Default::default()
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rejects_missing_action_and_overflow() {
        let value = p::ActivityOperation {
            id: Uuid::new_v4().to_string(),
            mutation_id: Uuid::new_v4().to_string(),
            ..Default::default()
        };
        assert!(d::Operation::try_from(value).is_err());
        assert!(signed(u32::MAX).is_err());
        assert!(unsigned(-1).is_err());
    }
    #[test]
    fn rejects_unapproved_healthkit_source() {
        let upsert = p::UpsertActivity {
            source: "healthkit".into(),
            occurred_at: "2026-01-01T00:00:00Z".into(),
            time_zone: "UTC".into(),
            payload: Some(Payload::Hydration(Box::new(p::Hydration {
                amount_ml: 250,
                ..Default::default()
            }))),
            ..Default::default()
        };
        let value = p::ActivityOperation {
            id: Uuid::new_v4().to_string(),
            mutation_id: Uuid::new_v4().to_string(),
            action: Some(Action::Upsert(Box::new(upsert))),
            ..Default::default()
        };
        assert!(d::Operation::try_from(value).is_err());
    }
}
