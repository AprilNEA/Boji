//! Checks the rules that span several files of `locales/`.
//!
//! [`Catalog::validate`] collects every problem instead of stopping at the first
//! one. A catalog without problems becomes a [`Validated`] catalog, which holds
//! the parsed messages that the renderers need.

use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::fmt;
use std::path::PathBuf;

use crate::android;
use crate::catalog::{Catalog, Config, Entry, LOCALES_DIR};
use crate::locale::Locale;
use crate::message::{Forms, Message, Segment};
use crate::model::{ArgType, Key, PluralCategory, Target};
use crate::wallet;

/// One broken rule, tied to a file and, when known, a key.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Problem {
    /// The file, relative to the repository root.
    pub path: PathBuf,
    /// The key, if the problem belongs to one.
    pub key: Option<Key>,
    /// What is wrong, in one sentence.
    pub message: String,
}

impl fmt::Display for Problem {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match &self.key {
            Some(key) => write!(f, "{}: {key}: {}", self.path.display(), self.message),
            None => write!(f, "{}: {}", self.path.display(), self.message),
        }
    }
}

/// A catalog without problems.
#[derive(Debug)]
pub struct Validated<'a> {
    /// `locales/locales.yaml`.
    pub config: &'a Config,
    /// Every key, ordered by meta file name and then by position in the file.
    pub entries: Vec<ValidEntry<'a>>,
}

/// A key with its metadata and the parsed messages of every release language.
#[derive(Debug)]
pub struct ValidEntry<'a> {
    /// The key.
    pub key: &'a Key,
    /// The meta file stem, such as `common`.
    pub domain: &'a str,
    /// The metadata.
    pub meta: &'a Entry,
    /// The parsed message of each release language.
    pub messages: BTreeMap<&'a Locale, Message>,
}

impl ValidEntry<'_> {
    /// Reports whether a target shows this key.
    pub fn is_for(&self, target: Target) -> bool {
        self.meta.targets.contains(&target)
    }
}

impl Validated<'_> {
    /// Returns the keys that a target shows.
    pub fn entries_for(&self, target: Target) -> impl Iterator<Item = &ValidEntry<'_>> {
        self.entries
            .iter()
            .filter(move |entry| entry.is_for(target))
    }
}

#[derive(Default)]
struct Problems(Vec<Problem>);

impl Problems {
    fn add(&mut self, path: PathBuf, key: Option<&Key>, message: impl Into<String>) {
        self.0.push(Problem {
            path,
            key: key.cloned(),
            message: message.into(),
        });
    }
}

fn config_path() -> PathBuf {
    PathBuf::from(LOCALES_DIR).join("locales.yaml")
}

fn meta_path(domain: &str) -> PathBuf {
    PathBuf::from(LOCALES_DIR)
        .join("meta")
        .join(format!("{domain}.yaml"))
}

fn message_path(locale: &Locale, domain: &str) -> PathBuf {
    PathBuf::from(LOCALES_DIR)
        .join(locale.as_str())
        .join(format!("{domain}.yaml"))
}

impl Catalog {
    /// Checks every rule and returns the validated catalog, or every problem.
    pub fn validate(&self) -> Result<Validated<'_>, Vec<Problem>> {
        let mut problems = Problems::default();
        self.check_config(&mut problems);
        self.check_unique_keys(&mut problems);
        let parsed = self.parse_messages(&mut problems);
        self.check_complete(&mut problems);
        self.check_plural_consistency(&parsed, &mut problems);
        self.check_wallet(&parsed, &mut problems);
        if !problems.0.is_empty() {
            return Err(problems.0);
        }

        let mut parsed = parsed;
        let entries = self
            .meta
            .iter()
            .flat_map(|(domain, entries)| {
                entries
                    .iter()
                    .map(move |(key, meta)| (domain.as_str(), key, meta))
            })
            .map(|(domain, key, meta)| {
                let messages = self
                    .config
                    .release
                    .iter()
                    .filter_map(|locale| {
                        parsed
                            .remove(&(locale, key))
                            .map(|message| (locale, message))
                    })
                    .collect();
                ValidEntry {
                    key,
                    domain,
                    meta,
                    messages,
                }
            })
            .collect();
        Ok(Validated {
            config: &self.config,
            entries,
        })
    }

    /// Languages whose files must contain every key: the source language and
    /// the release languages.
    fn required_locales(&self) -> BTreeSet<&Locale> {
        self.config
            .release
            .iter()
            .chain(std::iter::once(&self.config.source))
            .collect()
    }

    fn check_config(&self, problems: &mut Problems) {
        let config = &self.config;
        for (role, locale) in [("source", &config.source), ("fallback", &config.fallback)] {
            if !config.release.contains(locale) {
                problems.add(
                    config_path(),
                    None,
                    format!("`release` must include the {role} language `{locale}`"),
                );
            }
        }
        let mut seen = BTreeSet::new();
        for locale in &config.release {
            if !seen.insert(locale) {
                problems.add(
                    config_path(),
                    None,
                    format!("`release` lists `{locale}` twice"),
                );
            }
        }
        for locale in self.required_locales() {
            if !self.messages.contains_key(locale) {
                problems.add(
                    config_path(),
                    None,
                    format!("`{locale}` has no directory {LOCALES_DIR}/{locale}/"),
                );
            }
        }
    }

    fn check_unique_keys(&self, problems: &mut Problems) {
        let mut owners: HashMap<&Key, &str> = HashMap::new();
        for (domain, entries) in &self.meta {
            for key in entries.keys() {
                if key.as_str() == android::LOCALE_TAG_KEY {
                    problems.add(
                        meta_path(domain),
                        Some(key),
                        "is reserved, because the generator writes it to every Android file",
                    );
                }
                if let Some(first) = owners.insert(key, domain) {
                    problems.add(
                        meta_path(domain),
                        Some(key),
                        format!("is also declared in {}", meta_path(first).display()),
                    );
                }
            }
        }
    }

    fn parse_messages<'a>(
        &'a self,
        problems: &mut Problems,
    ) -> HashMap<(&'a Locale, &'a Key), Message> {
        let mut parsed = HashMap::new();
        for (locale, files) in &self.messages {
            for (domain, messages) in files {
                let path = message_path(locale, domain);
                let Some(meta) = self.meta.get(domain) else {
                    problems.add(
                        path,
                        None,
                        format!("there is no {}", meta_path(domain).display()),
                    );
                    continue;
                };
                for (key, text) in messages {
                    let Some(entry) = meta.get(key) else {
                        problems.add(
                            path.clone(),
                            Some(key),
                            format!("is not declared in {}", meta_path(domain).display()),
                        );
                        continue;
                    };
                    let check = MessageCheck {
                        locale,
                        domain,
                        entry,
                    };
                    match check.run(text) {
                        Ok(message) => {
                            parsed.insert((locale, key), message);
                        }
                        Err(messages) => {
                            for message in messages {
                                problems.add(path.clone(), Some(key), message);
                            }
                        }
                    }
                }
            }
        }
        parsed
    }

    fn check_complete(&self, problems: &mut Problems) {
        for locale in self.required_locales() {
            let Some(files) = self.messages.get(locale) else {
                continue;
            };
            for (domain, entries) in &self.meta {
                for key in entries.keys() {
                    let written = files.get(domain).is_some_and(|keys| keys.contains_key(key));
                    if written {
                        continue;
                    }
                    let reason = if *locale == self.config.source {
                        "is missing; the source language defines every key"
                    } else {
                        "is missing; a release language needs every key"
                    };
                    problems.add(message_path(locale, domain), Some(key), reason);
                }
            }
        }
    }

    /// Android stores plural strings as a separate resource type, so every
    /// language of a key must agree with the source language on the plural.
    fn check_plural_consistency(
        &self,
        parsed: &HashMap<(&Locale, &Key), Message>,
        problems: &mut Problems,
    ) {
        for (domain, entries) in &self.meta {
            for key in entries.keys() {
                let Some(source) = parsed.get(&(&self.config.source, key)) else {
                    continue;
                };
                let expected = source.plural().map(|plural| plural.arg());
                for locale in self.messages.keys() {
                    if *locale == self.config.source {
                        continue;
                    }
                    let Some(message) = parsed.get(&(locale, key)) else {
                        continue;
                    };
                    let actual = message.plural().map(|plural| plural.arg());
                    if actual != expected {
                        let expected = expected.map_or("no plural argument".to_owned(), |arg| {
                            format!("the plural argument `{arg}`")
                        });
                        problems.add(
                            message_path(locale, domain),
                            Some(key),
                            format!(
                                "must use {expected}, like the source language; Android stores plurals as a separate resource type"
                            ),
                        );
                    }
                }
            }
        }
    }

    /// A Wallet pass uses the fallback text of each string as its localization
    /// key, and `pass.strings` has no format arguments. So a `wallet` key holds
    /// literal text, and its fallback text is unique and not empty.
    fn check_wallet(&self, parsed: &HashMap<(&Locale, &Key), Message>, problems: &mut Problems) {
        let fallback = &self.config.fallback;
        let mut owners: HashMap<String, &Key> = HashMap::new();
        for (domain, entries) in &self.meta {
            for (key, entry) in entries {
                if !entry.targets.contains(&Target::Wallet) {
                    continue;
                }
                if !entry.args.is_empty() {
                    problems.add(
                        meta_path(domain),
                        Some(key),
                        "declares arguments, but the wallet target takes literal text only; Wallet pass.strings files have no format arguments",
                    );
                    continue;
                }
                let Some(text) = parsed.get(&(fallback, key)).and_then(wallet::literal_text) else {
                    continue;
                };
                if text.trim().is_empty() {
                    problems.add(
                        message_path(fallback, domain),
                        Some(key),
                        "is empty; the pass uses the fallback text as the localization key",
                    );
                } else if let Some(first) = owners.insert(text, key) {
                    problems.add(
                        message_path(fallback, domain),
                        Some(key),
                        format!(
                            "has the same `{fallback}` text as `{first}`; the pass uses the fallback text as the localization key"
                        ),
                    );
                }
            }
        }
    }
}

/// Checks one message against its metadata.
struct MessageCheck<'a> {
    locale: &'a Locale,
    domain: &'a str,
    entry: &'a Entry,
}

impl MessageCheck<'_> {
    fn run(&self, text: &str) -> Result<Message, Vec<String>> {
        let message: Message = text
            .parse()
            .map_err(|error| vec![format!("cannot parse the message {error}")])?;
        let mut problems = Vec::new();
        self.check_arguments(&message, &mut problems);
        self.check_plural(&message, &mut problems);
        if self.entry.targets.contains(&Target::Android) {
            check_whitespace(&message, &mut problems);
        }
        if problems.is_empty() {
            Ok(message)
        } else {
            Err(problems)
        }
    }

    fn check_arguments(&self, message: &Message, problems: &mut Vec<String>) {
        let used = message.arguments();
        for name in self.entry.args.keys() {
            if !used.contains(name) {
                problems.push(format!("does not use the argument `{name}`"));
            }
        }
        for name in used {
            if !self.entry.args.contains_key(name) {
                problems.push(format!(
                    "uses the argument `{name}`, which {} does not declare",
                    meta_path(self.domain).display()
                ));
            }
        }
    }

    fn check_plural(&self, message: &Message, problems: &mut Vec<String>) {
        let Some(plural) = message.plural() else {
            return;
        };
        let arg = plural.arg();
        if let Some(kind) = self.entry.args.get(arg)
            && *kind != ArgType::Int
        {
            problems.push(format!(
                "the plural argument `{arg}` has type {kind}; it must have type int"
            ));
        }
        if self.entry.args.contains_key(arg) && self.entry.position(arg) != Some(1) {
            problems.push(format!(
                "the plural argument `{arg}` must be the first argument in {}; iOS selects the plural form by the first argument",
                meta_path(self.domain).display()
            ));
        }
        let expected = match self.locale.plural_categories() {
            Ok(categories) => categories,
            Err(error) => {
                problems.push(error.to_string());
                return;
            }
        };
        let actual = plural.categories();
        let missing = join(expected.difference(&actual));
        if !missing.is_empty() {
            problems.push(format!(
                "needs the plural categories {missing} of `{}`",
                self.locale
            ));
        }
        let extra = join(actual.difference(&expected));
        if !extra.is_empty() {
            problems.push(format!(
                "has the plural categories {extra}, which `{}` does not use",
                self.locale
            ));
        }
    }
}

fn join<'a>(categories: impl Iterator<Item = &'a PluralCategory>) -> String {
    categories
        .map(|category| format!("`{category}`"))
        .collect::<Vec<_>>()
        .join(", ")
}

/// Android collapses repeated spaces and drops leading and trailing spaces of a
/// string resource, so the generator rejects them instead of changing the text.
fn check_whitespace(message: &Message, problems: &mut Vec<String>) {
    let forms = match message.forms() {
        Forms::Single(segments) => vec![segments],
        Forms::Plural { forms, .. } => forms.into_values().collect(),
    };
    let is_space = |c: char| c == ' ' || c == '\t';
    for segments in forms {
        let leading =
            matches!(segments.first(), Some(Segment::Text(text)) if text.starts_with(is_space));
        let trailing =
            matches!(segments.last(), Some(Segment::Text(text)) if text.ends_with(is_space));
        let repeated = segments.iter().any(|segment| {
            matches!(segment, Segment::Text(text) if text.contains("  ") || text.contains('\t'))
        });
        if leading || trailing || repeated {
            problems.push(
                "has leading, trailing or repeated spaces, or a tab; Android would change them"
                    .to_owned(),
            );
            return;
        }
    }
}
