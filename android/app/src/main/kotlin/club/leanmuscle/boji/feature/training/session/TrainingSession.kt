package club.leanmuscle.boji.feature.training.session

import club.leanmuscle.boji.core.model.Exercise
import club.leanmuscle.boji.core.model.Workout

/** Rest after each set, in seconds. Same as iOS. */
const val REST_SECONDS = 30

/**
 * State of one training session. The transitions follow `TrainingSessionView` in
 * ios/Boji/Views/TrainingView.swift. A session starts running.
 */
data class TrainingSession(
    val workout: Workout,
    val index: Int = 0,
    val currentSet: Int = 1,
    val elapsedSeconds: Int = 0,
    val restRemaining: Int = 0,
    val running: Boolean = true,
    val finished: Boolean = false,
) {
    init {
        require(workout.exercises.isNotEmpty()) { "A workout needs at least one exercise." }
    }

    val exercise: Exercise get() = workout.exercises[index]

    val isResting: Boolean get() = restRemaining > 0

    val completedSets: Int
        get() = workout.exercises.take(index).sumOf { it.sets } + currentSet - 1

    /** One second passes. Nothing changes while paused or after the end. */
    fun tick(): TrainingSession =
        if (!running || finished) this else copy(elapsedSeconds = elapsedSeconds + 1, restRemaining = maxOf(0, restRemaining - 1))

    /** The primary button: skip the rest, or finish the current set. Ignored while paused. */
    fun primaryAction(): TrainingSession = when {
        !running || finished -> this
        isResting -> copy(restRemaining = 0)
        currentSet < exercise.sets -> copy(currentSet = currentSet + 1, restRemaining = REST_SECONDS)
        index < workout.exercises.lastIndex -> copy(index = index + 1, currentSet = 1, restRemaining = REST_SECONDS)
        else -> copy(currentSet = currentSet + 1, finished = true, running = false, restRemaining = 0)
    }

    fun withRunning(value: Boolean): TrainingSession = if (finished) this else copy(running = value)
}
