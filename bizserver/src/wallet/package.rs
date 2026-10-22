//! The files of a `.pkpass` archive.
//!
//! `pass.json` holds the fallback text of every string. Each language of
//! [`strings::LANGUAGES`] gets a `<language>.lproj/pass.strings` file that maps
//! the fallback text to its own text, so Wallet shows the language of the device.

use std::collections::BTreeMap;
use std::io::{Cursor, Write};

use chrono::{DateTime, SecondsFormat, Utc};
use serde_json::{Value, json};
use zip::write::SimpleFileOptions;
use zip::{CompressionMethod, ZipWriter};

use super::strings::{self, Text};
use super::{CardStatus, MembershipCard, OrganizationKind, PassOrganization, SigningError};

const ICON: &[u8] = include_bytes!("../../assets/wallet/icon.png");
const ICON_2X: &[u8] = include_bytes!("../../assets/wallet/icon@2x.png");
const ICON_3X: &[u8] = include_bytes!("../../assets/wallet/icon@3x.png");
const LOGO: &[u8] = include_bytes!("../../assets/wallet/logo.png");
const LOGO_2X: &[u8] = include_bytes!("../../assets/wallet/logo@2x.png");
const LOGO_3X: &[u8] = include_bytes!("../../assets/wallet/logo@3x.png");

/// Colors of the forest card face in the app. The label color has a contrast
/// ratio above 4.5:1 on the background.
const BACKGROUND_COLOR: &str = "rgb(33, 66, 54)";
const FOREGROUND_COLOR: &str = "rgb(247, 242, 224)";
const LABEL_COLOR: &str = "rgb(183, 189, 173)";

/// The identity and web service fields of a pass.
pub(super) struct Issuer<'a> {
    pub pass_type_identifier: &'a str,
    pub team_identifier: &'a str,
    /// Base URL of the Wallet web service, without the `/v1` version segment.
    pub web_service_url: &'a str,
    /// The token that Wallet sends to the web service for this pass.
    pub authentication_token: &'a str,
}

/// The translations that one pass needs, by language of [`strings::LANGUAGES`].
struct Translations {
    entries: Vec<BTreeMap<String, String>>,
}

impl Translations {
    fn new() -> Self {
        let entries = strings::LANGUAGES
            .iter()
            .enumerate()
            .map(|(index, _)| {
                strings::ALL
                    .iter()
                    .map(|text| (text.key().to_owned(), text.values[index].to_owned()))
                    .collect::<BTreeMap<_, _>>()
            })
            .collect();
        Self { entries }
    }
}

/// Encode `pass.json` for `card`.
///
/// `sharingProhibited` keeps the nickname off AirDrop and Mail. A suspended
/// card becomes a voided pass. Wallet keeps a voided pass up to date, so the
/// pass becomes valid again when the card is resumed.
pub(super) fn pass_json(
    issuer: &Issuer<'_>,
    card: &MembershipCard<'_>,
) -> Result<Vec<u8>, SigningError> {
    let mut secondary = vec![json!({
        "key": "joinDate",
        "label": strings::WALLET_LABEL_JOIN_DATE.key(),
        "value": date(card.joined_at),
        "dateStyle": "PKDateStyleMedium",
        "timeStyle": "PKDateStyleNone"
    })];
    if let Some((organization, name)) = shown_organization(card) {
        secondary.push(json!({
            "key": "organization",
            "label": organization_label(organization.kind).key(),
            "value": name
        }));
    }
    let mut auxiliary = Vec::new();
    if let Some(expires_at) = card.expires_at {
        auxiliary.push(json!({
            "key": "expiry",
            "label": strings::WALLET_LABEL_EXPIRY.key(),
            "value": date(expires_at),
            "dateStyle": "PKDateStyleMedium",
            "timeStyle": "PKDateStyleNone"
        }));
    }
    let suspended = card.status == CardStatus::Suspended;
    if suspended {
        auxiliary.push(json!({
            "key": "status",
            "label": strings::WALLET_LABEL_STATUS.key(),
            "value": strings::WALLET_STATUS_SUSPENDED.key()
        }));
    }
    let status_text = if suspended {
        &strings::WALLET_BACK_SUSPENDED
    } else {
        &strings::WALLET_BACK_STATUS
    };
    let mut pass = json!({
        "formatVersion": 1,
        "passTypeIdentifier": issuer.pass_type_identifier,
        "teamIdentifier": issuer.team_identifier,
        "organizationName": strings::WALLET_APP_NAME.key(),
        "serialNumber": card.membership_id,
        "description": strings::WALLET_PASS_DESCRIPTION.key(),
        "logoText": strings::WALLET_APP_NAME.key(),
        "backgroundColor": BACKGROUND_COLOR,
        "foregroundColor": FOREGROUND_COLOR,
        "labelColor": LABEL_COLOR,
        "sharingProhibited": true,
        "webServiceURL": issuer.web_service_url,
        "authenticationToken": issuer.authentication_token,
        "generic": {
            "headerFields": [{
                "key": "cardNumber",
                "label": strings::WALLET_LABEL_CARD_NUMBER.key(),
                "value": card.member_number
            }],
            "primaryFields": [{
                "key": "nickname",
                "label": strings::WALLET_LABEL_NICKNAME.key(),
                "value": card.display_name
            }],
            "secondaryFields": secondary,
            "auxiliaryFields": auxiliary,
            "backFields": [
                back_field("about", &strings::WALLET_BACK_ABOUT_LABEL, &strings::WALLET_BACK_ABOUT),
                back_field("usage", &strings::WALLET_BACK_USAGE_LABEL, &strings::WALLET_BACK_USAGE),
                back_field("status", &strings::WALLET_BACK_STATUS_LABEL, status_text)
            ]
        }
    });
    if suspended {
        pass["voided"] = Value::Bool(true);
    }
    if let Some(expires_at) = card.expires_at {
        pass["expirationDate"] = Value::String(date(expires_at));
    }
    Ok(serde_json::to_vec(&pass)?)
}

fn back_field(key: &str, label: &Text, value: &Text) -> Value {
    json!({ "key": key, "label": label.key(), "value": value.key() })
}

fn date(time: DateTime<Utc>) -> String {
    time.to_rfc3339_opts(SecondsFormat::Secs, true)
}

fn organization_label(kind: OrganizationKind) -> &'static Text {
    match kind {
        OrganizationKind::School => &strings::WALLET_LABEL_SCHOOL,
    }
}

/// The organization that the pass shows, with its fallback name: the first
/// organization that has a name. The generic layout has room for one.
fn shown_organization<'c>(
    card: &'c MembershipCard<'c>,
) -> Option<(&'c PassOrganization<'c>, &'c str)> {
    card.organizations
        .iter()
        .find_map(|organization| Some((organization, organization.fallback_name()?)))
}

/// Return `pass.json`, the images and the `pass.strings` files, in archive order.
pub(super) fn files(pass: Vec<u8>, card: &MembershipCard<'_>) -> Vec<(String, Vec<u8>)> {
    let mut files = vec![
        ("pass.json".to_owned(), pass),
        ("icon.png".to_owned(), ICON.to_vec()),
        ("icon@2x.png".to_owned(), ICON_2X.to_vec()),
        ("icon@3x.png".to_owned(), ICON_3X.to_vec()),
        ("logo.png".to_owned(), LOGO.to_vec()),
        ("logo@2x.png".to_owned(), LOGO_2X.to_vec()),
        ("logo@3x.png".to_owned(), LOGO_3X.to_vec()),
    ];
    let mut translations = Translations::new();
    if let Some((organization, name)) = shown_organization(card) {
        add_organization(&mut translations, organization, name);
    }
    for (language, entries) in strings::LANGUAGES.iter().zip(&translations.entries) {
        files.push((
            format!("{language}.lproj/pass.strings"),
            pass_strings(entries),
        ));
    }
    files
}

/// Translate the name of `organization` into the languages that it has.
///
/// A static string with the same fallback text keeps its translation, so a
/// name cannot change the text of a label.
fn add_organization(
    translations: &mut Translations,
    organization: &PassOrganization<'_>,
    key: &str,
) {
    if strings::ALL.iter().any(|text| text.key() == key) {
        return;
    }
    for (language, entries) in strings::LANGUAGES.iter().zip(&mut translations.entries) {
        let name = organization
            .names
            .iter()
            .find(|name| name.language == *language)
            .map(|name| name.text.trim())
            .filter(|text| !text.is_empty())
            .unwrap_or(key);
        entries.insert(key.to_owned(), name.to_owned());
    }
}

/// Encode a `pass.strings` file in UTF-16 with a byte order mark.
fn pass_strings(entries: &BTreeMap<String, String>) -> Vec<u8> {
    let mut text = String::new();
    for (key, value) in entries {
        text.push_str(&format!("\"{}\" = \"{}\";\n", escape(key), escape(value)));
    }
    let mut bytes = vec![0xFF, 0xFE];
    for unit in text.encode_utf16() {
        bytes.extend_from_slice(&unit.to_le_bytes());
    }
    bytes
}

/// Escape a `.strings` value: backslash, quote and line breaks.
fn escape(value: &str) -> String {
    let mut escaped = String::with_capacity(value.len());
    for character in value.chars() {
        match character {
            '\\' => escaped.push_str("\\\\"),
            '"' => escaped.push_str("\\\""),
            '\n' => escaped.push_str("\\n"),
            '\r' => escaped.push_str("\\r"),
            '\t' => escaped.push_str("\\t"),
            other => escaped.push(other),
        }
    }
    escaped
}

/// Encode `manifest.json`: the SHA-1 hex digest of every file.
pub(super) fn manifest(files: &[(String, Vec<u8>)]) -> Result<Vec<u8>, SigningError> {
    let digests: BTreeMap<&str, String> = files
        .iter()
        .map(|(name, content)| (name.as_str(), hex::encode(openssl::sha::sha1(content))))
        .collect();
    Ok(serde_json::to_vec(&digests)?)
}

/// Write `files` into a ZIP archive without compression.
pub(super) fn archive(files: &[(String, Vec<u8>)]) -> Result<Vec<u8>, SigningError> {
    let options = SimpleFileOptions::default().compression_method(CompressionMethod::Stored);
    let mut writer = ZipWriter::new(Cursor::new(Vec::new()));
    for (name, content) in files {
        writer.start_file(name.as_str(), options)?;
        writer.write_all(content)?;
    }
    Ok(writer.finish()?.into_inner())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::wallet::LocalizedName;
    use chrono::TimeZone;

    const ISSUER: Issuer<'static> = Issuer {
        pass_type_identifier: "pass.club.example.membership",
        team_identifier: "TEAM123456",
        web_service_url: "https://example.test/wallet",
        authentication_token: "0123456789abcdef0123456789abcdef",
    };

    fn card<'a>(
        status: CardStatus,
        organizations: &'a [PassOrganization<'static>],
    ) -> MembershipCard<'a> {
        MembershipCard {
            membership_id: "membership-1",
            display_name: "小林",
            member_number: "M-0001",
            joined_at: Utc.with_ymd_and_hms(2026, 1, 2, 3, 4, 5).unwrap(),
            expires_at: None,
            status,
            organizations,
        }
    }

    fn pass(card: &MembershipCard<'_>) -> Value {
        serde_json::from_slice(&pass_json(&ISSUER, card).unwrap()).unwrap()
    }

    fn decode(bytes: &[u8]) -> String {
        assert_eq!(&bytes[..2], &[0xFF, 0xFE]);
        let (pairs, rest) = bytes[2..].as_chunks::<2>();
        assert!(rest.is_empty());
        let units: Vec<u16> = pairs.iter().map(|pair| u16::from_le_bytes(*pair)).collect();
        String::from_utf16(&units).unwrap()
    }

    fn file<'f>(files: &'f [(String, Vec<u8>)], name: &str) -> &'f [u8] {
        &files.iter().find(|(path, _)| path == name).unwrap().1
    }

    #[test]
    fn manifest_lists_sha1_digests_by_name() {
        let manifest = manifest(&[
            ("b".to_owned(), b"abc".to_vec()),
            ("a".to_owned(), Vec::new()),
        ])
        .unwrap();
        assert_eq!(
            String::from_utf8(manifest).unwrap(),
            r#"{"a":"da39a3ee5e6b4b0d3255bfef95601890afd80709","b":"a9993e364706816aba3e25717850c26c9cd0d89d"}"#
        );
    }

    #[test]
    fn an_active_card_uses_fallback_text_and_the_web_service() {
        let pass = pass(&card(CardStatus::Active, &[]));
        assert_eq!(pass["organizationName"], "Lean Muscle");
        assert_eq!(pass["logoText"], "Lean Muscle");
        assert_eq!(pass["description"], "Lean Muscle Member Card");
        assert_eq!(pass["webServiceURL"], ISSUER.web_service_url);
        assert_eq!(pass["authenticationToken"], ISSUER.authentication_token);
        assert_eq!(pass["backgroundColor"], BACKGROUND_COLOR);
        assert!(pass.get("voided").is_none());
        assert!(pass.get("expirationDate").is_none());
        let generic = &pass["generic"];
        assert_eq!(generic["headerFields"][0]["label"], "Card Number");
        assert_eq!(generic["headerFields"][0]["value"], "M-0001");
        assert_eq!(generic["primaryFields"][0]["value"], "小林");
        assert_eq!(
            generic["secondaryFields"][0]["value"],
            "2026-01-02T03:04:05Z"
        );
        assert_eq!(generic["secondaryFields"].as_array().unwrap().len(), 1);
        assert_eq!(generic["auxiliaryFields"].as_array().unwrap().len(), 0);
        assert_eq!(
            generic["backFields"][2]["value"],
            strings::WALLET_BACK_STATUS.key()
        );
    }

    #[test]
    fn a_suspended_card_is_void_and_says_so() {
        let mut card = card(CardStatus::Suspended, &[]);
        card.expires_at = Some(Utc.with_ymd_and_hms(2027, 1, 2, 0, 0, 0).unwrap());
        let pass = pass(&card);
        assert_eq!(pass["voided"], true);
        assert_eq!(pass["expirationDate"], "2027-01-02T00:00:00Z");
        let auxiliary = pass["generic"]["auxiliaryFields"].as_array().unwrap();
        assert_eq!(auxiliary[0]["key"], "expiry");
        assert_eq!(auxiliary[1]["value"], "Suspended");
        assert_eq!(
            pass["generic"]["backFields"][2]["value"],
            strings::WALLET_BACK_SUSPENDED.key()
        );
    }

    #[test]
    fn every_language_gets_a_pass_strings_file() {
        let card = card(CardStatus::Active, &[]);
        let files = files(pass_json(&ISSUER, &card).unwrap(), &card);
        let zh = decode(file(&files, "zh-Hans.lproj/pass.strings"));
        assert!(zh.contains("\"Card Number\" = \"会员卡号\";\n"));
        assert!(zh.contains("\"Lean Muscle\" = \"薄肌\";\n"));
        let en = decode(file(&files, "en.lproj/pass.strings"));
        assert!(en.contains("\"Card Number\" = \"Card Number\";\n"));
        assert_eq!(en.lines().count(), strings::ALL.len());
        assert_eq!(file(&files, "logo@3x.png"), LOGO_3X);
    }

    #[test]
    fn an_organization_shows_its_name_in_each_language() {
        const NAMES: &[LocalizedName<'static>] = &[
            LocalizedName {
                language: "en",
                text: "Example \"Tech\" University",
            },
            LocalizedName {
                language: "zh-Hans",
                text: "示例科技大学",
            },
        ];
        let organizations = [PassOrganization {
            kind: OrganizationKind::School,
            names: NAMES,
        }];
        let card = card(CardStatus::Active, &organizations);
        let pass = pass(&card);
        let organization = &pass["generic"]["secondaryFields"][1];
        assert_eq!(organization["label"], "School");
        assert_eq!(organization["value"], "Example \"Tech\" University");

        let files = files(pass_json(&ISSUER, &card).unwrap(), &card);
        let zh = decode(file(&files, "zh-Hans.lproj/pass.strings"));
        assert!(zh.contains("\"Example \\\"Tech\\\" University\" = \"示例科技大学\";\n"));
        assert!(zh.contains("\"School\" = \"学校\";\n"));
    }

    #[test]
    fn an_organization_name_cannot_replace_a_label() {
        const NAMES: &[LocalizedName<'static>] = &[
            LocalizedName {
                language: "en",
                text: "Status",
            },
            LocalizedName {
                language: "zh-Hans",
                text: "伪造",
            },
        ];
        let organizations = [PassOrganization {
            kind: OrganizationKind::School,
            names: NAMES,
        }];
        let card = card(CardStatus::Active, &organizations);
        let files = files(pass_json(&ISSUER, &card).unwrap(), &card);
        let zh = decode(file(&files, "zh-Hans.lproj/pass.strings"));
        assert!(zh.contains("\"Status\" = \"状态\";\n"));
        assert!(!zh.contains("伪造"));
    }

    #[test]
    fn escapes_strings_values() {
        assert_eq!(escape("a\\b\"c\nd"), "a\\\\b\\\"c\\nd");
    }
}
