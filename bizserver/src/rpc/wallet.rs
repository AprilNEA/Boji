//! `boji.v1.WalletService` over the membership domain and [`crate::wallet`].
//!
//! Input: a pass name and the session of the caller.
//! Output: the signed `.pkpass` archive of the caller's card.
//! Pos: transport only. Signing lives in `crate::wallet`.

use super::{
    BusinessService,
    error::{self, resource_type},
    membership::map_error,
    names,
};
use crate::{
    domain::membership::{self, MembershipStatus},
    proto::boji::v1 as p,
    wallet::{MembershipCard, PKPASS_MIME_TYPE},
};
use connectrpc::{
    ConnectError, ErrorCode, RequestContext, Response, ServiceRequest, ServiceResult,
};
use p::ErrorReason;

const PASS_FORM: &str = "users/{user}/memberships/{membership}/pass";

impl p::WalletService for BusinessService {
    async fn get_membership_pass<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::GetMembershipPassRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::MembershipPass> + Send + use<'a>> {
        let principal = self.principal(&ctx).await?;
        let [user, id] = names::parse(
            "name",
            request.name,
            ["users", "memberships"],
            Some("pass"),
            PASS_FORM,
        )?;
        names::require_caller(user, &principal.user_id)?;
        let card = membership::get(&self.db, &principal.user_id)
            .await
            .map_err(map_error)?;
        let Some(card) = card.filter(|card| card.id == id) else {
            return Err(error::not_found(
                ErrorReason::MEMBERSHIP_NOT_FOUND,
                resource_type::MEMBERSHIP,
                &names::membership(&principal.user_id, id),
            ));
        };
        if card.status != MembershipStatus::Active {
            return Err(error::failed_precondition(
                ErrorReason::MEMBERSHIP_SUSPENDED,
                "The membership card is not active.",
            ));
        }
        let signer = self
            .wallet
            .as_deref()
            .filter(|signer| signer.is_current(chrono::Utc::now()))
            .ok_or_else(not_configured)?;
        let content = signer
            .sign(&MembershipCard {
                membership_id: &card.id,
                display_name: &card.display_name,
                member_number: &card.member_number,
                joined_at: card.joined_at,
            })
            .map_err(|failure| {
                tracing::error!(event = "wallet_signing_failed", error = %failure);
                error::error(
                    ErrorCode::Unavailable,
                    ErrorReason::WALLET_SIGNING_FAILED,
                    "The pass could not be signed. Retry the request later.",
                )
            })?;
        Response::ok(p::MembershipPass {
            name: names::membership_pass(&principal.user_id, &card.id),
            content,
            mime_type: PKPASS_MIME_TYPE.to_owned(),
            ..Default::default()
        })
    }
}

fn not_configured() -> ConnectError {
    error::failed_precondition(
        ErrorReason::WALLET_NOT_CONFIGURED,
        "The server cannot sign Apple Wallet passes.",
    )
}
