//! AIP-193 errors. Every error carries exactly one `google.rpc.ErrorInfo`.
//!
//! Input: an `ErrorReason`, a Connect code and optional field or resource facts.
//! Output: `ConnectError` values for whole-request failures and
//! `google.rpc.Status` values for per-write batch results.
//! Pos: the only place in the transport that builds error details.

use crate::proto::{
    boji::v1::ErrorReason,
    google::rpc::{BadRequest, ErrorInfo, ResourceInfo, Status, bad_request::FieldViolation},
};
use buffa::Enumeration;
use buffa_types::google::protobuf::Any;
use connectrpc::{ConnectError, ErrorCode, ErrorDetail};

/// `ErrorInfo.domain` of every error from this service.
pub const ERROR_DOMAIN: &str = "boji.leanmuscle.club";

const ERROR_INFO: &str = "google.rpc.ErrorInfo";
const BAD_REQUEST: &str = "google.rpc.BadRequest";
const RESOURCE_INFO: &str = "google.rpc.ResourceInfo";

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
}

/// Build the `ErrorInfo` for one reason.
pub fn error_info(reason: ErrorReason) -> ErrorInfo {
    ErrorInfo {
        reason: reason.proto_name().to_owned(),
        domain: ERROR_DOMAIN.to_owned(),
        ..Default::default()
    }
}

/// Build an error with a code, a reason and a developer-facing message.
pub fn error(code: ErrorCode, reason: ErrorReason, message: &str) -> ConnectError {
    ConnectError::new(code, message.to_owned())
        .with_detail(ErrorDetail::from_message(ERROR_INFO, &error_info(reason)))
}

/// Build an `INVALID_ARGUMENT` error that names one request field.
///
/// `field` is a path in the request message, for example `writes[2].etag`.
pub fn invalid_argument(reason: ErrorReason, field: &str, description: &str) -> ConnectError {
    let violation = FieldViolation {
        field: field.to_owned(),
        description: description.to_owned(),
        reason: reason.proto_name().to_owned(),
        ..Default::default()
    };
    let bad_request = BadRequest {
        field_violations: vec![violation],
        ..Default::default()
    };
    error(
        ErrorCode::InvalidArgument,
        reason,
        "The request contains an invalid field.",
    )
    .with_detail(ErrorDetail::from_message(BAD_REQUEST, &bad_request))
}

/// Build an `INVALID_ARGUMENT` `INVALID_INPUT` error for one request field.
pub fn invalid_input(field: &str, description: &str) -> ConnectError {
    invalid_argument(ErrorReason::INVALID_INPUT, field, description)
}

/// Build a `NOT_FOUND` error that names the missing resource.
pub fn not_found(reason: ErrorReason, resource_type: &str, resource_name: &str) -> ConnectError {
    let info = ResourceInfo {
        resource_type: resource_type.to_owned(),
        resource_name: resource_name.to_owned(),
        ..Default::default()
    };
    error(
        ErrorCode::NotFound,
        reason,
        "The requested resource does not exist.",
    )
    .with_detail(ErrorDetail::from_message(RESOURCE_INFO, &info))
}

/// Build a `FAILED_PRECONDITION` error.
pub fn failed_precondition(reason: ErrorReason, message: &str) -> ConnectError {
    error(ErrorCode::FailedPrecondition, reason, message)
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
    Status {
        code: grpc_code(code),
        message: message.to_owned(),
        details: vec![Any::pack(
            &error_info(reason),
            format!("type.googleapis.com/{ERROR_INFO}"),
        )],
        ..Default::default()
    }
}

/// Return the numeric `google.rpc.Code` of a Connect code.
fn grpc_code(code: ErrorCode) -> i32 {
    match code {
        ErrorCode::Canceled => 1,
        ErrorCode::Unknown => 2,
        ErrorCode::InvalidArgument => 3,
        ErrorCode::DeadlineExceeded => 4,
        ErrorCode::NotFound => 5,
        ErrorCode::AlreadyExists => 6,
        ErrorCode::PermissionDenied => 7,
        ErrorCode::ResourceExhausted => 8,
        ErrorCode::FailedPrecondition => 9,
        ErrorCode::Aborted => 10,
        ErrorCode::OutOfRange => 11,
        ErrorCode::Unimplemented => 12,
        ErrorCode::Internal => 13,
        ErrorCode::Unavailable => 14,
        ErrorCode::DataLoss => 15,
        ErrorCode::Unauthenticated => 16,
        // `ErrorCode` is non-exhaustive. A future code maps to `UNKNOWN`.
        _ => 2,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use buffa::Message;

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
        let info = ErrorInfo::decode_from_slice(&detail.value).expect("ErrorInfo");
        assert_eq!(info.reason, "ACTIVITY_ETAG_MISMATCH");
        assert_eq!(info.domain, ERROR_DOMAIN);
    }
}
