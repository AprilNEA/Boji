plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.sentry)
}

// Crash reporting is off unless the build sets a Sentry DSN, for example in CI.
// The Gradle property boji.sentryDsn takes precedence over the SENTRY_DSN environment variable.
val sentryDsn: String = providers.gradleProperty("boji.sentryDsn")
    .orElse(providers.environmentVariable("SENTRY_DSN"))
    .getOrElse("")
    .trim()
require(sentryDsn.isEmpty() || Regex("https://[A-Za-z0-9._~:/@-]+").matches(sentryDsn)) {
    "The Sentry DSN must be an https URL without quotes or spaces."
}

android {
    namespace = "club.leanmuscle.boji"
    compileSdk = 37

    defaultConfig {
        // Same identifier as the iOS bundle ID. Change it only before the first store release.
        applicationId = "club.leanmuscle.boji"
        minSdk = 26
        targetSdk = 37
        versionCode = 1
        versionName = "0.1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // Read by core/diagnostics/CrashReporting.kt. An empty value keeps the Sentry SDK stopped.
        buildConfigField("String", "SENTRY_DSN", "\"$sentryDsn\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

// The Sentry Gradle plugin only uploads R8 mapping files, so that release stack traces are readable.
// The SDK version comes from libs.versions.toml. Bytecode instrumentation and build telemetry stay off.
sentry {
    org = providers.environmentVariable("SENTRY_ORG")
    projectName = providers.environmentVariable("SENTRY_PROJECT")
    authToken = providers.environmentVariable("SENTRY_AUTH_TOKEN")
    includeProguardMapping = true
    // Without a token, the build still embeds the mapping UUID but uploads nothing.
    autoUploadProguardMapping = providers.environmentVariable("SENTRY_AUTH_TOKEN").map { true }.orElse(false)
    uploadNativeSymbols = false
    includeSourceContext = false
    includeDependenciesReport = false
    telemetry = false
    ignoredBuildTypes = setOf("debug", "nonMinifiedRelease", "benchmarkRelease")
    autoInstallation {
        enabled = false
    }
    tracingInstrumentation {
        enabled = false
    }
}

dependencies {
    val composeBom = platform(libs.androidx.compose.bom)
    implementation(composeBom)
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material3.navigation.suite)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.viewmodel.navigation3)
    implementation(libs.androidx.navigation3.runtime)
    implementation(libs.androidx.navigation3.ui)
    implementation(libs.androidx.datastore.preferences)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.sentry.android.core)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)

    androidTestImplementation(composeBom)
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    androidTestImplementation(libs.androidx.test.ext.junit)
    androidTestImplementation(libs.androidx.test.runner)
}
