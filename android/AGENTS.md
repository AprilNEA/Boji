# android/

This directory holds the native Android app. The app uses Kotlin and Jetpack Compose with Material 3. This directory is a separate Gradle project; the repository root is not a Gradle project. Read `README.md` for the features, the code structure, the iOS mapping and the verification records.

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

# Run the Compose UI tests. A device or an emulator must be connected.
./gradlew connectedDebugAndroidTest

# Regenerate the API client code after a change to ../bizserver/proto/boji/v1/.
(cd rpc && buf generate)
```

Crash reporting is off unless the build sets a Sentry DSN with `-Pboji.sentryDsn=https://...` or the `SENTRY_DSN` environment variable. See `../docs/sentry.md`.

## Rules

### Build

- Declare every dependency and plugin version in `gradle/libs.versions.toml`.
- AGP provides built-in Kotlin. Do not apply the `org.jetbrains.kotlin.android` plugin.
- To upgrade Kotlin, change only the `kotlin` version in `gradle/libs.versions.toml`. The Kotlin Gradle plugin in the root `build.gradle.kts` and the Compose compiler plugin use that version.

### API client

- `rpc/` is an Android library with the Java lite messages, the Kotlin builders and the Connect clients of the `boji.v1` API. No app module depends on it yet.
- `buf generate` in `rpc/` writes `rpc/generated/` from `../bizserver/proto/boji/v1/`. Do not edit `rpc/generated/`. Commit it in the same change as the proto change. `buf` comes from the devenv shell, and the first run needs network access to the BSR.
- The Gradle build compiles `rpc/generated/` as source. It does not run `protoc` or `buf`. Do not add the protobuf Gradle plugin.
- Keep the plugin versions in `rpc/buf.gen.yaml` equal to the runtimes in `gradle/libs.versions.toml`: `protocolbuffers/java` and `protocolbuffers/kotlin` at the protoc release of `protobuf` (v36.2 for 4.36.2), and `connectrpc/kotlin` equal to `connectKotlin`. Follow "API contract" in the root `AGENTS.md`.

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

### Parity with iOS

- When you port an iOS feature, keep the iOS data rules. Record each intentional difference in `README.md`.
- An emulator reaches a backend on the host at `http://10.0.2.2:3000`, not at `localhost`.
