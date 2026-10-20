//! PostgreSQL schema creation for activity synchronization.

use sea_orm_migration::prelude::*;

/// Creates the activity synchronization tables and indexes.
///
/// The caller must run this after the authentication migration that creates
/// the text primary key `user.id`.
pub async fn up(manager: &SchemaManager<'_>) -> Result<(), DbErr> {
    manager
        .create_table(
            Table::create()
                .table(ActivitySyncState::Table)
                .if_not_exists()
                .col(
                    ColumnDef::new(ActivitySyncState::UserId)
                        .text()
                        .not_null()
                        .primary_key(),
                )
                .col(
                    ColumnDef::new(ActivitySyncState::Enabled)
                        .boolean()
                        .not_null()
                        .default(false),
                )
                .col(ColumnDef::new(ActivitySyncState::ConsentVersion).text())
                .col(ColumnDef::new(ActivitySyncState::ConsentedAt).timestamp_with_time_zone())
                .col(ColumnDef::new(ActivitySyncState::DisabledAt).timestamp_with_time_zone())
                .col(
                    ColumnDef::new(ActivitySyncState::LastSequence)
                        .big_integer()
                        .not_null()
                        .default(0),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("activity_sync_state_user_fk")
                        .from(ActivitySyncState::Table, ActivitySyncState::UserId)
                        .to(Alias::new("user"), Alias::new("id"))
                        .on_delete(ForeignKeyAction::Cascade),
                )
                .to_owned(),
        )
        .await?;

    manager
        .create_table(
            Table::create()
                .table(ActivityEvent::Table)
                .if_not_exists()
                .col(ColumnDef::new(ActivityEvent::UserId).string().not_null())
                .col(ColumnDef::new(ActivityEvent::Id).uuid().not_null())
                .col(ColumnDef::new(ActivityEvent::Kind).string().not_null())
                .col(ColumnDef::new(ActivityEvent::Source).string().not_null())
                .col(
                    ColumnDef::new(ActivityEvent::OccurredAt)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .col(ColumnDef::new(ActivityEvent::TimeZone).string().not_null())
                .col(ColumnDef::new(ActivityEvent::LocalDate).date().not_null())
                .col(ColumnDef::new(ActivityEvent::Revision).integer().not_null())
                .col(
                    ColumnDef::new(ActivityEvent::Sequence)
                        .big_integer()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(ActivityEvent::UpdatedAt)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .col(ColumnDef::new(ActivityEvent::DeletedAt).timestamp_with_time_zone())
                .primary_key(
                    Index::create()
                        .col(ActivityEvent::UserId)
                        .col(ActivityEvent::Id),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("activity_event_user_fk")
                        .from(ActivityEvent::Table, ActivityEvent::UserId)
                        .to(Alias::new("user"), Alias::new("id"))
                        .on_delete(ForeignKeyAction::Cascade),
                )
                .check((
                    "activity_event_kind_check",
                    Expr::col(ActivityEvent::Kind).is_in(["hydration", "sleep", "workout"]),
                ))
                .check((
                    "activity_event_source_check",
                    Expr::col(ActivityEvent::Source).is_in(["manual", "app", "import"]),
                ))
                .check((
                    "activity_event_revision_positive",
                    Expr::col(ActivityEvent::Revision)
                        .gt(0)
                        .and(Expr::col(ActivityEvent::Sequence).gt(0)),
                ))
                .to_owned(),
        )
        .await?;
    manager
        .create_index(
            Index::create()
                .name("activity_event_user_sequence_unique")
                .table(ActivityEvent::Table)
                .col(ActivityEvent::UserId)
                .col(ActivityEvent::Sequence)
                .unique()
                .to_owned(),
        )
        .await?;
    manager
        .create_index(
            Index::create()
                .name("activity_event_user_date_idx")
                .table(ActivityEvent::Table)
                .col(ActivityEvent::UserId)
                .col(ActivityEvent::LocalDate)
                .to_owned(),
        )
        .await?;
    // SeaQuery does not express a PostgreSQL partial unique index in this
    // dependency version. This index is the database backstop for one sleep
    // record per user-local date.
    manager
        .get_connection()
        .execute_unprepared(
            "CREATE UNIQUE INDEX IF NOT EXISTS activity_event_sleep_day_unique \
             ON activity_event (user_id, local_date) \
             WHERE kind = 'sleep' AND deleted_at IS NULL",
        )
        .await?;

    manager
        .create_table(
            Table::create()
                .table(HydrationEntry::Table)
                .if_not_exists()
                .col(ColumnDef::new(HydrationEntry::UserId).string().not_null())
                .col(ColumnDef::new(HydrationEntry::EventId).uuid().not_null())
                .col(
                    ColumnDef::new(HydrationEntry::AmountMl)
                        .integer()
                        .not_null(),
                )
                .primary_key(
                    Index::create()
                        .col(HydrationEntry::UserId)
                        .col(HydrationEntry::EventId),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("hydration_entry_event_fk")
                        .from(
                            HydrationEntry::Table,
                            (HydrationEntry::UserId, HydrationEntry::EventId),
                        )
                        .to(
                            ActivityEvent::Table,
                            (ActivityEvent::UserId, ActivityEvent::Id),
                        )
                        .on_delete(ForeignKeyAction::Cascade),
                )
                .check((
                    "hydration_entry_amount_check",
                    Expr::col(HydrationEntry::AmountMl).between(1, 10_000),
                ))
                .to_owned(),
        )
        .await?;
    manager
        .create_table(
            Table::create()
                .table(SleepEntry::Table)
                .if_not_exists()
                .col(ColumnDef::new(SleepEntry::UserId).string().not_null())
                .col(ColumnDef::new(SleepEntry::EventId).uuid().not_null())
                .col(
                    ColumnDef::new(SleepEntry::DurationMinutes)
                        .integer()
                        .not_null(),
                )
                .primary_key(
                    Index::create()
                        .col(SleepEntry::UserId)
                        .col(SleepEntry::EventId),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("sleep_entry_event_fk")
                        .from(SleepEntry::Table, (SleepEntry::UserId, SleepEntry::EventId))
                        .to(
                            ActivityEvent::Table,
                            (ActivityEvent::UserId, ActivityEvent::Id),
                        )
                        .on_delete(ForeignKeyAction::Cascade),
                )
                .check((
                    "sleep_entry_duration_check",
                    Expr::col(SleepEntry::DurationMinutes).between(0, 960),
                ))
                .to_owned(),
        )
        .await?;
    manager
        .create_table(
            Table::create()
                .table(WorkoutSession::Table)
                .if_not_exists()
                .col(ColumnDef::new(WorkoutSession::UserId).string().not_null())
                .col(ColumnDef::new(WorkoutSession::EventId).uuid().not_null())
                .col(
                    ColumnDef::new(WorkoutSession::WorkoutId)
                        .string()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(WorkoutSession::WorkoutVersion)
                        .string()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(WorkoutSession::DurationSeconds)
                        .integer()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(WorkoutSession::DurationSource)
                        .string()
                        .not_null(),
                )
                .col(ColumnDef::new(WorkoutSession::Status).string().not_null())
                .primary_key(
                    Index::create()
                        .col(WorkoutSession::UserId)
                        .col(WorkoutSession::EventId),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("workout_session_event_fk")
                        .from(
                            WorkoutSession::Table,
                            (WorkoutSession::UserId, WorkoutSession::EventId),
                        )
                        .to(
                            ActivityEvent::Table,
                            (ActivityEvent::UserId, ActivityEvent::Id),
                        )
                        .on_delete(ForeignKeyAction::Cascade),
                )
                .check((
                    "workout_session_duration_check",
                    Expr::col(WorkoutSession::DurationSeconds).between(0, 86_400),
                ))
                .check((
                    "workout_session_status_check",
                    Expr::col(WorkoutSession::Status).is_in(["completed", "abandoned"]),
                ))
                .check((
                    "workout_session_source_check",
                    Expr::col(WorkoutSession::DurationSource).is_in(["measured", "estimated"]),
                ))
                .to_owned(),
        )
        .await?;

    manager
        .create_table(
            Table::create()
                .table(ActivityMutation::Table)
                .if_not_exists()
                .col(ColumnDef::new(ActivityMutation::UserId).string().not_null())
                .col(
                    ColumnDef::new(ActivityMutation::MutationId)
                        .uuid()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(ActivityMutation::RequestHash)
                        .string()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(ActivityMutation::Result)
                        .json_binary()
                        .not_null(),
                )
                .col(
                    ColumnDef::new(ActivityMutation::CreatedAt)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .primary_key(
                    Index::create()
                        .col(ActivityMutation::UserId)
                        .col(ActivityMutation::MutationId),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("activity_mutation_user_fk")
                        .from(ActivityMutation::Table, ActivityMutation::UserId)
                        .to(Alias::new("user"), Alias::new("id"))
                        .on_delete(ForeignKeyAction::Cascade),
                )
                .to_owned(),
        )
        .await?;
    manager
        .create_table(
            Table::create()
                .table(DailyActivitySummary::Table)
                .if_not_exists()
                .col(
                    ColumnDef::new(DailyActivitySummary::UserId)
                        .string()
                        .not_null(),
                )
                .col(ColumnDef::new(DailyActivitySummary::Date).date().not_null())
                .col(
                    ColumnDef::new(DailyActivitySummary::WaterMl)
                        .integer()
                        .not_null()
                        .default(0),
                )
                .col(ColumnDef::new(DailyActivitySummary::SleepMinutes).integer())
                .col(
                    ColumnDef::new(DailyActivitySummary::WorkoutCount)
                        .integer()
                        .not_null()
                        .default(0),
                )
                .col(
                    ColumnDef::new(DailyActivitySummary::WorkoutSeconds)
                        .integer()
                        .not_null()
                        .default(0),
                )
                .col(
                    ColumnDef::new(DailyActivitySummary::UpdatedAt)
                        .timestamp_with_time_zone()
                        .not_null(),
                )
                .primary_key(
                    Index::create()
                        .col(DailyActivitySummary::UserId)
                        .col(DailyActivitySummary::Date),
                )
                .foreign_key(
                    ForeignKey::create()
                        .name("daily_activity_summary_user_fk")
                        .from(DailyActivitySummary::Table, DailyActivitySummary::UserId)
                        .to(Alias::new("user"), Alias::new("id"))
                        .on_delete(ForeignKeyAction::Cascade),
                )
                .to_owned(),
        )
        .await
}

#[derive(Iden)]
enum ActivitySyncState {
    Table,
    UserId,
    Enabled,
    ConsentVersion,
    ConsentedAt,
    DisabledAt,
    LastSequence,
}

#[derive(Iden)]
enum ActivityEvent {
    Table,
    UserId,
    Id,
    Kind,
    Source,
    OccurredAt,
    TimeZone,
    LocalDate,
    Revision,
    Sequence,
    UpdatedAt,
    DeletedAt,
}

#[derive(Iden)]
enum HydrationEntry {
    Table,
    UserId,
    EventId,
    AmountMl,
}

#[derive(Iden)]
enum SleepEntry {
    Table,
    UserId,
    EventId,
    DurationMinutes,
}

#[derive(Iden)]
enum WorkoutSession {
    Table,
    UserId,
    EventId,
    WorkoutId,
    WorkoutVersion,
    DurationSeconds,
    DurationSource,
    Status,
}

#[derive(Iden)]
enum ActivityMutation {
    Table,
    UserId,
    MutationId,
    RequestHash,
    Result,
    CreatedAt,
}

#[derive(Iden)]
enum DailyActivitySummary {
    Table,
    UserId,
    Date,
    WaterMl,
    SleepMinutes,
    WorkoutCount,
    WorkoutSeconds,
    UpdatedAt,
}
