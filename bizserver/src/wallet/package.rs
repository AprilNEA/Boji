//! The files of a `.pkpass` archive.

use std::collections::BTreeMap;
use std::io::{Cursor, Write};

use chrono::SecondsFormat;
use serde_json::json;
use zip::write::SimpleFileOptions;
use zip::{CompressionMethod, ZipWriter};

use super::{MembershipCard, SigningError};

const ICON: &[u8] = include_bytes!("../../assets/wallet/icon.png");
const ICON_2X: &[u8] = include_bytes!("../../assets/wallet/icon@2x.png");
const ICON_3X: &[u8] = include_bytes!("../../assets/wallet/icon@3x.png");

/// The identity fields that every pass of the service shares.
pub(super) struct Issuer<'a> {
    pub pass_type_identifier: &'a str,
    pub team_identifier: &'a str,
    pub organization_name: &'a str,
}

/// Encode `pass.json` for `card`.
///
/// The pass has no barcode and no web service, so Wallet never updates it.
/// `sharingProhibited` keeps the nickname off AirDrop and Mail.
pub(super) fn pass_json(
    issuer: &Issuer<'_>,
    card: &MembershipCard<'_>,
) -> Result<Vec<u8>, SigningError> {
    let joined_at = card.joined_at.to_rfc3339_opts(SecondsFormat::Secs, true);
    let pass = json!({
        "formatVersion": 1,
        "passTypeIdentifier": issuer.pass_type_identifier,
        "teamIdentifier": issuer.team_identifier,
        "organizationName": issuer.organization_name,
        "serialNumber": card.membership_id,
        "description": "薄肌免费会员卡",
        "logoText": "薄肌",
        "backgroundColor": "rgb(0, 0, 0)",
        "foregroundColor": "rgb(255, 255, 255)",
        "labelColor": "rgb(255, 255, 255)",
        "sharingProhibited": true,
        "generic": {
            "primaryFields": [
                { "key": "name", "label": "昵称", "value": card.display_name }
            ],
            "secondaryFields": [
                { "key": "memberNumber", "label": "会员编号", "value": card.member_number },
                {
                    "key": "joinedAt",
                    "label": "加入日期",
                    "value": joined_at,
                    "dateStyle": "PKDateStyleMedium",
                    "timeStyle": "PKDateStyleNone"
                }
            ],
            "backFields": [
                { "key": "membership", "label": "会员卡", "value": "这是薄肌免费会员卡。" },
                { "key": "usage", "label": "使用说明", "value": "本卡不是付款或核销凭证。" },
                { "key": "status", "label": "会员状态", "value": "会员状态以 App 为准，本卡不会自动更新。" }
            ]
        }
    });
    Ok(serde_json::to_vec(&pass)?)
}

/// Return `pass.json` and the icons, in archive order.
pub(super) fn files(pass: Vec<u8>) -> Vec<(&'static str, Vec<u8>)> {
    vec![
        ("pass.json", pass),
        ("icon.png", ICON.to_vec()),
        ("icon@2x.png", ICON_2X.to_vec()),
        ("icon@3x.png", ICON_3X.to_vec()),
    ]
}

/// Encode `manifest.json`: the SHA-1 hex digest of every file.
pub(super) fn manifest(files: &[(&str, Vec<u8>)]) -> Result<Vec<u8>, SigningError> {
    let digests: BTreeMap<&str, String> = files
        .iter()
        .map(|(name, content)| (*name, hex(&openssl::sha::sha1(content))))
        .collect();
    Ok(serde_json::to_vec(&digests)?)
}

/// Write `files` into a ZIP archive without compression.
pub(super) fn archive(files: &[(&str, Vec<u8>)]) -> Result<Vec<u8>, SigningError> {
    let options = SimpleFileOptions::default().compression_method(CompressionMethod::Stored);
    let mut writer = ZipWriter::new(Cursor::new(Vec::new()));
    for (name, content) in files {
        writer.start_file(*name, options)?;
        writer.write_all(content)?;
    }
    Ok(writer.finish()?.into_inner())
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn manifest_lists_sha1_digests_by_name() {
        let manifest = manifest(&[("b", b"abc".to_vec()), ("a", Vec::new())]).unwrap();
        assert_eq!(
            String::from_utf8(manifest).unwrap(),
            r#"{"a":"da39a3ee5e6b4b0d3255bfef95601890afd80709","b":"a9993e364706816aba3e25717850c26c9cd0d89d"}"#
        );
    }
}
