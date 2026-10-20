package club.leanmuscle.boji.feature.settings

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.core.content.pm.PackageInfoCompat
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.data.Appearance
import club.leanmuscle.boji.core.data.BojiStore
import club.leanmuscle.boji.core.model.BojiSnapshot
import club.leanmuscle.boji.core.model.PlanKind
import club.leanmuscle.boji.ui.components.BojiCard
import club.leanmuscle.boji.ui.components.BojiTopBar
import club.leanmuscle.boji.ui.components.FootNote
import club.leanmuscle.boji.ui.components.PageColumn
import club.leanmuscle.boji.ui.components.titleRes
import java.io.IOException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun SettingsScreen(
    snapshot: BojiSnapshot,
    store: BojiStore,
    appearance: Appearance,
    onAppearanceChange: (Appearance) -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val snackbar = remember { SnackbarHostState() }
    var exportError by rememberSaveable { mutableStateOf<String?>(null) }
    var confirmDelete by rememberSaveable { mutableStateOf(false) }
    val exportDone = stringResource(R.string.settings_export_done)
    val unknownError = stringResource(R.string.storage_unknown_error)

    val exportLauncher = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri: Uri? ->
        val json = store.exportJson()
        if (uri == null || json == null) return@rememberLauncherForActivityResult
        scope.launch {
            val error = withContext(Dispatchers.IO) {
                try {
                    val stream = context.contentResolver.openOutputStream(uri, "wt") ?: throw IOException(unknownError)
                    stream.use { it.write(json.toByteArray(Charsets.UTF_8)) }
                    null
                } catch (error: Exception) {
                    error.message ?: unknownError
                }
            }
            if (error == null) snackbar.showSnackbar(exportDone) else exportError = error
        }
    }

    Scaffold(
        modifier = modifier.testTag("screen_Settings"),
        topBar = { BojiTopBar(title = stringResource(R.string.action_settings), onBack = onBack) },
        snackbarHost = { SnackbarHost(snackbar) },
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        PageColumn(modifier = Modifier.padding(padding), spacing = 20.dp) {
            SettingsSection(stringResource(R.string.settings_profile)) {
                OutlinedTextField(
                    value = snapshot.state.displayName,
                    onValueChange = store::setDisplayName,
                    label = { Text(stringResource(R.string.settings_nickname)) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                    modifier = Modifier.fillMaxWidth().testTag("settings_nickname"),
                )
                Text(stringResource(R.string.training_plan_label), style = MaterialTheme.typography.labelLarge)
                Options(
                    options = PlanKind.entries,
                    selected = snapshot.state.selectedPlan,
                    label = { stringResource(it.titleRes) },
                    onSelect = store::setSelectedPlan,
                )
            }
            SettingsSection(stringResource(R.string.settings_appearance)) {
                Text(stringResource(R.string.settings_display_mode), style = MaterialTheme.typography.labelLarge)
                Options(
                    options = Appearance.entries,
                    selected = appearance,
                    label = {
                        stringResource(
                            when (it) {
                                Appearance.System -> R.string.appearance_system
                                Appearance.Light -> R.string.appearance_light
                                Appearance.Dark -> R.string.appearance_dark
                            },
                        )
                    },
                    onSelect = onAppearanceChange,
                )
            }
            SettingsSection(stringResource(R.string.settings_privacy)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Icon(painterResource(R.drawable.ic_lock), contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Text(stringResource(R.string.settings_privacy_local), style = MaterialTheme.typography.bodyLarge)
                }
                FootNote(stringResource(R.string.settings_privacy_note))
                val exportName = stringResource(R.string.settings_export_filename)
                OutlinedButton(
                    onClick = { exportLauncher.launch(exportName) },
                    modifier = Modifier.fillMaxWidth().testTag("settings_export"),
                ) {
                    Icon(painterResource(R.drawable.ic_ios_share), contentDescription = null, modifier = Modifier.size(18.dp))
                    Text(stringResource(R.string.settings_export), modifier = Modifier.padding(start = 8.dp))
                }
                TextButton(
                    onClick = { confirmDelete = true },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error),
                    modifier = Modifier.fillMaxWidth().testTag("settings_delete"),
                ) {
                    Icon(painterResource(R.drawable.ic_delete), contentDescription = null, modifier = Modifier.size(18.dp))
                    Text(stringResource(R.string.settings_delete), modifier = Modifier.padding(start = 8.dp))
                }
            }
            SettingsSection(stringResource(R.string.settings_about)) {
                Row {
                    Text(stringResource(R.string.app_title), style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
                    Text(versionLabel(), style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                FootNote(stringResource(R.string.settings_about_note))
            }
        }
    }

    exportError?.let { message ->
        AlertDialog(
            onDismissRequest = { exportError = null },
            title = { Text(stringResource(R.string.settings_export_failed)) },
            text = { Text(message) },
            confirmButton = { TextButton(onClick = { exportError = null }) { Text(stringResource(R.string.action_ok)) } },
        )
    }
    if (confirmDelete) {
        AlertDialog(
            onDismissRequest = { confirmDelete = false },
            title = { Text(stringResource(R.string.settings_delete_confirm_title)) },
            text = { Text(stringResource(R.string.settings_delete_confirm_text)) },
            confirmButton = {
                TextButton(
                    onClick = {
                        confirmDelete = false
                        store.resetAll()
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error),
                    modifier = Modifier.testTag("settings_delete_confirm"),
                ) { Text(stringResource(R.string.settings_delete_confirm)) }
            },
            dismissButton = { TextButton(onClick = { confirmDelete = false }) { Text(stringResource(R.string.action_cancel)) } },
        )
    }
}

@Composable
private fun SettingsSection(title: String, content: @Composable ColumnScope.() -> Unit) {
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

@Composable
private fun <T> Options(options: List<T>, selected: T, label: @Composable (T) -> String, onSelect: (T) -> Unit) {
    SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
        options.forEachIndexed { index, option ->
            SegmentedButton(
                selected = option == selected,
                onClick = { onSelect(option) },
                shape = SegmentedButtonDefaults.itemShape(index, options.size),
            ) { Text(label(option)) }
        }
    }
}

@Composable
private fun versionLabel(): String {
    val context = LocalContext.current
    val info = remember(context) { context.packageManager.getPackageInfo(context.packageName, 0) }
    return stringResource(R.string.settings_version, info.versionName.orEmpty(), PackageInfoCompat.getLongVersionCode(info))
}
