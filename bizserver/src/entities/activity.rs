//! SeaORM entities for activity synchronization.

use sea_orm::entity::prelude::*;

/// Synchronization-consent state per user.
pub mod sync_state {
    use super::*;

    /// The `activity_sync_state` row.
    #[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
    #[sea_orm(table_name = "activity_sync_state")]
    pub struct Model {
        /// Referenced text user identifier.
        #[sea_orm(primary_key, auto_increment = false)]
        pub user_id: String,
        /// Whether synchronization is active.
        pub enabled: bool,
        /// Accepted consent version.
        pub consent_version: Option<String>,
        /// First time the current consent was enabled.
        pub consented_at: Option<DateTimeUtc>,
        /// Most recent disable time.
        pub disabled_at: Option<DateTimeUtc>,
        /// Latest per-user committed sequence.
        pub last_sequence: i64,
    }

    /// No direct SeaORM relations are required for this entity.
    #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
    pub enum Relation {}

    impl ActiveModelBehavior for ActiveModel {}
}

/// Base event rows, including permanent tombstones.
pub mod event {
    use super::*;

    /// The `activity_event` row.
    #[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
    #[sea_orm(table_name = "activity_event")]
    pub struct Model {
        /// Referenced text user identifier.
        #[sea_orm(primary_key, auto_increment = false)]
        pub user_id: String,
        /// Stable activity-record identifier.
        #[sea_orm(primary_key, auto_increment = false)]
        pub id: Uuid,
        /// Protocol activity kind.
        pub kind: String,
        /// Protocol record source.
        pub source: String,
        /// UTC occurrence timestamp.
        pub occurred_at: DateTimeUtc,
        /// IANA time-zone name.
        pub time_zone: String,
        /// Local calendar date.
        pub local_date: Date,
        /// Optimistic concurrency revision.
        pub revision: i32,
        /// Per-user change sequence.
        pub sequence: i64,
        /// UTC update timestamp.
        pub updated_at: DateTimeUtc,
        /// UTC deletion timestamp for tombstones.
        pub deleted_at: Option<DateTimeUtc>,
    }

    /// No direct SeaORM relations are required for this entity.
    #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
    pub enum Relation {}

    impl ActiveModelBehavior for ActiveModel {}
}

/// Hydration detail rows.
pub mod hydration {
    use super::*;

    /// The `hydration_entry` row.
    #[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
    #[sea_orm(table_name = "hydration_entry")]
    pub struct Model {
        /// Referenced text user identifier.
        #[sea_orm(primary_key, auto_increment = false)]
        pub user_id: String,
        /// Referenced activity-event identifier.
        #[sea_orm(primary_key, auto_increment = false)]
        pub event_id: Uuid,
        /// Hydration volume in millilitres.
        pub amount_ml: i32,
    }

    /// No direct SeaORM relations are required for this entity.
    #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
    pub enum Relation {}

    impl ActiveModelBehavior for ActiveModel {}
}

/// Sleep detail rows.
pub mod sleep {
    use super::*;

    /// The `sleep_entry` row.
    #[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
    #[sea_orm(table_name = "sleep_entry")]
    pub struct Model {
        /// Referenced text user identifier.
        #[sea_orm(primary_key, auto_increment = false)]
        pub user_id: String,
        /// Referenced activity-event identifier.
        #[sea_orm(primary_key, auto_increment = false)]
        pub event_id: Uuid,
        /// Sleep duration in minutes.
        pub duration_minutes: i32,
    }

    /// No direct SeaORM relations are required for this entity.
    #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
    pub enum Relation {}

    impl ActiveModelBehavior for ActiveModel {}
}

/// Workout detail rows.
pub mod workout {
    use super::*;

    /// The `workout_session` row.
    #[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
    #[sea_orm(table_name = "workout_session")]
    pub struct Model {
        /// Referenced text user identifier.
        #[sea_orm(primary_key, auto_increment = false)]
        pub user_id: String,
        /// Referenced activity-event identifier.
        #[sea_orm(primary_key, auto_increment = false)]
        pub event_id: Uuid,
        /// Stable workout definition identifier.
        pub workout_id: String,
        /// Workout definition version.
        pub workout_version: String,
        /// Duration in seconds.
        pub duration_seconds: i32,
        /// Duration-source protocol value.
        pub duration_source: String,
        /// Workout-status protocol value.
        pub status: String,
    }

    /// No direct SeaORM relations are required for this entity.
    #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
    pub enum Relation {}

    impl ActiveModelBehavior for ActiveModel {}
}

/// Stored idempotent mutation receipts.
pub mod mutation {
    use super::*;

    /// The `activity_mutation` row.
    #[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
    #[sea_orm(table_name = "activity_mutation")]
    pub struct Model {
        /// Referenced text user identifier.
        #[sea_orm(primary_key, auto_increment = false)]
        pub user_id: String,
        /// Client-generated idempotency key.
        #[sea_orm(primary_key, auto_increment = false)]
        pub mutation_id: Uuid,
        /// Stable hash of the submitted operation.
        pub request_hash: String,
        /// Serialized mutation receipt.
        pub result: Json,
        /// UTC receipt creation timestamp.
        pub created_at: DateTimeUtc,
    }

    /// No direct SeaORM relations are required for this entity.
    #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
    pub enum Relation {}

    impl ActiveModelBehavior for ActiveModel {}
}

/// Materialized daily activity summaries.
pub mod daily_summary {
    use super::*;

    /// The `daily_activity_summary` row.
    #[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
    #[sea_orm(table_name = "daily_activity_summary")]
    pub struct Model {
        /// Referenced text user identifier.
        #[sea_orm(primary_key, auto_increment = false)]
        pub user_id: String,
        /// Calendar date for the summary.
        #[sea_orm(primary_key, auto_increment = false)]
        pub date: Date,
        /// Total hydration volume in millilitres.
        pub water_ml: i32,
        /// Sleep duration when present.
        pub sleep_minutes: Option<i32>,
        /// Completed workout count.
        pub workout_count: i32,
        /// Completed workout duration in seconds.
        pub workout_seconds: i32,
        /// UTC recomputation timestamp.
        pub updated_at: DateTimeUtc,
    }

    /// No direct SeaORM relations are required for this entity.
    #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
    pub enum Relation {}

    impl ActiveModelBehavior for ActiveModel {}
}
