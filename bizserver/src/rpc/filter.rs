//! The AIP-160 subset of `boji.admin.v1.ListMembershipsRequest.filter`.
//!
//! Input: a filter string.
//! Output: at most one `state` and one `member_number` equality.
//! Pos: transport only. `aip_160` parses the full AIP-160 grammar. This
//! module then accepts only comparisons joined with `AND`, where a comparison
//! is `state = ACTIVE|SUSPENDED` or `member_number = "<text>"`.

use super::error::invalid_argument;
use crate::proto::boji::v1::ErrorReason;
use aip_160::{Comparator, Expression, Restriction, StringMatch, parse_filter};
use connectrpc::ConnectError;

const SUPPORTED_FIELDS: &str = "The supported fields are `state` and `member_number`.";

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
    let parsed = parse_filter(text).map_err(|error| invalid_filter(&error.to_string()))?;
    let mut filter = MembershipFilter::default();
    let Some(expression) = &parsed.expression else {
        return Ok(filter);
    };
    let mut comparisons = Vec::new();
    collect_conjunction(expression, &mut comparisons)?;
    for restriction in comparisons {
        apply(&mut filter, restriction)?;
    }
    Ok(filter)
}

/// Collect the comparisons of an `AND` tree. Other operators are rejected.
fn collect_conjunction<'a>(
    expression: &'a Expression,
    comparisons: &mut Vec<&'a Restriction>,
) -> Result<(), ConnectError> {
    match expression {
        Expression::And(children) => {
            for child in children {
                collect_conjunction(child, comparisons)?;
            }
            Ok(())
        }
        Expression::Restriction(restriction) => {
            comparisons.push(restriction);
            Ok(())
        }
        Expression::Or(_)
        | Expression::Not(_)
        | Expression::Sequence(_)
        | Expression::Global(_) => Err(invalid_filter(
            "Join comparisons of the form `field = value` with `AND`. \
                 `OR`, `NOT`, `-` and bare values are not supported.",
        )),
    }
}

fn apply(filter: &mut MembershipFilter, restriction: &Restriction) -> Result<(), ConnectError> {
    let field = restriction
        .comparable
        .field_path()
        .ok_or_else(|| invalid_filter(SUPPORTED_FIELDS))?;
    if restriction.comparator != Comparator::Equal {
        return Err(invalid_filter(
            "Each comparison must have the form `field = value`.",
        ));
    }
    let value = restriction
        .arg
        .as_value()
        .ok_or_else(|| invalid_filter("The right side of a comparison must be a value."))?;
    match field.as_str() {
        "state" => {
            if filter.state.is_some() {
                return Err(duplicate_field());
            }
            filter.state = Some(match value.as_str() {
                "ACTIVE" => State::Active,
                "SUSPENDED" => State::Suspended,
                _ => return Err(invalid_filter("`state` must be ACTIVE or SUSPENDED.")),
            });
        }
        "member_number" => {
            if filter.member_number.is_some() {
                return Err(duplicate_field());
            }
            let Some(StringMatch::Exact(number)) = value.string_match() else {
                return Err(invalid_filter(
                    "`member_number` must be a quoted string without the `*` wildcard.",
                ));
            };
            filter.member_number = Some(number.to_owned());
        }
        _ => return Err(invalid_filter(SUPPORTED_FIELDS)),
    }
    Ok(())
}

fn duplicate_field() -> ConnectError {
    invalid_filter("Each field can appear only once.")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_supported_expressions() {
        assert_eq!(parse("").ok(), Some(MembershipFilter::default()));
        assert_eq!(parse("  ").ok(), Some(MembershipFilter::default()));
        assert_eq!(
            parse("state = SUSPENDED").ok(),
            Some(MembershipFilter {
                state: Some(State::Suspended),
                member_number: None,
            })
        );
        assert_eq!(
            parse(r#"state = "ACTIVE""#).ok(),
            Some(MembershipFilter {
                state: Some(State::Active),
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
        assert_eq!(
            parse(r#"(state = ACTIVE) AND member_number = 'a\"b'"#).ok(),
            Some(MembershipFilter {
                state: Some(State::Active),
                member_number: Some("a\"b".to_owned()),
            })
        );
    }

    #[test]
    fn rejects_unsupported_expressions() {
        for text in [
            "state",
            "state = active",
            "state != ACTIVE",
            "state : ACTIVE",
            "NOT state = ACTIVE",
            "-state = ACTIVE",
            "state = ACTIVE AND state = SUSPENDED",
            "state = ACTIVE OR state = SUSPENDED",
            "state = ACTIVE ANDmember_number = \"1\"",
            "state = ACTIVE member_number = \"1\"",
            "member_number = 1",
            "member_number = \"1",
            "member_number = \"1*\"",
            "member_number = (state = ACTIVE)",
            "membership.state = ACTIVE",
            "nickname = \"x\"",
            "regex(member_number, \"1\")",
            "state = ACTIVE AND member_number = \"1\" AND state = ACTIVE",
            "state = ACTIVE extra",
        ] {
            assert!(parse(text).is_err(), "{text:?} must be rejected");
        }
    }
}
