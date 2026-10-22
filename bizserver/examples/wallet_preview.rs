//! Signs sample membership passes for the Wallet screenshot in the root `README.md`.
//!
//! Usage: `cargo run --example wallet_preview -- <output directory>`
//!
//! The example reads `WALLET_PASS_TYPE_IDENTIFIER`, `WALLET_TEAM_IDENTIFIER`,
//! `WALLET_SIGNER_CERT`, `WALLET_SIGNER_KEY` and `WALLET_WWDR_CERT` from the
//! environment. The three PEM values are text, not file paths. Pass them with
//! `op run` or `op read`, so that the private key does not reach the disk.
//!
//! Wallet accepts a pass only when an Apple-issued Pass Type ID certificate
//! signs it, so a test chain does not work here. The example writes
//! `active.pkpass`, `school.pkpass` and `suspended.pkpass` with sample data:
//! the card nickname 薄肌同学, the card number `1`, and the school 西交利物浦大学
//! on `school.pkpass`. The passes point at `example.invalid`, so a device that
//! adds them never registers with a real server. Their QR codes use a preview
//! key, so no server accepts them.

use boji_bizserver::{
    domain::membership_code::MembershipCodes,
    wallet::{
        CardStatus, LocalizedName, MembershipCard, OrganizationKind, PassOrganization, PassSigner,
        WalletCredentials,
    },
};
use chrono::{TimeZone, Utc};
use std::{env, error::Error, fs, path::PathBuf};
use uuid::Uuid;

/// The `webServiceURL` of the sample passes. The `.invalid` domain never resolves.
const PREVIEW_WEB_SERVICE_URL: &str = "https://example.invalid/wallet";

/// The token key of the sample passes. It only has to be long enough for the signer.
const PREVIEW_TOKEN_KEY: &[u8] = b"wallet-preview-only-token-key-0123456789";

/// The membership code key of the sample passes. No server uses it.
const PREVIEW_CODE_KEY: &[u8] = b"wallet-preview-only-membership-code-key-0123";

fn var(name: &str) -> Result<String, Box<dyn Error>> {
    env::var(name).map_err(|_| format!("{name} is not set").into())
}

fn main() -> Result<(), Box<dyn Error>> {
    let out = PathBuf::from(
        env::args()
            .nth(1)
            .ok_or("usage: wallet_preview <output directory>")?,
    );
    fs::create_dir_all(&out)?;

    let credentials = WalletCredentials {
        pass_type_identifier: var("WALLET_PASS_TYPE_IDENTIFIER")?.trim().to_owned(),
        team_identifier: var("WALLET_TEAM_IDENTIFIER")?.trim().to_owned(),
        signer_cert: var("WALLET_SIGNER_CERT")?,
        signer_key: var("WALLET_SIGNER_KEY")?,
        signer_key_passphrase: None,
        wwdr_cert: var("WALLET_WWDR_CERT")?,
        web_service_url: PREVIEW_WEB_SERVICE_URL.to_owned(),
        authentication_token_key: PREVIEW_TOKEN_KEY.to_vec(),
    };
    // `new` checks the chain against the bundled Apple Root CA.
    let signer = PassSigner::new(credentials)?;
    let codes = MembershipCodes::new(PREVIEW_CODE_KEY)?;

    let school_names = [
        LocalizedName {
            language: "en",
            text: "Xi'an Jiaotong-Liverpool University",
        },
        LocalizedName {
            language: "zh-Hans",
            text: "西交利物浦大学",
        },
    ];
    let school = [PassOrganization {
        kind: OrganizationKind::School,
        names: &school_names,
    }];

    let joined_at = Utc
        .with_ymd_and_hms(2026, 10, 20, 2, 0, 0)
        .single()
        .ok_or("invalid join date")?;
    let samples: [(&str, CardStatus, &[PassOrganization]); 3] = [
        ("active", CardStatus::Active, &[]),
        ("school", CardStatus::Active, &school),
        ("suspended", CardStatus::Suspended, &[]),
    ];
    for (index, (name, status, organizations)) in samples.into_iter().enumerate() {
        // Each sample gets its own serial number, so that Wallet keeps them apart.
        let membership = Uuid::from_u128(0x0000_0000_0000_4000_8000_0000_0000_0001 + index as u128);
        let membership_id = membership.to_string();
        let code = codes.static_value(membership)?;
        let card = MembershipCard {
            membership_id: &membership_id,
            display_name: "薄肌同学",
            member_number: "1",
            joined_at,
            expires_at: None,
            status,
            organizations,
            code: Some(&code),
        };
        let path = out.join(format!("{name}.pkpass"));
        fs::write(&path, signer.sign(&card)?)?;
        println!("{}", path.display());
    }
    Ok(())
}
