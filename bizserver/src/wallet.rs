//! Apple Wallet passes for membership cards.
//!
//! Input: the `WALLET_*` credentials and one membership card.
//! Output: a signed `.pkpass` archive.
//! Pos: signing only. `rpc/wallet.rs` checks ownership and membership state.

mod package;

use chrono::{DateTime, Utc};
use openssl::asn1::{Asn1Time, Asn1TimeRef};
use openssl::nid::Nid;
use openssl::pkcs7::{Pkcs7, Pkcs7Flags};
use openssl::pkey::{PKey, Private};
use openssl::stack::Stack;
use openssl::x509::store::X509StoreBuilder;
use openssl::x509::verify::X509VerifyFlags;
use openssl::x509::{X509, X509Ref, X509StoreContext, X509VerifyResult};
use thiserror::Error;

/// Media type of a `.pkpass` archive.
pub const PKPASS_MIME_TYPE: &str = "application/vnd.apple.pkpass";

/// Apple Root CA, the trust anchor of every pass signing certificate.
///
/// `assets/wallet/README.md` records the source and the fingerprint.
const APPLE_ROOT_CA: &[u8] = include_bytes!("../assets/wallet/apple-root-ca.crt");

/// `WALLET_*` values after the configuration checked that all are present.
pub struct WalletCredentials {
    /// Pass Type ID, for example `pass.club.example.membership`.
    pub pass_type_identifier: String,
    /// Apple Developer Team ID.
    pub team_identifier: String,
    /// Organization name that Wallet shows.
    pub organization_name: String,
    /// PEM signing certificate of the Pass Type ID.
    pub signer_cert: String,
    /// PEM private key of the signing certificate. Never log this field.
    pub signer_key: String,
    /// Passphrase of an encrypted `signer_key`. Never log this field.
    pub signer_key_passphrase: Option<String>,
    /// PEM Apple WWDR intermediate certificate that issued `signer_cert`.
    pub wwdr_cert: String,
}

/// A rejected Wallet credential. The messages name variables, not values.
#[derive(Debug, Error)]
pub enum WalletConfigError {
    /// The signing certificate is not a PEM certificate.
    #[error("WALLET_SIGNER_CERT must be a PEM certificate")]
    SignerCert,
    /// The WWDR certificate is not a PEM certificate.
    #[error("WALLET_WWDR_CERT must be a PEM certificate")]
    WwdrCert,
    /// The private key cannot be read.
    #[error(
        "WALLET_SIGNER_KEY must be a PEM private key; if it is encrypted, \
         WALLET_SIGNER_KEY_PASSPHRASE must be its passphrase"
    )]
    SignerKey,
    /// The private key does not belong to the signing certificate.
    #[error("WALLET_SIGNER_KEY does not belong to WALLET_SIGNER_CERT")]
    KeyMismatch,
    /// The certificate names another Pass Type ID.
    #[error("WALLET_SIGNER_CERT must have WALLET_PASS_TYPE_IDENTIFIER as its subject UID")]
    PassTypeMismatch,
    /// The certificate names another team.
    #[error("WALLET_SIGNER_CERT must have WALLET_TEAM_IDENTIFIER as its subject OU")]
    TeamMismatch,
    /// The certificate chain does not end at a trusted root.
    #[error(
        "WALLET_SIGNER_CERT must be issued by WALLET_WWDR_CERT, \
         and WALLET_WWDR_CERT by Apple Root CA: {0}"
    )]
    Chain(String),
}

/// A pass could not be built or signed.
#[derive(Debug, Error)]
pub enum SigningError {
    /// OpenSSL failed to sign the manifest.
    #[error("pass signature failed")]
    Signature(#[from] openssl::error::ErrorStack),
    /// The archive could not be written.
    #[error("pass archive failed")]
    Archive(#[from] zip::result::ZipError),
    /// The archive could not be written.
    #[error("pass archive failed")]
    Io(#[from] std::io::Error),
    /// A pass file could not be encoded.
    #[error("pass encoding failed")]
    Json(#[from] serde_json::Error),
}

/// The membership values that a pass shows.
pub struct MembershipCard<'a> {
    /// Membership ID. It becomes the pass serial number.
    pub membership_id: &'a str,
    /// Card nickname.
    pub display_name: &'a str,
    /// Membership number. Shown as the server returned it.
    pub member_number: &'a str,
    /// Time the membership started.
    pub joined_at: DateTime<Utc>,
}

/// Checked Wallet credentials that sign passes.
pub struct PassSigner {
    pass_type_identifier: String,
    team_identifier: String,
    organization_name: String,
    signer: X509,
    key: PKey<Private>,
    wwdr: X509,
    valid_from: DateTime<Utc>,
    valid_until: DateTime<Utc>,
}

impl std::fmt::Debug for PassSigner {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("PassSigner")
            .field("pass_type_identifier", &self.pass_type_identifier)
            .field("team_identifier", &self.team_identifier)
            .field("valid_from", &self.valid_from)
            .field("valid_until", &self.valid_until)
            .finish_non_exhaustive()
    }
}

impl PassSigner {
    /// Check `credentials` against Apple Root CA.
    ///
    /// The check ignores validity periods, so an expired certificate does not
    /// stop the service. [`PassSigner::is_current`] reports the period.
    pub fn new(credentials: WalletCredentials) -> Result<Self, WalletConfigError> {
        let root = X509::from_pem(APPLE_ROOT_CA)
            .map_err(|error| WalletConfigError::Chain(error.to_string()))?;
        Self::with_trust_anchors(credentials, &[root])
    }

    /// Check `credentials` against `anchors` instead of Apple Root CA.
    ///
    /// Tests use this with their own root. The service uses [`PassSigner::new`].
    pub fn with_trust_anchors(
        credentials: WalletCredentials,
        anchors: &[X509],
    ) -> Result<Self, WalletConfigError> {
        let signer = X509::from_pem(pem(&credentials.signer_cert).as_bytes())
            .map_err(|_| WalletConfigError::SignerCert)?;
        let wwdr = X509::from_pem(pem(&credentials.wwdr_cert).as_bytes())
            .map_err(|_| WalletConfigError::WwdrCert)?;
        let key_pem = pem(&credentials.signer_key);
        let key = match &credentials.signer_key_passphrase {
            Some(passphrase) => {
                PKey::private_key_from_pem_passphrase(key_pem.as_bytes(), passphrase.as_bytes())
            }
            None => PKey::private_key_from_pem(key_pem.as_bytes()),
        }
        .map_err(|_| WalletConfigError::SignerKey)?;
        let public_key = signer
            .public_key()
            .map_err(|_| WalletConfigError::SignerCert)?;
        if !public_key.public_eq(&key) {
            return Err(WalletConfigError::KeyMismatch);
        }
        if subject_entry(&signer, Nid::USERID).as_deref()
            != Some(credentials.pass_type_identifier.as_str())
        {
            return Err(WalletConfigError::PassTypeMismatch);
        }
        if subject_entry(&signer, Nid::ORGANIZATIONALUNITNAME).as_deref()
            != Some(credentials.team_identifier.as_str())
        {
            return Err(WalletConfigError::TeamMismatch);
        }
        verify_chain(&signer, &wwdr, anchors)?;
        let valid_from = later(timestamp(signer.not_before()), timestamp(wwdr.not_before()))?;
        let valid_until = earlier(timestamp(signer.not_after()), timestamp(wwdr.not_after()))?;
        Ok(Self {
            pass_type_identifier: credentials.pass_type_identifier,
            team_identifier: credentials.team_identifier,
            organization_name: credentials.organization_name,
            signer,
            key,
            wwdr,
            valid_from,
            valid_until,
        })
    }

    /// Whether both certificates are valid at `now`.
    pub fn is_current(&self, now: DateTime<Utc>) -> bool {
        self.valid_from <= now && now < self.valid_until
    }

    /// Build and sign the pass of `card`.
    pub fn sign(&self, card: &MembershipCard<'_>) -> Result<Vec<u8>, SigningError> {
        let pass = package::pass_json(
            &package::Issuer {
                pass_type_identifier: &self.pass_type_identifier,
                team_identifier: &self.team_identifier,
                organization_name: &self.organization_name,
            },
            card,
        )?;
        let mut files = package::files(pass);
        let manifest = package::manifest(&files)?;
        let mut chain = Stack::new()?;
        chain.push(self.wwdr.clone())?;
        // A detached signature over the exact manifest bytes, with the WWDR certificate included.
        let signature = Pkcs7::sign(
            &self.signer,
            &self.key,
            &chain,
            &manifest,
            Pkcs7Flags::DETACHED | Pkcs7Flags::BINARY,
        )?
        .to_der()?;
        files.push(("manifest.json", manifest));
        files.push(("signature", signature));
        package::archive(&files)
    }
}

/// Restore line breaks that a single-line variable encodes as `\n`.
fn pem(value: &str) -> String {
    value.trim().replace("\\n", "\n")
}

fn subject_entry(certificate: &X509Ref, nid: Nid) -> Option<String> {
    let entry = certificate.subject_name().entries_by_nid(nid).next()?;
    entry.data().to_string().ok()
}

fn verify_chain(signer: &X509, wwdr: &X509, anchors: &[X509]) -> Result<(), WalletConfigError> {
    let chain_error =
        |error: openssl::error::ErrorStack| WalletConfigError::Chain(error.to_string());
    if wwdr.issued(signer) != X509VerifyResult::OK {
        return Err(WalletConfigError::Chain(
            "WALLET_WWDR_CERT did not issue WALLET_SIGNER_CERT".to_owned(),
        ));
    }
    let mut store = X509StoreBuilder::new().map_err(chain_error)?;
    for anchor in anchors {
        store.add_cert(anchor.clone()).map_err(chain_error)?;
    }
    store
        .set_flags(X509VerifyFlags::NO_CHECK_TIME)
        .map_err(chain_error)?;
    let store = store.build();
    let mut intermediates = Stack::new().map_err(chain_error)?;
    intermediates.push(wwdr.clone()).map_err(chain_error)?;
    let mut context = X509StoreContext::new().map_err(chain_error)?;
    let result = context
        .init(&store, signer, &intermediates, |context| {
            let verified = context.verify_cert()?;
            Ok(verified.then_some(()).ok_or(context.error()))
        })
        .map_err(chain_error)?;
    result.map_err(|error| WalletConfigError::Chain(error.error_string().to_owned()))
}

/// Seconds since the Unix epoch of an ASN.1 time.
fn timestamp(time: &Asn1TimeRef) -> Result<DateTime<Utc>, WalletConfigError> {
    let invalid = || WalletConfigError::Chain("certificate validity is unreadable".to_owned());
    let epoch = Asn1Time::from_unix(0).map_err(|_| invalid())?;
    let diff = epoch.diff(time).map_err(|_| invalid())?;
    let seconds = i64::from(diff.days) * 86_400 + i64::from(diff.secs);
    DateTime::from_timestamp(seconds, 0).ok_or_else(invalid)
}

fn later(
    a: Result<DateTime<Utc>, WalletConfigError>,
    b: Result<DateTime<Utc>, WalletConfigError>,
) -> Result<DateTime<Utc>, WalletConfigError> {
    Ok(a?.max(b?))
}

fn earlier(
    a: Result<DateTime<Utc>, WalletConfigError>,
    b: Result<DateTime<Utc>, WalletConfigError>,
) -> Result<DateTime<Utc>, WalletConfigError> {
    Ok(a?.min(b?))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bundled_apple_root_is_the_published_certificate() {
        let root = X509::from_pem(APPLE_ROOT_CA).unwrap();
        let digest = root.digest(openssl::hash::MessageDigest::sha256()).unwrap();
        let hex: Vec<String> = digest.iter().map(|byte| format!("{byte:02X}")).collect();
        assert_eq!(
            hex.join(":"),
            "B0:B1:73:0E:CB:C7:FF:45:05:14:2C:49:F1:29:5E:6E:DA:6B:CA:ED:7E:2C:68:C5:BE:91:B5:A1:10:01:F0:24"
        );
        assert_eq!(
            timestamp(root.not_after()).unwrap().to_rfc3339(),
            "2035-02-09T21:40:36+00:00"
        );
    }

    #[test]
    fn pem_restores_escaped_line_breaks() {
        assert_eq!(pem("  a\\nb\\n  "), "a\nb\n");
    }
}
