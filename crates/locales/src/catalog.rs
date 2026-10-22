//! Reads `locales/` into memory without judging its contents.
//!
//! Loading fails only when a file cannot be read or parsed. Rules that span
//! several files, such as matching keys, belong to [`crate::validate`].

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use indexmap::IndexMap;
use serde::Deserialize;
use serde::de::DeserializeOwned;

use crate::locale::{Locale, LocaleError};
use crate::model::{ArgName, ArgType, Key, Target};

/// The name of the data directory below the repository root.
pub const LOCALES_DIR: &str = "locales";
const CONFIG_FILE: &str = "locales.yaml";
const META_DIR: &str = "meta";

/// The contents of `locales/`.
#[derive(Debug)]
pub struct Catalog {
    /// `locales/locales.yaml`.
    pub config: Config,
    /// The files of `locales/meta/`, by file stem.
    pub meta: BTreeMap<String, IndexMap<Key, Entry>>,
    /// The message files of each language directory: language, file stem, key,
    /// and the ICU text as written.
    pub messages: BTreeMap<Locale, BTreeMap<String, IndexMap<Key, String>>>,
}

/// `locales/locales.yaml`.
#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Config {
    /// The language that defines every key.
    pub source: Locale,
    /// The language shown when the system language is not supported.
    pub fallback: Locale,
    /// The languages that ship in the apps.
    pub release: Vec<Locale>,
    /// The consumers that read generated files.
    pub targets: BTreeSet<Target>,
}

/// The metadata of one key, from `locales/meta/`.
#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Entry {
    /// Context for translators. Apple String Catalogs show it in Xcode.
    #[serde(default)]
    pub comment: Option<String>,
    /// The arguments in position order. Android passes arguments in this order.
    #[serde(default)]
    pub args: IndexMap<ArgName, ArgType>,
    /// The consumers that show the string. Omitted means both apps, Android and
    /// iOS. The `wallet` target must be named.
    #[serde(default = "app_targets")]
    pub targets: BTreeSet<Target>,
}

fn app_targets() -> BTreeSet<Target> {
    Target::APPS.into_iter().collect()
}

impl Entry {
    /// Returns the one-based position of an argument.
    pub fn position(&self, name: &ArgName) -> Option<usize> {
        self.args.get_index_of(name).map(|index| index + 1)
    }
}

impl Catalog {
    /// Reads `locales/` below the repository root.
    pub fn load(root: &Path) -> Result<Self, LoadError> {
        let dir = root.join(LOCALES_DIR);
        let config = read_yaml::<Config>(root, &dir.join(CONFIG_FILE))?;

        let mut meta = BTreeMap::new();
        for (stem, path) in yaml_files(root, &dir.join(META_DIR))? {
            let entries: IndexMap<Key, Option<Entry>> = read_yaml_map(root, &path)?;
            let entries = entries
                .into_iter()
                .map(|(key, entry)| (key, entry.unwrap_or_else(Entry::without_metadata)))
                .collect();
            meta.insert(stem, entries);
        }

        let mut messages = BTreeMap::new();
        for entry in read_dir(root, &dir)? {
            let name = entry.file_name().to_string_lossy().into_owned();
            let is_dir = entry
                .file_type()
                .map_err(|source| LoadError::read(root, &entry.path(), source))?
                .is_dir();
            if !is_dir || name == META_DIR || name.starts_with('.') {
                continue;
            }
            let locale = Locale::try_from(name).map_err(|source| LoadError::Locale {
                path: relative(root, &entry.path()),
                source,
            })?;
            let mut files = BTreeMap::new();
            for (stem, path) in yaml_files(root, &entry.path())? {
                files.insert(stem, read_yaml_map(root, &path)?);
            }
            messages.insert(locale, files);
        }

        Ok(Self {
            config,
            meta,
            messages,
        })
    }
}

impl Entry {
    /// The entry of a key written as `key:` with no value: no comment, no
    /// arguments, both apps.
    fn without_metadata() -> Self {
        Self {
            comment: None,
            args: IndexMap::new(),
            targets: app_targets(),
        }
    }
}

/// The error for a `locales/` file that cannot be read.
#[derive(Debug, thiserror::Error)]
pub enum LoadError {
    /// The file or directory cannot be read.
    #[error("cannot read {}", path.display())]
    Read {
        /// The path, relative to the repository root.
        path: PathBuf,
        /// The I/O error.
        #[source]
        source: io::Error,
    },
    /// The file is not valid YAML for its schema.
    #[error("{}: {source}", path.display())]
    Yaml {
        /// The path, relative to the repository root.
        path: PathBuf,
        /// The YAML error, with line and column.
        #[source]
        source: yaml_serde::Error,
    },
    /// A directory name is not a usable language code.
    #[error("{}: {source}", path.display())]
    Locale {
        /// The path, relative to the repository root.
        path: PathBuf,
        /// The language code error.
        #[source]
        source: LocaleError,
    },
    /// A file that is not a `.yaml` file.
    #[error("{}: only .yaml files belong here", path.display())]
    UnexpectedFile {
        /// The path, relative to the repository root.
        path: PathBuf,
    },
}

impl LoadError {
    fn read(root: &Path, path: &Path, source: io::Error) -> Self {
        Self::Read {
            path: relative(root, path),
            source,
        }
    }
}

/// Returns `path` relative to `root`, or `path` itself when it is outside `root`.
pub fn relative(root: &Path, path: &Path) -> PathBuf {
    path.strip_prefix(root).unwrap_or(path).to_path_buf()
}

fn read_dir(root: &Path, dir: &Path) -> Result<Vec<fs::DirEntry>, LoadError> {
    let mut entries = fs::read_dir(dir)
        .and_then(|entries| entries.collect::<io::Result<Vec<_>>>())
        .map_err(|source| LoadError::read(root, dir, source))?;
    entries.sort_by_key(fs::DirEntry::file_name);
    Ok(entries)
}

/// Lists the `.yaml` files of a directory as (file stem, path), sorted by name.
fn yaml_files(root: &Path, dir: &Path) -> Result<Vec<(String, PathBuf)>, LoadError> {
    let mut files = Vec::new();
    for entry in read_dir(root, dir)? {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().into_owned();
        if name.starts_with('.') {
            continue;
        }
        match name.strip_suffix(".yaml") {
            Some(stem) if path.is_file() => files.push((stem.to_owned(), path)),
            _ => {
                return Err(LoadError::UnexpectedFile {
                    path: relative(root, &path),
                });
            }
        }
    }
    Ok(files)
}

fn read_yaml<T: DeserializeOwned>(root: &Path, path: &Path) -> Result<T, LoadError> {
    let text = fs::read_to_string(path).map_err(|source| LoadError::read(root, path, source))?;
    parse_yaml(root, path, &text)
}

/// Reads a mapping file. An empty file is an empty mapping.
fn read_yaml_map<T: DeserializeOwned + Default>(root: &Path, path: &Path) -> Result<T, LoadError> {
    let text = fs::read_to_string(path).map_err(|source| LoadError::read(root, path, source))?;
    if text
        .lines()
        .all(|line| line.trim().is_empty() || line.trim_start().starts_with('#'))
    {
        return Ok(T::default());
    }
    parse_yaml(root, path, &text)
}

fn parse_yaml<T: DeserializeOwned>(root: &Path, path: &Path, text: &str) -> Result<T, LoadError> {
    yaml_serde::from_str(text).map_err(|source| LoadError::Yaml {
        path: relative(root, path),
        source,
    })
}
