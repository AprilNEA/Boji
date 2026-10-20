package club.leanmuscle.boji.feature.entry

import androidx.annotation.DrawableRes
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.data.BojiStore
import club.leanmuscle.boji.core.model.BojiSnapshot
import club.leanmuscle.boji.ui.components.FootNote
import club.leanmuscle.boji.ui.components.NumberStepper
import club.leanmuscle.boji.ui.components.formatOneDecimal
import club.leanmuscle.boji.ui.components.parseDecimal
import club.leanmuscle.boji.ui.theme.BojiThemeColors
import kotlin.math.roundToInt
import kotlinx.coroutines.launch

enum class DailySheet { Water, Sleep, Body }

private val WaterPresets = listOf(150, 250, 500)
private const val WATER_STEP = 50
private val WaterRange = 50..1000
private const val UNDO_WATER_ML = 250
private const val SLEEP_STEP = 0.5

/** Bottom sheet for one daily entry. Values are saved only when the user taps 保存. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DailyEntrySheet(kind: DailySheet, snapshot: BojiSnapshot, actions: DailyEntryActions, onDismiss: () -> Unit) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = kind == DailySheet.Body)
    val scope = rememberCoroutineScope()
    val close: () -> Unit = {
        scope.launch { sheetState.hide() }.invokeOnCompletion { if (!sheetState.isVisible) onDismiss() }
    }
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState, containerColor = MaterialTheme.colorScheme.background) {
        when (kind) {
            DailySheet.Water -> WaterContent(
                todayWater = snapshot.todayRecord.waterML,
                onSave = { actions.addWater(it); close() },
                onUndo = { actions.addWater(-UNDO_WATER_ML); close() },
                onCancel = close,
            )
            DailySheet.Sleep -> SleepContent(
                initialHours = snapshot.todayRecord.sleepHours ?: 8.0,
                onSave = { actions.setSleep(it); close() },
                onCancel = close,
            )
            DailySheet.Body -> {
                val last = snapshot.state.bodyEntries.lastOrNull()
                BodyContent(
                    initialWeight = last?.weight?.toString().orEmpty(),
                    initialWaist = last?.waist?.toString().orEmpty(),
                    onSave = { weight, waist -> actions.addBodyEntry(weight, waist); close() },
                    onCancel = close,
                )
            }
        }
    }
}

@Composable
private fun SheetScaffold(
    title: String,
    saveEnabled: Boolean,
    onSave: () -> Unit,
    onCancel: () -> Unit,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState())
            .padding(start = 20.dp, end = 20.dp, bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            TextButton(onClick = onCancel) { Text(stringResource(R.string.action_cancel)) }
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                textAlign = TextAlign.Center,
                modifier = Modifier.weight(1f).semantics { heading() },
            )
            Button(onClick = onSave, enabled = saveEnabled, modifier = Modifier.testTag("sheet_save")) {
                Text(stringResource(R.string.action_save))
            }
        }
        content()
    }
}

@Composable
private fun SheetIcon(@DrawableRes icon: Int, color: Color) {
    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
        Icon(painterResource(icon), contentDescription = null, tint = color, modifier = Modifier.size(48.dp))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WaterContent(todayWater: Int, onSave: (Int) -> Unit, onUndo: () -> Unit, onCancel: () -> Unit) {
    var amount by rememberSaveable { mutableIntStateOf(250) }
    SheetScaffold(
        title = stringResource(R.string.sheet_water_title),
        saveEnabled = true,
        onSave = { onSave(amount) },
        onCancel = onCancel,
    ) {
        SheetIcon(R.drawable.ic_water_drop, BojiThemeColors.current.water)
        Text(stringResource(R.string.water_amount_label), style = MaterialTheme.typography.labelLarge)
        SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
            WaterPresets.forEachIndexed { index, preset ->
                SegmentedButton(
                    selected = amount == preset,
                    onClick = { amount = preset },
                    shape = SegmentedButtonDefaults.itemShape(index, WaterPresets.size),
                ) { Text(stringResource(R.string.water_amount, preset)) }
            }
        }
        NumberStepper(
            label = stringResource(R.string.water_amount, amount),
            onDecrease = { amount = (amount - WATER_STEP).coerceAtLeast(WaterRange.first) },
            onIncrease = { amount = (amount + WATER_STEP).coerceAtMost(WaterRange.last) },
            decreaseEnabled = amount > WaterRange.first,
            increaseEnabled = amount < WaterRange.last,
        )
        FootNote(stringResource(R.string.water_footer))
        if (todayWater > 0) {
            TextButton(
                onClick = onUndo,
                colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error),
                modifier = Modifier.fillMaxWidth(),
            ) { Text(stringResource(R.string.water_undo)) }
        }
    }
}

@Composable
private fun SleepContent(initialHours: Double, onSave: (Double) -> Unit, onCancel: () -> Unit) {
    var hours by rememberSaveable { mutableDoubleStateOf(initialHours) }
    val range = BojiStore.SLEEP_RANGE
    SheetScaffold(
        title = stringResource(R.string.sheet_sleep_title),
        saveEnabled = true,
        onSave = { onSave(hours) },
        onCancel = onCancel,
    ) {
        SheetIcon(R.drawable.ic_bedtime, BojiThemeColors.current.sleep)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(stringResource(R.string.sleep_label), style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
            Text(
                text = stringResource(R.string.sleep_value, formatOneDecimal(hours)),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
            )
        }
        val sliderLabel = stringResource(R.string.sleep_slider_a11y)
        Slider(
            value = hours.toFloat(),
            onValueChange = { hours = (it / SLEEP_STEP).roundToInt() * SLEEP_STEP },
            valueRange = range.start.toFloat()..range.endInclusive.toFloat(),
            steps = ((range.endInclusive - range.start) / SLEEP_STEP).toInt() - 1,
            modifier = Modifier.semantics { contentDescription = sliderLabel },
        )
        NumberStepper(
            label = stringResource(R.string.sleep_adjust),
            onDecrease = { hours = (hours - SLEEP_STEP).coerceAtLeast(range.start) },
            onIncrease = { hours = (hours + SLEEP_STEP).coerceAtMost(range.endInclusive) },
            decreaseEnabled = hours > range.start,
            increaseEnabled = hours < range.endInclusive,
        )
        FootNote(stringResource(R.string.sleep_footer))
    }
}

@Composable
private fun BodyContent(
    initialWeight: String,
    initialWaist: String,
    onSave: (Double, Double) -> Unit,
    onCancel: () -> Unit,
) {
    var weightText by rememberSaveable { mutableStateOf(initialWeight) }
    var waistText by rememberSaveable { mutableStateOf(initialWaist) }
    val weight = parseDecimal(weightText)
    val waist = parseDecimal(waistText)
    val weightValid = weight != null && weight.isFinite() && weight in BojiStore.WEIGHT_RANGE_KG
    val waistValid = waist != null && waist.isFinite() && waist in BojiStore.WAIST_RANGE_CM
    SheetScaffold(
        title = stringResource(R.string.sheet_body_title),
        saveEnabled = weightValid && waistValid,
        onSave = { if (weight != null && waist != null) onSave(weight, waist) },
        onCancel = onCancel,
    ) {
        Text(stringResource(R.string.body_section), style = MaterialTheme.typography.labelLarge)
        MeasurementField(
            value = weightText,
            onValueChange = { weightText = it },
            label = stringResource(R.string.body_weight),
            hint = stringResource(R.string.body_weight_hint),
            unit = stringResource(R.string.unit_kg),
            error = stringResource(R.string.body_weight_invalid).takeIf { weightText.isNotBlank() && !weightValid },
            imeAction = ImeAction.Next,
            tag = "body_weight",
        )
        MeasurementField(
            value = waistText,
            onValueChange = { waistText = it },
            label = stringResource(R.string.body_waist),
            hint = stringResource(R.string.body_waist_hint),
            unit = stringResource(R.string.unit_cm),
            error = stringResource(R.string.body_waist_invalid).takeIf { waistText.isNotBlank() && !waistValid },
            imeAction = ImeAction.Done,
            tag = "body_waist",
        )
        FootNote(stringResource(R.string.body_note))
    }
}

@Composable
private fun MeasurementField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    hint: String,
    unit: String,
    error: String?,
    imeAction: ImeAction,
    tag: String,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        placeholder = { Text(hint) },
        suffix = { Text(unit) },
        isError = error != null,
        supportingText = error?.let { { Text(it) } },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal, imeAction = imeAction),
        modifier = Modifier.fillMaxWidth().testTag(tag),
    )
}
