//! Lifecycle, pagination, and wire-format administration contracts.

use super::{
    ACTIVITIES, ADMIN_ENTITLEMENTS, ADMIN_MEMBERSHIPS, MEMBERSHIPS, admin_harness::Harness,
    assert_connect_error, catalog, entitlement_name, last_segment, ok_json, parse_rfc3339,
};
use boji_bizserver::proto::boji::{admin::v1 as a, v1 as p};
use buffa::Message;
use chrono::{Datelike, SecondsFormat, Utc};
use reqwest::StatusCode;
use serde_json::{Value, json};
use uuid::Uuid;

fn records<'a>(body: &'a Value, field: &str) -> &'a Vec<Value> {
    body[field]
        .as_array()
        .unwrap_or_else(|| panic!("{field} in {body}"))
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn admin_rpcs_preserve_membership_activity_and_sessions() {
    let mut harness = Harness::setup().await;
    let operator = harness.register_verified("operator").await;
    harness.set_role(&operator.user_id, "operator").await;
    let _operator_card = harness.enroll(&operator, "Operator").await;
    let owner = harness.register_verified("owner").await;
    let card = harness.enroll(&owner, "Owner").await;

    let memberships = ok_json(
        harness
            .rpc_json(
                &format!("{ADMIN_MEMBERSHIPS}/ListMemberships"),
                Some(&operator.token),
                json!({"parent":"users/-","pageSize":100}),
            )
            .await,
    )
    .await;
    let listed = records(&memberships, "memberships")
        .iter()
        .find(|record| record["name"] == card.name)
        .expect("listed owner card");
    assert_eq!(listed["memberNumber"], card.member_number);
    assert_eq!(listed["state"], "ACTIVE");
    assert!(
        listed.get("entitlements").is_none(),
        "the default view is basic"
    );

    let by_number = ok_json(
        harness
            .rpc_json(
                &format!("{ADMIN_MEMBERSHIPS}/ListMemberships"),
                Some(&operator.token),
                json!({
                    "parent":"users/-",
                    "filter":format!("member_number = \"{}\"", card.member_number),
                    "view":"MEMBERSHIP_VIEW_FULL",
                }),
            )
            .await,
    )
    .await;
    let found = records(&by_number, "memberships");
    assert_eq!(found.len(), 1);
    assert_eq!(found[0]["name"], card.name);
    assert!(found[0].get("email").is_none());
    assert_eq!(records(&found[0], "entitlements").len(), 3);

    let fetched = ok_json(
        harness
            .rpc_json(
                &format!("{ADMIN_MEMBERSHIPS}/GetMembership"),
                Some(&operator.token),
                json!({"name":format!("users/-/memberships/{}", card.membership_id)}),
            )
            .await,
    )
    .await;
    assert_eq!(
        fetched["name"], card.name,
        "the response uses the canonical name"
    );
    assert_eq!(
        records(&fetched, "entitlements").len(),
        3,
        "the default view is full"
    );

    let grants = ok_json(
        harness
            .rpc_json(
                &format!("{ADMIN_MEMBERSHIPS}/ListEntitlementGrants"),
                Some(&operator.token),
                json!({"parent":card.name}),
            )
            .await,
    )
    .await;
    assert_eq!(records(&grants, "entitlementGrants").len(), 3);
    assert!(
        records(&grants, "entitlementGrants")
            .iter()
            .all(|grant| grant["effective"] == true)
    );

    let entries = catalog(&harness, &operator).await;
    let entitlement = entitlement_name(&entries, "local_tracking");
    let entry = ok_json(
        harness
            .rpc_json(
                &format!("{ADMIN_ENTITLEMENTS}/GetEntitlement"),
                Some(&operator.token),
                json!({"name":entitlement}),
            )
            .await,
    )
    .await;
    assert_eq!(entry["code"], "local_tracking");
    assert_eq!(entry["state"], "ACTIVE");

    let now = Utc::now();
    ok_json(
        harness
            .rpc_json(
                &format!("{ACTIVITIES}/UpdateSyncState"),
                Some(&owner.token),
                json!({"syncState":{
                    "name":"users/me/syncState",
                    "enabled":true,
                    "consentVersion":"activity-sync-v1",
                }}),
            )
            .await,
    )
    .await;
    let written = ok_json(
        harness
            .rpc_json(
                &format!("{ACTIVITIES}/BatchWriteActivities"),
                Some(&owner.token),
                json!({"parent":"users/me","writes":[{
                    "requestId":Uuid::new_v4().to_string(),
                    "upsert":{
                        "name":format!("users/me/activities/{}", Uuid::new_v4()),
                        "hydration":{"amountMl":250},
                        "source":"MANUAL",
                        "occurTime":now.to_rfc3339_opts(SecondsFormat::Millis, true),
                        "timeZone":"UTC",
                    },
                }]}),
            )
            .await,
    )
    .await;
    assert!(
        written["writeResults"][0]["status"].get("code").is_none(),
        "the write succeeds: {written}"
    );

    let suspended = ok_json(
        harness
            .rpc_json(
                &format!("{ADMIN_MEMBERSHIPS}/SuspendMembership"),
                Some(&operator.token),
                json!({"name":card.name,"reason":"membership review"}),
            )
            .await,
    )
    .await;
    assert_eq!(suspended["state"], "SUSPENDED");
    assert!(
        suspended.get("entitlements").is_none(),
        "mutations return the basic view"
    );
    assert_eq!(
        harness.latest_audit().await,
        (
            "membership.status.updated".into(),
            "membership review".into()
        )
    );
    assert!(harness.session_is_active(&owner.user_id).await);
    assert!(
        harness
            .client
            .get(format!("{}/api/auth/get-session", harness.origin))
            .bearer_auth(&owner.token)
            .send()
            .await
            .expect("read owner session while suspended")
            .status()
            .is_success()
    );
    let own_card = ok_json(
        harness
            .rpc_json(
                &format!("{MEMBERSHIPS}/GetMembership"),
                Some(&owner.token),
                json!({"name":format!("users/me/memberships/{}", card.membership_id)}),
            )
            .await,
    )
    .await;
    assert_eq!(own_card["state"], "SUSPENDED");
    let typed: p::Membership = serde_json::from_value(own_card).expect("typed membership");
    assert!(typed.entitlements.is_empty());
    let day = json!({"year":now.year(),"month":now.month(),"day":now.day()});
    let summary = ok_json(
        harness
            .rpc_json(
                &format!("{ACTIVITIES}/SummarizeActivities"),
                Some(&owner.token),
                json!({"parent":"users/me","startDate":day,"endDate":day}),
            )
            .await,
    )
    .await;
    assert_eq!(summary["dailySummaries"][0]["waterMl"], 250);

    let resumed = ok_json(
        harness
            .rpc_json(
                &format!("{ADMIN_MEMBERSHIPS}/ResumeMembership"),
                Some(&operator.token),
                json!({"name":card.name,"reason":"  review resolved  "}),
            )
            .await,
    )
    .await;
    assert_eq!(resumed["state"], "ACTIVE");
    assert_eq!(harness.latest_audit().await.1, "review resolved");

    let grant_name = format!(
        "{}/entitlementGrants/{}",
        card.name,
        last_segment(&entitlement)
    );
    let revoked = ok_json(
        harness
            .rpc_json(
                &format!("{ADMIN_MEMBERSHIPS}/RevokeEntitlementGrant"),
                Some(&operator.token),
                json!({"name":grant_name,"reason":"remove test access"}),
            )
            .await,
    )
    .await;
    assert_eq!(revoked["name"], grant_name);
    assert!(revoked["revokeTime"].is_string());
    assert!(
        revoked.get("effective").is_none(),
        "false is omitted in JSON"
    );

    let expire_time =
        (Utc::now() + chrono::Duration::days(1)).to_rfc3339_opts(SecondsFormat::Millis, true);
    let granted = ok_json(
        harness
            .rpc_json(
                &format!("{ADMIN_MEMBERSHIPS}/GrantEntitlement"),
                Some(&operator.token),
                json!({
                    "parent":card.name,
                    "entitlement":entitlement,
                    "expireTime":expire_time,
                    "reason":"restore test access",
                }),
            )
            .await,
    )
    .await;
    let grant = &granted["entitlementGrant"];
    assert_eq!(grant["name"], grant_name);
    assert_eq!(grant["entitlement"], entitlement);
    assert!(grant.get("revokeTime").is_none());
    assert_eq!(
        parse_rfc3339(grant["expireTime"].as_str().expect("expiry")),
        parse_rfc3339(&expire_time)
    );
    let fetched_grant = ok_json(
        harness
            .rpc_json(
                &format!("{ADMIN_MEMBERSHIPS}/GetEntitlementGrant"),
                Some(&operator.token),
                json!({"name":grant_name}),
            )
            .await,
    )
    .await;
    assert_eq!(&fetched_grant, grant);
    assert_eq!(harness.audit_count().await, 4);

    harness.shutdown().await;
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn admin_lists_use_stable_bound_page_tokens_and_accept_protobuf() {
    let mut harness = Harness::setup().await;
    let operator = harness.register_verified("token-operator").await;
    harness.set_role(&operator.user_id, "operator").await;
    let operator_card = harness.enroll(&operator, "Token operator").await;
    let owner = harness.register_verified("token-owner").await;
    let owner_card = harness.enroll(&owner, "Token owner").await;
    let list_memberships = format!("{ADMIN_MEMBERSHIPS}/ListMemberships");
    let list_entitlements = format!("{ADMIN_ENTITLEMENTS}/ListEntitlements");

    let first = ok_json(
        harness
            .rpc_json(
                &list_memberships,
                Some(&operator.token),
                json!({"parent":"users/-","pageSize":1}),
            )
            .await,
    )
    .await;
    let token = first["nextPageToken"]
        .as_str()
        .filter(|value| !value.is_empty())
        .expect("membership page token")
        .to_owned();
    let first_name = first["memberships"][0]["name"]
        .as_str()
        .expect("first name")
        .to_owned();
    let later_owner = harness.register_verified("token-later-owner").await;
    let _later_card = harness.enroll(&later_owner, "Later token owner").await;
    let second = ok_json(
        harness
            .rpc_json(
                &list_memberships,
                Some(&operator.token),
                json!({"parent":"users/-","pageSize":1,"pageToken":token}),
            )
            .await,
    )
    .await;
    let second_name = second["memberships"][0]["name"]
        .as_str()
        .expect("second name");
    assert_ne!(second_name, first_name);
    assert!(second_name == operator_card.name || second_name == owner_card.name);

    for request in [
        json!({"parent":"users/-","pageSize":1,"pageToken":token,"filter":"state = ACTIVE"}),
        json!({"parent":"users/-","pageSize":1,"pageToken":token,"view":"MEMBERSHIP_VIEW_FULL"}),
        json!({"parent":format!("users/{}", owner.user_id),"pageToken":token}),
    ] {
        assert_connect_error(
            harness
                .rpc_json(&list_memberships, Some(&operator.token), request)
                .await,
            StatusCode::BAD_REQUEST,
            "invalid_argument",
            "INVALID_PAGE_TOKEN",
        )
        .await;
    }
    assert_connect_error(
        harness
            .rpc_json(
                &list_entitlements,
                Some(&operator.token),
                json!({"pageSize":1,"pageToken":token}),
            )
            .await,
        StatusCode::BAD_REQUEST,
        "invalid_argument",
        "INVALID_PAGE_TOKEN",
    )
    .await;

    let first_entries = ok_json(
        harness
            .rpc_json(
                &list_entitlements,
                Some(&operator.token),
                json!({"pageSize":1}),
            )
            .await,
    )
    .await;
    let entry_token = first_entries["nextPageToken"]
        .as_str()
        .filter(|value| !value.is_empty())
        .expect("catalog page token")
        .to_owned();
    harness.add_catalog_entry("00_admin_contract_before").await;
    let second_entries = ok_json(
        harness
            .rpc_json(
                &list_entitlements,
                Some(&operator.token),
                json!({"pageSize":1,"pageToken":entry_token}),
            )
            .await,
    )
    .await;
    assert_ne!(
        second_entries["entitlements"][0]["code"],
        "00_admin_contract_before"
    );
    assert_ne!(
        second_entries["entitlements"][0]["code"],
        first_entries["entitlements"][0]["code"]
    );

    let list_grants = format!("{ADMIN_MEMBERSHIPS}/ListEntitlementGrants");
    let mut names = Vec::new();
    let mut page_token = String::new();
    loop {
        let page = ok_json(
            harness
                .rpc_json(
                    &list_grants,
                    Some(&operator.token),
                    json!({"parent":owner_card.name,"pageSize":1,"pageToken":page_token}),
                )
                .await,
        )
        .await;
        names.extend(
            records(&page, "entitlementGrants")
                .iter()
                .map(|grant| grant["name"].as_str().expect("grant name").to_owned()),
        );
        page_token = page["nextPageToken"]
            .as_str()
            .unwrap_or_default()
            .to_owned();
        if page_token.is_empty() {
            break;
        }
        assert_connect_error(
            harness
                .rpc_json(
                    &list_grants,
                    Some(&operator.token),
                    json!({"parent":operator_card.name,"pageToken":page_token}),
                )
                .await,
            StatusCode::BAD_REQUEST,
            "invalid_argument",
            "INVALID_PAGE_TOKEN",
        )
        .await;
    }
    assert_eq!(names.len(), 3);
    assert!(names.iter().all(|name| name.starts_with(&owner_card.name)));

    let request = a::ListEntitlementsRequest {
        page_size: 1,
        ..Default::default()
    };
    let binary = harness
        .rpc_proto(&list_entitlements, &operator.token, request.encode_to_vec())
        .await;
    assert_eq!(binary.status(), StatusCode::OK);
    assert!(
        binary
            .headers()
            .get("content-type")
            .expect("protobuf content type")
            .to_str()
            .expect("UTF-8 content type")
            .starts_with("application/proto")
    );
    let bytes = binary.bytes().await.expect("protobuf response bytes");
    let decoded =
        a::ListEntitlementsResponse::decode_from_slice(&bytes).expect("decode catalog page");
    assert_eq!(decoded.entitlements.len(), 1);
    assert!(decoded.entitlements[0].name.starts_with("entitlements/"));

    harness.shutdown().await;
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn resume_keeps_revoked_and_expired_grants_ineffective_but_lists_them() {
    let mut harness = Harness::setup().await;
    let operator = harness.register_verified("resume-operator").await;
    harness.set_role(&operator.user_id, "operator").await;
    let owner = harness.register_verified("resume-owner").await;
    let card = harness.enroll(&owner, "Resume owner").await;
    let entries = catalog(&harness, &operator).await;
    let local = entitlement_name(&entries, "local_tracking");
    let training = entitlement_name(&entries, "training_library");

    ok_json(
        harness
            .rpc_json(
                &format!("{ADMIN_MEMBERSHIPS}/RevokeEntitlementGrant"),
                Some(&operator.token),
                json!({
                    "name":format!("{}/entitlementGrants/{}", card.name, last_segment(&local)),
                    "reason":"revoke before resume",
                }),
            )
            .await,
    )
    .await;
    harness
        .expire_grant(
            Uuid::parse_str(&card.membership_id).expect("membership UUID"),
            Uuid::parse_str(last_segment(&training)).expect("training UUID"),
        )
        .await;
    for (method, reason) in [
        ("SuspendMembership", "pause before resume"),
        ("ResumeMembership", "resume reviewed card"),
    ] {
        ok_json(
            harness
                .rpc_json(
                    &format!("{ADMIN_MEMBERSHIPS}/{method}"),
                    Some(&operator.token),
                    json!({"name":card.name,"reason":reason}),
                )
                .await,
        )
        .await;
    }

    let own_card = ok_json(
        harness
            .rpc_json(
                &format!("{MEMBERSHIPS}/GetMembership"),
                Some(&owner.token),
                json!({"name":format!("users/me/memberships/{}", card.membership_id)}),
            )
            .await,
    )
    .await;
    let effective = records(&own_card, "entitlements")
        .iter()
        .map(|entry| entry["code"].as_str().expect("effective code"))
        .collect::<Vec<_>>();
    assert_eq!(effective.len(), 1);
    assert!(!effective.contains(&"local_tracking"));
    assert!(!effective.contains(&"training_library"));

    let grants = ok_json(
        harness
            .rpc_json(
                &format!("{ADMIN_MEMBERSHIPS}/ListEntitlementGrants"),
                Some(&operator.token),
                json!({"parent":card.name}),
            )
            .await,
    )
    .await;
    let grants = records(&grants, "entitlementGrants");
    assert_eq!(grants.len(), 3);
    let codes = grants
        .iter()
        .map(|grant| {
            entries
                .iter()
                .find(|entry| entry["name"] == grant["entitlement"])
                .and_then(|entry| entry["code"].as_str())
                .expect("catalog code of the grant")
        })
        .collect::<Vec<_>>();
    assert!(codes.windows(2).all(|pair| pair[0] < pair[1]));
    let typed = |entitlement: &str| -> a::EntitlementGrant {
        let grant = grants
            .iter()
            .find(|grant| grant["entitlement"] == entitlement)
            .expect("listed grant");
        serde_json::from_value(grant.clone()).expect("typed grant")
    };
    let revoked = typed(&local);
    assert!(!revoked.effective);
    assert!(revoked.revoke_time.is_set());
    let expired = typed(&training);
    assert!(!expired.effective);
    assert!(expired.expire_time.is_set());
    assert_eq!(harness.audit_count().await, 3);

    harness.shutdown().await;
}
