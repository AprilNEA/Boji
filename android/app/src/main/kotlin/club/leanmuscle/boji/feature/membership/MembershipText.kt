package club.leanmuscle.boji.feature.membership

import androidx.annotation.StringRes
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.membership.AccountAction
import club.leanmuscle.boji.core.membership.AccountMessage
import club.leanmuscle.boji.core.membership.CardCondition
import club.leanmuscle.boji.core.membership.MembershipRules
import club.leanmuscle.boji.core.membership.PasswordRules

@Composable
fun accountMessageText(message: AccountMessage): String {
    val min = PasswordRules.LENGTH.first
    val max = PasswordRules.LENGTH.last
    return when (message) {
        AccountMessage.SignedIn -> stringResource(R.string.msg_signed_in)
        AccountMessage.Registered -> stringResource(R.string.msg_registered)
        AccountMessage.VerificationSent -> stringResource(R.string.msg_verification_sent)
        AccountMessage.ResetRequested -> stringResource(R.string.msg_reset_requested)
        AccountMessage.CardUpdated -> stringResource(R.string.msg_card_updated)
        AccountMessage.SignedOut -> stringResource(R.string.msg_signed_out)
        AccountMessage.SignedOutLocally -> stringResource(R.string.msg_signed_out_locally)
        AccountMessage.PasswordChanged -> stringResource(R.string.msg_password_changed)
        AccountMessage.PasswordChangedSignInAgain -> stringResource(R.string.msg_password_changed_sign_in)
        AccountMessage.OtherSessionsRevoked -> stringResource(R.string.msg_other_sessions_revoked)
        AccountMessage.NotConfigured -> stringResource(R.string.msg_not_configured)
        AccountMessage.EmailAndPasswordRequired -> stringResource(R.string.msg_email_password_required)
        AccountMessage.RegistrationIncomplete -> stringResource(R.string.msg_registration_incomplete, min, max)
        AccountMessage.VerificationEmailRequired -> stringResource(R.string.msg_verification_email_required)
        AccountMessage.ResetEmailRequired -> stringResource(R.string.msg_reset_email_required)
        AccountMessage.InvalidCredentials -> stringResource(R.string.msg_invalid_credentials)
        AccountMessage.SignInRequired -> stringResource(R.string.msg_sign_in_required)
        AccountMessage.AccountMismatch -> stringResource(R.string.msg_account_mismatch)
        AccountMessage.StorageFailed -> stringResource(R.string.msg_storage_failed)
        AccountMessage.ClearFailed -> stringResource(R.string.msg_clear_failed)
        AccountMessage.PasswordRules -> stringResource(R.string.msg_password_rules, min, max)
        AccountMessage.SamePassword -> stringResource(R.string.msg_same_password)
        AccountMessage.PasswordChangedStorageFailed -> stringResource(R.string.msg_password_changed_storage)
        AccountMessage.TermsRequired -> stringResource(R.string.msg_terms_required)
        is AccountMessage.InvalidNickname -> nicknameProblemText(message.problem)
        AccountMessage.NicknameRejected -> stringResource(R.string.msg_nickname_rejected)
        AccountMessage.TooManyRequests -> stringResource(R.string.msg_too_many_requests)
        AccountMessage.WrongCurrentPassword -> stringResource(R.string.msg_wrong_current_password)
        AccountMessage.NoEmailPassword -> stringResource(R.string.msg_no_email_password)
        AccountMessage.SessionNotFresh -> stringResource(R.string.msg_session_not_fresh)
        AccountMessage.SessionExpired -> stringResource(R.string.msg_session_expired)
        AccountMessage.EmailNotVerified -> stringResource(R.string.msg_email_not_verified)
        AccountMessage.OfflineShowingCard -> stringResource(R.string.msg_offline_card)
        AccountMessage.PermissionDenied -> stringResource(R.string.msg_permission_denied)
        is AccountMessage.Network -> stringResource(networkMessage(message.action))
        is AccountMessage.Failed -> stringResource(failureMessage(message.action))
    }
}

@StringRes
private fun networkMessage(action: AccountAction): Int = when (action) {
    AccountAction.REFRESH -> R.string.msg_network_refresh
    AccountAction.SIGN_IN -> R.string.msg_network_sign_in
    AccountAction.REGISTER -> R.string.msg_network_register
    AccountAction.SEND_VERIFICATION -> R.string.msg_network_verification
    AccountAction.RESET_PASSWORD -> R.string.msg_network_reset
    AccountAction.ENROLL -> R.string.msg_network_enroll
    AccountAction.REFRESH_SESSION -> R.string.msg_network_session
    AccountAction.CHANGE_PASSWORD -> R.string.msg_network_password
    AccountAction.REVOKE_OTHER_SESSIONS -> R.string.msg_network_revoke
}

@StringRes
private fun failureMessage(action: AccountAction): Int = when (action) {
    AccountAction.REFRESH -> R.string.msg_failed_refresh
    AccountAction.SIGN_IN -> R.string.msg_failed_sign_in
    AccountAction.REGISTER -> R.string.msg_failed_register
    AccountAction.SEND_VERIFICATION -> R.string.msg_failed_verification
    AccountAction.RESET_PASSWORD -> R.string.msg_failed_reset
    AccountAction.ENROLL -> R.string.msg_failed_enroll
    AccountAction.REFRESH_SESSION -> R.string.msg_failed_session
    AccountAction.CHANGE_PASSWORD -> R.string.msg_failed_password
    AccountAction.REVOKE_OTHER_SESSIONS -> R.string.msg_failed_revoke
}

@Composable
fun nicknameProblemText(problem: MembershipRules.NicknameProblem): String = when (problem) {
    MembershipRules.NicknameProblem.EMPTY -> stringResource(R.string.nickname_empty)
    MembershipRules.NicknameProblem.TOO_LONG -> stringResource(R.string.nickname_too_long, MembershipRules.NICKNAME_MAX_LENGTH)
    MembershipRules.NicknameProblem.INVISIBLE_OR_CONTROL -> stringResource(R.string.nickname_invalid)
}

@StringRes
fun CardCondition.labelRes(): Int = when (this) {
    CardCondition.ACTIVE -> R.string.card_condition_active
    CardCondition.OFFLINE -> R.string.card_condition_offline
    CardCondition.SUSPENDED -> R.string.card_condition_suspended
    CardCondition.EXPIRED -> R.string.card_condition_expired
    CardCondition.UNAVAILABLE -> R.string.card_condition_unavailable
}

@StringRes
fun CardCondition.detailRes(): Int = when (this) {
    CardCondition.ACTIVE -> R.string.card_condition_active_detail
    CardCondition.OFFLINE -> R.string.card_condition_offline_detail
    CardCondition.SUSPENDED -> R.string.card_condition_suspended_detail
    CardCondition.EXPIRED -> R.string.card_condition_expired_detail
    CardCondition.UNAVAILABLE -> R.string.card_condition_unavailable_detail
}

@StringRes
fun MembershipRules.Pledge.titleRes(): Int = when (this) {
    MembershipRules.Pledge.BELONGING -> R.string.pledge_belonging_title
    MembershipRules.Pledge.PACE -> R.string.pledge_pace_title
    MembershipRules.Pledge.PRIVACY -> R.string.pledge_privacy_title
}

@StringRes
fun MembershipRules.Pledge.textRes(): Int = when (this) {
    MembershipRules.Pledge.BELONGING -> R.string.pledge_belonging_text
    MembershipRules.Pledge.PACE -> R.string.pledge_pace_text
    MembershipRules.Pledge.PRIVACY -> R.string.pledge_privacy_text
}
