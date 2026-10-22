//! `boji.admin.v1` services over the membership-administration domain.
//!
//! Every method authorizes the caller before it looks up any target, so a
//! caller without permission learns nothing about the targets (AIP-211).

use super::{
    BusinessService,
    conversion::{optional_timestamp, request_time, timestamp},
    error::{self, resource_type},
    filter, names, pagination,
};
use crate::{
    admin_auth,
    domain::admin::{
        self as d, AdminError, GrantMutation, GrantRecord, LookupKey, MembershipDetail,
        MembershipStatus, RevokeMutation, StatusMutation,
    },
    entities,
    proto::boji::{admin::v1 as a, v1 as p},
};
use buffa::EnumValue;
use chrono::SecondsFormat;
use connectrpc::{ConnectError, RequestContext, Response, ServiceRequest, ServiceResult};
use p::ErrorReason;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

type Permissions = &'static [(&'static str, &'static [&'static str])];

const MEMBERSHIP_READ: Permissions = &[("membership", &["read"])];
const MEMBERSHIP_FULL_READ: Permissions = &[("membership", &["read"]), ("entitlement", &["read"])];
const MEMBERSHIP_UPDATE: Permissions = &[("membership", &["update"])];
const ENTITLEMENT_READ: Permissions = &[("entitlement", &["read"])];
const ENTITLEMENT_GRANT: Permissions = &[("entitlement", &["grant"])];
const ENTITLEMENT_REVOKE: Permissions = &[("entitlement", &["revoke"])];

const USER_FORM: &str = "users/{user}";
const MEMBERSHIP_FORM: &str = "users/{user}/memberships/{membership}";
const GRANT_FORM: &str =
    "users/{user}/memberships/{membership}/entitlementGrants/{entitlement_grant}";
const ENTITLEMENT_FORM: &str = "entitlements/{entitlement}";

/// Page state of `ListMemberships` across all users. The filter and the view
/// bind the token.
#[derive(Deserialize, Serialize)]
struct MembershipPage {
    cursor: String,
    filter: String,
    full: bool,
}

/// Page state of `ListEntitlementGrants`: the last returned grant.
#[derive(Deserialize, Serialize)]
struct GrantPage {
    parent: String,
    code: String,
    entitlement: Uuid,
}

/// The resource names that a request targets, for `NOT_FOUND` details.
#[derive(Default)]
struct Target<'a> {
    membership: &'a str,
    entitlement: &'a str,
    grant: &'a str,
}

impl BusinessService {
    /// Read one card with its grants. A name whose `{user}` segment is
    /// neither `-` nor the owner returns `NOT_FOUND`.
    async fn card(
        &self,
        user: &str,
        id: Uuid,
        name: &str,
    ) -> Result<MembershipDetail, ConnectError> {
        let target = Target {
            membership: name,
            ..Default::default()
        };
        let detail = d::lookup_membership(&self.db, &LookupKey::MembershipId(id.to_string()))
            .await
            .map_err(|error| map_error(error, &target))?;
        if names::matches_user(user, &detail.membership.user_id) {
            Ok(detail)
        } else {
            Err(membership_not_found(name))
        }
    }

    /// Suspend or resume one card.
    async fn change_state(
        &self,
        ctx: &RequestContext,
        name: &str,
        reason: String,
        status: MembershipStatus,
    ) -> Result<p::Membership, ConnectError> {
        let actor_user_id =
            admin_auth::authorize(&self.auth, ctx.headers(), MEMBERSHIP_UPDATE).await?;
        let (user, id) = membership_name("name", name)?;
        d::normalized_reason(&reason).map_err(|error| map_error(error, &Target::default()))?;
        self.card(user, id, name).await?;
        let target = Target {
            membership: name,
            ..Default::default()
        };
        let result = d::change_status(
            &self.db,
            &StatusMutation {
                actor_user_id,
                membership_id: id.to_string(),
                reason,
                status,
            },
        )
        .await
        .map_err(|error| map_error(error, &target))?;
        if !result.changed {
            return Err(match status {
                MembershipStatus::Suspended => error::failed_precondition(
                    ErrorReason::MEMBERSHIP_ALREADY_SUSPENDED,
                    "The card is already suspended.",
                ),
                MembershipStatus::Active => error::failed_precondition(
                    ErrorReason::MEMBERSHIP_ALREADY_ACTIVE,
                    "The card is already active.",
                ),
            });
        }
        // The transaction committed, so devices that ask now see the new pass.
        self.pass_updates.pass_changed(id);
        membership_resource(&result.membership, None)
    }
}

impl a::EntitlementService for BusinessService {
    async fn get_entitlement<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, a::GetEntitlementRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<a::Entitlement> + Send + use<'a>> {
        admin_auth::authorize(&self.auth, ctx.headers(), ENTITLEMENT_READ).await?;
        let name = request.name;
        let [id] = names::parse("name", name, ["entitlements"], None, ENTITLEMENT_FORM)?;
        let id = names::uuid("name", id)?;
        let target = Target {
            entitlement: name,
            ..Default::default()
        };
        let entitlement = d::get_entitlement(&self.db, &id.to_string())
            .await
            .map_err(|error| map_error(error, &target))?;
        Response::ok(entitlement_resource(entitlement))
    }

    async fn list_entitlements<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, a::ListEntitlementsRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<a::ListEntitlementsResponse> + Send + use<'a>>
    {
        admin_auth::authorize(&self.auth, ctx.headers(), ENTITLEMENT_READ).await?;
        let limit = pagination::page_size(request.page_size, 50, 100)?;
        let page = d::list_entitlements(
            &self.db,
            &d::ListEntitlements {
                cursor: request.page_token.to_owned(),
                limit,
            },
        )
        .await
        .map_err(|error| map_error(error, &Target::default()))?;
        Response::ok(a::ListEntitlementsResponse {
            entitlements: page.records.into_iter().map(entitlement_resource).collect(),
            next_page_token: if page.has_more {
                page.next_cursor
            } else {
                String::new()
            },
            ..Default::default()
        })
    }
}

impl a::MembershipService for BusinessService {
    async fn get_membership<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, a::GetMembershipRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::Membership> + Send + use<'a>> {
        let request = request.to_owned_message();
        let full = full_view(request.view, true);
        admin_auth::authorize(&self.auth, ctx.headers(), read_permissions(&full)).await?;
        let full = full?;
        let (user, id) = membership_name("name", &request.name)?;
        let detail = self.card(user, id, &request.name).await?;
        Response::ok(membership_resource(
            &detail.membership,
            full.then_some(detail.grants.as_slice()),
        )?)
    }

    async fn list_memberships<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, a::ListMembershipsRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<a::ListMembershipsResponse> + Send + use<'a>>
    {
        let request = request.to_owned_message();
        let full = full_view(request.view, false);
        admin_auth::authorize(&self.auth, ctx.headers(), read_permissions(&full)).await?;
        let full = full?;
        let [user] = names::parse("parent", &request.parent, ["users"], None, USER_FORM)?;
        let limit = pagination::page_size(request.page_size, 50, 100)?;
        let filter = filter::parse(&request.filter)?;

        if user != names::ANY_USER || filter.member_number.is_some() {
            // At most one card matches, so this path never issues a token.
            if !request.page_token.is_empty() {
                return Err(pagination::invalid_page_token());
            }
            let key = match &filter.member_number {
                Some(number) => LookupKey::MemberNumber(number.clone()),
                None => LookupKey::UserId(user.to_owned()),
            };
            let detail = match d::lookup_membership(&self.db, &key).await {
                Ok(detail) => Some(detail),
                Err(AdminError::MembershipNotFound) => None,
                Err(error) => return Err(map_error(error, &Target::default())),
            };
            let memberships = detail
                .filter(|detail| {
                    names::matches_user(user, &detail.membership.user_id)
                        && filter
                            .state
                            .is_none_or(|state| state.as_str() == detail.membership.status)
                })
                .map(|detail| {
                    membership_resource(
                        &detail.membership,
                        full.then_some(detail.grants.as_slice()),
                    )
                })
                .transpose()?
                .into_iter()
                .collect();
            return Response::ok(a::ListMembershipsResponse {
                memberships,
                ..Default::default()
            });
        }

        let cursor = if request.page_token.is_empty() {
            String::new()
        } else {
            let page: MembershipPage = pagination::decode(&request.page_token)?;
            if page.filter != request.filter || page.full != full {
                return Err(pagination::invalid_page_token());
            }
            page.cursor
        };
        let page = d::list_memberships(
            &self.db,
            &d::ListMemberships {
                cursor,
                limit,
                status: filter.state.map(|state| state.as_str().to_owned()),
            },
        )
        .await
        .map_err(|error| map_error(error, &Target::default()))?;
        let mut memberships = Vec::with_capacity(page.records.len());
        for card in &page.records {
            let grants = if full {
                let key = LookupKey::MembershipId(card.id.to_string());
                let detail = d::lookup_membership(&self.db, &key)
                    .await
                    .map_err(|error| map_error(error, &Target::default()))?;
                Some(detail.grants)
            } else {
                None
            };
            memberships.push(membership_resource(card, grants.as_deref())?);
        }
        let next_page_token = if page.has_more {
            pagination::encode(&MembershipPage {
                cursor: page.next_cursor,
                filter: request.filter.clone(),
                full,
            })
        } else {
            String::new()
        };
        Response::ok(a::ListMembershipsResponse {
            memberships,
            next_page_token,
            ..Default::default()
        })
    }

    async fn suspend_membership<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, a::SuspendMembershipRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::Membership> + Send + use<'a>> {
        let request = request.to_owned_message();
        Response::ok(
            self.change_state(
                &ctx,
                &request.name,
                request.reason,
                MembershipStatus::Suspended,
            )
            .await?,
        )
    }

    async fn resume_membership<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, a::ResumeMembershipRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::Membership> + Send + use<'a>> {
        let request = request.to_owned_message();
        Response::ok(
            self.change_state(
                &ctx,
                &request.name,
                request.reason,
                MembershipStatus::Active,
            )
            .await?,
        )
    }

    async fn get_entitlement_grant<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, a::GetEntitlementGrantRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<a::EntitlementGrant> + Send + use<'a>> {
        admin_auth::authorize(&self.auth, ctx.headers(), MEMBERSHIP_FULL_READ).await?;
        let name = request.name;
        let (user, id, entitlement) = grant_name("name", name)?;
        let card = self
            .card(user, id, &names::membership(user, &id.to_string()))
            .await?;
        let grant = card
            .grants
            .iter()
            .find(|record| record.grant.entitlement_id == entitlement)
            .ok_or_else(|| grant_not_found(name))?;
        Response::ok(grant_resource(&card.membership.user_id, grant))
    }

    async fn list_entitlement_grants<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, a::ListEntitlementGrantsRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<a::ListEntitlementGrantsResponse> + Send + use<'a>>
    {
        admin_auth::authorize(&self.auth, ctx.headers(), MEMBERSHIP_FULL_READ).await?;
        let parent = request.parent;
        let (user, id) = membership_name("parent", parent)?;
        let limit = pagination::page_size(request.page_size, 50, 100)? as usize;
        let after = if request.page_token.is_empty() {
            None
        } else {
            let page: GrantPage = pagination::decode(request.page_token)?;
            if page.parent != parent {
                return Err(pagination::invalid_page_token());
            }
            Some((page.code, page.entitlement))
        };
        let card = self.card(user, id, parent).await?;
        // Grants are ordered by catalog code. The catalog ID breaks ties.
        let remaining: Vec<&GrantRecord> = card
            .grants
            .iter()
            .filter(|record| {
                after.as_ref().is_none_or(|(code, entitlement)| {
                    (
                        record.entitlement.code.as_str(),
                        record.grant.entitlement_id,
                    ) > (code.as_str(), *entitlement)
                })
            })
            .collect();
        let page = &remaining[..remaining.len().min(limit)];
        let next_page_token = match page.last() {
            Some(last) if remaining.len() > limit => pagination::encode(&GrantPage {
                parent: parent.to_owned(),
                code: last.entitlement.code.clone(),
                entitlement: last.grant.entitlement_id,
            }),
            _ => String::new(),
        };
        Response::ok(a::ListEntitlementGrantsResponse {
            entitlement_grants: page
                .iter()
                .map(|record| grant_resource(&card.membership.user_id, record))
                .collect(),
            next_page_token,
            ..Default::default()
        })
    }

    async fn grant_entitlement<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, a::GrantEntitlementRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<a::GrantEntitlementResponse> + Send + use<'a>>
    {
        let actor_user_id =
            admin_auth::authorize(&self.auth, ctx.headers(), ENTITLEMENT_GRANT).await?;
        let request = request.to_owned_message();
        let (user, id) = membership_name("parent", &request.parent)?;
        let [entitlement] = names::parse(
            "entitlement",
            &request.entitlement,
            ["entitlements"],
            None,
            ENTITLEMENT_FORM,
        )?;
        let entitlement = names::uuid("entitlement", entitlement)?;
        let expires_at = match request.expire_time.as_option() {
            Some(_) => Some(
                request_time("expire_time", &request.expire_time)?
                    .to_rfc3339_opts(SecondsFormat::AutoSi, true),
            ),
            None => None,
        };
        d::normalized_reason(&request.reason)
            .map_err(|error| map_error(error, &Target::default()))?;
        d::future_expiry(&expires_at).map_err(|error| map_error(error, &Target::default()))?;
        let card = self.card(user, id, &request.parent).await?;
        let target = Target {
            membership: &request.parent,
            entitlement: &request.entitlement,
            ..Default::default()
        };
        let result = d::grant_entitlement(
            &self.db,
            &GrantMutation {
                actor_user_id,
                membership_id: id.to_string(),
                entitlement_id: entitlement.to_string(),
                reason: request.reason.clone(),
                expires_at,
            },
        )
        .await
        .map_err(|error| map_error(error, &target))?;
        Response::ok(a::GrantEntitlementResponse {
            entitlement_grant: grant_resource(&card.membership.user_id, &result.grant).into(),
            ..Default::default()
        })
    }

    async fn revoke_entitlement_grant<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, a::RevokeEntitlementGrantRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<a::EntitlementGrant> + Send + use<'a>> {
        let actor_user_id =
            admin_auth::authorize(&self.auth, ctx.headers(), ENTITLEMENT_REVOKE).await?;
        let request = request.to_owned_message();
        let (user, id, entitlement) = grant_name("name", &request.name)?;
        d::normalized_reason(&request.reason)
            .map_err(|error| map_error(error, &Target::default()))?;
        let membership = names::membership(user, &id.to_string());
        let card = self.card(user, id, &membership).await?;
        let entitlement_name = names::entitlement(&entitlement.to_string());
        let target = Target {
            membership: &membership,
            entitlement: &entitlement_name,
            grant: &request.name,
        };
        let result = d::revoke_entitlement(
            &self.db,
            &RevokeMutation {
                actor_user_id,
                membership_id: id.to_string(),
                entitlement_id: entitlement.to_string(),
                reason: request.reason.clone(),
            },
        )
        .await
        .map_err(|error| map_error(error, &target))?;
        if !result.changed {
            return Err(error::failed_precondition(
                ErrorReason::ENTITLEMENT_GRANT_ALREADY_REVOKED,
                "The grant is already revoked.",
            ));
        }
        Response::ok(grant_resource(&card.membership.user_id, &result.grant))
    }
}

/// Resolve a `MembershipView`. `default_full` is the default of the method.
fn full_view(
    value: EnumValue<a::MembershipView>,
    default_full: bool,
) -> Result<bool, ConnectError> {
    match value.as_known() {
        Some(a::MembershipView::MEMBERSHIP_VIEW_UNSPECIFIED) => Ok(default_full),
        Some(a::MembershipView::MEMBERSHIP_VIEW_BASIC) => Ok(false),
        Some(a::MembershipView::MEMBERSHIP_VIEW_FULL) => Ok(true),
        None => Err(error::invalid_input(
            "view",
            "The value must be MEMBERSHIP_VIEW_BASIC or MEMBERSHIP_VIEW_FULL.",
        )),
    }
}

/// The full view also requires `entitlement.read`. An invalid view needs
/// only `membership.read` before its `INVALID_ARGUMENT` error.
fn read_permissions(full: &Result<bool, ConnectError>) -> Permissions {
    if matches!(full, Ok(true)) {
        MEMBERSHIP_FULL_READ
    } else {
        MEMBERSHIP_READ
    }
}

fn membership_name<'a>(field: &str, name: &'a str) -> Result<(&'a str, Uuid), ConnectError> {
    let [user, id] = names::parse(field, name, ["users", "memberships"], None, MEMBERSHIP_FORM)?;
    Ok((user, names::uuid(field, id)?))
}

fn grant_name<'a>(field: &str, name: &'a str) -> Result<(&'a str, Uuid, Uuid), ConnectError> {
    let [user, id, entitlement] = names::parse(
        field,
        name,
        ["users", "memberships", "entitlementGrants"],
        None,
        GRANT_FORM,
    )?;
    Ok((
        user,
        names::uuid(field, id)?,
        names::uuid(field, entitlement)?,
    ))
}

fn membership_not_found(name: &str) -> ConnectError {
    error::not_found(
        ErrorReason::MEMBERSHIP_NOT_FOUND,
        resource_type::MEMBERSHIP,
        name,
    )
}

fn grant_not_found(name: &str) -> ConnectError {
    error::not_found(
        ErrorReason::ENTITLEMENT_GRANT_NOT_FOUND,
        resource_type::ENTITLEMENT_GRANT,
        name,
    )
}

fn map_error(error: AdminError, target: &Target<'_>) -> ConnectError {
    match error {
        AdminError::InvalidInput { field } => invalid_field(field),
        AdminError::MembershipNotFound => membership_not_found(target.membership),
        AdminError::EntitlementNotFound => error::not_found(
            ErrorReason::ENTITLEMENT_NOT_FOUND,
            resource_type::ENTITLEMENT,
            target.entitlement,
        ),
        AdminError::GrantNotFound => grant_not_found(target.grant),
        AdminError::EntitlementInactive => error::failed_precondition(
            ErrorReason::ENTITLEMENT_INACTIVE,
            "The catalog entry is inactive and accepts no new grant.",
        ),
        AdminError::Storage(_) => error::internal("admin_storage_failed"),
    }
}

/// Map a domain field name to the request field that carries it.
fn invalid_field(field: &str) -> ConnectError {
    match field {
        "cursor" => pagination::invalid_page_token(),
        "limit" => error::invalid_input("page_size", "The value is outside the supported range."),
        "status" | "member_number" | "user_id" => {
            filter::invalid_filter("The filter value is not a valid card state or member number.")
        }
        "reason" => error::invalid_input(
            "reason",
            "The reason must contain 1 to 500 characters after trimming, without control characters.",
        ),
        "expires_at" => error::invalid_input(
            "expire_time",
            "The time must be later than the server time.",
        ),
        "membership_id" => {
            error::invalid_input("name", "The membership ID segment must be a UUID.")
        }
        "entitlement_id" => {
            error::invalid_input("entitlement", "The entitlement ID segment must be a UUID.")
        }
        _ => error::internal("admin_input_unexpected"),
    }
}

fn entitlement_resource(value: entities::entitlement::Model) -> a::Entitlement {
    a::Entitlement {
        name: names::entitlement(&value.id.to_string()),
        code: value.code,
        display_name: value.name,
        description: value.description,
        state: if value.is_active {
            a::entitlement::State::ACTIVE
        } else {
            a::entitlement::State::INACTIVE
        }
        .into(),
        create_time: timestamp(value.created_at),
        update_time: timestamp(value.updated_at),
        ..Default::default()
    }
}

fn grant_resource(user: &str, value: &GrantRecord) -> a::EntitlementGrant {
    let membership = value.grant.membership_id.to_string();
    let entitlement = value.grant.entitlement_id.to_string();
    a::EntitlementGrant {
        name: names::entitlement_grant(user, &membership, &entitlement),
        entitlement: names::entitlement(&entitlement),
        grant_time: timestamp(value.grant.granted_at),
        expire_time: optional_timestamp(value.grant.expires_at),
        revoke_time: optional_timestamp(value.grant.revoked_at),
        effective: value.effective,
        ..Default::default()
    }
}

/// Convert a stored card. `grants` is `Some` for the full view.
fn membership_resource(
    card: &entities::membership::Model,
    grants: Option<&[GrantRecord]>,
) -> Result<p::Membership, ConnectError> {
    let tier = match card.tier.as_str() {
        "community" => p::membership::Tier::COMMUNITY,
        _ => return Err(error::internal("membership_stored_tier_invalid")),
    };
    let state = match card.status.as_str() {
        "active" => p::membership::State::ACTIVE,
        "suspended" => p::membership::State::SUSPENDED,
        _ => return Err(error::internal("membership_stored_state_invalid")),
    };
    Ok(p::Membership {
        name: names::membership(&card.user_id, &card.id.to_string()),
        member_number: card.member_number.clone(),
        nickname: card.display_name.clone(),
        tier: tier.into(),
        state: state.into(),
        entitlements: grants
            .unwrap_or_default()
            .iter()
            .filter(|record| record.effective)
            .map(|record| p::membership::EffectiveEntitlement {
                code: record.entitlement.code.clone(),
                display_name: record.entitlement.name.clone(),
                description: record.entitlement.description.clone(),
                grant_time: timestamp(record.grant.granted_at),
                expire_time: optional_timestamp(record.grant.expires_at),
                ..Default::default()
            })
            .collect(),
        create_time: timestamp(card.joined_at),
        expire_time: optional_timestamp(card.expires_at),
        ..Default::default()
    })
}
