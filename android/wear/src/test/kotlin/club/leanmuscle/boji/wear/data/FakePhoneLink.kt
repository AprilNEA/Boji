package club.leanmuscle.boji.wear.data

import java.io.IOException
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow

/** A Data Layer without Google Play services. Tests set the phone and its replies. */
class FakePhoneLink(
    var available: Boolean = true,
    var phone: String? = "phone-1",
) : PhoneLink {
    var reply: () -> ByteArray = { throw IOException("No reply set") }
    var hangs = false
    var requests = 0
    val changeEvents = MutableSharedFlow<Unit>(extraBufferCapacity = 8)

    override suspend fun isAvailable(): Boolean = available

    override suspend fun reachablePhone(): String? = phone

    override suspend fun requestSnapshot(nodeId: String): ByteArray {
        requests++
        if (hangs) awaitCancellation()
        return reply()
    }

    override val changes: Flow<Unit> = changeEvents
}

class InMemorySnapshotStore(var bytes: ByteArray? = null) : SnapshotStore {
    var failWrites = false

    override fun load(): ByteArray? = bytes

    override fun save(bytes: ByteArray) {
        if (failWrites) throw IOException("Disk full")
        this.bytes = bytes
    }
}
