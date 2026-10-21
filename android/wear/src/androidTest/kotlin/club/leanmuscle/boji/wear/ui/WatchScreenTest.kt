package club.leanmuscle.boji.wear.ui

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertContentDescriptionEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.hasScrollToNodeAction
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollToNode
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeUp
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.wear.compose.material3.AppScaffold
import club.leanmuscle.boji.shared.companion.CompanionProgress
import club.leanmuscle.boji.shared.companion.CompanionSnapshot
import club.leanmuscle.boji.wear.R
import club.leanmuscle.boji.wear.data.ConnectionState
import club.leanmuscle.boji.wear.data.WatchState
import java.time.ZoneId
import java.time.ZonedDateTime
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class WatchScreenTest {
    @get:Rule
    val composeRule = createComposeRule()

    private val context = InstrumentationRegistry.getInstrumentation().targetContext
    private val zone = ZoneId.of("Asia/Shanghai")
    private val now = ZonedDateTime.of(2026, 10, 20, 9, 30, 0, 0, zone).toInstant()

    private val snapshot = CompanionSnapshot.of(
        CompanionProgress(dayKey = "2026-10-20", trainingCompleted = true, waterLogged = false, sleepLogged = true, planTitle = "居家训练"),
        generatedAt = now,
    )

    private fun show(state: WatchState) {
        composeRule.setContent {
            WatchTheme {
                AppScaffold { WatchScreen(state = state, now = now, zone = zone, onRefresh = {}) }
            }
        }
    }

    private fun text(id: Int) = context.getString(id)

    @Test
    fun currentSnapshotShowsPlanAndEachCheckIn() {
        show(WatchState(connection = ConnectionState.Ready, snapshot = snapshot))

        composeRule.onNodeWithText(text(R.string.watch_title)).assertIsDisplayed()
        composeRule.onNodeWithTag("watch_connection").assert(hasText(text(R.string.watch_connected)))
        composeRule.onNodeWithTag("watch_plan").assert(hasText("居家训练"))
        // Each card is one TalkBack item: its name and its state.
        composeRule.onNodeWithTag("watch_training").assert(hasText(text(R.string.watch_training))).assert(hasText(text(R.string.watch_logged)))
        list().performScrollToNode(hasTestTag("watch_water"))
        composeRule.onNodeWithTag("watch_water").assert(hasText(text(R.string.watch_not_logged)))
        list().performScrollToNode(hasTestTag("watch_sleep"))
        composeRule.onNodeWithTag("watch_sleep").assert(hasText(text(R.string.watch_logged)))
        list().performScrollToNode(hasTestTag("watch_synced"))
        composeRule.onNodeWithTag("watch_synced").assertIsDisplayed()
    }

    @Test
    fun refreshWorksOnlyWhileThePhoneCanAnswer() {
        var state by mutableStateOf(WatchState(connection = ConnectionState.Requesting, snapshot = snapshot))
        var refreshes = 0
        composeRule.setContent {
            WatchTheme {
                AppScaffold { WatchScreen(state = state, now = now, zone = zone, onRefresh = { refreshes++ }) }
            }
        }
        composeRule.onNodeWithTag("watch_refresh").assertIsNotEnabled()

        state = state.copy(connection = ConnectionState.Offline)
        composeRule.onNodeWithTag("watch_refresh").assertIsNotEnabled()
        composeRule.onNodeWithTag("watch_connection").assert(hasText(text(R.string.watch_offline_detail)))

        state = state.copy(connection = ConnectionState.Failed)
        // ScreenScaffold shrinks the EdgeButton until the list reaches its end.
        scrollToEnd()
        composeRule.onNodeWithTag("watch_refresh")
            .assertContentDescriptionEquals(text(R.string.watch_refresh))
            .assertIsEnabled()
            .performClick()
        assertEquals(1, refreshes)
    }

    @Test
    fun sharingOffAndMissingDataExplainWhatToDo() {
        show(WatchState(connection = ConnectionState.Ready, isSharingDisabled = true))
        composeRule.onNodeWithTag("watch_sharing_off")
            .assert(hasText(text(R.string.watch_sharing_off)))
            .assert(hasText(text(R.string.watch_turn_on_sharing)))
        assertTrue(composeRule.onAllNodesWithTag("watch_training").fetchSemanticsNodes().isEmpty())
    }

    @Test
    fun noDataAsksForSharing() {
        show(WatchState(connection = ConnectionState.Unavailable))
        composeRule.onNodeWithTag("watch_no_data").assert(hasText(text(R.string.watch_no_data)))
        composeRule.onNodeWithTag("watch_connection").assert(hasText(text(R.string.watch_unavailable)))
    }

    @Test
    fun yesterdaysSnapshotHidesItsCheckIns() {
        val yesterday = snapshot.copy(dayKey = "2026-10-19", generatedAt = now.minusSeconds(86_400))
        show(WatchState(connection = ConnectionState.Offline, snapshot = yesterday))
        composeRule.onNodeWithTag("watch_stale").assert(hasText(text(R.string.watch_stale)))
        assertTrue(composeRule.onAllNodesWithTag("watch_training").fetchSemanticsNodes().isEmpty())
    }

    private fun list() = composeRule.onNode(hasScrollToNodeAction())

    private fun scrollToEnd() {
        list().performTouchInput { repeat(3) { swipeUp() } }
        composeRule.waitForIdle()
    }
}
