package club.leanmuscle.boji.core.membership

import club.leanmuscle.boji.core.auth.AuthSessionStore
import club.leanmuscle.boji.core.di.ApplicationScope
import club.leanmuscle.boji.core.di.IoDispatcher
import club.leanmuscle.boji.core.network.MemberApiError
import club.leanmuscle.boji.core.network.MemberService
import club.leanmuscle.boji.core.network.getOrThrowMemberError
import club.leanmuscle.boji.core.network.isForbidden
import club.leanmuscle.boji.core.network.isUnauthenticated
import club.leanmuscle.boji.core.network.serverCode
import io.github.betterauth.client.plugins.admin.admin
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.launch
import java.time.Clock
import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton

/** A member code that staff scanned, and the card it points to. Matches `MembershipVerification` on iOS. */
data class MembershipVerification(val card: MembershipCard, val kind: Kind) {

    enum class Kind {
        /** The static QR code of the Wallet pass. It never changes, so it can be a screenshot. */
        WALLET_PASS,

        /** The dynamic code that the member shows in the app. */
        APP,
    }

    enum class Standing { VALID, SUSPENDED, EXPIRED }

    /**
     * A valid card has a known tier, the active state and no past expiry. An active card past its expiry
     * is expired. Every other card counts as suspended.
     */
    fun standing(now: Instant): Standing {
        val condition = card.condition(isOffline = false, now = now)
        return when {
            condition == CardCondition.ACTIVE -> Standing.VALID
            condition == CardCondition.EXPIRED && card.state == MembershipCard.STATE_ACTIVE -> Standing.EXPIRED
            else -> Standing.SUSPENDED
        }
    }
}

/** Why a verification failed. `MembershipText` maps each value to the shared copy. */
enum class ScanProblem { INVALID, CODE_EXPIRED, NOT_FOUND, NOT_CONFIGURED, SIGN_IN_AGAIN, FORBIDDEN, NETWORK, FAILED }

sealed interface ScanOutcome {
    /** [standing] is the state of the card at the time of the verification. */
    data class Verified(
        val verification: MembershipVerification,
        val standing: MembershipVerification.Standing,
    ) : ScanOutcome

    data class Failed(val problem: ScanProblem) : ScanOutcome
}

/**
 * Staff verification of member codes. Mirrors `MembershipVerifier` on iOS.
 *
 * The permission only decides whether the app shows the scanner. bizserver authorizes every verification
 * again. The result holds a member number and a nickname, so it lives in memory only. It disappears when
 * staff dismiss it and when the signed-in account changes or signs out.
 */
@Singleton
class MembershipVerifier @Inject constructor(
    private val service: MemberService,
    private val sessions: AuthSessionStore,
    private val repository: MembershipRepository,
    private val clock: Clock,
    @param:ApplicationScope private val scope: CoroutineScope,
    @param:IoDispatcher private val io: CoroutineDispatcher,
) {
    private val origin: String? = service.endpoint?.origin

    private val mutableCanVerify = MutableStateFlow(false)

    /** True when the operator role of the signed-in account may verify member codes. */
    val canVerify: StateFlow<Boolean> = mutableCanVerify.asStateFlow()

    private val mutableVerifying = MutableStateFlow(false)
    val verifying: StateFlow<Boolean> = mutableVerifying.asStateFlow()

    private val mutableOutcome = MutableStateFlow<ScanOutcome?>(null)

    /** The latest result. While it is set, [verify] ignores new values. */
    val outcome: StateFlow<ScanOutcome?> = mutableOutcome.asStateFlow()

    private val lock = Any()

    /** The account that the permission and the result belong to. */
    private var owner: String? = null

    /** [adopt] adds one for each new account. A request that returns after a change drops its result. */
    private var generation = 0

    init {
        scope.launch {
            val accounts = repository.state.combine(repository.membershipCodeEnabled) { state, enabled ->
                (state as? AccountState.SignedIn)?.account?.userId to enabled
            }
            accounts.distinctUntilChanged().collectLatest { (userId, enabled) ->
                adopt(userId)
                refreshNow(enabled)
            }
        }
    }

    /** Asks the server again, for example when the member center opens. A failure means no permission. */
    suspend fun refreshPermission() {
        val userId = (repository.state.value as? AccountState.SignedIn)?.account?.userId
        adopt(userId)
        refreshNow(repository.membershipCodeEnabled.value)
    }

    /**
     * Verifies a scanned or typed member code. The camera reads the same QR code many times, so a value
     * that arrives while a verification runs or while a result is shown does nothing.
     */
    suspend fun verify(rawValue: String) {
        val value = rawValue.trim()
        if (value.isEmpty() || mutableOutcome.value != null) return
        val generation = synchronized(lock) {
            if (mutableVerifying.value) return
            mutableVerifying.value = true
            generation
        }
        // The request runs in the application scope, as the operations of MembershipRepository do.
        val result = scope.async(io) { verifyNow(value) }.await()
        synchronized(lock) {
            if (generation != this.generation) return
            // The role is gone. Hide the entry, so that it is not shown after the sheet closes.
            if (result is ScanOutcome.Failed && result.problem == ScanProblem.FORBIDDEN) mutableCanVerify.value = false
            mutableVerifying.value = false
            mutableOutcome.value = result
        }
    }

    /** Dismisses the result, so that staff can scan the next code. */
    fun clearOutcome() {
        mutableOutcome.value = null
    }

    private suspend fun verifyNow(value: String): ScanOutcome {
        val token = token() ?: return ScanOutcome.Failed(ScanProblem.FORBIDDEN)
        return try {
            val verification = service.memberships().verify(token, value)
            ScanOutcome.Verified(verification, verification.standing(clock.instant()))
        } catch (e: MemberApiError) {
            ScanOutcome.Failed(problemFor(e))
        }
    }

    private suspend fun refreshNow(enabled: Boolean) {
        val generation = synchronized(lock) { generation }
        val allowed = enabled && scope.async(io) {
            val token = token() ?: return@async false
            try {
                service.auth().withSession(token).admin
                    .hasPermission(STAFF_PERMISSIONS)
                    .getOrThrowMemberError()
                    .success
            } catch (_: MemberApiError) {
                false
            }
        }.await()
        synchronized(lock) {
            if (generation == this.generation) mutableCanVerify.value = allowed
        }
    }

    /** Clears the permission and the result when [userId] is not the account they belong to. */
    private fun adopt(userId: String?) = synchronized(lock) {
        if (userId == owner) return@synchronized
        owner = userId
        generation += 1
        mutableCanVerify.value = false
        mutableVerifying.value = false
        mutableOutcome.value = null
    }

    /** The session token of [owner] on this server, or null. */
    private suspend fun token(): String? {
        val stored = try {
            sessions.current()
        } catch (e: Exception) {
            if (!e.isStorageFailure()) throw e
            null
        } ?: return null
        val expected = synchronized(lock) { owner }
        return stored.token.takeIf { stored.origin == origin && stored.userId == expected }
    }

    private fun problemFor(error: MemberApiError): ScanProblem {
        if (error is MemberApiError.Network) return ScanProblem.NETWORK
        return when (error.serverCode) {
            "MEMBERSHIP_CODE_INVALID" -> ScanProblem.INVALID
            "MEMBERSHIP_CODE_EXPIRED" -> ScanProblem.CODE_EXPIRED
            "MEMBERSHIP_NOT_FOUND" -> ScanProblem.NOT_FOUND
            "MEMBERSHIP_CODE_NOT_CONFIGURED" -> ScanProblem.NOT_CONFIGURED
            "FRESH_SESSION_REQUIRED", "SESSION_REQUIRED" -> ScanProblem.SIGN_IN_AGAIN
            else -> when {
                error.isUnauthenticated -> ScanProblem.SIGN_IN_AGAIN
                error.isForbidden -> ScanProblem.FORBIDDEN
                else -> ScanProblem.FAILED
            }
        }
    }
}

/** The Better Auth permission that bizserver requires for `VerifyMembershipCode`. */
private val STAFF_PERMISSIONS = mapOf("membership" to listOf("read"))
