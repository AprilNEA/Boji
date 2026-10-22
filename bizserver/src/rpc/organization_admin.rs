//! `boji.admin.v1.OrganizationService` over the organization operations of the domain.
//!
//! Input: operations requests with a signed Bearer session.
//! Output: affiliations and ranking standings.
//! Pos: transport. Every method authorizes the caller before it parses or
//! reads any target, so a caller without permission learns nothing about the
//! targets (AIP-211). After a change, the ranking cache is dropped, so the
//! response and the next public request show the change.

use super::{
    BusinessService,
    affiliation::affiliation_resource,
    error, filter, names,
    organization::{map_error, organization_not_found, standing_resource},
    pagination,
};
use crate::{
    admin_auth,
    domain::{
        admin::normalized_reason,
        organization::{
            self, AffiliationQuery, ListingPosition, OrganizationError, OrganizationType,
        },
    },
    proto::boji::{admin::v1 as a, v1 as p},
};
use chrono::{DateTime, Utc};
use connectrpc::{ConnectError, RequestContext, Response, ServiceRequest, ServiceResult};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

type Permissions = &'static [(&'static str, &'static [&'static str])];

const ORGANIZATION_READ: Permissions = &[("organization", &["read"])];
const ORGANIZATION_UPDATE: Permissions = &[("organization", &["update"])];

const USER_FORM: &str = "users/{user}";
const AFFILIATION_FORM: &str = "users/{user}/affiliations/{affiliation}";
const STANDING_FORM: &str = "organizations/{organization}/standing";

/// The page state of `ListAffiliations`: the last returned row, bound to
/// the parent and the filter.
#[derive(Serialize, Deserialize)]
struct AffiliationPageToken {
    parent: String,
    filter: String,
    /// `verified_at` of the last row, in microseconds since the Unix epoch.
    verified_at: i64,
    user: String,
    /// The organization type of the last row, for example `school`.
    organization_type: String,
}

impl a::OrganizationService for BusinessService {
    async fn get_affiliation<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, a::GetAffiliationRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::Affiliation> + Send + use<'a>> {
        admin_auth::authorize(&self.auth, ctx.headers(), ORGANIZATION_READ).await?;
        let (user, kind) = affiliation_name(request.name)?;
        let now = Utc::now();
        let affiliation = organization::get_affiliation(&self.db, user, kind, now)
            .await
            .map_err(|error| map_error(error, now))?;
        Response::ok(affiliation_resource(affiliation))
    }

    async fn list_affiliations<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, a::ListAffiliationsRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<a::ListAffiliationsResponse> + Send + use<'a>>
    {
        admin_auth::authorize(&self.auth, ctx.headers(), ORGANIZATION_READ).await?;
        let [user] = names::parse("parent", request.parent, ["users"], None, USER_FORM)?;
        let size = pagination::page_size(request.page_size, 50, 100)?;
        let organization_id = filter::parse_affiliation(request.filter)?;
        let after = if request.page_token.is_empty() {
            None
        } else {
            let token: AffiliationPageToken = pagination::decode(request.page_token)?;
            if token.parent != request.parent || token.filter != request.filter {
                return Err(pagination::invalid_page_token());
            }
            let verified_at = DateTime::from_timestamp_micros(token.verified_at)
                .ok_or_else(pagination::invalid_page_token)?;
            let organization_type = OrganizationType::parse(&token.organization_type)
                .ok_or_else(pagination::invalid_page_token)?;
            Some(ListingPosition {
                verified_at,
                user_id: token.user,
                organization_type,
            })
        };
        let now = Utc::now();
        let page = organization::list_affiliations(
            &self.db,
            &AffiliationQuery {
                user_id: (user != names::ANY_USER).then(|| user.to_owned()),
                organization_id,
                after,
                limit: u64::from(size),
            },
            now,
        )
        .await
        .map_err(|error| map_error(error, now))?;
        let next_page_token = page
            .next
            .map(|position| {
                pagination::encode(&AffiliationPageToken {
                    parent: request.parent.to_owned(),
                    filter: request.filter.to_owned(),
                    verified_at: position.verified_at.timestamp_micros(),
                    user: position.user_id,
                    organization_type: position.organization_type.as_str().to_owned(),
                })
            })
            .unwrap_or_default();
        Response::ok(a::ListAffiliationsResponse {
            affiliations: page
                .affiliations
                .into_iter()
                .map(affiliation_resource)
                .collect(),
            next_page_token,
            ..Default::default()
        })
    }

    async fn revoke_affiliation<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, a::RevokeAffiliationRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::Affiliation> + Send + use<'a>> {
        let actor = admin_auth::authorize(&self.auth, ctx.headers(), ORGANIZATION_UPDATE).await?;
        let (user, kind) = affiliation_name(request.name)?;
        let reason = reason(request.reason)?;
        let now = Utc::now();
        let affiliation =
            organization::revoke_affiliation(&self.db, &actor, user, kind, &reason, now)
                .await
                .map_err(|error| map_error(error, now))?;
        self.ranking.invalidate();
        Response::ok(affiliation_resource(affiliation))
    }

    async fn freeze_organization_standing<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, a::FreezeOrganizationStandingRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::OrganizationStanding> + Send + use<'a>> {
        let actor = admin_auth::authorize(&self.auth, ctx.headers(), ORGANIZATION_UPDATE).await?;
        let id = standing_organization(request.name)?;
        let reason = reason(request.reason)?;
        let now = Utc::now();
        organization::freeze_standing(&self.db, &actor, id, &reason, now)
            .await
            .map_err(|error| standing_error(error, id, now))?;
        Response::ok(self.changed_standing(id).await?)
    }

    async fn unfreeze_organization_standing<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, a::UnfreezeOrganizationStandingRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::OrganizationStanding> + Send + use<'a>> {
        let actor = admin_auth::authorize(&self.auth, ctx.headers(), ORGANIZATION_UPDATE).await?;
        let id = standing_organization(request.name)?;
        let reason = reason(request.reason)?;
        let now = Utc::now();
        organization::unfreeze_standing(&self.db, &actor, id, &reason, now)
            .await
            .map_err(|error| standing_error(error, id, now))?;
        Response::ok(self.changed_standing(id).await?)
    }
}

impl BusinessService {
    /// Drop the cached ranking and return the new standing of an organization.
    async fn changed_standing(&self, id: Uuid) -> Result<p::OrganizationStanding, ConnectError> {
        self.ranking.invalidate();
        let found = self.find_organization(id).await?;
        let ranking = self.current_ranking(found.organization_type).await?;
        Ok(standing_resource(&found, &ranking))
    }
}

/// Parse `users/{user}/affiliations/{affiliation}` and return the user ID and
/// the organization type.
///
/// A read or a change names one user, so the `-` wildcard is invalid here.
fn affiliation_name(name: &str) -> Result<(&str, OrganizationType), ConnectError> {
    let [user, kind] = names::parse(
        "name",
        name,
        ["users", "affiliations"],
        None,
        AFFILIATION_FORM,
    )?;
    if user == names::ANY_USER {
        return Err(error::invalid_input(
            "name",
            "Name one user. The `-` wildcard is not supported here.",
        ));
    }
    Ok((user, names::organization_type("name", kind)?))
}

/// Parse `organizations/{organization}/standing` and return the organization ID.
fn standing_organization(name: &str) -> Result<Uuid, ConnectError> {
    let [id] = names::parse(
        "name",
        name,
        ["organizations"],
        Some("standing"),
        STANDING_FORM,
    )?;
    names::uuid("name", id)
}

/// Validate the reason of a change and return its trimmed form.
fn reason(value: &str) -> Result<String, ConnectError> {
    normalized_reason(value).map_err(|_| {
        error::invalid_input(
            "reason",
            "The reason must contain 1 to 500 characters after trimming, without control characters.",
        )
    })
}

/// Map an error of a freeze change. `ORGANIZATION_NOT_FOUND` carries the organization.
fn standing_error(error: OrganizationError, id: Uuid, now: DateTime<Utc>) -> ConnectError {
    match error {
        OrganizationError::OrganizationNotFound => organization_not_found(&id),
        other => map_error(other, now),
    }
}
