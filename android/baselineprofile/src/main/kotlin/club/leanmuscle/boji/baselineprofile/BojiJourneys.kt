package club.leanmuscle.boji.baselineprofile

import androidx.benchmark.macro.MacrobenchmarkScope
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Direction
import androidx.test.uiautomator.Until
import java.util.regex.Pattern

/** Application ID of the app under test. */
const val PACKAGE_NAME = "club.leanmuscle.boji"

private const val TIMEOUT_MILLIS = 5_000L

/*
 * Critical user journeys, shared by the profile generator and the benchmarks.
 * Elements are found by Compose test tags, which MainActivity exposes as resource IDs.
 */

/** Cold start. On a new install, it also completes onboarding with the default plan. */
fun MacrobenchmarkScope.startAndOpenToday() {
    pressHome()
    startActivityAndWait()
    device.wait(Until.hasObject(By.res(Pattern.compile("screen_(Welcome|Today)"))), TIMEOUT_MILLIS)
    device.findObject(By.res("welcome_start"))?.click()
    waitFor("screen_Today")
}

/** Scrolls Today, then opens every tab once and returns to Today. */
fun MacrobenchmarkScope.visitEveryTab() {
    device.findObject(By.res("screen_Today"))?.let { today ->
        today.setGestureMargin(device.displayWidth / 5)
        today.fling(Direction.DOWN)
        today.fling(Direction.UP)
    }
    for (tab in listOf("Training", "Progress", "Club", "Today")) {
        device.findObject(By.res("tab_$tab")).click()
        waitFor("screen_$tab")
    }
}

/** Opens the recommended workout and starts it, which loads the first exercise animation. */
fun MacrobenchmarkScope.startRecommendedWorkout() {
    val today = device.findObject(By.res("screen_Today"))
    today.setGestureMargin(device.displayWidth / 5)
    today.scrollUntil(Direction.DOWN, Until.hasObject(By.res("recommended_workout")))
    device.findObject(By.res("recommended_workout")).click()
    waitFor("start_workout").click()
    waitFor("screen_Session")
    // Let the animation play for a few frames. The next iteration restarts the app.
    device.waitForIdle()
    Thread.sleep(1_500)
}

private fun MacrobenchmarkScope.waitFor(tag: String) =
    checkNotNull(device.wait(Until.findObject(By.res(tag)), TIMEOUT_MILLIS)) { "No element with test tag $tag" }
