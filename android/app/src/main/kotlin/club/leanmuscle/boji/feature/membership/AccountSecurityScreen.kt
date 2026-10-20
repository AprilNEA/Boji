package club.leanmuscle.boji.feature.membership

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.membership.AccountState
import club.leanmuscle.boji.core.membership.PasswordRules
import club.leanmuscle.boji.ui.components.BojiCard
import club.leanmuscle.boji.ui.components.BojiScaffold
import club.leanmuscle.boji.ui.components.FootNote
import club.leanmuscle.boji.ui.components.PageColumn
import club.leanmuscle.boji.ui.components.SectionHeading
import kotlinx.coroutines.launch

const val SECURITY_SCREEN_TAG = "account_security_screen"

@Composable
fun AccountSecurityScreen(onBack: () -> Unit, modifier: Modifier = Modifier, viewModel: SecurityViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val busy by viewModel.busy.collectAsStateWithLifecycle()
    val message by viewModel.message.collectAsStateWithLifecycle()
    val credentials = rememberPasswordCredentials()
    val scope = rememberCoroutineScope()

    BojiScaffold(title = stringResource(R.string.security_title), onBack = onBack, modifier = modifier.testTag(SECURITY_SCREEN_TAG)) { padding ->
        PageColumn(modifier = Modifier.padding(padding), spacing = 18.dp) {
            AccountMessageCard(message)
            val signedIn = state as? AccountState.SignedIn
            if (signedIn == null) {
                Text(stringResource(R.string.security_signed_out), style = MaterialTheme.typography.bodyLarge)
                return@PageColumn
            }
            val account = signedIn.account
            SectionHeading(stringResource(R.string.membership_account), null)
            BojiCard {
                InfoRow(stringResource(R.string.security_email), account.email)
                Text(
                    stringResource(if (account.emailVerified) R.string.security_email_verified else R.string.security_email_unverified),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            SectionHeading(stringResource(R.string.security_session), null)
            BojiCard {
                val createdAt = account.sessionCreatedAt
                val expiresAt = account.sessionExpiresAt
                if (createdAt == null && expiresAt == null) {
                    Text(stringResource(R.string.security_session_unknown), style = MaterialTheme.typography.bodyMedium)
                }
                createdAt?.let { InfoRow(stringResource(R.string.security_signed_in_at), formatDateTime(it)) }
                if (createdAt != null && expiresAt != null) HorizontalDivider(Modifier.padding(vertical = 8.dp))
                expiresAt?.let { InfoRow(stringResource(R.string.security_expires_at), formatDateTime(it)) }
                OutlinedButton(
                    onClick = viewModel::refreshSession,
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                ) { Text(stringResource(R.string.security_refresh_session)) }
            }

            SectionHeading(stringResource(R.string.security_section), null)
            PasswordForm(busy = busy) { current, new, clear ->
                viewModel.changePassword(current, new) {
                    clear()
                    // Offer to replace the saved password, so autofill does not keep the old one.
                    scope.launch { credentials.save(account.email, new) }
                }
            }
            RevokeOthersButton(busy = busy, onConfirm = viewModel::revokeOtherSessions)
            FootNote(stringResource(R.string.security_note))
            FootNote(stringResource(R.string.security_footer), icon = R.drawable.ic_lock)
        }
    }
}

@Composable
private fun PasswordForm(busy: Boolean, onSubmit: (current: String, new: String, clear: () -> Unit) -> Unit) {
    // Passwords stay out of the saved instance state.
    var current by remember { mutableStateOf("") }
    var new by remember { mutableStateOf("") }
    var repeat by remember { mutableStateOf("") }
    var confirming by rememberSaveable { mutableStateOf(false) }
    val mismatch = repeat.isNotEmpty() && repeat != new
    val ready = current.isNotEmpty() && PasswordRules.isValid(new) && repeat == new

    BojiCard {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(stringResource(R.string.security_password_section), style = MaterialTheme.typography.titleSmall)
            AccountField(current, { current = it }, stringResource(R.string.security_current_password), FieldKind.PASSWORD, enabled = !busy)
            AccountField(
                new,
                { new = it },
                stringResource(R.string.security_new_password, PasswordRules.LENGTH.first, PasswordRules.LENGTH.last),
                FieldKind.NEW_PASSWORD,
                enabled = !busy,
            )
            AccountField(
                value = repeat,
                onValueChange = { repeat = it },
                label = stringResource(R.string.security_repeat_password),
                kind = FieldKind.NEW_PASSWORD,
                enabled = !busy,
                isError = mismatch,
                supportingText = if (mismatch) stringResource(R.string.security_password_mismatch) else null,
                imeAction = ImeAction.Done,
            )
            ProgressButton(
                text = stringResource(R.string.security_update_password),
                busyText = stringResource(R.string.security_updating),
                busy = busy,
                onClick = { confirming = true },
                enabled = ready,
            )
            FootNote(stringResource(R.string.security_password_note))
        }
    }
    if (confirming) {
        AlertDialog(
            onDismissRequest = { confirming = false },
            title = { Text(stringResource(R.string.security_password_confirm_title)) },
            text = { Text(stringResource(R.string.security_password_confirm_text)) },
            confirmButton = {
                TextButton(onClick = {
                    confirming = false
                    onSubmit(current, new) {
                        current = ""
                        new = ""
                        repeat = ""
                    }
                }) { Text(stringResource(R.string.security_password_confirm_action)) }
            },
            dismissButton = { TextButton(onClick = { confirming = false }) { Text(stringResource(R.string.action_cancel)) } },
        )
    }
}

@Composable
private fun RevokeOthersButton(busy: Boolean, onConfirm: () -> Unit) {
    var confirming by rememberSaveable { mutableStateOf(false) }
    OutlinedButton(onClick = { confirming = true }, enabled = !busy, modifier = Modifier.fillMaxWidth()) {
        Text(stringResource(R.string.security_revoke_others))
    }
    if (confirming) {
        AlertDialog(
            onDismissRequest = { confirming = false },
            title = { Text(stringResource(R.string.security_revoke_title)) },
            text = { Text(stringResource(R.string.security_revoke_text)) },
            confirmButton = {
                TextButton(onClick = {
                    confirming = false
                    onConfirm()
                }) { Text(stringResource(R.string.security_revoke_action)) }
            },
            dismissButton = { TextButton(onClick = { confirming = false }) { Text(stringResource(R.string.action_cancel)) } },
        )
    }
}
