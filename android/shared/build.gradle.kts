// Code that the phone app (:app) and the watch app (:wear) both use: the companion snapshot that
// the phone sends to the watch, and the Data Layer paths and capabilities. It has no UI and no
// Play services dependency, so its tests run on the JVM.
plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.serialization)
}

android {
    namespace = "club.leanmuscle.boji.shared"
    compileSdk = 37

    defaultConfig {
        minSdk = 26
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation(libs.kotlinx.serialization.json)

    testImplementation(libs.junit)
}
