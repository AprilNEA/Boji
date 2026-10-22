package club.leanmuscle.boji.feature.training

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.ext.junit.runners.AndroidJUnit4
import club.leanmuscle.boji.MainActivity
import club.leanmuscle.boji.StateFileRule
import club.leanmuscle.boji.TestExerciseAnimations
import club.leanmuscle.boji.core.model.BojiState
import club.leanmuscle.boji.core.model.WorkoutLibrary
import club.leanmuscle.boji.ui.navigation.BojiDestination
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class RemoteCourseUiTest {
    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val stateRule = StateFileRule(BojiState(hasOnboarded = true))

    @get:Rule(order = 2)
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Before
    fun inject() {
        TestExerciseAnimations.reset()
        hiltRule.inject()
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag(BojiDestination.Today.screenTag).fetchSemanticsNodes().isNotEmpty()
        }
    }

    @After
    fun resetFixtures() = TestExerciseAnimations.reset()

    @Test
    fun trainingShowsThreeGroupsAndAllFourteenCourses() {
        composeRule.onNodeWithTag(BojiDestination.Training.tabTag).performClick()
        listOf("training_group_home", "training_group_gym", "training_group_stretch").forEach { group ->
            val resource = composeRule.activity.resources.getIdentifier(group, "string", composeRule.activity.packageName)
            composeRule.onNodeWithText(composeRule.activity.getString(resource)).performScrollTo().assertIsDisplayed()
        }
        WorkoutLibrary.all.forEach { course ->
            composeRule.onNodeWithTag("course_${course.id}").performScrollTo().assertIsDisplayed()
        }
    }

    @Test
    fun offlineRemoteCourseShowsNoticeAndStillStartsSession() {
        composeRule.onNodeWithTag(BojiDestination.Training.tabTag).performClick()
        composeRule.onNodeWithTag("course_home-strength").performScrollTo().performClick()
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag("animation_status").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithTag("animation_status").assertIsDisplayed()
        composeRule.onNodeWithTag("start_workout").performClick()
        composeRule.onNodeWithTag("screen_Session").assertIsDisplayed()
    }

    @Test
    fun fixtureRemoteCoursePlaysItsFirstExerciseAnimation() {
        TestExerciseAnimations.mode = TestExerciseAnimations.Mode.Fixture
        composeRule.onNodeWithTag(BojiDestination.Training.tabTag).performClick()
        composeRule.onNodeWithTag("course_home-strength").performScrollTo().performClick()
        composeRule.onNodeWithTag("start_workout").performClick()
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag("exercise_animation").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithTag("exercise_animation").assertIsDisplayed()
    }
}
