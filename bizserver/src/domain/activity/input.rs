//! Activity-sync request and response data transfer objects.

use chrono::{DateTime, Duration, SecondsFormat, Utc};
use chrono_tz::Tz;
use serde::{Deserialize, Deserializer, Serialize, Serializer, de::Error as DeError};
use thiserror::Error;
use uuid::Uuid;

/// The consent version that authorizes activity synchronization.
pub const SYNC_CONSENT_VERSION: &str = "activity-sync-v1";

const MAX_BATCH_OPERATIONS: usize = 50;
const MAX_CHANGE_LIMIT: u64 = 200;

/// A typed activity mutation batch.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct BatchInput {
    /// Mutations that must be applied in order.
    pub operations: Vec<Operation>,
}

impl BatchInput {
    /// Validates the batch limits and all mutation fields.
    pub fn validate(&self) -> Result<(), InputError> {
        validate_operations(&self.operations)
    }
}

/// One idempotent activity mutation.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(tag = "op", rename_all = "lowercase", deny_unknown_fields)]
pub enum Operation {
    /// Creates a record or replaces an existing live record at its expected revision.
    Upsert {
        /// Client-generated idempotency key.
        #[serde(rename = "mutationId")]
        mutation_id: Uuid,
        /// Stable activity-record identifier.
        id: Uuid,
        /// Revision expected by the client.
        #[serde(rename = "expectedRevision")]
        expected_revision: i32,
        /// Instant at which the activity occurred.
        #[serde(
            rename = "occurredAt",
            deserialize_with = "deserialize_rfc3339",
            serialize_with = "serialize_rfc3339"
        )]
        occurred_at: DateTime<Utc>,
        /// IANA time-zone name for the activity's calendar day.
        #[serde(rename = "timeZone")]
        time_zone: String,
        /// Producer of the activity data.
        source: Source,
        /// Kind-specific record content.
        #[serde(flatten)]
        payload: ActivityPayload,
    },
    /// Deletes an existing live record and leaves a tombstone.
    Delete {
        /// Client-generated idempotency key.
        #[serde(rename = "mutationId")]
        mutation_id: Uuid,
        /// Stable activity-record identifier.
        id: Uuid,
        /// Revision expected by the client.
        #[serde(rename = "expectedRevision")]
        expected_revision: i32,
    },
}

impl Operation {
    /// Returns the idempotency key carried by this operation.
    pub fn mutation_id(&self) -> Uuid {
        match self {
            Self::Upsert { mutation_id, .. } | Self::Delete { mutation_id, .. } => *mutation_id,
        }
    }

    /// Returns the stable activity-record identifier.
    pub fn id(&self) -> Uuid {
        match self {
            Self::Upsert { id, .. } | Self::Delete { id, .. } => *id,
        }
    }

    /// Returns the revision that this operation expects.
    pub fn expected_revision(&self) -> i32 {
        match self {
            Self::Upsert {
                expected_revision, ..
            }
            | Self::Delete {
                expected_revision, ..
            } => *expected_revision,
        }
    }

    /// Validates this operation at the domain boundary.
    pub fn validate(&self) -> Result<(), InputError> {
        if !(0..=2_000_000_000).contains(&self.expected_revision()) {
            return Err(InputError::InvalidRevision);
        }
        if let Self::Upsert {
            occurred_at,
            time_zone,
            payload,
            ..
        } = self
        {
            validate_timestamp(*occurred_at)?;
            parse_time_zone(time_zone)?;
            payload.validate()?;
        }
        Ok(())
    }

    /// Calculates the record's local date after validation.
    pub fn local_date(&self) -> Result<chrono::NaiveDate, InputError> {
        match self {
            Self::Upsert {
                occurred_at,
                time_zone,
                ..
            } => Ok(occurred_at
                .with_timezone(&parse_time_zone(time_zone)?)
                .date_naive()),
            Self::Delete { .. } => Err(InputError::DeleteHasNoLocalDate),
        }
    }
}

/// A supported producer of activity data.
#[derive(Clone, Copy, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Source {
    /// A value entered directly by the user.
    Manual,
    /// A value recorded by a Boji application.
    App,
    /// A value imported through an approved source.
    Import,
}

impl Source {
    /// Returns the persisted protocol value.
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Manual => "manual",
            Self::App => "app",
            Self::Import => "import",
        }
    }
}

/// Activity content tagged by its protocol `kind` field.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(
    tag = "kind",
    content = "payload",
    rename_all = "lowercase",
    deny_unknown_fields
)]
pub enum ActivityPayload {
    /// A hydration record.
    Hydration(HydrationPayload),
    /// A sleep record.
    Sleep(SleepPayload),
    /// A workout record.
    Workout(WorkoutPayload),
}

impl ActivityPayload {
    /// Returns the persisted protocol value.
    pub const fn kind(&self) -> ActivityKind {
        match self {
            Self::Hydration(_) => ActivityKind::Hydration,
            Self::Sleep(_) => ActivityKind::Sleep,
            Self::Workout(_) => ActivityKind::Workout,
        }
    }

    /// Validates kind-specific values.
    pub fn validate(&self) -> Result<(), InputError> {
        match self {
            Self::Hydration(payload) => {
                if !(1..=10_000).contains(&payload.amount_ml) {
                    return Err(InputError::InvalidHydrationAmount);
                }
            }
            Self::Sleep(payload) => {
                if !(0..=960).contains(&payload.duration_minutes) {
                    return Err(InputError::InvalidSleepDuration);
                }
            }
            Self::Workout(payload) => {
                if !(0..=86_400).contains(&payload.duration_seconds) {
                    return Err(InputError::InvalidWorkoutDuration);
                }
                if !valid_trimmed_text(&payload.workout_id, 100)
                    || !valid_trimmed_text(&payload.workout_version, 50)
                {
                    return Err(InputError::InvalidWorkoutReference);
                }
            }
        }
        Ok(())
    }
}

/// The activity kinds stored by the synchronization protocol.
#[derive(Clone, Copy, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ActivityKind {
    /// Hydration activity.
    Hydration,
    /// Sleep activity.
    Sleep,
    /// Workout activity.
    Workout,
}

impl ActivityKind {
    /// Returns the persisted protocol value.
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Hydration => "hydration",
            Self::Sleep => "sleep",
            Self::Workout => "workout",
        }
    }
}

/// The payload for one hydration record.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct HydrationPayload {
    /// Water volume in millilitres.
    pub amount_ml: i32,
}

/// The payload for one sleep record.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct SleepPayload {
    /// Sleep duration in minutes.
    pub duration_minutes: i32,
}

/// The payload for one workout record.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct WorkoutPayload {
    /// Stable workout definition identifier.
    pub workout_id: String,
    /// Workout definition version.
    pub workout_version: String,
    /// Measured or estimated workout duration in seconds.
    pub duration_seconds: i32,
    /// How the duration was obtained.
    pub duration_source: DurationSource,
    /// Completion state for the workout.
    pub status: WorkoutStatus,
}

/// The origin quality of a workout duration.
#[derive(Clone, Copy, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum DurationSource {
    /// Duration was measured by a recording device or application.
    Measured,
    /// Duration was estimated.
    Estimated,
}

impl DurationSource {
    /// Returns the persisted protocol value.
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Measured => "measured",
            Self::Estimated => "estimated",
        }
    }
}

/// The outcome state for a workout.
#[derive(Clone, Copy, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum WorkoutStatus {
    /// The workout was completed.
    Completed,
    /// The workout was abandoned before completion.
    Abandoned,
}

impl WorkoutStatus {
    /// Returns the persisted protocol value.
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Completed => "completed",
            Self::Abandoned => "abandoned",
        }
    }
}

/// An individual mutation receipt.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct MutationResult {
    /// Client-generated idempotency key.
    pub mutation_id: Uuid,
    /// Stable activity-record identifier.
    pub id: Uuid,
    /// Whether the mutation changed state or conflicted.
    pub status: MutationStatus,
    /// New record revision after an applied mutation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub revision: Option<i32>,
    /// Per-user sequence assigned after an applied mutation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sequence: Option<String>,
    /// Machine-readable conflict reason.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<MutationConflictCode>,
    /// Server revision observed during a record conflict.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub current_revision: Option<i32>,
}

/// The result status of one mutation.
#[derive(Clone, Copy, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MutationStatus {
    /// The server applied the operation.
    Applied,
    /// The server rejected the operation without changing the record.
    Conflict,
}

/// The protocol conflict reasons returned in a mutation receipt.
#[derive(Clone, Copy, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub enum MutationConflictCode {
    /// The expected revision did not equal the server revision.
    #[serde(rename = "REVISION_CONFLICT")]
    RevisionConflict,
    /// The record did not exist when an update or delete required it.
    #[serde(rename = "RECORD_NOT_FOUND")]
    RecordNotFound,
    /// The record is a permanent tombstone.
    #[serde(rename = "RECORD_DELETED")]
    RecordDeleted,
    /// The requested kind differed from the existing record kind.
    #[serde(rename = "KIND_CONFLICT")]
    KindConflict,
    /// A different live sleep record already owns the local date.
    #[serde(rename = "DAY_CONFLICT")]
    DayConflict,
    /// The idempotency key was reused with different contents.
    #[serde(rename = "MUTATION_REUSED")]
    MutationReused,
}

/// The result of a mutation batch.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct BatchResult {
    /// Receipts in the same order as the submitted operations.
    pub results: Vec<MutationResult>,
    /// The user's latest committed sequence after this batch.
    ///
    /// Clients must not submit this value as `get_changes`'s `cursor`.
    pub server_cursor: String,
}

/// The synchronization-consent state returned to a user.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SyncState {
    /// Whether activity synchronization is currently enabled.
    pub enabled: bool,
    /// The consent version stored for the user, if any.
    pub consent_version: Option<String>,
    /// The consent version required to enable synchronization.
    pub required_consent_version: String,
    /// The RFC 3339 time at which synchronization was first enabled.
    pub consented_at: Option<String>,
}

/// A page of activity changes.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Changes {
    /// Changed records in strictly increasing per-user sequence order.
    pub records: Vec<ActivityRecord>,
    /// Cursor for the next changes request.
    pub next_cursor: String,
    /// Whether more records remained at the request's snapshot upper bound.
    pub has_more: bool,
}

/// One synchronized activity record or tombstone.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ActivityRecord {
    /// Stable activity-record identifier.
    pub id: Uuid,
    /// Activity kind.
    pub kind: ActivityKind,
    /// Producer of the data.
    pub source: Source,
    /// RFC 3339 occurrence time.
    pub occurred_at: String,
    /// IANA time-zone name.
    pub time_zone: String,
    /// Activity date in its time zone.
    pub local_date: String,
    /// Current record revision.
    pub revision: i32,
    /// Per-user sequence for this version.
    pub sequence: String,
    /// RFC 3339 modification time.
    pub updated_at: String,
    /// RFC 3339 tombstone time, if the record was deleted.
    pub deleted_at: Option<String>,
    /// Kind-specific payload, or `null` for a tombstone.
    pub payload: Option<ActivityPayload>,
}

/// The summary response for an inclusive range of calendar days.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct Days {
    /// One entry for every requested date.
    pub days: Vec<Day>,
}

/// A daily activity summary.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Day {
    /// Calendar date in `YYYY-MM-DD` form.
    pub date: String,
    /// Total hydration in millilitres.
    pub water_ml: i32,
    /// Sleep duration, if a sleep record exists.
    pub sleep_minutes: Option<i32>,
    /// Completed workout count.
    pub workout_count: i32,
    /// Completed workout duration total in seconds.
    pub workout_seconds: i32,
    /// Number of completed daily activity categories.
    pub task_count: i32,
    /// Whether at least one daily category has a record.
    pub has_record: bool,
}

/// Domain input validation errors.
#[derive(Clone, Debug, Error, PartialEq, Eq)]
pub enum InputError {
    /// The batch did not contain 1 through 50 operations.
    #[error("an activity batch must contain 1 through 50 operations")]
    InvalidBatchSize,
    /// The expected revision was outside the supported range.
    #[error("the expected revision is outside the supported range")]
    InvalidRevision,
    /// The timestamp was malformed or outside the supported range.
    #[error("the occurrence timestamp is outside the supported range")]
    InvalidTimestamp,
    /// The time-zone identifier was malformed or unknown.
    #[error("the time zone is invalid")]
    InvalidTimeZone,
    /// The hydration amount was outside the supported range.
    #[error("the hydration amount is outside the supported range")]
    InvalidHydrationAmount,
    /// The sleep duration was outside the supported range.
    #[error("the sleep duration is outside the supported range")]
    InvalidSleepDuration,
    /// The workout duration was outside the supported range.
    #[error("the workout duration is outside the supported range")]
    InvalidWorkoutDuration,
    /// A workout identifier or version was invalid.
    #[error("the workout identifier or version is invalid")]
    InvalidWorkoutReference,
    /// A delete operation cannot provide a local date.
    #[error("a delete operation has no local date")]
    DeleteHasNoLocalDate,
    /// The date range was malformed or too large.
    #[error("the date range is invalid")]
    InvalidDateRange,
    /// The changes cursor was malformed or outside the current stream.
    #[error("the changes cursor is invalid")]
    InvalidCursor,
    /// The changes limit was outside the supported range.
    #[error("the changes limit must be 1 through 200")]
    InvalidChangeLimit,
}

/// Validates a slice used directly by `apply_batch`.
pub(crate) fn validate_operations(operations: &[Operation]) -> Result<(), InputError> {
    if !(1..=MAX_BATCH_OPERATIONS).contains(&operations.len()) {
        return Err(InputError::InvalidBatchSize);
    }
    for operation in operations {
        operation.validate()?;
    }
    Ok(())
}

/// Parses an IANA time-zone name accepted by the protocol.
pub(crate) fn parse_time_zone(value: &str) -> Result<Tz, InputError> {
    if value.is_empty() || value.len() > 100 {
        return Err(InputError::InvalidTimeZone);
    }
    if value == "GMT" {
        return Ok(chrono_tz::UTC);
    }
    value.parse::<Tz>().map_err(|_| InputError::InvalidTimeZone)
}

/// Validates an inclusive date range and returns its parsed endpoints.
pub(crate) fn parse_days_range(
    from: &str,
    to: &str,
) -> Result<(chrono::NaiveDate, chrono::NaiveDate), InputError> {
    let from = parse_date(from)?;
    let to = parse_date(to)?;
    let span = to.signed_duration_since(from).num_days();
    if !(0..93).contains(&span) {
        return Err(InputError::InvalidDateRange);
    }
    Ok((from, to))
}

/// Validates a protocol cursor and converts it to a signed database sequence.
pub(crate) fn parse_cursor(cursor: &str) -> Result<i64, InputError> {
    if cursor == "0" {
        return Ok(0);
    }
    if cursor.is_empty()
        || cursor.len() > 19
        || cursor.starts_with('0')
        || !cursor.bytes().all(|byte| byte.is_ascii_digit())
    {
        return Err(InputError::InvalidCursor);
    }
    cursor.parse::<i64>().map_err(|_| InputError::InvalidCursor)
}

/// Validates a protocol changes page size.
pub(crate) fn validate_change_limit(limit: u64) -> Result<usize, InputError> {
    if !(1..=MAX_CHANGE_LIMIT).contains(&limit) {
        return Err(InputError::InvalidChangeLimit);
    }
    Ok(limit as usize)
}

fn parse_date(value: &str) -> Result<chrono::NaiveDate, InputError> {
    if value.len() != 10 {
        return Err(InputError::InvalidDateRange);
    }
    let date = chrono::NaiveDate::parse_from_str(value, "%Y-%m-%d")
        .map_err(|_| InputError::InvalidDateRange)?;
    if date.format("%F").to_string() != value {
        return Err(InputError::InvalidDateRange);
    }
    Ok(date)
}

fn valid_trimmed_text(value: &str, maximum: usize) -> bool {
    !value.is_empty() && value.len() <= maximum && value.trim() == value
}

fn validate_timestamp(value: DateTime<Utc>) -> Result<(), InputError> {
    let earliest = DateTime::from_timestamp(946_684_800, 0).ok_or(InputError::InvalidTimestamp)?;
    if value < earliest || value > Utc::now() + Duration::minutes(5) {
        return Err(InputError::InvalidTimestamp);
    }
    Ok(())
}

fn deserialize_rfc3339<'de, D>(deserializer: D) -> Result<DateTime<Utc>, D::Error>
where
    D: Deserializer<'de>,
{
    let value = String::deserialize(deserializer)?;
    DateTime::parse_from_rfc3339(&value)
        .map(|date_time| date_time.with_timezone(&Utc))
        .map_err(D::Error::custom)
}

fn serialize_rfc3339<S>(value: &DateTime<Utc>, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    serializer.serialize_str(&value.to_rfc3339_opts(SecondsFormat::Millis, true))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn batch_deserializes_flat_json_shape() {
        let input: BatchInput = serde_json::from_str(
            r#"{"operations":[{"mutationId":"c0a80101-0000-4000-8000-000000000001","id":"c0a80101-0000-4000-8000-000000000002","expectedRevision":0,"op":"upsert","occurredAt":"2024-01-02T03:04:05+08:00","timeZone":"Asia/Shanghai","source":"app","kind":"hydration","payload":{"amountMl":250}}]}"#,
        )
        .expect("the flat JSON shape must deserialize");
        input.validate().expect("the input must validate");
        let encoded = serde_json::to_value(input).expect("the input must serialize");
        assert_eq!(encoded["operations"][0]["kind"], "hydration");
        assert_eq!(encoded["operations"][0]["payload"]["amountMl"], 250);
    }

    #[test]
    fn rejects_healthkit_and_invalid_batch_sizes() {
        let input = serde_json::from_str::<BatchInput>(
            r#"{"operations":[{"mutationId":"c0a80101-0000-4000-8000-000000000001","id":"c0a80101-0000-4000-8000-000000000002","expectedRevision":0,"op":"upsert","occurredAt":"2024-01-02T03:04:05Z","timeZone":"UTC","source":"HealthKit","kind":"hydration","payload":{"amountMl":250}}]}"#,
        );
        assert!(input.is_err());
        assert_eq!(
            BatchInput { operations: vec![] }.validate(),
            Err(InputError::InvalidBatchSize)
        );
    }

    #[test]
    fn local_date_uses_the_supplied_time_zone() {
        let operation: Operation = serde_json::from_str(
            r#"{"mutationId":"c0a80101-0000-4000-8000-000000000001","id":"c0a80101-0000-4000-8000-000000000002","expectedRevision":0,"op":"upsert","occurredAt":"2024-01-01T23:30:00Z","timeZone":"Asia/Shanghai","source":"manual","kind":"sleep","payload":{"durationMinutes":420}}"#,
        )
        .expect("operation must deserialize");
        assert_eq!(
            operation
                .local_date()
                .expect("timezone is valid")
                .to_string(),
            "2024-01-02"
        );
    }
}
