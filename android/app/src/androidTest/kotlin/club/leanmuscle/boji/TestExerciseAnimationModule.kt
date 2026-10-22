package club.leanmuscle.boji

import androidx.test.platform.app.InstrumentationRegistry
import club.leanmuscle.boji.core.di.ExerciseAnimationBaseUrl
import club.leanmuscle.boji.core.di.ExerciseAnimationModule
import club.leanmuscle.boji.feature.training.ExerciseAnimationHttpResponse
import club.leanmuscle.boji.feature.training.ExerciseAnimationTransport
import dagger.Module
import dagger.Provides
import dagger.hilt.components.SingletonComponent
import dagger.hilt.testing.TestInstallIn
import javax.inject.Singleton

/** Fixture modes for remote-course UI tests. They never call the real asset host. */
object TestExerciseAnimations {
    enum class Mode { Offline, Fixture }

    @Volatile
    var mode: Mode = Mode.Offline

    fun reset() {
        mode = Mode.Offline
    }

    fun response(url: String, ifNoneMatch: String?): ExerciseAnimationHttpResponse = when (mode) {
        Mode.Offline -> ExerciseAnimationHttpResponse(503)
        Mode.Fixture -> when {
            url.endsWith("/index.json") -> ExerciseAnimationHttpResponse(200, asset("index.json"), "fixture-v1")
            url.endsWith("/light/push-up.json") -> ExerciseAnimationHttpResponse(200, asset("light/push-up.json"))
            url.endsWith("/dark/push-up.json") -> ExerciseAnimationHttpResponse(200, asset("dark/push-up.json"))
            else -> ExerciseAnimationHttpResponse(404)
        }
    }

    private fun asset(path: String): ByteArray = InstrumentationRegistry.getInstrumentation().context.assets
        .open("remote-animations/$path").use { it.readBytes() }
}

@Module
@TestInstallIn(components = [SingletonComponent::class], replaces = [ExerciseAnimationModule::class])
object TestExerciseAnimationModule {
    @Provides
    @Singleton
    fun animationTransport(): ExerciseAnimationTransport = object : ExerciseAnimationTransport {
        override suspend fun get(url: String, ifNoneMatch: String?): ExerciseAnimationHttpResponse =
            TestExerciseAnimations.response(url, ifNoneMatch)
    }

    @Provides
    @ExerciseAnimationBaseUrl
    fun animationBaseUrl(): String = "https://fixture.invalid/animations/"
}
