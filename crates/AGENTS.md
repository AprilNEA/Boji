# crates/

This directory holds Rust tools for the repository. It is a separate Cargo workspace; the repository root is not a Cargo workspace, and `bizserver/` has its own workspace.

| Path | Content |
| --- | --- |
| `Cargo.toml` | Workspace manifest, shared package fields and lints |
| `rust-toolchain.toml` | The Rust version for rustup users. It must equal `../bizserver/rust-toolchain.toml` |
| `.cargo/config.toml` | The `cargo locales` alias |
| `locales/` | `boji-locales`: generates the client string resources and the Wallet pass copy from `../locales/` |

## Setup

- Use the Rust version of `../bizserver/rust-toolchain.toml`. devenv provides it. With rustup, `rust-toolchain.toml` in this directory selects it.
- When `bizserver/` changes the Rust version, change `rust-toolchain.toml` and `rust-version` in `Cargo.toml` here in the same change.

## Commands

Run these commands in this directory.

```sh
# Validate ../locales/ and verify that the generated files are current. Writes nothing.
cargo locales check

# Validate ../locales/ and write the generated files.
cargo locales generate

# Test, lint and check the format.
cargo test
cargo clippy --all-targets -- -D warnings
cargo fmt --check
```

`cargo locales` finds the repository root from the current directory upward. Pass `--root <path>` to use another tree.

## boji-locales

### Modules

| File | Responsibility |
| --- | --- |
| `src/catalog.rs` | Reads `locales.yaml`, `meta/` and the language directories. Fails only on I/O, YAML and naming errors |
| `src/validate.rs` | Checks the rules that span files and returns every problem. Produces `Validated` |
| `src/message.rs` | Parses the ICU MessageFormat subset and expands a plural into complete forms |
| `src/locale.rs` | Canonical BCP 47 codes, Android `values*` directory names and CLDR plural categories |
| `src/model.rs` | Keys, argument names, argument types, targets and plural categories |
| `src/android.rs` | Renders `strings_shared.xml` |
| `src/apple.rs` | Renders `Shared.xcstrings` in the Xcode JSON style and compiles it with `xcstringstool` |
| `src/wallet.rs` | Renders `bizserver/src/wallet/strings.rs`, the copy of the Apple Wallet pass |
| `src/output.rs` | Compares, writes and deletes generated files |
| `src/main.rs` | The `generate` and `check` commands |
| `tests/pipeline.rs` | End-to-end tests on temporary `locales/` trees |

### Outputs

- Android: `android/app/src/main/res/<dir>/strings_shared.xml` for each release language. The fallback language uses `values/`. Other languages use `Locale::android_values_dir`, for example `values-en`, `values-pt-rBR` or `values-b+zh+Hans`.
- Each Android file starts with `<string name="locale_tag">`, whose value is the language code of the file. The app formats dates in that language, so the dates always match the text, also when Android falls back to `values/`. `LOCALE_TAG_KEY` in `src/android.rs` holds the name, and validation rejects a key with that name in `locales/meta/`. The iOS catalog does not contain it.
- iOS: `ios/Shared/Shared.xcstrings`, one catalog for all release languages. Every key has `extractionState: manual`.
- Wallet: `bizserver/src/wallet/strings.rs`, a Rust table with one `Text` per key and the `.lproj` names in `LANGUAGES`, fallback language first. bizserver writes the fallback text into `pass.json` and a `pass.strings` file for each language.
- The generator owns every `strings_shared.xml` in a `values*` directory, `ios/Shared/Shared.xcstrings` and `bizserver/src/wallet/strings.rs`. `generate` deletes an owned file that it no longer renders.
- The generator writes only the targets in `targets` of `../locales/locales.yaml`. `check` compiles the iOS catalog with `xcstringstool` even when iOS is not a target. On a computer without Xcode, `check` skips that step and prints the reason.
- A key without `targets` goes to `android` and `ios` only. A key reaches `wallet` only with an explicit `targets: [wallet]`, so app copy never enters the pass.
- A `wallet` key has no arguments, because Wallet localizes literal text. Its fallback text is the localization key of the pass, so validation rejects an empty fallback text and two `wallet` keys with the same fallback text.
- When you change a renderer, run `cargo locales generate` and commit the changed outputs in the same change.

### Rules

- Keep the ICU subset that both renderers can express: text, `{name}`, and one `{name, plural, ...}` with CLDR category selectors and `#`. Reject other syntax in `src/message.rs` with a clear error. Do not add a feature that one platform cannot express.
- The plural argument must be the first argument. Xcode compiles a plural variation into a `stringsdict` entry whose format key reads the first argument.
- Argument names are lower camel case, because Xcode uses them as Swift argument labels. Xcode builds symbol names from keys, and upper-cases a letter after a digit: `habit_card_a11y` becomes `habitCardA11Y`.
- Double `%` only in strings that have arguments, on both platforms.
- Reject leading, trailing and repeated spaces and tabs in Android strings. Do not change the text silently.
- Do not depend on the full `icu` crate. `formatjs_icu_messageformat_parser` was rejected because it pulls in `icu` and `regex` (127 crates in the tree). Use `icu_plurals` and `icu_locale_core` only.
- Library errors use `thiserror`. Only `src/main.rs` uses `anyhow`.
