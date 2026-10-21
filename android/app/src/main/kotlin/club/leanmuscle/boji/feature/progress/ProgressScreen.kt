package club.leanmuscle.boji.feature.progress

import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import club.leanmuscle.boji.feature.entry.DailyEntryActions
import android.content.Intent
import androidx.annotation.DrawableRes
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FilledTonalIconButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.model.BodyEntry
import club.leanmuscle.boji.core.model.BojiSnapshot
import club.leanmuscle.boji.feature.entry.DailyEntrySheet
import club.leanmuscle.boji.feature.entry.DailySheet
import club.leanmuscle.boji.feature.health.HealthSummaryCard
import club.leanmuscle.boji.ui.components.BojiCard
import club.leanmuscle.boji.ui.components.BojiScaffold
import club.leanmuscle.boji.ui.components.EmptyNote
import club.leanmuscle.boji.ui.components.FootNote
import club.leanmuscle.boji.ui.components.PageColumn
import club.leanmuscle.boji.ui.components.PageHeading
import club.leanmuscle.boji.ui.components.SectionHeading
import club.leanmuscle.boji.ui.components.SymbolTile
import club.leanmuscle.boji.ui.components.formatMediumDate
import club.leanmuscle.boji.ui.components.formatNarrowWeekday
import club.leanmuscle.boji.ui.components.formatOneDecimal
import club.leanmuscle.boji.ui.theme.BojiThemeColors
import java.time.ZoneId

private enum class BodyMetric { Weight, Waist }

private const val VISIBLE_ENTRIES = 5

@Composable
fun ProgressScreen(
    snapshot: BojiSnapshot,
    entryActions: DailyEntryActions,
    onDeleteBodyEntry: (String) -> Unit,
    modifier: Modifier = Modifier,
    healthSummary: @Composable () -> Unit = {},
) {
    var showBodySheet by rememberSaveable { mutableStateOf(false) }
    BojiScaffold(title = stringResource(R.string.tab_progress), modifier = modifier.testTag("screen_Progress")) { padding ->
        PageColumn(modifier = Modifier.padding(padding)) {
            PageHeading(
                eyebrow = stringResource(R.string.progress_eyebrow),
                title = stringResource(R.string.progress_title),
                subtitle = stringResource(R.string.progress_subtitle),
            )
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                StatCard(
                    icon = R.drawable.ic_fitness_center,
                    color = MaterialTheme.colorScheme.primary,
                    value = snapshot.totalWorkouts,
                    unit = stringResource(R.string.unit_times),
                    title = stringResource(R.string.progress_total_workouts),
                    modifier = Modifier.weight(1f),
                )
                StatCard(
                    icon = R.drawable.ic_eco,
                    color = BojiThemeColors.current.calm,
                    value = snapshot.activeDays,
                    unit = stringResource(R.string.unit_days),
                    title = stringResource(R.string.progress_active_days),
                    modifier = Modifier.weight(1f),
                )
            }
            WeekCard(snapshot)
            healthSummary()
            SectionHeading(stringResource(R.string.progress_body_title), detail = null) {
                TextButton(onClick = { showBodySheet = true }, modifier = Modifier.testTag("add_body_entry")) {
                    Icon(painterResource(R.drawable.ic_add), contentDescription = null, modifier = Modifier.size(18.dp))
                    Text(stringResource(R.string.progress_body_add), modifier = Modifier.padding(start = 4.dp))
                }
            }
            BodyCard(entries = snapshot.bodyEntriesByDate, zone = snapshot.zone, onDelete = onDeleteBodyEntry)
            ShareCard(totalWorkouts = snapshot.totalWorkouts, activeDays = snapshot.activeDays)
        }
    }
    if (showBodySheet) {
        DailyEntrySheet(kind = DailySheet.Body, snapshot = snapshot, actions = entryActions, onDismiss = { showBodySheet = false })
    }
}

@Composable
private fun StatCard(@DrawableRes icon: Int, color: Color, value: Int, unit: String, title: String, modifier: Modifier = Modifier) {
    BojiCard(modifier = modifier.semantics(mergeDescendants = true) {}, contentPadding = PaddingValues(18.dp)) {
        Icon(painterResource(icon), contentDescription = null, tint = color, modifier = Modifier.size(22.dp))
        Spacer(Modifier.height(12.dp))
        Row(verticalAlignment = Alignment.Bottom) {
            Text("$value", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Bold)
            Spacer(Modifier.width(4.dp))
            Text(unit, style = MaterialTheme.typography.labelMedium, modifier = Modifier.padding(bottom = 6.dp))
        }
        Text(title, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun WeekCard(snapshot: BojiSnapshot) {
    val accent = MaterialTheme.colorScheme.primary
    BojiCard {
        SectionHeading(stringResource(R.string.progress_week_title), stringResource(R.string.progress_week_detail))
        Spacer(Modifier.height(16.dp))
        Row(Modifier.fillMaxWidth()) {
            snapshot.weekRecords.forEach { record ->
                val day = record.localDate(snapshot.zone)
                val active = record.isActive
                val description = stringResource(
                    if (active) R.string.progress_week_day_active else R.string.progress_week_day_empty,
                    formatMediumDate(day),
                )
                Column(
                    modifier = Modifier.weight(1f).clearAndSetSemantics { contentDescription = description },
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text(formatNarrowWeekday(day), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .background(if (active) accent else accent.copy(alpha = 0.07f), CircleShape),
                        contentAlignment = Alignment.Center,
                    ) {
                        if (active) {
                            Icon(
                                painterResource(R.drawable.ic_check),
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onPrimary,
                                modifier = Modifier.size(16.dp),
                            )
                        } else {
                            Text("${day.dayOfMonth}", style = MaterialTheme.typography.labelMedium)
                        }
                    }
                    Box(
                        Modifier
                            .size(4.dp)
                            .background(if (day == snapshot.today) accent else Color.Transparent, CircleShape),
                    )
                }
            }
        }
        Spacer(Modifier.height(14.dp))
        FootNote(stringResource(R.string.progress_week_note))
    }
}

@Composable
private fun BodyCard(entries: List<BodyEntry>, zone: ZoneId, onDelete: (String) -> Unit) {
    var metric by rememberSaveable { mutableStateOf(BodyMetric.Weight) }
    val unit = stringResource(if (metric == BodyMetric.Weight) R.string.unit_kg else R.string.unit_cm)
    val valueOf: (BodyEntry) -> Double = { if (metric == BodyMetric.Weight) it.weight else it.waist }
    BojiCard {
        SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
            BodyMetric.entries.forEachIndexed { index, option ->
                SegmentedButton(
                    selected = option == metric,
                    onClick = { metric = option },
                    shape = SegmentedButtonDefaults.itemShape(index, BodyMetric.entries.size),
                ) {
                    Text(stringResource(if (option == BodyMetric.Weight) R.string.progress_metric_weight else R.string.progress_metric_waist))
                }
            }
        }
        if (entries.isEmpty()) {
            EmptyNote(
                icon = R.drawable.ic_monitoring,
                title = stringResource(R.string.progress_empty_title),
                text = stringResource(R.string.progress_empty_text),
            )
            return@BojiCard
        }
        Spacer(Modifier.height(18.dp))
        Row(verticalAlignment = Alignment.Bottom, modifier = Modifier.semantics(mergeDescendants = true) {}) {
            Text(formatOneDecimal(valueOf(entries.last())), style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Bold)
            Spacer(Modifier.width(6.dp))
            Text(unit, style = MaterialTheme.typography.titleSmall, modifier = Modifier.padding(bottom = 6.dp))
            Spacer(Modifier.weight(1f))
            Text(
                stringResource(R.string.progress_latest),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 6.dp),
            )
        }
        Spacer(Modifier.height(12.dp))
        val chartLabel = pluralStringResource(R.plurals.progress_chart_a11y, entries.size, entries.size)
        val trend = remember(entries, zone, metric) { bodyTrend(entries, zone, valueOf) }
        if (trend != null) {
            BodyTrendChart(
                trend = trend,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(170.dp)
                    .testTag("body_trend_chart")
                    .clearAndSetSemantics { contentDescription = chartLabel },
            )
        }
        Spacer(Modifier.height(8.dp))
        entries.asReversed().take(VISIBLE_ENTRIES).forEach { entry ->
            HorizontalDivider()
            EntryRow(
                date = formatMediumDate(entry.date.atZone(zone).toLocalDate()),
                value = stringResource(R.string.progress_entry_value, formatOneDecimal(valueOf(entry)), unit),
                onDelete = { onDelete(entry.id) },
            )
        }
    }
}

@Composable
private fun EntryRow(date: String, value: String, onDelete: () -> Unit) {
    var menuOpen by remember { mutableStateOf(false) }
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Text(date, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
        Text(value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
        Box {
            IconButton(onClick = { menuOpen = true }) {
                Icon(painterResource(R.drawable.ic_more_horiz), contentDescription = stringResource(R.string.progress_entry_manage, date))
            }
            DropdownMenu(expanded = menuOpen, onDismissRequest = { menuOpen = false }) {
                DropdownMenuItem(
                    text = { Text(stringResource(R.string.progress_entry_delete), color = MaterialTheme.colorScheme.error) },
                    leadingIcon = { Icon(painterResource(R.drawable.ic_delete), contentDescription = null, tint = MaterialTheme.colorScheme.error) },
                    onClick = {
                        menuOpen = false
                        onDelete()
                    },
                )
            }
        }
    }
}

@Composable
private fun ShareCard(totalWorkouts: Int, activeDays: Int) {
    val context = LocalContext.current
    val text = stringResource(
        R.string.progress_share_text,
        pluralStringResource(R.plurals.progress_share_workouts, totalWorkouts, totalWorkouts),
        pluralStringResource(R.plurals.progress_share_days, activeDays, activeDays),
    )
    val chooserTitle = stringResource(R.string.progress_share_title)
    BojiCard(contentPadding = PaddingValues(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            SymbolTile(icon = R.drawable.ic_share, color = BojiThemeColors.current.calm)
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(stringResource(R.string.progress_share_title), style = MaterialTheme.typography.titleMedium)
                Text(
                    stringResource(R.string.progress_share_subtitle),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            FilledTonalIconButton(
                onClick = {
                    val send = Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text)
                    context.startActivity(Intent.createChooser(send, chooserTitle))
                },
                modifier = Modifier.testTag("share_progress"),
            ) {
                Icon(painterResource(R.drawable.ic_share), contentDescription = stringResource(R.string.progress_share_a11y))
            }
        }
    }
}

/** 足迹 with its view model. Shows nothing until state.json has been read. */
@Composable
fun ProgressScreen(onOpenHealth: () -> Unit, modifier: Modifier = Modifier, viewModel: ProgressViewModel = hiltViewModel()) {
    val snapshot by viewModel.snapshot.collectAsStateWithLifecycle()
    snapshot?.let {
        ProgressScreen(it, viewModel, viewModel::deleteBodyEntry, modifier, healthSummary = { HealthSummaryCard(onOpen = onOpenHealth) })
    }
}
