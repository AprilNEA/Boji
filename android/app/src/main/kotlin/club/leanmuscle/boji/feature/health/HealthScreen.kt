package club.leanmuscle.boji.feature.health

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.icu.text.ListFormatter
import android.text.format.DateFormat
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.net.toUri
import androidx.health.connect.client.HealthConnectClient
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.health.HealthAvailability
import club.leanmuscle.boji.core.health.HealthError
import club.leanmuscle.boji.core.health.HealthPermissions
import club.leanmuscle.boji.core.health.HealthSnapshot
import club.leanmuscle.boji.core.health.HealthState
import club.leanmuscle.boji.core.health.HealthWeight
import club.leanmuscle.boji.ui.components.BojiCard
import club.leanmuscle.boji.ui.components.BojiScaffold
import club.leanmuscle.boji.ui.components.CardShape
import club.leanmuscle.boji.ui.components.FootNote
import club.leanmuscle.boji.ui.components.PageColumn
import club.leanmuscle.boji.ui.components.PrimaryButton
import club.leanmuscle.boji.ui.components.SymbolTile
import club.leanmuscle.boji.ui.components.formatOneDecimal
import club.leanmuscle.boji.ui.components.textLocale
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.TemporalAccessor

private const val VISIBLE_WEIGHTS = 20
private const val VISIBLE_SLEEP_DAYS = 7L

/** Health Connect page with its view model. Opening it refreshes a connected source, as on iOS. */
@Composable
fun HealthScreen(onBack: () -> Unit, modifier: Modifier = Modifier, viewModel: HealthViewModel = hiltViewModel()) {
    val health by viewModel.health.collectAsStateWithLifecycle()
    val snapshot by viewModel.snapshot.collectAsStateWithLifecycle()
    val launcher = rememberLauncherForActivityResult(viewModel.permissionContract, viewModel::onPermissionResult)
    LaunchedEffect(Unit) { viewModel.refresh() }
    val zone = snapshot?.zone ?: ZoneId.systemDefault()
    HealthScreen(
        health = health,
        today = snapshot?.today ?: LocalDate.now(zone),
        zone = zone,
        onRequestPermissions = {
            viewModel.clearError()
            launcher.launch(HealthPermissions.all)
        },
        onRefresh = viewModel::refresh,
        onDisconnect = viewModel::disconnect,
        onBack = onBack,
        modifier = modifier,
    )
}

@Composable
fun HealthScreen(
    health: HealthState,
    today: LocalDate,
    zone: ZoneId,
    onRequestPermissions: () -> Unit,
    onRefresh: () -> Unit,
    onDisconnect: () -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var confirmDisconnect by rememberSaveable { mutableStateOf(false) }
    BojiScaffold(title = stringResource(R.string.health_title), modifier = modifier.testTag("screen_Health"), onBack = onBack) { padding ->
        PageColumn(modifier = Modifier.padding(padding), spacing = 20.dp) {
            BojiCard {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                        SymbolTile(R.drawable.ic_health_and_safety, MaterialTheme.colorScheme.primary)
                        Text(
                            stringResource(R.string.health_intro_title),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.weight(1f).semantics { heading() },
                        )
                    }
                    Text(
                        stringResource(R.string.health_intro_text),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    FootNote(stringResource(R.string.health_no_waist))
                }
            }
            HealthSection(stringResource(R.string.health_status_title)) {
                StatusContent(health, zone, onRequestPermissions, onRefresh)
            }
            if (health.enabled) {
                HealthSection(stringResource(R.string.health_values_title)) {
                    HealthValues(health.snapshot, today, zone)
                }
                HealthSection(stringResource(R.string.health_weights_title)) {
                    WeightSamples(health.snapshot, zone)
                }
                HealthSection(stringResource(R.string.health_sleep_title)) {
                    SleepDays(health.snapshot, today, zone)
                }
                TextButton(
                    onClick = { confirmDisconnect = true },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error),
                    modifier = Modifier.fillMaxWidth().testTag("health_disconnect"),
                ) { Text(stringResource(R.string.health_disconnect)) }
            }
            HealthSection(stringResource(R.string.health_share_title)) {
                FootNote(stringResource(R.string.health_share_partial))
                FootNote(stringResource(R.string.health_share_local))
                FootNote(stringResource(R.string.health_share_revoke))
            }
        }
    }
    if (confirmDisconnect) {
        AlertDialog(
            onDismissRequest = { confirmDisconnect = false },
            title = { Text(stringResource(R.string.health_disconnect_title)) },
            text = { Text(stringResource(R.string.health_disconnect_text)) },
            confirmButton = {
                TextButton(
                    onClick = {
                        confirmDisconnect = false
                        onDisconnect()
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error),
                    modifier = Modifier.testTag("health_disconnect_confirm"),
                ) { Text(stringResource(R.string.health_disconnect_confirm)) }
            },
            dismissButton = { TextButton(onClick = { confirmDisconnect = false }) { Text(stringResource(R.string.action_cancel)) } },
        )
    }
}

@Composable
private fun ColumnScope.StatusContent(
    health: HealthState,
    zone: ZoneId,
    onRequestPermissions: () -> Unit,
    onRefresh: () -> Unit,
) {
    val context = LocalContext.current
    when (health.availability) {
        HealthAvailability.Unavailable -> {
            StatusLabel(stringResource(R.string.health_unavailable), R.drawable.ic_health_and_safety)
            FootNote(stringResource(R.string.health_unavailable_text))
        }
        HealthAvailability.UpdateRequired -> {
            StatusLabel(stringResource(R.string.health_update_required), R.drawable.ic_health_and_safety)
            FootNote(stringResource(R.string.health_update_required_text))
            val storeUrl = stringResource(R.string.health_play_store_url)
            OutlinedButton(onClick = { openHealthConnectInStore(context, storeUrl) }, modifier = Modifier.fillMaxWidth().testTag("health_install")) {
                Text(stringResource(R.string.health_install))
            }
        }
        HealthAvailability.Available -> {
            StatusLabel(
                stringResource(if (health.enabled) R.string.health_connected else R.string.health_not_connected),
                if (health.enabled) R.drawable.ic_check_circle else R.drawable.ic_health_and_safety,
            )
            if (!health.enabled) {
                PrimaryButton(
                    text = stringResource(R.string.health_connect),
                    icon = R.drawable.ic_chevron_right,
                    onClick = onRequestPermissions,
                    enabled = !health.loading,
                    modifier = Modifier.testTag("health_connect"),
                )
            } else {
                if (health.missingPermissions.isNotEmpty()) {
                    OutlinedButton(onClick = onRequestPermissions, modifier = Modifier.fillMaxWidth().testTag("health_grant")) {
                        Text(stringResource(R.string.health_grant_missing))
                    }
                }
                OutlinedButton(onClick = onRefresh, enabled = !health.loading, modifier = Modifier.fillMaxWidth().testTag("health_refresh")) {
                    Icon(painterResource(R.drawable.ic_refresh), contentDescription = null, modifier = Modifier.size(18.dp))
                    Text(stringResource(R.string.health_refresh), modifier = Modifier.padding(start = 8.dp))
                }
                OutlinedButton(onClick = { openHealthConnectSettings(context) }, modifier = Modifier.fillMaxWidth().testTag("health_manage")) {
                    Icon(painterResource(R.drawable.ic_settings), contentDescription = null, modifier = Modifier.size(18.dp))
                    Text(stringResource(R.string.health_manage), modifier = Modifier.padding(start = 8.dp))
                }
            }
            if (health.loading) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                    Text(stringResource(R.string.health_loading), style = MaterialTheme.typography.bodyMedium)
                }
            }
            health.lastSyncedAt?.let { FootNote(stringResource(R.string.health_last_synced, formatDateTime(it, zone))) }
            if (health.enabled && HealthPermissions.READ_WEIGHT in health.missingPermissions) {
                FootNote(stringResource(R.string.health_missing_weight), modifier = Modifier.testTag("health_missing_weight"))
            }
            if (health.enabled && HealthPermissions.READ_SLEEP in health.missingPermissions) {
                FootNote(stringResource(R.string.health_missing_sleep), modifier = Modifier.testTag("health_missing_sleep"))
            }
        }
    }
    health.error?.let { error ->
        Text(
            healthErrorMessage(error),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.error,
            modifier = Modifier.testTag("health_error"),
        )
    }
}

@Composable
private fun StatusLabel(text: String, icon: Int) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Icon(painterResource(icon), contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
        Text(text, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.testTag("health_status"))
    }
}

/**
 * Latest weight and latest sleep day. Missing values say so; they are never shown as zero.
 * [mergeRows] is false inside the summary card: the clickable card merges them itself, and a
 * nested merge boundary would keep the values out of what TalkBack reads for the card.
 */
@Composable
private fun HealthValues(snapshot: HealthSnapshot, today: LocalDate, zone: ZoneId, mergeRows: Boolean = true) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        val weight = snapshot.latestWeight()
        ValueRow(
            label = stringResource(R.string.health_latest_weight),
            value = weight?.let { valueWithUnit(formatOneDecimal(it.kilograms), stringResource(R.string.unit_kg)) }
                ?: stringResource(R.string.health_no_data),
            meta = weight?.let { stringResource(R.string.health_sample_meta, it.source, formatMonthDay(it.time.atZone(zone))) },
            merge = mergeRows,
            modifier = Modifier.testTag("health_latest_weight"),
        )
        val sleep = snapshot.sleepHours(today, zone)
        ValueRow(
            label = stringResource(R.string.health_latest_sleep),
            value = sleep?.let { valueWithUnit(formatOneDecimal(it), stringResource(R.string.unit_hours)) }
                ?: stringResource(R.string.health_no_data),
            meta = null,
            merge = mergeRows,
            modifier = Modifier.testTag("health_latest_sleep"),
        )
    }
}

@Composable
private fun WeightSamples(snapshot: HealthSnapshot, zone: ZoneId) {
    val samples = snapshot.weights.sortedWith(compareByDescending<HealthWeight> { it.time }.thenBy { it.id })
    if (samples.isEmpty()) {
        Text(stringResource(R.string.health_no_data), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        return
    }
    val unit = stringResource(R.string.unit_kg)
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        samples.take(VISIBLE_WEIGHTS).forEach { sample ->
            ValueRow(
                label = stringResource(R.string.body_weight),
                value = valueWithUnit(formatOneDecimal(sample.kilograms), unit),
                meta = stringResource(R.string.health_sample_meta, formatDateTime(sample.time, zone), sample.source),
            )
        }
    }
}

@Composable
private fun SleepDays(snapshot: HealthSnapshot, today: LocalDate, zone: ZoneId) {
    val unit = stringResource(R.string.unit_hours)
    val noData = stringResource(R.string.health_no_data)
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        for (offset in 0 until VISIBLE_SLEEP_DAYS) {
            val day = today.minusDays(offset)
            ValueRow(
                label = formatMonthDay(day),
                value = snapshot.sleepHours(day, zone)?.let { valueWithUnit(formatOneDecimal(it), unit) } ?: noData,
                meta = null,
            )
        }
        FootNote(stringResource(R.string.health_sleep_rule))
        val sources = snapshot.sleepSources()
        if (sources.isNotEmpty()) {
            FootNote(stringResource(R.string.health_sources, ListFormatter.getInstance(textLocale).format(sources)))
        }
    }
}

@Composable
private fun ValueRow(label: String, value: String, meta: String?, modifier: Modifier = Modifier, merge: Boolean = true) {
    val semantics = if (merge) Modifier.semantics(mergeDescendants = true) {} else Modifier
    Column(modifier = modifier.fillMaxWidth().then(semantics), verticalArrangement = Arrangement.spacedBy(3.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(label, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
            Text(value, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium)
        }
        if (meta != null) {
            Text(meta, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun HealthSection(title: String, content: @Composable ColumnScope.() -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            title,
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(start = 4.dp).semantics { heading() },
        )
        BojiCard {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp), content = content)
        }
    }
}

/** Card on 今天 and 足迹 while Health Connect is connected, like `HealthSummaryView` on iOS. */
@Composable
fun HealthSummaryCard(onOpen: () -> Unit, modifier: Modifier = Modifier, viewModel: HealthViewModel = hiltViewModel()) {
    val health by viewModel.health.collectAsStateWithLifecycle()
    val snapshot by viewModel.snapshot.collectAsStateWithLifecycle()
    if (!health.enabled) return
    val zone = snapshot?.zone ?: ZoneId.systemDefault()
    HealthSummaryCard(health, snapshot?.today ?: LocalDate.now(zone), zone, onOpen, modifier)
}

@Composable
fun HealthSummaryCard(health: HealthState, today: LocalDate, zone: ZoneId, onOpen: () -> Unit, modifier: Modifier = Modifier) {
    val openLabel = stringResource(R.string.health_summary_open)
    BojiCard(
        modifier = modifier
            .clip(CardShape)
            .clickable(onClickLabel = openLabel, role = Role.Button, onClick = onOpen)
            .testTag("health_summary"),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Icon(
                    painterResource(R.drawable.ic_health_and_safety),
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp),
                )
                Text(
                    stringResource(R.string.health_summary_title),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f),
                )
                Icon(
                    painterResource(R.drawable.ic_chevron_right),
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(18.dp),
                )
            }
            HealthValues(health.snapshot, today, zone, mergeRows = false)
            FootNote(stringResource(R.string.health_summary_note))
            if (health.error != null) FootNote(stringResource(R.string.health_summary_error))
        }
    }
}

@Composable
@ReadOnlyComposable
private fun valueWithUnit(value: String, unit: String): String = stringResource(R.string.health_value_unit, value, unit)

@Composable
private fun healthErrorMessage(error: HealthError): String = when (error) {
    HealthError.NoPermission -> stringResource(R.string.health_error_no_permission)
    is HealthError.ReadFailed -> stringResource(
        R.string.health_error_read_failed,
        error.detail?.takeIf { it.isNotBlank() } ?: stringResource(R.string.health_error_unknown),
    )
}

/** Month and day, such as 10月20日 or Oct 20. */
@Composable
@ReadOnlyComposable
private fun formatMonthDay(value: TemporalAccessor): String = formatter("MMMd").format(value)

/** Month, day and time in the user's 12- or 24-hour setting. */
@Composable
@ReadOnlyComposable
private fun formatDateTime(instant: Instant, zone: ZoneId): String {
    val skeleton = if (DateFormat.is24HourFormat(LocalContext.current)) "MMMdHm" else "MMMdhm"
    return formatter(skeleton).format(instant.atZone(zone))
}

@Composable
@ReadOnlyComposable
private fun formatter(skeleton: String): DateTimeFormatter {
    val locale = textLocale
    return DateTimeFormatter.ofPattern(DateFormat.getBestDateTimePattern(locale, skeleton), locale)
}

/** The Play Store onboarding link from the Health Connect guide. Falls back to the web store. */
private fun openHealthConnectInStore(context: Context, url: String) {
    val intent = Intent(Intent.ACTION_VIEW, url.toUri())
        .setPackage("com.android.vending")
        .putExtra("overlay", true)
        .putExtra("callerId", context.packageName)
    try {
        context.startActivity(intent)
    } catch (_: ActivityNotFoundException) {
        val web = Intent(Intent.ACTION_VIEW, "https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata".toUri())
        try {
            context.startActivity(web)
        } catch (_: ActivityNotFoundException) {
            // No store and no browser. The page already says that manual logging still works.
        }
    }
}

/** Health Connect's data and access screen, where the user can revoke Boji's permissions. */
private fun openHealthConnectSettings(context: Context) {
    try {
        context.startActivity(HealthConnectClient.getHealthConnectManageDataIntent(context))
    } catch (_: ActivityNotFoundException) {
        // Health Connect was removed after the page opened. The next refresh shows the new status.
    }
}
