use super::BusinessService;
use crate::{
    domain::activity::{self, ActivityError},
    proto::boji::v1 as p,
};
use connectrpc::{ConnectError, RequestContext, Response, ServiceRequest, ServiceResult};

impl p::ActivityService for BusinessService {
    async fn get_sync_state<'a>(
        &'a self,
        ctx: RequestContext,
        _: ServiceRequest<'_, p::GetSyncStateRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::SyncState> + Send + use<'a>> {
        let principal = self.principal(&ctx).await?;
        Response::ok(p::SyncState::from(
            activity::get_sync(&self.db, &principal.user_id)
                .await
                .map_err(map_error)?,
        ))
    }
    async fn set_sync_state<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::SetSyncStateRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::SyncState> + Send + use<'a>> {
        let principal = self.principal(&ctx).await?;
        let request = request.to_owned_message();
        Response::ok(p::SyncState::from(
            activity::set_sync(
                &self.db,
                &principal.user_id,
                request.enabled,
                request.consent_version.as_deref(),
            )
            .await
            .map_err(map_error)?,
        ))
    }
    async fn apply_batch<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::ApplyBatchRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::ApplyBatchResponse> + Send + use<'a>> {
        let principal = self.principal(&ctx).await?;
        let operations = request
            .to_owned_message()
            .operations
            .into_iter()
            .map(activity::Operation::try_from)
            .collect::<Result<Vec<_>, _>>()?;
        let result = activity::apply_batch(&self.db, &principal.user_id, operations)
            .await
            .map_err(map_error)?;
        let results = result
            .results
            .into_iter()
            .map(TryInto::try_into)
            .collect::<Result<Vec<_>, _>>()?;
        Response::ok(p::ApplyBatchResponse {
            results,
            server_cursor: result.server_cursor,
            ..Default::default()
        })
    }
    async fn list_changes<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::ListChangesRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::ListChangesResponse> + Send + use<'a>> {
        let principal = self.principal(&ctx).await?;
        let cursor = if request.cursor.is_empty() {
            "0"
        } else {
            request.cursor
        };
        let limit = if request.limit == 0 {
            100
        } else {
            u64::from(request.limit)
        };
        let result = activity::get_changes(&self.db, &principal.user_id, cursor, limit)
            .await
            .map_err(map_error)?;
        Response::ok(p::ListChangesResponse {
            records: result
                .records
                .into_iter()
                .map(TryInto::try_into)
                .collect::<Result<_, _>>()?,
            next_cursor: result.next_cursor,
            has_more: result.has_more,
            ..Default::default()
        })
    }
    async fn get_days<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::GetDaysRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::GetDaysResponse> + Send + use<'a>> {
        let principal = self.principal(&ctx).await?;
        let result = activity::get_days(&self.db, &principal.user_id, request.from, request.to)
            .await
            .map_err(map_error)?;
        Response::ok(p::GetDaysResponse {
            days: result
                .days
                .into_iter()
                .map(TryInto::try_into)
                .collect::<Result<_, _>>()?,
            ..Default::default()
        })
    }
}
fn map_error(error: ActivityError) -> ConnectError {
    match error {
        ActivityError::SyncDisabled => ConnectError::permission_denied("SYNC_DISABLED"),
        ActivityError::ConsentRequired => ConnectError::failed_precondition("CONSENT_REQUIRED"),
        ActivityError::InvalidCursor => ConnectError::invalid_argument("INVALID_CURSOR"),
        ActivityError::Input(_) => ConnectError::invalid_argument("INVALID_INPUT"),
        _ => {
            tracing::error!(event = "activity_storage_failed");
            ConnectError::internal("Activity request failed")
        }
    }
}
