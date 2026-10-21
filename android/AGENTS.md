# android/

This directory holds the native Android app and its Wear OS app. Both use Kotlin and Jetpack Compose with Material 3. This directory is a separate Gradle project; the repository root is not a Gradle project. Read `README.md` for the features, the code structure, the iOS mapping and the verification records.

The Gradle modules are `:app` (the phone app), `:wear` (the Wear OS app), `:shared` (code that both apps use), `:rpc` (the generated API client) and `:baselineprofile` (the Baseline Profile of `:app`).

## Setup

- Use JDK 17 or later, Android SDK Platform 37 and Build Tools 36.0.0 or later.
- For command-line builds, use the devenv shell from the repository root. It provides JDK 17 and sets `JAVA_HOME`. It does not provide the Android SDK.
- Create `local.properties` with `sdk.dir`. Do not commit this file.
- Use the Gradle wrapper (`./gradlew`). Do not install or call a system Gradle.
- In Android Studio, open `android/`, not the repository root.

## Commands

Run these commands in `android/`.

```sh
# Build, run the unit tests and run Lint.
./gradlew assembleDebug testDebugUnitTest lintDebug

# Run the Compose UI tests of the phone app on a phone or a phone emulator, and the tests of the
# watch app on a Wear OS emulator or watch. Set ANDROID_SERIAL when both are connected, because
# connectedDebugAndroidTest runs on every connected device.
ANDROID_SERIAL=<phone> ./gradlew :app:connectedDebugAndroidTest
ANDROID_SERIAL=<watch> ./gradlew :wear:connectedDebugAndroidTest

# Regenerate the Baseline Profile on a connected emulator or device (API 28 or later), then commit
# app/src/release/generated/baselineProfiles/.
./gradlew :app:generateBaselineProfile

# Point a build at a member service. Without a value, debug builds use http://10.0.2.2:3000 and
# release builds stay offline.
./gradlew assembleRelease -Pboji.apiBaseUrl=https://api.example.com

# Regenerate the API client code after a change to ../bizserver/proto/boji/v1/.
(cd rpc && buf generate)
```

Crash reporting is off unless the build sets a Sentry DSN with `-Pboji.sentryDsn=https://...` or the `SENTRY_DSN` environment variable. See `../docs/developers/sentry.mdx`.

## Rules

### Build

- Declare every dependency and plugin version in `gradle/libs.versions.toml`.
- AGP provides built-in Kotlin. Do not apply the `org.jetbrains.kotlin.android` plugin.
- To upgrade Kotlin, change only the `kotlin` version in `gradle/libs.versions.toml`. The Kotlin Gradle plugin in the root `build.gradle.kts` and the Compose compiler plugin use that version.
- `app/build.gradle.kts` adds `../animations/lottie` as a `main` assets directory. That directory holds only course exercises. Do not package `../animations/lottie-library`. Do not copy animation files into `app/src/`, and do not edit files in `../animations/`. Asset paths are `<light|dark>/<exercise ID>.json`. Load the JSON files directly. Do not convert them to `.lottie`.
- `ExerciseAnimationIndex` reads `index.json` from the assets and ignores unknown fields. When system animations are off, show the `posterFrame` of the exercise, not frame 0.
- `ExerciseAnimationAssetsTest` reads `../animations/lottie/index.json`. It fails when the index and the course exercises differ, when a `course` value does not contain the exercise, when `posterFrame` is outside `[0, frames)`, or when a light or dark file is missing.

### API client

- `rpc/` is an Android library with the Java lite messages, the Kotlin builders and the Connect clients of the `boji.v1` API. `app` uses it through `core/network/MembershipClient.kt` only.
- `buf generate` in `rpc/` writes `rpc/generated/` from `../bizserver/proto/boji/v1/`. Do not edit `rpc/generated/`. Commit it in the same change as the proto change. `buf` comes from the devenv shell, and the first run needs network access to the BSR.
- The Gradle build compiles `rpc/generated/` as source. It does not run `protoc` or `buf`. Do not add the protobuf Gradle plugin.
- Keep the plugin versions in `rpc/buf.gen.yaml` equal to the runtimes in `gradle/libs.versions.toml`: `protocolbuffers/java` and `protocolbuffers/kotlin` at the protoc release of `protobuf` (v36.2 for 4.36.2), and `connectrpc/kotlin` equal to `connectKotlin`. Follow "API contract" in the root `AGENTS.md`.
- Keep the `GeneratedMessageLite` field rule in `rpc/consumer-rules.pro`. The lite runtime reads fields by name, and `protobuf-javalite` ships no R8 rules. After a change to R8 rules or `protobuf`, run `:app:assembleRelease` and check that no `club.leanmuscle.boji.v1` field ending in `_` is renamed in `app/build/outputs/mapping/release/mapping.txt`.

### Architecture

- Hilt provides the dependencies. `BojiApplication` is `@HiltAndroidApp` and `MainActivity` is `@AndroidEntryPoint`. Put modules in `core/di/`. Run the Hilt compiler with KSP. Do not add kapt.
- Each screen has a `@HiltViewModel`. A screen has a stateless overload, which takes the state and the callbacks, and a stateful overload, which gets its ViewModel with `hiltViewModel()`. Do not pass `BojiStore` or a repository to a composable.
- `BojiApp` gives every Navigation 3 entry `rememberSaveableStateHolderNavEntryDecorator()` and `rememberViewModelStoreNavEntryDecorator()`, so a ViewModel lives as long as its back stack entry. `TrainingSessionViewModel` gets its workout with assisted injection.
- A ViewModel exposes `StateFlow`. Composables collect it with `collectAsStateWithLifecycle()`.

### Data

- `state.json` in `filesDir` is a JSON DataStore with `BojiStateSerializer`. Keep the format of the iOS `state.json`: the same field names, sorted keys and ISO 8601 dates. `BojiStore` is the only writer.
- `BojiStore` runs writes in the `@ApplicationScope` coroutine scope, so a closed screen does not cancel a save.
- When `state.json` cannot be decoded, `BojiStore` shows `StorageError.ReadFailed` and does not overwrite the file. Do not replace it with an empty state.
- The appearance setting is a Preferences DataStore in `AppearanceSettings`.
- `allowBackup` is `false`, and `data_extraction_rules.xml` excludes every domain. Keep both, because the account files below must not leave the device.

### Network and account

- `BuildConfig.BOJI_API_BASE_URL` is the member service. `ServerEndpoint` validates it again at runtime: https only, and http only for `localhost`, `127.0.0.1`, `::1` and `10.0.2.2` in debug builds. An empty or rejected value means "not configured": the member center shows an offline notice and makes no request.
- `src/main/res/xml/network_security_config.xml` forbids cleartext traffic. Only the debug copy allows it, for the same hosts.
- `NetworkModule` provides the only `OkHttpClient`. Redirects are off. Better Auth (`/api/auth/` endpoints) is a JSON API outside the proto contract: call it through `BetterAuthApi` with Retrofit and the kotlinx.serialization converter. Call `boji.v1` services through the generated Connect clients. Do not hand-write RPC request or response types.
- `AuthSessionStore` and `MembershipCacheStore` are DataStore files encrypted by `EncryptedJsonSerializer`. `KeystoreCipher` uses an AES-256-GCM key in the Android Keystore and passes the file purpose as associated data. When a file cannot be decrypted, for example after the key is lost, treat the account as signed out. Do not crash and do not log the file content.
- `MembershipRepository` holds the account rules of `../ios/Boji/Models/MembershipStore.swift`. Map a server error by its `ErrorInfo.reason` first, then by the Connect code. Treat membership numbers as opaque strings, as the root `AGENTS.md` requires.
- `PasswordCredentials` saves and offers the email password with Credential Manager. `res/values/asset_statements.xml` includes `https://leanmuscle.club/.well-known/assetlinks.json`, and `AndroidManifest.xml` declares it as the `asset_statements` meta-data. `AssetStatementsTest` checks both. The site file is not published yet; `README.md` holds its content. Put only the SHA-256 of the Play App Signing certificate in it, never a debug fingerprint. Do not add `handle_all_urls` while the app handles no web links.
- Deleting all local data in Settings also turns off check-in sharing, clears the session and the cached member card, and disconnects Health Connect. It does not delete the account or the membership on the server, and it does not touch records or permissions in Health Connect.
- UI tests replace `DataFileModule`, `AccountFileModule` and `NetworkModule` with `@TestInstallIn` modules in `src/androidTest/`. Each test uses a new directory, and the member service is `null` unless a test starts `FakeMemberServerRule`.

### Health Connect

- `core/health/` holds the rules of `../ios/Boji/Models/HealthDataStore.swift`. `HealthConnectDataProvider` is the only class that calls the Health Connect client. `HealthRepository` owns the state; screens reach it through `HealthViewModel`.
- Read only weight (`READ_WEIGHT`) and sleep (`READ_SLEEP`), for the last 30 days, while the app is open. Health Connect has no waist record type; do not map waist to another type. Do not add write, background or history permissions without updating `README.md` and the Play Console health declaration.
- `HealthPermissions` in `HealthDataProvider.kt` and the `uses-permission` entries in `AndroidManifest.xml` list the same permissions. `HealthManifestTest` checks both against the library.
- Request permissions only from a user tap on the Health page. `BojiApp` calls `refreshHealth()` on every resume and the Health page refreshes when it opens; both do nothing while disconnected.
- Keep health samples in memory only. Do not write them to `state.json`, the export file, Sentry or the member service. Only the connected flag is stored, in the settings Preferences DataStore.
- A failed read clears the samples and the last check time. A disconnect drops a read that is still running. Missing values show "no data", never zero.
- `HealthPermissionsRationaleActivity` is the privacy screen that Health Connect requires. Keep its `ACTION_SHOW_PERMISSIONS_RATIONALE` filter and the `ViewPermissionUsageActivity` alias with `START_VIEW_PERMISSION_USAGE`; without them Health Connect shows no permission dialog. Keep the Health Connect package in `<queries>`, which Android 11 to 13 need for `getSdkStatus`.
- UI tests replace `HealthProviderModule` with `TestHealthModule`. Its permission contract answers synchronously, so tests never open Health Connect or read real health data.

### Widget

- `feature/widget/` holds the home screen widget, the counterpart of `../ios/BojiWidgets/BojiDailyWidget.swift`. Build it with Glance (`glance-appwidget` and `glance-material3`, one `glance` version). Use only `androidx.glance` composables in it; Compose UI and Material 3 components do not work in a widget.
- The widget shows only whether today's workout, water and sleep are logged (`DailyStatus`). Do not show amounts, body or Health Connect data, the plan, the account or the member card.
- Sharing is off by default. `CompanionSettings` stores the switch as `companionSharingEnabled` in the settings Preferences DataStore. While it is off, `DailyWidgetState.of` returns `Disabled` before it looks at the records.
- The widget runs in the app process and reads `BojiStore` through `DailyWidgetEntryPoint`. Do not add a snapshot file for it. `DailyWidgetSync`, started in `BojiApplication`, calls `updateAll` when the widget state changes. `DailyWidgetReceiver` redraws after local midnight with an inexact `RTC` alarm and after time, time zone and language changes. Keep `updatePeriodMillis` at 0 and do not request exact alarms.
- Glance runs its sessions with WorkManager and asks only for `work-runtime` 2.7.1. `work` in `gradle/libs.versions.toml` pins a current stable release; keep it when you upgrade Glance, and remove it only if Glance asks for a newer version itself.
- `DailyWidget` uses `SizeMode.Exact`, so `LocalSize` is the real size. Keep the generated preview (`providePreview`) on sample data, never on the user's records.
- Keep `DailyWidgetReceiver` unexported. Widget clicks start `MainActivity` with an explicit intent, a `boji://<tab>` URI and `CLEAR_TOP` plus `SINGLE_TOP`. `CompanionRoute.parse` keeps the iOS rules; do not register the `boji` scheme in the manifest. A route only selects a tab.
- `CompanionTest` covers the state rules, the midnight time and the route parser. `DailyWidgetContentTest` renders the widget with `glance-appwidget-testing` and checks the text, the descriptions and the click actions. `CompanionSharingTest` covers the switch, deletion and the routes. Update them with the widget.

### Watch

- `:wear` is the Wear OS app, the counterpart of `../ios/BojiWatch/`. It shows only what the phone shares: today's three check-ins, the plan title and the sync time. Do not add records, training, accounts or network access to it.
- `:shared` holds `CompanionSnapshot`, the contract of `../ios/Shared/CompanionSnapshot.swift`, and `CompanionDataLayer`, the paths and capability names. Keep the iOS JSON format: the same field names, ISO 8601 UTC times with milliseconds, `schemaVersion` 1, at most 16 KiB and a plan title of at most 40 characters. Put only code that both apps use in `:shared`, with no UI and no Play services dependency.
- The Data Layer connects only apps with the same application ID and signing certificate. Keep `applicationId` of `:wear` equal to `:app`, and sign both with the same key. Keep the `versionCode` of `:wear` different from every phone build, as `wear/build.gradle.kts` explains.
- Send snapshots with `MessageClient` only. Do not use `DataClient`, data items or assets: the snapshot must not be stored outside the two apps. A message is lost when the watch is away, so the watch asks for the snapshot (`REQUEST_PATH`) when it opens and when the phone becomes reachable.
- The capability names in `res/values/wear.xml` of `:app` (`boji_phone_app`) and `:wear` (`boji_watch_app`) must equal `CompanionDataLayer`. The listener services filter the exact paths. Keep `CompanionWearService` and `SnapshotListenerService` on `WearableListenerService`, which accepts calls from Google Play services only.
- `WearCompanionSync`, started in `BojiApplication`, sends a snapshot when sharing or a check-in changes and when a watch connects. While sharing is off it sends only `CompanionSnapshot.disabled`, so the watch deletes its data. While `state.json` cannot be read, it keeps the last snapshot. Each snapshot is newer than the last one, even when the clock goes back.
- The watch keeps only the newest valid snapshot, in `noBackupFilesDir`. It shows the check-ins only while `isCurrent` is true for the watch's time zone. Keep the watch app `standalone=false` and without backup.
- UI tests replace `WatchLinkModule` with `TestWatchLinkModule`, so phone tests never use the real Data Layer. `CompanionSnapshotTest`, `WearCompanionSyncTest` and `WatchCompanionRepositoryTest` are JVM tests. `WatchScreenTest` needs a Wear OS emulator or watch.
- The watch copy is in `wear/src/main/res/values*/strings.xml`. iOS shows the same copy, so it belongs in `../locales/`, but `../crates/locales/` does not generate files for `:wear` yet. Add each key in English and Simplified Chinese.

### Performance

- `:baselineprofile` is a `com.android.test` module that generates the Baseline Profile and runs `StartupBenchmark`. `BojiJourneys` covers startup, onboarding, the tabs and the start of a session. When a journey changes, update `BojiJourneys` and regenerate the profile.
- `MainActivity` exposes test tags as resource IDs for UiAutomator. `BojiApp` calls `ReportDrawnWhen` after `state.json` loads. Keep both, because the startup benchmark depends on them.

### Crash reporting

- `core/diagnostics/CrashReporting.kt` starts Sentry in `BojiApplication.onCreate()` before `super.onCreate()`. It reads `BuildConfig.SENTRY_DSN` and returns when the value is empty.
- `AndroidManifest.xml` removes `SentryInitProvider` and `SentryPerformanceProvider`. Keep both removals, because the providers start the SDK without a DSN check.
- Configure data collection in `CrashReporting.kt` only. Keep user info, cookies, headers, bodies, query strings, database query data, file paths, screenshots and the view hierarchy off.
- The Sentry Gradle plugin only adds the R8 mapping UUID and uploads the mapping when `SENTRY_AUTH_TOKEN` is set. Keep auto-installation, tracing instrumentation, source context, the dependencies report and plugin telemetry off.
- `sentry` and `sentryGradlePlugin` in `gradle/libs.versions.toml` belong together. Upgrade them in the same change.

### Strings

- `app/src/main/res/values*/strings_shared.xml` is generated from `../locales/` by `../crates/locales/`. Do not edit it. To change copy that iOS also shows, edit `../locales/` and run `cargo locales generate` in `../crates/`.
- English is the fallback language. `app/src/main/res/values/strings.xml` holds the English copy that only Android shows, and `values-b+zh+Hans/strings.xml` holds the same keys in Simplified Chinese. Other hand-written files, such as `strings_membership.xml`, follow the same pattern. Add each new key to both directories: Lint reports a missing language as a `MissingTranslation` error, and `lintDebug` fails.
- Do not add a key to a hand-written file that `strings_shared.xml` already defines; the build fails on duplicate resources.
- A count in English copy needs a `<plurals>` resource, even though Chinese has one form. Read it with `pluralStringResource`.
- Pass format arguments in the order of `args` in `../locales/meta/`. A key with a plural argument is a `<plurals>` resource: read it with `pluralStringResource(id, count, ...)`.
- Format dates and numbers in the language of the text. `textLocale` in `ui/components/ModelUi.kt` reads the generated `R.string.locale_tag`. Use the functions there, such as `formatMediumDate` and `formatOneDecimal`, or pass `textLocale` to `String.format`. Do not write a date pattern such as `y年M月d日`, and do not pass a fixed `Locale`. To add a date format, use a CLDR skeleton with `formatSkeleton`.
- `stringResource(id, args)` formats its numeric arguments with the device language, not with `textLocale`. The digits differ only when the device language has no translation and uses non-Latin digits.
- Do not write a number that the code knows into copy. Pass it as an argument, for example `today_rhythm_total` with `BojiSnapshot.TODAY_TASK_TOTAL`.
- Course, exercise and article models hold `@StringRes` IDs, not text. Resolve them in the UI with `stringResource`. Do not resolve them in a model or a ViewModel: Android can change the app language without a new process, and a resolved string keeps the old language.
- The format arguments of `stringResource(id, args)` have the type `Any`, so a resource ID, an enum or a model object compiles and shows the wrong text. Pass only strings and numbers. Resolve a resource ID with `stringResource` first, a level with `CourseLevel.titleRes`, reps with `repsText` and an article subtitle with `articleMeta`.
- `default_display_name` is the nickname of a new state. `DataModule` passes it to `BojiStateSerializer` and `BojiStore`. `BojiState.DEFAULT_DISPLAY_NAME` is only the value for a state.json without `displayName`.

### Design

- Follow Material 3. Do not imitate the iOS Liquid Glass material.
- Keep the fixed brand color. Do not enable dynamic color.
- The color scheme in `app/src/main/kotlin/club/leanmuscle/boji/ui/theme/Color.kt` is generated from the seed `#C7401F` with `@material/material-color-utilities`. To change the brand color, regenerate the full scheme. Do not edit single color roles.
- Keep `app/src/main/res/drawable/ic_launcher_foreground.xml` aligned with `../ios/Boji/Resources/AppIcon.icon/Assets/mark.svg`. Use the same foreground for themed icons.
- Do not lock the screen orientation. With target SDK 37, layouts must support landscape and large screens.
- Play an exercise animation only in the current exercise card of a session. Lists keep icons, so a screen plays at most one animation. Choose the palette with `BojiThemeColors.isDark`, not `isSystemInDarkTheme()`.
- A session pauses when the app leaves the foreground. A configuration change (rotation, light or dark mode) also sends `ON_PAUSE`, so check `isChangingConfigurations` before pausing.
- Draw charts with Vico (`vico-compose` and `vico-compose-m3`, one `vico` version). Do not draw charts with `Canvas`. Take the colors from `MaterialTheme` through `rememberM3VicoTheme`.
- `feature/progress/BodyTrend.kt` computes the body trend data without Compose, and `BodyTrendTest` covers it. The x values are epoch days in `BojiSnapshot.zone`, one point per day (the last entry of the day). The y range does not start at zero, as on iOS. `BodyTrendChart.kt` only maps that data to Vico. The chart does not scroll or zoom, and TalkBack reads it as one node with `progress_chart_a11y`.

### Parity with iOS

- When you port an iOS feature, keep the iOS data rules. Record each intentional difference in `README.md`.
- An emulator reaches a backend on the host at `http://10.0.2.2:3000`, not at `localhost`.
