package club.leanmuscle.boji

import android.content.Intent
import android.content.pm.PackageManager
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import club.leanmuscle.boji.core.health.HealthPermissions
import club.leanmuscle.boji.feature.health.HealthPermissionsRationaleActivity
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/** Health Connect declarations in the merged manifest, and the rationale screen they point to. */
@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class HealthManifestTest {
    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    // A new directory, so the activity's settings DataStore does not clash with an earlier test's.
    @get:Rule(order = 1)
    val stateRule = StateFileRule(null)

    @get:Rule(order = 2)
    val composeRule = createAndroidComposeRule<HealthPermissionsRationaleActivity>()

    private val context = InstrumentationRegistry.getInstrumentation().targetContext

    @Before
    fun inject() = hiltRule.inject()

    @Test
    fun permissionConstantsMatchTheLibrary() {
        assertEquals(HealthPermission.getReadPermission(WeightRecord::class), HealthPermissions.READ_WEIGHT)
        assertEquals(HealthPermission.getReadPermission(SleepSessionRecord::class), HealthPermissions.READ_SLEEP)
    }

    @Test
    fun requestsOnlyTheTwoReadPermissions() {
        val info = context.packageManager.getPackageInfo(context.packageName, PackageManager.GET_PERMISSIONS)
        val health = info.requestedPermissions.orEmpty().filter { it.startsWith("android.permission.health.") }.toSet()
        assertEquals(HealthPermissions.all, health)
    }

    @Test
    fun bothRationaleEntriesResolveToBoji() {
        val pm = context.packageManager
        val legacy = Intent("androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE").setPackage(context.packageName)
        val usage = Intent(Intent.ACTION_VIEW_PERMISSION_USAGE)
            .addCategory("android.intent.category.HEALTH_PERMISSIONS")
            .setPackage(context.packageName)

        val legacyTargets = pm.queryIntentActivities(legacy, 0).map { it.activityInfo.name }
        val usageTargets = pm.queryIntentActivities(usage, 0).map { it.activityInfo.name }
        assertEquals(listOf(HealthPermissionsRationaleActivity::class.java.name), legacyTargets)
        assertTrue(usageTargets.single().endsWith("ViewPermissionUsageActivity"))
    }

    @Test
    fun rationaleScreenShowsThePolicyLink() {
        // The screen waits for the stored display mode.
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag("screen_HealthRationale").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithTag("screen_HealthRationale").assertIsDisplayed()
        composeRule.onNodeWithTag("health_policy").assertIsDisplayed()
    }
}
