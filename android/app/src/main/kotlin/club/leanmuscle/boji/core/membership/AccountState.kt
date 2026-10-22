package club.leanmuscle.boji.core.membership

import club.leanmuscle.boji.core.auth.StoredSession
import java.time.Instant

/** What the member center shows. Local features never depend on this state. */
sealed interface AccountState {

    /** The build has no member service URL. */
    data object NotConfigured : AccountState

    /** Reading the stored session at launch. */
    data object Restoring : AccountState

    data object SignedOut : AccountState

    /**
     * @property card null before the user claims a card, or while the email is not verified.
     * @property syncedAt when the server last confirmed [card].
     * @property isOffline true while the card is the offline copy: the last check did not reach the
     *   server, or the app has not checked since launch.
     */
    data class SignedIn(
        val account: Account,
        val card: MembershipCard?,
        val syncedAt: Instant?,
        val isOffline: Boolean,
    ) : AccountState
}

/** The signed-in account. The app never shows [userId]; it only binds the card cache to it. */
data class Account(
    val userId: String,
    val email: String,
    val name: String,
    val emailVerified: Boolean,
    val sessionCreatedAt: Instant?,
    val sessionExpiresAt: Instant?,
)

internal fun StoredSession.toAccount(): Account = Account(
    userId = userId,
    email = email,
    name = name,
    emailVerified = emailVerified,
    sessionCreatedAt = createdAtMillis?.let(Instant::ofEpochMilli),
    sessionExpiresAt = expiresAtMillis?.let(Instant::ofEpochMilli),
)

/** Operations that report their own network and failure messages, as `MembershipStore.Action` on iOS. */
enum class AccountAction {
    REFRESH,
    SIGN_IN,
    GOOGLE_SIGN_IN,
    REGISTER,
    SEND_VERIFICATION,
    RESET_PASSWORD,
    ENROLL,
    REFRESH_SESSION,
    CHANGE_PASSWORD,
    REVOKE_OTHER_SESSIONS,
    CHANGE_EMAIL,
    REQUEST_ACCOUNT_DELETION,
    DELETE_ACCOUNT,
}

/**
 * The result of an operation. The UI maps each case to a string; the wording matches iOS.
 * [isError] decides the style, and whether a form stays open.
 */
sealed interface AccountMessage {
    val isError: Boolean

    sealed interface Notice : AccountMessage {
        override val isError: Boolean get() = false
    }

    sealed interface Problem : AccountMessage {
        override val isError: Boolean get() = true
    }

    data object SignedIn : Notice
    data object Registered : Notice
    data object VerificationSent : Notice
    data object ResetRequested : Notice
    data object CardUpdated : Notice
    data object SignedOut : Notice
    data object SignedOutLocally : Notice
    data object PasswordChanged : Notice
    data object PasswordChangedSignInAgain : Notice
    data object OtherSessionsRevoked : Notice

    /** The server accepted the request. It sends nothing when another account owns [newEmail]. */
    data class EmailChangeRequested(val currentEmail: String, val newEmail: String) : Notice
    data class EmailChanged(val email: String) : Notice

    /** The session still shows the old email: the user has not opened both links yet. */
    data object EmailChangePending : Notice
    data object DeletionCodeSent : Notice
    data object AccountDeleted : Notice

    data object NotConfigured : Problem
    data object EmailAndPasswordRequired : Problem
    data object RegistrationIncomplete : Problem
    data object VerificationEmailRequired : Problem
    data object ResetEmailRequired : Problem
    data object InvalidCredentials : Problem
    data object SignInRequired : Problem
    data object AccountMismatch : Problem
    data object StorageFailed : Problem
    data object ClearFailed : Problem
    data object PasswordRules : Problem
    data object SamePassword : Problem
    data object PasswordChangedStorageFailed : Problem
    data object InvalidNewEmail : Problem
    data object SameEmail : Problem
    data object VerifyEmailBeforeChange : Problem
    data object EmailChangeDisabled : Problem
    data object EmailChangeRejected : Problem
    data object GoogleSignInUnavailable : Problem
    data object GoogleSignInRejected : Problem
    data object GoogleSignInIncomplete : Problem
    data object NoGoogleAccount : Problem

    /** The email of the provider account already belongs to an email account. */
    data object EmailAccountExists : Problem
    data object DeletionCodeRequired : Problem
    data object InvalidDeletionCode : Problem

    /** The server deleted the account, but a local file could not be cleared. */
    data object AccountDeletedClearFailed : Problem
    data object TermsRequired : Problem
    data class InvalidNickname(val problem: MembershipRules.NicknameProblem) : Problem
    data object NicknameRejected : Problem
    data object TooManyRequests : Problem
    data object WrongCurrentPassword : Problem
    data object NoEmailPassword : Problem
    data object SessionNotFresh : Problem
    data object SessionExpired : Problem
    data object EmailNotVerified : Problem
    data object OfflineShowingCard : Problem
    data object PermissionDenied : Problem
    data class Network(val action: AccountAction) : Problem
    data class Failed(val action: AccountAction) : Problem
}

/** Password rule of Better Auth in bizserver, as on iOS. */
object PasswordRules {
    val LENGTH: IntRange = 8..128

    fun isValid(password: String): Boolean = password.length in LENGTH
}

/** A light check of a new email before the request, as on iOS. The server decides the rest. */
object EmailRules {
    fun isValid(email: String): Boolean {
        val parts = email.split('@')
        return parts.size == 2 && parts[0].isNotEmpty() && '.' in parts[1] && email.none(Char::isWhitespace)
    }
}
