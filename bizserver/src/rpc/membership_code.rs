//! `boji.v1.MembershipCodeService` over the membership domain and
//! [`crate::domain::membership_code`].
//!
//! Input: a code name and the session of the caller.
//! Output: the static value and the TOTP parameters of the caller's card.
//! Pos: transport only. The code rules live in `crate::domain::membership_code`.

use super::{
    BusinessService, conversion,
    error::{self, resource_type},
    membership::map_error,
    names,
};
use crate::{
    domain::{
        membership::{self, MembershipStatus},
        membership_code::{self as code, MembershipCodes},
    },
    proto::boji::v1 as p,
};
use connectrpc::{ConnectError, RequestContext, Response, ServiceRequest, ServiceResult};
use openssl::error::ErrorStack;
use p::ErrorReason;
use uuid::Uuid;

const CODE_FORM: &str = "users/{user}/memberships/{membership}/code";

impl p::MembershipCodeService for BusinessService {
    async fn get_membership_code<'a>(
        &'a self,
        ctx: RequestContext,
        request: ServiceRequest<'_, p::GetMembershipCodeRequest>,
    ) -> ServiceResult<impl connectrpc::Encodable<p::MembershipCode> + Send + use<'a>> {
        let principal = self.principal(&ctx).await?;
        let [user, id] = names::parse(
            "name",
            request.name,
            ["users", "memberships"],
            Some("code"),
            CODE_FORM,
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
        let codes = self
            .membership_codes
            .as_deref()
            .ok_or_else(not_configured)?;
        let membership_id =
            Uuid::parse_str(&card.id).map_err(|_| error::internal("membership_id_invalid"))?;
        let static_value = codes.static_value(membership_id).map_err(failed)?;
        let secret = codes.totp_secret(membership_id).map_err(failed)?;
        Response::ok(p::MembershipCode {
            name: names::membership_code(&principal.user_id, &card.id),
            static_value,
            dynamic_value_prefix: MembershipCodes::dynamic_prefix(membership_id),
            totp: p::Totp {
                secret,
                digits: code::TOTP_DIGITS as i32,
                period: conversion::seconds(code::TOTP_PERIOD_SECONDS).into(),
                ..Default::default()
            }
            .into(),
            ..Default::default()
        })
    }
}

/// Return the `FAILED_PRECONDITION` `MEMBERSHIP_CODE_NOT_CONFIGURED` error.
pub(super) fn not_configured() -> ConnectError {
    error::failed_precondition(
        ErrorReason::MEMBERSHIP_CODE_NOT_CONFIGURED,
        "The server cannot issue or check membership codes.",
    )
}

/// Log an OpenSSL failure and return an internal error without its details.
pub(super) fn failed(failure: ErrorStack) -> ConnectError {
    tracing::error!(event = "membership_code_failed", error = %failure);
    error::internal("membership_code_failed")
}
