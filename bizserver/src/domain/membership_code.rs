//! Membership codes: the static QR code of the Wallet pass and the dynamic
//! TOTP code that the apps show.
//!
//! Input: the `MEMBERSHIP_CODE_KEY` secret, membership IDs and scanned values.
//! Output: code values, TOTP secrets, and the membership that a value names.
//! Pos: cryptography and format only. The server stores no codes and no TOTP
//! secrets, because both are HMACs of the membership ID. A new key invalidates
//! every code at once.
//!
//! A value has the form `BOJI1.<kind>.<membership ID>.<proof>`, in uppercase,
//! so a QR code can use the alphanumeric mode:
//!
//! - `BOJI1.S.<ID>.<32 hex digits>`: the static code. The proof is the first
//!   16 bytes of an HMAC-SHA256 of the ID.
//! - `BOJI1.D.<ID>.<8 digits>`: the dynamic code. The proof is an RFC 6238
//!   TOTP value: HMAC-SHA1, 8 digits, 30-second steps. Google Wallet rotating
//!   barcodes use the same parameters.
//!
//! A dynamic value is valid one step before and after the current step, so
//! clocks may differ by about 30 seconds. The server does not record used
//! values: a captured dynamic value stays valid until its window ends.

use chrono::{DateTime, Utc};
use openssl::{error::ErrorStack, hash::MessageDigest, memcmp, pkey::PKey, sign::Signer};
use std::fmt;
use thiserror::Error;
use uuid::Uuid;

/// The number of digits of a dynamic code.
pub const TOTP_DIGITS: u32 = 8;
/// The length of one TOTP step in seconds.
pub const TOTP_PERIOD_SECONDS: i64 = 30;
/// The length of a TOTP secret in bytes, the RFC 4226 recommendation for SHA-1.
pub const TOTP_SECRET_LENGTH: usize = 20;

/// Steps before and after the current step that a dynamic value may use.
const ACCEPTED_STEPS: i64 = 1;
/// Older steps whose values count as expired instead of invalid: 5 minutes.
const EXPIRED_STEPS: i64 = 10;
/// The bytes of the static proof.
const STATIC_PROOF_LENGTH: usize = 16;

const PREFIX: &str = "BOJI1";
const STATIC_CONTEXT: &[u8] = b"boji/membership-code/static/v1\0";
const TOTP_CONTEXT: &[u8] = b"boji/membership-code/totp/v1\0";

/// An invalid `MEMBERSHIP_CODE_KEY`.
#[derive(Debug, Error, PartialEq, Eq)]
pub enum KeyError {
    /// The key is shorter than [`MembershipCodes::MIN_KEY_LENGTH`] bytes.
    #[error("the key must contain at least {minimum} bytes")]
    TooShort {
        /// The minimum length in bytes.
        minimum: usize,
    },
}

/// The kind of a scanned value.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CodeKind {
    /// The static code of the Wallet pass.
    Static,
    /// The dynamic code of the apps.
    Dynamic,
}

/// A value that names a membership and carries a valid proof.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct VerifiedCode {
    /// The kind of the value.
    pub kind: CodeKind,
    /// The membership that the value names. The caller must still check
    /// that it exists and read its state.
    pub membership_id: Uuid,
}

/// Why a value does not verify.
#[derive(Debug, Error)]
pub enum CodeError {
    /// The value is malformed, or its proof is wrong.
    #[error("the membership code is invalid")]
    Invalid,
    /// The value is a dynamic code from a recent step outside the window.
    #[error("the membership code expired")]
    Expired,
    /// OpenSSL failed to compute a MAC.
    #[error("the membership code could not be checked: {0}")]
    Crypto(#[from] ErrorStack),
}

/// Issues and checks membership codes.
#[derive(Clone)]
pub struct MembershipCodes {
    key: Vec<u8>,
}

impl fmt::Debug for MembershipCodes {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("MembershipCodes(<redacted>)")
    }
}

impl MembershipCodes {
    /// The minimum key length in bytes.
    pub const MIN_KEY_LENGTH: usize = 32;

    /// Use `key`, the bytes of `MEMBERSHIP_CODE_KEY`.
    pub fn new(key: impl Into<Vec<u8>>) -> Result<Self, KeyError> {
        let key = key.into();
        if key.len() < Self::MIN_KEY_LENGTH {
            return Err(KeyError::TooShort {
                minimum: Self::MIN_KEY_LENGTH,
            });
        }
        Ok(Self { key })
    }

    /// The static value of `membership`, for the QR code of its Wallet pass.
    pub fn static_value(&self, membership: Uuid) -> Result<String, ErrorStack> {
        let proof = self.static_proof(membership)?;
        Ok(format!("{PREFIX}.S.{}.{proof}", id_text(membership)))
    }

    /// The text before the TOTP digits of a dynamic value of `membership`.
    pub fn dynamic_prefix(membership: Uuid) -> String {
        format!("{PREFIX}.D.{}.", id_text(membership))
    }

    /// The TOTP secret of `membership`: [`TOTP_SECRET_LENGTH`] bytes.
    pub fn totp_secret(&self, membership: Uuid) -> Result<Vec<u8>, ErrorStack> {
        let mut secret = self.mac(&[TOTP_CONTEXT, membership.to_string().as_bytes()])?;
        secret.truncate(TOTP_SECRET_LENGTH);
        Ok(secret)
    }

    /// The dynamic value of `membership` at `time`. The apps compute the same
    /// value from the TOTP secret; the server uses it in tests.
    pub fn dynamic_value(
        &self,
        membership: Uuid,
        time: DateTime<Utc>,
    ) -> Result<String, ErrorStack> {
        let secret = self.totp_secret(membership)?;
        let digits = totp(&secret, step(time))?;
        Ok(format!(
            "{}{digits:0width$}",
            Self::dynamic_prefix(membership),
            width = TOTP_DIGITS as usize
        ))
    }

    /// Check a scanned `value` at `now`.
    pub fn verify(&self, value: &str, now: DateTime<Utc>) -> Result<VerifiedCode, CodeError> {
        let value = value.trim().to_ascii_uppercase();
        let mut parts = value.split('.');
        let (Some(PREFIX), Some(kind), Some(id), Some(proof), None) = (
            parts.next(),
            parts.next(),
            parts.next(),
            parts.next(),
            parts.next(),
        ) else {
            return Err(CodeError::Invalid);
        };
        let membership_id = Uuid::try_parse(id).map_err(|_| CodeError::Invalid)?;
        // Only the canonical hyphenated form names a membership.
        if id_text(membership_id) != id {
            return Err(CodeError::Invalid);
        }
        let kind = match kind {
            "S" => {
                let expected = self.static_proof(membership_id)?;
                if !equal(&expected, proof) {
                    return Err(CodeError::Invalid);
                }
                CodeKind::Static
            }
            "D" => {
                self.check_dynamic(membership_id, proof, now)?;
                CodeKind::Dynamic
            }
            _ => return Err(CodeError::Invalid),
        };
        Ok(VerifiedCode {
            kind,
            membership_id,
        })
    }

    fn check_dynamic(
        &self,
        membership: Uuid,
        proof: &str,
        now: DateTime<Utc>,
    ) -> Result<(), CodeError> {
        if proof.len() != TOTP_DIGITS as usize || !proof.bytes().all(|byte| byte.is_ascii_digit()) {
            return Err(CodeError::Invalid);
        }
        let secret = self.totp_secret(membership)?;
        let current = step(now);
        let matches = |offset: i64| -> Result<bool, ErrorStack> {
            let digits = totp(&secret, current + offset)?;
            Ok(equal(
                &format!("{digits:0width$}", width = TOTP_DIGITS as usize),
                proof,
            ))
        };
        for offset in -ACCEPTED_STEPS..=ACCEPTED_STEPS {
            if matches(offset)? {
                return Ok(());
            }
        }
        for offset in -EXPIRED_STEPS..-ACCEPTED_STEPS {
            if matches(offset)? {
                return Err(CodeError::Expired);
            }
        }
        Err(CodeError::Invalid)
    }

    fn static_proof(&self, membership: Uuid) -> Result<String, ErrorStack> {
        let mut proof = self.mac(&[STATIC_CONTEXT, membership.to_string().as_bytes()])?;
        proof.truncate(STATIC_PROOF_LENGTH);
        Ok(hex::encode_upper(proof))
    }

    fn mac(&self, parts: &[&[u8]]) -> Result<Vec<u8>, ErrorStack> {
        let key = PKey::hmac(&self.key)?;
        let mut signer = Signer::new(MessageDigest::sha256(), &key)?;
        for part in parts {
            signer.update(part)?;
        }
        signer.sign_to_vec()
    }
}

/// The membership ID in the uppercase hyphenated form of a code.
fn id_text(membership: Uuid) -> String {
    membership.hyphenated().to_string().to_ascii_uppercase()
}

/// The RFC 6238 step of `time`. Times before 1970 use negative steps, which
/// no real clock reaches.
fn step(time: DateTime<Utc>) -> i64 {
    time.timestamp().div_euclid(TOTP_PERIOD_SECONDS)
}

/// The RFC 4226 HOTP value of `counter` with HMAC-SHA1, as a number below
/// `10^TOTP_DIGITS`. A negative counter has no value and never matches.
fn totp(secret: &[u8], counter: i64) -> Result<u32, ErrorStack> {
    let Ok(counter) = u64::try_from(counter) else {
        return Ok(u32::MAX);
    };
    let key = PKey::hmac(secret)?;
    let mut signer = Signer::new(MessageDigest::sha1(), &key)?;
    signer.update(&counter.to_be_bytes())?;
    let mac = signer.sign_to_vec()?;
    // SHA-1 MACs have 20 bytes, so the offset and the 4 bytes after it exist.
    let offset = usize::from(mac.last().copied().unwrap_or_default() & 0x0f);
    let window: [u8; 4] = mac
        .get(offset..offset + 4)
        .and_then(|bytes| bytes.try_into().ok())
        .unwrap_or_default();
    let binary = u32::from_be_bytes(window) & 0x7fff_ffff;
    Ok(binary % 10u32.pow(TOTP_DIGITS))
}

/// Compare two ASCII values in constant time for equal lengths.
fn equal(expected: &str, actual: &str) -> bool {
    expected.len() == actual.len() && memcmp::eq(expected.as_bytes(), actual.as_bytes())
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    const MEMBERSHIP: Uuid = Uuid::from_u128(0x0192_3e4d_5f6a_7b8c_9d0e_1f2a_3b4c_5d6e);

    fn codes() -> MembershipCodes {
        MembershipCodes::new([7; 32]).unwrap()
    }

    fn at(seconds: i64) -> DateTime<Utc> {
        Utc.timestamp_opt(seconds, 0).unwrap()
    }

    #[test]
    fn short_keys_are_rejected() {
        assert_eq!(
            MembershipCodes::new([7; 31]).unwrap_err(),
            KeyError::TooShort { minimum: 32 }
        );
    }

    #[test]
    fn totp_matches_the_rfc_6238_sha1_vectors() {
        let secret = b"12345678901234567890";
        for (time, expected) in [
            (59, 94_287_082),
            (1_111_111_109, 7_081_804),
            (1_234_567_890, 89_005_924),
            (20_000_000_000, 65_353_130),
        ] {
            assert_eq!(totp(secret, step(at(time))).unwrap(), expected, "{time}");
        }
    }

    #[test]
    fn static_values_name_the_membership_and_resist_changes() {
        let codes = codes();
        let value = codes.static_value(MEMBERSHIP).unwrap();
        assert_eq!(value.len(), "BOJI1.S.".len() + 36 + 1 + 32);
        assert!(value.starts_with("BOJI1.S.01923E4D-5F6A-7B8C-9D0E-1F2A3B4C5D6E."));
        assert!(value.bytes().all(|byte| byte.is_ascii_digit()
            || byte.is_ascii_uppercase()
            || b".-".contains(&byte)));
        let verified = codes.verify(&value, at(0)).unwrap();
        assert_eq!(verified.kind, CodeKind::Static);
        assert_eq!(verified.membership_id, MEMBERSHIP);
        // Scanners may return lowercase text.
        assert!(codes.verify(&value.to_lowercase(), at(0)).is_ok());

        let mut forged = value.clone();
        let last = if forged.ends_with('0') { "1" } else { "0" };
        forged.replace_range(forged.len() - 1.., last);
        assert!(matches!(
            codes.verify(&forged, at(0)),
            Err(CodeError::Invalid)
        ));
        let other = MembershipCodes::new([8; 32]).unwrap();
        assert!(matches!(
            other.verify(&value, at(0)),
            Err(CodeError::Invalid)
        ));
        let moved = value.replace("5D6E.", "5D6F.");
        assert!(matches!(
            codes.verify(&moved, at(0)),
            Err(CodeError::Invalid)
        ));
    }

    #[test]
    fn dynamic_values_are_valid_for_one_step_around_now() {
        let codes = codes();
        let issued = at(1_000_000_020);
        let value = codes.dynamic_value(MEMBERSHIP, issued).unwrap();
        assert!(value.starts_with(&MembershipCodes::dynamic_prefix(MEMBERSHIP)));
        assert_eq!(
            value.len(),
            MembershipCodes::dynamic_prefix(MEMBERSHIP).len() + 8
        );
        for seconds in [-30, 0, 9, 39] {
            let verified = codes
                .verify(&value, issued + chrono::Duration::seconds(seconds))
                .unwrap();
            assert_eq!(verified.kind, CodeKind::Dynamic);
            assert_eq!(verified.membership_id, MEMBERSHIP);
        }
        assert!(matches!(
            codes.verify(&value, issued + chrono::Duration::seconds(70)),
            Err(CodeError::Expired)
        ));
        assert!(matches!(
            codes.verify(&value, issued + chrono::Duration::minutes(10)),
            Err(CodeError::Invalid)
        ));
        assert!(matches!(
            codes.verify(&value, issued - chrono::Duration::minutes(2)),
            Err(CodeError::Invalid)
        ));
    }

    #[test]
    fn the_secret_reproduces_the_dynamic_value() {
        let codes = codes();
        let secret = codes.totp_secret(MEMBERSHIP).unwrap();
        assert_eq!(secret.len(), TOTP_SECRET_LENGTH);
        let time = at(1_700_000_000);
        let digits = totp(&secret, step(time)).unwrap();
        assert_eq!(
            codes.dynamic_value(MEMBERSHIP, time).unwrap(),
            format!("{}{digits:08}", MembershipCodes::dynamic_prefix(MEMBERSHIP))
        );
    }

    #[test]
    fn malformed_values_are_invalid() {
        let codes = codes();
        let id = id_text(MEMBERSHIP);
        for value in [
            String::new(),
            "BOJI1".to_owned(),
            format!("BOJI2.S.{id}.00"),
            format!("BOJI1.X.{id}.00"),
            format!("BOJI1.D.{id}.1234567"),
            format!("BOJI1.D.{id}.1234567A"),
            format!("BOJI1.D.{}.12345678", id.replace('-', "")),
            format!("BOJI1.S.{id}.00.00"),
        ] {
            assert!(
                matches!(codes.verify(&value, at(0)), Err(CodeError::Invalid)),
                "{value}"
            );
        }
    }
}
