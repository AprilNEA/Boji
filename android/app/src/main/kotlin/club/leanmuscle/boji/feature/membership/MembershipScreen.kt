package club.leanmuscle.boji.feature.membership

import android.content.ClipData
import android.os.Build
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ClipEntry
import androidx.compose.ui.platform.LocalClipboard
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.membership.AccountMessage
import club.leanmuscle.boji.core.membership.AccountState
import club.leanmuscle.boji.core.membership.MembershipCard
import club.leanmuscle.boji.ui.components.BojiCard
import club.leanmuscle.boji.ui.components.BojiScaffold
import club.leanmuscle.boji.ui.components.FootNote
import club.leanmuscle.boji.ui.components.PageColumn
import club.leanmuscle.boji.ui.components.PageHeading
import club.leanmuscle.boji.ui.components.PrimaryButton
import club.leanmuscle.boji.ui.components.SectionHeading
import kotlinx.coroutines.launch
import java.time.Instant

const val MEMBERSHIP_SCREEN_TAG = "membership_screen"

/** Actions of the member center. Navigation stays with the caller. */
data class MembershipActions(
    val onBack: () -> Unit,
    val onOpenAuth: () -> Unit,
    val onOpenEnroll: () -> Unit,
    val onOpenTerms: () -> Unit,
    val onOpenSecurity: () -> Unit,
    val onRefresh: () -> Unit,
    val onResendVerification: () -> Unit,
    val onSignOut: () -> Unit,
    val onShare: () -> Unit,
)

@Composable
fun MembershipScreen(
    onBack: () -> Unit,
    onOpenAuth: () -> Unit,
    onOpenEnroll: () -> Unit,
    onOpenTerms: () -> Unit,
    onOpenSecurity: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: MembershipViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val busy by viewModel.busy.collectAsStateWithLifecycle()
    val message by viewModel.message.collectAsStateWithLifecycle()
    var sharing by rememberSaveable { mutableStateOf(false) }

    MembershipContent(
        state = state,
        busy = busy,
        message = message,
        actions = MembershipActions(
            onBack = onBack,
            onOpenAuth = onOpenAuth,
            onOpenEnroll = onOpenEnroll,
            onOpenTerms = onOpenTerms,
            onOpenSecurity = onOpenSecurity,
            onRefresh = viewModel::refresh,
            onResendVerification = viewModel::resendVerification,
            onSignOut = viewModel::signOut,
            onShare = { sharing = true },
        ),
        modifier = modifier,
    )
    val signedIn = state as? AccountState.SignedIn
    val card = signedIn?.card
    if (sharing && card != null) {
        MembershipShareSheet(
            card = card,
            isOffline = signedIn.isOffline,
            onDismiss = { sharing = false },
            writeImage = viewModel::shareImageUri,
        )
    }
}

@Composable
fun MembershipContent(
    state: AccountState,
    busy: Boolean,
    message: AccountMessage?,
    actions: MembershipActions,
    modifier: Modifier = Modifier,
) {
    BojiScaffold(
        title = stringResource(R.string.membership_title),
        onBack = actions.onBack,
        modifier = modifier.testTag(MEMBERSHIP_SCREEN_TAG),
        actions = {
            if (state is AccountState.SignedIn) {
                IconButton(onClick = actions.onRefresh, enabled = !busy) {
                    Icon(painterResource(R.drawable.ic_refresh), contentDescription = stringResource(R.string.membership_refresh))
                }
            }
        },
    ) { padding ->
        when (state) {
            AccountState.Restoring -> Box(Modifier.padding(padding).fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    CircularProgressIndicator()
                    Text(stringResource(R.string.membership_restoring), style = MaterialTheme.typography.bodyMedium)
                }
            }
            else -> PageColumn(modifier = Modifier.padding(padding)) {
                AccountMessageCard(message)
                when (state) {
                    AccountState.NotConfigured -> NotConfiguredSection(actions)
                    AccountState.SignedOut -> SignedOutSection(actions)
                    is AccountState.SignedIn -> SignedInSection(state, busy, actions)
                    AccountState.Restoring -> Unit
                }
            }
        }
    }
}

@Composable
private fun Hero() {
    PageHeading(
        eyebrow = stringResource(R.string.membership_free_badge),
        title = stringResource(R.string.membership_hero_title),
        subtitle = stringResource(R.string.membership_hero_text),
    )
}

@Composable
private fun NotConfiguredSection(actions: MembershipActions) {
    Hero()
    BojiCard {
        Text(stringResource(R.string.membership_not_configured_title), style = MaterialTheme.typography.titleMedium)
        Text(
            stringResource(R.string.membership_not_configured_text),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = 6.dp),
        )
    }
    TextButton(onClick = actions.onOpenTerms) { Text(stringResource(R.string.membership_terms_link)) }
    FootNote(stringResource(R.string.membership_local_note), icon = R.drawable.ic_lock)
}

@Composable
private fun SignedOutSection(actions: MembershipActions) {
    Hero()
    MembershipCardFace(CardFace(stringResource(R.string.enroll_nickname_placeholder), null, null), CardStyle.FOREST)
    BojiCard {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(stringResource(R.string.membership_free_steps), style = MaterialTheme.typography.titleSmall)
            PointRow(R.drawable.ic_health_and_safety, stringResource(R.string.membership_point_no_photos))
            PointRow(R.drawable.ic_visibility, stringResource(R.string.membership_point_hide_number))
            PointRow(R.drawable.ic_lock, stringResource(R.string.membership_point_no_upload))
        }
    }
    PrimaryButton(text = stringResource(R.string.membership_sign_in_to_claim), icon = R.drawable.ic_mail, onClick = actions.onOpenAuth)
    TextButton(onClick = actions.onOpenTerms) { Text(stringResource(R.string.membership_terms_link)) }
    FootNote(stringResource(R.string.membership_free_disclaimer))
    FootNote(stringResource(R.string.membership_local_note), icon = R.drawable.ic_lock)
}

@Composable
private fun SignedInSection(state: AccountState.SignedIn, busy: Boolean, actions: MembershipActions) {
    val card = state.card
    when {
        card != null -> CardSection(card, state, actions)
        !state.account.emailVerified -> {
            Hero()
            BojiCard {
                Text(stringResource(R.string.membership_verify_first), style = MaterialTheme.typography.titleMedium)
                Column(Modifier.padding(top = 12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = actions.onResendVerification, enabled = !busy, modifier = Modifier.fillMaxWidth()) {
                        Text(stringResource(R.string.membership_resend_verification))
                    }
                    OutlinedButton(onClick = actions.onRefresh, enabled = !busy, modifier = Modifier.fillMaxWidth()) {
                        Text(stringResource(R.string.membership_refresh_account))
                    }
                }
            }
        }
        else -> {
            Hero()
            BojiCard {
                Text(stringResource(R.string.membership_verified_title), style = MaterialTheme.typography.titleMedium)
                Text(
                    stringResource(R.string.membership_free_steps),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 6.dp),
                )
            }
            PrimaryButton(text = stringResource(R.string.membership_claim), icon = R.drawable.ic_card_membership, onClick = actions.onOpenEnroll, enabled = !busy)
            FootNote(stringResource(R.string.membership_free_disclaimer))
        }
    }
    AccountSection(state, busy, actions)
}

@Composable
private fun CardSection(card: MembershipCard, state: AccountState.SignedIn, actions: MembershipActions) {
    val now = remember(state) { Instant.now() }
    val condition = card.condition(state.isOffline, now)
    MembershipCardFace(CardFace(card.nickname, card.memberNumber, card.createTime, isOffline = state.isOffline), CardStyle.FOREST)
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(stringResource(condition.labelRes()), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Text(stringResource(condition.detailRes()), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        state.syncedAt?.let {
            Text(
                stringResource(R.string.membership_last_synced, formatDateTime(it)),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
    PrimaryButton(text = stringResource(R.string.membership_make_share_card), icon = R.drawable.ic_share, onClick = actions.onShare)

    SectionHeading(stringResource(R.string.membership_details), null)
    BojiCard {
        NumberRow(card.memberNumber)
        HorizontalDivider(Modifier.padding(vertical = 8.dp))
        InfoRow(stringResource(R.string.membership_joined), card.createTime?.let { formatDate(it) } ?: "—")
        card.expireTime?.let {
            HorizontalDivider(Modifier.padding(vertical = 8.dp))
            InfoRow(stringResource(R.string.membership_expires), formatDate(it))
        }
    }
    FootNote(stringResource(R.string.membership_details_note))

    SectionHeading(stringResource(R.string.membership_entitlements), stringResource(R.string.membership_entitlements_detail))
    val entitlements = card.effectiveEntitlements(now)
    BojiCard {
        if (entitlements.isEmpty()) {
            Text(
                stringResource(if (state.isOffline) R.string.membership_entitlements_pending else R.string.membership_entitlements_none),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        entitlements.forEachIndexed { index, entitlement ->
            if (index > 0) HorizontalDivider(Modifier.padding(vertical = 10.dp))
            // Display name and description come from the server, so new benefits need no app update.
            Text(entitlement.displayName, style = MaterialTheme.typography.titleSmall)
            if (entitlement.description.isNotBlank()) {
                Text(entitlement.description, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            entitlement.expireTimeMillis?.let {
                Text(
                    stringResource(R.string.membership_entitlement_until, formatDate(Instant.ofEpochMilli(it))),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            } ?: entitlement.grantTimeMillis?.let {
                Text(
                    stringResource(R.string.membership_entitlement_granted, formatDate(Instant.ofEpochMilli(it))),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
    FootNote(stringResource(R.string.membership_entitlements_note))
}

/** The full member number, copied as the server sent it. */
@Composable
private fun NumberRow(memberNumber: String) {
    val clipboard = LocalClipboard.current
    val scope = rememberCoroutineScope()
    var copied by remember { mutableStateOf(false) }
    val label = stringResource(R.string.membership_full_number)
    InfoRow(label, memberNumber) {
        IconButton(onClick = {
            scope.launch {
                clipboard.setClipEntry(ClipEntry(ClipData.newPlainText(label, memberNumber)))
                // Android 13 and later confirm the copy themselves.
                copied = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
            }
        }) {
            Icon(painterResource(R.drawable.ic_content_copy), contentDescription = stringResource(R.string.membership_copy_number))
        }
    }
    if (copied) {
        Text(stringResource(R.string.membership_number_copied), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
    }
}

@Composable
private fun AccountSection(state: AccountState.SignedIn, busy: Boolean, actions: MembershipActions) {
    var confirmSignOut by rememberSaveable { mutableStateOf(false) }
    Text(
        stringResource(R.string.membership_account),
        style = MaterialTheme.typography.titleLarge,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.semantics { heading() },
    )
    BojiCard {
        InfoRow(stringResource(R.string.security_email), state.account.email)
        HorizontalDivider(Modifier.padding(vertical = 8.dp))
        TextButton(onClick = actions.onOpenSecurity, modifier = Modifier.fillMaxWidth()) {
            Icon(painterResource(R.drawable.ic_key), contentDescription = null, modifier = Modifier.size(18.dp))
            Text(stringResource(R.string.membership_security), modifier = Modifier.padding(start = 8.dp).weight(1f))
            Icon(painterResource(R.drawable.ic_chevron_right), contentDescription = null, modifier = Modifier.size(18.dp))
        }
    }
    OutlinedButton(onClick = { confirmSignOut = true }, enabled = !busy, modifier = Modifier.fillMaxWidth()) {
        Icon(painterResource(R.drawable.ic_logout), contentDescription = null, modifier = Modifier.size(18.dp))
        Text(stringResource(R.string.membership_sign_out), modifier = Modifier.padding(start = 8.dp))
    }
    FootNote(stringResource(R.string.membership_account_note))
    if (confirmSignOut) {
        AlertDialog(
            onDismissRequest = { confirmSignOut = false },
            title = { Text(stringResource(R.string.membership_sign_out_title)) },
            text = { Text(stringResource(R.string.membership_sign_out_text)) },
            confirmButton = {
                TextButton(onClick = {
                    confirmSignOut = false
                    actions.onSignOut()
                }) { Text(stringResource(R.string.membership_sign_out)) }
            },
            dismissButton = {
                TextButton(onClick = { confirmSignOut = false }) { Text(stringResource(R.string.action_cancel)) }
            },
        )
    }
}
