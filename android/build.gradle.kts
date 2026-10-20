buildscript {
    repositories {
        mavenCentral()
    }
    dependencies {
        // AGP 9.4.1 ships built-in Kotlin with KGP 2.2.10. This pins the project Kotlin version.
        // The Compose compiler and serialization plugins must use the same version.
        classpath(libs.kotlin.gradle.plugin)
    }
}

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.android.library) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.kotlin.serialization) apply false
}
