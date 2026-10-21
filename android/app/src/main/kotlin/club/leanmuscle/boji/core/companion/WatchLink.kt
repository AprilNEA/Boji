package club.leanmuscle.boji.core.companion

import android.content.Context
import club.leanmuscle.boji.shared.companion.CompanionDataLayer
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.wearable.CapabilityClient
import com.google.android.gms.wearable.Wearable
import kotlin.coroutines.cancellation.CancellationException
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

/** The watches that the phone can see. Node IDs come from the Wear OS Data Layer. */
data class WatchNodes(
    /** Watches that run the Boji watch app and are connected now. Snapshots go to these. */
    val reachable: List<String>,
    /** Watches that have the Boji watch app, connected or not. */
    val withApp: Int,
    /** Connected watches, with or without the Boji watch app. */
    val connected: Int,
)

/** The phone's side of the Data Layer. [WearableWatchLink] is the real one; tests replace it. */
interface WatchLink {
    /** False when this phone cannot use the Wearable API, for example without Google Play services. */
    suspend fun isAvailable(): Boolean

    suspend fun watches(): WatchNodes

    /** Sends one message. Messages are not stored or retried, so a watch that is away misses it. */
    suspend fun send(nodeId: String, path: String, payload: ByteArray)

    /** Emits when a watch with the Boji watch app connects or disconnects. */
    val changes: Flow<Unit>
}

class WearableWatchLink(context: Context) : WatchLink {
    private val context = context.applicationContext
    private val capabilities by lazy { Wearable.getCapabilityClient(this.context) }
    private val messages by lazy { Wearable.getMessageClient(this.context) }
    private val nodes by lazy { Wearable.getNodeClient(this.context) }

    override suspend fun isAvailable(): Boolean = try {
        GoogleApiAvailability.getInstance().checkApiAvailability(capabilities).await()
        true
    } catch (error: CancellationException) {
        throw error
    } catch (_: Exception) {
        // AvailabilityException, or an ApiException from an old Play services version.
        false
    }

    override suspend fun watches(): WatchNodes {
        val reachable = capabilities.getCapability(CompanionDataLayer.WATCH_CAPABILITY, CapabilityClient.FILTER_REACHABLE).await().nodes
        val all = capabilities.getCapability(CompanionDataLayer.WATCH_CAPABILITY, CapabilityClient.FILTER_ALL).await().nodes
        val connected = nodes.connectedNodes.await()
        return WatchNodes(
            // Nearby watches first: Bluetooth costs less battery than a cloud connection.
            reachable = reachable.sortedByDescending { it.isNearby }.map { it.id },
            withApp = all.size,
            connected = connected.size,
        )
    }

    override suspend fun send(nodeId: String, path: String, payload: ByteArray) {
        messages.sendMessage(nodeId, path, payload).await()
    }

    override val changes: Flow<Unit> = callbackFlow {
        val listener = CapabilityClient.OnCapabilityChangedListener { trySend(Unit) }
        try {
            capabilities.addListener(listener, CompanionDataLayer.WATCH_CAPABILITY).await()
        } catch (error: CancellationException) {
            throw error
        } catch (_: Exception) {
            // Without the Wearable API nothing ever changes.
        }
        awaitClose { capabilities.removeListener(listener, CompanionDataLayer.WATCH_CAPABILITY) }
    }
}
