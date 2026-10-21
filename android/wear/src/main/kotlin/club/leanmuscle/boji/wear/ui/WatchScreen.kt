package club.leanmuscle.boji.wear.ui

import android.text.format.DateFormat
import androidx.annotation.StringRes
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.scrollable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberOverscrollEffect
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.LifecycleResumeEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.wear.compose.foundation.lazy.TransformingLazyColumn
import androidx.wear.compose.foundation.lazy.TransformingLazyColumnItemScope
import androidx.wear.compose.foundation.lazy.TransformingLazyColumnScope
import androidx.wear.compose.foundation.lazy.rememberTransformingLazyColumnState
import androidx.wear.compose.material3.AppScaffold
import androidx.wear.compose.material3.Card
import androidx.wear.compose.material3.CardDefaults
import androidx.wear.compose.material3.ColorScheme
import androidx.wear.compose.material3.EdgeButton
import androidx.wear.compose.material3.Icon
import androidx.wear.compose.material3.ListHeader
import androidx.wear.compose.material3.ListHeaderDefaults
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.ScreenScaffold
import androidx.wear.compose.material3.SurfaceTransformation
import androidx.wear.compose.material3.Text
import androidx.wear.compose.material3.dynamicColorScheme
import androidx.wear.compose.material3.lazy.TransformationSpec
import androidx.wear.compose.material3.lazy.rememberTransformationSpec
import androidx.wear.compose.material3.lazy.transformedHeight
import club.leanmuscle.boji.shared.companion.CompanionSnapshot
import club.leanmuscle.boji.wear.R
import club.leanmuscle.boji.wear.data.ConnectionState
import club.leanmuscle.boji.wear.data.Presentation
import club.leanmuscle.boji.wear.data.WatchState
import java.time.Instant
import java.time.ZoneId
import java.util.Date
import kotlinx.coroutines.delay

/** The watch app with its view model. */
@Composable
fun WatchApp(viewModel: WatchViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var resumes by remember { mutableIntStateOf(0) }
    LifecycleResumeEffect(viewModel) {
        resumes++
        viewModel.onForeground()
        onPauseOrDispose { viewModel.onBackground() }
    }
    val now = rememberMinuteClock(resumes)
    WatchTheme {
        AppScaffold {
            WatchScreen(state = state, now = now, zone = ZoneId.systemDefault(), onRefresh = viewModel::refresh)
        }
    }
}

/** Wear OS 6 wallpaper colors when the watch offers them, otherwise the Material 3 defaults. */
@Composable
fun WatchTheme(content: @Composable () -> Unit) {
    val context = LocalContext.current
    val colors = remember(context) { dynamicColorScheme(context) ?: ColorScheme() }
    MaterialTheme(colorScheme = colors, content = content)
}

/**
 * The current time, updated at each full minute and when the screen appears again, like the iOS
 * `TimelineView(.periodic(by: 60))`. A snapshot from yesterday disappears at midnight without input.
 */
@Composable
private fun rememberMinuteClock(key: Int): Instant {
    val now by produceState(Instant.now(), key) {
        value = Instant.now()
        while (true) {
            delay(MINUTE_MILLIS - System.currentTimeMillis() % MINUTE_MILLIS)
            value = Instant.now()
        }
    }
    return now
}

private const val MINUTE_MILLIS = 60_000L

@Composable
fun WatchScreen(
    state: WatchState,
    now: Instant,
    zone: ZoneId,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val columnState = rememberTransformingLazyColumnState()
    val spec = rememberTransformationSpec()
    ScreenScaffold(
        scrollState = columnState,
        modifier = modifier,
        edgeButton = {
            EdgeButton(
                onClick = onRefresh,
                enabled = state.canRequest,
                modifier = Modifier
                    .scrollable(columnState, Orientation.Vertical, reverseDirection = true, overscrollEffect = rememberOverscrollEffect())
                    .testTag("watch_refresh"),
            ) {
                Icon(painterResource(R.drawable.ic_refresh), contentDescription = stringResource(R.string.watch_refresh))
            }
        },
    ) { contentPadding ->
        TransformingLazyColumn(state = columnState, contentPadding = contentPadding) {
            item {
                ListHeader(
                    modifier = Modifier
                        .fillMaxWidth()
                        .transformedHeight(this, spec)
                        .minimumVerticalContentPadding(ListHeaderDefaults.minimumTopListContentPadding)
                        .semantics { heading() },
                    transformation = SurfaceTransformation(spec),
                ) {
                    Text(stringResource(R.string.watch_title))
                }
            }
            item { ConnectionNotice(state.connection, Modifier.fillMaxWidth().transformedHeight(this, spec)) }
            when (val presentation = state.presentation(now, zone)) {
                is Presentation.Current -> currentProgress(presentation.snapshot, spec)
                Presentation.SharingDisabled -> item {
                    MessageCard(R.string.watch_sharing_off, R.string.watch_turn_on_sharing, spec, "watch_sharing_off")
                }
                Presentation.NoData -> item {
                    MessageCard(R.string.watch_no_data, R.string.watch_turn_on_sharing, spec, "watch_no_data")
                }
                Presentation.Stale -> item {
                    MessageCard(R.string.watch_stale, R.string.watch_stale_detail, spec, "watch_stale")
                }
            }
        }
    }
}

private fun TransformingLazyColumnScope.currentProgress(
    snapshot: CompanionSnapshot,
    spec: TransformationSpec,
) {
    if (snapshot.planTitle.isNotEmpty()) {
        item {
            Card(
                modifier = Modifier.cardModifier(this, spec, CardDefaults.minimumVerticalListContentPadding)
                    .semantics(mergeDescendants = true) {}
                    .testTag("watch_plan"),
                transformation = SurfaceTransformation(spec),
            ) {
                Text(stringResource(R.string.watch_plan), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(snapshot.planTitle, style = MaterialTheme.typography.titleMedium, maxLines = 2, overflow = TextOverflow.Ellipsis)
            }
        }
    }
    item { CheckInCard(R.string.watch_training, snapshot.trainingCompleted, spec, "watch_training") }
    item { CheckInCard(R.string.watch_water, snapshot.waterLogged, spec, "watch_water") }
    item { CheckInCard(R.string.watch_sleep, snapshot.sleepLogged, spec, "watch_sleep") }
    item {
        val context = LocalContext.current
        // The watch's own 12 or 24 hour setting, like `.shortened` on iOS.
        val time = remember(snapshot.generatedAt, context) { DateFormat.getTimeFormat(context).format(Date.from(snapshot.generatedAt)) }
        Text(
            stringResource(R.string.watch_synced, time),
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.fillMaxWidth().transformedHeight(this, spec).padding(horizontal = 12.dp).testTag("watch_synced"),
        )
    }
}

@Composable
private fun ConnectionNotice(connection: ConnectionState, modifier: Modifier = Modifier) {
    val (icon, label) = when (connection) {
        ConnectionState.Starting -> R.drawable.ic_phone to R.string.watch_connecting
        ConnectionState.Requesting -> R.drawable.ic_refresh to R.string.watch_requesting
        ConnectionState.Offline -> R.drawable.ic_phone_off to R.string.watch_offline
        ConnectionState.Ready -> R.drawable.ic_phone to R.string.watch_connected
        ConnectionState.Unavailable -> R.drawable.ic_warning to R.string.watch_unavailable
        ConnectionState.Failed -> R.drawable.ic_warning to R.string.watch_failed
    }
    Column(
        modifier = modifier.padding(horizontal = 12.dp).semantics(mergeDescendants = true) {}.testTag("watch_connection"),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            Icon(painterResource(icon), contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(
                stringResource(label),
                style = MaterialTheme.typography.labelSmall,
                fontWeight = if (connection == ConnectionState.Offline) FontWeight.SemiBold else null,
                color = if (connection == ConnectionState.Offline) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        if (connection == ConnectionState.Offline) {
            Text(
                stringResource(R.string.watch_offline_detail),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

/** One check-in, read by TalkBack as one item: name and state. */
@Composable
private fun TransformingLazyColumnItemScope.CheckInCard(
    @StringRes title: Int,
    logged: Boolean,
    spec: TransformationSpec,
    tag: String,
) {
    Card(
        modifier = Modifier.cardModifier(this, spec, CardDefaults.minimumVerticalListContentPadding)
            .semantics(mergeDescendants = true) {}
            .testTag(tag),
        transformation = SurfaceTransformation(spec),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Icon(
                painterResource(if (logged) R.drawable.ic_check_circle else R.drawable.ic_circle),
                contentDescription = null,
                tint = if (logged) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(20.dp),
            )
            Text(stringResource(title), style = MaterialTheme.typography.titleSmall, modifier = Modifier.weight(1f))
            Text(
                stringResource(if (logged) R.string.watch_logged else R.string.watch_not_logged),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun TransformingLazyColumnItemScope.MessageCard(
    @StringRes title: Int,
    @StringRes detail: Int,
    spec: TransformationSpec,
    tag: String,
) {
    Card(
        modifier = Modifier.cardModifier(this, spec, CardDefaults.minimumVerticalListContentPadding)
            .semantics(mergeDescendants = true) {}
            .testTag(tag),
        transformation = SurfaceTransformation(spec),
    ) {
        Text(stringResource(title), style = MaterialTheme.typography.titleSmall)
        Text(stringResource(detail), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

/** Full width, with the list's scaling and the minimum list padding of a card. */
private fun Modifier.cardModifier(scope: TransformingLazyColumnItemScope, spec: TransformationSpec, padding: Dp): Modifier =
    with(scope) {
        fillMaxWidth()
            .transformedHeight(scope, spec)
            .minimumVerticalContentPadding(padding)
    }
