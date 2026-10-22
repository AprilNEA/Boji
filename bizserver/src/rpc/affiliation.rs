//! `boji.v1.AffiliationService` over the affiliation domain.
//!
//! Input: owner requests with a signed Bearer session.
//! Output: the affiliations of the caller, one for each organization type, and
//! short-lived affiliation email verifications.
//! Pos: transport. The only place that sends an affiliation mail. The
//! adapter never logs or returns the full address.

use super::{
    AffiliationVerification, BusinessService,
    conversion::{optional_timestamp, timestamp},
    error::{self, resource_type},
    names,
    organization::{map_error, type_value},
};
use crate::{
    domain::organization::{
        self, Affiliation, AffiliationEmail, AffiliationState, ConfirmRequest, OrganizationError,
        OrganizationType, Verification,
    },
    mail::messages,
    proto::boji::v1 as p,
};
use buffa::EnumValue;
use chrono::Utc;
use connectrpc::{ConnectError, RequestContext, Response, ServiceRequest, ServiceResult};
use p::ErrorReason;
use uuid::Uuid;

const AFFILIATION_FORM: &str = "users/{user}/affiliations/{affiliation}";
const USER_FORM: &str = "users/{user}";
const VERIFICATION_FORM: &str =
    "users/{user}/affiliations/{affiliation}/emailVerifications/{email_verification}";

impl p::AffiliationService for BusinessService {
    async fn get_affiliation<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::GetAffiliationRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::Affiliation> + Send + use<'a>> {
        let principal = self.principal(&ctx).await?;
        let kind = affiliation_type("name", request.name, &principal.user_id)?;
        let now = Utc::now();
        let affiliation = organization::get_affiliation(&self.db, &principal.user_id, kind, now)
            .await
            .map_err(|error| map_error(error, now))?;
        Response::ok(affiliation_resource(affiliation))
    }

    async fn list_affiliations<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::ListAffiliationsRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::ListAffiliationsResponse> + Send + use<'a>>
    {
        let principal = self.principal(&ctx).await?;
        let request = request.to_owned_message();
        let [user] = names::parse("parent", &request.parent, ["users"], None, USER_FORM)?;
        names::require_caller(user, &principal.user_id)?;
        // The response has one affiliation for each type and never a next
        // page, so the page size has no effect.
        if request.page_size < 0 {
            return Err(error::invalid_input(
                "page_size",
                "The value must not be negative.",
            ));
        }
        if !request.page_token.is_empty() {
            return Err(error::invalid_input(
                "page_token",
                "The value must be empty, because the response has one page.",
            ));
        }
        let now = Utc::now();
        let affiliations = organization::list_user_affiliations(&self.db, &principal.user_id, now)
            .await
            .map_err(|error| map_error(error, now))?;
        Response::ok(p::ListAffiliationsResponse {
            affiliations: affiliations.into_iter().map(affiliation_resource).collect(),
            ..Default::default()
        })
    }

    async fn create_affiliation_email_verification<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::CreateAffiliationEmailVerificationRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::AffiliationEmailVerification> + Send + use<'a>>
    {
        let principal = self.principal(&ctx).await?;
        let request = request.to_owned_message();
        let kind = affiliation_type("parent", &request.parent, &principal.user_id)?;
        let verification = self.affiliation_verification()?;
        let input = request
            .affiliation_email_verification
            .as_option()
            .ok_or_else(|| {
                error::invalid_input("affiliation_email_verification", "The field is required.")
            })?;
        let now = Utc::now();
        let email = AffiliationEmail::parse(&input.email).map_err(|error| map_error(error, now))?;
        let issued = organization::issue_verification(
            &self.db,
            &verification.key,
            &principal.user_id,
            kind,
            &email,
            now,
        )
        .await
        .map_err(|error| map_error(error, now))?;
        // Each type has its own mail text, so a new type needs a new template.
        let sent = match kind {
            OrganizationType::School => {
                messages::send_school_verification(
                    &verification.mailer,
                    &issued.recipient,
                    issued.code.as_str(),
                )
                .await
            }
        };
        if sent.is_err() {
            tracing::error!(event = "affiliation_verification_mail_failed");
            // A failed mail must not count against the sending limits.
            if organization::discard_verification(&self.db, issued.verification.id)
                .await
                .is_err()
            {
                tracing::error!(event = "affiliation_verification_discard_failed");
            }
            return Err(error::backend_unavailable());
        }
        Response::ok(verification_resource(issued.verification))
    }

    async fn get_affiliation_email_verification<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::GetAffiliationEmailVerificationRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::AffiliationEmailVerification> + Send + use<'a>>
    {
        let principal = self.principal(&ctx).await?;
        let (kind, id) = verification_id(request.name, &principal.user_id)?;
        let now = Utc::now();
        let found = organization::get_verification(&self.db, &principal.user_id, kind, id, now)
            .await
            .map_err(|error| map_error(error, now))?
            .ok_or_else(|| verification_not_found(&principal.user_id, kind, &id))?;
        Response::ok(verification_resource(found))
    }

    async fn confirm_affiliation_email_verification<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::ConfirmAffiliationEmailVerificationRequest>,
    ) -> ServiceResult<
        impl connectrpc::Encodable<p::ConfirmAffiliationEmailVerificationResponse> + Send + use<'a>,
    > {
        let principal = self.principal(&ctx).await?;
        let request = request.to_owned_message();
        let (kind, id) = verification_id(&request.name, &principal.user_id)?;
        let verification = self.affiliation_verification()?;
        if request.code.trim().is_empty() {
            return Err(error::invalid_input("code", "The field is required."));
        }
        let chosen = if request.organization.is_empty() {
            None
        } else {
            let [organization] = names::parse(
                "organization",
                &request.organization,
                ["organizations"],
                None,
                "organizations/{organization}",
            )?;
            Some(names::uuid("organization", organization)?)
        };
        let now = Utc::now();
        let affiliation = organization::confirm_verification(
            &self.db,
            &verification.key,
            ConfirmRequest {
                user_id: &principal.user_id,
                kind,
                id,
                code: &request.code,
                organization: chosen,
            },
            now,
        )
        .await
        .map_err(|error| match error {
            OrganizationError::VerificationNotFound => {
                verification_not_found(&principal.user_id, kind, &id)
            }
            error => map_error(error, now),
        })?;
        Response::ok(p::ConfirmAffiliationEmailVerificationResponse {
            affiliation: affiliation_resource(affiliation).into(),
            ..Default::default()
        })
    }

    async fn leave_organization<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::LeaveOrganizationRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::Affiliation> + Send + use<'a>> {
        let principal = self.principal(&ctx).await?;
        let kind = affiliation_type("name", request.name, &principal.user_id)?;
        let now = Utc::now();
        let affiliation = organization::leave_organization(&self.db, &principal.user_id, kind, now)
            .await
            .map_err(|error| map_error(error, now))?;
        Response::ok(affiliation_resource(affiliation))
    }
}

impl BusinessService {
    /// Return the verification settings, or `AFFILIATION_VERIFICATION_NOT_CONFIGURED`.
    fn affiliation_verification(&self) -> Result<&AffiliationVerification, ConnectError> {
        self.affiliation_verification.as_ref().ok_or_else(|| {
            error::failed_precondition(
                ErrorReason::AFFILIATION_VERIFICATION_NOT_CONFIGURED,
                "The server cannot verify affiliation email addresses.",
            )
        })
    }
}

/// Parse the name of an affiliation of the caller and return its type.
fn affiliation_type(
    field: &str,
    name: &str,
    caller: &str,
) -> Result<OrganizationType, ConnectError> {
    let [user, kind] = names::parse(
        field,
        name,
        ["users", "affiliations"],
        None,
        AFFILIATION_FORM,
    )?;
    names::require_caller(user, caller)?;
    names::organization_type(field, kind)
}

/// Parse the name of a verification of the caller and return its type and ID.
fn verification_id(name: &str, caller: &str) -> Result<(OrganizationType, Uuid), ConnectError> {
    let [user, kind, id] = names::parse(
        "name",
        name,
        ["users", "affiliations", "emailVerifications"],
        None,
        VERIFICATION_FORM,
    )?;
    names::require_caller(user, caller)?;
    Ok((
        names::organization_type("name", kind)?,
        names::uuid("name", id)?,
    ))
}

fn verification_not_found(user: &str, kind: OrganizationType, id: &Uuid) -> ConnectError {
    error::not_found(
        ErrorReason::AFFILIATION_EMAIL_VERIFICATION_NOT_FOUND,
        resource_type::AFFILIATION_EMAIL_VERIFICATION,
        &names::affiliation_email_verification(user, kind, id),
    )
}

fn affiliation_state(value: AffiliationState) -> EnumValue<p::affiliation::State> {
    match value {
        AffiliationState::Unaffiliated => p::affiliation::State::UNAFFILIATED,
        AffiliationState::Active => p::affiliation::State::ACTIVE,
        AffiliationState::Expired => p::affiliation::State::EXPIRED,
    }
    .into()
}

pub(super) fn affiliation_resource(value: Affiliation) -> p::Affiliation {
    p::Affiliation {
        name: names::affiliation(&value.user_id, value.organization_type),
        organization_type: type_value(value.organization_type),
        state: affiliation_state(value.state),
        organization: value
            .organization_id
            .map(|id| names::organization(&id))
            .unwrap_or_default(),
        email_domain: value.email_domain.unwrap_or_default(),
        counted: value.counted,
        verify_time: optional_timestamp(value.verified_at),
        count_start_time: optional_timestamp(value.counted_since),
        expire_time: optional_timestamp(value.expires_at),
        organization_change_available_time: optional_timestamp(
            value.organization_change_available_at,
        ),
        ..Default::default()
    }
}

/// Convert a verification. `email` stays empty, because it is input only.
fn verification_resource(value: Verification) -> p::AffiliationEmailVerification {
    p::AffiliationEmailVerification {
        name: names::affiliation_email_verification(
            &value.user_id,
            value.organization_type,
            &value.id,
        ),
        masked_email: value.masked_email,
        candidate_organizations: value
            .candidate_organizations
            .iter()
            .map(names::organization)
            .collect(),
        create_time: timestamp(value.created_at),
        expire_time: timestamp(value.expires_at),
        resend_time: timestamp(value.resend_at),
        ..Default::default()
    }
}
