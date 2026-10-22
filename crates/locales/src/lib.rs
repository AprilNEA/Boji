//! Generates the string resources of the Boji clients from `locales/`.
//!
//! `locales/` holds the copy that more than one client shows, written as ICU
//! MessageFormat. [`Catalog::load`] reads it, [`Catalog::validate`] checks it,
//! and [`Outputs::render`] renders the files that the clients read:
//!
//! - Android: `android/app/src/main/res/values*/strings_shared.xml`.
//! - iOS: `ios/Shared/Shared.xcstrings`.
//! - The Apple Wallet pass of `bizserver/`: `bizserver/src/wallet/strings.rs`.
//!
//! The generated files are committed, so the client builds do not need Rust
//! and the server build does not read `locales/`.

mod android;
pub mod apple;
mod catalog;
mod locale;
mod message;
mod model;
mod output;
mod validate;
mod wallet;

pub use catalog::{Catalog, Config, Entry, LoadError};
pub use locale::{Locale, LocaleError};
pub use message::{Forms, Message, ParseError, ParseErrorKind, Plural, Segment};
pub use model::{ArgName, ArgType, IdentifierError, Key, PluralCategory, Target};
pub use output::{Change, GeneratedFile, OutputError, Outputs};
pub use validate::{Problem, ValidEntry, Validated};
