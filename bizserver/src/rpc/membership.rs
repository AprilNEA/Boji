use super::BusinessService;
use crate::{
    domain::membership::{self, MembershipError},
    proto::boji::v1 as p,
};
use connectrpc::{ConnectError, RequestContext, Response, ServiceRequest, ServiceResult};

impl p::MembershipService for BusinessService {
    async fn get_membership<'a>(
        &'a self,
        ctx: RequestContext,
        _: ServiceRequest<'_, p::GetMembershipRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::GetMembershipResponse> + Send + use<'a>> {
        let principal = self.principal(&ctx).await?;
        let result = membership::get(&self.db, &principal.user_id)
            .await
            .map_err(map_error)?;
        Response::ok(p::GetMembershipResponse {
            membership: result
                .map(p::Membership::from)
                .map(Into::into)
                .unwrap_or_default(),
            ..Default::default()
        })
    }
    async fn enroll_membership<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::EnrollMembershipRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::GetMembershipResponse> + Send + use<'a>> {
        let principal = self.principal(&ctx).await?;
        let result = membership::enroll(
            &self.db,
            &principal.user_id,
            request.display_name,
            request.terms_version,
        )
        .await
        .map_err(map_error)?;
        Response::ok(p::GetMembershipResponse {
            membership: p::Membership::from(result).into(),
            ..Default::default()
        })
    }
}

fn map_error(error: MembershipError) -> ConnectError {
    match error {
        MembershipError::InvalidInput { .. } => ConnectError::invalid_argument("INVALID_INPUT"),
        MembershipError::TermsNotAccepted => {
            ConnectError::failed_precondition("TERMS_NOT_ACCEPTED")
        }
        MembershipError::MissingDefaults { .. } | MembershipError::Database(_) => {
            tracing::error!(event = "membership_storage_failed");
            ConnectError::internal("Membership request failed")
        }
    }
}

impl From<membership::Membership> for p::Membership {
    fn from(value: membership::Membership) -> Self {
        Self {
            id: value.id,
            user_id: value.user_id,
            member_number: value.member_number,
            display_name: value.display_name,
            joined_at: value.joined_at.to_rfc3339(),
            tier: "community".into(),
            status: match value.status {
                membership::MembershipStatus::Active => "active",
                membership::MembershipStatus::Suspended => "suspended",
            }
            .into(),
            entitlements: value.entitlements.into_iter().map(Into::into).collect(),
            expires_at: value.expires_at.map(|date| date.to_rfc3339()),
            ..Default::default()
        }
    }
}
impl From<membership::Entitlement> for p::Entitlement {
    fn from(value: membership::Entitlement) -> Self {
        Self {
            id: value.id,
            code: value.code,
            name: value.name,
            description: value.description,
            granted_at: value.granted_at.to_rfc3339(),
            expires_at: value.expires_at.map(|date| date.to_rfc3339()),
            ..Default::default()
        }
    }
}
