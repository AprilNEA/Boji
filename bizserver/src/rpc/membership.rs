//! `boji.v1.MembershipService` over the membership domain.

use super::{
    BusinessService,
    conversion::{optional_timestamp, timestamp},
    error::{self, resource_type},
    names, pagination,
};
use crate::{
    domain::membership::{self, MembershipError, MembershipStatus, MembershipTier},
    proto::boji::v1 as p,
};
use buffa::EnumValue;
use connectrpc::{
    ConnectError, ErrorCode, RequestContext, Response, ServiceRequest, ServiceResult,
};
use p::ErrorReason;

const USER_FORM: &str = "users/{user}";
const MEMBERSHIP_FORM: &str = "users/{user}/memberships/{membership}";

impl p::MembershipService for BusinessService {
    async fn get_membership<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::GetMembershipRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::Membership> + Send + use<'a>> {
        let principal = self.principal(&ctx).await?;
        let [user, id] = names::parse(
            "name",
            request.name,
            ["users", "memberships"],
            None,
            MEMBERSHIP_FORM,
        )?;
        names::require_caller(user, &principal.user_id)?;
        let id = id.to_owned();
        let card = membership::get(&self.db, &principal.user_id)
            .await
            .map_err(map_error)?;
        match card {
            Some(card) if card.id == id => Response::ok(membership_resource(card)),
            _ => Err(error::not_found(
                ErrorReason::MEMBERSHIP_NOT_FOUND,
                resource_type::MEMBERSHIP,
                &names::membership(&principal.user_id, &id),
            )),
        }
    }

    async fn list_memberships<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::ListMembershipsRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::ListMembershipsResponse> + Send + use<'a>>
    {
        let principal = self.principal(&ctx).await?;
        let [user] = names::parse("parent", request.parent, ["users"], None, USER_FORM)?;
        names::require_caller(user, &principal.user_id)?;
        pagination::page_size(request.page_size, 50, 100)?;
        // A user holds at most one card, so this method never issues a token.
        if !request.page_token.is_empty() {
            return Err(pagination::invalid_page_token());
        }
        let card = membership::get(&self.db, &principal.user_id)
            .await
            .map_err(map_error)?;
        Response::ok(p::ListMembershipsResponse {
            memberships: card.into_iter().map(membership_resource).collect(),
            ..Default::default()
        })
    }

    async fn create_membership<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::CreateMembershipRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::Membership> + Send + use<'a>> {
        let principal = self.principal(&ctx).await?;
        let request = request.to_owned_message();
        let [user] = names::parse("parent", &request.parent, ["users"], None, USER_FORM)?;
        names::require_caller(user, &principal.user_id)?;
        let card = request
            .membership
            .as_option()
            .ok_or_else(|| error::invalid_input("membership", "The field is required."))?;
        // Validate before the existence check, so an invalid request never
        // depends on stored state.
        membership::Enrollment::parse(&principal.user_id, &card.nickname, &card.terms_version)
            .map_err(map_error)?;
        if membership::get(&self.db, &principal.user_id)
            .await
            .map_err(map_error)?
            .is_some()
        {
            return Err(error::error(
                ErrorCode::AlreadyExists,
                ErrorReason::MEMBERSHIP_ALREADY_EXISTS,
                "The user already has a membership card. Call `ListMemberships` to read it.",
            ));
        }
        let created = membership::enroll(
            &self.db,
            &principal.user_id,
            &card.nickname,
            &card.terms_version,
        )
        .await
        .map_err(map_error)?;
        Response::ok(membership_resource(created))
    }
}

fn map_error(error: MembershipError) -> ConnectError {
    match error {
        MembershipError::InvalidInput {
            field: "displayName",
        } => error::invalid_input(
            "membership.nickname",
            "The nickname must contain 1 to 40 characters after trimming, \
             without control or invisible format characters.",
        ),
        MembershipError::InvalidInput { .. } => error::internal("membership_principal_invalid"),
        MembershipError::TermsNotAccepted => error::failed_precondition(
            ErrorReason::TERMS_NOT_ACCEPTED,
            "Accept the current membership terms version first.",
        ),
        MembershipError::MissingDefaults { .. } | MembershipError::Database(_) => {
            error::internal("membership_storage_failed")
        }
    }
}

/// Convert a domain membership tier.
fn tier(value: MembershipTier) -> EnumValue<p::membership::Tier> {
    match value {
        MembershipTier::Community => p::membership::Tier::COMMUNITY,
    }
    .into()
}

/// Convert a domain membership state.
fn state(value: MembershipStatus) -> EnumValue<p::membership::State> {
    match value {
        MembershipStatus::Active => p::membership::State::ACTIVE,
        MembershipStatus::Suspended => p::membership::State::SUSPENDED,
    }
    .into()
}

/// Convert the card of the caller to the full view of `Membership`.
fn membership_resource(value: membership::Membership) -> p::Membership {
    p::Membership {
        name: names::membership(&value.user_id, &value.id),
        member_number: value.member_number,
        nickname: value.display_name,
        tier: tier(value.tier),
        state: state(value.status),
        entitlements: value
            .entitlements
            .into_iter()
            .map(|entitlement| p::membership::EffectiveEntitlement {
                code: entitlement.code,
                display_name: entitlement.name,
                description: entitlement.description,
                grant_time: timestamp(entitlement.granted_at),
                expire_time: optional_timestamp(entitlement.expires_at),
                ..Default::default()
            })
            .collect(),
        create_time: timestamp(value.joined_at),
        expire_time: optional_timestamp(value.expires_at),
        ..Default::default()
    }
}
