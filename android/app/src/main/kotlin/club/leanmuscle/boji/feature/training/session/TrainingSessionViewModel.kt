package club.leanmuscle.boji.feature.training.session

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import club.leanmuscle.boji.core.data.BojiStore
import club.leanmuscle.boji.core.model.Workout
import club.leanmuscle.boji.feature.training.CachedRemoteAnimation
import club.leanmuscle.boji.feature.training.CachedExerciseAnimations
import dagger.assisted.Assisted
import dagger.assisted.AssistedFactory
import dagger.assisted.AssistedInject
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Runs one session. The timer restarts on resume, so the first tick after a pause comes one
 * full second later, as on iOS. The workout is recorded once, when the last set is done.
 */
@HiltViewModel(assistedFactory = TrainingSessionViewModel.Factory::class)
class TrainingSessionViewModel @AssistedInject constructor(
    @Assisted workout: Workout,
    private val store: BojiStore,
    private val animations: CachedExerciseAnimations,
) : ViewModel() {
    private val _session = MutableStateFlow(TrainingSession(workout))
    val session: StateFlow<TrainingSession> = _session.asStateFlow()
    val animationCacheVersion: StateFlow<Int> = animations.cacheVersion

    private var ticker: Job? = null

    init {
        startTicker()
    }

    fun primaryAction() {
        val before = _session.value
        val after = before.primaryAction()
        _session.value = after
        if (!before.finished && after.finished) {
            ticker?.cancel()
            // The store finishes the write in the application scope, even if the screen closes.
            viewModelScope.launch { store.completeWorkout(after.workout) }
        }
    }

    fun setRunning(running: Boolean) {
        _session.update { it.withRunning(running) }
        if (_session.value.running) startTicker() else ticker?.cancel()
    }

    fun cachedAnimation(exerciseId: String, dark: Boolean): CachedRemoteAnimation? =
        animations.cachedAnimation(exerciseId, dark)

    private fun startTicker() {
        ticker?.cancel()
        ticker = viewModelScope.launch {
            while (isActive) {
                delay(1_000)
                _session.update { it.tick() }
            }
        }
    }

    @AssistedFactory
    interface Factory {
        fun create(workout: Workout): TrainingSessionViewModel
    }
}
