package club.leanmuscle.boji.wear.data

import club.leanmuscle.boji.shared.companion.CompanionSnapshot
import java.io.IOException
import java.time.Instant
import java.time.ZoneId
import kotlin.coroutines.cancellation.CancellationException
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout

/** The connection to the phone, like `WatchCompanionStore.State` on iOS. */
enum class ConnectionState {
    Starting,
    Requesting,
    Offline,
    Ready,
    Unavailable,
    Failed,
}

/** What the watch screen shows. */
sealed interface Presentation {
    data object NoData : Presentation

    data object SharingDisabled : Presentation

    data class Current(val snapshot: CompanionSnapshot) : Presentation

    /** A saved snapshot from another day, or with a clock far in the future. Its check-ins stay hidden. */
    data object Stale : Presentation
}

data class WatchState(
    val connection: ConnectionState = ConnectionState.Starting,
    /** The newest snapshot with sharing on, or null. */
    val snapshot: CompanionSnapshot? = null,
    /** True when the newest snapshot says that sharing is off. */
    val isSharingDisabled: Boolean = false,
) {
    /** The refresh button works only while a phone is connected and no request is running. */
    val canRequest: Boolean get() = connection == ConnectionState.Ready || connection == ConnectionState.Failed

    fun presentation(now: Instant, zone: ZoneId): Presentation = when {
        isSharingDisabled -> Presentation.SharingDisabled
        snapshot == null -> Presentation.NoData
        snapshot.isCurrent(now, zone) -> Presentation.Current(snapshot)
        else -> Presentation.Stale
    }
}

/**
 * The watch's copy of today's check-ins, like `WatchCompanionStore` on iOS. One instance lives in
 * [club.leanmuscle.boji.wear.WatchApplication], so the screen and [SnapshotListenerService] share it.
 *
 * Like iOS, only a snapshot with a newer `generatedAt` replaces the current one, and the last
 * snapshot survives a restart. A snapshot with sharing off clears the shown check-ins.
 */
class WatchCompanionRepository(
    private val link: PhoneLink,
    private val store: SnapshotStore,
    private val io: CoroutineDispatcher = Dispatchers.IO,
) {
    private val _state = MutableStateFlow(WatchState())
    val state: StateFlow<WatchState> = _state.asStateFlow()

    private val lock = Mutex()
    private var loaded = false
    private var newestGeneratedAt: Instant? = null

    /** Checks the phone and asks for a snapshot when it is connected. The screen calls this when it appears. */
    suspend fun connect() {
        loadSaved()
        val phone = findPhone() ?: return
        request(phone)
    }

    /** The refresh button. */
    suspend fun refresh() {
        val phone = findPhone() ?: return
        request(phone)
    }

    /** A phone connected or disconnected. Like iOS, this updates the state but does not send a request. */
    suspend fun updateReachability() {
        if (_state.value.connection == ConnectionState.Requesting) return
        findPhone()
    }

    /**
     * Stores a snapshot from the phone. Returns false when the bytes are not a valid snapshot.
     * An older snapshot is valid but changes nothing.
     */
    suspend fun receive(bytes: ByteArray): Boolean {
        val snapshot = CompanionSnapshot.decode(bytes) ?: return false
        loadSaved()
        lock.withLock {
            val newest = newestGeneratedAt
            if (newest != null && !snapshot.generatedAt.isAfter(newest)) return true
            newestGeneratedAt = snapshot.generatedAt
            apply(snapshot)
            withContext(io) {
                try {
                    store.save(snapshot.encode())
                } catch (_: IOException) {
                    // The screen still shows it. Without a saved file the next start shows no data.
                }
            }
        }
        return true
    }

    private suspend fun loadSaved() {
        lock.withLock {
            if (loaded) return
            loaded = true
            val saved = withContext(io) { store.load() }?.let(CompanionSnapshot::decode) ?: return
            val newest = newestGeneratedAt
            if (newest == null || saved.generatedAt.isAfter(newest)) {
                newestGeneratedAt = saved.generatedAt
                apply(saved)
            }
        }
    }

    private fun apply(snapshot: CompanionSnapshot) {
        _state.update {
            if (snapshot.isSharingEnabled) {
                it.copy(snapshot = snapshot, isSharingDisabled = false)
            } else {
                it.copy(snapshot = null, isSharingDisabled = true)
            }
        }
    }

    /** Sets Unavailable, Offline or Ready and returns the phone node. */
    private suspend fun findPhone(): String? {
        if (!link.isAvailable()) {
            setConnection(ConnectionState.Unavailable)
            return null
        }
        val phone = try {
            link.reachablePhone()
        } catch (error: CancellationException) {
            throw error
        } catch (_: Exception) {
            setConnection(ConnectionState.Failed)
            return null
        }
        setConnection(if (phone == null) ConnectionState.Offline else ConnectionState.Ready)
        return phone
    }

    private suspend fun request(phone: String) {
        setConnection(ConnectionState.Requesting)
        val reply = try {
            withTimeout(REQUEST_TIMEOUT_MILLIS) { link.requestSnapshot(phone) }
        } catch (_: TimeoutCancellationException) {
            null
        } catch (error: CancellationException) {
            throw error
        } catch (_: Exception) {
            null
        }
        if (reply != null && receive(reply)) {
            setConnection(ConnectionState.Ready)
        } else {
            // Like iOS: a failed request while the phone is still there is a failure, otherwise offline.
            val stillThere = try {
                link.reachablePhone() != null
            } catch (error: CancellationException) {
                throw error
            } catch (_: Exception) {
                false
            }
            setConnection(if (stillThere) ConnectionState.Failed else ConnectionState.Offline)
        }
    }

    private fun setConnection(value: ConnectionState) {
        _state.update { it.copy(connection = value) }
    }

    private companion object {
        const val REQUEST_TIMEOUT_MILLIS = 15_000L
    }
}
