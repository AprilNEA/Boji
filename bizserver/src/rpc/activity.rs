//! `boji.v1.ActivityService` over the activity domain.

use super::{
    BusinessService,
    conversion::{self, ConvertedWrite},
    error::{self, resource_type},
    names, pagination,
};
use crate::{
    domain::activity::{self as d, ActivityError},
    proto::boji::v1 as p,
};
use aip_193::proto::Status;
use chrono::{Duration, NaiveDate};
use connectrpc::{
    ConnectError, ErrorCode, RequestContext, Response, ServiceRequest, ServiceResult,
};
use p::ErrorReason;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

const USER_FORM: &str = "users/{user}";
const SYNC_STATE_FORM: &str = "users/{user}/syncState";
const MAX_SUMMARY_DATES: u32 = 93;

/// Page state of `SummarizeActivities`. The range binds the token.
#[derive(Deserialize, Serialize)]
struct SummaryPage {
    start: NaiveDate,
    end: NaiveDate,
    next: NaiveDate,
}

/// Purpose of a change token. A token works only for the purpose it was
/// issued for.
#[derive(Clone, Copy, Debug, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "snake_case")]
enum TokenUse {
    /// `ListActivities.next_page_token`.
    ListPage,
    /// `SyncActivities.next_page_token`.
    SyncPage,
    /// `SyncActivities.next_sync_token`.
    Sync,
}

/// State of a `ListActivities` or `SyncActivities` token. The purpose and the
/// user bind the domain cursor, so a token of another method or user fails.
#[derive(Deserialize, Serialize)]
struct ChangeToken {
    purpose: TokenUse,
    user: String,
    cursor: String,
}

impl ChangeToken {
    /// Encode `cursor` as an opaque token for `purpose` and `user`.
    fn encode(purpose: TokenUse, user: &str, cursor: String) -> String {
        pagination::encode(&Self {
            purpose,
            user: user.to_owned(),
            cursor,
        })
    }

    /// Return the domain cursor of `token`. Return `invalid()` when the token
    /// is malformed or was issued for another purpose or user.
    fn cursor(
        token: &str,
        purpose: TokenUse,
        user: &str,
        invalid: fn() -> ConnectError,
    ) -> Result<String, ConnectError> {
        let state: Self = pagination::decode(token).map_err(|_| invalid())?;
        if state.purpose == purpose && state.user == user {
            Ok(state.cursor)
        } else {
            Err(invalid())
        }
    }
}

impl BusinessService {
    /// Authenticate and check the `parent` user of an activity request.
    async fn activity_owner(
        &self,
        ctx: &RequestContext,
        parent: &str,
    ) -> Result<String, ConnectError> {
        let principal = self.principal(ctx).await?;
        let [user] = names::parse("parent", parent, ["users"], None, USER_FORM)?;
        names::require_caller(user, &principal.user_id)?;
        Ok(principal.user_id)
    }
}

impl p::ActivityService for BusinessService {
    async fn get_sync_state<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::GetSyncStateRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::SyncState> + Send + use<'a>> {
        let principal = self.principal(&ctx).await?;
        let [user] = names::parse(
            "name",
            request.name,
            ["users"],
            Some("syncState"),
            SYNC_STATE_FORM,
        )?;
        names::require_caller(user, &principal.user_id)?;
        let state = d::get_sync(&self.db, &principal.user_id)
            .await
            .map_err(map_error)?;
        Response::ok(conversion::sync_state(&principal.user_id, state)?)
    }

    async fn update_sync_state<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::UpdateSyncStateRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::SyncState> + Send + use<'a>> {
        let principal = self.principal(&ctx).await?;
        let request = request.to_owned_message();
        let state = request
            .sync_state
            .as_option()
            .ok_or_else(|| error::invalid_input("sync_state", "The field is required."))?;
        let [user] = names::parse(
            "sync_state.name",
            &state.name,
            ["users"],
            Some("syncState"),
            SYNC_STATE_FORM,
        )?;
        names::require_caller(user, &principal.user_id)?;
        let (update_enabled, update_consent) = update_paths(&request, state)?;
        let current = d::get_sync(&self.db, &principal.user_id)
            .await
            .map_err(map_error)?;
        if !update_enabled && !update_consent {
            return Response::ok(conversion::sync_state(&principal.user_id, current)?);
        }
        let enabled = if update_enabled {
            state.enabled
        } else {
            current.enabled
        };
        let consent = update_consent.then_some(state.consent_version.as_str());
        let updated = d::set_sync(&self.db, &principal.user_id, enabled, consent)
            .await
            .map_err(map_error)?;
        Response::ok(conversion::sync_state(&principal.user_id, updated)?)
    }

    async fn get_activity<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::GetActivityRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::Activity> + Send + use<'a>> {
        let principal = self.principal(&ctx).await?;
        let [user, id] = names::parse(
            "name",
            request.name,
            ["users", "activities"],
            None,
            "users/{user}/activities/{activity}",
        )?;
        names::require_caller(user, &principal.user_id)?;
        let id = names::uuid("name", id)?;
        let record = d::get_activity(&self.db, &principal.user_id, id)
            .await
            .map_err(map_error)?
            .ok_or_else(|| {
                error::not_found(
                    ErrorReason::ACTIVITY_NOT_FOUND,
                    resource_type::ACTIVITY,
                    &names::activity(&principal.user_id, &id.to_string()),
                )
            })?;
        Response::ok(conversion::activity(&principal.user_id, record)?)
    }

    async fn list_activities<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::ListActivitiesRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::ListActivitiesResponse> + Send + use<'a>> {
        let user = self.activity_owner(&ctx, request.parent).await?;
        let limit = pagination::page_size(request.page_size, 100, 200)?;
        let cursor = if request.page_token.is_empty() {
            "0".to_owned()
        } else {
            ChangeToken::cursor(
                request.page_token,
                TokenUse::ListPage,
                &user,
                pagination::invalid_page_token,
            )?
        };
        let changes = d::get_changes(&self.db, &user, &cursor, u64::from(limit))
            .await
            .map_err(|error| change_error(error, pagination::invalid_page_token()))?;
        let activities = changes
            .records
            .into_iter()
            .filter(|record| record.deleted_at.is_none())
            .map(|record| conversion::activity(&user, record))
            .collect::<Result<_, _>>()?;
        Response::ok(p::ListActivitiesResponse {
            activities,
            next_page_token: if changes.has_more {
                ChangeToken::encode(TokenUse::ListPage, &user, changes.next_cursor)
            } else {
                String::new()
            },
            ..Default::default()
        })
    }

    async fn batch_write_activities<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::BatchWriteActivitiesRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::BatchWriteActivitiesResponse> + Send + use<'a>>
    {
        let request = request.to_owned_message();
        let user = self.activity_owner(&ctx, &request.parent).await?;
        if !(1..=50).contains(&request.writes.len()) {
            return Err(error::invalid_input("writes", "Send 1 to 50 writes."));
        }
        let converted = request
            .writes
            .into_iter()
            .enumerate()
            .map(|(index, write)| conversion::write(index, &user, write))
            .collect::<Result<Vec<_>, _>>()?;
        let etag_sent = converted
            .iter()
            .map(|write| (mutation_id(write), write.has_etag))
            .collect::<HashMap<_, _>>();
        let operations = converted.into_iter().map(|write| write.operation).collect();
        let batch = d::apply_batch(&self.db, &user, operations)
            .await
            .map_err(map_error)?;
        let write_results = batch
            .results
            .into_iter()
            .map(|result| {
                let has_etag = etag_sent.get(&result.mutation_id).copied().unwrap_or(false);
                write_result(&user, result, has_etag)
            })
            .collect();
        Response::ok(p::BatchWriteActivitiesResponse {
            write_results,
            ..Default::default()
        })
    }

    async fn sync_activities<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::SyncActivitiesRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::SyncActivitiesResponse> + Send + use<'a>> {
        let user = self.activity_owner(&ctx, request.parent).await?;
        let limit = pagination::page_size(request.page_size, 100, 200)?;
        let (cursor, invalid): (String, fn() -> ConnectError) = if !request.page_token.is_empty() {
            let cursor = ChangeToken::cursor(
                request.page_token,
                TokenUse::SyncPage,
                &user,
                pagination::invalid_page_token,
            )?;
            (cursor, pagination::invalid_page_token)
        } else if !request.sync_token.is_empty() {
            let cursor = ChangeToken::cursor(
                request.sync_token,
                TokenUse::Sync,
                &user,
                invalid_sync_token,
            )?;
            (cursor, invalid_sync_token)
        } else {
            ("0".to_owned(), invalid_sync_token)
        };
        let changes = d::get_changes(&self.db, &user, &cursor, u64::from(limit))
            .await
            .map_err(|error| change_error(error, invalid()))?;
        let activities = changes
            .records
            .into_iter()
            .map(|record| conversion::activity(&user, record))
            .collect::<Result<_, _>>()?;
        let (next_page_token, next_sync_token) = if changes.has_more {
            let token = ChangeToken::encode(TokenUse::SyncPage, &user, changes.next_cursor);
            (token, String::new())
        } else {
            let token = ChangeToken::encode(TokenUse::Sync, &user, changes.next_cursor);
            (String::new(), token)
        };
        Response::ok(p::SyncActivitiesResponse {
            activities,
            next_page_token,
            next_sync_token,
            ..Default::default()
        })
    }

    async fn summarize_activities<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::SummarizeActivitiesRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::SummarizeActivitiesResponse> + Send + use<'a>>
    {
        let request = request.to_owned_message();
        let user = self.activity_owner(&ctx, &request.parent).await?;
        let start = conversion::request_date("start_date", &request.start_date)?;
        let end = conversion::request_date("end_date", &request.end_date)?;
        let span = end.signed_duration_since(start).num_days();
        if !(0..i64::from(MAX_SUMMARY_DATES)).contains(&span) {
            return Err(error::invalid_input(
                "end_date",
                "The range must start on or before `end_date` and contain at most 93 dates.",
            ));
        }
        let size = pagination::page_size(request.page_size, MAX_SUMMARY_DATES, MAX_SUMMARY_DATES)?;
        let first = if request.page_token.is_empty() {
            start
        } else {
            let page: SummaryPage = pagination::decode(&request.page_token)?;
            if page.start != start || page.end != end || page.next < start || page.next > end {
                return Err(pagination::invalid_page_token());
            }
            page.next
        };
        let last = end.min(first + Duration::days(i64::from(size) - 1));
        let days = d::get_days(&self.db, &user, &first.to_string(), &last.to_string())
            .await
            .map_err(map_error)?;
        let daily_summaries = days
            .days
            .into_iter()
            .map(conversion::daily_summary)
            .collect::<Result<_, _>>()?;
        let next_page_token = if last < end {
            pagination::encode(&SummaryPage {
                start,
                end,
                next: last + Duration::days(1),
            })
        } else {
            String::new()
        };
        Response::ok(p::SummarizeActivitiesResponse {
            daily_summaries,
            next_page_token,
            ..Default::default()
        })
    }
}

/// Resolve which `SyncState` fields an update changes.
///
/// Without `update_mask`, the populated fields of `sync_state` are updated.
fn update_paths(
    request: &p::UpdateSyncStateRequest,
    state: &p::SyncState,
) -> Result<(bool, bool), ConnectError> {
    let Some(mask) = request.update_mask.as_option() else {
        return Ok((state.enabled, !state.consent_version.is_empty()));
    };
    let mut enabled = false;
    let mut consent = false;
    for path in &mask.paths {
        match path.as_str() {
            "*" => {
                enabled = true;
                consent = true;
            }
            "enabled" => enabled = true,
            "consent_version" => consent = true,
            _ => {
                return Err(error::invalid_input(
                    "update_mask",
                    "The paths must be `enabled`, `consent_version` or `*`.",
                ));
            }
        }
    }
    Ok((enabled, consent))
}

fn mutation_id(write: &ConvertedWrite) -> uuid::Uuid {
    match &write.operation {
        d::Operation::Upsert { mutation_id, .. } | d::Operation::Delete { mutation_id, .. } => {
            *mutation_id
        }
    }
}

fn write_result(user: &str, result: d::MutationResult, has_etag: bool) -> p::ActivityWriteResult {
    let etag = match result.status {
        d::MutationStatus::Applied => result.revision,
        d::MutationStatus::Conflict => result.current_revision,
    }
    .map(conversion::etag)
    .unwrap_or_default();
    let status = match result.code {
        // The default `google.rpc.Status` has the code `OK`.
        None => Status::default(),
        Some(code) => conflict_status(code, has_etag),
    };
    p::ActivityWriteResult {
        activity: names::activity(user, &result.id.to_string()),
        status: status.into(),
        etag,
        ..Default::default()
    }
}

fn conflict_status(code: d::MutationConflictCode, has_etag: bool) -> Status {
    let (code, reason, message) = match code {
        d::MutationConflictCode::RevisionConflict if has_etag => (
            ErrorCode::Aborted,
            ErrorReason::ACTIVITY_ETAG_MISMATCH,
            "The etag does not match the current version. Read the activity and retry.",
        ),
        d::MutationConflictCode::RevisionConflict => (
            ErrorCode::AlreadyExists,
            ErrorReason::ACTIVITY_ALREADY_EXISTS,
            "The activity already exists. Send its etag to replace it.",
        ),
        d::MutationConflictCode::RecordNotFound => (
            ErrorCode::NotFound,
            ErrorReason::ACTIVITY_NOT_FOUND,
            "The activity does not exist.",
        ),
        d::MutationConflictCode::RecordDeleted => (
            ErrorCode::FailedPrecondition,
            ErrorReason::ACTIVITY_DELETED,
            "The activity was deleted. A deletion is permanent.",
        ),
        d::MutationConflictCode::KindConflict => (
            ErrorCode::FailedPrecondition,
            ErrorReason::ACTIVITY_KIND_MISMATCH,
            "The kind of an activity cannot change.",
        ),
        d::MutationConflictCode::DayConflict => (
            ErrorCode::FailedPrecondition,
            ErrorReason::SLEEP_DATE_CONFLICT,
            "Another live sleep activity exists on this local date.",
        ),
        d::MutationConflictCode::MutationReused => (
            ErrorCode::InvalidArgument,
            ErrorReason::REQUEST_ID_REUSED,
            "The request ID was used for a write with different content.",
        ),
    };
    error::status(code, reason, message)
}

fn invalid_sync_token() -> ConnectError {
    error::invalid_argument(
        ErrorReason::INVALID_SYNC_TOKEN,
        "sync_token",
        "The token is not a `next_sync_token` of this user. Run a full synchronization.",
    )
}

/// Map a `get_changes` error. `invalid` is the error for an invalid token.
fn change_error(error: ActivityError, invalid: ConnectError) -> ConnectError {
    match error {
        ActivityError::InvalidCursor => invalid,
        other => map_error(other),
    }
}

fn map_error(error: ActivityError) -> ConnectError {
    match error {
        ActivityError::SyncDisabled => error::failed_precondition(
            ErrorReason::SYNC_DISABLED,
            "Activity synchronization is disabled. Enable it with `UpdateSyncState`.",
        ),
        ActivityError::ConsentRequired => error::failed_precondition(
            ErrorReason::CONSENT_REQUIRED,
            "Enabling synchronization requires the current consent version.",
        ),
        ActivityError::InvalidCursor => pagination::invalid_page_token(),
        ActivityError::Input(error) => {
            error::invalid_input("request", &conversion::sentence(&error))
        }
        _ => error::internal("activity_storage_failed"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn change_tokens_bind_purpose_and_user() {
        let token = ChangeToken::encode(TokenUse::Sync, "u1", "42".to_owned());
        assert!(
            !token.contains("42\""),
            "tokens must not expose the raw cursor"
        );
        assert_eq!(
            ChangeToken::cursor(&token, TokenUse::Sync, "u1", invalid_sync_token).ok(),
            Some("42".to_owned())
        );
        for (purpose, user) in [
            (TokenUse::SyncPage, "u1"),
            (TokenUse::ListPage, "u1"),
            (TokenUse::Sync, "u2"),
        ] {
            let error = ChangeToken::cursor(&token, purpose, user, pagination::invalid_page_token)
                .err()
                .map(|error| error.code);
            assert_eq!(
                error,
                Some(ErrorCode::InvalidArgument),
                "{purpose:?} {user}"
            );
        }
        assert!(ChangeToken::cursor("42", TokenUse::Sync, "u1", invalid_sync_token).is_err());
    }
}
