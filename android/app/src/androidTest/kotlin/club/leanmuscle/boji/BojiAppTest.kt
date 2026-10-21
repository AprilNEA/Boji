package club.leanmuscle.boji

import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotSelected
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.ext.junit.runners.AndroidJUnit4
import club.leanmuscle.boji.core.data.Appearance
import club.leanmuscle.boji.core.data.AppearanceSettings
import club.leanmuscle.boji.core.data.BojiStore
import club.leanmuscle.boji.core.model.BojiSnapshot
import club.leanmuscle.boji.core.model.BojiState
import club.leanmuscle.boji.core.model.PlanKind
import club.leanmuscle.boji.core.model.WorkoutLibrary
import club.leanmuscle.boji.ui.navigation.BojiDestination
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import javax.inject.Inject
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/** Waits until the stored state matches, because writes finish on a background thread. */
private fun androidx.compose.ui.test.junit4.ComposeTestRule.awaitStore(
    store: BojiStore,
    predicate: (BojiSnapshot) -> Boolean,
): BojiSnapshot {
    waitUntil(timeoutMillis = 5_000) { store.snapshot.value?.let(predicate) == true }
    return checkNotNull(store.snapshot.value)
}

/** The app after onboarding, started through [MainActivity] with a new state.json for every test. */
@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class BojiAppTest {
    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val stateRule = StateFileRule(BojiState(hasOnboarded = true))

    @get:Rule(order = 2)
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Inject
    lateinit var store: BojiStore

    @Inject
    lateinit var appearance: AppearanceSettings

    @Before
    fun inject() {
        hiltRule.inject()
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag(BojiDestination.Today.screenTag).fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun startsOnTodayAndSwitchesEveryTab() {
        composeRule.onNodeWithTag(BojiDestination.Today.tabTag).assertIsSelected()
        composeRule.onNodeWithTag(BojiDestination.Today.screenTag).assertIsDisplayed()

        BojiDestination.entries.forEach { destination ->
            composeRule.onNodeWithTag(destination.tabTag).performClick().assertIsSelected()
            composeRule.onNodeWithTag(destination.screenTag).assertIsDisplayed()
        }
        composeRule.onNodeWithTag(BojiDestination.Today.tabTag).assertIsNotSelected()
    }

    @Test
    fun keepsSelectedTabAndDetailAfterRecreate() {
        composeRule.onNodeWithTag(BojiDestination.Training.tabTag).performClick()
        composeRule.onNodeWithTag("mobility_workout").performScrollTo().performClick()
        composeRule.onNodeWithTag("screen_WorkoutDetail").assertIsDisplayed()

        // A configuration change, such as rotation or a theme switch.
        composeRule.activityRule.scenario.recreate()

        composeRule.onNodeWithTag(BojiDestination.Training.tabTag).assertIsSelected()
        composeRule.onNodeWithTag("screen_WorkoutDetail").assertIsDisplayed()
    }

    @Test
    fun eachTabKeepsItsOwnBackStack() {
        composeRule.onNodeWithTag("recommended_workout").performScrollTo().performClick()
        composeRule.onNodeWithTag("screen_WorkoutDetail").assertIsDisplayed()

        composeRule.onNodeWithTag(BojiDestination.Club.tabTag).performClick()
        composeRule.onNodeWithTag(BojiDestination.Club.screenTag).assertIsDisplayed()
        composeRule.onNodeWithTag(BojiDestination.Today.tabTag).performClick()
        composeRule.onNodeWithTag("screen_WorkoutDetail").assertIsDisplayed()

        // Selecting the current tab again returns to its root.
        composeRule.onNodeWithTag(BojiDestination.Today.tabTag).performClick()
        composeRule.onNodeWithTag(BojiDestination.Today.screenTag).assertIsDisplayed()
    }

    @Test
    fun waterSheetSavesTheDefaultAmount() {
        composeRule.onNodeWithTag("habit_water").performScrollTo().performClick()
        composeRule.onNodeWithTag("sheet_save").performClick()
        composeRule.awaitStore(store) { it.todayRecord.waterML == 250 }
    }

    @Test
    fun finishingASessionRecordsTheWorkout() {
        val workout = WorkoutLibrary.Mobility
        composeRule.onNodeWithTag(BojiDestination.Training.tabTag).performClick()
        composeRule.onNodeWithTag("mobility_workout").performScrollTo().performClick()
        composeRule.onNodeWithTag("start_workout").performClick()
        composeRule.onNodeWithTag("screen_Session").assertIsDisplayed()

        repeat(workout.totalSets * 2 - 1) { composeRule.onNodeWithTag("session_primary").performClick() }

        composeRule.onNodeWithTag("session_finished").assertIsDisplayed()
        composeRule.awaitStore(store) { it.totalWorkouts == 1 }
        composeRule.onNodeWithTag("session_done").performClick()
        composeRule.onNodeWithTag("screen_WorkoutDetail").assertIsDisplayed()
        // Read the copy from resources: the device language decides between values/ and values-b+zh+Hans/.
        composeRule.onNodeWithText(composeRule.activity.getString(R.string.detail_again)).assertIsDisplayed()
    }

    @Test
    fun endingASessionEarlyRecordsNothing() {
        composeRule.onNodeWithTag("recommended_workout").performScrollTo().performClick()
        composeRule.onNodeWithTag("start_workout").performClick()
        composeRule.onNodeWithTag("session_primary").performClick()
        composeRule.onNodeWithTag("session_end").performClick()
        composeRule.onNodeWithTag("session_end_confirm").performClick()

        composeRule.onNodeWithTag("screen_WorkoutDetail").assertIsDisplayed()
        composeRule.waitForIdle()
        assertEquals(0, checkNotNull(store.snapshot.value).totalWorkouts)
    }

    @Test
    fun sessionPlaysTheExerciseAnimationInTheLightTheme() = assertSessionShowsAnimation(Appearance.Light)

    @Test
    fun sessionPlaysTheExerciseAnimationInTheDarkTheme() = assertSessionShowsAnimation(Appearance.Dark)

    private fun assertSessionShowsAnimation(mode: Appearance) {
        runBlocking { appearance.setAppearance(mode) }
        composeRule.onNodeWithTag("recommended_workout").performScrollTo().performClick()
        composeRule.onNodeWithTag("start_workout").performClick()

        // The composition loads from assets on a background thread.
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag("exercise_animation").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithTag("exercise_animation").assertIsDisplayed()
    }

    @Test
    fun localChallengeCanBeJoinedAndLeft() {
        composeRule.onNodeWithTag(BojiDestination.Club.tabTag).performClick()
        composeRule.onNodeWithTag("challenge_join").performScrollTo().performClick()
        composeRule.awaitStore(store) { it.state.joinedChallenge }
        composeRule.onNodeWithTag("challenge_leave").performScrollTo().performClick()
        composeRule.awaitStore(store) { !it.state.joinedChallenge }
    }

    @Test
    fun bodyEntriesShowTheTrendChart() {
        runBlocking {
            store.addBodyEntry(weight = 70.4, waist = 81.0)
            store.addBodyEntry(weight = 70.1, waist = 80.6)
        }
        composeRule.awaitStore(store) { it.bodyEntriesByDate.size == 2 }
        composeRule.onNodeWithTag(BojiDestination.Progress.tabTag).performClick()

        // The chart is one picture for TalkBack, described by the number of entries.
        val label = composeRule.activity.resources.getQuantityString(R.plurals.progress_chart_a11y, 2, 2)
        composeRule.onNodeWithTag("body_trend_chart")
            .performScrollTo()
            .assertIsDisplayed()
            .assert(hasContentDescription(label))
    }

    @Test
    fun deletingAllDataReturnsToWelcome() {
        runBlocking { store.setDisplayName("测试") }
        composeRule.onNodeWithTag("open_settings").performClick()
        composeRule.onNodeWithTag("settings_delete").performScrollTo().performClick()
        composeRule.onNodeWithTag("settings_delete_confirm").performClick()

        // Deleting clears the account files and then state.json on background threads.
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag("screen_Welcome").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithTag("screen_Welcome").assertIsDisplayed()
        // A new state takes its nickname from default_display_name, which depends on the app language.
        val newState = BojiState(displayName = composeRule.activity.getString(R.string.default_display_name))
        composeRule.awaitStore(store) { it.state == newState }
    }
}

/** First launch: no state.json, so the app shows onboarding. */
@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class WelcomeFlowTest {
    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val stateRule = StateFileRule(state = null)

    @get:Rule(order = 2)
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Inject
    lateinit var store: BojiStore

    @Before
    fun inject() = hiltRule.inject()

    @Test
    fun onboardingSavesThePlanAndOpensToday() {
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag("screen_Welcome").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithTag("plan_Gym").performScrollTo().performClick()
        composeRule.onNodeWithTag("welcome_start").performClick()

        composeRule.onNodeWithTag(BojiDestination.Today.screenTag).assertIsDisplayed()
        val snapshot = composeRule.awaitStore(store) { it.state.hasOnboarded }
        assertEquals(PlanKind.Gym, snapshot.state.selectedPlan)
        assertEquals("state.json now exists", true, TestFiles.stateFile.exists())
    }
}
