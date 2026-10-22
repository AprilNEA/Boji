pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode = RepositoriesMode.FAIL_ON_PROJECT_REPOS
    repositories {
        google()
        mavenCentral()
        // JitPack builds better-auth-kotlin-client from its GitHub tags. It serves only that group, and
        // that group comes only from JitPack.
        exclusiveContent {
            forRepository { maven("https://jitpack.io") }
            filter { includeGroup("com.github.better-auth-rs.better-auth-kotlin-client") }
        }
    }
}

rootProject.name = "Boji"
include(":app")
include(":baselineprofile")
include(":rpc")
include(":shared")
include(":wear")
