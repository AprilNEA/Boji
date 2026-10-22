//! `boji.admin.v1.MembershipCodeService`: staff scan a membership code.
//!
//! The method authorizes the caller before it reads the scanned value, so a
//! caller without permission cannot test codes (AIP-211).

use chrono::Utc;
use connectrpc::{ConnectError, RequestContext, Response, ServiceRequest, ServiceResult};
use uuid::Uuid;

use super::{BusinessService, MEMBERSHIP_READ, membership_resource};
use crate::{
    admin_auth,
    domain::membership_code::{CodeError, CodeKind},
    proto::boji::{admin::v1 as a, v1::ErrorReason},
    rpc::{error, membership_code::not_configured, names},
};

/// The longest value that the server checks. A code has about 90 characters.
const MAX_CODE_LENGTH: usize = 256;

impl a::MembershipCodeService for BusinessService {
    async fn verify_membership_code<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, a::VerifyMembershipCodeRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<a::VerifyMembershipCodeResponse> + Send + use<'a>>
    {
        Response::ok(self.verify_code(&ctx, request.code).await?)
    }
}

impl BusinessService {
    /// Check `code` and return the card that it names.
    async fn verify_code(
        &self,
        ctx: &RequestContext,
        code: &str,
    ) -> Result<a::VerifyMembershipCodeResponse, ConnectError> {
        admin_auth::authorize_within(
            &self.auth,
            ctx.headers(),
            MEMBERSHIP_READ,
            admin_auth::VERIFICATION_SESSION_MINUTES,
        )
        .await?;
        let codes = self
            .membership_codes
            .as_deref()
            .ok_or_else(not_configured)?;
        if code.len() > MAX_CODE_LENGTH {
            return Err(invalid());
        }
        let verified = codes
            .verify(code, Utc::now())
            .map_err(|failure| match failure {
                CodeError::Invalid => invalid(),
                CodeError::Expired => error::failed_precondition(
                    ErrorReason::MEMBERSHIP_CODE_EXPIRED,
                    "The membership code expired. Ask the member to show the current code.",
                ),
                CodeError::Crypto(failure) => {
                    tracing::error!(event = "membership_code_failed", error = %failure);
                    error::internal("membership_code_failed")
                }
            })?;
        let id: Uuid = verified.membership_id;
        let name = names::membership(names::ANY_USER, &id.to_string());
        let detail = self.card(names::ANY_USER, id, &name).await?;
        let kind = match verified.kind {
            CodeKind::Static => a::MembershipCodeKind::MEMBERSHIP_CODE_KIND_STATIC,
            CodeKind::Dynamic => a::MembershipCodeKind::MEMBERSHIP_CODE_KIND_DYNAMIC,
        };
        Ok(a::VerifyMembershipCodeResponse {
            membership: membership_resource(&detail.membership, None)?.into(),
            code_kind: kind.into(),
            ..Default::default()
        })
    }
}

/// Return the `INVALID_ARGUMENT` `MEMBERSHIP_CODE_INVALID` error.
fn invalid() -> ConnectError {
    error::invalid_argument(
        ErrorReason::MEMBERSHIP_CODE_INVALID,
        "code",
        "The value is not a valid membership code.",
    )
}
