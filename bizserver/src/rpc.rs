//! ConnectRPC transport over the versioned business protocol.
//!
//! Input: Connect requests for `boji.v1` and `boji.admin.v1`.
//! Output: generated service implementations over the domain modules.
//! Pos: the only transport adapter. Domain modules know nothing about protobuf.

mod activity;
mod admin;
mod affiliation;
mod conversion;
pub(crate) mod error;
mod filter;
mod membership;
mod membership_code;
mod names;
mod organization;
mod organization_admin;
mod pagination;
mod wallet;

use crate::{
    auth::{self, Auth, AuthFailure, Principal},
    domain::{
        membership_code::MembershipCodes,
        organization::{AffiliationEmailKey, RankingCache},
    },
    mail::Mailer,
    proto::{
        boji::{admin::v1 as a, v1 as p},
        google,
    },
    wallet::{
        PassSigner,
        push::{PassUpdates, PushSender},
    },
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
    affiliation_verification: Option<AffiliationVerification>,
    ranking: RankingCache,
    pass_updates: PassUpdates,
    membership_codes: Option<Arc<MembershipCodes>>,
}

impl BusinessService {
    /// Construct a transport over the existing SeaORM pool and authentication service.
    ///
    /// `capabilities.wallet` signs Apple Wallet passes. `None` disables
    /// `WalletService`. `capabilities.wallet_push` tells devices that a pass
    /// changed. `capabilities.affiliation_verification` sends organization
    /// verification codes. `None` disables the methods of
    /// `AffiliationService` that send or check codes.
    /// `capabilities.membership_codes` issues and checks membership codes.
    /// `None` disables `MembershipCodeService` and the QR code of passes.
    pub fn new(db: DatabaseConnection, auth: Arc<Auth>, capabilities: &Capabilities) -> Self {
        let pass_updates = PassUpdates::new(db.clone(), capabilities.wallet_push.clone());
        Self {
            db,
            auth,
            wallet: capabilities.wallet.clone(),
            affiliation_verification: capabilities.affiliation_verification.clone(),
            ranking: RankingCache::default(),
            pass_updates,
            membership_codes: capabilities.membership_codes.clone(),
        }
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
    /// Whether `POST /api/auth/sign-in/social` accepts the `google` provider.
    pub google_sign_in: bool,
    /// Apple Wallet pass signing. `None` when the `WALLET_*` variables are unset.
    pub wallet: Option<Arc<PassSigner>>,
    /// Pass update notifications. `None` records pass changes but sends no
    /// notification. `main.rs` sets it whenever `wallet` is set.
    pub wallet_push: Option<Arc<dyn PushSender>>,
    /// Organization email verification. `None` when `AFFILIATION_EMAIL_HMAC_KEY` is unset.
    pub affiliation_verification: Option<AffiliationVerification>,
    /// Membership codes. `None` when `MEMBERSHIP_CODE_KEY` is unset.
    pub membership_codes: Option<Arc<MembershipCodes>>,
}

/// The key and the mail transport of organization email verification.
#[derive(Clone, Debug)]
pub struct AffiliationVerification {
    /// The key of the address and code digests.
    pub key: Arc<AffiliationEmailKey>,
    /// The transport that delivers verification codes.
    pub mailer: Mailer,
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
            google_login_enabled: self.capabilities.google_sign_in,
            wallet_pass_enabled: self
                .capabilities
                .wallet
                .as_ref()
                .is_some_and(|signer| signer.is_current(chrono::Utc::now())),
            activity_sync_enabled: true,
            organization_ranking_enabled: self.capabilities.affiliation_verification.is_some(),
            membership_code_enabled: self.capabilities.membership_codes.is_some(),
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
/// returns `WALLET_NOT_CONFIGURED`. `MembershipCodeService` is always
/// registered. Without a key it returns `MEMBERSHIP_CODE_NOT_CONFIGURED`. `AffiliationService` is always
/// registered too. Without a key it returns
/// `AFFILIATION_VERIFICATION_NOT_CONFIGURED` from the methods that send or check
/// codes.
pub fn router(
    db: DatabaseConnection,
    auth: Arc<Auth>,
    capabilities: Capabilities,
) -> connectrpc::Router {
    install_type_registry();
    let service = Arc::new(BusinessService::new(db, auth, &capabilities));
    let router = connectrpc::Router::new().add_service(Arc::new(SystemService { capabilities }));
    let router = p::MembershipServiceExt::register(service.clone(), router);
    let router = p::ActivityServiceExt::register(service.clone(), router);
    let router = p::WalletServiceExt::register(service.clone(), router);
    let router = p::MembershipCodeServiceExt::register(service.clone(), router);
    let router = p::OrganizationServiceExt::register(service.clone(), router);
    let router = p::AffiliationServiceExt::register(service.clone(), router);
    let router = a::EntitlementServiceExt::register(service.clone(), router);
    let router = a::MembershipServiceExt::register(service.clone(), router);
    let router = a::MembershipCodeServiceExt::register(service.clone(), router);
    a::OrganizationServiceExt::register(service, router)
}
