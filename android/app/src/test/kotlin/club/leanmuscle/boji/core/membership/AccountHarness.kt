package club.leanmuscle.boji.core.membership

import club.leanmuscle.boji.core.auth.AuthSessionStore
import club.leanmuscle.boji.core.auth.AuthState
import club.leanmuscle.boji.core.auth.StoredSession
import club.leanmuscle.boji.core.auth.TestCipher
import club.leanmuscle.boji.core.di.encryptedDataStore
import club.leanmuscle.boji.core.network.MemberService
import club.leanmuscle.boji.core.network.MemberServiceConfig
import club.leanmuscle.boji.core.network.ServerEndpoint
import dagger.Lazy
import java.io.File
import java.time.Clock
import java.time.Instant
import java.time.ZoneOffset
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.job
import okhttp3.OkHttpClient

/**
 * A [MembershipRepository] wired as in the app, with files in [dir] and [TestCipher] instead of the
 * Keystore. The repository is created on first access, so that a test can [seed] the stores first.
 *
 * DataStore allows one active instance per file. Call [close] before opening the same files again.
 */
class AccountHarness(
    private val dir: File,
    parent: CoroutineScope,
    private val endpoint: ServerEndpoint?,
    val clock: Clock = FIXED_CLOCK,
) {
    private val job = SupervisorJob(parent.coroutineContext.job)
    private val scope = CoroutineScope(Dispatchers.IO + job)
    private val cipher = TestCipher()

    val sessionFile = File(dir, AuthSessionStore.FILE_NAME)
    val cacheFile = File(dir, MembershipCacheStore.FILE_NAME)

    val sessions = AuthSessionStore(
        encryptedDataStore(sessionFile, AuthState.serializer(), AuthState(), cipher, AuthSessionStore.PURPOSE, scope) {
            it.session == null
        },
    )

    val cache = MembershipCacheStore(
        encryptedDataStore(
            cacheFile,
            MembershipCacheState.serializer(),
            MembershipCacheState(),
            cipher,
            MembershipCacheStore.PURPOSE,
            scope,
        ) { it.entry == null },
    )

    private val httpClient = OkHttpClient.Builder().callTimeout(10, TimeUnit.SECONDS).build()

    val repository: MembershipRepository by lazy {
        MembershipRepository(
            service = MemberService(MemberServiceConfig(endpoint), Lazy { httpClient }, clock),
            sessions = sessions,
            cache = cache,
            clock = clock,
            scope = scope,
            io = Dispatchers.IO,
        )
    }

    /** A session of [endpoint] for [FakeMemberServer.USER_ID]. */
    fun storedSession(token: String = "tok-1", emailVerified: Boolean = true, origin: String? = endpoint?.origin) =
        StoredSession(
            origin = checkNotNull(origin),
            token = token,
            userId = FakeMemberServer.USER_ID,
            email = FakeMemberServer.EMAIL,
            name = "小林",
            emailVerified = emailVerified,
            createdAtMillis = Instant.parse("2026-10-20T07:00:00Z").toEpochMilli(),
            expiresAtMillis = Instant.parse("2026-11-20T08:00:00Z").toEpochMilli(),
        )

    /** Writes the session and, when given, the offline copy of [card] synced at [syncedAt]. */
    suspend fun seed(session: StoredSession, card: MembershipCard? = null, syncedAt: Instant = SYNCED_AT) {
        sessions.save(session)
        if (card != null) cache.write(CachedMembership(session.origin, session.userId, card, syncedAt.toEpochMilli()))
    }

    /** Waits until the restore at launch has finished. */
    suspend fun awaitRestore() {
        repository.state.first { it != AccountState.Restoring }
        // The state leaves Restoring inside the restore operation, so busy is still true here.
        repository.busy.first { !it }
    }

    suspend fun close() = job.cancelAndJoin()

    companion object {
        val FIXED_CLOCK: Clock = Clock.fixed(Instant.parse("2026-10-20T08:00:00Z"), ZoneOffset.UTC)
        val SYNCED_AT: Instant = Instant.parse("2026-10-19T08:00:00Z")
    }
}
