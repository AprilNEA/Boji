//! Languages of `locales/`, named by BCP 47 codes.

use std::cmp::Ordering;
use std::collections::BTreeSet;
use std::fmt;
use std::hash::{Hash, Hasher};

use icu_locale_core::LanguageIdentifier;
use icu_plurals::PluralRules;
use serde::Deserialize;

use crate::model::PluralCategory;

/// A language of `locales/`, such as `zh-Hans`, `en` or `pt-BR`.
///
/// The code must be a canonical BCP 47 language tag, so `zh-hans` is rejected in
/// favor of `zh-Hans`. Equality and order follow the code.
#[derive(Debug, Clone, Deserialize)]
#[serde(try_from = "String")]
pub struct Locale {
    code: String,
    id: LanguageIdentifier,
}

impl Locale {
    /// Returns the BCP 47 code. Apple String Catalogs use this code unchanged.
    pub fn as_str(&self) -> &str {
        &self.code
    }

    /// Returns the Android resource directory for this language, such as
    /// `values-en`, `values-pt-rBR` or `values-b+zh+Hans`.
    ///
    /// The fallback language uses `values` instead; the caller decides that.
    pub fn android_values_dir(&self) -> String {
        let id = &self.id;
        if id.script.is_some() || !id.variants.is_empty() {
            let mut dir = format!("values-b+{}", id.language.as_str());
            if let Some(script) = id.script {
                dir.push('+');
                dir.push_str(script.as_str());
            }
            if let Some(region) = id.region {
                dir.push('+');
                dir.push_str(region.as_str());
            }
            for variant in id.variants.iter() {
                dir.push('+');
                dir.push_str(variant.as_str());
            }
            dir
        } else if let Some(region) = id.region {
            format!("values-{}-r{}", id.language.as_str(), region.as_str())
        } else {
            format!("values-{}", id.language.as_str())
        }
    }

    /// Returns the CLDR cardinal plural categories of this language.
    pub fn plural_categories(&self) -> Result<BTreeSet<PluralCategory>, LocaleError> {
        let rules = PluralRules::try_new_cardinal((&self.id).into()).map_err(|source| {
            LocaleError::PluralRules {
                code: self.code.clone(),
                reason: source.to_string(),
            }
        })?;
        Ok(rules.categories().map(PluralCategory::from).collect())
    }
}

impl TryFrom<String> for Locale {
    type Error = LocaleError;

    fn try_from(code: String) -> Result<Self, Self::Error> {
        let id = LanguageIdentifier::try_from_str(&code)
            .map_err(|_| LocaleError::Invalid { code: code.clone() })?;
        let canonical = id.to_string();
        if canonical != code {
            return Err(LocaleError::NotCanonical { code, canonical });
        }
        Ok(Self { code, id })
    }
}

impl PartialEq for Locale {
    fn eq(&self, other: &Self) -> bool {
        self.code == other.code
    }
}

impl Eq for Locale {}

impl PartialOrd for Locale {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for Locale {
    fn cmp(&self, other: &Self) -> Ordering {
        self.code.cmp(&other.code)
    }
}

impl Hash for Locale {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.code.hash(state);
    }
}

impl fmt::Display for Locale {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.code)
    }
}

/// The error for a language code that `locales/` cannot use.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum LocaleError {
    /// The code is not a BCP 47 language tag.
    #[error("`{code}` is not a BCP 47 language tag")]
    Invalid {
        /// The rejected code.
        code: String,
    },
    /// The code is valid but not in canonical form.
    #[error("write `{canonical}`, not `{code}`")]
    NotCanonical {
        /// The rejected code.
        code: String,
        /// The canonical form of the code.
        canonical: String,
    },
    /// ICU4X has no plural rules for the language.
    #[error("no plural rules for `{code}`: {reason}")]
    PluralRules {
        /// The language code.
        code: String,
        /// The ICU4X error message.
        reason: String,
    },
}

#[cfg(test)]
mod tests {
    use super::*;

    fn locale(code: &str) -> Locale {
        Locale::try_from(code.to_owned()).expect("valid test locale")
    }

    fn categories(code: &str) -> Vec<&'static str> {
        locale(code)
            .plural_categories()
            .expect("plural rules")
            .into_iter()
            .map(PluralCategory::as_str)
            .collect()
    }

    #[test]
    fn rejects_non_canonical_codes() {
        assert!(matches!(
            Locale::try_from("zh-hans".to_owned()),
            Err(LocaleError::NotCanonical { .. })
        ));
        assert!(matches!(
            Locale::try_from("not a tag".to_owned()),
            Err(LocaleError::Invalid { .. })
        ));
    }

    #[test]
    fn maps_codes_to_android_directories() {
        assert_eq!(locale("en").android_values_dir(), "values-en");
        assert_eq!(locale("pt-BR").android_values_dir(), "values-pt-rBR");
        assert_eq!(locale("zh-Hans").android_values_dir(), "values-b+zh+Hans");
        assert_eq!(
            locale("zh-Hant-TW").android_values_dir(),
            "values-b+zh+Hant+TW"
        );
    }

    #[test]
    fn reads_cldr_plural_categories() {
        assert_eq!(categories("zh-Hans"), ["other"]);
        assert_eq!(categories("en"), ["one", "other"]);
        assert_eq!(categories("ru"), ["one", "few", "many", "other"]);
        assert_eq!(
            categories("ar"),
            ["zero", "one", "two", "few", "many", "other"]
        );
    }
}
