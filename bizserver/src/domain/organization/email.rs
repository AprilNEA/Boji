//! Organization email addresses.
//!
//! Input: an address that a user typed, or a domain from the organization list.
//! Output: the delivery address, the canonical form for the address hash,
//! the masked form, and the domain suffixes for the organization match.
//! Pos: pure parsing. No I/O.

use super::OrganizationError;

/// The longest address that SMTP accepts (RFC 5321, section 4.5.3.1.3).
const MAX_ADDRESS_LENGTH: usize = 254;
/// The longest local part (RFC 5321, section 4.5.3.1.1).
const MAX_LOCAL_LENGTH: usize = 64;
/// The longest domain (RFC 1035, section 2.3.4, without the final dot).
const MAX_DOMAIN_LENGTH: usize = 253;

/// A syntactically valid affiliation email address.
///
/// The parser accepts the dot-atom form of RFC 5322 with an ASCII domain. It
/// rejects quoted local parts, IP literals and internationalized domains,
/// because the organization list contains ASCII domains only.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AffiliationEmail {
    /// The local part as typed, without surrounding spaces.
    local: String,
    /// The lowercase domain.
    domain: String,
}

impl AffiliationEmail {
    /// Parse an address that a user typed.
    pub fn parse(input: &str) -> Result<Self, OrganizationError> {
        let input = input.trim();
        if input.is_empty() {
            return Err(OrganizationError::InvalidEmail("the address is empty"));
        }
        if input.len() > MAX_ADDRESS_LENGTH {
            return Err(OrganizationError::InvalidEmail("the address is too long"));
        }
        let (local, domain) = input
            .rsplit_once('@')
            .ok_or(OrganizationError::InvalidEmail("the address has no `@`"))?;
        if !valid_local(local) {
            return Err(OrganizationError::InvalidEmail("the local part is invalid"));
        }
        let domain = normalize_domain(domain)
            .ok_or(OrganizationError::InvalidEmail("the domain is invalid"))?;
        Ok(Self {
            local: local.to_owned(),
            domain,
        })
    }

    /// The lowercase domain, for example `student.xjtlu.edu.cn`.
    pub fn domain(&self) -> &str {
        &self.domain
    }

    /// The address to send the code to: the local part as typed and the
    /// lowercase domain.
    pub fn delivery_address(&self) -> String {
        format!("{}@{}", self.local, self.domain)
    }

    /// The form that the address hash uses.
    ///
    /// The local part is lowercased, and a `+` subaddress is removed, so that
    /// `A.Li+x@organization.edu` and `a.li@organization.edu` count as one address. Dots
    /// stay, because organization mail systems treat them as part of the name.
    pub fn canonical(&self) -> String {
        let local = self.local.to_ascii_lowercase();
        let local = match local.split_once('+') {
            Some((base, _)) if !base.is_empty() => base.to_owned(),
            _ => local,
        };
        format!("{local}@{}", self.domain)
    }

    /// The address with the local part hidden after its first character, for
    /// example `a***@student.xjtlu.edu.cn`.
    pub fn masked(&self) -> String {
        let first = self.local.chars().next().unwrap_or('*');
        format!("{first}***@{}", self.domain)
    }
}

/// Return true for a dot-atom local part of RFC 5322.
fn valid_local(local: &str) -> bool {
    !local.is_empty()
        && local.len() <= MAX_LOCAL_LENGTH
        && !local.starts_with('.')
        && !local.ends_with('.')
        && !local.contains("..")
        && local
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || b".!#$%&'*+/=?^_`{|}~-".contains(&byte))
}

/// Normalize a domain: lowercase ASCII, without a final dot, with at least
/// two labels of letters, digits and inner hyphens.
///
/// Returns `None` for an invalid domain.
pub(super) fn normalize_domain(input: &str) -> Option<String> {
    let domain = input.trim().strip_suffix('.').unwrap_or(input.trim());
    let domain = domain.to_ascii_lowercase();
    let valid = !domain.is_empty()
        && domain.len() <= MAX_DOMAIN_LENGTH
        && domain.split('.').count() >= 2
        && domain.split('.').all(valid_label);
    valid.then_some(domain)
}

/// Return true for a DNS label of 1 to 63 letters, digits and inner hyphens.
fn valid_label(label: &str) -> bool {
    (1..=63).contains(&label.len())
        && !label.starts_with('-')
        && !label.ends_with('-')
        && label
            .bytes()
            .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-')
}

/// Return the domain and each parent domain with at least two labels, from
/// the longest to the shortest.
///
/// `a.student.uq.edu.au` returns `a.student.uq.edu.au`, `student.uq.edu.au`,
/// `uq.edu.au` and `edu.au`.
pub(super) fn domain_suffixes(domain: &str) -> Vec<&str> {
    let mut suffixes = vec![domain];
    let mut rest = domain;
    while let Some((_, parent)) = rest.split_once('.') {
        if !parent.contains('.') {
            break;
        }
        suffixes.push(parent);
        rest = parent;
    }
    suffixes
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_and_normalizes_addresses() {
        let email = AffiliationEmail::parse("  Alice.Li+ranking@Student.XJTLU.edu.cn. ").unwrap();
        assert_eq!(email.domain(), "student.xjtlu.edu.cn");
        assert_eq!(
            email.delivery_address(),
            "Alice.Li+ranking@student.xjtlu.edu.cn"
        );
        assert_eq!(email.canonical(), "alice.li@student.xjtlu.edu.cn");
        assert_eq!(email.masked(), "A***@student.xjtlu.edu.cn");
    }

    #[test]
    fn keeps_a_local_part_that_starts_with_plus() {
        let email = AffiliationEmail::parse("+tag@uq.edu.au").unwrap();
        assert_eq!(email.canonical(), "+tag@uq.edu.au");
    }

    #[test]
    fn rejects_invalid_addresses() {
        for input in [
            "",
            "   ",
            "no-at-sign",
            "@uq.edu.au",
            "a@",
            "a@localhost",
            "a@uq..edu.au",
            "a@-uq.edu.au",
            "a@uq-.edu.au",
            ".a@uq.edu.au",
            "a.@uq.edu.au",
            "a..b@uq.edu.au",
            "a b@uq.edu.au",
            "\"a\"@uq.edu.au",
            "a@b@uq.edu.au",
            "a@[127.0.0.1]",
            "张三@uq.edu.au",
            "a@清华.edu.cn",
            "a@uq_edu.au",
        ] {
            assert!(
                AffiliationEmail::parse(input).is_err(),
                "{input:?} must be rejected"
            );
        }
        let long_local = format!("{}@uq.edu.au", "a".repeat(65));
        assert!(AffiliationEmail::parse(&long_local).is_err());
        let long_label = format!("a@{}.edu.au", "b".repeat(64));
        assert!(AffiliationEmail::parse(&long_label).is_err());
    }

    #[test]
    fn normalizes_list_domains() {
        assert_eq!(
            normalize_domain("XJTLU.edu.cn").as_deref(),
            Some("xjtlu.edu.cn")
        );
        assert_eq!(normalize_domain("hanu.vn.").as_deref(), Some("hanu.vn"));
        assert_eq!(normalize_domain("edu"), None);
        assert_eq!(normalize_domain("a b.edu"), None);
    }

    #[test]
    fn lists_suffixes_with_two_or_more_labels() {
        assert_eq!(
            domain_suffixes("a.student.uq.edu.au"),
            [
                "a.student.uq.edu.au",
                "student.uq.edu.au",
                "uq.edu.au",
                "edu.au"
            ]
        );
        assert_eq!(domain_suffixes("hanu.vn"), ["hanu.vn"]);
    }
}
