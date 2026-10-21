package club.leanmuscle.boji.core.companion

import club.leanmuscle.boji.core.data.BojiStore
import club.leanmuscle.boji.core.di.ApplicationScope
import club.leanmuscle.boji.core.model.BojiSnapshot
import club.leanmuscle.boji.core.model.PlanKind
import club.leanmuscle.boji.core.model.StorageError
import club.leanmuscle.boji.shared.companion.CompanionDataLayer
import club.leanmuscle.boji.shared.companion.CompanionProgress
import club.leanmuscle.boji.shared.companion.CompanionSnapshot
import java.time.Clock
import java.time.Instant
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.coroutines.cancellation.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withTimeout

/** What Settings says about the watch while sharing is on, like `watchStatus` on iOS. */
enum class WatchStatus {
    /** The phone has not asked the Data Layer yet. */
    Checking,

    /** The phone cannot use the Wearable API. */
    Unavailable,

    /** No watch is connected. */
    NoWatch,

    /** A watch is connected, but it does not have the Boji watch app. */
    AppMissing,

    /** A watch has the Boji watch app but is not connected now. It gets the snapshot when it asks. */
    Waiting,

    /** The last snapshot reached every connected Boji watch app. */
    Connected,

    /** A Data Layer call failed. */
    Failed,
}

/** The localized title of a plan. The snapshot sends it, so the watch needs no plan copy. */
fun interface PlanTitles {
    fun title(plan: PlanKind): String
}

/**
 * Sends today's check-ins to the watch app, like `CompanionSharingStore` on iOS. It sends a new
 * snapshot when the sharing switch or a check-in changes and when a watch connects, and
 * [CompanionWearService] answers the watch's requests with [snapshotForRequest].
 *
 * Only Data Layer messages carry the snapshot. They are not stored on the phone or in the cloud.
 */
@Singleton
class WearCompanionSync @Inject constructor(
    private val store: BojiStore,
    private val settings: CompanionSettings,
    private val planTitles: PlanTitles,
    private val link: WatchLink,
    private val clock: Clock,
    @param:ApplicationScope private val scope: CoroutineScope,
) {
    private val current = MutableStateFlow<CompanionSnapshot?>(null)
    private val sending = Mutex()
    private val _status = MutableStateFlow(WatchStatus.Checking)
    val status: StateFlow<WatchStatus> = _status.asStateFlow()

    fun start() {
        scope.launch {
            combine(store.snapshot.filterNotNull(), settings.sharingEnabled) { snapshot, enabled -> Input(snapshot, enabled) }
                .distinctUntilChanged()
                .collectLatest { publish(it) }
        }
        scope.launch {
            link.changes.collect { refreshStatus() }
        }
    }

    /** Sends the current snapshot again and updates [status]. Settings calls this when it opens. */
    suspend fun refreshStatus() {
        current.value?.let { send(it) }
    }

    /** The snapshot for a watch request. Waits up to five seconds for state.json after a cold start. */
    suspend fun snapshotForRequest(): CompanionSnapshot = withTimeout(REQUEST_WAIT_MILLIS) { current.filterNotNull().first() }

    private suspend fun publish(input: Input) {
        val previous = current.value
        // Each snapshot is newer than the last one, so the watch never keeps an older one.
        val generatedAt = clock.instant().let { now ->
            if (previous != null && !now.isAfter(previous.generatedAt)) previous.generatedAt.plusMillis(1) else now
        }
        val snapshot = when {
            !input.sharingEnabled -> CompanionSnapshot.disabled(generatedAt, input.snapshot.zone)
            // Without readable data the phone does not know today's check-ins. Keep the last snapshot.
            input.snapshot.storageError is StorageError.ReadFailed -> return
            else -> CompanionSnapshot.of(input.snapshot.companionProgress(), generatedAt)
        }
        if (previous != null && snapshot.sameContent(previous)) return
        current.value = snapshot
        send(snapshot)
    }

    private suspend fun send(snapshot: CompanionSnapshot) = sending.withLock {
        _status.value = try {
            if (!link.isAvailable()) {
                WatchStatus.Unavailable
            } else {
                val watches = link.watches()
                val payload = snapshot.encode()
                for (node in watches.reachable) link.send(node, CompanionDataLayer.SNAPSHOT_PATH, payload)
                when {
                    watches.reachable.isNotEmpty() -> WatchStatus.Connected
                    watches.withApp > 0 -> WatchStatus.Waiting
                    watches.connected > 0 -> WatchStatus.AppMissing
                    else -> WatchStatus.NoWatch
                }
            }
        } catch (error: CancellationException) {
            throw error
        } catch (_: Exception) {
            WatchStatus.Failed
        }
    }

    private fun BojiSnapshot.companionProgress(): CompanionProgress {
        val status = dailyStatus()
        return CompanionProgress(
            dayKey = CompanionSnapshot.dayKey(today),
            trainingCompleted = status.trainingCompleted,
            waterLogged = status.waterLogged,
            sleepLogged = status.sleepLogged,
            planTitle = planTitles.title(state.selectedPlan),
        )
    }

    private data class Input(val snapshot: BojiSnapshot, val sharingEnabled: Boolean)

    private companion object {
        const val REQUEST_WAIT_MILLIS = 5_000L
    }
}

/** Equal apart from the time. A new nickname or a new amount of water does not send anything. */
private fun CompanionSnapshot.sameContent(other: CompanionSnapshot) = copy(generatedAt = Instant.EPOCH) == other.copy(generatedAt = Instant.EPOCH)
