package club.leanmuscle.boji.feature.training

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import club.leanmuscle.boji.core.data.BojiStore
import club.leanmuscle.boji.core.model.BojiSnapshot
import club.leanmuscle.boji.core.model.PlanKind
import club.leanmuscle.boji.core.model.Workout
import club.leanmuscle.boji.core.model.WorkoutLibrary
import dagger.assisted.Assisted
import dagger.assisted.AssistedFactory
import dagger.assisted.AssistedInject
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class TrainingViewModel @Inject constructor(private val store: BojiStore) : ViewModel() {
    val snapshot: StateFlow<BojiSnapshot?> = store.snapshot

    fun setSelectedPlan(plan: PlanKind) {
        viewModelScope.launch { store.setSelectedPlan(plan) }
    }
}

/** One course. [workout] is null when the route names a course that no longer exists. */
@HiltViewModel(assistedFactory = WorkoutDetailViewModel.Factory::class)
class WorkoutDetailViewModel @AssistedInject constructor(
    @Assisted workoutId: String,
    store: BojiStore,
    private val animations: ExerciseAnimationRepository,
) : ViewModel() {
    val workout: Workout? = WorkoutLibrary.byId(workoutId)

    private val _animationPrefetch = MutableStateFlow<CourseAnimationPrefetchState?>(null)
    val animationPrefetch: StateFlow<CourseAnimationPrefetchState?> = _animationPrefetch

    val completedToday: StateFlow<Boolean> = store.snapshot
        .map { snapshot -> workout != null && snapshot?.isCompletedToday(workout) == true }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), false)

    init {
        workout?.let { course ->
            viewModelScope.launch {
                if (!animations.hasRemoteExercise(course.exercises.map { it.id })) return@launch
                _animationPrefetch.value = CourseAnimationPrefetchState.Downloading
                _animationPrefetch.value = when (animations.prefetch(course.exercises.map { it.id })) {
                    RemoteAnimationPrefetchResult.Complete -> null
                    RemoteAnimationPrefetchResult.Unavailable -> CourseAnimationPrefetchState.Unavailable
                }
            }
        }
    }

    @AssistedFactory
    interface Factory {
        fun create(workoutId: String): WorkoutDetailViewModel
    }
}

/** Status shown on a remote course detail while its exercise animations are prepared. */
enum class CourseAnimationPrefetchState { Downloading, Unavailable }
