package club.leanmuscle.boji.feature.membership

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.toggleable
import androidx.compose.material3.Checkbox
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.membership.AccountState
import club.leanmuscle.boji.core.membership.MembershipRules
import club.leanmuscle.boji.ui.components.BojiCard
import club.leanmuscle.boji.ui.components.BojiScaffold
import club.leanmuscle.boji.ui.components.FootNote
import club.leanmuscle.boji.ui.components.PageColumn
import club.leanmuscle.boji.ui.components.PageHeading
import club.leanmuscle.boji.ui.components.PrimaryButton

const val ENROLL_SCREEN_TAG = "enroll_screen"

@Composable
fun EnrollScreen(
    onBack: () -> Unit,
    onDone: () -> Unit,
    onOpenTerms: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: EnrollViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val busy by viewModel.busy.collectAsStateWithLifecycle()
    val message by viewModel.message.collectAsStateWithLifecycle()
    val step by viewModel.step.collectAsStateWithLifecycle()
    val nickname by viewModel.nickname.collectAsStateWithLifecycle()
    val pledges by viewModel.pledges.collectAsStateWithLifecycle()
    val acceptedTerms by viewModel.acceptedTerms.collectAsStateWithLifecycle()
    val enrolled by viewModel.enrolled.collectAsStateWithLifecycle()

    BojiScaffold(title = stringResource(R.string.enroll_title), onBack = onBack, modifier = modifier.testTag(ENROLL_SCREEN_TAG)) { padding ->
        PageColumn(modifier = Modifier.padding(padding), spacing = 18.dp) {
            if (enrolled) {
                val card = (state as? AccountState.SignedIn)?.card
                PageHeading(
                    eyebrow = stringResource(R.string.enroll_welcome_synced),
                    title = stringResource(R.string.enroll_welcome_title),
                    subtitle = stringResource(R.string.enroll_welcome_text),
                )
                if (card != null) {
                    MembershipCardFace(CardFace(card.nickname, card.memberNumber, card.createTime), CardStyle.FOREST)
                }
                FootNote(stringResource(R.string.enroll_welcome_note))
                PrimaryButton(text = stringResource(R.string.enroll_view_card), icon = R.drawable.ic_card_membership, onClick = onDone)
                return@PageColumn
            }

            val progress = stringResource(R.string.enroll_progress, step + 1, EnrollViewModel.STEP_COUNT)
            LinearProgressIndicator(
                progress = { (step + 1f) / EnrollViewModel.STEP_COUNT },
                modifier = Modifier.fillMaxWidth().semantics { contentDescription = progress },
            )
            Text(
                stringResource(
                    when (step) {
                        0 -> R.string.enroll_step_nickname
                        1 -> R.string.enroll_step_pledges
                        else -> R.string.enroll_step_review
                    },
                ),
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.primary,
            )
            AccountMessageCard(message)
            when (step) {
                0 -> NicknameStep(nickname, viewModel::updateNickname, viewModel::next)
                1 -> PledgeStep(pledges, viewModel::togglePledge, onOpenTerms, viewModel::next)
                else -> ReviewStep(
                    nickname = nickname,
                    acceptedTerms = acceptedTerms,
                    busy = busy,
                    onAcceptTerms = viewModel::setAcceptedTerms,
                    onConfirm = viewModel::confirm,
                )
            }
            if (step > 0) {
                TextButton(onClick = viewModel::previous, enabled = !busy) { Text(stringResource(R.string.enroll_previous)) }
            }
        }
    }
}

@Composable
private fun NicknameStep(nickname: String, onNicknameChange: (String) -> Unit, onContinue: () -> Unit) {
    val problem = MembershipRules.nicknameProblem(nickname)
    // An empty field is not an error until the user types something.
    val shownProblem = problem?.takeIf { nickname.isNotEmpty() }
    PageHeading(
        eyebrow = stringResource(R.string.membership_free_badge),
        title = stringResource(R.string.enroll_nickname_title),
        subtitle = stringResource(R.string.enroll_nickname_text),
    )
    AccountField(
        value = nickname,
        onValueChange = onNicknameChange,
        label = stringResource(R.string.enroll_nickname_label),
        kind = FieldKind.NICKNAME,
        supportingText = shownProblem?.let { nicknameProblemText(it) }
            ?: stringResource(R.string.enroll_nickname_rule, 1, MembershipRules.NICKNAME_MAX_LENGTH),
        isError = shownProblem != null,
        imeAction = ImeAction.Done,
        onDone = { if (problem == null) onContinue() },
    )
    FootNote(stringResource(R.string.enroll_nickname_note))
    Text(stringResource(R.string.enroll_preview), style = MaterialTheme.typography.titleSmall)
    val preview = MembershipRules.normalizeNickname(nickname).ifEmpty { stringResource(R.string.enroll_nickname_placeholder) }
    MembershipCardFace(CardFace(preview, null, null), CardStyle.FOREST)
    FootNote(stringResource(R.string.enroll_preview_note))
    PrimaryButton(text = stringResource(R.string.enroll_continue), icon = R.drawable.ic_chevron_right, onClick = onContinue, enabled = problem == null)
}

@Composable
private fun PledgeStep(confirmed: List<String>, onToggle: (MembershipRules.Pledge) -> Unit, onOpenTerms: () -> Unit, onContinue: () -> Unit) {
    PageHeading(
        eyebrow = stringResource(R.string.terms_pledges),
        title = stringResource(R.string.enroll_pledges_title),
        subtitle = stringResource(R.string.enroll_pledges_text),
    )
    MembershipRules.PLEDGES.forEach { pledge ->
        val checked = pledge.id in confirmed
        BojiCard(
            modifier = Modifier
                .testTag("pledge_${pledge.id}")
                .toggleable(value = checked, role = Role.Checkbox, onValueChange = { onToggle(pledge) }),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                Icon(
                    painterResource(if (checked) R.drawable.ic_check_circle else R.drawable.ic_radio_unchecked),
                    contentDescription = null,
                    tint = if (checked) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(24.dp),
                )
                Column(Modifier.weight(1f)) {
                    Text(stringResource(pledge.titleRes()), style = MaterialTheme.typography.titleSmall)
                    Text(stringResource(pledge.textRes()), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
    val count = MembershipRules.PLEDGES.count { it.id in confirmed }
    Text(
        stringResource(R.string.enroll_pledges_count, count, MembershipRules.PLEDGES.size),
        style = MaterialTheme.typography.labelLarge,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
    OutlinedButton(onClick = onOpenTerms, modifier = Modifier.fillMaxWidth()) { Text(stringResource(R.string.enroll_read_terms)) }
    PrimaryButton(
        text = stringResource(R.string.enroll_continue),
        icon = R.drawable.ic_chevron_right,
        onClick = onContinue,
        enabled = count == MembershipRules.PLEDGES.size,
    )
}

@Composable
private fun ReviewStep(nickname: String, acceptedTerms: Boolean, busy: Boolean, onAcceptTerms: (Boolean) -> Unit, onConfirm: () -> Unit) {
    PageHeading(
        eyebrow = stringResource(R.string.membership_free_badge),
        title = stringResource(R.string.enroll_review_title),
    )
    MembershipCardFace(CardFace(MembershipRules.normalizeNickname(nickname), null, null), CardStyle.FOREST)
    FootNote(stringResource(R.string.enroll_review_free))
    FootNote(stringResource(R.string.enroll_review_data), icon = R.drawable.ic_lock)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .toggleable(value = acceptedTerms, role = Role.Checkbox, enabled = !busy, onValueChange = onAcceptTerms),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Checkbox(checked = acceptedTerms, onCheckedChange = null)
        Text(stringResource(R.string.enroll_accept), style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(start = 12.dp))
    }
    ProgressButton(
        text = stringResource(R.string.enroll_confirm),
        busyText = stringResource(R.string.enroll_confirming),
        busy = busy,
        onClick = onConfirm,
        enabled = acceptedTerms,
    )
}
