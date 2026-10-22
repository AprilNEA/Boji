//! AIP-122 resource names.
//!
//! Input: resource name strings from requests.
//! Output: the ID segments of a name, ownership checks and canonical names.
//! Pos: transport only. Domain code receives plain IDs.

use super::error::{error, invalid_input};
use crate::domain::organization::OrganizationType;
use crate::proto::boji::v1::ErrorReason;
use connectrpc::{ConnectError, ErrorCode};
use uuid::Uuid;

/// The `{user}` alias for the caller in owner methods.
pub const ME: &str = "me";
/// The `{user}` wildcard for a read across users (AIP-159).
pub const ANY_USER: &str = "-";

/// Split `name` against a pattern of literal collection segments and IDs.
///
/// `pattern` lists the collection IDs. Each collection is followed by one ID
/// segment. `singleton` is an optional final literal segment, for example
/// `syncState`. The function returns the ID segments in order.
pub fn ids<'a, const N: usize>(
    name: &'a str,
    pattern: [&str; N],
    singleton: Option<&str>,
) -> Option<[&'a str; N]> {
    let mut segments = name.split('/');
    let mut ids = [""; N];
    for (slot, collection) in ids.iter_mut().zip(pattern) {
        if segments.next()? != collection {
            return None;
        }
        let id = segments.next()?;
        if !valid_id(id) {
            return None;
        }
        *slot = id;
    }
    if let Some(singleton) = singleton
        && segments.next()? != singleton
    {
        return None;
    }
    segments.next().is_none().then_some(ids)
}

/// Parse `name` or return `INVALID_ARGUMENT` for `field`.
pub fn parse<'a, const N: usize>(
    field: &str,
    name: &'a str,
    pattern: [&str; N],
    singleton: Option<&str>,
    form: &str,
) -> Result<[&'a str; N], ConnectError> {
    ids(name, pattern, singleton)
        .ok_or_else(|| invalid_input(field, &format!("The value must have the form `{form}`.")))
}

/// Parse a UUID segment or return `INVALID_ARGUMENT` for `field`.
pub fn uuid(field: &str, segment: &str) -> Result<Uuid, ConnectError> {
    Uuid::parse_str(segment)
        .map_err(|_| invalid_input(field, "The resource ID segment must be a UUID."))
}

/// Parse the `{affiliation}` segment, which is an organization type in
/// lowercase, or return `INVALID_ARGUMENT` for `field`.
pub fn organization_type(field: &str, segment: &str) -> Result<OrganizationType, ConnectError> {
    OrganizationType::parse(segment).ok_or_else(|| {
        invalid_input(
            field,
            "The affiliation ID must be an organization type in lowercase, for example `school`.",
        )
    })
}

/// Check that the `{user}` segment of an owner method names the caller.
///
/// Another user returns `PERMISSION_DENIED` before any lookup, so the caller
/// learns nothing about the resources of other users (AIP-211).
pub fn require_caller(segment: &str, caller: &str) -> Result<(), ConnectError> {
    if segment == ME || segment == caller {
        Ok(())
    } else {
        Err(error(
            ErrorCode::PermissionDenied,
            ErrorReason::RESOURCE_ACCESS_DENIED,
            "The caller can only access its own resources.",
        ))
    }
}

/// Return true when an operations request names `owner` or every user.
pub fn matches_user(segment: &str, owner: &str) -> bool {
    segment == ANY_USER || segment == owner
}

/// `users/{user}/memberships/{membership}`.
pub fn membership(user: &str, membership: &str) -> String {
    format!("users/{user}/memberships/{membership}")
}

/// `users/{user}/memberships/{membership}/pass`.
pub fn membership_pass(user: &str, membership: &str) -> String {
    format!("users/{user}/memberships/{membership}/pass")
}

/// `users/{user}/memberships/{membership}/entitlementGrants/{entitlement}`.
pub fn entitlement_grant(user: &str, membership: &str, entitlement: &str) -> String {
    format!("users/{user}/memberships/{membership}/entitlementGrants/{entitlement}")
}

/// `entitlements/{entitlement}`.
pub fn entitlement(entitlement: &str) -> String {
    format!("entitlements/{entitlement}")
}

/// `users/{user}/activities/{activity}`.
pub fn activity(user: &str, activity: &str) -> String {
    format!("users/{user}/activities/{activity}")
}

/// `users/{user}/syncState`.
pub fn sync_state(user: &str) -> String {
    format!("users/{user}/syncState")
}

/// The `{organization}` wildcard of `ListOrganizationStandings` for the ranking
/// of one type.
pub const ANY_ORGANIZATION: &str = "-";

/// `organizations/{organization}`.
pub fn organization(organization: &Uuid) -> String {
    format!("organizations/{organization}")
}

/// `organizations/{organization}/standing`.
pub fn organization_standing(organization: &Uuid) -> String {
    format!("organizations/{organization}/standing")
}

/// `users/{user}/affiliations/{affiliation}`, where `{affiliation}` is the
/// organization type.
pub fn affiliation(user: &str, kind: OrganizationType) -> String {
    format!("users/{user}/affiliations/{}", kind.as_str())
}

/// `users/{user}/affiliations/{affiliation}/emailVerifications/{email_verification}`.
pub fn affiliation_email_verification(
    user: &str,
    kind: OrganizationType,
    verification: &Uuid,
) -> String {
    format!(
        "users/{user}/affiliations/{}/emailVerifications/{verification}",
        kind.as_str()
    )
}

fn valid_id(segment: &str) -> bool {
    !segment.is_empty() && segment.len() <= 128 && !segment.chars().any(char::is_control)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn splits_collection_names_and_singletons() {
        assert_eq!(
            ids("users/u1/memberships/m1", ["users", "memberships"], None),
            Some(["u1", "m1"])
        );
        assert_eq!(
            ids("users/me/syncState", ["users"], Some("syncState")),
            Some(["me"])
        );
        assert_eq!(ids("users/u1", ["users"], None), Some(["u1"]));
    }

    #[test]
    fn rejects_malformed_names() {
        for name in [
            "",
            "users",
            "users/",
            "users/u1/",
            "users/u1/memberships",
            "users/u1/memberships/m1/extra",
            "accounts/u1/memberships/m1",
            "users//memberships/m1",
        ] {
            assert_eq!(
                ids(name, ["users", "memberships"], None),
                None,
                "{name:?} must not parse"
            );
        }
        assert_eq!(
            ids("users/u1/syncStates", ["users"], Some("syncState")),
            None
        );
        assert_eq!(ids("users/u1", ["users"], Some("syncState")), None);
    }

    #[test]
    fn owner_methods_accept_only_the_caller() {
        assert!(require_caller("me", "u1").is_ok());
        assert!(require_caller("u1", "u1").is_ok());
        assert!(require_caller("u2", "u1").is_err());
        assert!(require_caller("-", "u1").is_err());
    }
}
