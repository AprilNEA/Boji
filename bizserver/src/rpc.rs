//! ConnectRPC transport over the versioned business protocol.

mod activity;
mod conversion;
mod membership;

use crate::{
    auth::{self, Auth, AuthFailure, Principal},
    proto::boji::v1 as p,
};
use connectrpc::{ConnectError, RequestContext, Response, ServiceRequest, ServiceResult};
use sea_orm::DatabaseConnection;
use std::sync::Arc;

/// Shared service state; account identity always comes from Better Auth.
pub struct BusinessService {
    db: DatabaseConnection,
    auth: Arc<Auth>,
}

impl BusinessService {
    /// Construct a transport over the existing SeaORM pool and authentication service.
    pub fn new(db: DatabaseConnection, auth: Arc<Auth>) -> Self {
        Self { db, auth }
    }
    async fn principal(&self, context: &RequestContext) -> Result<Principal, ConnectError> {
        auth::authenticate(&self.auth, context.headers())
            .await
            .map_err(|error| match error {
                AuthFailure::EmailUnverified => {
                    ConnectError::permission_denied("EMAIL_NOT_VERIFIED")
                }
                AuthFailure::Storage(_) => {
                    ConnectError::unavailable("Authentication storage is unavailable")
                }
                _ => ConnectError::unauthenticated("A valid signed Bearer session is required"),
            })
    }
}

/// Public service capabilities. Unmigrated integrations remain disabled.
pub struct SystemService;
impl p::SystemService for SystemService {
    async fn get_capabilities<'a>(
        &'a self,
        _: RequestContext,
        _: ServiceRequest<'_, p::GetCapabilitiesRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::GetCapabilitiesResponse> + Send + use<'a>>
    {
        Response::ok(p::GetCapabilitiesResponse {
            apple_sign_in: false,
            wallet_pass: false,
            activity_sync: true,
            api_version: "boji.v1".into(),
            ..Default::default()
        })
    }
}

/// Register generated service traits with the official ConnectRPC runtime.
pub fn router(db: DatabaseConnection, auth: Arc<Auth>) -> connectrpc::Router {
    let service = Arc::new(BusinessService::new(db, auth));
    // One implementation owns two service traits; registration is explicit.
    use p::{ActivityServiceExt, MembershipServiceExt};
    let router = connectrpc::Router::new().add_service(Arc::new(SystemService));
    let router = MembershipServiceExt::register(service.clone(), router);
    ActivityServiceExt::register(service, router)
}
