package club.leanmuscle.boji.feature.training

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.unit.dp
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import club.leanmuscle.boji.core.model.WorkoutLibrary
import club.leanmuscle.boji.ui.theme.BojiTheme
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ExerciseAnimationTest {
    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun missingFileShowsTheFallback() {
        composeRule.setContent {
            BojiTheme(darkTheme = false) {
                ExerciseAnimation(exerciseId = "no-such-exercise", playing = true, modifier = Modifier.size(120.dp)) {
                    Box(Modifier.size(24.dp).testTag("fallback"))
                }
            }
        }
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag("fallback").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onAllNodesWithTag("exercise_animation").assertCountEquals(0)
    }

    /** The APK contains `index.json`, and every course exercise has a valid still frame. */
    @Test
    fun packagedIndexHasAStillFrameForEveryCourseExercise() {
        val assets = InstrumentationRegistry.getInstrumentation().targetContext.assets
        val index = runBlocking { ExerciseAnimationIndex.load(assets) }
        for (exercise in WorkoutLibrary.all.flatMap { it.exercises }) {
            val entry = checkNotNull(index[exercise.id]) { "No index entry for ${exercise.id}" }
            assertTrue("${exercise.id}: posterFrame out of range", entry.posterFrame in 0 until entry.frames)
        }
    }
}
