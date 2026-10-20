package club.leanmuscle.boji.feature.today

import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import club.leanmuscle.boji.feature.entry.DailyEntryActions
import androidx.annotation.DrawableRes
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.model.BojiSnapshot
import club.leanmuscle.boji.core.model.Workout
import club.leanmuscle.boji.feature.entry.DailyEntrySheet
import club.leanmuscle.boji.feature.entry.DailySheet
import club.leanmuscle.boji.feature.training.WorkoutCard
import club.leanmuscle.boji.ui.components.BojiCard
import club.leanmuscle.boji.ui.components.BojiScaffold
import club.leanmuscle.boji.ui.components.FootNote
import club.leanmuscle.boji.ui.components.PageColumn
import club.leanmuscle.boji.ui.components.PageHeading
import club.leanmuscle.boji.ui.components.SectionHeading
import club.leanmuscle.boji.ui.components.formatLongDay
import club.leanmuscle.boji.ui.components.formatOneDecimal
import club.leanmuscle.boji.ui.theme.BojiThemeColors

/** Font scale from which side-by-side cards stack vertically. */
private const val LARGE_FONT_SCALE = 1.5f

@Composable
fun TodayScreen(
    snapshot: BojiSnapshot,
    entryActions: DailyEntryActions,
    onOpenWorkout: (Workout) -> Unit,
    onOpenSettings: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var sheet by rememberSaveable { mutableStateOf<DailySheet?>(null) }
    BojiScaffold(
        title = stringResource(R.string.app_title),
        modifier = modifier.testTag("screen_Today"),
        actions = {
            IconButton(onClick = onOpenSettings, modifier = Modifier.testTag("open_settings")) {
                Icon(painterResource(R.drawable.ic_account_circle), contentDescription = stringResource(R.string.action_settings))
            }
        },
    ) { padding ->
        PageColumn(modifier = Modifier.padding(padding)) {
            PageHeading(
                eyebrow = formatLongDay(snapshot.today),
                title = stringResource(R.string.today_title),
                subtitle = stringResource(R.string.today_subtitle),
            )
            RhythmCard(snapshot)
            SectionHeading(stringResource(R.string.today_habits_title), stringResource(R.string.today_habits_detail))
            HabitCards(snapshot, onOpen = { sheet = it })
            SectionHeading(stringResource(R.string.today_recommend_title), stringResource(R.string.today_recommend_detail))
            val workout = snapshot.recommendedWorkout
            WorkoutCard(workout = workout, onClick = { onOpenWorkout(workout) }, modifier = Modifier.testTag("recommended_workout"))
            FootNote(
                text = stringResource(R.string.today_rest_note),
                icon = R.drawable.ic_eco,
                iconTint = BojiThemeColors.current.calm,
            )
        }
    }
    sheet?.let { kind ->
        DailyEntrySheet(kind = kind, snapshot = snapshot, actions = entryActions, onDismiss = { sheet = null })
    }
}

@Composable
private fun RhythmCard(snapshot: BojiSnapshot) {
    val record = snapshot.todayRecord
    val count = snapshot.todayTaskCount
    val colors = BojiThemeColors.current
    val habits = listOf(
        Habit(stringResource(R.string.habit_move), MaterialTheme.colorScheme.primary, record.completedWorkoutIDs.isNotEmpty()),
        Habit(stringResource(R.string.habit_water), colors.water, record.waterML > 0),
        Habit(stringResource(R.string.habit_sleep), colors.sleep, record.sleepHours != null),
    )
    val total = BojiSnapshot.TODAY_TASK_TOTAL
    val summary = stringResource(R.string.today_rhythm_a11y, count, total)
    BojiCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(
                modifier = Modifier.weight(1f).semantics(mergeDescendants = true) {},
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Icon(
                        painterResource(R.drawable.ic_auto_awesome),
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(18.dp),
                    )
                    Text(stringResource(R.string.today_rhythm), style = MaterialTheme.typography.labelLarge)
                }
                Row(
                    verticalAlignment = Alignment.Bottom,
                    modifier = Modifier.clearAndSetSemantics { contentDescription = summary },
                ) {
                    Text("$count", style = MaterialTheme.typography.displayMedium, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(6.dp))
                    Text(
                        stringResource(R.string.today_rhythm_total, total),
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 8.dp),
                    )
                }
                Text(
                    text = stringResource(
                        when (count) {
                            0 -> R.string.today_rhythm_none
                            total -> R.string.today_rhythm_all
                            else -> R.string.today_rhythm_some
                        },
                    ),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    habits.forEach { HabitDot(it) }
                }
            }
            HabitRings(habits = habits, allDone = count == total)
        }
    }
}

private data class Habit(val label: String, val color: Color, val done: Boolean)

@Composable
private fun HabitDot(habit: Habit) {
    val status = stringResource(if (habit.done) R.string.habit_recorded else R.string.habit_not_recorded)
    val description = stringResource(R.string.habit_status, habit.label, status)
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(5.dp),
        modifier = Modifier.clearAndSetSemantics { contentDescription = description },
    ) {
        Box(
            Modifier
                .size(8.dp)
                .background(if (habit.done) habit.color else habit.color.copy(alpha = 0.25f), CircleShape),
        )
        Text(habit.label, style = MaterialTheme.typography.labelMedium)
    }
}

/** Three concentric rings, one per habit. Each ring is either empty or full. */
@Composable
private fun HabitRings(habits: List<Habit>, allDone: Boolean) {
    val progress = habits.map { habit ->
        animateFloatAsState(targetValue = if (habit.done) 1f else 0f, label = "ring_${habit.label}").value
    }
    val centerColor = BojiThemeColors.current.calm
    Box(Modifier.size(128.dp).clearAndSetSemantics {}, contentAlignment = Alignment.Center) {
        Canvas(Modifier.matchParentSize()) {
            val stroke = 9.dp.toPx()
            habits.forEachIndexed { index, habit ->
                val diameter = (128 - index * 28).dp.toPx() - stroke
                val topLeft = Offset((size.width - diameter) / 2, (size.height - diameter) / 2)
                val arcSize = Size(diameter, diameter)
                drawArc(habit.color.copy(alpha = 0.14f), 0f, 360f, false, topLeft, arcSize, style = Stroke(stroke))
                drawArc(
                    color = habit.color,
                    startAngle = -90f,
                    sweepAngle = 360f * progress[index],
                    useCenter = false,
                    topLeft = topLeft,
                    size = arcSize,
                    style = Stroke(stroke, cap = StrokeCap.Round),
                )
            }
        }
        Icon(
            painterResource(if (allDone) R.drawable.ic_check else R.drawable.ic_eco),
            contentDescription = null,
            tint = centerColor,
            modifier = Modifier.size(24.dp),
        )
    }
}

@Composable
private fun HabitCards(snapshot: BojiSnapshot, onOpen: (DailySheet) -> Unit) {
    val record = snapshot.todayRecord
    val colors = BojiThemeColors.current
    val water: @Composable (Modifier) -> Unit = { modifier ->
        HabitCard(
            title = stringResource(R.string.habit_water_title),
            icon = R.drawable.ic_water_drop,
            color = colors.water,
            value = "${record.waterML}",
            unit = stringResource(R.string.unit_ml),
            onClick = { onOpen(DailySheet.Water) },
            modifier = modifier.testTag("habit_water"),
        )
    }
    val sleep: @Composable (Modifier) -> Unit = { modifier ->
        HabitCard(
            title = stringResource(R.string.habit_sleep_title),
            icon = R.drawable.ic_bedtime,
            color = colors.sleep,
            value = record.sleepHours?.let { formatOneDecimal(it) } ?: "—",
            unit = stringResource(R.string.unit_hours),
            onClick = { onOpen(DailySheet.Sleep) },
            modifier = modifier.testTag("habit_sleep"),
        )
    }
    if (LocalDensity.current.fontScale >= LARGE_FONT_SCALE) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            water(Modifier)
            sleep(Modifier)
        }
    } else {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            water(Modifier.weight(1f))
            sleep(Modifier.weight(1f))
        }
    }
}

@Composable
private fun HabitCard(
    title: String,
    @DrawableRes icon: Int,
    color: Color,
    value: String,
    unit: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val description = stringResource(R.string.habit_card_a11y, title, value, unit)
    BojiCard(
        onClick = onClick,
        modifier = modifier.semantics { contentDescription = description },
        contentPadding = androidx.compose.foundation.layout.PaddingValues(18.dp),
    ) {
        Column(Modifier.clearAndSetSemantics {}, verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Icon(painterResource(icon), contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
                Text(title, style = MaterialTheme.typography.titleSmall)
            }
            Row(verticalAlignment = Alignment.Bottom) {
                Text(value, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
                Spacer(Modifier.width(4.dp))
                Text(
                    unit,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(bottom = 5.dp),
                )
            }
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(stringResource(R.string.habit_log), style = MaterialTheme.typography.labelLarge, color = color)
                Icon(painterResource(R.drawable.ic_add_circle), contentDescription = null, tint = color, modifier = Modifier.size(18.dp))
            }
        }
    }
}

/** 今天 with its view model. Shows nothing until state.json has been read. */
@Composable
fun TodayScreen(
    onOpenWorkout: (Workout) -> Unit,
    onOpenSettings: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: TodayViewModel = hiltViewModel(),
) {
    val snapshot by viewModel.snapshot.collectAsStateWithLifecycle()
    snapshot?.let { TodayScreen(it, viewModel, onOpenWorkout, onOpenSettings, modifier) }
}
