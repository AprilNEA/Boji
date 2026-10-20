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
```

## Rules

### Build

- Declare every dependency and plugin version in `gradle/libs.versions.toml`.
- AGP provides built-in Kotlin. Do not apply the `org.jetbrains.kotlin.android` plugin.
- To upgrade Kotlin, change only the `kotlin` version in `gradle/libs.versions.toml`. The Kotlin Gradle plugin in the root `build.gradle.kts` and the Compose compiler plugin use that version.

### Design

- Follow Material 3. Do not imitate the iOS Liquid Glass material.
- Keep the fixed brand color. Do not enable dynamic color.
- The color scheme in `app/src/main/kotlin/club/leanmuscle/boji/ui/theme/Color.kt` is generated from the seed `#C7401F` with `@material/material-color-utilities`. To change the brand color, regenerate the full scheme. Do not edit single color roles.
- Do not lock the screen orientation. With target SDK 37, layouts must support landscape and large screens.

### Parity with iOS

- When you port an iOS feature, keep the iOS data rules. Record each intentional difference in `README.md`.
- An emulator reaches a backend on the host at `http://10.0.2.2:3000`, not at `localhost`.
