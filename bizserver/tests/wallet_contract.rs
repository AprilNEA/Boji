//! Apple Wallet pass signing, `boji.v1.WalletService` and the Wallet web
//! service.
//!
//! The signing tests build a private root, WWDR and signer chain, so they need
//! no Apple credentials. The RPC and web service tests also need the isolated
//! PostgreSQL database named by `TEST_DATABASE_URL`, so they are ignored by
//! default. A recording sender replaces APNs.

#[path = "support/admin_harness.rs"]
mod admin_harness;

use admin_harness::Harness;
use aip_193::proto::ErrorInfo;
use base64::{
    Engine,
    engine::general_purpose::{STANDARD, STANDARD_NO_PAD},
};
use boji_bizserver::{
    domain::membership_code::MembershipCodes,
    proto::boji::v1 as p,
    rpc::Capabilities,
    wallet::{
        CardStatus, MembershipCard, PKPASS_MIME_TYPE, PassSigner, WalletConfigError,
        WalletCredentials,
        push::{ApnsSender, PushOutcome, PushSender},
    },
};
use buffa::Message;
use chrono::{DateTime, Duration, TimeZone, Utc};
use openssl::{
    asn1::Asn1Time,
    bn::{BigNum, MsbOption},
    hash::MessageDigest,
    nid::Nid,
    pkcs7::{Pkcs7, Pkcs7Flags},
    pkey::{PKey, Private},
    rsa::Rsa,
    stack::Stack,
    symm::Cipher,
    x509::{
        X509, X509Builder, X509NameBuilder,
        extension::{BasicConstraints, KeyUsage},
        store::X509StoreBuilder,
    },
};
use reqwest::{Response, StatusCode};
use serde_json::{Value, json};
use std::{
    collections::BTreeMap,
    io::{Cursor, Read},
    sync::Arc,
};
use uuid::Uuid;
use zip::{CompressionMethod, ZipArchive};

const PASS_TYPE: &str = "pass.club.leanmuscle.test";
const TEAM: &str = "TESTTEAM01";
const WEB_SERVICE_URL: &str = "https://bizserver.test/wallet";
const GET_PASS: &str = "boji.v1.WalletService/GetMembershipPass";
const GET_SERVER_CONFIG: &str = "boji.v1.SystemService/GetServerConfig";
const ADMIN_MEMBERSHIPS: &str = "boji.admin.v1.MembershipService";

/// A test certificate authority.
struct Authority {
    certificate: X509,
    key: PKey<Private>,
}

/// A private root, a WWDR intermediate and a pass signing certificate.
struct Chain {
    root: X509,
    wwdr: Authority,
    signer: X509,
    signer_key: PKey<Private>,
}

/// A validity period relative to now, in days.
fn days(from: i64, until: i64) -> (DateTime<Utc>, DateTime<Utc>) {
    let now = Utc::now();
    (now + Duration::days(from), now + Duration::days(until))
}

impl Chain {
    /// A chain whose certificates are valid now.
    fn current() -> Self {
        Self::new(days(-1, 30), days(-10, 60))
    }

    fn new(signer: (DateTime<Utc>, DateTime<Utc>), wwdr: (DateTime<Utc>, DateTime<Utc>)) -> Self {
        let root_key = rsa_key();
        let root = Authority {
            certificate: certificate(
                &[(Nid::COMMONNAME, "Boji Test Root CA")],
                &root_key,
                None,
                true,
                days(-365, 365),
            ),
            key: root_key,
        };
        let wwdr_key = rsa_key();
        let wwdr = Authority {
            certificate: certificate(
                &[(Nid::COMMONNAME, "Boji Test WWDR CA")],
                &wwdr_key,
                Some(&root),
                true,
                wwdr,
            ),
            key: wwdr_key,
        };
        let signer_key = rsa_key();
        let signer = certificate(
            &[
                (Nid::USERID, PASS_TYPE),
                (Nid::COMMONNAME, "Pass Type ID: test"),
                (Nid::ORGANIZATIONALUNITNAME, TEAM),
                (Nid::ORGANIZATIONNAME, "Boji Test"),
            ],
            &signer_key,
            Some(&wwdr),
            false,
            signer,
        );
        Self {
            root: root.certificate,
            wwdr,
            signer,
            signer_key,
        }
    }

    fn credentials(&self) -> WalletCredentials {
        WalletCredentials {
            pass_type_identifier: PASS_TYPE.to_owned(),
            team_identifier: TEAM.to_owned(),
            signer_cert: pem(&self.signer),
            signer_key: key_pem(&self.signer_key),
            signer_key_passphrase: None,
            wwdr_cert: pem(&self.wwdr.certificate),
            web_service_url: WEB_SERVICE_URL.to_owned(),
            authentication_token_key: b"test-only-wallet-token-key-0123456789".to_vec(),
        }
    }

    fn signer(&self) -> PassSigner {
        PassSigner::with_trust_anchors(self.credentials(), std::slice::from_ref(&self.root))
            .expect("credentials of the test chain")
    }
}

fn rsa_key() -> PKey<Private> {
    PKey::from_rsa(Rsa::generate(2048).expect("RSA key")).expect("private key")
}

fn certificate(
    subject: &[(Nid, &str)],
    key: &PKey<Private>,
    issuer: Option<&Authority>,
    ca: bool,
    (not_before, not_after): (DateTime<Utc>, DateTime<Utc>),
) -> X509 {
    let mut name = X509NameBuilder::new().expect("name builder");
    for (nid, value) in subject {
        name.append_entry_by_nid(*nid, value).expect("name entry");
    }
    let name = name.build();
    let mut serial = BigNum::new().expect("serial");
    serial
        .rand(64, MsbOption::MAYBE_ZERO, false)
        .expect("random serial");
    let mut builder = X509Builder::new().expect("certificate builder");
    builder.set_version(2).expect("version 3");
    builder
        .set_serial_number(&serial.to_asn1_integer().expect("serial integer"))
        .expect("serial number");
    builder.set_subject_name(&name).expect("subject");
    builder
        .set_issuer_name(issuer.map_or(&*name, |issuer| issuer.certificate.subject_name()))
        .expect("issuer");
    builder.set_pubkey(key).expect("public key");
    builder
        .set_not_before(&Asn1Time::from_unix(not_before.timestamp()).expect("start time"))
        .expect("not before");
    builder
        .set_not_after(&Asn1Time::from_unix(not_after.timestamp()).expect("end time"))
        .expect("not after");
    let (constraints, usage) = if ca {
        (
            BasicConstraints::new().critical().ca().build(),
            KeyUsage::new()
                .critical()
                .key_cert_sign()
                .crl_sign()
                .build(),
        )
    } else {
        (
            BasicConstraints::new().critical().build(),
            KeyUsage::new().critical().digital_signature().build(),
        )
    };
    builder
        .append_extension(constraints.expect("basic constraints"))
        .expect("append basic constraints");
    builder
        .append_extension(usage.expect("key usage"))
        .expect("append key usage");
    let signing_key = issuer.map_or(key, |issuer| &issuer.key);
    builder
        .sign(signing_key, MessageDigest::sha256())
        .expect("sign certificate");
    builder.build()
}

fn pem(certificate: &X509) -> String {
    String::from_utf8(certificate.to_pem().expect("certificate PEM")).expect("ASCII PEM")
}

fn key_pem(key: &PKey<Private>) -> String {
    String::from_utf8(key.private_key_to_pem_pkcs8().expect("key PEM")).expect("ASCII PEM")
}

fn card(joined_at: DateTime<Utc>) -> MembershipCard<'static> {
    MembershipCard {
        membership_id: "5b0c0d7e-3f7c-4b65-9a1e-1d2a3b4c5d6e",
        display_name: "小林",
        member_number: "test-member-number",
        joined_at,
        expires_at: None,
        status: CardStatus::Active,
        organizations: &[],
        code: None,
    }
}

/// Return the entry names in archive order and the entry contents.
fn unpack(archive: &[u8]) -> (Vec<String>, BTreeMap<String, Vec<u8>>) {
    let mut zip = ZipArchive::new(Cursor::new(archive)).expect("ZIP archive");
    let mut names = Vec::new();
    let mut files = BTreeMap::new();
    for index in 0..zip.len() {
        let mut entry = zip.by_index(index).expect("archive entry");
        let name = entry.name().expect("entry name").into_owned();
        assert_eq!(
            entry.compression(),
            CompressionMethod::Stored,
            "{name} must not be compressed"
        );
        let mut content = Vec::new();
        entry.read_to_end(&mut content).expect("entry content");
        names.push(name.clone());
        files.insert(name, content);
    }
    (names, files)
}

fn sha1_hex(content: &[u8]) -> String {
    openssl::sha::sha1(content)
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

/// Verify the detached signature over `manifest` against `root` only.
///
/// The verification gets no intermediate certificates, so it succeeds only
/// when the signature embeds the WWDR certificate.
fn verify_signature(signature: &[u8], manifest: &[u8], root: &X509) -> bool {
    let signature = Pkcs7::from_der(signature).expect("DER PKCS #7 signature");
    let mut store = X509StoreBuilder::new().expect("store builder");
    store.add_cert(root.clone()).expect("trust the test root");
    let store = store.build();
    let no_certificates = Stack::new().expect("empty stack");
    signature
        .verify(
            &no_certificates,
            &store,
            Some(manifest),
            None,
            Pkcs7Flags::BINARY,
        )
        .is_ok()
}

#[test]
fn signed_pass_verifies_against_the_root() {
    let chain = Chain::current();
    let signer = chain.signer();
    assert!(signer.is_current(Utc::now()));
    let joined_at = Utc.with_ymd_and_hms(2026, 3, 1, 8, 30, 0).unwrap();
    let (names, files) = unpack(&signer.sign(&card(joined_at)).expect("signed pass"));
    assert_eq!(
        names,
        [
            "pass.json",
            "icon.png",
            "icon@2x.png",
            "icon@3x.png",
            "logo.png",
            "logo@2x.png",
            "logo@3x.png",
            "en.lproj/pass.strings",
            "zh-Hans.lproj/pass.strings",
            "manifest.json",
            "signature"
        ]
    );

    let manifest: BTreeMap<String, String> =
        serde_json::from_slice(&files["manifest.json"]).expect("manifest JSON");
    assert_eq!(
        manifest.keys().collect::<Vec<_>>(),
        [
            "en.lproj/pass.strings",
            "icon.png",
            "icon@2x.png",
            "icon@3x.png",
            "logo.png",
            "logo@2x.png",
            "logo@3x.png",
            "pass.json",
            "zh-Hans.lproj/pass.strings"
        ]
    );
    for (name, digest) in &manifest {
        assert_eq!(digest, &sha1_hex(&files[name]), "digest of {name}");
    }

    let pass: Value = serde_json::from_slice(&files["pass.json"]).expect("pass JSON");
    assert_eq!(pass["formatVersion"], 1);
    assert_eq!(pass["passTypeIdentifier"], PASS_TYPE);
    assert_eq!(pass["teamIdentifier"], TEAM);
    assert_eq!(pass["serialNumber"], "5b0c0d7e-3f7c-4b65-9a1e-1d2a3b4c5d6e");
    assert_eq!(pass["sharingProhibited"], true);
    assert_eq!(pass["webServiceURL"], WEB_SERVICE_URL);
    let token = pass["authenticationToken"].as_str().expect("token");
    assert!(
        token.len() >= 16,
        "Wallet requires a token of 16 or more characters"
    );
    assert!(signer.authenticates("5b0c0d7e-3f7c-4b65-9a1e-1d2a3b4c5d6e", token));
    let generic = &pass["generic"];
    assert_eq!(generic["primaryFields"][0]["value"], "小林");
    // The member number stays the opaque string that the server returned.
    assert_eq!(generic["headerFields"][0]["value"], "test-member-number");
    assert_eq!(
        generic["secondaryFields"][0]["value"],
        "2026-03-01T08:30:00Z"
    );
    for key in ["barcode", "barcodes", "locations", "voided"] {
        assert!(pass.get(key).is_none(), "the pass must not contain {key}");
    }

    assert!(verify_signature(
        &files["signature"],
        &files["manifest.json"],
        &chain.root
    ));
    let mut altered = files["manifest.json"].clone();
    altered.push(b' ');
    assert!(!verify_signature(
        &files["signature"],
        &altered,
        &chain.root
    ));
    let other = Chain::current();
    assert!(!verify_signature(
        &files["signature"],
        &files["manifest.json"],
        &other.root
    ));
}

#[test]
fn credentials_must_match_the_signing_certificate() {
    let chain = Chain::current();
    let other = Chain::current();
    let rejected = |change: &dyn Fn(&mut WalletCredentials)| {
        let mut credentials = chain.credentials();
        change(&mut credentials);
        PassSigner::with_trust_anchors(credentials, std::slice::from_ref(&chain.root))
            .expect_err("rejected credentials")
    };
    assert!(matches!(
        rejected(&|c| c.signer_cert = "not a certificate".into()),
        WalletConfigError::SignerCert
    ));
    assert!(matches!(
        rejected(&|c| c.wwdr_cert = "not a certificate".into()),
        WalletConfigError::WwdrCert
    ));
    assert!(matches!(
        rejected(&|c| c.signer_key = "not a key".into()),
        WalletConfigError::SignerKey
    ));
    assert!(matches!(
        rejected(&|c| c.signer_key = key_pem(&other.signer_key)),
        WalletConfigError::KeyMismatch
    ));
    assert!(matches!(
        rejected(&|c| c.pass_type_identifier = "pass.club.leanmuscle.other".into()),
        WalletConfigError::PassTypeMismatch
    ));
    assert!(matches!(
        rejected(&|c| c.team_identifier = "OTHERTEAM1".into()),
        WalletConfigError::TeamMismatch
    ));
    // The WWDR certificate of another chain did not issue this signer.
    assert!(matches!(
        rejected(&|c| c.wwdr_cert = pem(&other.wwdr.certificate)),
        WalletConfigError::Chain(_)
    ));
    // A chain that ends at an untrusted root.
    assert!(matches!(
        PassSigner::with_trust_anchors(chain.credentials(), std::slice::from_ref(&other.root)),
        Err(WalletConfigError::Chain(_))
    ));
    // The service trusts only Apple Root CA.
    assert!(matches!(
        PassSigner::new(chain.credentials()),
        Err(WalletConfigError::Chain(_))
    ));
}

#[test]
fn encrypted_keys_and_single_line_pem_values_are_accepted() {
    let chain = Chain::current();
    let encrypted = String::from_utf8(
        chain
            .signer_key
            .private_key_to_pem_pkcs8_passphrase(Cipher::aes_256_cbc(), b"test-only-passphrase")
            .expect("encrypted key PEM"),
    )
    .expect("ASCII PEM");
    let anchors = std::slice::from_ref(&chain.root);

    let mut credentials = chain.credentials();
    credentials.signer_key = encrypted.clone();
    credentials.signer_key_passphrase = Some("test-only-passphrase".into());
    assert!(PassSigner::with_trust_anchors(credentials, anchors).is_ok());

    let mut credentials = chain.credentials();
    credentials.signer_key = encrypted;
    credentials.signer_key_passphrase = Some("wrong-passphrase".into());
    assert!(matches!(
        PassSigner::with_trust_anchors(credentials, anchors),
        Err(WalletConfigError::SignerKey)
    ));

    // A deployment can store each PEM value on one line with literal `\n`.
    let mut credentials = chain.credentials();
    credentials.signer_cert = credentials.signer_cert.replace('\n', "\\n");
    credentials.signer_key = credentials.signer_key.replace('\n', "\\n");
    credentials.wwdr_cert = credentials.wwdr_cert.replace('\n', "\\n");
    assert!(PassSigner::with_trust_anchors(credentials, anchors).is_ok());
}

#[test]
fn validity_is_the_overlap_of_both_certificates() {
    let now = Utc::now();
    let chain = Chain::new(days(-1, 10), days(-30, 5));
    let signer = chain.signer();
    assert!(signer.is_current(now));
    assert!(!signer.is_current(now - Duration::days(2)));
    assert!(!signer.is_current(now + Duration::days(6)));

    // Expired material still loads, so the service starts and reports
    // WALLET_NOT_CONFIGURED instead of failing.
    let expired = Chain::new(days(-30, -1), days(-60, 60)).signer();
    assert!(!expired.is_current(now));
}

async fn ok_json(response: Response) -> Value {
    let status = response.status();
    let body: Value = response.json().await.expect("Connect JSON body");
    assert_eq!(status, StatusCode::OK, "expected success, got {body}");
    body
}

/// Assert a Connect error with an AIP-193 `ErrorInfo`.
async fn assert_connect_error(response: Response, status: StatusCode, code: &str, reason: &str) {
    let actual = response.status();
    let body: Value = response.json().await.expect("Connect error JSON body");
    assert_eq!(actual, status, "unexpected HTTP status for {body}");
    assert_eq!(body["code"], code, "unexpected Connect code for {body}");
    let value = body["details"]
        .as_array()
        .expect("error details")
        .iter()
        .find(|detail| detail["type"] == "google.rpc.ErrorInfo")
        .and_then(|detail| detail["value"].as_str())
        .unwrap_or_else(|| panic!("ErrorInfo detail in {body}"));
    let bytes = STANDARD_NO_PAD
        .decode(value.trim_end_matches('='))
        .expect("base64 error detail");
    let info = ErrorInfo::decode_from_slice(&bytes).expect("protobuf ErrorInfo");
    assert_eq!(info.reason, reason, "unexpected reason for {body}");
    assert_eq!(info.domain, "boji.leanmuscle.club");
}

async fn get_pass(harness: &Harness, token: &str, name: &str) -> Response {
    harness
        .rpc_json(GET_PASS, Some(token), json!({ "name": name }))
        .await
}

fn wallet_capabilities(signer: PassSigner) -> Capabilities {
    Capabilities {
        wallet: Some(Arc::new(signer)),
        ..Capabilities::default()
    }
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn wallet_service_signs_the_pass_of_an_active_card() {
    let chain = Chain::current();
    let codes = MembershipCodes::new(b"wallet-contract-membership-code-key-0123".as_slice())
        .expect("test key");
    let mut harness = Harness::with_capabilities(Capabilities {
        membership_codes: Some(Arc::new(codes.clone())),
        ..wallet_capabilities(chain.signer())
    })
    .await;
    let config = ok_json(
        harness
            .rpc_json(GET_SERVER_CONFIG, None, json!({ "name": "serverConfig" }))
            .await,
    )
    .await;
    assert_eq!(config["walletPassEnabled"], true);

    let owner = harness.register_verified("wallet-owner").await;
    let missing = format!("users/me/memberships/{}/pass", Uuid::new_v4());
    assert_connect_error(
        get_pass(&harness, &owner.token, &missing).await,
        StatusCode::NOT_FOUND,
        "not_found",
        "MEMBERSHIP_NOT_FOUND",
    )
    .await;

    let card = harness.enroll(&owner, "钱包测试").await;
    let pass_name = format!("{}/pass", card.name);
    assert_connect_error(
        get_pass(&harness, &owner.token, &card.name).await,
        StatusCode::BAD_REQUEST,
        "invalid_argument",
        "INVALID_INPUT",
    )
    .await;
    let other = harness.register_verified("wallet-other").await;
    assert_connect_error(
        get_pass(&harness, &other.token, &pass_name).await,
        StatusCode::FORBIDDEN,
        "permission_denied",
        "RESOURCE_ACCESS_DENIED",
    )
    .await;

    let response = get_pass(
        &harness,
        &owner.token,
        &format!("users/me/memberships/{}/pass", card.membership_id),
    )
    .await;
    assert_eq!(
        response.headers()["cache-control"],
        "no-store",
        "a pass must not be cached"
    );
    let body = ok_json(response).await;
    assert_eq!(body["name"], pass_name);
    assert_eq!(body["mimeType"], PKPASS_MIME_TYPE);
    let archive = STANDARD
        .decode(body["content"].as_str().expect("base64 content"))
        .expect("standard base64");
    let (_, files) = unpack(&archive);
    let pass: Value = serde_json::from_slice(&files["pass.json"]).expect("pass JSON");
    assert_eq!(pass["serialNumber"], card.membership_id);
    assert_eq!(pass["generic"]["primaryFields"][0]["value"], "钱包测试");
    assert_eq!(
        pass["generic"]["headerFields"][0]["value"],
        card.member_number
    );
    let membership = Uuid::parse_str(&card.membership_id).expect("membership UUID");
    assert_eq!(
        pass["barcodes"],
        json!([{
            "format": "PKBarcodeFormatQR",
            "message": codes.static_value(membership).expect("static value"),
            "messageEncoding": "iso-8859-1"
        }])
    );
    let pass_text = String::from_utf8(files["pass.json"].clone()).expect("UTF-8 pass");
    assert!(!pass_text.contains(&owner.email));
    assert!(!pass_text.contains(&owner.user_id));
    assert!(verify_signature(
        &files["signature"],
        &files["manifest.json"],
        &chain.root
    ));

    // The binary protobuf encoding carries the archive as raw bytes.
    let request = p::GetMembershipPassRequest {
        name: pass_name.clone(),
        ..Default::default()
    };
    let response = harness
        .rpc_proto(GET_PASS, &owner.token, request.encode_to_vec())
        .await;
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(response.headers()["content-type"], "application/proto");
    let pass = p::MembershipPass::decode_from_slice(&response.bytes().await.expect("body"))
        .expect("MembershipPass");
    assert_eq!(pass.name, pass_name);
    let (_, files) = unpack(&pass.content);
    assert!(files.contains_key("signature"));

    harness
        .set_membership_status(&card.membership_id, "suspended")
        .await;
    assert_connect_error(
        get_pass(&harness, &owner.token, &pass_name).await,
        StatusCode::BAD_REQUEST,
        "failed_precondition",
        "MEMBERSHIP_SUSPENDED",
    )
    .await;
    harness.shutdown().await;
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn wallet_service_refuses_without_current_signing_material() {
    let expired = Chain::new(days(-30, -1), days(-60, 60)).signer();
    let mut harness = Harness::with_capabilities(wallet_capabilities(expired)).await;
    let config = ok_json(
        harness
            .rpc_json(GET_SERVER_CONFIG, None, json!({ "name": "serverConfig" }))
            .await,
    )
    .await;
    // Connect JSON omits a false boolean.
    assert_ne!(config["walletPassEnabled"], true);

    let owner = harness.register_verified("wallet-expired").await;
    // A missing card is reported before the signing material.
    let missing = format!("users/me/memberships/{}/pass", Uuid::new_v4());
    assert_connect_error(
        get_pass(&harness, &owner.token, &missing).await,
        StatusCode::NOT_FOUND,
        "not_found",
        "MEMBERSHIP_NOT_FOUND",
    )
    .await;
    let card = harness.enroll(&owner, "过期证书").await;
    assert_connect_error(
        get_pass(&harness, &owner.token, &format!("{}/pass", card.name)).await,
        StatusCode::BAD_REQUEST,
        "failed_precondition",
        "WALLET_NOT_CONFIGURED",
    )
    .await;
    harness.shutdown().await;
}

#[test]
fn the_apns_client_accepts_the_signing_identity() {
    let signer = Chain::current().signer();
    assert!(ApnsSender::with_origin(&signer, "https://127.0.0.1:9").is_ok());
}

/// Records each notification instead of calling APNs.
#[derive(Debug)]
struct RecordingSender {
    sent: tokio::sync::mpsc::UnboundedSender<String>,
    /// APNs reports this token as no longer valid.
    gone: &'static str,
}

#[async_trait::async_trait]
impl PushSender for RecordingSender {
    async fn send(&self, push_token: &str) -> PushOutcome {
        let _ = self.sent.send(push_token.to_owned());
        if push_token == self.gone {
            PushOutcome::Unregistered
        } else {
            PushOutcome::Delivered
        }
    }
}

async fn next_push(pushes: &mut tokio::sync::mpsc::UnboundedReceiver<String>) -> String {
    tokio::time::timeout(std::time::Duration::from_secs(5), pushes.recv())
        .await
        .expect("a push within 5 seconds")
        .expect("an open channel")
}

/// A Wallet device that calls the web service of the test server.
struct Device<'h> {
    harness: &'h Harness,
    id: &'static str,
}

impl Device<'_> {
    fn url(&self, path: &str) -> String {
        format!("{}/wallet/v1{path}", self.harness.origin)
    }

    fn registration(&self, serial: &str) -> String {
        self.url(&format!(
            "/devices/{}/registrations/{PASS_TYPE}/{serial}",
            self.id
        ))
    }

    async fn register(&self, serial: &str, token: Option<&str>, body: Value) -> StatusCode {
        let mut request = self
            .harness
            .client
            .post(self.registration(serial))
            .json(&body);
        if let Some(token) = token {
            request = request.header("authorization", format!("ApplePass {token}"));
        }
        request.send().await.expect("register").status()
    }

    async fn unregister(&self, serial: &str, token: &str) -> StatusCode {
        self.harness
            .client
            .delete(self.registration(serial))
            .header("authorization", format!("ApplePass {token}"))
            .send()
            .await
            .expect("unregister")
            .status()
    }

    /// Return the status, the serial numbers and the update tag.
    async fn updated(&self, since: Option<&str>) -> (StatusCode, Vec<String>, String) {
        let mut url = self.url(&format!("/devices/{}/registrations/{PASS_TYPE}", self.id));
        if let Some(since) = since {
            url = format!("{url}?passesUpdatedSince={since}");
        }
        let response = self.harness.client.get(url).send().await.expect("updated");
        let status = response.status();
        if status != StatusCode::OK {
            return (status, Vec::new(), String::new());
        }
        let body: Value = response.json().await.expect("SerialNumbers JSON");
        let serials = body["serialNumbers"]
            .as_array()
            .expect("serialNumbers")
            .iter()
            .map(|serial| serial.as_str().expect("serial").to_owned())
            .collect();
        let tag = body["lastUpdated"]
            .as_str()
            .expect("lastUpdated")
            .to_owned();
        (status, serials, tag)
    }

    async fn latest(&self, serial: &str, token: &str) -> Response {
        self.harness
            .client
            .get(self.url(&format!("/passes/{PASS_TYPE}/{serial}")))
            .header("authorization", format!("ApplePass {token}"))
            .send()
            .await
            .expect("latest pass")
    }
}

async fn latest_pass_json(response: Response) -> Value {
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(response.headers()["content-type"], PKPASS_MIME_TYPE);
    assert!(response.headers().contains_key("last-modified"));
    let archive = response.bytes().await.expect("pass body");
    let (_, files) = unpack(&archive);
    serde_json::from_slice(&files["pass.json"]).expect("pass JSON")
}

#[tokio::test]
#[ignore = "requires an isolated PostgreSQL TEST_DATABASE_URL and loopback networking"]
async fn the_web_service_registers_devices_and_reports_changes() {
    let chain = Chain::current();
    let (sent, mut pushes) = tokio::sync::mpsc::unbounded_channel();
    let mut harness = Harness::with_capabilities(Capabilities {
        wallet: Some(Arc::new(chain.signer())),
        wallet_push: Some(Arc::new(RecordingSender { sent, gone: "dead" })),
        ..Capabilities::default()
    })
    .await;
    let operator = harness.register_verified("wallet-operator").await;
    harness.set_role(&operator.user_id, "operator").await;
    let owner = harness.register_verified("wallet-device-owner").await;
    let card = harness.enroll(&owner, "钱包更新").await;
    let body =
        ok_json(get_pass(&harness, &owner.token, &format!("{}/pass", card.name)).await).await;
    let archive = STANDARD
        .decode(body["content"].as_str().expect("base64 content"))
        .expect("standard base64");
    let (_, files) = unpack(&archive);
    let pass: Value = serde_json::from_slice(&files["pass.json"]).expect("pass JSON");
    let serial = pass["serialNumber"].as_str().expect("serial").to_owned();
    let token = pass["authenticationToken"]
        .as_str()
        .expect("token")
        .to_owned();
    let phone = Device {
        harness: &harness,
        id: "phone0001",
    };
    let push = json!({ "pushToken": "aa11" });

    // Each request about one pass needs the token of that pass.
    assert_eq!(
        phone.register(&serial, None, push.clone()).await,
        StatusCode::UNAUTHORIZED
    );
    let wrong = "0".repeat(token.len());
    assert_eq!(
        phone.register(&serial, Some(&wrong), push.clone()).await,
        StatusCode::UNAUTHORIZED
    );
    let other = Uuid::new_v4().to_string();
    assert_eq!(
        phone.register(&other, Some(&token), push.clone()).await,
        StatusCode::UNAUTHORIZED
    );
    assert_eq!(
        phone
            .register(&serial, Some(&token), json!({ "pushToken": "not/hex" }))
            .await,
        StatusCode::BAD_REQUEST
    );
    assert_eq!(phone.updated(None).await.0, StatusCode::NO_CONTENT);

    assert_eq!(
        phone.register(&serial, Some(&token), push.clone()).await,
        StatusCode::CREATED
    );
    assert_eq!(
        phone.register(&serial, Some(&token), push).await,
        StatusCode::OK
    );
    let (status, serials, first_tag) = phone.updated(None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(serials, std::slice::from_ref(&serial));
    assert_eq!(
        phone.updated(Some(&first_tag)).await.0,
        StatusCode::NO_CONTENT
    );
    let latest = latest_pass_json(phone.latest(&serial, &token).await).await;
    assert_eq!(latest["serialNumber"], serial);
    assert!(latest.get("voided").is_none());
    assert_eq!(
        phone.latest(&serial, &wrong).await.status(),
        StatusCode::UNAUTHORIZED
    );

    // A suspension voids the pass and notifies the device.
    ok_json(
        harness
            .rpc_json(
                &format!("{ADMIN_MEMBERSHIPS}/SuspendMembership"),
                Some(&operator.token),
                json!({ "name": card.name, "reason": "wallet update test" }),
            )
            .await,
    )
    .await;
    assert_eq!(next_push(&mut pushes).await, "aa11");
    let (status, serials, second_tag) = phone.updated(Some(&first_tag)).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(serials, std::slice::from_ref(&serial));
    assert!(second_tag.parse::<i64>().unwrap() > first_tag.parse::<i64>().unwrap());
    let latest = latest_pass_json(phone.latest(&serial, &token).await).await;
    assert_eq!(latest["voided"], true);
    assert_eq!(
        latest["generic"]["auxiliaryFields"][0]["value"],
        "Suspended"
    );

    // APNs rejects the token of the second device, so its registration goes.
    let watch = Device {
        harness: &harness,
        id: "watch0001",
    };
    assert_eq!(
        watch
            .register(&serial, Some(&token), json!({ "pushToken": "dead" }))
            .await,
        StatusCode::CREATED
    );
    ok_json(
        harness
            .rpc_json(
                &format!("{ADMIN_MEMBERSHIPS}/ResumeMembership"),
                Some(&operator.token),
                json!({ "name": card.name, "reason": "wallet update test" }),
            )
            .await,
    )
    .await;
    let mut tokens = [next_push(&mut pushes).await, next_push(&mut pushes).await];
    tokens.sort();
    assert_eq!(tokens, ["aa11", "dead"]);
    let mut forgotten = false;
    for _ in 0..50 {
        if watch.updated(None).await.0 == StatusCode::NO_CONTENT {
            forgotten = true;
            break;
        }
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    }
    assert!(forgotten, "the rejected push token must be removed");
    let latest = latest_pass_json(phone.latest(&serial, &token).await).await;
    assert!(latest.get("voided").is_none());

    assert_eq!(phone.unregister(&serial, &token).await, StatusCode::OK);
    assert_eq!(phone.updated(None).await.0, StatusCode::NO_CONTENT);
    let log = harness
        .client
        .post(phone.url("/log"))
        .json(&json!({ "logs": ["a test message"] }))
        .send()
        .await
        .expect("log");
    assert_eq!(log.status(), StatusCode::OK);
    harness.shutdown().await;
}
