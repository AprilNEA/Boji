package club.leanmuscle.boji.feature.membership

import android.graphics.Bitmap
import android.net.Uri
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import club.leanmuscle.boji.core.membership.AccountMessage
import club.leanmuscle.boji.core.membership.AccountState
import club.leanmuscle.boji.core.membership.MembershipCode
import club.leanmuscle.boji.core.membership.MembershipRepository
import club.leanmuscle.boji.core.membership.MembershipRules
import club.leanmuscle.boji.core.membership.MembershipVerifier
import club.leanmuscle.boji.core.membership.ScanOutcome
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/** State, busy flag and the latest message, shared by the member screens. */
abstract class AccountViewModel(protected val repository: MembershipRepository) : ViewModel() {
    val state: StateFlow<AccountState> = repository.state
    val busy: StateFlow<Boolean> = repository.busy

    private val mutableMessage = MutableStateFlow<AccountMessage?>(null)
    val message: StateFlow<AccountMessage?> = mutableMessage.asStateFlow()

    /** Runs [action] and shows its message. [onResult] runs only when the action ran. */
    protected fun launchAction(action: suspend () -> AccountMessage?, onResult: (AccountMessage) -> Unit = {}) {
        mutableMessage.value = null
        viewModelScope.launch {
            val result = action() ?: return@launch
            mutableMessage.value = result
            onResult(result)
        }
    }

    fun dismissMessage() {
        mutableMessage.value = null
    }
}

@HiltViewModel
class MembershipViewModel @Inject constructor(
    repository: MembershipRepository,
    private val shareImage: MembershipShareImage,
    private val verifier: MembershipVerifier,
) : AccountViewModel(repository) {

    /** The member code of the active card. It lives in memory only. */
    val membershipCode: StateFlow<MembershipCode?> = repository.membershipCode

    /** True when the server issues member codes, so the screen shows the member code button. */
    val membershipCodeEnabled: StateFlow<Boolean> = repository.membershipCodeEnabled

    /** True when the signed-in account may verify member codes, so the screen shows the scanner. */
    val canVerify: StateFlow<Boolean> = verifier.canVerify
    val verifying: StateFlow<Boolean> = verifier.verifying

    /** The latest verification result. It lives in memory only. */
    val scanOutcome: StateFlow<ScanOutcome?> = verifier.outcome

    init {
        // Opening the member center confirms the card, as on iOS. A running restore wins.
        viewModelScope.launch {
            val result = repository.refreshQuietly()
            if (result != null && result.isError) launchAction({ result })
        }
        viewModelScope.launch { repository.loadCapabilities() }
        // The role can change on the server, so the member center asks again each time it opens.
        viewModelScope.launch { verifier.refreshPermission() }
    }

    fun refresh() = launchAction(repository::refresh)

    /** Fetches the member code of the active card, unless this run already has it. */
    fun prepareMembershipCode() = launchAction(repository::prepareMembershipCode)

    /** Verifies a scanned or typed member code. */
    fun verify(value: String) {
        viewModelScope.launch { verifier.verify(value) }
    }

    fun clearScanOutcome() = verifier.clearOutcome()

    fun resendVerification() {
        val email = (state.value as? AccountState.SignedIn)?.account?.email ?: return
        launchAction({ repository.sendVerification(email) })
    }

    fun signOut() = launchAction(repository::signOut)

    /** Writes the rendered share card. Returns null when the image cannot be saved. */
    suspend fun shareImageUri(bitmap: Bitmap): Uri? = shareImage.write(bitmap)
}

@HiltViewModel
class AuthViewModel @Inject constructor(repository: MembershipRepository) : AccountViewModel(repository) {

    /** The member service URL, for the debug hint. */
    val serviceUrl: String? = repository.serviceUrl

    /** The Web client ID for Google ID tokens. Null hides Sign in with Google. */
    val googleServerClientId: String? = repository.googleServerClientId

    private val mutableGoogleSignInAvailable = MutableStateFlow(false)

    /** True once the server confirms `googleLoginEnabled` for a build with a client ID. */
    val googleSignInAvailable: StateFlow<Boolean> = mutableGoogleSignInAvailable.asStateFlow()

    init {
        if (googleServerClientId != null) {
            viewModelScope.launch { mutableGoogleSignInAvailable.value = repository.isGoogleSignInAvailable() }
        }
    }

    fun signInWithGoogle(idToken: String, nonce: String, onSignedIn: () -> Unit) =
        launchAction({ repository.signInWithGoogle(idToken, nonce) }) { if (!it.isError) onSignedIn() }

    /** Shows a problem that the device reported before any request, such as a missing account. */
    fun showProblem(problem: AccountMessage.Problem) = launchAction({ problem })

    fun signIn(email: String, password: String, onSignedIn: () -> Unit) =
        launchAction({ repository.signIn(email, password) }) { if (!it.isError) onSignedIn() }

    fun register(name: String, email: String, password: String, onRegistered: () -> Unit) =
        launchAction({ repository.register(name, email, password) }) { if (!it.isError) onRegistered() }

    fun sendVerification(email: String) = launchAction({ repository.sendVerification(email) })

    fun requestPasswordReset(email: String) = launchAction({ repository.requestPasswordReset(email) })
}

/** The three enrollment steps. The draft survives process death through [SavedStateHandle]. */
@HiltViewModel
class EnrollViewModel @Inject constructor(
    repository: MembershipRepository,
    private val savedState: SavedStateHandle,
) : AccountViewModel(repository) {

    val step: StateFlow<Int> = savedState.getStateFlow(KEY_STEP, 0)
    val nickname: StateFlow<String> = savedState.getStateFlow(KEY_NICKNAME, "")
    val pledges: StateFlow<List<String>> = savedState.getStateFlow(KEY_PLEDGES, emptyList())
    val acceptedTerms: StateFlow<Boolean> = savedState.getStateFlow(KEY_TERMS, false)
    val enrolled: StateFlow<Boolean> = savedState.getStateFlow(KEY_ENROLLED, false)

    fun updateNickname(value: String) {
        savedState[KEY_NICKNAME] = value
    }

    fun togglePledge(pledge: MembershipRules.Pledge) {
        val current = pledges.value
        savedState[KEY_PLEDGES] = if (pledge.id in current) current - pledge.id else current + pledge.id
    }

    fun setAcceptedTerms(value: Boolean) {
        savedState[KEY_TERMS] = value
    }

    fun next() {
        savedState[KEY_STEP] = (step.value + 1).coerceAtMost(STEP_COUNT - 1)
    }

    fun previous() {
        savedState[KEY_STEP] = (step.value - 1).coerceAtLeast(0)
    }

    fun confirm() {
        val confirmed = MembershipRules.PLEDGES.filter { it.id in pledges.value }.toSet()
        launchAction({ repository.enroll(nickname.value, confirmed, acceptedTerms.value) }) {
            if (!it.isError) savedState[KEY_ENROLLED] = true
        }
    }

    companion object {
        const val STEP_COUNT = 3
        private const val KEY_STEP = "step"
        private const val KEY_NICKNAME = "nickname"
        private const val KEY_PLEDGES = "pledges"
        private const val KEY_TERMS = "acceptedTerms"
        private const val KEY_ENROLLED = "enrolled"
    }
}

@HiltViewModel
class SecurityViewModel @Inject constructor(
    repository: MembershipRepository,
    private val savedState: SavedStateHandle,
) : AccountViewModel(repository) {

    /**
     * The new address of a requested email change. It survives process death, because the user
     * leaves the app to open both links.
     */
    val pendingEmail: StateFlow<String?> = savedState.getStateFlow(KEY_PENDING_EMAIL, null)

    fun refreshSession() = launchAction(repository::refreshSession)

    fun changePassword(currentPassword: String, newPassword: String, onChanged: () -> Unit) =
        launchAction({ repository.changePassword(currentPassword, newPassword) }) { if (!it.isError) onChanged() }

    fun revokeOtherSessions() = launchAction(repository::revokeOtherSessions)

    fun changeEmail(newEmail: String, onRequested: () -> Unit) =
        launchAction({ repository.changeEmail(newEmail) }) {
            if (it is AccountMessage.EmailChangeRequested) {
                savedState[KEY_PENDING_EMAIL] = it.newEmail
                onRequested()
            }
        }

    fun checkEmailChange() {
        val newEmail = pendingEmail.value ?: return
        launchAction({ repository.checkEmailChange(newEmail) }) {
            if (it is AccountMessage.EmailChanged) savedState[KEY_PENDING_EMAIL] = null
        }
    }

    fun requestAccountDeletion(onSent: () -> Unit) =
        launchAction(repository::requestAccountDeletion) { if (!it.isError) onSent() }

    fun deleteAccount(code: String) = launchAction({ repository.deleteAccount(code) })

    private companion object {
        const val KEY_PENDING_EMAIL = "pendingEmail"
    }
}
