package club.leanmuscle.boji

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.ext.junit.runners.AndroidJUnit4
import club.leanmuscle.boji.core.health.HealthAvailability
import club.leanmuscle.boji.core.health.HealthPermissions
import club.leanmuscle.boji.core.health.HealthSleepSample
import club.leanmuscle.boji.core.health.HealthSleepStage
import club.leanmuscle.boji.core.health.HealthWeight
import club.leanmuscle.boji.core.model.BojiState
import club.leanmuscle.boji.ui.navigation.BojiDestination
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import java.time.LocalDate
import java.time.ZoneId
import javax.inject.Inject
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/** The Health Connect page, its settings entry and the summary card, with a fake data source. */
@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class HealthConnectTest {
    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val stateRule = StateFileRule(BojiState(hasOnboarded = true))

    @get:Rule(order = 2)
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Inject
    lateinit var health: FakeUiHealthProvider

    @Before
    fun setUp() {
        hiltRule.inject()
        val zone = ZoneId.systemDefault()
        val today = LocalDate.now(zone)
        health.weights = listOf(
            HealthWeight("w1", 72.4, today.minusDays(1).atTime(8, 0).atZone(zone).toInstant(), "Test Scale"),
        )
        // 22:00 to 06:00 lies inside today's sleep day (yesterday 18:00 to today 18:00) at any time of day.
        health.sleepSamples = listOf(
            HealthSleepSample(
                "s1",
                today.minusDays(1).atTime(22, 0).atZone(zone).toInstant(),
                today.atTime(6, 0).atZone(zone).toInstant(),
                HealthSleepStage.Asleep,
                "Test Watch",
            ),
        )
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag(BojiDestination.Today.screenTag).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun openHealthFromSettings() {
        composeRule.onNodeWithTag("open_settings").performClick()
        composeRule.onNodeWithTag("settings_health").performScrollTo().performClick()
        composeRule.onNodeWithTag("screen_Health").assertIsDisplayed()
    }

    private fun waitForTag(tag: String) {
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag(tag).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun back() {
        composeRule.onNodeWithContentDescription(composeRule.activity.getString(R.string.action_back)).performClick()
    }

    @Test
    fun connectingShowsTheValuesAndTheSummaryCard() {
        openHealthFromSettings()
        composeRule.onNodeWithTag("health_connect").performScrollTo().performClick()

        waitForTag("health_disconnect")
        composeRule.onNodeWithTag("health_latest_weight").performScrollTo().assertTextContains("72.4", substring = true)
        composeRule.onNodeWithTag("health_latest_weight").assertTextContains("Test Scale", substring = true)
        composeRule.onNodeWithTag("health_latest_sleep").assertTextContains("8.0", substring = true)

        back()
        back()
        composeRule.onNodeWithTag("health_summary").performScrollTo().assertTextContains("72.4", substring = true)

        // The summary card opens the page again.
        composeRule.onNodeWithTag("health_summary").performClick()
        composeRule.onNodeWithTag("screen_Health").assertIsDisplayed()
    }

    @Test
    fun disconnectingHidesTheSummaryCard() {
        openHealthFromSettings()
        composeRule.onNodeWithTag("health_connect").performScrollTo().performClick()
        waitForTag("health_disconnect")

        composeRule.onNodeWithTag("health_disconnect").performScrollTo().performClick()
        composeRule.onNodeWithTag("health_disconnect_confirm").performClick()

        waitForTag("health_connect")
        back()
        back()
        composeRule.onNodeWithTag(BojiDestination.Today.screenTag).assertIsDisplayed()
        composeRule.waitForIdle()
        check(composeRule.onAllNodesWithTag("health_summary").fetchSemanticsNodes().isEmpty())
    }

    @Test
    fun partialGrantNamesTheMissingPermission() {
        health.grantOnRequest = setOf(HealthPermissions.READ_WEIGHT)
        openHealthFromSettings()
        composeRule.onNodeWithTag("health_connect").performScrollTo().performClick()

        waitForTag("health_missing_sleep")
        composeRule.onNodeWithTag("health_grant").performScrollTo().assertIsDisplayed()
        composeRule.onNodeWithTag("health_latest_sleep").performScrollTo()
            .assertTextContains(composeRule.activity.getString(R.string.health_no_data), substring = true)
    }

    @Test
    fun noGrantStaysDisconnected() {
        health.grantOnRequest = emptySet()
        openHealthFromSettings()
        composeRule.onNodeWithTag("health_connect").performScrollTo().performClick()

        waitForTag("health_error")
        composeRule.onNodeWithTag("health_connect").assertIsDisplayed()
        check(composeRule.onAllNodesWithTag("health_disconnect").fetchSemanticsNodes().isEmpty())
    }

    @Test
    fun missingHealthConnectOffersTheStore() {
        health.availability = HealthAvailability.UpdateRequired
        openHealthFromSettings()

        // Opening the page reads the availability again.
        waitForTag("health_install")
        check(composeRule.onAllNodesWithTag("health_connect").fetchSemanticsNodes().isEmpty())
    }
}
