package club.leanmuscle.boji.core.membership

import club.leanmuscle.boji.core.auth.AuthSessionStore
import club.leanmuscle.boji.core.auth.StoredSession
import club.leanmuscle.boji.core.di.ApplicationScope
import club.leanmuscle.boji.core.di.IoDispatcher
import club.leanmuscle.boji.core.network.MemberApiError
import club.leanmuscle.boji.core.network.MemberService
import club.leanmuscle.boji.core.network.getOrThrowMemberError
import club.leanmuscle.boji.core.network.isEmailNotVerified
import club.leanmuscle.boji.core.network.isForbidden
import club.leanmuscle.boji.core.network.isRateLimited
import club.leanmuscle.boji.core.network.isUnauthenticated
import club.leanmuscle.boji.core.network.serverCode
import io.github.betterauth.client.BetterAuthClient
import io.github.betterauth.client.api.IdTokenCredentials
import io.github.betterauth.client.model.OperationResult
import io.github.betterauth.client.model.SessionData
import io.github.betterauth.client.model.SignInOutcome
import io.github.betterauth.client.model.SocialSignInOutcome
import io.github.betterauth.client.storage.InMemoryStorage
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.withContext
import java.io.IOException
import java.security.GeneralSecurityException
import java.security.ProviderException
import java.time.Clock
import javax.inject.Inject
import javax.inject.Singleton

/**
 * The account and the member card. Mirrors `MembershipStore` on iOS and docs/developers/membership.mdx:
 *
 * - Only one operation runs at a time. A second call while one runs returns null and does nothing.
 * - Operations run in the application scope, so closing a screen does not lose a new session token.
 * - The session and the card cache belong to one server ([MemberService.endpoint]) and one account.
 * - Local training data never depends on this class. Signing out keeps it.
 */
@Singleton
class MembershipRepository @Inject constructor(
    private val service: MemberService,
    private val sessions: AuthSessionStore,
    private val cache: MembershipCacheStore,
    private val clock: Clock,
    @param:ApplicationScope private val scope: CoroutineScope,
    @param:IoDispatcher private val io: CoroutineDispatcher,
) {
    private val origin: String? = service.endpoint?.origin

    private val mutableState = MutableStateFlow(if (origin == null) AccountState.NotConfigured else AccountState.Restoring)
    val state: StateFlow<AccountState> = mutableState.asStateFlow()

    private val mutableBusy = MutableStateFlow(false)
    val busy: StateFlow<Boolean> = mutableBusy.asStateFlow()

    private val mutex = Mutex()

    /** The member service URL of this build, for the debug hint on the sign-in screen. */
    val serviceUrl: String? = service.endpoint?.toString()

    /** The Web client ID that Google ID tokens are requested for, or null when the build has none. */
    val googleServerClientId: String? = service.googleServerClientId

    init {
        // Without a stored session this reads one file and makes no request.
        if (origin != null) scope.launch(io) { operation { restore() } }
    }

    /** Reads the account and the card from the server again. */
    suspend fun refresh(): AccountMessage? = operation { refreshNow(explicit = true) }

    /** Refreshes when the member center opens. Reports problems, but no success notice. */
    suspend fun refreshQuietly(): AccountMessage? = operation { refreshNow(explicit = false) }

    suspend fun signIn(email: String, password: String): AccountMessage? = operation { signInNow(email, password) }

    /**
     * Whether the sign-in screen offers Google: the build has a client ID and the server reports
     * `googleLoginEnabled`. Any failure counts as unavailable. This reads no account data, so it
     * runs outside the operation lock.
     */
    suspend fun isGoogleSignInAvailable(): Boolean = withContext(io) {
        if (origin == null || googleServerClientId == null) return@withContext false
        try {
            service.system().serverConfig().googleLoginEnabled
        } catch (e: MemberApiError) {
            false
        }
    }

    /** Signs in with a Google ID token that was requested with the raw [nonce]. */
    suspend fun signInWithGoogle(idToken: String, nonce: String): AccountMessage? =
        operation { signInWithGoogleNow(idToken, nonce) }

    suspend fun register(name: String, email: String, password: String): AccountMessage? =
        operation { registerNow(name, email, password) }

    suspend fun sendVerification(email: String): AccountMessage? = operation { sendVerificationNow(email) }

    suspend fun requestPasswordReset(email: String): AccountMessage? = operation { requestPasswordResetNow(email) }

    /** Claims the free community card. Every pledge and the terms must be accepted. */
    suspend fun enroll(
        nickname: String,
        confirmedPledges: Set<MembershipRules.Pledge>,
        acceptedTerms: Boolean,
    ): AccountMessage? = operation { enrollNow(nickname, confirmedPledges, acceptedTerms) }

    /** Confirms the current session only, for the security screen. */
    suspend fun refreshSession(): AccountMessage? = operation { refreshSessionNow() }

    suspend fun changePassword(currentPassword: String, newPassword: String): AccountMessage? =
        operation { changePasswordNow(currentPassword, newPassword) }

    suspend fun revokeOtherSessions(): AccountMessage? = operation { revokeOtherSessionsNow() }

    /** Asks the server to email a confirmation code for deleting the account. */
    suspend fun requestAccountDeletion(): AccountMessage? = operation { requestAccountDeletionNow() }

    /**
     * Deletes the account on the server with the emailed [code], then clears the session and the
     * card cache. Local records stay, as after a sign-out.
     */
    suspend fun deleteAccount(code: String): AccountMessage? = operation { deleteAccountNow(code) }

    /** Signs out on the server when possible, and always clears the session and the card cache. */
    suspend fun signOut(): AccountMessage? = operation { signOutNow() }

    /**
     * Clears the session and the card cache without a request. "Delete all local data" calls this.
     * It waits for a running operation, so that the operation cannot write a session afterwards.
     */
    suspend fun clearLocalData(): Boolean = scope.async(io) {
        mutex.lock()
        try {
            clearLocal()
        } finally {
            mutex.unlock()
        }
    }.await()

    private suspend fun <T> operation(block: suspend () -> T): T? = scope.async(io) {
        if (!mutex.tryLock()) return@async null
        mutableBusy.value = true
        try {
            block()
        } finally {
            mutableBusy.value = false
            mutex.unlock()
        }
    }.await()

    // region Operations. Each runs inside operation(), so they never overlap.

    private suspend fun restore() {
        val stored = readSession()
        if (stored == null) {
            clearCacheQuietly()
            mutableState.value = AccountState.SignedOut
            return
        }
        val cached = cache.readQuietly(stored.userId)
        mutableState.value = AccountState.SignedIn(
            account = stored.toAccount(),
            card = cached?.card,
            syncedAt = cached?.syncedAtMillis?.let(java.time.Instant::ofEpochMilli),
            isOffline = true,
        )
        synchronize(stored, AccountAction.REFRESH)
    }

    private suspend fun refreshNow(explicit: Boolean): AccountMessage? {
        if (origin == null) return if (explicit) AccountMessage.NotConfigured else null
        val stored = readSession()
        if (stored == null) {
            clearCacheQuietly()
            mutableState.value = AccountState.SignedOut
            return if (explicit) AccountMessage.SignInRequired else null
        }
        val problem = synchronize(stored, AccountAction.REFRESH)
        return problem ?: if (explicit) AccountMessage.CardUpdated else null
    }

    private suspend fun signInNow(rawEmail: String, password: String): AccountMessage {
        val email = rawEmail.trim()
        if (email.isEmpty() || password.isEmpty()) return AccountMessage.EmailAndPasswordRequired
        if (origin == null) return AccountMessage.NotConfigured
        val token = try {
            val auth = signedOutAuth()
            // bizserver does not enable two-factor authentication.
            val outcome = auth.signIn.email(email, password).getOrThrowMemberError()
            if (outcome !is SignInOutcome.Authenticated) throw MemberApiError.InvalidResponse
            auth.currentToken() ?: throw MemberApiError.InvalidResponse
        } catch (e: MemberApiError) {
            if (e is MemberApiError.Http && e.status == 401) return AccountMessage.InvalidCredentials
            return handle(e, AccountAction.SIGN_IN)
        }
        return completeSignIn(token, origin)
    }

    private suspend fun completeSignIn(token: String, origin: String): AccountMessage {
        val session = try {
            fetchSession(token)
        } catch (e: MemberApiError) {
            return handle(e, AccountAction.SIGN_IN)
        } ?: return AccountMessage.Failed(AccountAction.SIGN_IN)

        val previous = sessions.currentQuietly()
        val stored = storedSession(origin, token, session)
        try {
            sessions.save(stored)
        } catch (e: Exception) {
            if (!e.isStorageFailure()) throw e
            return AccountMessage.StorageFailed
        }
        if (previous?.userId != stored.userId) clearCacheQuietly()
        mutableState.value = AccountState.SignedIn(stored.toAccount(), card = null, syncedAt = null, isOffline = false)
        // getSession above has just confirmed the token, so read the card without a second check.
        return loadCard(stored, AccountAction.SIGN_IN) ?: AccountMessage.SignedIn
    }

    private suspend fun signInWithGoogleNow(idToken: String, nonce: String): AccountMessage {
        if (origin == null || googleServerClientId == null) return AccountMessage.GoogleSignInUnavailable
        if (idToken.isBlank() || nonce.isBlank()) return AccountMessage.GoogleSignInIncomplete
        val token = try {
            val auth = signedOutAuth()
            val credentials = IdTokenCredentials(token = idToken, nonce = nonce)
            val outcome = auth.signIn.social(GOOGLE_PROVIDER, idToken = credentials).getOrThrowMemberError()
            if (outcome !is SocialSignInOutcome.Authenticated) throw MemberApiError.InvalidResponse
            auth.currentToken() ?: throw MemberApiError.InvalidResponse
        } catch (e: MemberApiError) {
            // There is no local session yet, so a 401 here rejects the token and clears nothing.
            return socialSignInProblem(e) ?: handle(e, AccountAction.GOOGLE_SIGN_IN)
        }
        return completeSignIn(token, origin)
    }

    /** The answers of Better Auth to a rejected provider token, as `appleSignInMessage` on iOS. */
    private fun socialSignInProblem(error: MemberApiError): AccountMessage? {
        if (error !is MemberApiError.Http) return null
        return when (error.code) {
            in LINKING_CODES -> AccountMessage.EmailAccountExists
            else -> if (error.status == 401) AccountMessage.GoogleSignInRejected else null
        }
    }

    private suspend fun registerNow(rawName: String, rawEmail: String, password: String): AccountMessage {
        val name = rawName.trim()
        val email = rawEmail.trim()
        if (name.isEmpty() || email.isEmpty() || !PasswordRules.isValid(password)) {
            return AccountMessage.RegistrationIncomplete
        }
        if (origin == null) return AccountMessage.NotConfigured
        return try {
            // Sign-up does not sign in. The user verifies the email first, then signs in.
            signedOutAuth().signUp.email(name, email, password).getOrThrowMemberError()
            AccountMessage.Registered
        } catch (e: MemberApiError) {
            handle(e, AccountAction.REGISTER)
        }
    }

    private suspend fun sendVerificationNow(rawEmail: String): AccountMessage {
        val email = rawEmail.trim()
        if (email.isEmpty()) return AccountMessage.VerificationEmailRequired
        if (origin == null) return AccountMessage.NotConfigured
        return try {
            signedOutAuth().sendVerificationEmail(email).getOrThrowMemberError()
            AccountMessage.VerificationSent
        } catch (e: MemberApiError) {
            handle(e, AccountAction.SEND_VERIFICATION)
        }
    }

    private suspend fun requestPasswordResetNow(rawEmail: String): AccountMessage {
        val email = rawEmail.trim()
        if (email.isEmpty()) return AccountMessage.ResetEmailRequired
        if (origin == null) return AccountMessage.NotConfigured
        return try {
            signedOutAuth().requestPasswordReset(email).getOrThrowMemberError()
            AccountMessage.ResetRequested
        } catch (e: MemberApiError) {
            handle(e, AccountAction.RESET_PASSWORD)
        }
    }

    private suspend fun enrollNow(
        rawNickname: String,
        confirmedPledges: Set<MembershipRules.Pledge>,
        acceptedTerms: Boolean,
    ): AccountMessage {
        MembershipRules.nicknameProblem(rawNickname)?.let { return AccountMessage.InvalidNickname(it) }
        if (!acceptedTerms || !confirmedPledges.containsAll(MembershipRules.PLEDGES)) return AccountMessage.TermsRequired
        if (origin == null) return AccountMessage.NotConfigured
        val stored = readSession() ?: return AccountMessage.SignInRequired
        return try {
            val created = service.memberships().create(
                token = stored.token,
                cardNickname = MembershipRules.normalizeNickname(rawNickname),
                acceptedTermsVersion = MembershipRules.TERMS_VERSION,
            )
            acceptCard(stored, created.toCard())
            AccountMessage.CardUpdated
        } catch (e: MemberApiError) {
            when (e.serverCode) {
                // The user already has a card, for example from another device: show it.
                "MEMBERSHIP_ALREADY_EXISTS" -> synchronize(stored, AccountAction.ENROLL) ?: AccountMessage.CardUpdated
                "TERMS_NOT_ACCEPTED" -> AccountMessage.TermsRequired
                "INVALID_INPUT" -> AccountMessage.NicknameRejected
                else -> handle(e, AccountAction.ENROLL)
            }
        }
    }

    private suspend fun refreshSessionNow(): AccountMessage? {
        if (origin == null) return AccountMessage.NotConfigured
        val stored = readSession() ?: return AccountMessage.SignInRequired
        return confirmSession(stored, AccountAction.REFRESH_SESSION).second
    }

    private suspend fun changePasswordNow(currentPassword: String, newPassword: String): AccountMessage {
        if (currentPassword.isEmpty() || !PasswordRules.isValid(newPassword)) return AccountMessage.PasswordRules
        if (newPassword == currentPassword) return AccountMessage.SamePassword
        if (origin == null) return AccountMessage.NotConfigured
        val stored = readSession() ?: return AccountMessage.SignInRequired
        val newToken = try {
            val auth = service.auth().withSession(stored.token)
            // Changing the password always signs out the other sessions, as on iOS.
            auth.changePassword(currentPassword, newPassword, revokeOtherSessions = true).getOrThrowMemberError()
            // The view still holds the old token unless the response sent a new one.
            auth.currentToken()?.takeIf { it != stored.token }
        } catch (e: MemberApiError) {
            return handle(e, AccountAction.CHANGE_PASSWORD)
        }
        if (newToken == null) {
            // The server revoked every session and sent no new one.
            clearLocal()
            return AccountMessage.PasswordChangedSignInAgain
        }
        val updated = stored.copy(token = newToken)
        try {
            sessions.save(updated)
        } catch (e: Exception) {
            if (!e.isStorageFailure()) throw e
            clearLocal()
            return AccountMessage.PasswordChangedStorageFailed
        }
        return synchronize(updated, AccountAction.REFRESH_SESSION) ?: AccountMessage.PasswordChanged
    }

    private suspend fun revokeOtherSessionsNow(): AccountMessage {
        if (origin == null) return AccountMessage.NotConfigured
        val stored = readSession() ?: return AccountMessage.SignInRequired
        return try {
            service.auth().withSession(stored.token).revokeOtherSessions().getOrThrowMemberError().requireSuccess()
            AccountMessage.OtherSessionsRevoked
        } catch (e: MemberApiError) {
            handle(e, AccountAction.REVOKE_OTHER_SESSIONS)
        }
    }

    private suspend fun requestAccountDeletionNow(): AccountMessage {
        if (origin == null) return AccountMessage.NotConfigured
        val stored = readSession() ?: return AccountMessage.SignInRequired
        return try {
            // Account deletion has two steps with the same session; see bizserver/docs/migration-auth.md.
            service.auth().withSession(stored.token).deleteUser().getOrThrowMemberError().requireSuccess()
            AccountMessage.DeletionCodeSent
        } catch (e: MemberApiError) {
            handle(e, AccountAction.REQUEST_ACCOUNT_DELETION)
        }
    }

    private suspend fun deleteAccountNow(rawCode: String): AccountMessage {
        // The code is pasted from an email, so drop the spaces and line breaks that come with it.
        val code = rawCode.filterNot(Char::isWhitespace)
        if (code.isEmpty()) return AccountMessage.DeletionCodeRequired
        if (origin == null) return AccountMessage.NotConfigured
        val stored = readSession() ?: return AccountMessage.SignInRequired
        try {
            service.auth().withSession(stored.token).deleteUser(token = code).getOrThrowMemberError().requireSuccess()
        } catch (e: MemberApiError) {
            if (e.serverCode == "INVALID_TOKEN") return AccountMessage.InvalidDeletionCode
            return handle(e, AccountAction.DELETE_ACCOUNT)
        }
        return if (clearLocal()) AccountMessage.AccountDeleted else AccountMessage.AccountDeletedClearFailed
    }

    private suspend fun signOutNow(): AccountMessage {
        val stored = sessions.currentQuietly()
        val serverConfirmed = if (stored != null && origin != null && stored.origin == origin) {
            try {
                service.auth().withSession(stored.token).signOut().getOrThrowMemberError()
                true
            } catch (e: MemberApiError) {
                false
            }
        } else {
            true
        }
        if (!clearLocal()) return AccountMessage.ClearFailed
        return if (serverConfirmed) AccountMessage.SignedOut else AccountMessage.SignedOutLocally
    }

    // endregion

    // region Helpers

    /**
     * Confirms the session, then reads the card. Returns a problem, or null on success.
     * Updates [state] in every case.
     */
    private suspend fun synchronize(stored: StoredSession, action: AccountAction): AccountMessage? {
        val (confirmed, problem) = confirmSession(stored, action)
        if (confirmed == null) return problem
        return loadCard(confirmed, action)
    }

    /** Reads the card for a session that the server has just confirmed. Returns a problem, or null. */
    private suspend fun loadCard(confirmed: StoredSession, action: AccountAction): AccountMessage? {
        if (!confirmed.emailVerified) {
            // The server grants no card before the email is verified. Drop the offline copy too.
            clearCacheQuietly()
            mutableState.value = AccountState.SignedIn(confirmed.toAccount(), card = null, syncedAt = null, isOffline = false)
            return null
        }
        return try {
            val card = service.memberships().current(confirmed.token)?.toCard()
            if (card == null) {
                clearCacheQuietly()
                mutableState.value = AccountState.SignedIn(confirmed.toAccount(), card = null, syncedAt = clock.instant(), isOffline = false)
            } else {
                acceptCard(confirmed, card)
            }
            null
        } catch (e: MemberApiError) {
            handle(e, action)
        }
    }

    /** Returns the confirmed session, or null with the problem. */
    private suspend fun confirmSession(
        stored: StoredSession,
        action: AccountAction,
    ): Pair<StoredSession?, AccountMessage?> {
        val session = try {
            fetchSession(stored.token)
        } catch (e: MemberApiError) {
            return null to handle(e, action)
        }
        if (session == null) {
            clearLocal()
            return null to AccountMessage.SessionExpired
        }
        if (session.user.id != stored.userId) {
            clearLocal()
            return null to AccountMessage.AccountMismatch
        }
        val updated = storedSession(stored.origin, stored.token, session)
        if (updated != stored) {
            try {
                sessions.save(updated)
            } catch (e: Exception) {
                if (!e.isStorageFailure()) throw e
                return null to AccountMessage.StorageFailed
            }
        }
        mutableState.update { current ->
            if (current is AccountState.SignedIn) current.copy(account = updated.toAccount()) else current
        }
        return updated to null
    }

    private suspend fun acceptCard(stored: StoredSession, card: MembershipCard) {
        val now = clock.instant()
        try {
            cache.write(CachedMembership(stored.origin, stored.userId, card, now.toEpochMilli()))
        } catch (e: Exception) {
            // The offline copy is optional. The confirmed card still shows.
            if (!e.isStorageFailure()) throw e
        }
        mutableState.value = AccountState.SignedIn(stored.toAccount(), card, syncedAt = now, isOffline = false)
    }

    /** The error handling of `MembershipStore.handle` on iOS. */
    private suspend fun handle(error: MemberApiError, action: AccountAction): AccountMessage {
        val code = error.serverCode
        return when {
            error is MemberApiError.NotConfigured -> AccountMessage.NotConfigured
            error.isRateLimited -> AccountMessage.TooManyRequests
            action == AccountAction.CHANGE_PASSWORD && code in WRONG_PASSWORD_CODES -> AccountMessage.WrongCurrentPassword
            action == AccountAction.CHANGE_PASSWORD && code in NO_PASSWORD_CODES -> AccountMessage.NoEmailPassword
            code == "SESSION_NOT_FRESH" || code == "FRESH_SESSION_REQUIRED" -> AccountMessage.SessionNotFresh
            error.isUnauthenticated -> {
                clearLocal()
                AccountMessage.SessionExpired
            }
            error.isEmailNotVerified -> {
                dropCard(emailVerified = false)
                AccountMessage.EmailNotVerified
            }
            error is MemberApiError.Network -> {
                markOffline()
                val hasCard = (state.value as? AccountState.SignedIn)?.card != null
                if (action == AccountAction.REFRESH && hasCard) AccountMessage.OfflineShowingCard else AccountMessage.Network(action)
            }
            error.isForbidden -> {
                dropCard(emailVerified = null)
                AccountMessage.PermissionDenied
            }
            else -> {
                if (action == AccountAction.REFRESH) markOffline()
                AccountMessage.Failed(action)
            }
        }
    }

    private suspend fun dropCard(emailVerified: Boolean?) {
        clearCacheQuietly()
        mutableState.update { current ->
            if (current !is AccountState.SignedIn) return@update current
            val account = if (emailVerified == null) current.account else current.account.copy(emailVerified = emailVerified)
            current.copy(account = account, card = null, syncedAt = null, isOffline = false)
        }
    }

    private fun markOffline() {
        mutableState.update { current -> if (current is AccountState.SignedIn) current.copy(isOffline = true) else current }
    }

    /** Returns the stored session of this server. A session of another server is deleted. */
    private suspend fun readSession(): StoredSession? {
        val stored = sessions.currentQuietly() ?: return null
        if (stored.origin == origin) return stored
        clearLocal()
        return null
    }

    /** Returns false when a file could not be cleared. The state is signed out in every case. */
    private suspend fun clearLocal(): Boolean {
        var cleared = true
        try {
            sessions.clear()
        } catch (e: Exception) {
            if (!e.isStorageFailure()) throw e
            cleared = false
        }
        if (!clearCacheQuietly()) cleared = false
        mutableState.value = if (origin == null) AccountState.NotConfigured else AccountState.SignedOut
        return cleared
    }

    private suspend fun clearCacheQuietly(): Boolean = try {
        cache.clear()
        true
    } catch (e: Exception) {
        if (!e.isStorageFailure()) throw e
        false
    }

    private suspend fun MembershipCacheStore.readQuietly(userId: String): CachedMembership? {
        val origin = origin ?: return null
        return try {
            read(origin, userId)
        } catch (e: Exception) {
            if (!e.isStorageFailure()) throw e
            null
        }
    }

    private suspend fun AuthSessionStore.currentQuietly(): StoredSession? = try {
        current()
    } catch (e: Exception) {
        if (!e.isStorageFailure()) throw e
        null
    }

    /** A view of the Better Auth client without a session, for the calls that create one or need none. */
    private fun signedOutAuth(): BetterAuthClient = service.auth().withStorage(InMemoryStorage())

    /**
     * Reads the session of [token]. Returns null when the server has no session or it has expired.
     * The SDK does not check that the session belongs to the user, or that it has an expiry.
     */
    private suspend fun fetchSession(token: String): SessionData? {
        val data = service.auth().withSession(token).getSession().getOrThrowMemberError() ?: return null
        val expiresAt = data.session.expiresAt ?: throw MemberApiError.InvalidResponse
        if (data.user.id != data.session.userId) throw MemberApiError.InvalidResponse
        return data.takeIf { expiresAt.toEpochMilliseconds() > clock.millis() }
    }

    /** [data] comes from [fetchSession], which has checked the expiry. */
    private fun storedSession(origin: String, token: String, data: SessionData) = StoredSession(
        origin = origin,
        token = token,
        userId = data.user.id,
        email = data.user.email,
        name = data.user.name,
        emailVerified = data.user.emailVerified,
        createdAtMillis = data.session.createdAt?.toEpochMilliseconds(),
        expiresAtMillis = checkNotNull(data.session.expiresAt).toEpochMilliseconds(),
    )

    private fun OperationResult.requireSuccess() {
        if (!success) throw MemberApiError.InvalidResponse
    }

    // endregion

    private companion object {
        val WRONG_PASSWORD_CODES = setOf("INVALID_PASSWORD", "INVALID_CURRENT_PASSWORD")
        val NO_PASSWORD_CODES = setOf("PASSWORD_NOT_FOUND", "CREDENTIAL_ACCOUNT_NOT_FOUND")
        val LINKING_CODES = setOf("LINKING_NOT_ALLOWED", "LINKING_DIFFERENT_EMAILS_NOT_ALLOWED")

        /** Provider ID of Google in Better Auth, `google::PROVIDER_ID` in bizserver. */
        const val GOOGLE_PROVIDER = "google"
    }
}

/** File and Keystore failures. Other exceptions, including cancellation, are bugs and propagate. */
private fun Exception.isStorageFailure(): Boolean =
    this is IOException || this is GeneralSecurityException || this is ProviderException
