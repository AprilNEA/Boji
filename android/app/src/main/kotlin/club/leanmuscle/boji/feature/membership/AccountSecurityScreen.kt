package club.leanmuscle.boji.feature.membership

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import club.leanmuscle.boji.core.membership.EmailRules
import club.leanmuscle.boji.core.membership.PasswordRules
import club.leanmuscle.boji.ui.components.BojiCard
import club.leanmuscle.boji.ui.components.BojiScaffold
import club.leanmuscle.boji.ui.components.FootNote
import club.leanmuscle.boji.ui.components.PageColumn
import club.leanmuscle.boji.ui.components.SectionHeading
import kotlinx.coroutines.launch

const val SECURITY_SCREEN_TAG = "account_security_screen"
const val DELETE_ACCOUNT_TAG = "delete_account"
const val CHANGE_EMAIL_TAG = "change_email"
const val NEW_EMAIL_TAG = "new_email"

@Composable
fun AccountSecurityScreen(onBack: () -> Unit, modifier: Modifier = Modifier, viewModel: SecurityViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val busy by viewModel.busy.collectAsStateWithLifecycle()
    val message by viewModel.message.collectAsStateWithLifecycle()
    val pendingEmail by viewModel.pendingEmail.collectAsStateWithLifecycle()
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
                ChangeEmailControls(
                    currentEmail = account.email,
                    emailVerified = account.emailVerified,
                    pendingEmail = pendingEmail,
                    busy = busy,
                    onSubmit = viewModel::changeEmail,
                    onCheck = viewModel::checkEmailChange,
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

            SectionHeading(stringResource(R.string.security_delete_section), null)
            DeleteAccountForm(
                email = account.email,
                busy = busy,
                onRequestCode = viewModel::requestAccountDeletion,
                onDelete = viewModel::deleteAccount,
            )
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

/**
 * The email change: the server mails the current address first, then the new address. The page
 * keeps the new address until the session shows it.
 */
@Composable
private fun ChangeEmailControls(
    currentEmail: String,
    emailVerified: Boolean,
    pendingEmail: String?,
    busy: Boolean,
    onSubmit: (newEmail: String, onRequested: () -> Unit) -> Unit,
    onCheck: () -> Unit,
) {
    var editing by rememberSaveable { mutableStateOf(false) }
    var newEmail by rememberSaveable { mutableStateOf("") }
    val candidate = newEmail.trim()
    val ready = EmailRules.isValid(candidate) && !candidate.equals(currentEmail, ignoreCase = true)

    if (pendingEmail != null) {
        HorizontalDivider(Modifier.padding(vertical = 8.dp))
        InfoRow(stringResource(R.string.security_pending_email), pendingEmail)
        Text(
            stringResource(R.string.security_change_email_pending, currentEmail),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        OutlinedButton(
            onClick = onCheck,
            enabled = !busy,
            modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
        ) { Text(stringResource(R.string.security_check_email_change)) }
    }
    OutlinedButton(
        onClick = { editing = true },
        enabled = !busy && emailVerified,
        modifier = Modifier.fillMaxWidth().padding(top = 12.dp).testTag(CHANGE_EMAIL_TAG),
    ) { Text(stringResource(R.string.security_change_email)) }
    if (!emailVerified) {
        Text(
            stringResource(R.string.security_change_email_unverified),
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
    if (editing) {
        AlertDialog(
            onDismissRequest = { editing = false },
            title = { Text(stringResource(R.string.security_change_email_title)) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(stringResource(R.string.security_change_email_text))
                    AccountField(
                        value = newEmail,
                        onValueChange = { newEmail = it },
                        label = stringResource(R.string.security_new_email),
                        kind = FieldKind.EMAIL,
                        enabled = !busy,
                        imeAction = ImeAction.Done,
                        modifier = Modifier.testTag(NEW_EMAIL_TAG),
                    )
                }
            },
            confirmButton = {
                // The dialog closes first, so that the page shows the result message.
                TextButton(
                    onClick = {
                        editing = false
                        onSubmit(candidate) { newEmail = "" }
                    },
                    enabled = ready && !busy,
                ) { Text(stringResource(R.string.security_change_email_submit)) }
            },
            dismissButton = { TextButton(onClick = { editing = false }) { Text(stringResource(R.string.action_cancel)) } },
        )
    }
}

/**
 * Account deletion in two steps, as bizserver requires: the server emails a confirmation code, and
 * the user pastes it here. Each step asks for confirmation first.
 */
@Composable
private fun DeleteAccountForm(
    email: String,
    busy: Boolean,
    onRequestCode: (onSent: () -> Unit) -> Unit,
    onDelete: (code: String) -> Unit,
) {
    // The code stays out of the saved instance state, like the passwords.
    var code by remember { mutableStateOf("") }
    var codeSent by rememberSaveable { mutableStateOf(false) }
    var confirmingRequest by rememberSaveable { mutableStateOf(false) }
    var confirmingDelete by rememberSaveable { mutableStateOf(false) }
    val destructive = ButtonDefaults.buttonColors(
        containerColor = MaterialTheme.colorScheme.error,
        contentColor = MaterialTheme.colorScheme.onError,
    )

    BojiCard(modifier = Modifier.testTag(DELETE_ACCOUNT_TAG)) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(stringResource(R.string.security_delete_text), style = MaterialTheme.typography.bodyMedium)
            if (!codeSent) {
                OutlinedButton(
                    onClick = { confirmingRequest = true },
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth(),
                ) { Text(stringResource(R.string.security_delete_start), color = MaterialTheme.colorScheme.error) }
            } else {
                Text(stringResource(R.string.security_delete_code_hint, email), style = MaterialTheme.typography.bodyMedium)
                AccountField(
                    value = code,
                    onValueChange = { code = it },
                    label = stringResource(R.string.security_delete_code),
                    kind = FieldKind.CODE,
                    enabled = !busy,
                    imeAction = ImeAction.Done,
                )
                Button(
                    onClick = { confirmingDelete = true },
                    enabled = !busy && code.isNotBlank(),
                    colors = destructive,
                    modifier = Modifier.fillMaxWidth().heightIn(min = 56.dp),
                ) { Text(stringResource(R.string.security_delete_confirm_action), style = MaterialTheme.typography.titleMedium) }
                TextButton(
                    onClick = { onRequestCode {} },
                    enabled = !busy,
                    modifier = Modifier.fillMaxWidth(),
                ) { Text(stringResource(R.string.security_delete_resend)) }
            }
        }
    }
    if (confirmingRequest) {
        AlertDialog(
            onDismissRequest = { confirmingRequest = false },
            title = { Text(stringResource(R.string.security_delete_request_title)) },
            text = { Text(stringResource(R.string.security_delete_request_text, email)) },
            confirmButton = {
                TextButton(onClick = {
                    confirmingRequest = false
                    onRequestCode { codeSent = true }
                }) { Text(stringResource(R.string.security_delete_request_action)) }
            },
            dismissButton = { TextButton(onClick = { confirmingRequest = false }) { Text(stringResource(R.string.action_cancel)) } },
        )
    }
    if (confirmingDelete) {
        AlertDialog(
            onDismissRequest = { confirmingDelete = false },
            title = { Text(stringResource(R.string.security_delete_confirm_title)) },
            text = { Text(stringResource(R.string.security_delete_confirm_text)) },
            confirmButton = {
                TextButton(onClick = {
                    confirmingDelete = false
                    onDelete(code)
                }) { Text(stringResource(R.string.security_delete_confirm_action), color = MaterialTheme.colorScheme.error) }
            },
            dismissButton = { TextButton(onClick = { confirmingDelete = false }) { Text(stringResource(R.string.action_cancel)) } },
        )
    }
}
