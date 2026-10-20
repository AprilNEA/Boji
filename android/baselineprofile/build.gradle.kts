plugins {
    alias(libs.plugins.android.test)
    alias(libs.plugins.baselineprofile)
}

android {
    namespace = "club.leanmuscle.boji.baselineprofile"
    compileSdk = 37

    defaultConfig {
        // Profile generation needs API 28 or higher. Devices without root need API 33 or higher.
        minSdk = 28
        targetSdk = 37
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    // The app module that the profile and the benchmarks are for.
    targetProjectPath = ":app"
}

// Uses connected devices or emulators, which is the plugin default. See android/AGENTS.md.
baselineProfile {
    useConnectedDevices = true
}

dependencies {
    implementation(libs.androidx.test.ext.junit)
    implementation(libs.androidx.test.runner)
    implementation(libs.androidx.test.uiautomator)
    implementation(libs.androidx.benchmark.macro.junit4)
}
