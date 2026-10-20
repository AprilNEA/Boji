# ios/

This directory holds the native iOS app, its watchOS app and its widgets. The project uses SwiftUI and targets iOS 26. Read `README.md` for the features, the privacy rules and the verification records.

## Layout

| Path | Content |
| --- | --- |
| `project.yml` | XcodeGen spec. It generates `Boji.xcodeproj` |
| `Boji/Models/` | Local store, HTTP and auth clients, membership and health models |
| `Boji/Views/` | SwiftUI screens and the design system (`DesignSystem.swift`) |
| `Boji/Resources/` | Asset catalog and privacy manifest |
| `BojiWatch/` | watchOS app |
| `BojiWidgets/` | WidgetKit extension |
| `Shared/` | Code that the `Boji`, `BojiWidgets` and `BojiWatch` targets compile |
| `BojiTests/` | Unit tests |
| `BojiUITests/` | UI tests |
| `docs/` | Design notes, integration notes and verification records |
| `scripts/generate-app-icon.swift` | App icon generator |

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

# Regenerate the app icons.
swift scripts/generate-app-icon.swift
```

## Rules

### Project and build

- Edit `project.yml`, not `Boji.xcodeproj`. After each change to `project.yml`, run `xcodegen generate` and commit both files.
- Write build outputs to `../.work/boji-ios/`. Do not write DerivedData or other build outputs inside `ios/`.
- If a restricted terminal blocks Swift macro plugins with `sandbox_apply: Operation not permitted`, allow Xcode to run the plugins. Do not remove `@Observable` to hide the permission problem.

### Tests

- UI tests launch the app with `--uitesting`. This argument selects the in-memory store and the test membership service.
- UI tests must not use the real backend, real HealthKit data or the user's records.

### Accounts and data

- Read auth tokens only from the `set-auth-token` response header. Store them only in the Keychain. Do not put tokens in JSON exports.
- A Release build must use an HTTPS `BOJI_API_BASE_URL`. If the value is not set, keep online membership features disabled.
- Show HealthKit samples in memory only. Do not save them, upload them or let them overwrite manual records.
- Widgets and the watch app show only today's check-in state. Do not share health samples or account data with them. Sharing is off by default.

### Design

- Use Liquid Glass only for system tab bars, toolbars and interactive controls. Do not apply glass to content cards.
- Support dark mode and Dynamic Type on every screen.
