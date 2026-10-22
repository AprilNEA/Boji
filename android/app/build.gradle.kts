plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt)
    alias(libs.plugins.baselineprofile)
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

// The member service (bizserver). The Gradle property boji.apiBaseUrl takes precedence over the
// BOJI_API_BASE_URL environment variable. Without a value, debug builds use the bizserver on the
// host computer, which an emulator reaches at 10.0.2.2, and release builds stay offline.
// core/network/ServerEndpoint.kt validates the value again at runtime: release builds accept https only.
val apiBaseUrl: String = providers.gradleProperty("boji.apiBaseUrl")
    .orElse(providers.environmentVariable("BOJI_API_BASE_URL"))
    .getOrElse("")
    .trim()
require(apiBaseUrl.isEmpty() || Regex("https?://[A-Za-z0-9._~:/\\[\\]-]+").matches(apiBaseUrl)) {
    "The member service URL must be an http or https URL without quotes, spaces or a query."
}
val debugApiBaseUrl = apiBaseUrl.ifEmpty { "http://10.0.2.2:3000" }

// Sign in with Google: the Web client ID of the Google Cloud project that bizserver trusts
// (GOOGLE_CLIENT_ID there). The Gradle property boji.googleServerClientId takes precedence over the
// BOJI_GOOGLE_SERVER_CLIENT_ID environment variable. Without a value, the app hides Google sign-in.
// Keep real values out of the repository: pass them on the command line or in ~/.gradle/gradle.properties.
val googleServerClientId: String = providers.gradleProperty("boji.googleServerClientId")
    .orElse(providers.environmentVariable("BOJI_GOOGLE_SERVER_CLIENT_ID"))
    .getOrElse("")
    .trim()
require(googleServerClientId.isEmpty() || Regex("[0-9]+-[a-z0-9]+\\.apps\\.googleusercontent\\.com").matches(googleServerClientId)) {
    "The Google server client ID must look like 123-abc.apps.googleusercontent.com."
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

        // Starts HiltTestApplication, so UI tests can replace the data modules.
        testInstrumentationRunner = "club.leanmuscle.boji.HiltTestRunner"

        // Read by core/diagnostics/CrashReporting.kt. An empty value keeps the Sentry SDK stopped.
        buildConfigField("String", "SENTRY_DSN", "\"$sentryDsn\"")
        // Read by core/di/NetworkModule.kt. An empty value hides Sign in with Google.
        buildConfigField("String", "GOOGLE_SERVER_CLIENT_ID", "\"$googleServerClientId\"")
    }

    buildTypes {
        debug {
            buildConfigField("String", "BOJI_API_BASE_URL", "\"$debugApiBaseUrl\"")
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            // The Baseline Profile build types (benchmarkRelease, nonMinifiedRelease) copy this value.
            buildConfigField("String", "BOJI_API_BASE_URL", "\"$apiBaseUrl\"")
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

    sourceSets {
        getByName("main") {
            // Exercise animations come from the shared animations/ directory. Do not copy them.
            // Asset paths are <light|dark>/<exercise ID>.json, as in animations/lottie/index.json.
            assets.directories.add(rootProject.file("../animations/lottie").path)
        }
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
    implementation(libs.androidx.datastore)
    implementation(libs.androidx.datastore.preferences)
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.androidx.hilt.lifecycle.viewmodel.compose)
    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.lottie.compose)
    implementation(libs.vico.compose)
    implementation(libs.vico.compose.m3)
    // Reads weight and sleep from Health Connect. Read-only, like the iOS HealthKit integration.
    implementation(libs.androidx.health.connect.client)
    // The home screen widget, like the iOS WidgetKit widget. Glance has its own composables.
    implementation(libs.androidx.glance.appwidget)
    implementation(libs.androidx.glance.material3)
    // Glance runs its sessions with WorkManager. This raises the 2.7.1 that Glance asks for.
    implementation(libs.androidx.work.runtime)
    // Sends today's check-ins to the Wear OS app over the Data Layer. :shared holds the snapshot format.
    implementation(project(":shared"))
    implementation(libs.play.services.wearable)
    implementation(libs.kotlinx.coroutines.play.services)
    implementation(libs.sentry.android.core)
    // The boji.v1 messages and Connect clients, generated by buf from bizserver/proto.
    implementation(project(":rpc"))
    implementation(platform(libs.okhttp.bom))
    implementation(libs.okhttp)
    // Better Auth (/api/auth/*) is a JSON API outside the proto contract.
    implementation(libs.retrofit)
    implementation(libs.retrofit.converter.kotlinx.serialization)
    // Saves and offers the email password. play-services-auth backs it on Android 13 and lower.
    implementation(libs.androidx.credentials)
    implementation(libs.androidx.credentials.play.services.auth)
    implementation(libs.google.identity.googleid)
    // Installs the generated Baseline Profile on devices without Play, for example sideloaded builds.
    implementation(libs.androidx.profileinstaller)
    baselineProfile(project(":baselineprofile"))
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(platform(libs.okhttp.bom))
    testImplementation(libs.okhttp.mockwebserver3)

    androidTestImplementation(composeBom)
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    androidTestImplementation(libs.androidx.test.ext.junit)
    androidTestImplementation(libs.androidx.test.runner)
    androidTestImplementation(libs.hilt.android.testing)
    // Renders the Glance widget content without a launcher and checks its text and actions.
    androidTestImplementation(libs.androidx.glance.appwidget.testing)
    // The member center UI test runs a fake member service on the device's 127.0.0.1.
    androidTestImplementation(platform(libs.okhttp.bom))
    androidTestImplementation(libs.okhttp.mockwebserver3)
    kspAndroidTest(libs.hilt.compiler)
}
