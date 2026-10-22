//! Affiliation verification and the organization ranking over `boji.v1`,
//! and the organization operations over `boji.admin.v1`.
//!
//! The tests need the isolated PostgreSQL database named by
//! `TEST_DATABASE_URL`, so they are ignored by default. Codes are read from
//! the private mail directory of the harness.

#[path = "support/admin_harness.rs"]
mod admin_harness;

use admin_harness::{Harness, Identity};
use aip_193::proto::{ErrorInfo, RetryInfo};
use base64::{Engine, engine::general_purpose::STANDARD_NO_PAD};
use boji_bizserver::{
    domain::organization::{AffiliationEmailKey, import},
    mail::{MailTransport, Mailer},
    rpc::{AffiliationVerification, Capabilities},
};
use buffa::Message;
use reqwest::{Response, StatusCode};
use sea_orm::{ConnectionTrait, DbBackend, Statement};
use serde_json::{Value, json};
use std::{path::Path, sync::Arc, time::Duration};

const CODE_SUBJECT: &str = "薄肌学校认证验证码";
const AFFILIATIONS: &str = "boji.v1.AffiliationService";
const ORGANIZATIONS: &str = "boji.v1.OrganizationService";
const ADMIN_ORGANIZATIONS: &str = "boji.admin.v1.OrganizationService";
/// The affiliation of the caller for the type `school`.
const MY_SCHOOL: &str = "users/me/affiliations/school";
/// The filter of the school ranking.
const SCHOOL_RANKING: &str = "type = SCHOOL";

fn organization_capabilities(mail: &Path) -> Capabilities {
    let key = AffiliationEmailKey::new(b"organization-contract-key-not-for-production".to_vec())
        .expect("test key has 32 bytes or more");
    let mailer = Mailer::new(MailTransport::Files {
        directory: mail.to_owned(),
    })
    .expect("private mail transport");
    Capabilities {
        affiliation_verification: Some(AffiliationVerification {
            key: Arc::new(key),
            mailer,
        }),
        ..Capabilities::default()
    }
}

async fn ok_json(response: Response) -> Value {
    let status = response.status();
    let body: Value = response.json().await.expect("JSON response body");
    assert_eq!(status, StatusCode::OK, "unexpected status for {body}");
    body
}

/// Return the bytes of one detail of a Connect JSON error.
fn detail(body: &Value, type_name: &str) -> Vec<u8> {
    let value = body["details"]
        .as_array()
        .expect("error details")
        .iter()
        .find(|detail| detail["type"] == type_name)
        .and_then(|detail| detail["value"].as_str())
        .unwrap_or_else(|| panic!("{type_name} detail in {body}"));
    STANDARD_NO_PAD
        .decode(value.trim_end_matches('='))
        .expect("base64 error detail")
}

/// Assert a Connect error with an AIP-193 `ErrorInfo` and return its body.
async fn assert_error(response: Response, status: StatusCode, code: &str, reason: &str) -> Value {
    let actual = response.status();
    let body: Value = response.json().await.expect("Connect error JSON body");
    assert_eq!(actual, status, "unexpected HTTP status for {body}");
    assert_eq!(body["code"], code, "unexpected Connect code for {body}");
    let info = ErrorInfo::decode_from_slice(&detail(&body, "google.rpc.ErrorInfo"))
        .expect("protobuf ErrorInfo");
    assert_eq!(info.reason, reason, "unexpected reason for {body}");
    assert_eq!(info.domain, "boji.leanmuscle.club");
    body
}

async fn call(harness: &Harness, method: &str, token: Option<&str>, body: Value) -> Response {
    harness.rpc_json(method, token, body).await
}

async fn send_code(harness: &Harness, identity: &Identity, email: &str) -> Response {
    call(
        harness,
        &format!("{AFFILIATIONS}/CreateAffiliationEmailVerification"),
        Some(&identity.token),
        json!({"parent": MY_SCHOOL, "affiliationEmailVerification": {"email": email}}),
    )
    .await
}

async fn confirm(harness: &Harness, identity: &Identity, name: &str, code: &str) -> Response {
    call(
        harness,
        &format!("{AFFILIATIONS}/ConfirmAffiliationEmailVerification"),
        Some(&identity.token),
        json!({"name": name, "code": code}),
    )
    .await
}

async fn affiliation(harness: &Harness, identity: &Identity) -> Value {
    ok_json(
        call(
            harness,
            &format!("{AFFILIATIONS}/GetAffiliation"),
            Some(&identity.token),
            json!({"name": MY_SCHOOL}),
        )
        .await,
    )
    .await
}

/// Return the code of the first message to `recipient` that is not in
/// `before`.
async fn new_code(harness: &Harness, recipient: &str, before: &[String]) -> String {
    for _ in 0..50 {
        if let Some(text) = harness
            .mails(recipient, CODE_SUBJECT)
            .into_iter()
            .find(|text| !before.contains(text))
        {
            return text
                .split_whitespace()
                .find(|word| word.len() == 6 && word.bytes().all(|byte| byte.is_ascii_digit()))
                .expect("a 6-digit code in the message")
                .to_owned();
        }
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
    panic!("expected an affiliation code for {recipient}");
}

/// Send a code to `email`, read it from the mail and confirm it. Return the
/// confirmed `Affiliation`.
async fn verify(harness: &Harness, identity: &Identity, email: &str, recipient: &str) -> Value {
    let before = harness.mails(recipient, CODE_SUBJECT);
    let created = ok_json(send_code(harness, identity, email).await).await;
    let name = created["name"]
        .as_str()
        .expect("verification name")
        .to_owned();
    let code = new_code(harness, recipient, &before).await;
    let confirmed = ok_json(confirm(harness, identity, &name, &code).await).await;
    confirmed["affiliation"].clone()
}

/// Return the name of the only organization that `filter` matches.
async fn find_organization(harness: &Harness, filter: &str) -> Value {
    let body = ok_json(
        call(
            harness,
            &format!("{ORGANIZATIONS}/ListOrganizations"),
            None,
            json!({"filter": filter}),
        )
        .await,
    )
    .await;
    let organizations = body["organizations"].as_array().expect("organizations");
    assert_eq!(
        organizations.len(),
        1,
        "{filter:?} must match one organization: {body}"
    );
    organizations[0].clone()
}

async fn standing(harness: &Harness, organization: &str) -> Value {
    ok_json(
        call(
            harness,
            &format!("{ORGANIZATIONS}/GetOrganizationStanding"),
            None,
            json!({"name": format!("{organization}/standing")}),
        )
        .await,
    )
    .await
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn affiliation_verification_counts_members_and_ranks_organizations() {
    let mut harness = Harness::with_mail_capabilities(organization_capabilities).await;

    let catalog = import::bundled().expect("the bundled organization list parses");
    let report = import::import(&harness.database, &catalog)
        .await
        .expect("import the organization list");
    assert!(
        report.organizations > 5000,
        "unexpected organization count {}",
        report.organizations
    );
    assert_eq!(report.created, report.organizations);
    let again = import::import(&harness.database, &catalog)
        .await
        .expect("import the organization list again");
    assert_eq!(
        (again.organizations, again.created),
        (report.organizations, 0)
    );
    assert!(again.retired.is_empty());

    let config = ok_json(
        call(
            &harness,
            "boji.v1.SystemService/GetServerConfig",
            None,
            json!({"name": "serverConfig"}),
        )
        .await,
    )
    .await;
    assert_eq!(config["organizationRankingEnabled"], true);

    let xjtlu = find_organization(&harness, "西交利物浦").await;
    assert_eq!(xjtlu["displayNames"][0]["languageCode"], "en");
    assert_eq!(xjtlu["displayNames"][1]["text"], "西交利物浦大学");
    assert_eq!(xjtlu["displayNames"][1]["languageCode"], "zh-Hans");
    assert_eq!(xjtlu["regionCode"], "CN");
    assert_eq!(xjtlu["type"], "SCHOOL");
    let xjtlu = xjtlu["name"]
        .as_str()
        .expect("organization name")
        .to_owned();
    let uq = find_organization(
        &harness,
        r#"type = SCHOOL AND region_code = "AU" AND 昆士兰"#,
    )
    .await;
    let uq = uq["name"].as_str().expect("organization name").to_owned();
    let anu = find_organization(&harness, "澳大利亚国立").await;
    let anu = anu["name"].as_str().expect("organization name").to_owned();
    assert_eq!(
        ok_json(
            call(
                &harness,
                &format!("{ORGANIZATIONS}/GetOrganization"),
                None,
                json!({"name": xjtlu})
            )
            .await
        )
        .await["name"],
        xjtlu
    );

    // An organization email needs a membership card.
    let erin = harness.register_verified("erin").await;
    assert_error(
        send_code(&harness, &erin, "erin@xjtlu.edu.cn").await,
        StatusCode::BAD_REQUEST,
        "failed_precondition",
        "MEMBERSHIP_REQUIRED",
    )
    .await;

    let alice = harness.register_verified("alice").await;
    harness.enroll(&alice, "Alice").await;
    assert_error(
        send_code(&harness, &alice, "alice@example.com").await,
        StatusCode::BAD_REQUEST,
        "invalid_argument",
        "AFFILIATION_EMAIL_DOMAIN_UNKNOWN",
    )
    .await;

    // The address keeps its case for delivery. The domain is normalized.
    let alice_recipient = "Alice+rank@student.xjtlu.edu.cn";
    let created =
        ok_json(send_code(&harness, &alice, "Alice+rank@Student.XJTLU.edu.cn").await).await;
    assert_eq!(created["maskedEmail"], "A***@student.xjtlu.edu.cn");
    assert_eq!(created["candidateOrganizations"], json!([xjtlu]));
    assert!(
        created.get("email").is_none(),
        "email is input only: {created}"
    );
    let verification = created["name"]
        .as_str()
        .expect("verification name")
        .to_owned();
    assert!(verification.starts_with(&format!(
        "users/{}/affiliations/school/emailVerifications/",
        alice.user_id
    )));
    let code = new_code(&harness, alice_recipient, &[]).await;

    let limited = assert_error(
        send_code(&harness, &alice, alice_recipient).await,
        StatusCode::TOO_MANY_REQUESTS,
        "resource_exhausted",
        "RATE_LIMITED",
    )
    .await;
    let retry = RetryInfo::decode_from_slice(&detail(&limited, "google.rpc.RetryInfo"))
        .expect("protobuf RetryInfo");
    let delay = retry
        .retry_delay
        .as_option()
        .map_or(0, |delay| delay.seconds);
    assert!((1..=60).contains(&delay), "unexpected retry delay {delay}");

    let read = ok_json(
        call(
            &harness,
            &format!("{AFFILIATIONS}/GetAffiliationEmailVerification"),
            Some(&alice.token),
            json!({"name": verification}),
        )
        .await,
    )
    .await;
    assert_eq!(read["maskedEmail"], "A***@student.xjtlu.edu.cn");
    assert!(read["resendTime"].is_string());

    let wrong = if code == "000000" { "111111" } else { "000000" };
    assert_error(
        confirm(&harness, &alice, &verification, wrong).await,
        StatusCode::BAD_REQUEST,
        "invalid_argument",
        "AFFILIATION_VERIFICATION_CODE_INVALID",
    )
    .await;
    let confirmed = ok_json(confirm(&harness, &alice, &verification, &code).await).await;
    let affiliated = &confirmed["affiliation"];
    assert_eq!(
        affiliated["name"],
        format!("users/{}/affiliations/school", alice.user_id)
    );
    assert_eq!(affiliated["organizationType"], "SCHOOL");
    assert_eq!(affiliated["state"], "ACTIVE");
    assert_eq!(affiliated["organization"], xjtlu);
    assert_eq!(affiliated["emailDomain"], "student.xjtlu.edu.cn");
    assert_eq!(affiliated["counted"], true);
    assert!(affiliated["organizationChangeAvailableTime"].is_string());
    assert_error(
        confirm(&harness, &alice, &verification, &code).await,
        StatusCode::BAD_REQUEST,
        "failed_precondition",
        "AFFILIATION_VERIFICATION_EXPIRED",
    )
    .await;

    // Two more members reach the public threshold of 3. One member of
    // another organization stays below it.
    let bob = harness.register_verified("bob").await;
    harness.enroll(&bob, "Bob").await;
    let carol = harness.register_verified("carol").await;
    let carol_card = harness.enroll(&carol, "Carol").await;
    let dave = harness.register_verified("dave").await;
    harness.enroll(&dave, "Dave").await;
    for (identity, email) in [
        (&bob, "bob@xjtlu.edu.cn"),
        (&carol, "carol@student.xjtlu.edu.cn"),
    ] {
        let affiliated = verify(&harness, identity, email, email).await;
        assert_eq!(affiliated["organization"], xjtlu);
    }
    let affiliated = verify(&harness, &dave, "dave@uq.edu.au", "dave@uq.edu.au").await;
    assert_eq!(affiliated["organization"], uq);

    let ranking = ok_json(
        call(
            &harness,
            &format!("{ORGANIZATIONS}/ListOrganizationStandings"),
            None,
            json!({"parent": "organizations/-", "filter": SCHOOL_RANKING}),
        )
        .await,
    )
    .await;
    let standings = ranking["organizationStandings"]
        .as_array()
        .expect("standings");
    assert_eq!(standings.len(), 1, "only XJTLU is public: {ranking}");
    assert_eq!(standings[0]["name"], format!("{xjtlu}/standing"));
    assert_eq!(standings[0]["placement"], "RANKED");
    assert_eq!(standings[0]["rank"], 1);
    assert_eq!(standings[0]["memberCount"], 3);
    assert_eq!(standings[0]["weeklyNewMemberCount"], 3);
    assert_eq!(standings[0]["organizationType"], "SCHOOL");
    assert_eq!(
        standings[0]["organizationDisplayNames"][1]["text"],
        "西交利物浦大学"
    );
    assert!(ranking.get("nextPageToken").is_none());

    let below = standing(&harness, &uq).await;
    assert_eq!(below["placement"], "BELOW_THRESHOLD");
    assert!(
        below.get("memberCount").is_none(),
        "counts stay hidden: {below}"
    );
    assert_eq!(standing(&harness, &anu).await["placement"], "NO_MEMBERS");
    let own = ok_json(
        call(
            &harness,
            &format!("{ORGANIZATIONS}/ListOrganizationStandings"),
            None,
            json!({"parent": uq}),
        )
        .await,
    )
    .await;
    assert_eq!(
        own["organizationStandings"][0]["placement"],
        "BELOW_THRESHOLD"
    );

    // A user reads only its own verification.
    assert_error(
        call(
            &harness,
            &format!("{AFFILIATIONS}/GetAffiliation"),
            Some(&bob.token),
            json!({"name": format!("users/{}/affiliations/school", alice.user_id)}),
        )
        .await,
        StatusCode::FORBIDDEN,
        "permission_denied",
        "RESOURCE_ACCESS_DENIED",
    )
    .await;

    // The same address with another tag verifies another account, and the
    // first account stops counting.
    let frank = harness.register_verified("frank").await;
    harness.enroll(&frank, "Frank").await;
    let taken = verify(
        &harness,
        &frank,
        "alice+again@student.xjtlu.edu.cn",
        "alice+again@student.xjtlu.edu.cn",
    )
    .await;
    assert_eq!(taken["counted"], true);
    let displaced = affiliation(&harness, &alice).await;
    assert_eq!(displaced["state"], "UNAFFILIATED");
    assert!(displaced.get("organization").is_none());
    assert!(displaced["organizationChangeAvailableTime"].is_string());

    // Leaving ends counting at once. A second leave has nothing to end.
    let left = ok_json(
        call(
            &harness,
            &format!("{AFFILIATIONS}/LeaveOrganization"),
            Some(&bob.token),
            json!({"name": MY_SCHOOL}),
        )
        .await,
    )
    .await;
    assert_eq!(left["state"], "UNAFFILIATED");
    assert_error(
        call(
            &harness,
            &format!("{AFFILIATIONS}/LeaveOrganization"),
            Some(&bob.token),
            json!({"name": MY_SCHOOL}),
        )
        .await,
        StatusCode::BAD_REQUEST,
        "failed_precondition",
        "AFFILIATION_INACTIVE",
    )
    .await;

    // Another organization within 30 days fails, and the code stays unused. The
    // sending history is cleared, so that the resend interval does not apply.
    harness
        .database
        .execute_raw(Statement::from_sql_and_values(
            DbBackend::Postgres,
            "DELETE FROM affiliation_email_verification WHERE user_id = $1",
            [bob.user_id.clone().into()],
        ))
        .await
        .expect("clear the sending history of the fixture user");
    let created = ok_json(send_code(&harness, &bob, "bob@uq.edu.au").await).await;
    let name = created["name"]
        .as_str()
        .expect("verification name")
        .to_owned();
    let code = new_code(&harness, "bob@uq.edu.au", &[]).await;
    assert_error(
        confirm(&harness, &bob, &name, &code).await,
        StatusCode::BAD_REQUEST,
        "failed_precondition",
        "ORGANIZATION_CHANGE_TOO_SOON",
    )
    .await;

    // A suspended card keeps the verification and stops counting.
    harness
        .set_membership_status(&carol_card.membership_id, "suspended")
        .await;
    let suspended = affiliation(&harness, &carol).await;
    assert_eq!(suspended["state"], "ACTIVE");
    assert!(
        suspended.get("counted").is_none(),
        "false is omitted: {suspended}"
    );

    harness.shutdown().await;
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn affiliation_verification_is_off_without_a_key() {
    let mut harness = Harness::setup().await;
    let config = ok_json(
        call(
            &harness,
            "boji.v1.SystemService/GetServerConfig",
            None,
            json!({"name": "serverConfig"}),
        )
        .await,
    )
    .await;
    assert!(
        config.get("organizationRankingEnabled").is_none(),
        "{config}"
    );

    let user = harness.register_verified("nokey").await;
    harness.enroll(&user, "No Key").await;
    assert_error(
        send_code(&harness, &user, "nokey@xjtlu.edu.cn").await,
        StatusCode::BAD_REQUEST,
        "failed_precondition",
        "AFFILIATION_VERIFICATION_NOT_CONFIGURED",
    )
    .await;
    assert_eq!(affiliation(&harness, &user).await["state"], "UNAFFILIATED");

    // The public methods work without a key and without an imported list.
    let ranking = ok_json(
        call(
            &harness,
            &format!("{ORGANIZATIONS}/ListOrganizationStandings"),
            None,
            json!({"parent": "organizations/-", "filter": SCHOOL_RANKING}),
        )
        .await,
    )
    .await;
    assert!(ranking.get("organizationStandings").is_none(), "{ranking}");

    // Each type has its own ranking, so the whole ranking needs a type, and
    // the standing of one organization takes no filter.
    for body in [
        json!({"parent": "organizations/-"}),
        json!({"parent": "organizations/-", "filter": "type = COMPANY"}),
        json!({
            "parent": "organizations/0b6f3a8e-6f0c-4a3b-9f3e-2d1c0b9a8f7e",
            "filter": SCHOOL_RANKING,
        }),
    ] {
        assert_error(
            call(
                &harness,
                &format!("{ORGANIZATIONS}/ListOrganizationStandings"),
                None,
                body,
            )
            .await,
            StatusCode::BAD_REQUEST,
            "invalid_argument",
            "INVALID_FILTER",
        )
        .await;
    }

    // The list has one affiliation for each type, on one page.
    let listed = ok_json(
        call(
            &harness,
            &format!("{AFFILIATIONS}/ListAffiliations"),
            Some(&user.token),
            json!({"parent": "users/me"}),
        )
        .await,
    )
    .await;
    let affiliations = listed["affiliations"].as_array().expect("affiliations");
    assert_eq!(affiliations.len(), 1, "{listed}");
    assert_eq!(
        affiliations[0]["name"],
        format!("users/{}/affiliations/school", user.user_id)
    );
    assert_eq!(affiliations[0]["organizationType"], "SCHOOL");
    assert_eq!(affiliations[0]["state"], "UNAFFILIATED");
    assert!(listed.get("nextPageToken").is_none());
    for name in [
        "users/me/affiliations/company",
        "users/me/affiliations/SCHOOL",
    ] {
        assert_error(
            call(
                &harness,
                &format!("{AFFILIATIONS}/GetAffiliation"),
                Some(&user.token),
                json!({"name": name}),
            )
            .await,
            StatusCode::BAD_REQUEST,
            "invalid_argument",
            "INVALID_INPUT",
        )
        .await;
    }

    assert_error(
        call(
            &harness,
            &format!("{ORGANIZATIONS}/ListOrganizations"),
            None,
            json!({"filter": "a OR b"}),
        )
        .await,
        StatusCode::BAD_REQUEST,
        "invalid_argument",
        "INVALID_FILTER",
    )
    .await;

    harness.shutdown().await;
}

/// Call a method of `boji.admin.v1.OrganizationService` and return the response.
async fn admin(harness: &Harness, operator: &Identity, method: &str, body: Value) -> Response {
    call(
        harness,
        &format!("{ADMIN_ORGANIZATIONS}/{method}"),
        Some(&operator.token),
        body,
    )
    .await
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn operations_freeze_revoke_and_unfreeze_change_the_ranking() {
    let mut harness = Harness::with_mail_capabilities(organization_capabilities).await;
    let catalog = import::parse(
        "0000000000000000000000000000000000000000",
        r#"[{"name": "Operations Test University", "alpha_two_code": "CN", "domains": ["ops-test.edu.cn"]}]"#,
        r#"{"schools": {}}"#,
    )
    .expect("a one-organization list");
    import::import(&harness.database, &catalog)
        .await
        .expect("import the one-organization list");
    let school = find_organization(&harness, r#""Operations Test""#).await;
    let school = school["name"]
        .as_str()
        .expect("organization name")
        .to_owned();
    let standing_name = format!("{school}/standing");

    // Three members reach the public threshold.
    let mut members = Vec::new();
    for label in ["ops-a", "ops-b", "ops-c"] {
        let member = harness.register_verified(label).await;
        harness.enroll(&member, label).await;
        let email = format!("{label}@ops-test.edu.cn");
        assert_eq!(
            verify(&harness, &member, &email, &email).await["organization"],
            school
        );
        members.push(member);
    }
    let ranked = standing(&harness, &school).await;
    assert_eq!(ranked["placement"], "RANKED");
    assert_eq!(ranked["memberCount"], 3);

    // A role without the organization permission learns nothing.
    let user = harness.register_verified("ops-user").await;
    let target = json!({"name": format!("users/{}/affiliations/school", members[0].user_id)});
    assert_error(
        admin(&harness, &user, "GetAffiliation", target.clone()).await,
        StatusCode::FORBIDDEN,
        "permission_denied",
        "ADMIN_FORBIDDEN",
    )
    .await;

    let operator = harness.register_verified("ops-operator").await;
    harness.set_role(&operator.user_id, "operator").await;
    let read = ok_json(admin(&harness, &operator, "GetAffiliation", target.clone()).await).await;
    assert_eq!(read["state"], "ACTIVE");
    assert_eq!(read["organizationType"], "SCHOOL");
    assert_error(
        admin(
            &harness,
            &operator,
            "GetAffiliation",
            json!({"name": "users/-/affiliations/school"}),
        )
        .await,
        StatusCode::BAD_REQUEST,
        "invalid_argument",
        "INVALID_INPUT",
    )
    .await;

    // The list of every user pages with a token that is bound to the filter.
    let filter = format!(r#"organization = "{school}""#);
    let first = ok_json(
        admin(
            &harness,
            &operator,
            "ListAffiliations",
            json!({"parent": "users/-", "filter": filter, "pageSize": 2}),
        )
        .await,
    )
    .await;
    assert_eq!(
        first["affiliations"].as_array().map(Vec::len),
        Some(2),
        "{first}"
    );
    let token = first["nextPageToken"]
        .as_str()
        .expect("next page token")
        .to_owned();
    let second = ok_json(
        admin(
            &harness,
            &operator,
            "ListAffiliations",
            json!({"parent": "users/-", "filter": filter, "pageSize": 2, "pageToken": token}),
        )
        .await,
    )
    .await;
    assert_eq!(
        second["affiliations"].as_array().map(Vec::len),
        Some(1),
        "{second}"
    );
    assert!(second.get("nextPageToken").is_none());
    assert_error(
        admin(
            &harness,
            &operator,
            "ListAffiliations",
            json!({"parent": "users/-", "pageSize": 2, "pageToken": token}),
        )
        .await,
        StatusCode::BAD_REQUEST,
        "invalid_argument",
        "INVALID_PAGE_TOKEN",
    )
    .await;

    // A freeze keeps the counts of the freeze time.
    let audits = harness.audit_count().await;
    let frozen = ok_json(
        admin(
            &harness,
            &operator,
            "FreezeOrganizationStanding",
            json!({"name": standing_name, "reason": "review shared accounts"}),
        )
        .await,
    )
    .await;
    assert_eq!(frozen["frozen"], true);
    assert_eq!(frozen["memberCount"], 3);
    assert_eq!(
        harness.latest_audit().await,
        (
            "organization.standing.frozen".to_owned(),
            "review shared accounts".to_owned()
        )
    );
    assert_error(
        admin(
            &harness,
            &operator,
            "FreezeOrganizationStanding",
            json!({"name": standing_name, "reason": "again"}),
        )
        .await,
        StatusCode::BAD_REQUEST,
        "failed_precondition",
        "ORGANIZATION_STANDING_ALREADY_FROZEN",
    )
    .await;
    assert_eq!(harness.audit_count().await, audits + 1);

    // A revocation ends the affiliation at once. A second one has nothing to end.
    let revoked = ok_json(
        admin(
            &harness,
            &operator,
            "RevokeAffiliation",
            json!({"name": target["name"], "reason": "shared account"}),
        )
        .await,
    )
    .await;
    assert_eq!(revoked["state"], "UNAFFILIATED");
    assert_eq!(
        harness.latest_audit().await,
        (
            "organization.affiliation.revoked".to_owned(),
            "shared account".to_owned()
        )
    );
    assert_error(
        admin(
            &harness,
            &operator,
            "RevokeAffiliation",
            json!({"name": target["name"], "reason": "again"}),
        )
        .await,
        StatusCode::BAD_REQUEST,
        "failed_precondition",
        "AFFILIATION_INACTIVE",
    )
    .await;
    assert_eq!(harness.audit_count().await, audits + 2);
    assert_eq!(
        affiliation(&harness, &members[0]).await["state"],
        "UNAFFILIATED"
    );
    let held = standing(&harness, &school).await;
    assert_eq!(held["frozen"], true);
    assert_eq!(
        held["memberCount"], 3,
        "the freeze holds the counts: {held}"
    );

    // After the freeze ends, the live count of 2 is below the threshold.
    let unfrozen = ok_json(
        admin(
            &harness,
            &operator,
            "UnfreezeOrganizationStanding",
            json!({"name": standing_name, "reason": "review done"}),
        )
        .await,
    )
    .await;
    assert!(
        unfrozen.get("frozen").is_none(),
        "false is omitted: {unfrozen}"
    );
    assert_eq!(unfrozen["placement"], "BELOW_THRESHOLD");
    assert_eq!(
        harness.latest_audit().await,
        (
            "organization.standing.unfrozen".to_owned(),
            "review done".to_owned()
        )
    );
    assert_error(
        admin(
            &harness,
            &operator,
            "UnfreezeOrganizationStanding",
            json!({"name": standing_name, "reason": "again"}),
        )
        .await,
        StatusCode::BAD_REQUEST,
        "failed_precondition",
        "ORGANIZATION_STANDING_NOT_FROZEN",
    )
    .await;
    assert_eq!(harness.audit_count().await, audits + 3);

    harness.shutdown().await;
}
