plugins {
    alias(libs.plugins.android.library)
}

android {
    namespace = "club.leanmuscle.boji.rpc"
    compileSdk = 37

    defaultConfig {
        minSdk = 26
        consumerProguardFiles("consumer-rules.pro")
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    sourceSets {
        getByName("main") {
            // `buf generate` in this directory writes these from the server
            // contract in ../../bizserver/proto. Do not edit them; see buf.gen.yaml.
            java.directories.add("generated/java")
            kotlin.directories.add("generated/kotlin")
        }
    }
}

dependencies {
    // The runtimes of the plugins in buf.gen.yaml. Keep their versions equal.
    api(libs.protobuf.javalite)
    api(libs.protobuf.kotlin.lite)
    api(platform(libs.okhttp.bom))
    api(libs.connect.kotlin.okhttp)
    api(libs.connect.kotlin.google.javalite.ext)
}
