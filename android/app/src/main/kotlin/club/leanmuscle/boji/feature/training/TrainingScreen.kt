package club.leanmuscle.boji.feature.training

import androidx.annotation.DrawableRes
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.data.BojiStore
import club.leanmuscle.boji.core.model.BojiSnapshot
import club.leanmuscle.boji.core.model.PlanKind
import club.leanmuscle.boji.core.model.Workout
import club.leanmuscle.boji.core.model.WorkoutLibrary
import club.leanmuscle.boji.ui.components.BojiCard
import club.leanmuscle.boji.ui.components.BojiLocale
import club.leanmuscle.boji.ui.components.BojiScaffold
import club.leanmuscle.boji.ui.components.ContentMaxWidth
import club.leanmuscle.boji.ui.components.FootNote
import club.leanmuscle.boji.ui.components.PageColumn
import club.leanmuscle.boji.ui.components.PageHeading
import club.leanmuscle.boji.ui.components.PrimaryButton
import club.leanmuscle.boji.ui.components.SectionHeading
import club.leanmuscle.boji.ui.components.SymbolTile
import club.leanmuscle.boji.ui.components.iconRes
import club.leanmuscle.boji.ui.components.titleRes
import club.leanmuscle.boji.ui.theme.BojiThemeColors

@Composable
fun TrainingScreen(
    snapshot: BojiSnapshot,
    store: BojiStore,
    onOpenWorkout: (Workout) -> Unit,
    modifier: Modifier = Modifier,
) {
    BojiScaffold(title = stringResource(R.string.tab_training), modifier = modifier.testTag("screen_Training")) { padding ->
        PageColumn(modifier = Modifier.padding(padding)) {
            PageHeading(
                eyebrow = stringResource(R.string.training_eyebrow),
                title = stringResource(R.string.training_title),
                subtitle = stringResource(R.string.training_subtitle),
            )
            PlanPicker(selected = snapshot.state.selectedPlan, onSelect = store::setSelectedPlan)
            val workout = snapshot.recommendedWorkout
            WorkoutCard(workout = workout, onClick = { onOpenWorkout(workout) })
            BojiCard {
                SectionHeading(stringResource(R.string.training_rhythm_title), stringResource(R.string.training_rhythm_detail))
                Spacer(Modifier.height(16.dp))
                FootNote(stringResource(R.string.training_tip_schedule), icon = R.drawable.ic_calendar, iconTint = MaterialTheme.colorScheme.primary)
                HorizontalDivider(Modifier.padding(vertical = 14.dp))
                FootNote(stringResource(R.string.training_tip_load), icon = R.drawable.ic_self_improvement, iconTint = MaterialTheme.colorScheme.primary)
            }
            SectionHeading(stringResource(R.string.training_progression_section), detail = null)
            val progression = WorkoutLibrary.HomeIntermediate
            CourseRow(
                workout = progression,
                icon = R.drawable.ic_fitness_center,
                color = MaterialTheme.colorScheme.primary,
                detail = stringResource(R.string.training_progression_meta, progression.minutes, progression.exercises.size),
                onClick = { onOpenWorkout(progression) },
                modifier = Modifier.testTag("progression_workout"),
            )
            SectionHeading(stringResource(R.string.training_mobility_section), detail = null)
            val mobility = WorkoutLibrary.Mobility
            CourseRow(
                workout = mobility,
                icon = R.drawable.ic_sports_gymnastics,
                color = BojiThemeColors.current.calm,
                detail = stringResource(R.string.training_mobility_meta, mobility.minutes),
                onClick = { onOpenWorkout(mobility) },
                modifier = Modifier.testTag("mobility_workout"),
            )
            FootNote(stringResource(R.string.training_disclaimer), icon = R.drawable.ic_health_and_safety)
        }
    }
}

/** One-line course entry on the training page. */
@Composable
private fun CourseRow(
    workout: Workout,
    @DrawableRes icon: Int,
    color: Color,
    detail: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    BojiCard(onClick = onClick, contentPadding = PaddingValues(16.dp), modifier = modifier) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            SymbolTile(icon = icon, color = color)
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(workout.title, style = MaterialTheme.typography.titleMedium)
                Text(
                    detail,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Icon(painterResource(R.drawable.ic_chevron_right), contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun PlanPicker(selected: PlanKind, onSelect: (PlanKind) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(stringResource(R.string.training_plan_label), style = MaterialTheme.typography.labelLarge)
        SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
            PlanKind.entries.forEachIndexed { index, plan ->
                SegmentedButton(
                    selected = plan == selected,
                    onClick = { onSelect(plan) },
                    shape = SegmentedButtonDefaults.itemShape(index, PlanKind.entries.size),
                    modifier = Modifier.testTag("plan_picker_${plan.name}"),
                ) { Text(stringResource(plan.titleRes)) }
            }
        }
    }
}

@Composable
fun WorkoutDetailScreen(
    workout: Workout,
    completedToday: Boolean,
    onBack: () -> Unit,
    onStart: () -> Unit,
    modifier: Modifier = Modifier,
) {
    BojiScaffold(
        title = workout.title,
        modifier = modifier.testTag("screen_WorkoutDetail"),
        onBack = onBack,
        bottomBar = {
            Surface(color = MaterialTheme.colorScheme.background) {
                Box(Modifier.fillMaxWidth().navigationBarsPadding(), contentAlignment = Alignment.Center) {
                    PrimaryButton(
                        text = stringResource(if (completedToday) R.string.detail_again else R.string.detail_start),
                        icon = R.drawable.ic_play,
                        onClick = onStart,
                        modifier = Modifier
                            .padding(horizontal = 20.dp, vertical = 12.dp)
                            .widthIn(max = ContentMaxWidth)
                            .testTag("start_workout"),
                    )
                }
            }
        },
    ) { padding ->
        PageColumn(modifier = Modifier.padding(padding), spacing = 20.dp) {
            WorkoutCard(workout = workout, modifier = Modifier.clearAndSetSemantics {})
            BojiCard(contentPadding = PaddingValues(vertical = 16.dp, horizontal = 12.dp)) {
                Row(Modifier.fillMaxWidth()) {
                    Metric("${workout.minutes}", stringResource(R.string.detail_minutes), Modifier.weight(1f))
                    Metric("${workout.exercises.size}", stringResource(R.string.detail_exercises), Modifier.weight(1f))
                    Metric(workout.level, stringResource(R.string.detail_level), Modifier.weight(1f))
                }
            }
            Text(workout.subtitle, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
            SectionHeading(stringResource(R.string.detail_plan_title), stringResource(R.string.detail_plan_detail))
            workout.exercises.forEachIndexed { index, exercise ->
                BojiCard(contentPadding = PaddingValues(16.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                        Text(
                            text = String.format(BojiLocale, "%02d", index + 1),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary,
                        )
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                            Text(exercise.name, style = MaterialTheme.typography.titleMedium)
                            Text(
                                stringResource(R.string.detail_exercise_sets, exercise.sets, exercise.reps),
                                style = MaterialTheme.typography.labelLarge,
                                color = MaterialTheme.colorScheme.primary,
                            )
                            Text(exercise.tip, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Icon(
                            painterResource(exercise.icon.iconRes),
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(22.dp),
                        )
                    }
                }
            }
            FootNote(stringResource(R.string.detail_warmup), icon = R.drawable.ic_health_and_safety, iconTint = MaterialTheme.colorScheme.primary)
        }
    }
}

@Composable
private fun Metric(value: String, label: String, modifier: Modifier = Modifier) {
    Column(modifier = modifier.semantics(mergeDescendants = true) {}, horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
