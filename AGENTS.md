# Boji

Boji is a local-first fitness tracking app. This repository holds two native clients, iOS and Android, a Rust backend, the exercise animations that both clients use, and the 薄肌俱乐部 promotional website. Each directory builds on its own.

## Directory map

| Path | Content | Guide |
| --- | --- | --- |
| `ios/` | iOS app, watchOS app and widgets: SwiftUI and an XcodeGen project | `ios/AGENTS.md` |
| `android/` | Android app: Kotlin, Jetpack Compose and a Gradle project | `android/AGENTS.md` |
| `animations/` | Exercise Lottie animations: a TypeScript generator and the generated JSON | `animations/AGENTS.md` |
| `bizserver/` | Rust backend migration: Axum, better-auth-rs, ConnectRPC, SeaORM and PostgreSQL | `bizserver/AGENTS.md` |
| `websites/` | 薄肌俱乐部 promotional website and the Fumadocs docs site under `/docs`: Next.js static export, Tailwind CSS and Motion | `websites/AGENTS.md` |
| `locales/` | Copy that more than one client shows: ICU MessageFormat in YAML, one directory per language | `locales/README.md` |
| `crates/` | Rust tools for the repository, in their own Cargo workspace. `crates/locales/` generates the client string resources from `locales/` | `crates/AGENTS.md` |
| `docs/` | Documents shared by both clients. `docs/membership.md` is the membership contract. `docs/ACCESSIBILITY.md` is the accessibility statement | this file |
| `assets/public/` | Generic static files for `https://assets.leanmuscle.club`, such as the app icon images that the root `README.md` shows | this file |
| `LICENSE.md` | The PolyForm Noncommercial License 1.0.0 with the `Required Notice:` line | this file |
| `.github/` | GitHub files: `.github/CLA.md` is the contributor license agreement, and `.github/workflows/cla.yml` runs the CLA check on pull requests | this file |
| `devenv.nix`, `devenv.yaml`, `.envrc` | Local toolchains: Node.js and pnpm for `animations/` and `websites/`, Rust, `protoc`, `buf` and OpenSSL for `bizserver/`, JDK 17 for `android/`, and Python with Pillow and rembg for `websites/scripts/` | this file |
| `.work/` | Local build outputs and scratch files. Git ignores this directory | none |

## Guides

Read this file first. Then read the `AGENTS.md` that is closest to the file you edit. If two guides conflict, the closer guide takes precedence.

When you change the structure, the commands or the rules of a directory, update the `AGENTS.md` of that directory in the same change. When you add or remove a top-level directory, update the directory map in this file.

Keep the repository root small. Put a new repository-level file in `.github/`, `.config/` or `docs/`, not in the root. Keep a file in the root only when a tool requires it there. `LICENSE.md` stays in the root, because GitHub detects the license there.

## Toolchain

Enter the devenv shell at the repository root with `devenv shell`, or with direnv and `.envrc`. It provides these tools:

| Directory | Tools from devenv |
| --- | --- |
| `animations/`, `websites/` | Node.js 26 and pnpm. devenv runs `pnpm install` in both directories |
| `bizserver/` | Rust from `bizserver/rust-toolchain.toml` through the `rust-overlay` input, `protoc`, `buf`, OpenSSL and `pkg-config` |
| `crates/` | The same Rust version as `bizserver/`. `crates/rust-toolchain.toml` repeats it for rustup users |
| `android/` | JDK 17 and `JAVA_HOME`. The Gradle wrapper provides Gradle |
| `websites/scripts/` | Python 3 with Pillow and rembg. `portraits.py` downloads the rembg model to `~/.u2net` on first use |

devenv does not provide Xcode, `ictool`, XcodeGen, the Android SDK, Chromium for `animations/` previews, Docker or PostgreSQL. Install them outside devenv. Do not add PostgreSQL to devenv, because `bizserver/AGENTS.md` requires the ArcBox Compose database. Do not add XcodeGen from nixpkgs unless its version matches the version that generated `ios/Boji.xcodeproj`. Add Python packages to `languages.python.package` in `devenv.nix`. Do not add `requirements.txt`, `pyproject.toml` or a virtual environment for them.

## Commands

- `devenv test` at the repository root runs the type check of `animations/`, verifies that `animations/lottie/` and `animations/lottie-library/` match their source, and runs the type check of `websites/`.
- The iOS and Android build and test commands are in `ios/AGENTS.md` and `android/AGENTS.md`.
- The website commands are in `websites/AGENTS.md`.
- `cargo locales check` in `crates/` validates `locales/` and verifies that the generated string resources are current. `cargo locales generate` writes them. See `crates/AGENTS.md`.

### README icon

The root `README.md` shows `assets/public/boji-icon.png` in light mode and `assets/public/boji-icon-dark.png` in dark mode. Both files are exports of `ios/Boji/Resources/AppIcon.icon`. When the app icon changes, export both files again with `ictool` from Xcode. Run these commands at the repository root:

```sh
ICTOOL="/Applications/Xcode.app/Contents/Applications/Icon Composer.app/Contents/Executables/ictool"
"$ICTOOL" ios/Boji/Resources/AppIcon.icon --export-image --output-file assets/public/boji-icon.png \
  --platform iOS --rendition Default --width 256 --height 256 --scale 2
"$ICTOOL" ios/Boji/Resources/AppIcon.icon --export-image --output-file assets/public/boji-icon-dark.png \
  --platform iOS --rendition Dark --width 256 --height 256 --scale 2
```

## Cross-directory rules

### Asset host

`assets/public/` deploys to `https://assets.leanmuscle.club`. The file `assets/public/<path>` is served at `https://assets.leanmuscle.club/<path>`. This repository does not hold the deployment configuration.

Put only generic files here, such as the app icon. Keep a file that only one client or website uses in that directory, for example the website media in `websites/public/media/`.

Do not reference `files.manuscdn.com`, `/manus-storage/` or other hosted storage URLs. Store the file in the repository instead.

### Membership numbers

Treat membership numbers as opaque strings returned by the server.
Do not encode or describe server-side allocation or lifecycle policies in client code or public client documentation.
Render values without numeric conversion or assumptions about their format.

This rule applies to both clients and to all documentation in this repository.

### Exercise IDs

Three places use the same exercise IDs: `Exercise.id` in `ios/Boji/Models/BojiStore.swift`, the Android course model (`Workout.kt`), and `COURSES` in `animations/src/courses.ts`. Keep the IDs equal. If you rename or add a course exercise, update all three places and regenerate `animations/lottie/`.

`LIBRARY` in `animations/src/courses.ts` holds animated exercises that no app course uses yet. Their files are in `animations/lottie-library/`, which no app bundles. When an app course adopts one, move it from `LIBRARY` to `COURSES` and regenerate.

### Shared copy

Copy that both clients show lives in `locales/`. `crates/locales/` generates `strings_shared.xml` in the `values*` directories of `android/app/src/main/res/` and `ios/Shared/Shared.xcstrings`. Do not edit the generated files. Edit `locales/`, run `cargo locales generate` in `crates/` and commit the source and the generated files together.

Keep the keys and argument names of `locales/meta/` stable, because both clients reference them in code. Copy that only one client shows stays in that client: `android/app/src/main/res/values/strings.xml` or the Swift code of `ios/`. When a client starts to show the same copy, move it into `locales/`.

`locales/locales.yaml` lists the targets that read generated files: `android` and `ios`. Xcode generates Swift symbols for `ios/Shared/Shared.xcstrings`, such as `.Shared.tabToday`. `cargo locales check` also compiles the iOS catalog with `xcstringstool`. See `ios/AGENTS.md` for the Swift usage.

### License and CLA

`LICENSE.md` holds the official text of the PolyForm Noncommercial License 1.0.0. Its first line is the `Required Notice:` line. AprilNEA LLC is the licensor and the CLA party. Do not edit the license text. Call the project source-available, not open source.

The license does not cover the names Boji, 薄肌 and 薄肌俱乐部, the app icon, `websites/public/media/`, `websites/public/images/portraits/`, or third-party dependencies and fonts. The `## 许可证` section of the root `README.md` lists these exclusions. When you add brand assets or third-party material, add them to that list.

`.github/CLA.md` is the contributor license agreement. `.github/workflows/cla.yml` asks each commit author of a pull request to sign it with a pull request comment. The workflow stores the signatures in `signatures/version1/cla.json` on the `cla-signatures` branch, and creates that branch on its first run. Do not protect `cla-signatures`, and do not merge it into `master`.

The workflow uses CLA Assistant Lite (`contributor-assistant/github-action`), which is archived. Keep the action pinned to the commit SHA of v2.6.1. Keep the "Prepare the signature file" step, because v2.6.1 fails when the signature file does not exist.

The check reads commit authors only. It does not read `Co-authored-by` trailers or the pull request author. The allowlist matches a commit author without a linked GitHub account by its free-text name, so an author name can bypass the check. Before you merge an external pull request, check its commit authors yourself.

If you change the terms of `.github/CLA.md`, raise its version number and set `CLA_SIGNATURES` in the workflow to the next path, for example `signatures/version2/cla.json`. Contributors then sign again. Fix typos without a new version.

### Accessibility statement

`docs/ACCESSIBILITY.md` is the accessibility statement. GitHub shows it as the Accessibility tab of the repository. It lists the status of iOS, Android and the website for each App Store Accessibility Nutrition Label. Keep only one copy, because GitHub reads `.github/ACCESSIBILITY.md` before `docs/ACCESSIBILITY.md`.

When you change accessibility behavior, update the affected status and the review date in the same change. Set a status to 已验证 only after a recorded check. Record the date, the environment and the result in the verification document of that directory, and write only the result in `docs/ACCESSIBILITY.md`. Keep development rules in the guide or design document of each directory, not in the statement.

### Documentation language

Write human-facing documents in Chinese: `README.md` files, `docs/`, `ios/docs/` and `websites/docs/`. Write `AGENTS.md` files in English. `LICENSE.md` and `.github/CLA.md` are legal texts in English. Do not translate them in place.

## Git

Use `master` as the default branch.

Write commit messages in English and follow Conventional Commits.
Use a subject such as `feat: add membership cards`.
If a change touches one top-level directory, use that directory as the scope, for example `feat(ios): ...`.

Do not create a commit unless the user requests one.

When creating Git commits for this project, append exactly one trailer:

Co-authored-by: Manus <dev-agent@manus.ai>

Separate this trailer from the subject or body with a blank line. Preserve this attribution in future commits.

Commits are signed with the 1Password SSH agent. If signing fails, ask the user what to do. Do not disable signing without the user's approval.
