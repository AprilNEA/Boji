package club.leanmuscle.boji.feature.widget

import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.annotation.DrawableRes
import androidx.annotation.StringRes
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.net.toUri
import androidx.glance.ColorFilter
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.LocalSize
import androidx.glance.action.Action
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.appWidgetBackground
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.color.ColorProvider
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.material3.ColorProviders
import androidx.glance.semantics.contentDescription
import androidx.glance.semantics.semantics
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import club.leanmuscle.boji.MainActivity
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.companion.CompanionRoute
import club.leanmuscle.boji.core.companion.DailyStatus
import club.leanmuscle.boji.core.companion.DailyWidgetState
import club.leanmuscle.boji.ui.theme.DarkBojiColors
import club.leanmuscle.boji.ui.theme.DarkColors
import club.leanmuscle.boji.ui.theme.LightBojiColors
import club.leanmuscle.boji.ui.theme.LightColors
import dagger.hilt.android.EntryPointAccessors
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withTimeoutOrNull

/**
 * The home screen widget, like `BojiDailyWidget` on iOS: whether today's workout, water and sleep
 * are logged. It shows nothing until the user turns on sharing in Settings.
 */
class DailyWidget : GlanceAppWidget() {
    // Exact, as the Glance guide recommends: the layout depends on the real size of the widget.
    override val sizeMode: SizeMode = SizeMode.Exact
    override val previewSizeMode = SizeMode.Responsive(setOf(PREVIEW_SMALL, PREVIEW_WIDE))

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val source = EntryPointAccessors.fromApplication(context, DailyWidgetEntryPoint::class.java).dailyWidgetSource()
        source.refreshDay()
        // Read once before the first frame, so the widget does not flash a loading state.
        val initial = withTimeoutOrNull(LOAD_TIMEOUT_MILLIS) { source.state.first() } ?: DailyWidgetState.Unavailable
        provideContent {
            // Collected inside the composition: an update during a running session recomposes with new data.
            val state by source.state.collectAsState(initial)
            DailyWidgetTheme { DailyWidgetContent(state) }
        }
    }

    /** The picker preview on Android 15 and later. Sample data, never the user's records. */
    override suspend fun providePreview(context: Context, widgetCategory: Int) {
        provideContent { DailyWidgetTheme { DailyWidgetContent(PREVIEW_STATE) } }
    }

    internal companion object {
        /** From this width the widget shows three tiles, like the iOS medium widget. */
        val WIDE_MIN_WIDTH = 250.dp

        /** From this height the small widget also shows the subtitle. */
        val SUBTITLE_MIN_HEIGHT = 150.dp

        val PREVIEW_SMALL = DpSize(160.dp, 160.dp)
        val PREVIEW_WIDE = DpSize(320.dp, 160.dp)
        val PREVIEW_STATE = DailyWidgetState.Current(
            DailyStatus(trainingCompleted = true, waterLogged = true, sleepLogged = false),
        )

        const val LOAD_TIMEOUT_MILLIS = 5_000L
    }
}

@Composable
private fun DailyWidgetTheme(content: @Composable () -> Unit) {
    GlanceTheme(colors = ColorProviders(light = LightColors, dark = DarkColors), content = content)
}

/** The widget follows the system dark mode. The app's own display mode does not reach the launcher. */
private object WidgetColors {
    val background = ColorProvider(day = LightBojiColors.page, night = DarkBojiColors.page)
    val logged = ColorProvider(day = LightBojiColors.calm, night = DarkBojiColors.calm)
}

private enum class Habit(@param:StringRes val label: Int, @param:DrawableRes val icon: Int) {
    Training(R.string.widget_training, R.drawable.ic_fitness_center),
    Water(R.string.widget_water, R.drawable.ic_water_drop),
    Sleep(R.string.widget_sleep, R.drawable.ic_bedtime),
}

private fun DailyStatus.isLogged(habit: Habit): Boolean = when (habit) {
    Habit.Training -> trainingCompleted
    Habit.Water -> waterLogged
    Habit.Sleep -> sleepLogged
}

/** The widget content for [state]. Internal so that instrumented tests can render it. */
@Composable
internal fun DailyWidgetContent(state: DailyWidgetState) {
    val context = LocalContext.current
    val size = LocalSize.current
    val description = widgetDescription(context, state)
    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .appWidgetBackground()
            .background(WidgetColors.background)
            .systemCornerRadius()
            .clickable(openRoute(context, CompanionRoute.Today))
            // One description for the whole widget, like the combined element on iOS.
            .semantics { contentDescription = description }
            .padding(14.dp),
    ) {
        if (size.width >= DailyWidget.WIDE_MIN_WIDTH) {
            WideLayout(state)
        } else {
            SmallLayout(state, showSubtitle = size.height >= DailyWidget.SUBTITLE_MIN_HEIGHT)
        }
    }
}

/**
 * The launcher's widget corner radius. The dimension exists from Android 12, and Glance applies
 * corner radii only from Android 12, so older launchers keep their own widget shape.
 */
private fun GlanceModifier.systemCornerRadius(): GlanceModifier =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) cornerRadius(android.R.dimen.system_app_widget_background_radius) else this

@Composable
private fun SmallLayout(state: DailyWidgetState, showSubtitle: Boolean) {
    Column(modifier = GlanceModifier.fillMaxSize()) {
        Header(state, showSubtitle)
        Spacer(GlanceModifier.height(8.dp))
        when (state) {
            is DailyWidgetState.Current -> Habit.entries.forEachIndexed { index, habit ->
                if (index > 0) Spacer(GlanceModifier.height(6.dp))
                HabitRow(habit, state.status.isLogged(habit))
            }
            DailyWidgetState.Disabled, DailyWidgetState.Unavailable -> Message(state)
        }
    }
}

@Composable
private fun WideLayout(state: DailyWidgetState) {
    val context = LocalContext.current
    Row(modifier = GlanceModifier.fillMaxSize()) {
        Column(modifier = GlanceModifier.defaultWeight()) {
            Header(state, showSubtitle = state is DailyWidgetState.Current)
            Spacer(GlanceModifier.height(6.dp))
            Text(
                text = context.getString(state.detail),
                style = TextStyle(color = GlanceTheme.colors.onSurfaceVariant, fontSize = 12.sp),
                maxLines = 2,
            )
        }
        if (state is DailyWidgetState.Current) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Habit.entries.forEachIndexed { index, habit ->
                    if (index > 0) Spacer(GlanceModifier.width(8.dp))
                    HabitTile(habit, state.status.isLogged(habit))
                }
            }
        }
    }
}

@Composable
private fun Header(state: DailyWidgetState, showSubtitle: Boolean) {
    val context = LocalContext.current
    Column {
        Text(
            text = context.getString(state.title),
            style = TextStyle(color = GlanceTheme.colors.onSurface, fontSize = 15.sp, fontWeight = FontWeight.Bold),
            maxLines = 1,
        )
        if (showSubtitle && state is DailyWidgetState.Current) {
            Text(
                text = context.getString(R.string.widget_subtitle),
                style = TextStyle(color = GlanceTheme.colors.onSurfaceVariant, fontSize = 11.sp),
                maxLines = 1,
            )
        }
    }
}

@Composable
private fun HabitRow(habit: Habit, logged: Boolean) {
    val context = LocalContext.current
    Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Image(
            provider = ImageProvider(habit.icon),
            contentDescription = null,
            modifier = GlanceModifier.size(14.dp),
            colorFilter = ColorFilter.tint(GlanceTheme.colors.onSurface),
        )
        Spacer(GlanceModifier.width(6.dp))
        Text(
            text = context.getString(habit.label),
            modifier = GlanceModifier.defaultWeight(),
            style = TextStyle(color = GlanceTheme.colors.onSurface, fontSize = 13.sp),
            maxLines = 1,
        )
        Text(
            text = context.getString(if (logged) R.string.widget_logged else R.string.widget_pending),
            style = TextStyle(
                color = if (logged) WidgetColors.logged else GlanceTheme.colors.onSurfaceVariant,
                fontSize = 13.sp,
                fontWeight = if (logged) FontWeight.Medium else FontWeight.Normal,
            ),
            maxLines = 1,
        )
    }
}

@Composable
private fun HabitTile(habit: Habit, logged: Boolean) {
    val context = LocalContext.current
    val label = context.getString(habit.label)
    val tint: ColorProvider = if (logged) WidgetColors.logged else GlanceTheme.colors.onSurfaceVariant
    var modifier = GlanceModifier.width(52.dp)
    if (habit == Habit.Training) {
        // Like the iOS medium widget, the workout tile opens the Training tab.
        val description = context.getString(R.string.widget_open_training_a11y, itemDescription(context, habit, logged))
        modifier = modifier
            .clickable(openRoute(context, CompanionRoute.Training))
            .semantics { contentDescription = description }
    }
    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        Image(
            provider = ImageProvider(habit.icon),
            contentDescription = null,
            modifier = GlanceModifier.size(20.dp),
            colorFilter = ColorFilter.tint(tint),
        )
        Spacer(GlanceModifier.height(4.dp))
        Text(
            text = label,
            style = TextStyle(color = GlanceTheme.colors.onSurface, fontSize = 11.sp),
            maxLines = 1,
        )
        Text(
            text = context.getString(if (logged) R.string.widget_logged else R.string.widget_pending),
            style = TextStyle(color = tint, fontSize = 11.sp),
            maxLines = 1,
        )
    }
}

@Composable
private fun Message(state: DailyWidgetState) {
    val context = LocalContext.current
    Row(verticalAlignment = Alignment.CenterVertically) {
        Image(
            provider = ImageProvider(if (state is DailyWidgetState.Disabled) R.drawable.ic_settings else R.drawable.ic_refresh),
            contentDescription = null,
            modifier = GlanceModifier.size(14.dp),
            colorFilter = ColorFilter.tint(GlanceTheme.colors.onSurfaceVariant),
        )
        Spacer(GlanceModifier.width(6.dp))
        Text(
            text = context.getString(state.detail),
            style = TextStyle(color = GlanceTheme.colors.onSurfaceVariant, fontSize = 12.sp),
            maxLines = 2,
        )
    }
}

@get:StringRes
private val DailyWidgetState.title: Int
    get() = when (this) {
        DailyWidgetState.Disabled -> R.string.widget_title_disabled
        DailyWidgetState.Unavailable -> R.string.widget_title_unavailable
        is DailyWidgetState.Current -> R.string.widget_title_current
    }

@get:StringRes
private val DailyWidgetState.detail: Int
    get() = when (this) {
        DailyWidgetState.Disabled -> R.string.widget_detail_disabled
        DailyWidgetState.Unavailable -> R.string.widget_detail_unavailable
        is DailyWidgetState.Current -> R.string.widget_detail_current
    }

private fun itemDescription(context: Context, habit: Habit, logged: Boolean): String = context.getString(
    if (logged) R.string.widget_item_logged_a11y else R.string.widget_item_pending_a11y,
    context.getString(habit.label),
)

/** What TalkBack reads for the whole widget, like the iOS accessibility label. */
internal fun widgetDescription(context: Context, state: DailyWidgetState): String = when (state) {
    DailyWidgetState.Disabled -> context.getString(R.string.widget_disabled_a11y)
    DailyWidgetState.Unavailable -> context.getString(R.string.widget_unavailable_a11y)
    is DailyWidgetState.Current -> context.getString(
        R.string.widget_current_a11y,
        itemDescription(context, Habit.Training, state.status.trainingCompleted),
        itemDescription(context, Habit.Water, state.status.waterLogged),
        itemDescription(context, Habit.Sleep, state.status.sleepLogged),
    )
}

/**
 * Opens [route] in MainActivity. The URI keeps the two actions apart, and the flags deliver it
 * to a running MainActivity through onNewIntent instead of only bringing the task to the front.
 */
private fun openRoute(context: Context, route: CompanionRoute): Action = actionStartActivity(
    Intent(context, MainActivity::class.java)
        .setData(route.uri.toUri())
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP),
)
