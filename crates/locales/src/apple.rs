//! Renders `Shared.xcstrings`, the String Catalog of the iOS app, its widgets and
//! its watch app.
//!
//! Every key is a manual key: Xcode does not extract it from Swift code, and the
//! generated Swift symbols reference it as `.Shared.tabToday`. Arguments use
//! named placeholders such as `%1$(minutes)lld`, so the generated symbol has the
//! labels of `locales/meta/`.

use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::process::Command;

use serde::Serialize;
use serde_json::ser::Formatter;
use serde_json::{Map, Value, json};

use crate::catalog::Entry;
use crate::message::{Forms, Message, Segment};
use crate::model::{ArgName, ArgType, Target};
use crate::validate::Validated;

/// The path of the String Catalog, relative to the repository root.
pub const PATH: &str = "ios/Shared/Shared.xcstrings";

/// The String Catalog format version that Xcode 26 writes.
const VERSION: &str = "1.1";

/// Renders the String Catalog with every release language.
pub fn render(validated: &Validated<'_>) -> String {
    let mut strings = Map::new();
    for entry in validated.entries_for(Target::Ios) {
        let localizations: Map<String, Value> = entry
            .messages
            .iter()
            .map(|(locale, message)| {
                (
                    locale.as_str().to_owned(),
                    localization(entry.meta, message),
                )
            })
            .collect();
        let mut value = Map::new();
        if let Some(comment) = &entry.meta.comment {
            value.insert("comment".to_owned(), json!(comment));
        }
        value.insert("extractionState".to_owned(), json!("manual"));
        value.insert("localizations".to_owned(), Value::Object(localizations));
        strings.insert(entry.key.as_str().to_owned(), Value::Object(value));
    }
    let catalog = json!({
        "sourceLanguage": validated.config.source.as_str(),
        "strings": strings,
        "version": VERSION,
    });
    let mut out = to_xcode_json(&catalog);
    out.push('\n');
    out
}

fn localization(meta: &Entry, message: &Message) -> Value {
    match message.forms() {
        Forms::Single(segments) => string_unit(format_segments(meta, &segments)),
        Forms::Plural { forms, .. } => {
            let plural: Map<String, Value> = forms
                .iter()
                .map(|(category, segments)| {
                    (
                        category.as_str().to_owned(),
                        string_unit(format_segments(meta, segments)),
                    )
                })
                .collect();
            json!({ "variations": { "plural": plural } })
        }
    }
}

fn string_unit(value: String) -> Value {
    json!({ "stringUnit": { "state": "translated", "value": value } })
}

/// Formats one text form as an Apple format string.
fn format_segments(meta: &Entry, segments: &[Segment]) -> String {
    let formatted = !meta.args.is_empty();
    let mut out = String::new();
    for segment in segments {
        match segment {
            Segment::Text(text) if formatted => out.push_str(&text.replace('%', "%%")),
            Segment::Text(text) => out.push_str(text),
            Segment::Arg(name) | Segment::Count(name) => out.push_str(&placeholder(meta, name)),
        }
    }
    out
}

/// Returns the named positional placeholder of an argument, such as
/// `%2$(level)@`.
fn placeholder(meta: &Entry, name: &ArgName) -> String {
    let position = meta
        .position(name)
        .expect("validation rejects messages with undeclared arguments");
    let specifier = match meta.args[name] {
        ArgType::String => "@",
        ArgType::Int => "lld",
    };
    format!("%{position}$({name}){specifier}")
}

/// Serializes JSON the way Xcode writes String Catalogs: two-space indent and
/// ` : ` between a key and its value.
fn to_xcode_json(value: &Value) -> String {
    let mut out = Vec::new();
    let mut serializer =
        serde_json::Serializer::with_formatter(&mut out, XcodeFormatter::default());
    value
        .serialize(&mut serializer)
        .expect("serializing a JSON value into memory cannot fail");
    String::from_utf8(out).expect("serde_json writes UTF-8")
}

#[derive(Default)]
struct XcodeFormatter {
    indent: usize,
    has_value: bool,
}

impl XcodeFormatter {
    fn newline<W: ?Sized + io::Write>(&self, writer: &mut W) -> io::Result<()> {
        writer.write_all(b"\n")?;
        for _ in 0..self.indent {
            writer.write_all(b"  ")?;
        }
        Ok(())
    }
}

impl Formatter for XcodeFormatter {
    fn begin_array<W: ?Sized + io::Write>(&mut self, writer: &mut W) -> io::Result<()> {
        self.indent += 1;
        self.has_value = false;
        writer.write_all(b"[")
    }

    fn end_array<W: ?Sized + io::Write>(&mut self, writer: &mut W) -> io::Result<()> {
        self.indent -= 1;
        if self.has_value {
            self.newline(writer)?;
        }
        writer.write_all(b"]")
    }

    fn begin_array_value<W: ?Sized + io::Write>(
        &mut self,
        writer: &mut W,
        first: bool,
    ) -> io::Result<()> {
        if !first {
            writer.write_all(b",")?;
        }
        self.newline(writer)
    }

    fn end_array_value<W: ?Sized + io::Write>(&mut self, _writer: &mut W) -> io::Result<()> {
        self.has_value = true;
        Ok(())
    }

    fn begin_object<W: ?Sized + io::Write>(&mut self, writer: &mut W) -> io::Result<()> {
        self.indent += 1;
        self.has_value = false;
        writer.write_all(b"{")
    }

    fn end_object<W: ?Sized + io::Write>(&mut self, writer: &mut W) -> io::Result<()> {
        self.indent -= 1;
        if self.has_value {
            self.newline(writer)?;
        }
        writer.write_all(b"}")
    }

    fn begin_object_key<W: ?Sized + io::Write>(
        &mut self,
        writer: &mut W,
        first: bool,
    ) -> io::Result<()> {
        if !first {
            writer.write_all(b",")?;
        }
        self.newline(writer)
    }

    fn begin_object_value<W: ?Sized + io::Write>(&mut self, writer: &mut W) -> io::Result<()> {
        writer.write_all(b" : ")
    }

    fn end_object_value<W: ?Sized + io::Write>(&mut self, _writer: &mut W) -> io::Result<()> {
        self.has_value = true;
        Ok(())
    }
}

/// The result of compiling the String Catalog with Xcode.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum XcodeCheck {
    /// `xcstringstool` compiled the catalog.
    Compiled,
    /// The check did not run, for the given reason.
    Skipped(String),
}

/// The error for a String Catalog that Xcode rejects.
#[derive(Debug, thiserror::Error)]
pub enum XcodeError {
    /// The temporary files cannot be written.
    #[error("cannot prepare {}", path.display())]
    Prepare {
        /// The temporary path.
        path: PathBuf,
        /// The I/O error.
        #[source]
        source: io::Error,
    },
    /// `xcstringstool` rejected the catalog.
    #[error("xcstringstool cannot compile the String Catalog:\n{output}")]
    Rejected {
        /// The output of `xcstringstool`.
        output: String,
    },
}

/// Compiles a rendered String Catalog with `xcrun xcstringstool` in a temporary
/// directory. Skips the check when Xcode is not available.
pub fn compile(contents: &str) -> Result<XcodeCheck, XcodeError> {
    if !cfg!(target_os = "macos") {
        return Ok(XcodeCheck::Skipped("xcstringstool needs macOS".to_owned()));
    }
    let dir = std::env::temp_dir().join(format!("boji-locales-{}", std::process::id()));
    let result = compile_in(&dir, contents);
    // A leftover temporary directory is harmless, so a failed cleanup is not an error.
    let _cleanup = fs::remove_dir_all(&dir);
    result
}

fn compile_in(dir: &Path, contents: &str) -> Result<XcodeCheck, XcodeError> {
    let input = dir.join("Shared.xcstrings");
    let output = dir.join("out");
    let prepare = |path: &Path, source| XcodeError::Prepare {
        path: path.to_path_buf(),
        source,
    };
    fs::create_dir_all(&output).map_err(|source| prepare(&output, source))?;
    fs::write(&input, contents).map_err(|source| prepare(&input, source))?;

    let result = Command::new("xcrun")
        .args(["xcstringstool", "compile"])
        .arg(&input)
        .arg("--output-directory")
        .arg(&output)
        .output();
    let result = match result {
        Ok(result) => result,
        Err(error) if error.kind() == io::ErrorKind::NotFound => {
            return Ok(XcodeCheck::Skipped("xcrun is not installed".to_owned()));
        }
        Err(source) => return Err(prepare(Path::new("xcrun"), source)),
    };
    if result.status.success() {
        Ok(XcodeCheck::Compiled)
    } else {
        let mut output = String::from_utf8_lossy(&result.stdout).into_owned();
        output.push_str(&String::from_utf8_lossy(&result.stderr));
        Err(XcodeError::Rejected { output })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn writes_json_in_xcode_style() {
        let value = json!({ "b": { "c": [1, 2] }, "a": "x", "e": {} });
        assert_eq!(
            to_xcode_json(&value),
            "{\n  \"a\" : \"x\",\n  \"b\" : {\n    \"c\" : [\n      1,\n      2\n    ]\n  },\n  \"e\" : {}\n}"
        );
    }
}
