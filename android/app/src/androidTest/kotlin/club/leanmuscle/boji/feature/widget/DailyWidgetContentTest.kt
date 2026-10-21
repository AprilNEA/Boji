package club.leanmuscle.boji.feature.widget

import android.content.Context
import android.content.Intent
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.core.net.toUri
import androidx.glance.appwidget.testing.unit.hasStartActivityClickAction
import androidx.glance.appwidget.testing.unit.runGlanceAppWidgetUnitTest
import androidx.glance.testing.unit.hasContentDescriptionEqualTo
import androidx.glance.testing.unit.hasTextEqualTo
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import club.leanmuscle.boji.MainActivity
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.companion.CompanionRoute
import club.leanmuscle.boji.core.companion.DailyStatus
import club.leanmuscle.boji.core.companion.DailyWidgetState
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith

/** The widget content in each state and size, rendered by the Glance test library without a launcher. */
@RunWith(AndroidJUnit4::class)
class DailyWidgetContentTest {
    private val context: Context = InstrumentationRegistry.getInstrumentation().targetContext
    private val small = DpSize(160.dp, 160.dp)
    private val short = DpSize(160.dp, 110.dp)
    private val wide = DpSize(320.dp, 160.dp)
    private val trainingOnly = DailyWidgetState.Current(DailyStatus(trainingCompleted = true, waterLogged = false, sleepLogged = false))

    private fun text(id: Int, vararg args: Any): String = context.getString(id, *args)

    /** Same component and URI as the widget's intent. Flags are not part of `filterEquals`. */
    private fun intentFor(route: CompanionRoute) = Intent(context, MainActivity::class.java).setData(route.uri.toUri())

    @Test
    fun smallWidgetShowsTheThreeCheckIns() = runGlanceAppWidgetUnitTest {
        setContext(context)
        setAppWidgetSize(small)
        provideComposable { DailyWidgetContent(trainingOnly) }

        onNode(hasTextEqualTo(text(R.string.widget_title_current))).assertExists()
        onNode(hasTextEqualTo(text(R.string.widget_subtitle))).assertExists()
        onNode(hasTextEqualTo(text(R.string.widget_training))).assertExists()
        onNode(hasTextEqualTo(text(R.string.widget_water))).assertExists()
        onNode(hasTextEqualTo(text(R.string.widget_sleep))).assertExists()
        onAllNodes(hasTextEqualTo(text(R.string.widget_logged))).assertCountEquals(1)
        onAllNodes(hasTextEqualTo(text(R.string.widget_pending))).assertCountEquals(2)
        onNode(hasContentDescriptionEqualTo(widgetDescription(context, trainingOnly))).assertExists()
        onAllNodes(hasStartActivityClickAction(intentFor(CompanionRoute.Today))).assertCountEquals(1)
        // Only the wide layout has a workout tile.
        onAllNodes(hasStartActivityClickAction(intentFor(CompanionRoute.Training))).assertCountEquals(0)
    }

    @Test
    fun shortWidgetDropsTheSubtitle() = runGlanceAppWidgetUnitTest {
        setContext(context)
        setAppWidgetSize(short)
        provideComposable { DailyWidgetContent(trainingOnly) }

        onNode(hasTextEqualTo(text(R.string.widget_title_current))).assertExists()
        onNode(hasTextEqualTo(text(R.string.widget_subtitle))).assertDoesNotExist()
        onAllNodes(hasTextEqualTo(text(R.string.widget_pending))).assertCountEquals(2)
    }

    @Test
    fun wideWidgetHasAWorkoutTileThatOpensTraining() = runGlanceAppWidgetUnitTest {
        setContext(context)
        setAppWidgetSize(wide)
        provideComposable { DailyWidgetContent(trainingOnly) }

        onNode(hasTextEqualTo(text(R.string.widget_detail_current))).assertExists()
        onAllNodes(hasTextEqualTo(text(R.string.widget_logged))).assertCountEquals(1)
        onAllNodes(hasTextEqualTo(text(R.string.widget_pending))).assertCountEquals(2)
        val tile = text(R.string.widget_open_training_a11y, text(R.string.widget_item_logged_a11y, text(R.string.widget_training)))
        onNode(hasStartActivityClickAction(intentFor(CompanionRoute.Training)))
            .assertExists()
            .assert(hasContentDescriptionEqualTo(tile))
        onAllNodes(hasStartActivityClickAction(intentFor(CompanionRoute.Today))).assertCountEquals(1)
    }

    @Test
    fun disabledWidgetShowsNoRecords() = runGlanceAppWidgetUnitTest {
        setContext(context)
        setAppWidgetSize(small)
        provideComposable { DailyWidgetContent(DailyWidgetState.Disabled) }

        onNode(hasTextEqualTo(text(R.string.widget_title_disabled))).assertExists()
        onNode(hasTextEqualTo(text(R.string.widget_detail_disabled))).assertExists()
        onAllNodes(hasTextEqualTo(text(R.string.widget_logged))).assertCountEquals(0)
        onAllNodes(hasTextEqualTo(text(R.string.widget_pending))).assertCountEquals(0)
        onNode(hasContentDescriptionEqualTo(text(R.string.widget_disabled_a11y))).assertExists()
        onAllNodes(hasStartActivityClickAction(intentFor(CompanionRoute.Today))).assertCountEquals(1)
    }

    @Test
    fun unavailableWidgetAsksToOpenTheApp() = runGlanceAppWidgetUnitTest {
        setContext(context)
        setAppWidgetSize(wide)
        provideComposable { DailyWidgetContent(DailyWidgetState.Unavailable) }

        onNode(hasTextEqualTo(text(R.string.widget_title_unavailable))).assertExists()
        onNode(hasTextEqualTo(text(R.string.widget_detail_unavailable))).assertExists()
        onAllNodes(hasTextEqualTo(text(R.string.widget_pending))).assertCountEquals(0)
        onAllNodes(hasStartActivityClickAction(intentFor(CompanionRoute.Training))).assertCountEquals(0)
        onNode(hasContentDescriptionEqualTo(text(R.string.widget_unavailable_a11y))).assertExists()
    }

    @Test
    fun descriptionReadsEveryCheckIn() {
        val all = DailyWidgetState.Current(DailyStatus(trainingCompleted = true, waterLogged = true, sleepLogged = false))
        val expected = text(
            R.string.widget_current_a11y,
            text(R.string.widget_item_logged_a11y, text(R.string.widget_training)),
            text(R.string.widget_item_logged_a11y, text(R.string.widget_water)),
            text(R.string.widget_item_pending_a11y, text(R.string.widget_sleep)),
        )
        assertEquals(expected, widgetDescription(context, all))
    }
}
