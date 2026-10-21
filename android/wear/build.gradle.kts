// The Wear OS app: today's check-ins from the phone, like ios/BojiWatch. It reads what the phone app
// sends over the Data Layer and keeps the last snapshot on the watch. It has no training, no
// records of its own and no network access.
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "club.leanmuscle.boji.wear"
    compileSdk = 37

    defaultConfig {
        // The Data Layer delivers messages only between apps with the same application ID and
        // signing certificate, so this must equal the phone app's ID.
        applicationId = "club.leanmuscle.boji"
        // Wear OS 3. Older watches cannot install Wear Compose Material 3 apps from Play.
        minSdk = 30
        targetSdk = 37
        // Google Play needs a version code that no phone build uses. The scheme from
        // https://developer.android.com/training/wearables/packaging: target SDK (37),
        // product version (0.1.0 -> 010), release (00), watch build (01).
        versionCode = 370100001
        versionName = "0.1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(project(":shared"))
    val composeBom = platform(libs.androidx.compose.bom)
    implementation(composeBom)
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.wear.compose.material3)
    implementation(libs.androidx.wear.compose.foundation)
    implementation(libs.play.services.wearable)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.kotlinx.coroutines.play.services)

    debugImplementation(libs.androidx.compose.ui.test.manifest)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)

    androidTestImplementation(composeBom)
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    androidTestImplementation(libs.androidx.test.ext.junit)
    androidTestImplementation(libs.androidx.test.runner)
}
