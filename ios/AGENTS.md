# ios/

This directory holds the native iOS app, its watchOS app and its widgets. The project uses SwiftUI and targets iOS 26. Read `README.md` for the features, the privacy rules and the verification records.

## Layout

| Path | Content |
| --- | --- |
| `project.yml` | XcodeGen spec. It generates `Boji.xcodeproj` |
| `Boji/Models/` | Local store, HTTP, auth and Connect clients, membership and health models |
| `Boji/Views/` | SwiftUI screens and the design system (`DesignSystem.swift`) |
| `Boji/Resources/` | Icon Composer document (`AppIcon.icon`), privacy manifest, `Localizable.xcstrings` for the copy that only the app shows, and `InfoPlist.xcstrings` |
| `BojiWatch/` | watchOS app, with its own `Localizable.xcstrings` and `InfoPlist.xcstrings` |
| `BojiWidgets/` | WidgetKit extension, with its own `Localizable.xcstrings` |
| `Shared/` | Code that the `Boji`, `BojiWidgets` and `BojiWatch` targets compile |
| `Shared/Shared.xcstrings` | Generated String Catalog of the copy that Android also shows. All three targets bundle it |
| `BojiTests/` | Unit tests |
| `BojiUITests/` | UI tests |
| `BojiAPI/` | Local Swift package with the generated messages and Connect clients of the `boji.v1` API |
| `docs/` | Design notes, integration notes and verification records |
| `app-store/` | Public App Store copy, pinned asc tooling and offline checks |
| `app-store/screenshots/` | Local-only screenshot editor and source captures; see its `AGENTS.md` |
| `ci/` | Pinned CI tools, signing validation, release provenance and offline tests; see `docs/ci-cd.md` |

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

# After a command-line build, add the new keys of the app to its String Catalog.
# For the widgets, use BojiWidgets.build and BojiWidgets/Localizable.xcstrings.
# For the watch app, use Debug-watchsimulator/BojiWatch.build and BojiWatch/Localizable.xcstrings.
OBJ=../.work/boji-ios/DerivedData/Build/Intermediates.noindex/Boji.build/Debug-iphonesimulator/Boji.build/Objects-normal/arm64
xcrun xcstringstool sync Boji/Resources/Localizable.xcstrings \
  --stringsdata $(ls "$OBJ"/*.stringsdata | grep -v -e GeneratedStringSymbols_ -e ExtractedAppShortcuts)
```

## Rules

### CI and release

- Keep one workflow at `../.github/workflows/ios.yml`, with separate CI, TestFlight and review jobs. Manual dispatch selects `ci`, `testflight` or `review`.
- PR jobs use GitHub-hosted runners without release secrets. Do not use `pull_request_target` or personal self-hosted runners for PR code.
- Pin actions by commit SHA, Xcode by version/build and XcodeGen by archive checksum. Keep workflow values aligned with `ci/toolchain.json`. `ci/tests/test_pipeline.py` checks the runner label, `DEVELOPER_DIR`, Node.js and pnpm values.
- The macOS jobs use the GitHub-hosted `xcode-27` preview label with Xcode 27.1. Read `docs/ci-cd.md` before you change the runner or Xcode.
- Run `python3 -m unittest discover -s ios/ci/tests -v` and `actionlint .github/workflows/ios.yml` from the repository root after CI changes. `../.github/actionlint.yaml` declares `xcode-27`, because actionlint 1.7.12 does not list that label.
- Release jobs require manual dispatch on `master` and protected environments. Do not create, copy or broaden signing credentials without authorization.
- TestFlight requires successful CI jobs in the same run. Review must verify successful `validate`, `build`, `release-gate` and `testflight` jobs in the source run.
- Preserve those job names or update `ci/guard.py` with them. A successful workflow conclusion alone does not prove that an upload occurred.
- Keep archive, IPA export and upload visible as separate workflow steps. `ci/signing.py` only validates, prepares and cleans up signing state.
- Run signing cleanup with `always()`. Preserve build failures through `pipefail`; never publish raw release logs, dSYMs or signing files.
- Encrypt release diagnostics with the configured OpenPGP public key before uploading artifacts. Keep the decryption private key outside CI.
- Keep `ci/release-approval.json` checks false until the corresponding build passes acceptance. Bind approval to the receipt's commit and build ID. Never reuse approval for another build.
- Submit the exact TestFlight build recorded in its verified workflow receipt. Never rebuild during review submission or release the app automatically.
- Require the existing manual-release store version to have that same build attached. Default submission checks may read Apple state but must not mutate it.
- Simulator discovery in `ci/check.py` is for GitHub runners only. Use AppSim for local simulator operations.

### App Store metadata

- Read `app-store/README.md` before changing store metadata. Run `python3 app-store/manage.py validate` from `ios/` for offline checks.
- Use `app-store/manage.py check-connection` with runtime-injected credentials for read-only Apple identity checks. It does not process version metadata.
- Pin asc through `app-store/asc-lock.json`. Install it under the root `.work/tools/`; do not change global tool versions.
- Use `metadata/version/<version>/`, not `versions/`, for asc 5.16.0. Keep `app-store/project.json` aligned with `project.yml`.
- Treat store copy as a draft until names, claims, URLs and release requirements are approved. Never guess the App Store numeric ID.
- The wrapper only installs, validates, reads and previews. Real uploads, review submissions and releases require separate authorization.
- Keep keys, review credentials and contacts out of public metadata. Keep downloads and preview artifacts under the root `.work/boji-asc/`.
- Keep screenshot editing separate from asc credentials. Use real, isolated app captures and record their provenance; never fabricate UI or upload drafts automatically.

### Project and build

- Edit `project.yml`, not `Boji.xcodeproj`. After each change to `project.yml`, run `xcodegen generate` and commit both files.
- Edit `Boji/Resources/AppIcon.icon` in Icon Composer. Xcode compiles the icon during the app build.
- Write build outputs to `../.work/boji-ios/`. Do not write DerivedData or other build outputs inside `ios/`.
- If a restricted terminal blocks Swift macro plugins or SwiftPM manifest loading with `sandbox_apply: Operation not permitted`, allow Xcode to run them. Do not remove `@Observable` or a package to hide the permission problem.
- Lottie and Sentry are pinned with `exactVersion` in `project.yml`. connect-swift and swift-protobuf are pinned with `exact:` in `BojiAPI/Package.swift`. Keep the generated `Package.resolved` with the project.
- Bundle `../animations/lottie` as a folder reference. Never bundle `lottie-library` or flatten the theme directories.
- Load course animations by exercise ID through `ExerciseAnimationCatalog`. Load bundled IDs first and never request them from the network.
- Remote course IDs use only the verified `ExerciseAnimationRemoteStore` disk cache. Its root is `Application Support/ExerciseAnimations/`, and it is excluded from backups. Validate the remote index, SHA-256 bytes and Lottie timing before a cache write.
- The remote session must be ephemeral, cookie-free, cache-free and redirect-free. Do not add animation requests, URLs or errors to Sentry. The only custom request header is `If-None-Match`.
- The detail screen may prefetch only its remote course. Limit file downloads to three. The player must not download. Use `posterFrame` for Reduce Motion; missing resources need a static fallback.
- Keep only the current exercise player active. Pause for hidden views, inactive scenes, rests, and user pauses.
- Exclude `*.tmp` files from generated build resources.
- Exclude all of `Boji/DebugSupport/**` from XcodeGen source discovery. The Debug build script copies its fixtures; Release must not contain `RemoteAnimationFixtures`.
- Set `BOJI_ANIMATION_FIXTURE_DIR` inside the app only for Debug. Release uses `DERIVED_FILE_DIR`, because Xcode creates script output parents before running the script.
- Keep generated project identifiers deterministic. `ci/check.py source` rejects `TEMP_` identifiers; do not bypass the generated-project diff check.
- Do not edit `BojiAPI/Sources/BojiAPI/Generated/`. `buf generate` in `BojiAPI/` writes it from `../bizserver/proto/boji/v1/`. Follow "API contract" in the root `AGENTS.md` for the version rules.
- The `Boji` target links `BojiAPI` as a local package in `project.yml`. The widgets and the watch app do not. `Models/MembershipRPC.swift` calls `SystemService`, `MembershipService` and `WalletService` through `MembershipTransport`, so Connect calls share the cookie-free session, the redirect blocker and the test transports with the Better Auth calls. Keep account calls on `/api/auth/*` in `Models/BetterAuthClient.swift`.
- Test targets do not import `BojiAPI`. Build Connect responses and read Connect requests with `MembershipRPCFixtures` in `Models/MembershipRPCFixtures.swift`, which compiles only in Debug. The UI test transport uses the same fixtures.

### Shared copy

- `Shared/Shared.xcstrings` is generated from `../locales/` by `../crates/locales/`. Do not edit it in Xcode or by hand. To change copy that Android also shows, edit `../locales/` and run `cargo locales generate` in `../crates/`.
- `project.yml` sets `STRING_CATALOG_GENERATE_SYMBOLS`, so Xcode generates `LocalizedStringResource.Shared`. The key `tab_today` becomes `.Shared.tabToday`. The key `session_set` with the arguments `current`, `total` and `reps` becomes `.Shared.sessionSet(current:total:reps:)`. Build once after `cargo locales generate` to get new symbols.
- Reference shared copy through these symbols, never through a literal key or a copy of the Chinese text. Pass the symbol directly to SwiftUI APIs, for example `Text(.Shared.todayTitle)` or `Button(.Shared.actionCancel, role: .cancel)`.
- When a parameter has the type `String`, such as `PrimaryButton(title:)` or a model property, resolve the symbol with `String(localized: .Shared.welcomeStart)`.
- In a ternary, name the type in the first branch: `running ? LocalizedStringResource.Shared.sessionPause : .Shared.sessionResume`.
- Set the SwiftUI locale only through `Locale.bojiDisplay` in `BojiApp.swift`. SwiftUI looks up strings with the environment locale, so a fixed locale such as `zh_Hans_CN` keeps every `Text` in one language.
- `ImageRenderer` renders outside the app's view hierarchy and does not inherit its environment. Pass `.environment(\.locale, .bojiDisplay)` to the rendered view, as `MembershipSharingView` does. Format a date in a view with `.locale(locale)` from `@Environment(\.locale)`.
- `WorkoutLibrary` and `ClubArticle.all` resolve their text with `String(localized:)` from the `course`, `exercise` and `article` groups. iOS restarts the app when the user changes its language, so the static values stay correct. Show reps with `Reps.text`, never with a literal such as `8–10 次`.
- `BojiStore.defaultDisplayName` reads `.Shared.defaultDisplayName` on every access, so a new or reset state gets the name in the current language. Existing nicknames stay as the user saved them.
- Copy that only iOS shows stays in the String Catalogs of the targets. When Android starts to show the same copy, move it into `../locales/`.

### Copy that only iOS shows

- Each target has its own `Localizable.xcstrings`: `Boji/Resources/`, `BojiWidgets/` and `BojiWatch/`. `InfoPlist.xcstrings` in `Boji/Resources/` and `BojiWatch/` holds the display name and the usage descriptions. The display name is 薄肌 in Simplified Chinese and Lean Muscle in English.
- The key is the Simplified Chinese text in the Swift code. English is the fallback language: each `Info.plist` sets `CFBundleDevelopmentRegion` to `en`. A key without an English value shows the Chinese key to every user who does not read Chinese. Give each new key an English value with the state `translated`.
- Reuse the English of the Android resource that has the same Chinese text, so that both clients use the same words.
- `SWIFT_EMIT_LOC_STRINGS` in `project.yml` makes the compiler extract the literals of `Text`, `Button`, `LocalizedStringKey`, `LocalizedStringResource` and `String(localized:)`. The compiler does not extract a literal of the type `String`: a `String` property or parameter, a ternary of two `String` values, or the `value:` of `LabeledContent`. Wrap such a literal in `String(localized:)`.
- Do not nest a literal in an interpolation, such as `Text("训练\(done ? "已记录" : "待记录")")`. The compiler extracts only the outer string. Write one full sentence for each case, as `dayLabel` in `Views/ProgressView.swift` does.
- Format a list or a date inside the `Text` interpolation, for example `Text("来源：\(sources, format: .list(type: .and))")`. Do not join a list with `、`.
- A count needs English plural variations (`one` and `other`) in the catalog, for example `剩余 %lld 秒`. A plural variation must contain the number.
- Give VoiceOver the full word when the visible label is shortened. The accessory widgets show 训, 饮 and 眠, or T, W and S in English, and read `name`.
- Do not localize the test fixtures in the `#if DEBUG` part of `Models/MembershipAPI.swift`, in `Models/MembershipRPCFixtures.swift` or the `DecodingError` debug descriptions.
- Muscle names in `ExerciseAnimationCatalog` come from `../animations/` and are in Chinese only. They are not localized yet.

### Tests

- UI tests launch the app with `--uitesting`. This argument selects the in-memory store and the test membership service.
- Tests assert the Simplified Chinese copy. The `Boji` scheme runs tests with `language: zh-Hans` and `region: CN`, and UI tests also pass `-AppleLanguages (zh-Hans)`. Without them, a simulator in another language shows English.
- UI tests must not use the real backend, real HealthKit data or the user's records.
- Membership UI tests can add `--membership-fixture=long-number`, `suspended`, or `offline`. These fixtures require the Debug `--uitesting` entry point.
- Account deletion UI tests use the in-memory confirmation code `ci-delete-token`. The `delete-error` membership fixture rejects confirmation. Never use real accounts.
- Animation UI tests can add `--animation-reduce-motion` or `--animation-missing-asset`. These flags require Debug and `--uitesting`.
- Remote animation UI tests can add `--animation-remote-fixture=ok|offline`. This Debug-only flag requires `--uitesting` and uses the in-process fixture transport. Do not call the asset host from tests.
- To reveal an element in a `Form` or a `List`, drag a short distance and end the drag with a hold, as `scrollUp(_:)` in `BojiUITests/MembershipUITests.swift` does. Do not use `swipeUp()` there. In the large text layout a swipe can move a row out of the hierarchy, and a tap during the fling does not run the button action.
- iOS 26 exposes a SwiftUI `Link` as a button, and iOS 27 exposes it as a link. Find a `Link` by its accessibility identifier in `app.descendants(matching: .any)`, as `testSettingsLinkToLegalPages` in `BojiUITests/BojiUITests.swift` does. Do not query it with `app.buttons` or `app.links`, because CI runs iOS 27 and local simulators can run iOS 26.

### Accounts and data

- Read auth tokens only from the `set-auth-token` response header. Store them only in the Keychain. Do not put tokens in JSON exports.
- Account deletion uses the native `POST /api/auth/delete-user` email-code flow. Keep sending a code separate from confirming deletion.
- Bind pending deletion to the current account and session. Clear it on cancellation or identity changes, and never retry deletion automatically.
- Clear account credentials and membership caches only after confirmed deletion. Keep local fitness records separate, and never persist or log deletion codes.
- A Release build must use an HTTPS `BOJI_API_BASE_URL`. If the value is not set, keep online membership features disabled.
- Keep `BOJI_API_BASE_URL` empty in `project.yml`, so that Debug builds connect to `http://localhost:3000`. TestFlight builds read it from the `ios-testflight` environment variable through `ci/signing.py`. To test against the production service `https://api.leanmuscle.club`, pass `BOJI_API_BASE_URL=https://api.leanmuscle.club` to `xcodebuild` or change it locally. Do not commit the production URL.
- Show HealthKit samples in memory only. Do not save them, upload them or let them overwrite manual records.
- Widgets and the watch app show only today's check-in state. Do not share health samples or account data with them. Sharing is off by default.
- The About section of Settings links to the privacy policy and the terms of use on the website, as App Review guideline 5.1.1(i) requires. Build the URLs only with `LegalDocument` in `Boji/Models/LegalDocument.swift`. Chinese locales open the Chinese pages, and other locales open the English pages under `/en/`.

### Crash reporting

- `Boji/CrashReporting.swift` starts Sentry from `BojiApp.init()`. It reads `BojiSentryDSN` from Info.plist, which `project.yml` fills from the `BOJI_SENTRY_DSN` build setting. An empty or non-HTTPS value keeps the SDK stopped. `BOJI_SENTRY_DSN` stays empty in `project.yml`.
- The SDK never starts under XCTest or with `--uitesting`.
- Keep screenshots, the view hierarchy, network breadcrumbs, failed-request events and automatic performance instrumentation off. Network breadcrumbs and failed-request events carry URL query strings.
- Only the app target links Sentry. Widgets and the watch app do not report crashes yet.
- The Sentry SDK ships its own privacy manifest. Do not copy its collected data types into `Boji/Resources/PrivacyInfo.xcprivacy`.
- See `../docs/developers/sentry.mdx` for the data that a report holds and the App Store privacy answers.

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
- In the watch app, apply `.scenePadding(.horizontal)` to custom content in a `ScrollView`. Text then aligns with the navigation title and the status bar, and stays off the curved screen edges. `List` and `Button` get these margins from the system.
- In the watch app, center a short footnote at the end of a `ScrollView`, such as the sync time. The first screen can end on that line, and the rounded corners clip leading text there.
