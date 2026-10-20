# ios/

This directory holds the native iOS app, its watchOS app and its widgets. The project uses SwiftUI and targets iOS 26. Read `README.md` for the features, the privacy rules and the verification records.

## Layout

| Path | Content |
| --- | --- |
| `project.yml` | XcodeGen spec. It generates `Boji.xcodeproj` |
| `Boji/Models/` | Local store, HTTP and auth clients, membership and health models |
| `Boji/Views/` | SwiftUI screens and the design system (`DesignSystem.swift`) |
| `Boji/Resources/` | Icon Composer document (`AppIcon.icon`) and privacy manifest |
| `BojiWatch/` | watchOS app |
| `BojiWidgets/` | WidgetKit extension |
| `Shared/` | Code that the `Boji`, `BojiWidgets` and `BojiWatch` targets compile |
| `Shared/Shared.xcstrings` | Generated String Catalog of the copy that Android also shows. All three targets bundle it |
| `BojiTests/` | Unit tests |
| `BojiUITests/` | UI tests |
| `BojiAPI/` | Local Swift package with the generated messages and Connect clients of the `boji.v1` API |
| `docs/` | Design notes, integration notes and verification records |
| `app-store/` | Public App Store copy, pinned asc tooling and offline checks |

## Commands

Run these commands in `ios/`.

```sh
# Regenerate Boji.xcodeproj after you change project.yml.
xcodegen generate

# Build for the simulator.
xcodebuild -project Boji.xcodeproj -scheme Boji \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath ../.work/boji-ios/DerivedData \
  CODE_SIGNING_ALLOWED=NO build

# Run the unit tests and the UI tests on one simulator.
xcodebuild -project Boji.xcodeproj -scheme Boji \
  -destination "platform=iOS Simulator,id=$SIMULATOR_UDID" \
  -derivedDataPath ../.work/boji-ios/DerivedData \
  -parallel-testing-enabled NO \
  CODE_SIGNING_ALLOWED=NO test

# Regenerate the API client code, then compile the package.
(cd BojiAPI && buf generate)
(cd BojiAPI && swift build --scratch-path ../../.work/boji-ios/BojiAPI-build)
```

## Rules

### App Store metadata

- Read `app-store/README.md` before changing store metadata. Run `python3 app-store/manage.py validate` from `ios/` for offline checks.
- Use `app-store/manage.py check-connection` with runtime-injected credentials for read-only Apple identity checks. It does not process version metadata.
- Pin asc through `app-store/asc-lock.json`. Install it under the root `.work/tools/`; do not change global tool versions.
- Use `metadata/version/<version>/`, not `versions/`, for asc 5.16.0. Keep `app-store/project.json` aligned with `project.yml`.
- Treat store copy as a draft until names, claims, URLs and release requirements are approved. Never guess the App Store numeric ID.
- The wrapper only installs, validates, reads and previews. Real uploads, review submissions and releases require separate authorization.
- Keep keys, review credentials and contacts out of public metadata. Keep downloads and preview artifacts under the root `.work/boji-asc/`.

### Project and build

- Edit `project.yml`, not `Boji.xcodeproj`. After each change to `project.yml`, run `xcodegen generate` and commit both files.
- Edit `Boji/Resources/AppIcon.icon` in Icon Composer. Xcode compiles the icon during the app build.
- Write build outputs to `../.work/boji-ios/`. Do not write DerivedData or other build outputs inside `ios/`.
- If a restricted terminal blocks Swift macro plugins with `sandbox_apply: Operation not permitted`, allow Xcode to run the plugins. Do not remove `@Observable` to hide the permission problem.
- Lottie is pinned in `project.yml`. Keep the generated `Package.resolved` with the project.
- Bundle `../animations/lottie` as a folder reference. Never bundle `lottie-library` or flatten the theme directories.
- Load course animations by exercise ID through `ExerciseAnimationCatalog`. Use `posterFrame` for Reduce Motion; missing resources need a static fallback.
- Keep only the current exercise player active. Pause for hidden views, inactive scenes, rests, and user pauses.
- Exclude `*.tmp` files from generated build resources.
- Do not edit `BojiAPI/Sources/BojiAPI/Generated/`. `buf generate` in `BojiAPI/` writes it from `../bizserver/proto/boji/v1/`. Follow "API contract" in the root `AGENTS.md` for the version rules. The app targets do not link `BojiAPI` yet. When a target adopts it, add it as a local package in `project.yml`.

### Shared copy

- `Shared/Shared.xcstrings` is generated from `../locales/` by `../crates/locales/`. Do not edit it in Xcode or by hand. To change copy that Android also shows, edit `../locales/` and run `cargo locales generate` in `../crates/`.
- `project.yml` sets `STRING_CATALOG_GENERATE_SYMBOLS`, so Xcode generates `LocalizedStringResource.Shared`. The key `tab_today` becomes `.Shared.tabToday`. The key `session_set` with the arguments `current`, `total` and `reps` becomes `.Shared.sessionSet(current:total:reps:)`. Build once after `cargo locales generate` to get new symbols.
- Reference shared copy through these symbols, never through a literal key or a copy of the Chinese text. Pass the symbol directly to SwiftUI APIs, for example `Text(.Shared.todayTitle)` or `Button(.Shared.actionCancel, role: .cancel)`.
- When a parameter has the type `String`, such as `PrimaryButton(title:)` or a model property, resolve the symbol with `String(localized: .Shared.welcomeStart)`.
- In a ternary, name the type in the first branch: `running ? LocalizedStringResource.Shared.sessionPause : .Shared.sessionResume`.
- Set the SwiftUI locale only through `Locale.bojiDisplay` in `BojiApp.swift`. SwiftUI looks up strings with the environment locale, so a fixed locale such as `zh_Hans_CN` keeps every `Text` in one language.
- Copy that only iOS shows stays in Swift code. When Android starts to show the same copy, move it into `../locales/`.

### Tests

- UI tests launch the app with `--uitesting`. This argument selects the in-memory store and the test membership service.
- UI tests must not use the real backend, real HealthKit data or the user's records.
- Membership UI tests can add `--membership-fixture=long-number`, `suspended`, or `offline`. These fixtures require the Debug `--uitesting` entry point.
- Animation UI tests can add `--animation-reduce-motion` or `--animation-missing-asset`. These flags require Debug and `--uitesting`.

### Accounts and data

- Read auth tokens only from the `set-auth-token` response header. Store them only in the Keychain. Do not put tokens in JSON exports.
- A Release build must use an HTTPS `BOJI_API_BASE_URL`. If the value is not set, keep online membership features disabled.
- Show HealthKit samples in memory only. Do not save them, upload them or let them overwrite manual records.
- Widgets and the watch app show only today's check-in state. Do not share health samples or account data with them. Sharing is off by default.

### Design

Read `docs/design.md` before you change a screen. Build screens from the components in `Boji/Views/DesignSystem.swift`.

- Use Liquid Glass only in the functional layer: tab bars, navigation bars, toolbars and the bottom action bar. Do not apply glass to content cards, list rows or the membership card face.
- Put the main action of a screen in `PrimaryButton` inside `safeAreaBar(edge: .bottom)`. Show at most one `PrimaryButton` on a screen. Do not give the bar a background.
- Use `CardButton` or a bordered button for an action inside a content card.
- Put page-level actions, such as settings and share, in the toolbar. Add `profileToolbar()` to every tab root.
- Give sheet toolbar buttons a role: `.cancel` for cancel, `.close` for read-only screens and `.confirm` for save.
- Use `GroupedRows` for tappable lists. Use `Surface` for content cards. Use `BojiTheme.cardRadius` for card corners and `ConcentricRectangle` for shapes inside a card.
- Use the system large title on tab roots. Use `PageHeading` only on the welcome and membership screens.
- Do not draw concentric progress rings. The HIG reserves that form for Activity rings.
- Define every custom color with light, dark and increased-contrast variants. Use `BojiTheme.accentFill`, not `accent`, behind white text or symbols.
- Support dark mode and Dynamic Type on every screen. Do not use a fixed font size for text. Switch side-by-side cards to a column at accessibility sizes with `AdaptiveStack`.
