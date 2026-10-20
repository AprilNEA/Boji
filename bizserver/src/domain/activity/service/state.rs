use chrono::{SecondsFormat, Utc};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, ConnectionTrait, DatabaseConnection, EntityTrait, QueryFilter,
    QuerySelect, Set, TransactionTrait, sea_query::OnConflict,
};

use crate::entities::activity::sync_state;

use super::{ActivityError, map_transaction};
use crate::domain::activity::{SYNC_CONSENT_VERSION, SyncState};

/// Returns the current activity-sync consent state for one user.
pub async fn get_sync(db: &DatabaseConnection, user_id: &str) -> Result<SyncState, ActivityError> {
    let state = sync_state::Entity::find_by_id(user_id.to_owned())
        .one(db)
        .await?;
    Ok(match state {
        Some(state) => to_sync_state(&state),
        None => SyncState {
            enabled: false,
            consent_version: None,
            required_consent_version: SYNC_CONSENT_VERSION.to_owned(),
            consented_at: None,
        },
    })
}

/// Enables or disables activity synchronization for one user.
///
/// Enabling requires `Some("activity-sync-v1")`. Disabling does not remove the
/// accepted version or the stored activity history.
pub async fn set_sync(
    db: &DatabaseConnection,
    user_id: &str,
    enabled: bool,
    consent_version: Option<&str>,
) -> Result<SyncState, ActivityError> {
    if enabled && consent_version != Some(SYNC_CONSENT_VERSION) {
        return Err(ActivityError::ConsentRequired);
    }
    let user_id = user_id.to_owned();
    let result = db
        .transaction(move |transaction| {
            Box::pin(async move {
                let state = lock_state(transaction, &user_id).await?;
                let now = Utc::now();
                let consented_at = if state.enabled {
                    state.consented_at
                } else {
                    Some(now)
                };
                let mut active: sync_state::ActiveModel = state.into();
                if enabled {
                    active.enabled = Set(true);
                    active.consent_version = Set(Some(SYNC_CONSENT_VERSION.to_owned()));
                    active.consented_at = Set(consented_at);
                    active.disabled_at = Set(None);
                } else {
                    active.enabled = Set(false);
                    active.disabled_at = Set(Some(now));
                }
                let updated = active.update(transaction).await?;
                Ok::<_, ActivityError>(to_sync_state(&updated))
            })
        })
        .await;
    map_transaction(result)
}

pub(super) async fn lock_state<C>(db: &C, user_id: &str) -> Result<sync_state::Model, ActivityError>
where
    C: ConnectionTrait,
{
    sync_state::Entity::insert(sync_state::ActiveModel {
        user_id: Set(user_id.to_owned()),
        enabled: Set(false),
        consent_version: Set(None),
        consented_at: Set(None),
        disabled_at: Set(None),
        last_sequence: Set(0),
    })
    .on_conflict(
        OnConflict::column(sync_state::Column::UserId)
            .do_nothing()
            .to_owned(),
    )
    .exec_without_returning(db)
    .await?;

    sync_state::Entity::find()
        .filter(sync_state::Column::UserId.eq(user_id))
        .lock_exclusive()
        .one(db)
        .await?
        .ok_or(ActivityError::Invariant(
            "synchronization state was not created",
        ))
}

pub(super) fn to_sync_state(state: &sync_state::Model) -> SyncState {
    SyncState {
        enabled: state.enabled,
        consent_version: state.consent_version.clone(),
        required_consent_version: SYNC_CONSENT_VERSION.to_owned(),
        consented_at: state
            .consented_at
            .map(|value| value.to_rfc3339_opts(SecondsFormat::Millis, true)),
    }
}
