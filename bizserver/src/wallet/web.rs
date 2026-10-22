//! The Apple Wallet web service.
//!
//! Input: requests from Wallet to the `webServiceURL` of a pass.
//! Output: registrations, the serial numbers of changed passes, and the
//! latest signed pass.
//! Pos: Apple defines this protocol, so it is plain HTTP and JSON, not
//! ConnectRPC. `app::router` mounts it under `/wallet` when Wallet is configured.
//!
//! Wallet authenticates with `Authorization: ApplePass <token>`, where the token
//! is the `authenticationToken` of the pass. The list and log endpoints carry
//! no token. Every failed check returns `401` without a reason.

use std::sync::Arc;

use axum::{
    Json, Router,
    body::Bytes,
    extract::{DefaultBodyLimit, Path, Query, State},
    http::{HeaderMap, HeaderValue, StatusCode, header},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use chrono::{DateTime, Utc};
use sea_orm::DatabaseConnection;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::{CardStatus, MembershipCard, PKPASS_MIME_TYPE, PassSigner};
use crate::domain::membership_code::MembershipCodes;
use crate::domain::wallet::{self as store, Registration};

/// Where `app::router` mounts the web service. `webServiceURL` is the public
/// base URL followed by this path.
pub const PATH: &str = "/wallet";

/// Request bodies are a push token or a few log lines.
const MAX_BODY_BYTES: usize = 16 * 1024;
/// The longest device library identifier that the service stores.
const MAX_DEVICE_CHARS: usize = 128;
/// The longest push token that the service stores.
const MAX_PUSH_TOKEN_CHARS: usize = 256;
/// The most log lines that one request reports.
const MAX_LOG_LINES: usize = 20;

#[derive(Clone)]
struct WebService {
    db: DatabaseConnection,
    signer: Arc<PassSigner>,
    codes: Option<Arc<MembershipCodes>>,
}

/// The routes of the web service, relative to `webServiceURL`. `codes` adds
/// the QR code to each pass; `None` leaves passes without a barcode.
pub fn router(
    db: DatabaseConnection,
    signer: Arc<PassSigner>,
    codes: Option<Arc<MembershipCodes>>,
) -> Router {
    Router::new()
        .route(
            "/v1/devices/{device}/registrations/{pass_type}/{serial}",
            post(register).delete(unregister),
        )
        .route(
            "/v1/devices/{device}/registrations/{pass_type}",
            get(updated_passes),
        )
        .route("/v1/passes/{pass_type}/{serial}", get(latest_pass))
        .route("/v1/log", post(log))
        .layer(DefaultBodyLimit::max(MAX_BODY_BYTES))
        .with_state(WebService { db, signer, codes })
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PushTokenBody {
    push_token: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdatedQuery {
    passes_updated_since: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SerialNumbers {
    serial_numbers: Vec<String>,
    last_updated: String,
}

#[derive(Deserialize)]
struct LogBody {
    #[serde(default)]
    logs: Vec<String>,
}

/// A request that the service refuses.
enum Refusal {
    /// The token, the pass type or the serial number is wrong.
    Unauthorized,
    /// The path or the body is malformed.
    BadRequest,
    /// The signing certificate is not valid now.
    Unavailable,
    /// The database or the signer failed.
    Internal(&'static str),
}

impl IntoResponse for Refusal {
    fn into_response(self) -> Response {
        match self {
            Self::Unauthorized => StatusCode::UNAUTHORIZED.into_response(),
            Self::BadRequest => StatusCode::BAD_REQUEST.into_response(),
            Self::Unavailable => StatusCode::SERVICE_UNAVAILABLE.into_response(),
            Self::Internal(operation) => {
                tracing::error!(event = "wallet_web_service_failed", operation);
                StatusCode::INTERNAL_SERVER_ERROR.into_response()
            }
        }
    }
}

impl WebService {
    /// Check the pass type and the token of a request about one pass, and
    /// return the membership ID that the serial number names.
    fn authorize(
        &self,
        headers: &HeaderMap,
        pass_type: &str,
        serial: &str,
    ) -> Result<Uuid, Refusal> {
        let token = headers
            .get(header::AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .and_then(|value| value.strip_prefix("ApplePass "))
            .ok_or(Refusal::Unauthorized)?;
        if pass_type != self.signer.pass_type_identifier()
            || !self.signer.authenticates(serial, token.trim())
        {
            return Err(Refusal::Unauthorized);
        }
        // The token covers the exact serial string, and the server writes
        // serial numbers as hyphenated UUIDs.
        Uuid::try_parse(serial).map_err(|_| Refusal::Unauthorized)
    }
}

fn valid_device(device: &str) -> Result<(), Refusal> {
    let valid = !device.is_empty()
        && device.len() <= MAX_DEVICE_CHARS
        && device
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || byte == b'-');
    if valid {
        Ok(())
    } else {
        Err(Refusal::BadRequest)
    }
}

/// APNs device tokens are hexadecimal. The check also keeps the token safe in
/// the APNs request path.
fn valid_push_token(token: &str) -> bool {
    !token.is_empty()
        && token.len() <= MAX_PUSH_TOKEN_CHARS
        && token.bytes().all(|byte| byte.is_ascii_hexdigit())
}

/// The update tag: microseconds since the Unix epoch.
fn tag(time: DateTime<Utc>) -> String {
    time.timestamp_micros().to_string()
}

fn parse_tag(tag: &str) -> Option<DateTime<Utc>> {
    DateTime::from_timestamp_micros(tag.trim().parse().ok()?)
}

async fn register(
    State(service): State<WebService>,
    Path((device, pass_type, serial)): Path<(String, String, String)>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<StatusCode, Refusal> {
    let membership_id = service.authorize(&headers, &pass_type, &serial)?;
    valid_device(&device)?;
    let body: PushTokenBody = serde_json::from_slice(&body).map_err(|_| Refusal::BadRequest)?;
    if !valid_push_token(&body.push_token) {
        return Err(Refusal::BadRequest);
    }
    let exists = store::find_pass(&service.db, membership_id)
        .await
        .map_err(|_| Refusal::Internal("find_pass"))?
        .is_some();
    if !exists {
        return Err(Refusal::Unauthorized);
    }
    let registration = store::register(&service.db, &device, membership_id, &body.push_token)
        .await
        .map_err(|_| Refusal::Internal("register"))?;
    Ok(match registration {
        Registration::Created => StatusCode::CREATED,
        Registration::Updated => StatusCode::OK,
    })
}

async fn unregister(
    State(service): State<WebService>,
    Path((device, pass_type, serial)): Path<(String, String, String)>,
    headers: HeaderMap,
) -> Result<StatusCode, Refusal> {
    let membership_id = service.authorize(&headers, &pass_type, &serial)?;
    valid_device(&device)?;
    store::unregister(&service.db, &device, membership_id)
        .await
        .map_err(|_| Refusal::Internal("unregister"))?;
    Ok(StatusCode::OK)
}

async fn updated_passes(
    State(service): State<WebService>,
    Path((device, pass_type)): Path<(String, String)>,
    Query(query): Query<UpdatedQuery>,
) -> Result<Response, Refusal> {
    valid_device(&device)?;
    if pass_type != service.signer.pass_type_identifier() {
        return Ok(StatusCode::NO_CONTENT.into_response());
    }
    // An unreadable tag asks for every pass, which is always correct.
    let since = query.passes_updated_since.as_deref().and_then(parse_tag);
    let updated = store::updated_passes(&service.db, &device, since)
        .await
        .map_err(|_| Refusal::Internal("updated_passes"))?;
    Ok(match updated {
        Some(updated) => Json(SerialNumbers {
            serial_numbers: updated.serial_numbers.iter().map(Uuid::to_string).collect(),
            last_updated: tag(updated.last_updated),
        })
        .into_response(),
        None => StatusCode::NO_CONTENT.into_response(),
    })
}

/// Return the latest pass. A suspended card returns a voided pass, so Wallet
/// shows the status. The service ignores `If-Modified-Since`, because an HTTP
/// date has whole seconds and two changes can happen in one second.
async fn latest_pass(
    State(service): State<WebService>,
    Path((pass_type, serial)): Path<(String, String)>,
    headers: HeaderMap,
) -> Result<Response, Refusal> {
    let membership_id = service.authorize(&headers, &pass_type, &serial)?;
    let content = store::find_pass(&service.db, membership_id)
        .await
        .map_err(|_| Refusal::Internal("find_pass"))?
        .ok_or(Refusal::Unauthorized)?;
    let now = Utc::now();
    if !service.signer.is_current(now) {
        return Err(Refusal::Unavailable);
    }
    let membership = &content.membership;
    let membership_id = membership.id.to_string();
    let code = service
        .codes
        .as_deref()
        .map(|codes| codes.static_value(membership.id))
        .transpose()
        .map_err(|failure| {
            tracing::error!(event = "membership_code_failed", error = %failure);
            Refusal::Internal("membership_code")
        })?;
    let card = MembershipCard {
        membership_id: &membership_id,
        display_name: &membership.display_name,
        member_number: &membership.member_number,
        joined_at: membership.joined_at,
        expires_at: membership.expires_at,
        status: if membership.status == "active" {
            CardStatus::Active
        } else {
            CardStatus::Suspended
        },
        // Reserved: the pass does not read organization affiliations yet.
        organizations: &[],
        code: code.as_deref(),
    };
    let pass = service.signer.sign(&card).map_err(|failure| {
        tracing::error!(event = "wallet_signing_failed", error = %failure);
        Refusal::Internal("sign")
    })?;
    let last_modified = content.update_time.unwrap_or(now);
    let mut response = (
        [(
            header::CONTENT_TYPE,
            HeaderValue::from_static(PKPASS_MIME_TYPE),
        )],
        pass,
    )
        .into_response();
    if let Ok(value) = HeaderValue::from_str(
        &last_modified
            .format("%a, %d %b %Y %H:%M:%S GMT")
            .to_string(),
    ) {
        response.headers_mut().insert(header::LAST_MODIFIED, value);
    }
    Ok(response)
}

/// Record that Wallet reported problems. The messages can hold identifiers, so
/// only the count reaches the `INFO` log and Sentry breadcrumbs. Developers can
/// read the text at `DEBUG` level.
async fn log(body: Bytes) -> StatusCode {
    let Ok(body) = serde_json::from_slice::<LogBody>(&body) else {
        return StatusCode::BAD_REQUEST;
    };
    tracing::info!(event = "wallet_device_log", count = body.logs.len());
    for line in body.logs.iter().take(MAX_LOG_LINES) {
        let line: String = line.chars().take(512).collect();
        tracing::debug!(event = "wallet_device_log_line", line = %line);
    }
    StatusCode::OK
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn device_identifiers_and_push_tokens_are_checked() {
        assert!(valid_device("a1b2c3d4e5f6").is_ok());
        assert!(valid_device("").is_err());
        assert!(valid_device("a/b").is_err());
        assert!(valid_device(&"a".repeat(129)).is_err());
        assert!(valid_push_token("0123abcdEF"));
        assert!(!valid_push_token(""));
        assert!(!valid_push_token("abc/../x"));
        assert!(!valid_push_token(&"a".repeat(257)));
    }

    #[test]
    fn tags_round_trip_in_microseconds() {
        let time = DateTime::from_timestamp_micros(1_790_000_000_123_456).unwrap();
        assert_eq!(tag(time), "1790000000123456");
        assert_eq!(parse_tag("1790000000123456"), Some(time));
        assert_eq!(parse_tag("yesterday"), None);
    }
}
