//! The keyed hashes and the random codes of organization email verification.
//!
//! Input: the `AFFILIATION_EMAIL_HMAC_KEY` secret, canonical addresses and codes.
//! Output: HMAC-SHA256 digests and uniformly random 6-digit codes.
//! Pos: cryptography only. The local part of an organization address is often a
//! student number, so a plain hash could be reversed by trying every number.
//! A keyed hash cannot be reversed without the key.

use super::policy;
use openssl::{hash::MessageDigest, pkey::PKey, sign::Signer};
use std::fmt;
use thiserror::Error;
use uuid::Uuid;

/// The domain-separation prefix of address digests.
const EMAIL_CONTEXT: &[u8] = b"boji/organization-email/v1\0";
/// The domain-separation prefix of code digests.
const CODE_CONTEXT: &[u8] = b"boji/organization-code/v1\0";

/// An invalid `AFFILIATION_EMAIL_HMAC_KEY`.
#[derive(Debug, Error, PartialEq, Eq)]
pub enum KeyError {
    /// The key is shorter than [`AffiliationEmailKey::MIN_LENGTH`] bytes.
    #[error("the key must contain at least {minimum} bytes")]
    TooShort {
        /// The minimum length in bytes.
        minimum: usize,
    },
}

/// The secret key of the address and code digests.
#[derive(Clone)]
pub struct AffiliationEmailKey(Vec<u8>);

impl AffiliationEmailKey {
    /// The minimum key length in bytes.
    pub const MIN_LENGTH: usize = 32;

    /// Accept a key of at least [`Self::MIN_LENGTH`] bytes.
    pub fn new(key: impl Into<Vec<u8>>) -> Result<Self, KeyError> {
        let key = key.into();
        if key.len() < Self::MIN_LENGTH {
            return Err(KeyError::TooShort {
                minimum: Self::MIN_LENGTH,
            });
        }
        Ok(Self(key))
    }

    /// The digest of a canonical address.
    pub(super) fn email_digest(
        &self,
        canonical: &str,
    ) -> Result<Vec<u8>, openssl::error::ErrorStack> {
        self.digest(&[EMAIL_CONTEXT, canonical.as_bytes()])
    }

    /// The digest of a code, bound to its verification.
    pub(super) fn code_digest(
        &self,
        verification: Uuid,
        code: &VerificationCode,
    ) -> Result<Vec<u8>, openssl::error::ErrorStack> {
        self.digest(&[CODE_CONTEXT, verification.as_bytes(), code.0.as_bytes()])
    }

    fn digest(&self, parts: &[&[u8]]) -> Result<Vec<u8>, openssl::error::ErrorStack> {
        let key = PKey::hmac(&self.0)?;
        let mut signer = Signer::new(MessageDigest::sha256(), &key)?;
        for part in parts {
            signer.update(part)?;
        }
        signer.sign_to_vec()
    }
}

impl fmt::Debug for AffiliationEmailKey {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("AffiliationEmailKey(..)")
    }
}

/// Compare two digests in constant time.
pub(super) fn digests_equal(left: &[u8], right: &[u8]) -> bool {
    left.len() == right.len() && openssl::memcmp::eq(left, right)
}

/// A verification code of [`policy::CODE_DIGITS`] decimal digits.
#[derive(Clone, PartialEq, Eq)]
pub struct VerificationCode(String);

impl VerificationCode {
    /// Draw a uniformly random code from the OpenSSL random generator.
    pub fn generate() -> Result<Self, openssl::error::ErrorStack> {
        let modulus = 10_u32.pow(policy::CODE_DIGITS as u32);
        // Reject the values above the largest multiple of the modulus, so that
        // every code has the same probability.
        let limit = u32::MAX - u32::MAX % modulus;
        loop {
            let mut bytes = [0_u8; 4];
            openssl::rand::rand_bytes(&mut bytes)?;
            let value = u32::from_le_bytes(bytes);
            if value < limit {
                let width = policy::CODE_DIGITS;
                return Ok(Self(format!("{:0width$}", value % modulus)));
            }
        }
    }

    /// Parse a code that a user typed. Spaces around the code are ignored.
    pub fn parse(input: &str) -> Option<Self> {
        let input = input.trim();
        (input.len() == policy::CODE_DIGITS && input.bytes().all(|byte| byte.is_ascii_digit()))
            .then(|| Self(input.to_owned()))
    }

    /// The digits of the code, for the email body.
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Debug for VerificationCode {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("VerificationCode(..)")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn key() -> AffiliationEmailKey {
        AffiliationEmailKey::new(b"organization-email-test-key-not-for-production".to_vec())
            .unwrap()
    }

    #[test]
    fn rejects_short_keys() {
        assert_eq!(
            AffiliationEmailKey::new(vec![0_u8; 31]).err(),
            Some(KeyError::TooShort { minimum: 32 })
        );
        assert!(AffiliationEmailKey::new(vec![0_u8; 32]).is_ok());
    }

    #[test]
    fn digests_depend_on_key_and_context() {
        let first = key().email_digest("a@uq.edu.au").unwrap();
        assert_eq!(first.len(), 32);
        assert_eq!(first, key().email_digest("a@uq.edu.au").unwrap());
        assert_ne!(first, key().email_digest("b@uq.edu.au").unwrap());
        let other = AffiliationEmailKey::new(vec![7_u8; 32]).unwrap();
        assert_ne!(first, other.email_digest("a@uq.edu.au").unwrap());

        let id = Uuid::new_v4();
        let code = VerificationCode::parse("012345").unwrap();
        let digest = key().code_digest(id, &code).unwrap();
        assert_ne!(digest, key().code_digest(Uuid::new_v4(), &code).unwrap());
        assert!(digests_equal(
            &digest,
            &key().code_digest(id, &code).unwrap()
        ));
        assert!(!digests_equal(&digest, &digest[..31]));
    }

    #[test]
    fn codes_have_six_digits() {
        for _ in 0..200 {
            let code = VerificationCode::generate().unwrap();
            assert_eq!(code.as_str().len(), 6);
            assert!(code.as_str().bytes().all(|byte| byte.is_ascii_digit()));
        }
        assert_eq!(
            VerificationCode::parse(" 000123 ").map(|code| code.as_str().to_owned()),
            Some("000123".to_owned())
        );
        for input in ["", "12345", "1234567", "12a456", "１２３４５６"] {
            assert!(VerificationCode::parse(input).is_none(), "{input:?}");
        }
    }

    #[test]
    fn debug_output_hides_secrets() {
        assert_eq!(format!("{:?}", key()), "AffiliationEmailKey(..)");
        let code = VerificationCode::parse("123456").unwrap();
        assert_eq!(format!("{code:?}"), "VerificationCode(..)");
    }
}
