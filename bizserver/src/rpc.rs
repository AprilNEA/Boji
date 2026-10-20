//! ConnectRPC transport over the versioned business protocol.
//!
//! Input: Connect requests for `boji.v1` and `boji.admin.v1`.
//! Output: generated service implementations over the domain modules.
//! Pos: the only transport adapter. Domain modules know nothing about protobuf.

mod activity;
mod admin;
mod conversion;
pub(crate) mod error;
mod filter;
mod membership;
mod names;
mod pagination;
mod wallet;

use crate::{
    auth::{self, Auth, AuthFailure, Principal},
    proto::{
        boji::{admin::v1 as a, v1 as p},
        google,
    },
    wallet::PassSigner,
};
use connectrpc::{
    ConnectError, ErrorCode, RequestContext, Response, ServiceRequest, ServiceResult,
};
use p::ErrorReason;
use sea_orm::DatabaseConnection;
use std::sync::{Arc, Once};

/// Shared service state; account identity always comes from Better Auth.
pub struct BusinessService {
    db: DatabaseConnection,
    auth: Arc<Auth>,
    wallet: Option<Arc<PassSigner>>,
}

impl BusinessService {
    /// Construct a transport over the existing SeaORM pool and authentication service.
    ///
    /// `wallet` signs Apple Wallet passes. `None` disables `WalletService`.
    pub fn new(db: DatabaseConnection, auth: Arc<Auth>, wallet: Option<Arc<PassSigner>>) -> Self {
        Self { db, auth, wallet }
    }

    async fn principal(&self, context: &RequestContext) -> Result<Principal, ConnectError> {
        auth::authenticate(&self.auth, context.headers())
            .await
            .map_err(|failure| match failure {
                AuthFailure::EmailUnverified => error::error(
                    ErrorCode::PermissionDenied,
                    ErrorReason::EMAIL_NOT_VERIFIED,
                    "Verify the email address of the account first.",
                ),
                AuthFailure::Storage(_) => error::backend_unavailable(),
                _ => session_required(),
            })
    }
}

/// Return the `UNAUTHENTICATED` `SESSION_REQUIRED` error.
pub(crate) fn session_required() -> ConnectError {
    error::error(
        ErrorCode::Unauthenticated,
        ErrorReason::SESSION_REQUIRED,
        "A valid signed Bearer session is required.",
    )
}

/// Optional integrations that this process configured at startup.
#[derive(Clone, Debug, Default)]
pub struct Capabilities {
    /// Whether `POST /api/auth/sign-in/social` accepts the `apple` provider.
    pub apple_sign_in: bool,
    /// Apple Wallet pass signing. `None` when the `WALLET_*` variables are unset.
    pub wallet: Option<Arc<PassSigner>>,
}

/// The `ServerConfig` singleton.
pub struct SystemService {
    capabilities: Capabilities,
}

/// The resource name of the `ServerConfig` singleton.
const SERVER_CONFIG: &str = "serverConfig";

impl p::SystemService for SystemService {
    async fn get_server_config<'a>(
        &'a self,
        _: RequestContext,
        request: ServiceRequest<'_, p::GetServerConfigRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::ServerConfig> + Send + use<'a>> {
        if request.name != SERVER_CONFIG {
            return Err(error::invalid_input(
                "name",
                "The value must be `serverConfig`.",
            ));
        }
        Response::ok(p::ServerConfig {
            name: SERVER_CONFIG.to_owned(),
            apple_login_enabled: self.capabilities.apple_sign_in,
            wallet_pass_enabled: self
                .capabilities
                .wallet
                .as_ref()
                .is_some_and(|signer| signer.is_current(chrono::Utc::now())),
            activity_sync_enabled: true,
            ..Default::default()
        })
    }
}

/// Install the protobuf type registry once per process.
///
/// Connect JSON renders `google.protobuf.Any` with the fields of the packed
/// message only when the registry knows its type, for example the
/// `google.rpc.ErrorInfo` inside `ActivityWriteResult.status.details`.
fn install_type_registry() {
    static INSTALL: Once = Once::new();
    INSTALL.call_once(|| {
        let mut registry = buffa::type_registry::TypeRegistry::new();
        buffa_types::register_wkt_types(&mut registry);
        aip_193::proto::register_types(&mut registry);
        google::r#type::register_types(&mut registry);
        p::register_types(&mut registry);
        a::register_types(&mut registry);
        buffa::type_registry::set_type_registry(registry);
    });
}

/// Register generated service traits with the official ConnectRPC runtime.
///
/// `WalletService` is always registered. Without valid signing material it
/// returns `WALLET_NOT_CONFIGURED`.
pub fn router(
    db: DatabaseConnection,
    auth: Arc<Auth>,
    capabilities: Capabilities,
) -> connectrpc::Router {
    install_type_registry();
    let service = Arc::new(BusinessService::new(db, auth, capabilities.wallet.clone()));
    let router = connectrpc::Router::new().add_service(Arc::new(SystemService { capabilities }));
    let router = p::MembershipServiceExt::register(service.clone(), router);
    let router = p::ActivityServiceExt::register(service.clone(), router);
    let router = p::WalletServiceExt::register(service.clone(), router);
    let router = a::EntitlementServiceExt::register(service.clone(), router);
    a::MembershipServiceExt::register(service, router)
}
