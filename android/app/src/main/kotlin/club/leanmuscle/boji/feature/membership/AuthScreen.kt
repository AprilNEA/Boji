package club.leanmuscle.boji.feature.membership

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.toggleable
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import club.leanmuscle.boji.BuildConfig
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.membership.PasswordRules
import club.leanmuscle.boji.ui.components.BojiCard
import club.leanmuscle.boji.ui.components.BojiScaffold
import club.leanmuscle.boji.ui.components.FootNote
import club.leanmuscle.boji.ui.components.PageColumn
import club.leanmuscle.boji.ui.components.PageHeading
import kotlinx.coroutines.launch

const val AUTH_SCREEN_TAG = "auth_screen"

private enum class AuthMode { SIGN_IN, REGISTER }

/**
 * Sign in and registration with email and password, as on iOS. Credential Manager offers saved
 * passwords when the screen opens and offers to save a password that the user typed.
 */
@Composable
fun AuthScreen(
    onBack: () -> Unit,
    onSignedIn: () -> Unit,
    onOpenTerms: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: AuthViewModel = hiltViewModel(),
) {
    val busy by viewModel.busy.collectAsStateWithLifecycle()
    val message by viewModel.message.collectAsStateWithLifecycle()
    val credentials = rememberPasswordCredentials()
    val scope = rememberCoroutineScope()

    var mode by rememberSaveable { mutableStateOf(AuthMode.SIGN_IN) }
    var name by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    // The password is not saveable: it must not end up in the saved instance state.
    var password by remember { mutableStateOf("") }
    var consent by rememberSaveable { mutableStateOf(false) }
    var pickedSaved by remember { mutableStateOf(false) }
    var offeredSaved by rememberSaveable { mutableStateOf(false) }

    val pickSaved: () -> Unit = {
        scope.launch {
            val saved = credentials.pick() ?: return@launch
            email = saved.id
            password = saved.password
            pickedSaved = true
            mode = AuthMode.SIGN_IN
        }
    }
    LaunchedEffect(Unit) {
        if (!offeredSaved) {
            offeredSaved = true
            pickSaved()
        }
    }
    val signIn: () -> Unit = {
        viewModel.signIn(email, password) {
            scope.launch {
                if (!pickedSaved) credentials.save(email, password)
                onSignedIn()
            }
        }
    }
    val register: () -> Unit = {
        viewModel.register(name, email, password) {
            scope.launch {
                credentials.save(email, password)
                pickedSaved = true
                mode = AuthMode.SIGN_IN
            }
        }
    }

    val title = stringResource(if (mode == AuthMode.SIGN_IN) R.string.auth_sign_in_title else R.string.auth_register_title)
    BojiScaffold(title = title, onBack = onBack, modifier = modifier.testTag(AUTH_SCREEN_TAG)) { padding ->
        PageColumn(modifier = Modifier.padding(padding), spacing = 16.dp) {
            AccountMessageCard(message)
            PageHeading(
                eyebrow = stringResource(R.string.card_club_name),
                title = stringResource(if (mode == AuthMode.SIGN_IN) R.string.auth_sign_in_heading else R.string.auth_register_heading),
                subtitle = stringResource(R.string.auth_intro),
            )
            val modeLabel = stringResource(R.string.auth_mode)
            SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth().semantics { contentDescription = modeLabel }) {
                AuthMode.entries.forEachIndexed { index, option ->
                    SegmentedButton(
                        selected = option == mode,
                        onClick = {
                            mode = option
                            viewModel.dismissMessage()
                        },
                        shape = SegmentedButtonDefaults.itemShape(index, AuthMode.entries.size),
                        enabled = !busy,
                    ) {
                        Text(stringResource(if (option == AuthMode.SIGN_IN) R.string.auth_sign_in else R.string.auth_register))
                    }
                }
            }
            if (mode == AuthMode.REGISTER) {
                AccountField(name, { name = it }, stringResource(R.string.auth_name), FieldKind.NAME, enabled = !busy)
            }
            AccountField(email, { email = it; pickedSaved = false }, stringResource(R.string.auth_email), FieldKind.EMAIL, enabled = !busy)
            AccountField(
                value = password,
                onValueChange = { password = it; pickedSaved = false },
                label = if (mode == AuthMode.REGISTER) {
                    stringResource(R.string.auth_password_rule, PasswordRules.LENGTH.first, PasswordRules.LENGTH.last)
                } else {
                    stringResource(R.string.auth_password)
                },
                kind = if (mode == AuthMode.REGISTER) FieldKind.NEW_PASSWORD else FieldKind.PASSWORD,
                enabled = !busy,
                imeAction = ImeAction.Done,
                onDone = { if (mode == AuthMode.SIGN_IN) signIn() },
            )
            if (mode == AuthMode.SIGN_IN) {
                ProgressButton(stringResource(R.string.auth_sign_in), stringResource(R.string.auth_wait), busy, signIn)
                TextButton(onClick = pickSaved, enabled = !busy) { Text(stringResource(R.string.auth_use_saved)) }
            } else {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .toggleable(value = consent, role = Role.Checkbox, enabled = !busy, onValueChange = { consent = it }),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Checkbox(checked = consent, onCheckedChange = null)
                    Text(stringResource(R.string.auth_consent), style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(start = 12.dp))
                }
                ProgressButton(stringResource(R.string.auth_register_action), stringResource(R.string.auth_wait), busy, register, enabled = consent)
                FootNote(stringResource(R.string.auth_register_note))
            }
            if (BuildConfig.DEBUG) {
                viewModel.serviceUrl?.let { FootNote(stringResource(R.string.auth_dev_service, it)) }
                FootNote(stringResource(R.string.auth_dev_mail_note))
            }
            BojiCard {
                Text(stringResource(R.string.auth_help), style = MaterialTheme.typography.titleSmall)
                Text(
                    stringResource(R.string.auth_help_note),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp, bottom = 8.dp),
                )
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = { viewModel.sendVerification(email) }, enabled = !busy, modifier = Modifier.fillMaxWidth()) {
                        Text(stringResource(R.string.auth_resend))
                    }
                    OutlinedButton(onClick = { viewModel.requestPasswordReset(email) }, enabled = !busy, modifier = Modifier.fillMaxWidth()) {
                        Text(stringResource(R.string.auth_reset))
                    }
                }
            }
            TextButton(onClick = onOpenTerms) { Text(stringResource(R.string.auth_data_link)) }
            FootNote(stringResource(R.string.auth_data_note), icon = R.drawable.ic_lock)
        }
    }
}
