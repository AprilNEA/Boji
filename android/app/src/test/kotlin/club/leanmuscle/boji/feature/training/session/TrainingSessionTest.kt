package club.leanmuscle.boji.feature.training.session

import club.leanmuscle.boji.core.data.TestStore
import club.leanmuscle.boji.core.model.WorkoutLibrary
import club.leanmuscle.boji.feature.training.CachedExerciseAnimations
import club.leanmuscle.boji.feature.training.CachedRemoteAnimation
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.rules.TemporaryFolder
import org.junit.Test

class TrainingSessionTest {
    private val workout = WorkoutLibrary.Mobility

    @Test
    fun startsRunningOnTheFirstSet() {
        val session = TrainingSession(workout)
        assertTrue(session.running)
        assertEquals(0, session.index)
        assertEquals(1, session.currentSet)
        assertEquals(0, session.completedSets)
        assertFalse(session.isResting)
    }

    @Test
    fun finishingASetStartsRestAndPrimarySkipsIt() {
        val resting = TrainingSession(workout).primaryAction()
        assertEquals(2, resting.currentSet)
        assertEquals(REST_SECONDS, resting.restRemaining)
        assertEquals(1, resting.completedSets)

        val skipped = resting.primaryAction()
        assertEquals(0, skipped.restRemaining)
        assertEquals(2, skipped.currentSet)
    }

    @Test
    fun lastSetOfAnExerciseMovesToTheNextExercise() {
        val next = TrainingSession(workout).primaryAction().primaryAction().primaryAction()
        assertEquals(1, next.index)
        assertEquals(1, next.currentSet)
        assertEquals(REST_SECONDS, next.restRemaining)
        assertEquals(2, next.completedSets)
    }

    @Test
    fun tickCountsTimeOnlyWhileRunning() {
        val resting = TrainingSession(workout).primaryAction()
        val ticked = resting.tick()
        assertEquals(1, ticked.elapsedSeconds)
        assertEquals(REST_SECONDS - 1, ticked.restRemaining)

        val paused = ticked.withRunning(false)
        assertEquals(paused, paused.tick())
        assertEquals(paused, paused.primaryAction())
    }

    @Test
    fun restNeverGoesBelowZero() {
        var session = TrainingSession(workout).primaryAction()
        repeat(REST_SECONDS + 5) { session = session.tick() }
        assertEquals(0, session.restRemaining)
        assertEquals(REST_SECONDS + 5, session.elapsedSeconds)
    }

    @Test
    fun completingEverySetFinishesTheSession() {
        var session = TrainingSession(workout)
        var presses = 0
        while (!session.finished) {
            session = session.primaryAction()
            presses++
        }
        // One press per set, plus one rest skip between sets.
        assertEquals(workout.totalSets * 2 - 1, presses)
        assertEquals(workout.totalSets, session.completedSets)
        assertFalse(session.running)
        assertEquals(session, session.tick())
        assertEquals(session, session.withRunning(true))
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
class TrainingSessionViewModelTest {
    private val dispatcher = StandardTestDispatcher()

    @get:Rule
    val temp = TemporaryFolder()

    @Before
    fun setMain() {
        Dispatchers.setMain(dispatcher)
    }

    @After
    fun resetMain() {
        Dispatchers.resetMain()
    }

    @Test
    fun timerTicksEverySecondAndStopsWhenPaused() = runTest(dispatcher) {
        val store = TestStore(temp.newFile("state.json").also { it.delete() }, backgroundScope).store
        val viewModel = TrainingSessionViewModel(WorkoutLibrary.Home, store, NoRemoteAnimations)
        advanceTimeBy(3_000)
        runCurrent()
        assertEquals(3, viewModel.session.value.elapsedSeconds)

        viewModel.setRunning(false)
        advanceTimeBy(5_000)
        runCurrent()
        assertEquals(3, viewModel.session.value.elapsedSeconds)

        viewModel.setRunning(true)
        advanceTimeBy(999)
        runCurrent()
        assertEquals("first tick after resume waits a full second", 3, viewModel.session.value.elapsedSeconds)
        advanceTimeBy(1)
        runCurrent()
        assertEquals(4, viewModel.session.value.elapsedSeconds)
        viewModel.setRunning(false)
    }

    @Test
    fun finishingRecordsTheWorkoutOnce() = runTest(dispatcher) {
        val store = TestStore(temp.newFile("state.json").also { it.delete() }, backgroundScope).store
        val workout = WorkoutLibrary.Mobility
        val viewModel = TrainingSessionViewModel(workout, store, NoRemoteAnimations)
        while (!viewModel.session.value.finished) viewModel.primaryAction()
        viewModel.primaryAction()
        runCurrent()

        val snapshot = checkNotNull(store.snapshot.value)
        assertEquals(1, snapshot.totalWorkouts)
        assertEquals(workout.minutes, snapshot.todayRecord.minutes)
    }
}

/** The session tests need no remote animation. */
private object NoRemoteAnimations : CachedExerciseAnimations {
    override val cacheVersion: StateFlow<Int> = MutableStateFlow(0)

    override fun cachedAnimation(exerciseId: String, dark: Boolean): CachedRemoteAnimation? = null
}
