package club.leanmuscle.boji.baselineprofile

import androidx.benchmark.macro.junit4.BaselineProfileRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.LargeTest
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Generates `app/src/release/generated/baselineProfiles/`. Run `./gradlew :app:generateBaselineProfile`
 * with an emulator or device on API 33 or higher, then commit the generated files.
 */
@RunWith(AndroidJUnit4::class)
@LargeTest
class BaselineProfileGenerator {
    @get:Rule
    val rule = BaselineProfileRule()

    /** Startup only. This part also becomes the startup profile, which orders the DEX files. */
    @Test
    fun startup() = rule.collect(packageName = PACKAGE_NAME, includeInStartupProfile = true) {
        startAndOpenToday()
    }

    /** Navigation and the training session. Not part of the startup profile. */
    @Test
    fun navigationAndTraining() = rule.collect(packageName = PACKAGE_NAME) {
        startAndOpenToday()
        visitEveryTab()
        startRecommendedWorkout()
    }
}
