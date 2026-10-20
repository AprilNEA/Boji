# Boji

Boji is a local-first fitness tracking app. This repository holds two native clients, iOS and Android, the exercise animations that both clients use, and the 薄肌俱乐部 promotional website. Each directory builds on its own.

## Directory map

| Path | Content | Guide |
| --- | --- | --- |
| `ios/` | iOS app, watchOS app and widgets: SwiftUI and an XcodeGen project | `ios/AGENTS.md` |
| `android/` | Android app: Kotlin, Jetpack Compose and a Gradle project | `android/AGENTS.md` |
| `animations/` | Exercise Lottie animations: a TypeScript generator and the generated JSON | `animations/AGENTS.md` |
| `bizserver/` | Rust backend migration: Axum, better-auth-rs, ConnectRPC, SeaORM and PostgreSQL | `bizserver/AGENTS.md` |
| `web/` | 薄肌俱乐部 promotional website: Next.js static export, Tailwind CSS and Motion | `web/AGENTS.md` |
| `docs/` | Documents shared by both clients. `docs/membership.md` is the membership contract | this file |
| `devenv.nix`, `devenv.yaml`, `.envrc` | Local Node.js and pnpm toolchain for `animations/` and `web/` | `animations/AGENTS.md`, `web/AGENTS.md` |
| `.work/` | Local build outputs and scratch files. Git ignores this directory | none |

## Guides

Read this file first. Then read the `AGENTS.md` that is closest to the file you edit. If two guides conflict, the closer guide takes precedence.

When you change the structure, the commands or the rules of a directory, update the `AGENTS.md` of that directory in the same change. When you add or remove a top-level directory, update the directory map in this file.

## Commands

- `devenv test` at the repository root runs the type check of `animations/`, verifies that `animations/lottie/` matches its source, and runs the type check of `web/`.
- The iOS and Android build and test commands are in `ios/AGENTS.md` and `android/AGENTS.md`.
- The website commands are in `web/AGENTS.md`.

## Cross-directory rules

### Membership numbers

Treat membership numbers as opaque strings returned by the server.
Do not encode or describe server-side allocation or lifecycle policies in client code or public client documentation.
Render values without numeric conversion or assumptions about their format.

This rule applies to both clients and to all documentation in this repository.

### Exercise IDs

Three places use the same exercise IDs: `Exercise.id` in `ios/Boji/Models/BojiStore.swift`, the Android course model (`Workout.kt`), and `COURSES` in `animations/src/courses.ts`. Keep the IDs equal. If you rename or add a course exercise, update all three places and regenerate `animations/lottie/`.

`LIBRARY` in `animations/src/courses.ts` holds animated exercises that no app course uses yet. When an app course adopts one, move it from `LIBRARY` to `COURSES`.

### Documentation language

Write human-facing documents in Chinese: `README.md` files, `docs/`, `ios/docs/` and `web/docs/`. Write `AGENTS.md` files in English.

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
