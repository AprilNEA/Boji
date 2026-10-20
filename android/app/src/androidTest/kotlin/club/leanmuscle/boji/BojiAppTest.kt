package club.leanmuscle.boji

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotSelected
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.junit4.StateRestorationTester
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.ext.junit.runners.AndroidJUnit4
import club.leanmuscle.boji.core.data.Appearance
import club.leanmuscle.boji.core.data.BojiStore
import club.leanmuscle.boji.core.model.BojiState
import club.leanmuscle.boji.core.model.PlanKind
import club.leanmuscle.boji.core.model.WorkoutLibrary
import club.leanmuscle.boji.ui.BojiApp
import club.leanmuscle.boji.ui.navigation.BojiDestination
import club.leanmuscle.boji.ui.theme.BojiTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class BojiAppTest {
    @get:Rule
    val composeRule = createComposeRule()

    private fun launch(state: BojiState = BojiState(hasOnboarded = true)): BojiStore {
        val store = BojiStore.inMemory(state)
        composeRule.setContent { BojiTheme { BojiApp(store, Appearance.System, onAppearanceChange = {}) } }
        return store
    }

    private val BojiStore.current get() = checkNotNull(snapshot.value)

    @Test
    fun onboardingSavesThePlanAndOpensToday() {
        val store = launch(BojiState())
        composeRule.onNodeWithTag("screen_Welcome").assertIsDisplayed()

        composeRule.onNodeWithTag("plan_Gym").performScrollTo().performClick()
        composeRule.onNodeWithTag("welcome_start").performClick()

        composeRule.onNodeWithTag(BojiDestination.Today.screenTag).assertIsDisplayed()
        assertEquals(PlanKind.Gym, store.current.state.selectedPlan)
        assertEquals(true, store.current.state.hasOnboarded)
    }

    @Test
    fun startsOnTodayAndSwitchesEveryTab() {
        launch()
        composeRule.onNodeWithTag(BojiDestination.Today.tabTag).assertIsSelected()
        composeRule.onNodeWithTag(BojiDestination.Today.screenTag).assertIsDisplayed()

        BojiDestination.entries.forEach { destination ->
            composeRule.onNodeWithTag(destination.tabTag).performClick().assertIsSelected()
            composeRule.onNodeWithTag(destination.screenTag).assertIsDisplayed()
        }
        composeRule.onNodeWithTag(BojiDestination.Today.tabTag).assertIsNotSelected()
    }

    @Test
    fun keepsSelectedTabAfterStateRestore() {
        val store = BojiStore.inMemory(BojiState(hasOnboarded = true))
        val restorationTester = StateRestorationTester(composeRule)
        restorationTester.setContent { BojiTheme { BojiApp(store, Appearance.System, onAppearanceChange = {}) } }

        composeRule.onNodeWithTag(BojiDestination.Training.tabTag).performClick()
        restorationTester.emulateSavedInstanceStateRestore()

        composeRule.onNodeWithTag(BojiDestination.Training.tabTag).assertIsSelected()
        composeRule.onNodeWithTag(BojiDestination.Training.screenTag).assertIsDisplayed()
    }

    @Test
    fun eachTabKeepsItsOwnBackStack() {
        launch()
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
        val store = launch()
        composeRule.onNodeWithTag("habit_water").performScrollTo().performClick()
        composeRule.onNodeWithTag("sheet_save").performClick()
        composeRule.waitForIdle()
        assertEquals(250, store.current.todayRecord.waterML)
    }

    @Test
    fun finishingASessionRecordsTheWorkout() {
        val store = launch()
        val workout = WorkoutLibrary.Mobility
        composeRule.onNodeWithTag(BojiDestination.Training.tabTag).performClick()
        composeRule.onNodeWithTag("mobility_workout").performScrollTo().performClick()
        composeRule.onNodeWithTag("start_workout").performClick()
        composeRule.onNodeWithTag("screen_Session").assertIsDisplayed()

        repeat(workout.totalSets * 2 - 1) { composeRule.onNodeWithTag("session_primary").performClick() }

        composeRule.onNodeWithTag("session_finished").assertIsDisplayed()
        assertEquals(1, store.current.totalWorkouts)
        composeRule.onNodeWithTag("session_done").performClick()
        composeRule.onNodeWithTag("screen_WorkoutDetail").assertIsDisplayed()
        composeRule.onNodeWithText("再次练习").assertIsDisplayed()
    }

    @Test
    fun endingASessionEarlyRecordsNothing() {
        val store = launch()
        composeRule.onNodeWithTag("recommended_workout").performScrollTo().performClick()
        composeRule.onNodeWithTag("start_workout").performClick()
        composeRule.onNodeWithTag("session_primary").performClick()
        composeRule.onNodeWithTag("session_end").performClick()
        composeRule.onNodeWithTag("session_end_confirm").performClick()

        composeRule.onNodeWithTag("screen_WorkoutDetail").assertIsDisplayed()
        assertEquals(0, store.current.totalWorkouts)
    }

    @Test
    fun localChallengeCanBeJoinedAndLeft() {
        val store = launch()
        composeRule.onNodeWithTag(BojiDestination.Club.tabTag).performClick()
        composeRule.onNodeWithTag("challenge_join").performScrollTo().performClick()
        assertEquals(true, store.current.state.joinedChallenge)
        composeRule.onNodeWithTag("challenge_leave").performScrollTo().performClick()
        assertEquals(false, store.current.state.joinedChallenge)
    }

    @Test
    fun deletingAllDataReturnsToWelcome() {
        val store = launch(BojiState(hasOnboarded = true, displayName = "测试"))
        composeRule.onNodeWithTag("open_settings").performClick()
        composeRule.onNodeWithTag("settings_delete").performScrollTo().performClick()
        composeRule.onNodeWithTag("settings_delete_confirm").performClick()

        composeRule.onNodeWithTag("screen_Welcome").assertIsDisplayed()
        assertEquals(BojiState(), store.current.state)
    }
}
