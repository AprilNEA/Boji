//! Authentication tokens of the Wallet web service.
//!
//! Every pass carries an `authenticationToken`. Wallet sends it back in the
//! `Authorization: ApplePass <token>` header of each web service request. The
//! token is an HMAC of the serial number, so the server stores no tokens, and a
//! new `WALLET_AUTH_TOKEN_KEY` invalidates every token at once.

use openssl::error::ErrorStack;
use openssl::hash::MessageDigest;
use openssl::pkey::{PKey, Private};
use openssl::sign::Signer;

/// Separates these tokens from other HMACs that could share the key.
const CONTEXT: &[u8] = b"boji.wallet.authentication-token.v1\0";

/// Issues and checks the authentication tokens of passes.
pub(crate) struct AuthenticationTokens {
    key: PKey<Private>,
}

impl AuthenticationTokens {
    /// Use `key`, the bytes of `WALLET_AUTH_TOKEN_KEY`.
    pub(crate) fn new(key: &[u8]) -> Result<Self, ErrorStack> {
        Ok(Self {
            key: PKey::hmac(key)?,
        })
    }

    /// The token of the pass with `serial_number`: 64 lowercase hex digits.
    pub(crate) fn issue(&self, serial_number: &str) -> Result<String, ErrorStack> {
        let mut signer = Signer::new(MessageDigest::sha256(), &self.key)?;
        signer.update(CONTEXT)?;
        signer.update(serial_number.as_bytes())?;
        Ok(hex::encode(signer.sign_to_vec()?))
    }

    /// Whether `token` is the token of `serial_number`, in constant time.
    pub(crate) fn verify(&self, serial_number: &str, token: &str) -> bool {
        let Ok(expected) = self.issue(serial_number) else {
            return false;
        };
        expected.len() == token.len() && openssl::memcmp::eq(expected.as_bytes(), token.as_bytes())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tokens_depend_on_the_key_and_the_serial_number() {
        let tokens = AuthenticationTokens::new(&[7; 32]).unwrap();
        let token = tokens.issue("serial-a").unwrap();
        assert_eq!(token.len(), 64);
        assert!(token.bytes().all(|byte| byte.is_ascii_hexdigit()));
        assert!(tokens.verify("serial-a", &token));
        assert!(!tokens.verify("serial-b", &token));
        assert!(!tokens.verify("serial-a", &token[..63]));
        assert!(!tokens.verify("serial-a", &token.to_uppercase()));

        let other = AuthenticationTokens::new(&[8; 32]).unwrap();
        assert!(!other.verify("serial-a", &token));
    }
}
