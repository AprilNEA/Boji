//! The files that the generator owns: rendering, comparison and writing.

use std::fmt;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use crate::model::Target;
use crate::validate::Validated;
use crate::{android, apple, wallet};

/// A rendered file, relative to the repository root.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GeneratedFile {
    /// The path, relative to the repository root.
    pub path: PathBuf,
    /// The complete contents.
    pub contents: String,
}

/// A difference between the rendered files and the files on disk.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Change {
    /// The file does not exist yet.
    Create(PathBuf),
    /// The file exists with other contents.
    Update(PathBuf),
    /// The generator owns the file, but no longer renders it.
    Delete(PathBuf),
}

impl fmt::Display for Change {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Create(path) => write!(f, "create {}", path.display()),
            Self::Update(path) => write!(f, "update {}", path.display()),
            Self::Delete(path) => write!(f, "delete {}", path.display()),
        }
    }
}

/// The error for a generated file that cannot be read, written or deleted.
#[derive(Debug, thiserror::Error)]
#[error("cannot access {}", path.display())]
pub struct OutputError {
    /// The path, relative to the repository root.
    pub path: PathBuf,
    /// The I/O error.
    #[source]
    pub source: io::Error,
}

/// Every file that the generator renders for the enabled targets, and the
/// owned files that it no longer renders.
#[derive(Debug)]
pub struct Outputs {
    files: Vec<GeneratedFile>,
    stale: Vec<PathBuf>,
}

impl Outputs {
    /// Renders the files of every target in `locales/locales.yaml` and finds the
    /// owned files on disk that are no longer rendered.
    pub fn render(validated: &Validated<'_>, root: &Path) -> Result<Self, OutputError> {
        let config = validated.config;
        let mut files = Vec::new();
        if config.targets.contains(&Target::Android) {
            for locale in &config.release {
                files.push(GeneratedFile {
                    path: android::path(validated, locale),
                    contents: android::render(validated, locale),
                });
            }
        }
        if config.targets.contains(&Target::Ios) {
            files.push(GeneratedFile {
                path: PathBuf::from(apple::PATH),
                contents: apple::render(validated),
            });
        }
        if config.targets.contains(&Target::Wallet) {
            files.push(GeneratedFile {
                path: PathBuf::from(wallet::PATH),
                contents: wallet::render(validated),
            });
        }
        let stale = owned_files(root)?
            .into_iter()
            .filter(|path| files.iter().all(|file| file.path != *path))
            .collect();
        Ok(Self { files, stale })
    }

    /// Returns the rendered files.
    pub fn files(&self) -> &[GeneratedFile] {
        &self.files
    }

    /// Compares the rendered files with the disk.
    pub fn changes(&self, root: &Path) -> Result<Vec<Change>, OutputError> {
        let mut changes = Vec::new();
        for file in &self.files {
            let full = root.join(&file.path);
            match fs::read_to_string(&full) {
                Ok(current) if current == file.contents => {}
                Ok(_) => changes.push(Change::Update(file.path.clone())),
                Err(error) if error.kind() == io::ErrorKind::NotFound => {
                    changes.push(Change::Create(file.path.clone()));
                }
                Err(source) => {
                    return Err(OutputError {
                        path: file.path.clone(),
                        source,
                    });
                }
            }
        }
        changes.extend(self.stale.iter().cloned().map(Change::Delete));
        Ok(changes)
    }

    /// Writes the changed files, deletes the stale files and returns the changes.
    pub fn apply(&self, root: &Path) -> Result<Vec<Change>, OutputError> {
        let changes = self.changes(root)?;
        for change in &changes {
            match change {
                Change::Create(path) | Change::Update(path) => {
                    let file = self
                        .files
                        .iter()
                        .find(|file| file.path == *path)
                        .expect("every create or update change comes from a rendered file");
                    write_file(root, file)?;
                }
                Change::Delete(path) => {
                    fs::remove_file(root.join(path)).map_err(|source| OutputError {
                        path: path.clone(),
                        source,
                    })?;
                }
            }
        }
        Ok(changes)
    }
}

fn write_file(root: &Path, file: &GeneratedFile) -> Result<(), OutputError> {
    let full = root.join(&file.path);
    let error = |source| OutputError {
        path: file.path.clone(),
        source,
    };
    if let Some(parent) = full.parent() {
        fs::create_dir_all(parent).map_err(error)?;
    }
    fs::write(&full, &file.contents).map_err(error)
}

/// Lists the generated files on disk: `strings_shared.xml` in any `values*`
/// directory of the Android app, the iOS String Catalog and the Wallet table.
fn owned_files(root: &Path) -> Result<Vec<PathBuf>, OutputError> {
    let mut owned = Vec::new();
    let res = Path::new(android::RES_DIR);
    let entries = match fs::read_dir(root.join(res)) {
        Ok(entries) => entries,
        Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(owned),
        Err(source) => {
            return Err(OutputError {
                path: res.to_path_buf(),
                source,
            });
        }
    };
    for entry in entries {
        let entry = entry.map_err(|source| OutputError {
            path: res.to_path_buf(),
            source,
        })?;
        let name = entry.file_name();
        if !name.to_string_lossy().starts_with("values") {
            continue;
        }
        let path = res.join(name).join(android::FILE_NAME);
        if root.join(&path).is_file() {
            owned.push(path);
        }
    }
    if root.join(apple::PATH).is_file() {
        owned.push(PathBuf::from(apple::PATH));
    }
    if root.join(wallet::PATH).is_file() {
        owned.push(PathBuf::from(wallet::PATH));
    }
    owned.sort();
    Ok(owned)
}
