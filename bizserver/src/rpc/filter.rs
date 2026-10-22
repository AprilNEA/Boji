//! The AIP-160 subsets of the list filters: memberships, organizations,
//! organization standings and the operations list of affiliations.
//!
//! Input: a filter string.
//! Output: at most one `state` and one `member_number` equality; or at most
//! one `type` equality, one `region_code` equality and one free text; or one
//! `type` equality; or one `organization` equality.
//! Pos: transport only. `aip_160` parses the full AIP-160 grammar. This
//! module then accepts only comparisons joined with `AND`, where a comparison
//! is `state = ACTIVE|SUSPENDED` or `member_number = "<text>"`. The organization
//! filter also accepts one bare or quoted text.

use super::error::invalid_argument;
use crate::domain::organization::OrganizationType;
use crate::proto::boji::v1::ErrorReason;
use aip_160::{Comparable, Comparator, Expression, Restriction, StringMatch, parse_filter};
use connectrpc::ConnectError;
use uuid::Uuid;

const SUPPORTED_FIELDS: &str = "The supported fields are `state` and `member_number`.";

/// The maximum number of characters of the free text of an organization filter.
const MAX_ORGANIZATION_TEXT: usize = 64;

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

/// A parsed organization filter. Empty fields do not restrict the list.
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct OrganizationFilter {
    /// The organization type.
    pub organization_type: Option<OrganizationType>,
    /// The exact region code.
    pub region_code: Option<String>,
    /// The free text, matched as a case-insensitive substring.
    pub text: Option<String>,
}

/// One term of an organization filter.
enum OrganizationTerm<'a> {
    Restriction(&'a Restriction),
    Text(&'a Comparable),
}

/// Parse an organization filter. An empty string means no filter.
pub fn parse_organization(text: &str) -> Result<OrganizationFilter, ConnectError> {
    let parsed = parse_filter(text).map_err(|error| invalid_filter(&error.to_string()))?;
    let mut filter = OrganizationFilter::default();
    let Some(expression) = &parsed.expression else {
        return Ok(filter);
    };
    let mut terms = Vec::new();
    collect_organization_terms(expression, &mut terms)?;
    for term in terms {
        match term {
            OrganizationTerm::Restriction(restriction) => apply_field(&mut filter, restriction)?,
            OrganizationTerm::Text(comparable) => apply_text(&mut filter, comparable)?,
        }
    }
    Ok(filter)
}

fn collect_organization_terms<'a>(
    expression: &'a Expression,
    terms: &mut Vec<OrganizationTerm<'a>>,
) -> Result<(), ConnectError> {
    match expression {
        Expression::And(children) => {
            for child in children {
                collect_organization_terms(child, terms)?;
            }
            Ok(())
        }
        Expression::Restriction(restriction) => {
            terms.push(OrganizationTerm::Restriction(restriction));
            Ok(())
        }
        Expression::Global(comparable) => {
            terms.push(OrganizationTerm::Text(comparable));
            Ok(())
        }
        Expression::Sequence(_) => Err(invalid_filter(
            "Quote a text that contains spaces, for example `\"Jiao Tong\"`.",
        )),
        Expression::Or(_) | Expression::Not(_) => Err(invalid_filter(
            "Join terms with `AND`. `OR`, `NOT` and `-` are not supported.",
        )),
    }
}

fn apply_field(
    filter: &mut OrganizationFilter,
    restriction: &Restriction,
) -> Result<(), ConnectError> {
    match restriction.comparable.field_path().as_deref() {
        Some("type") => {
            if filter.organization_type.is_some() {
                return Err(duplicate_field());
            }
            filter.organization_type = Some(organization_type(restriction)?);
            Ok(())
        }
        Some("region_code") => apply_region(filter, restriction),
        _ => Err(invalid_filter(
            "The supported fields are `type` and `region_code`. Other text must be a bare or quoted value.",
        )),
    }
}

/// Parse the value of a `type = SCHOOL` comparison.
fn organization_type(restriction: &Restriction) -> Result<OrganizationType, ConnectError> {
    let form = || invalid_filter("The comparison must have the form `type = SCHOOL`.");
    if restriction.comparator != Comparator::Equal {
        return Err(form());
    }
    let value = restriction.arg.as_value().ok_or_else(form)?.as_str();
    // The filter uses the enum value name of `boji.v1.OrganizationType`.
    let known = value
        .bytes()
        .all(|byte| byte.is_ascii_uppercase() || byte == b'_');
    known
        .then(|| OrganizationType::parse(&value.to_ascii_lowercase()))
        .flatten()
        .ok_or_else(|| invalid_filter("`type` must be an organization type such as SCHOOL."))
}

/// Parse the filter of `ListOrganizationStandings`.
///
/// The filter is empty, or one comparison `type = SCHOOL`.
pub fn parse_standing(text: &str) -> Result<Option<OrganizationType>, ConnectError> {
    let parsed = parse_filter(text).map_err(|error| invalid_filter(&error.to_string()))?;
    let Some(mut expression) = parsed.expression.as_ref() else {
        return Ok(None);
    };
    while let Expression::And(children) = expression {
        match children.as_slice() {
            [only] => expression = only,
            _ => {
                return Err(invalid_filter(
                    "The filter must have the form `type = SCHOOL`.",
                ));
            }
        }
    }
    let Expression::Restriction(restriction) = expression else {
        return Err(invalid_filter(
            "The filter must have the form `type = SCHOOL`.",
        ));
    };
    if restriction.comparable.field_path().as_deref() != Some("type") {
        return Err(invalid_filter(
            "The filter must have the form `type = SCHOOL`.",
        ));
    }
    organization_type(restriction).map(Some)
}

fn apply_region(
    filter: &mut OrganizationFilter,
    restriction: &Restriction,
) -> Result<(), ConnectError> {
    if restriction.comparator != Comparator::Equal {
        return Err(invalid_filter(
            "The comparison must have the form `region_code = \"CN\"`.",
        ));
    }
    if filter.region_code.is_some() {
        return Err(duplicate_field());
    }
    let code = restriction
        .arg
        .as_value()
        .map(|value| value.as_str())
        .filter(|code| code.len() == 2 && code.bytes().all(|byte| byte.is_ascii_uppercase()))
        .ok_or_else(|| {
            invalid_filter("`region_code` must be an ISO 3166-1 alpha-2 code such as \"CN\".")
        })?;
    filter.region_code = Some(code.to_owned());
    Ok(())
}

fn apply_text(
    filter: &mut OrganizationFilter,
    comparable: &Comparable,
) -> Result<(), ConnectError> {
    let member = comparable
        .as_member()
        .ok_or_else(|| invalid_filter("Functions are not supported."))?;
    // An unquoted domain such as `xjtlu.edu.cn` parses as a field path.
    let text = if member.is_simple() {
        member.value.as_str().to_owned()
    } else {
        member
            .field_path()
            .ok_or_else(|| invalid_filter("Quote a text that contains a quoted part."))?
    };
    let length = text.chars().count();
    if length == 0 || length > MAX_ORGANIZATION_TEXT {
        return Err(invalid_filter("The text must contain 1 to 64 characters."));
    }
    if filter.text.is_some() {
        return Err(invalid_filter("The filter can contain only one text."));
    }
    filter.text = Some(text);
    Ok(())
}

/// The only expression that `ListAffiliations` accepts.
const ORGANIZATION_AFFILIATION_FORM: &str =
    "The filter must have the form `organization = \"organizations/<organization>\"`.";

/// Parse the filter of the operations `ListAffiliations`.
///
/// The filter is empty, or one comparison `organization = "organizations/<organization>"`. The
/// result is the organization ID.
pub fn parse_affiliation(text: &str) -> Result<Option<Uuid>, ConnectError> {
    let parsed = parse_filter(text).map_err(|error| invalid_filter(&error.to_string()))?;
    let Some(mut expression) = parsed.expression.as_ref() else {
        return Ok(None);
    };
    // A single comparison can arrive inside a conjunction of one term.
    while let Expression::And(children) = expression {
        match children.as_slice() {
            [only] => expression = only,
            _ => return Err(invalid_filter(ORGANIZATION_AFFILIATION_FORM)),
        }
    }
    let Expression::Restriction(restriction) = expression else {
        return Err(invalid_filter(ORGANIZATION_AFFILIATION_FORM));
    };
    if restriction.comparable.field_path().as_deref() != Some("organization")
        || restriction.comparator != Comparator::Equal
    {
        return Err(invalid_filter(ORGANIZATION_AFFILIATION_FORM));
    }
    restriction
        .arg
        .as_value()
        .and_then(|value| value.as_str().strip_prefix("organizations/"))
        .and_then(|id| Uuid::parse_str(id).ok())
        .map(Some)
        .ok_or_else(|| {
            invalid_filter("`organization` must be a quoted organization name with a UUID.")
        })
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

    fn organization(region_code: Option<&str>, text: Option<&str>) -> OrganizationFilter {
        OrganizationFilter {
            organization_type: None,
            region_code: region_code.map(str::to_owned),
            text: text.map(str::to_owned),
        }
    }

    #[test]
    fn parses_organization_filters() {
        assert_eq!(
            parse_organization("").ok(),
            Some(OrganizationFilter::default())
        );
        assert_eq!(
            parse_organization("交通").ok(),
            Some(organization(None, Some("交通")))
        );
        assert_eq!(
            parse_organization(r#""Jiao Tong""#).ok(),
            Some(organization(None, Some("Jiao Tong")))
        );
        assert_eq!(
            parse_organization("xjtlu.edu.cn").ok(),
            Some(organization(None, Some("xjtlu.edu.cn")))
        );
        assert_eq!(
            parse_organization(r#"region_code = "CN" AND 交通"#).ok(),
            Some(organization(Some("CN"), Some("交通")))
        );
        assert_eq!(
            parse_organization("region_code = AU").ok(),
            Some(organization(Some("AU"), None))
        );
        assert_eq!(
            parse_organization(r#"type = SCHOOL AND region_code = "CN" AND 交通"#).ok(),
            Some(OrganizationFilter {
                organization_type: Some(OrganizationType::School),
                ..organization(Some("CN"), Some("交通"))
            })
        );
    }

    #[test]
    fn parses_the_standing_filter() {
        assert_eq!(parse_standing("").ok(), Some(None));
        assert_eq!(
            parse_standing("type = SCHOOL").ok(),
            Some(Some(OrganizationType::School))
        );
        for text in [
            "type = school",
            "type = COMPANY",
            "type = ORGANIZATION_TYPE_UNSPECIFIED",
            "type != SCHOOL",
            "type = SCHOOL AND region_code = CN",
            "type = SCHOOL OR type = SCHOOL",
            "region_code = CN",
            "SCHOOL",
        ] {
            assert!(parse_standing(text).is_err(), "{text:?} must be rejected");
        }
    }

    #[test]
    fn rejects_unsupported_organization_filters() {
        let long = "a".repeat(65);
        for text in [
            "Jiao Tong",
            "region_code = cn",
            "region_code = CHN",
            "region_code != CN",
            "state = ACTIVE",
            "region_code = CN AND region_code = AU",
            "type = school",
            "type = UNKNOWN",
            "type = SCHOOL AND type = SCHOOL",
            "a AND b",
            "a OR b",
            "NOT a",
            "regex(a, \"b\")",
            "\"\"",
            long.as_str(),
        ] {
            assert!(
                parse_organization(text).is_err(),
                "{text:?} must be rejected"
            );
        }
    }

    #[test]
    fn parses_the_affiliation_filter() {
        let id = "0b6f3a8e-6f0c-4a3b-9f3e-2d1c0b9a8f7e";
        assert_eq!(parse_affiliation("").ok(), Some(None));
        assert_eq!(
            parse_affiliation(&format!(r#"organization = "organizations/{id}""#)).ok(),
            Some(Some(Uuid::parse_str(id).unwrap()))
        );
        for text in [
            r#"organization = "organizations/not-a-uuid""#,
            r#"organization = "users/u1""#,
            r#"organization != "organizations/0b6f3a8e-6f0c-4a3b-9f3e-2d1c0b9a8f7e""#,
            r#"state = ACTIVE"#,
            r#"organization = "organizations/0b6f3a8e-6f0c-4a3b-9f3e-2d1c0b9a8f7e" AND state = ACTIVE"#,
            r#"organization = "organizations/0b6f3a8e-6f0c-4a3b-9f3e-2d1c0b9a8f7e" OR organization = "organizations/0b6f3a8e-6f0c-4a3b-9f3e-2d1c0b9a8f7f""#,
            "xjtlu",
        ] {
            assert!(parse_affiliation(text).is_err(), "{text}");
        }
    }
}
