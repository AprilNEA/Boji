//! Identifiers and value types that the catalog, the parser and the renderers share.

use std::fmt;

use serde::Deserialize;

/// A string key, such as `tab_today`.
///
/// A key is an Android resource name and a key of the iOS String Catalog. It starts
/// with a lowercase ASCII letter and continues with lowercase ASCII letters, digits
/// or underscores.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Deserialize)]
#[serde(try_from = "String")]
pub struct Key(String);

impl Key {
    /// Returns the key as written in `locales/`.
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<String> for Key {
    type Error = IdentifierError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        let mut chars = value.chars();
        let valid = chars.next().is_some_and(|c| c.is_ascii_lowercase())
            && chars.all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_');
        if valid {
            Ok(Self(value))
        } else {
            Err(IdentifierError {
                kind: IdentifierKind::Key,
                value,
            })
        }
    }
}

impl fmt::Display for Key {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

/// An argument name, such as `minutes`.
///
/// Xcode uses the name as the Swift argument label of the generated symbol, so the
/// name is lower camel case: a lowercase ASCII letter followed by ASCII letters or
/// digits.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Deserialize)]
#[serde(try_from = "String")]
pub struct ArgName(String);

impl ArgName {
    /// Returns the name as written in `locales/`.
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<String> for ArgName {
    type Error = IdentifierError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        let mut chars = value.chars();
        let valid = chars.next().is_some_and(|c| c.is_ascii_lowercase())
            && chars.all(|c| c.is_ascii_alphanumeric());
        if valid {
            Ok(Self(value))
        } else {
            Err(IdentifierError {
                kind: IdentifierKind::ArgName,
                value,
            })
        }
    }
}

impl fmt::Display for ArgName {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

/// The error for a key or an argument name that breaks its naming rule.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
#[error("invalid {kind} `{value}`: {rule}", kind = self.kind.noun(), rule = self.kind.rule())]
pub struct IdentifierError {
    kind: IdentifierKind,
    value: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum IdentifierKind {
    Key,
    ArgName,
}

impl IdentifierKind {
    fn noun(self) -> &'static str {
        match self {
            Self::Key => "key",
            Self::ArgName => "argument name",
        }
    }

    fn rule(self) -> &'static str {
        match self {
            Self::Key => "use lowercase snake case, such as `tab_today`",
            Self::ArgName => "use lower camel case, such as `activeDays`",
        }
    }
}

/// The type of an argument. It selects the format specifier on each platform.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ArgType {
    /// Text. Android `%s`, Apple `%@`, Swift `String`.
    String,
    /// A whole number. Android `%d`, Apple `%lld`, Swift `Int`.
    Int,
}

impl fmt::Display for ArgType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            Self::String => "string",
            Self::Int => "int",
        })
    }
}

/// A consumer of the generated files.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Target {
    /// The Android app: `strings_shared.xml` in each `values*` directory.
    Android,
    /// The iOS app, its widgets and its watch app: `Shared.xcstrings`.
    Ios,
}

impl Target {
    /// Every target, in a stable order.
    pub const ALL: [Self; 2] = [Self::Android, Self::Ios];
}

impl fmt::Display for Target {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            Self::Android => "android",
            Self::Ios => "ios",
        })
    }
}

/// A CLDR plural category.
///
/// The order is the CLDR order, from `zero` to `other`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum PluralCategory {
    /// `zero`, for example 0 in Arabic.
    Zero,
    /// `one`, for example 1 in English.
    One,
    /// `two`, for example 2 in Arabic.
    Two,
    /// `few`, for example 2 to 4 in Russian.
    Few,
    /// `many`, for example 5 to 20 in Russian.
    Many,
    /// `other`. Every language has this category.
    Other,
}

impl PluralCategory {
    /// Parses a CLDR category name, such as `one`.
    pub fn from_cldr(name: &str) -> Option<Self> {
        match name {
            "zero" => Some(Self::Zero),
            "one" => Some(Self::One),
            "two" => Some(Self::Two),
            "few" => Some(Self::Few),
            "many" => Some(Self::Many),
            "other" => Some(Self::Other),
            _ => None,
        }
    }

    /// Returns the CLDR category name. Android `quantity` values and Apple plural
    /// variations use the same names.
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Zero => "zero",
            Self::One => "one",
            Self::Two => "two",
            Self::Few => "few",
            Self::Many => "many",
            Self::Other => "other",
        }
    }
}

impl From<icu_plurals::PluralCategory> for PluralCategory {
    fn from(category: icu_plurals::PluralCategory) -> Self {
        match category {
            icu_plurals::PluralCategory::Zero => Self::Zero,
            icu_plurals::PluralCategory::One => Self::One,
            icu_plurals::PluralCategory::Two => Self::Two,
            icu_plurals::PluralCategory::Few => Self::Few,
            icu_plurals::PluralCategory::Many => Self::Many,
            icu_plurals::PluralCategory::Other => Self::Other,
        }
    }
}

impl fmt::Display for PluralCategory {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keys_use_snake_case() {
        assert!(Key::try_from("tab_today".to_owned()).is_ok());
        assert!(Key::try_from("a11y_label2".to_owned()).is_ok());
        assert!(Key::try_from("TabToday".to_owned()).is_err());
        assert!(Key::try_from("_tab".to_owned()).is_err());
        assert!(Key::try_from(String::new()).is_err());
    }

    #[test]
    fn argument_names_use_lower_camel_case() {
        assert!(ArgName::try_from("activeDays".to_owned()).is_ok());
        assert!(ArgName::try_from("active_days".to_owned()).is_err());
        assert!(ArgName::try_from("Days".to_owned()).is_err());
    }

    #[test]
    fn categories_round_trip_and_keep_cldr_order() {
        let mut categories: Vec<_> = ["other", "one", "few", "zero", "many", "two"]
            .into_iter()
            .map(|name| PluralCategory::from_cldr(name).expect("valid CLDR name"))
            .collect();
        categories.sort();
        let names: Vec<_> = categories.iter().map(|c| c.as_str()).collect();
        assert_eq!(names, ["zero", "one", "two", "few", "many", "other"]);
        assert_eq!(PluralCategory::from_cldr("=0"), None);
    }
}
