package club.leanmuscle.boji

import android.content.Intent
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsOff
import androidx.compose.ui.test.assertIsOn
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.junit4.v2.createEmptyComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.core.net.toUri
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import club.leanmuscle.boji.core.companion.CompanionSettings
import club.leanmuscle.boji.core.companion.WatchNodes
import club.leanmuscle.boji.core.companion.WearCompanionSync
import club.leanmuscle.boji.shared.companion.CompanionDataLayer
import club.leanmuscle.boji.core.model.BojiState
import club.leanmuscle.boji.ui.navigation.BojiDestination
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import javax.inject.Inject
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/** The sharing switch in Settings and the `boji://` routes that the widget opens. */
@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class CompanionSharingTest {
    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val stateRule = StateFileRule(BojiState(hasOnboarded = true))

    @get:Rule(order = 2)
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Inject
    lateinit var companion: CompanionSettings

    @Inject
    lateinit var wearSync: WearCompanionSync

    @Inject
    lateinit var watch: FakeUiWatchLink

    @Before
    fun setUp() {
        hiltRule.inject()
        waitForTag(BojiDestination.Today.screenTag)
    }

    private fun waitForTag(tag: String) {
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag(tag).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun sharingEnabled(): Boolean = runBlocking { companion.sharingEnabled.first() }

    /** Delivers a widget intent to the running activity, as CLEAR_TOP and SINGLE_TOP do. */
    private fun deliver(uri: String) {
        val activity = composeRule.activity
        val intent = Intent(activity, MainActivity::class.java).setData(uri.toUri())
        composeRule.runOnUiThread { InstrumentationRegistry.getInstrumentation().callActivityOnNewIntent(activity, intent) }
        composeRule.waitForIdle()
    }

    @Test
    fun sharingIsOffUntilTheUserTurnsItOn() {
        assertFalse(sharingEnabled())
        composeRule.onNodeWithTag("open_settings").performClick()
        composeRule.onNodeWithTag("settings_companion_sharing").performScrollTo().assertIsOff().performClick()
        composeRule.onNodeWithTag("settings_companion_sharing").assertIsOn()
        composeRule.waitUntil(timeoutMillis = 5_000) { sharingEnabled() }

        composeRule.onNodeWithTag("settings_companion_sharing").performClick()
        composeRule.onNodeWithTag("settings_companion_sharing").assertIsOff()
        composeRule.waitUntil(timeoutMillis = 5_000) { !sharingEnabled() }
    }

    /** HiltTestApplication does not run BojiApplication.onCreate, so the test starts the sync. */
    @Test
    fun settingsShowTheWatchWhileSharingIsOn() {
        wearSync.start()
        composeRule.onNodeWithTag("open_settings").performClick()
        composeRule.onNodeWithTag("settings_companion_sharing").performScrollTo()
        assertTrue(composeRule.onAllNodesWithTag("settings_watch_status").fetchSemanticsNodes().isEmpty())

        composeRule.onNodeWithTag("settings_companion_sharing").performClick()
        val connected = composeRule.activity.getString(R.string.settings_watch_connected)
        composeRule.waitUntil(timeoutMillis = 5_000) { textOfStatus() == connected }
        assertTrue(CompanionDataLayer.SNAPSHOT_PATH in watch.sentPaths)

        // The watch leaves. Its capability change makes the phone check again.
        watch.nodes = WatchNodes(reachable = emptyList(), withApp = 1, connected = 0)
        runBlocking { watch.changeEvents.emit(Unit) }
        val waiting = composeRule.activity.getString(R.string.settings_watch_waiting)
        composeRule.waitUntil(timeoutMillis = 5_000) { textOfStatus() == waiting }
        composeRule.onNodeWithTag("settings_watch_status").assertTextEquals(waiting)

        composeRule.onNodeWithTag("settings_companion_sharing").performClick()
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag("settings_watch_status").fetchSemanticsNodes().isEmpty()
        }
    }

    private fun textOfStatus(): String? = composeRule.onAllNodesWithTag("settings_watch_status").fetchSemanticsNodes()
        .firstOrNull()
        ?.config
        ?.getOrNull(SemanticsProperties.Text)
        ?.joinToString { it.text }

    @Test
    fun deletingAllDataTurnsSharingOff() {
        runBlocking { companion.setSharingEnabled(true) }
        composeRule.onNodeWithTag("open_settings").performClick()
        composeRule.onNodeWithTag("settings_companion_sharing").performScrollTo().assertIsOn()
        composeRule.onNodeWithTag("settings_delete").performScrollTo().performClick()
        composeRule.onNodeWithTag("settings_delete_confirm").performClick()
        waitForTag("screen_Welcome")
        composeRule.waitUntil(timeoutMillis = 5_000) { !sharingEnabled() }
    }

    @Test
    fun widgetRoutesSelectTheirTab() {
        deliver("boji://progress")
        composeRule.onNodeWithTag(BojiDestination.Progress.screenTag).assertIsDisplayed()
        deliver("boji://training")
        composeRule.onNodeWithTag(BojiDestination.Training.screenTag).assertIsDisplayed()
        deliver("BOJI://Club")
        composeRule.onNodeWithTag(BojiDestination.Club.screenTag).assertIsDisplayed()
        deliver("boji://today")
        composeRule.onNodeWithTag(BojiDestination.Today.screenTag).assertIsDisplayed()
    }

    @Test
    fun otherUrisKeepTheCurrentTab() {
        composeRule.onNodeWithTag(BojiDestination.Progress.tabTag).performClick()
        waitForTag(BojiDestination.Progress.screenTag)
        for (uri in listOf("boji://settings", "boji://club?ref=x", "boji://training/1", "https://leanmuscle.club")) {
            deliver(uri)
            composeRule.onNodeWithTag(BojiDestination.Progress.screenTag).assertIsDisplayed()
        }
    }
}

/** A cold start from the widget: the route in the launch intent selects the tab. */
@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class CompanionColdStartTest {
    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val stateRule = StateFileRule(BojiState(hasOnboarded = true))

    @get:Rule(order = 2)
    val composeRule = createEmptyComposeRule()

    @Test
    fun launchIntentSelectsTheTab() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val intent = Intent(context, MainActivity::class.java).setData("boji://progress".toUri())
        ActivityScenario.launch<MainActivity>(intent).use {
            composeRule.waitUntil(timeoutMillis = 5_000) {
                composeRule.onAllNodesWithTag(BojiDestination.Progress.screenTag).fetchSemanticsNodes().isNotEmpty()
            }
            composeRule.onNodeWithTag(BojiDestination.Progress.screenTag).assertIsDisplayed()
            assertTrue(composeRule.onAllNodesWithTag(BojiDestination.Today.screenTag).fetchSemanticsNodes().isEmpty())
        }
    }
}
