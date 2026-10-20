//! The AIP-160 subset of `boji.admin.v1.ListMembershipsRequest.filter`.
//!
//! Input: a filter string.
//! Output: at most one `state` and one `member_number` equality.
//! Pos: transport only. The grammar is `comparison [AND comparison]`, where a
//! comparison is `state = ACTIVE|SUSPENDED` or `member_number = "<text>"`.

use super::error::invalid_argument;
use crate::proto::boji::v1::ErrorReason;
use connectrpc::ConnectError;

/// A membership state in a filter.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum State {
    /// `state = ACTIVE`.
    Active,
    /// `state = SUSPENDED`.
    Suspended,
}

impl State {
    /// Return the persisted status value.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Active => "active",
            Self::Suspended => "suspended",
        }
    }
}

/// A parsed membership filter. Empty fields do not restrict the list.
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct MembershipFilter {
    /// The required card state.
    pub state: Option<State>,
    /// The exact member number, without normalization.
    pub member_number: Option<String>,
}

/// Return the `INVALID_FILTER` error with a description.
pub fn invalid_filter(description: &str) -> ConnectError {
    invalid_argument(ErrorReason::INVALID_FILTER, "filter", description)
}

/// Parse a membership filter. An empty string means no filter.
pub fn parse(text: &str) -> Result<MembershipFilter, ConnectError> {
    let mut filter = MembershipFilter::default();
    let mut rest = text.trim();
    if rest.is_empty() {
        return Ok(filter);
    }
    for index in 0..2 {
        let (field, after) = split_identifier(rest);
        rest = after
            .trim_start()
            .strip_prefix('=')
            .ok_or_else(|| invalid_filter("Each comparison must have the form `field = value`."))?
            .trim_start();
        match field {
            "state" if filter.state.is_none() => {
                let (value, after) = split_identifier(rest);
                filter.state = Some(match value {
                    "ACTIVE" => State::Active,
                    "SUSPENDED" => State::Suspended,
                    _ => return Err(invalid_filter("`state` must be ACTIVE or SUSPENDED.")),
                });
                rest = after;
            }
            "member_number" if filter.member_number.is_none() => {
                let (value, after) = split_string(rest)?;
                filter.member_number = Some(value.to_owned());
                rest = after;
            }
            "state" | "member_number" => {
                return Err(invalid_filter("Each field can appear only once."));
            }
            _ => {
                return Err(invalid_filter(
                    "The supported fields are `state` and `member_number`.",
                ));
            }
        }
        rest = rest.trim_start();
        if rest.is_empty() {
            return Ok(filter);
        }
        if index == 0 {
            rest = rest
                .strip_prefix("AND")
                .filter(|after| after.starts_with(char::is_whitespace))
                .ok_or_else(|| invalid_filter("Join two comparisons with `AND`."))?
                .trim_start();
        }
    }
    Err(invalid_filter(
        "The filter supports at most two comparisons.",
    ))
}

fn split_identifier(text: &str) -> (&str, &str) {
    let end = text
        .find(|character: char| !(character.is_ascii_alphanumeric() || character == '_'))
        .unwrap_or(text.len());
    text.split_at(end)
}

fn split_string(text: &str) -> Result<(&str, &str), ConnectError> {
    let invalid =
        || invalid_filter("`member_number` must be a quoted string without `\"` or `\\`.");
    let inner = text.strip_prefix('"').ok_or_else(invalid)?;
    let end = inner.find(['"', '\\']).ok_or_else(invalid)?;
    if inner[end..].starts_with('\\') {
        return Err(invalid());
    }
    Ok((&inner[..end], &inner[end + 1..]))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_supported_expressions() {
        assert_eq!(parse("").ok(), Some(MembershipFilter::default()));
        assert_eq!(
            parse("state = SUSPENDED").ok(),
            Some(MembershipFilter {
                state: Some(State::Suspended),
                member_number: None,
            })
        );
        assert_eq!(
            parse(r#"member_number="000 AND 1" AND state=ACTIVE"#).ok(),
            Some(MembershipFilter {
                state: Some(State::Active),
                member_number: Some("000 AND 1".to_owned()),
            })
        );
    }

    #[test]
    fn rejects_unsupported_expressions() {
        for text in [
            "state",
            "state = active",
            "state = ACTIVE AND state = SUSPENDED",
            "state = ACTIVE OR state = SUSPENDED",
            "state = ACTIVE ANDmember_number = \"1\"",
            "member_number = 1",
            "member_number = \"1",
            "member_number = \"a\\\"b\"",
            "nickname = \"x\"",
            "state = ACTIVE AND member_number = \"1\" AND state = ACTIVE",
            "state = ACTIVE extra",
        ] {
            assert!(parse(text).is_err(), "{text:?} must be rejected");
        }
    }
}
