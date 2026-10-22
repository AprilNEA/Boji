//! Application-owned roles configured on the native Better Auth admin plugin.

use std::collections::HashMap;

use better_auth::plugins::admin::{AdminPlugin, RolePermissions};

/// Register only business permissions; account mutation and impersonation stay denied.
///
/// `operator` and `admin` have identical business grants. Neither has implicit
/// access to user deletion, password changes, role assignment, or impersonation.
/// Role assignment is an explicit server operator action, never self-service.
pub fn plugin() -> AdminPlugin {
    let business = RolePermissions::new()
        .allow("membership", ["read", "update"])
        .allow("entitlement", ["read", "grant", "revoke"])
        .allow("organization", ["read", "update"]);
    AdminPlugin::new().roles(HashMap::from([
        ("user".to_owned(), RolePermissions::new()),
        ("operator".to_owned(), business.clone()),
        ("admin".to_owned(), business),
    ]))
}
