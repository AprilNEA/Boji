package club.leanmuscle.boji.wear.data

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

/** The watch's side of the Data Layer. [WearablePhoneLink] is the real one; tests replace it. */
interface PhoneLink {
    /** False when this watch cannot use the Wearable API. */
    suspend fun isAvailable(): Boolean

    /** A connected phone that runs the Boji phone app, nearby first, or null when there is none. */
    suspend fun reachablePhone(): String?

    /** Asks [nodeId] for today's snapshot and returns the reply. */
    suspend fun requestSnapshot(nodeId: String): ByteArray

    /** Emits when a phone with the Boji phone app connects or disconnects. */
    val changes: Flow<Unit>
}

class WearablePhoneLink(context: Context) : PhoneLink {
    private val context = context.applicationContext
    private val capabilities by lazy { Wearable.getCapabilityClient(this.context) }
    private val messages by lazy { Wearable.getMessageClient(this.context) }

    override suspend fun isAvailable(): Boolean = try {
        GoogleApiAvailability.getInstance().checkApiAvailability(capabilities).await()
        true
    } catch (error: CancellationException) {
        throw error
    } catch (_: Exception) {
        false
    }

    override suspend fun reachablePhone(): String? {
        val nodes = capabilities.getCapability(CompanionDataLayer.PHONE_CAPABILITY, CapabilityClient.FILTER_REACHABLE).await().nodes
        return (nodes.firstOrNull { it.isNearby } ?: nodes.firstOrNull())?.id
    }

    override suspend fun requestSnapshot(nodeId: String): ByteArray =
        messages.sendRequest(nodeId, CompanionDataLayer.REQUEST_PATH, ByteArray(0)).await()

    override val changes: Flow<Unit> = callbackFlow {
        val listener = CapabilityClient.OnCapabilityChangedListener { trySend(Unit) }
        try {
            capabilities.addListener(listener, CompanionDataLayer.PHONE_CAPABILITY).await()
        } catch (error: CancellationException) {
            throw error
        } catch (_: Exception) {
            // Without the Wearable API nothing ever changes.
        }
        awaitClose { capabilities.removeListener(listener, CompanionDataLayer.PHONE_CAPABILITY) }
    }
}
