//! AIP-193 errors. Every error carries exactly one `google.rpc.ErrorInfo`.
//!
//! Input: an `ErrorReason`, a Connect code and optional field or resource facts.
//! Output: `ConnectError` values for whole-request failures and
//! `google.rpc.Status` values for per-write batch results.
//! Pos: the only place in the transport that builds error details. The
//! `google.rpc` types and the `Status` to `ConnectError` conversion come from
//! `aip_193::proto`.

use crate::proto::boji::v1::ErrorReason;
use aip_193::proto::{
    BadRequest, Code, ErrorInfo, FieldViolation, ResourceInfo, RetryInfo, Status,
};
use buffa::Enumeration;
use connectrpc::{ConnectError, ErrorCode};

/// `ErrorInfo.domain` of every error from this service.
pub const ERROR_DOMAIN: &str = "boji.leanmuscle.club";

/// Resource type names from the `google.api.resource` annotations.
pub mod resource_type {
    /// `boji.v1.Membership`.
    pub const MEMBERSHIP: &str = "boji.leanmuscle.club/Membership";
    /// `boji.v1.Activity`.
    pub const ACTIVITY: &str = "boji.leanmuscle.club/Activity";
    /// `boji.admin.v1.Entitlement`.
    pub const ENTITLEMENT: &str = "boji.leanmuscle.club/Entitlement";
    /// `boji.admin.v1.EntitlementGrant`.
    pub const ENTITLEMENT_GRANT: &str = "boji.leanmuscle.club/EntitlementGrant";
    /// `boji.v1.Organization`.
    pub const ORGANIZATION: &str = "boji.leanmuscle.club/Organization";
    /// `boji.v1.AffiliationEmailVerification`.
    pub const AFFILIATION_EMAIL_VERIFICATION: &str =
        "boji.leanmuscle.club/AffiliationEmailVerification";
}

/// Build the `ErrorInfo` for one reason.
pub fn error_info(reason: ErrorReason) -> ErrorInfo {
    ErrorInfo::new(reason.proto_name(), ERROR_DOMAIN)
}

/// Build a status whose first detail is the `ErrorInfo` of `reason`.
fn reason_status(code: Code, reason: ErrorReason, message: &str) -> Status {
    Status::new(code, message).with_detail(&error_info(reason))
}

/// Build an error with a code, a reason and a developer-facing message.
pub fn error(code: ErrorCode, reason: ErrorReason, message: &str) -> ConnectError {
    reason_status(Code::from(code), reason, message).into()
}

/// Build an `INVALID_ARGUMENT` error that names one request field.
///
/// `field` is a path in the request message, for example `writes[2].etag`.
pub fn invalid_argument(reason: ErrorReason, field: &str, description: &str) -> ConnectError {
    let violation = FieldViolation::new(field, description).with_reason(reason.proto_name());
    reason_status(
        Code::INVALID_ARGUMENT,
        reason,
        "The request contains an invalid field.",
    )
    .with_detail(&BadRequest::from(violation))
    .into()
}

/// Build an `INVALID_ARGUMENT` `INVALID_INPUT` error for one request field.
pub fn invalid_input(field: &str, description: &str) -> ConnectError {
    invalid_argument(ErrorReason::INVALID_INPUT, field, description)
}

/// Build a `NOT_FOUND` error that names the missing resource.
pub fn not_found(reason: ErrorReason, resource_type: &str, resource_name: &str) -> ConnectError {
    reason_status(
        Code::NOT_FOUND,
        reason,
        "The requested resource does not exist.",
    )
    .with_detail(&ResourceInfo::new(resource_type, resource_name))
    .into()
}

/// Build a `FAILED_PRECONDITION` error.
pub fn failed_precondition(reason: ErrorReason, message: &str) -> ConnectError {
    error(ErrorCode::FailedPrecondition, reason, message)
}

/// Build the `RESOURCE_EXHAUSTED` `RATE_LIMITED` error.
///
/// The error carries `google.rpc.RetryInfo` with `delay_seconds`, rounded up
/// to whole seconds and at least 1.
pub fn rate_limited(delay_seconds: i64) -> ConnectError {
    let retry = RetryInfo {
        retry_delay: super::conversion::seconds(delay_seconds.max(1)).into(),
        ..Default::default()
    };
    reason_status(
        Code::RESOURCE_EXHAUSTED,
        ErrorReason::RATE_LIMITED,
        "The request exceeds a limit. Retry after the delay in `RetryInfo`.",
    )
    .with_detail(&retry)
    .into()
}

/// Build the `UNAVAILABLE` error for a storage outage.
pub fn backend_unavailable() -> ConnectError {
    error(
        ErrorCode::Unavailable,
        ErrorReason::BACKEND_UNAVAILABLE,
        "A backend service is unavailable. Retry the request later.",
    )
}

/// Log an unexpected failure and build the `INTERNAL` error.
///
/// `event` names the failure in the server log. The response carries no
/// failure details.
pub fn internal(event: &'static str) -> ConnectError {
    tracing::error!(event);
    error(
        ErrorCode::Internal,
        ErrorReason::INTERNAL_ERROR,
        "The server failed to complete the request.",
    )
}

/// Build the `google.rpc.Status` of one failed batch write.
pub fn status(code: ErrorCode, reason: ErrorReason, message: &str) -> Status {
    reason_status(Code::from(code), reason, message)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn status_carries_error_info_with_the_reason_name() {
        let status = status(
            ErrorCode::Aborted,
            ErrorReason::ACTIVITY_ETAG_MISMATCH,
            "The etag does not match.",
        );
        assert_eq!(status.code, 10);
        let [detail] = status.details.as_slice() else {
            panic!("status must carry one detail");
        };
        assert_eq!(detail.type_url, "type.googleapis.com/google.rpc.ErrorInfo");
        let info = status.error_info().expect("ErrorInfo");
        assert_eq!(info.reason, "ACTIVITY_ETAG_MISMATCH");
        assert_eq!(info.domain, ERROR_DOMAIN);
    }

    #[test]
    fn connect_errors_carry_error_info_first() {
        let error = invalid_input("page_size", "must not be negative");
        assert_eq!(error.code, ErrorCode::InvalidArgument);
        let names: Vec<&str> = error.details.iter().map(|d| d.type_url.as_str()).collect();
        assert_eq!(names, ["google.rpc.ErrorInfo", "google.rpc.BadRequest"]);

        let status = Status::from(&error);
        assert_eq!(status.code(), Code::INVALID_ARGUMENT);
        assert_eq!(
            status.error_info().map(|info| info.reason),
            Some("INVALID_INPUT".to_owned())
        );
        let bad_request = status.detail::<BadRequest>().expect("BadRequest");
        assert_eq!(bad_request.field_violations[0].field, "page_size");
        assert_eq!(bad_request.field_violations[0].reason, "INVALID_INPUT");
    }

    #[test]
    fn rate_limited_errors_carry_retry_info() {
        let error = rate_limited(0);
        assert_eq!(error.code, ErrorCode::ResourceExhausted);
        let status = Status::from(&error);
        assert_eq!(
            status.error_info().map(|info| info.reason),
            Some("RATE_LIMITED".to_owned())
        );
        let retry = status.detail::<RetryInfo>().expect("RetryInfo");
        assert_eq!(
            retry.retry_delay.as_option().map(|delay| delay.seconds),
            Some(1)
        );
    }
}
