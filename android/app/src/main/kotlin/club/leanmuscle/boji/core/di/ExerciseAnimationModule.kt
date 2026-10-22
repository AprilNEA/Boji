package club.leanmuscle.boji.core.di

import club.leanmuscle.boji.feature.training.CachedExerciseAnimations
import club.leanmuscle.boji.feature.training.ExerciseAnimationRepository
import club.leanmuscle.boji.feature.training.ExerciseAnimationTransport
import club.leanmuscle.boji.feature.training.OkHttpExerciseAnimationTransport
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/** Provides the public animation transport. UI tests replace this module with fixture transports. */
@Module
@InstallIn(SingletonComponent::class)
abstract class ExerciseAnimationModule {
    @Binds
    @Singleton
    abstract fun exerciseAnimationTransport(implementation: OkHttpExerciseAnimationTransport): ExerciseAnimationTransport
}

/** Binds the session cache view. UI tests keep this module and replace only [ExerciseAnimationModule]. */
@Module
@InstallIn(SingletonComponent::class)
abstract class CachedExerciseAnimationsModule {
    @Binds
    abstract fun cachedExerciseAnimations(implementation: ExerciseAnimationRepository): CachedExerciseAnimations
}
