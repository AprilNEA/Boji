//! `boji.v1.OrganizationService` over the organization list and the ranking.
//!
//! Input: public requests. No method reads a session.
//! Output: organizations and ranking standings with aggregate counts only.
//! Pos: transport. Every ranking response comes from the snapshot of one type
//! in `BusinessService::ranking`, so a page token names the type and the
//! snapshot that issued it. `map_error` also serves `AffiliationService` and the operations
//! `OrganizationService`.

use super::{
    BusinessService,
    conversion::{sentence, timestamp},
    error::{self, resource_type},
    filter, names, pagination,
};
use crate::{
    domain::organization::{
        self, Organization, OrganizationError, OrganizationQuery, OrganizationType, Placement,
        Ranking,
    },
    proto::{boji::v1 as p, google::r#type::LocalizedText},
};
use buffa::EnumValue;
use chrono::{DateTime, SecondsFormat, Utc};
use connectrpc::{ConnectError, RequestContext, Response, ServiceRequest, ServiceResult};
use p::ErrorReason;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

const ORGANIZATION_FORM: &str = "organizations/{organization}";
const STANDING_FORM: &str = "organizations/{organization}/standing";
const PARENT_FORM: &str = "organizations/-` or `organizations/{organization}";

/// The page state of `ListOrganizations`, bound to its filter.
#[derive(Serialize, Deserialize)]
struct OrganizationPageToken {
    filter: String,
    offset: u64,
}

/// The page state of `ListOrganizationStandings` with the parent `organizations/-`,
/// bound to the type and the snapshot that issued it.
#[derive(Serialize, Deserialize)]
struct StandingPageToken {
    organization_type: String,
    computed_at: i64,
    offset: usize,
}

impl p::OrganizationService for BusinessService {
    async fn list_organizations<'a>(
        &'a self,
        _: RequestContext,
        request: ServiceRequest<'_, p::ListOrganizationsRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::ListOrganizationsResponse> + Send + use<'a>>
    {
        let size = pagination::page_size(request.page_size, 50, 100)?;
        let filter_text = request.filter.to_owned();
        let parsed = filter::parse_organization(&filter_text)?;
        let offset = if request.page_token.is_empty() {
            0
        } else {
            let token: OrganizationPageToken = pagination::decode(request.page_token)?;
            if token.filter != filter_text {
                return Err(pagination::invalid_page_token());
            }
            token.offset
        };
        let page = organization::list_organizations(
            &self.db,
            &OrganizationQuery {
                organization_type: parsed.organization_type,
                region_code: parsed.region_code,
                text: parsed.text,
                offset,
                limit: u64::from(size),
            },
        )
        .await
        .map_err(|error| map_error(error, Utc::now()))?;
        let next_page_token = if page.more {
            let offset = offset.saturating_add(page.organizations.len() as u64);
            pagination::encode(&OrganizationPageToken {
                filter: filter_text,
                offset,
            })
        } else {
            String::new()
        };
        Response::ok(p::ListOrganizationsResponse {
            organizations: page
                .organizations
                .into_iter()
                .map(organization_resource)
                .collect(),
            next_page_token,
            ..Default::default()
        })
    }

    async fn get_organization<'a>(
        &'a self,
        _: RequestContext,
        request: ServiceRequest<'_, p::GetOrganizationRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::Organization> + Send + use<'a>> {
        let [id] = names::parse(
            "name",
            request.name,
            ["organizations"],
            None,
            ORGANIZATION_FORM,
        )?;
        let id = names::uuid("name", id)?;
        Response::ok(organization_resource(self.find_organization(id).await?))
    }

    async fn get_organization_standing<'a>(
        &'a self,
        _: RequestContext,
        request: ServiceRequest<'_, p::GetOrganizationStandingRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::OrganizationStanding> + Send + use<'a>> {
        let [id] = names::parse(
            "name",
            request.name,
            ["organizations"],
            Some("standing"),
            STANDING_FORM,
        )?;
        let id = names::uuid("name", id)?;
        let found = self.find_organization(id).await?;
        let ranking = self.current_ranking(found.organization_type).await?;
        Response::ok(standing_resource(&found, &ranking))
    }

    async fn list_organization_standings<'a>(
        &'a self,
        _: RequestContext,
        request: ServiceRequest<'_, p::ListOrganizationStandingsRequest>,
    ) -> ServiceResult<
        impl connectrpc::Encodable<p::ListOrganizationStandingsResponse> + Send + use<'a>,
    > {
        let [parent] = names::parse(
            "parent",
            request.parent,
            ["organizations"],
            None,
            PARENT_FORM,
        )?;
        let size = pagination::page_size(request.page_size, 50, 100)? as usize;
        let kind = filter::parse_standing(request.filter)?;
        if parent != names::ANY_ORGANIZATION {
            if kind.is_some() {
                return Err(filter::invalid_filter(
                    "The filter must be empty when `parent` names one organization.",
                ));
            }
            // One organization has one standing, so this parent never issues a token.
            if !request.page_token.is_empty() {
                return Err(pagination::invalid_page_token());
            }
            let id = names::uuid("parent", parent)?;
            let found = self.find_organization(id).await?;
            let ranking = self.current_ranking(found.organization_type).await?;
            return Response::ok(p::ListOrganizationStandingsResponse {
                organization_standings: vec![standing_resource(&found, &ranking)],
                ..Default::default()
            });
        }
        // Each type has its own ranking, so the whole ranking needs a type.
        let kind = kind.ok_or_else(|| {
            filter::invalid_filter(
                "The filter must have the form `type = SCHOOL` when `parent` is `organizations/-`.",
            )
        })?;
        let token = (!request.page_token.is_empty())
            .then(|| pagination::decode::<StandingPageToken>(request.page_token))
            .transpose()?;
        let ranking = self.current_ranking(kind).await?;
        let offset = match token {
            None => 0,
            Some(token)
                if token.organization_type == kind.as_str()
                    && token.computed_at == ranking.computed_at.timestamp_micros() =>
            {
                token.offset
            }
            Some(_) => return Err(pagination::invalid_page_token()),
        };
        let ranked = ranking.ranked();
        let end = offset.saturating_add(size).min(ranked.len());
        let page = ranked.get(offset..end).unwrap_or_default();
        let next_page_token = if end < ranked.len() {
            pagination::encode(&StandingPageToken {
                organization_type: kind.as_str().to_owned(),
                computed_at: ranking.computed_at.timestamp_micros(),
                offset: end,
            })
        } else {
            String::new()
        };
        Response::ok(p::ListOrganizationStandingsResponse {
            organization_standings: page
                .iter()
                .map(|entry| {
                    standing(
                        entry.organization_id,
                        &entry.english_name,
                        entry.chinese_name.as_deref(),
                        &entry.region_code,
                        &ranking,
                    )
                })
                .collect(),
            next_page_token,
            ..Default::default()
        })
    }
}

impl BusinessService {
    /// Return an organization or `NOT_FOUND` `ORGANIZATION_NOT_FOUND`.
    pub(super) async fn find_organization(&self, id: Uuid) -> Result<Organization, ConnectError> {
        organization::get_organization(&self.db, id)
            .await
            .map_err(|error| map_error(error, Utc::now()))?
            .ok_or_else(|| organization_not_found(&id))
    }

    /// Return the cached ranking snapshot of a type, or compute a new one.
    pub(super) async fn current_ranking(
        &self,
        kind: OrganizationType,
    ) -> Result<Arc<Ranking>, ConnectError> {
        self.ranking
            .current(&self.db, kind, Utc::now())
            .await
            .map_err(|_| error::internal("organization_ranking_query_failed"))
    }
}

/// Return the `NOT_FOUND` `ORGANIZATION_NOT_FOUND` error for one organization.
pub(super) fn organization_not_found(id: &Uuid) -> ConnectError {
    error::not_found(
        ErrorReason::ORGANIZATION_NOT_FOUND,
        resource_type::ORGANIZATION,
        &names::organization(id),
    )
}

/// The request field of the affiliation email address.
const EMAIL_FIELD: &str = "affiliation_email_verification.email";

/// Map an organization-domain error. `now` sets the delay of `RATE_LIMITED`.
///
/// `ORGANIZATION_NOT_FOUND` and `AFFILIATION_EMAIL_VERIFICATION_NOT_FOUND` carry no
/// `ResourceInfo` here. A method that knows the resource name maps them
/// itself.
pub(super) fn map_error(error: OrganizationError, now: DateTime<Utc>) -> ConnectError {
    match error {
        OrganizationError::OrganizationNotFound => error::error(
            connectrpc::ErrorCode::NotFound,
            ErrorReason::ORGANIZATION_NOT_FOUND,
            "The organization does not exist.",
        ),
        OrganizationError::InvalidEmail(description) => {
            error::invalid_input(EMAIL_FIELD, &sentence(&description))
        }
        OrganizationError::DomainUnknown => error::invalid_argument(
            ErrorReason::AFFILIATION_EMAIL_DOMAIN_UNKNOWN,
            EMAIL_FIELD,
            "No organization of the organization list accepts this domain, or the domain is excluded.",
        ),
        OrganizationError::MembershipRequired => error::failed_precondition(
            ErrorReason::MEMBERSHIP_REQUIRED,
            "Create a membership card first.",
        ),
        OrganizationError::MembershipSuspended => error::failed_precondition(
            ErrorReason::MEMBERSHIP_SUSPENDED,
            "The membership card is suspended.",
        ),
        OrganizationError::RateLimited { retry_at } => {
            let delay = retry_at.signed_duration_since(now);
            // Round up, so that a retry after the delay can succeed.
            let seconds = delay.num_seconds() + i64::from(delay.subsec_nanos() > 0);
            error::rate_limited(seconds)
        }
        OrganizationError::VerificationNotFound => error::error(
            connectrpc::ErrorCode::NotFound,
            ErrorReason::AFFILIATION_EMAIL_VERIFICATION_NOT_FOUND,
            "The organization email verification does not exist.",
        ),
        OrganizationError::VerificationExpired => error::failed_precondition(
            ErrorReason::AFFILIATION_VERIFICATION_EXPIRED,
            "The code expired, was used, or received too many wrong codes. Request a new code.",
        ),
        OrganizationError::CodeInvalid => error::invalid_argument(
            ErrorReason::AFFILIATION_VERIFICATION_CODE_INVALID,
            "code",
            "The code is wrong.",
        ),
        OrganizationError::OrganizationChoiceRequired => error::invalid_input(
            "organization",
            "The verification lists several organizations. Choose one of `candidate_organizations`.",
        ),
        OrganizationError::OrganizationNotCandidate => error::invalid_input(
            "organization",
            "The organization is not one of `candidate_organizations`.",
        ),
        OrganizationError::ChangeTooSoon { available_at } => error::failed_precondition(
            ErrorReason::ORGANIZATION_CHANGE_TOO_SOON,
            &format!(
                "The organization can change from {}.",
                available_at.to_rfc3339_opts(SecondsFormat::Secs, true)
            ),
        ),
        OrganizationError::AffiliationInactive => error::failed_precondition(
            ErrorReason::AFFILIATION_INACTIVE,
            "The user has no active affiliation.",
        ),
        OrganizationError::StandingAlreadyFrozen => error::failed_precondition(
            ErrorReason::ORGANIZATION_STANDING_ALREADY_FROZEN,
            "The organization is already frozen.",
        ),
        OrganizationError::StandingNotFrozen => error::failed_precondition(
            ErrorReason::ORGANIZATION_STANDING_NOT_FROZEN,
            "The organization is not frozen.",
        ),
        OrganizationError::Corrupt(_) => error::internal("organization_data_invalid"),
        OrganizationError::Crypto(_) => error::internal("organization_crypto_failed"),
        OrganizationError::Database(_) => error::internal("organization_storage_failed"),
    }
}

/// Convert an organization type to `boji.v1.OrganizationType`.
pub(super) fn type_value(kind: OrganizationType) -> EnumValue<p::OrganizationType> {
    match kind {
        OrganizationType::School => p::OrganizationType::SCHOOL,
    }
    .into()
}

/// The names of an organization: English first, then the Chinese name when known.
fn display_names(english: &str, chinese: Option<&str>) -> Vec<LocalizedText> {
    let mut names = vec![LocalizedText {
        text: english.to_owned(),
        language_code: "en".to_owned(),
        ..Default::default()
    }];
    if let Some(chinese) = chinese {
        names.push(LocalizedText {
            text: chinese.to_owned(),
            language_code: "zh-Hans".to_owned(),
            ..Default::default()
        });
    }
    names
}

fn organization_resource(value: Organization) -> p::Organization {
    p::Organization {
        name: names::organization(&value.id),
        r#type: type_value(value.organization_type),
        display_names: display_names(&value.english_name, value.chinese_name.as_deref()),
        region_code: value.region_code,
        email_domains: value.email_domains,
        ..Default::default()
    }
}

pub(super) fn standing_resource(
    value: &Organization,
    ranking: &Ranking,
) -> p::OrganizationStanding {
    standing(
        value.id,
        &value.english_name,
        value.chinese_name.as_deref(),
        &value.region_code,
        ranking,
    )
}

/// Build the standing of one organization from a snapshot.
///
/// Counts stay zero unless the organization is public, so the response never shows
/// a count below the public threshold.
fn standing(
    id: Uuid,
    english_name: &str,
    chinese_name: Option<&str>,
    region_code: &str,
    ranking: &Ranking,
) -> p::OrganizationStanding {
    let mut resource = p::OrganizationStanding {
        name: names::organization_standing(&id),
        week_start_time: timestamp(ranking.week_start),
        compute_time: timestamp(ranking.computed_at),
        organization_display_names: display_names(english_name, chinese_name),
        organization_region_code: region_code.to_owned(),
        organization_type: type_value(ranking.organization_type),
        frozen: ranking.is_frozen(id),
        ..Default::default()
    };
    resource.placement = match ranking.placement(id) {
        Placement::Ranked(entry) => {
            resource.rank = i32::try_from(entry.rank).unwrap_or(i32::MAX);
            resource.member_count = i32::try_from(entry.member_count).unwrap_or(i32::MAX);
            resource.weekly_new_member_count =
                i32::try_from(entry.weekly_new_count).unwrap_or(i32::MAX);
            p::organization_standing::Placement::RANKED
        }
        Placement::BelowThreshold => p::organization_standing::Placement::BELOW_THRESHOLD,
        Placement::NoMembers => p::organization_standing::Placement::NO_MEMBERS,
    }
    .into();
    resource
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn display_names_put_english_first() {
        let names = display_names(
            "Xi'an Jiaotong-Liverpool University",
            Some("西交利物浦大学"),
        );
        let pairs: Vec<(&str, &str)> = names
            .iter()
            .map(|name| (name.language_code.as_str(), name.text.as_str()))
            .collect();
        assert_eq!(
            pairs,
            [
                ("en", "Xi'an Jiaotong-Liverpool University"),
                ("zh-Hans", "西交利物浦大学")
            ]
        );
        assert_eq!(display_names("Monash University", None).len(), 1);
    }

    #[test]
    fn rate_limits_round_the_delay_up() {
        let now = DateTime::parse_from_rfc3339("2026-10-21T00:00:00Z")
            .unwrap()
            .with_timezone(&Utc);
        let retry_at = now + chrono::TimeDelta::milliseconds(1500);
        let status = aip_193::proto::Status::from(&map_error(
            OrganizationError::RateLimited { retry_at },
            now,
        ));
        let retry = status
            .detail::<aip_193::proto::RetryInfo>()
            .expect("RetryInfo");
        assert_eq!(
            retry.retry_delay.as_option().map(|delay| delay.seconds),
            Some(2)
        );
    }
}
