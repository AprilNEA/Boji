//! AIP-158 pagination.
//!
//! Input: `page_size` and `page_token` request fields.
//! Output: a bounded page size, and opaque tokens that bind adapter page state
//! to its request. A domain cursor that is already opaque and bound to its
//! only method can pass through unchanged.
//! Pos: transport only.

use super::error::{invalid_argument, invalid_input};
use crate::proto::boji::v1::ErrorReason;
use connectrpc::ConnectError;
use serde::{Serialize, de::DeserializeOwned};

/// Resolve `page_size`: zero means `default`, values above `maximum` are
/// treated as `maximum`, and negative values are invalid.
pub fn page_size(value: i32, default: u32, maximum: u32) -> Result<u32, ConnectError> {
    match u32::try_from(value) {
        Ok(0) => Ok(default),
        Ok(value) => Ok(value.min(maximum)),
        Err(_) => Err(invalid_input(
            "page_size",
            "The value must not be negative.",
        )),
    }
}

/// Return the `INVALID_PAGE_TOKEN` error.
pub fn invalid_page_token() -> ConnectError {
    invalid_argument(
        ErrorReason::INVALID_PAGE_TOKEN,
        "page_token",
        "The token is not a `next_page_token` of the same request.",
    )
}

/// Encode an adapter page state as an opaque token.
pub fn encode<T: Serialize>(state: &T) -> String {
    // Serializing plain structs of strings and integers cannot fail.
    serde_json::to_vec(state)
        .map(hex::encode)
        .unwrap_or_default()
}

/// Decode an adapter page state, or return `INVALID_PAGE_TOKEN`.
pub fn decode<T: DeserializeOwned>(token: &str) -> Result<T, ConnectError> {
    let bytes = hex::decode(token).map_err(|_| invalid_page_token())?;
    serde_json::from_slice(&bytes).map_err(|_| invalid_page_token())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::Deserialize;

    #[test]
    fn page_size_applies_default_and_maximum() {
        assert_eq!(page_size(0, 50, 100).ok(), Some(50));
        assert_eq!(page_size(7, 50, 100).ok(), Some(7));
        assert_eq!(page_size(1000, 50, 100).ok(), Some(100));
        assert!(page_size(-1, 50, 100).is_err());
    }

    #[derive(Debug, Deserialize, PartialEq, Serialize)]
    struct State {
        next: String,
    }

    #[test]
    fn tokens_round_trip_and_reject_garbage() {
        let token = encode(&State {
            next: "2026-01-02".to_owned(),
        });
        assert_eq!(
            decode::<State>(&token).ok(),
            Some(State {
                next: "2026-01-02".to_owned()
            })
        );
        assert!(decode::<State>("not-hex").is_err());
        assert!(decode::<State>("00").is_err());
    }
}
