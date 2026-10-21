package club.leanmuscle.boji.core.companion

import club.leanmuscle.boji.shared.companion.CompanionSnapshot
import java.time.Clock
import java.time.Instant
import java.time.ZoneId
import java.time.ZoneOffset
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow

/** A Data Layer without Google Play services. Tests set the watches and read what was sent. */
class FakeWatchLink(
    var available: Boolean = true,
    var nodes: WatchNodes = WatchNodes(reachable = listOf("watch-1"), withApp = 1, connected = 1),
) : WatchLink {
    /** Each message as (node, path, snapshot). */
    val sent = mutableListOf<Triple<String, String, CompanionSnapshot>>()
    var failure: Exception? = null
    val changeEvents = MutableSharedFlow<Unit>(extraBufferCapacity = 8)

    val lastSnapshot: CompanionSnapshot? get() = sent.lastOrNull()?.third

    override suspend fun isAvailable(): Boolean = available

    override suspend fun watches(): WatchNodes {
        failure?.let { throw it }
        return nodes
    }

    override suspend fun send(nodeId: String, path: String, payload: ByteArray) {
        failure?.let { throw it }
        sent += Triple(nodeId, path, checkNotNull(CompanionSnapshot.decode(payload)) { "The phone sent an invalid snapshot." })
    }

    override val changes: Flow<Unit> = changeEvents
}

class InMemoryCompanionSettings(initial: Boolean = false) : CompanionSettings {
    private val state = MutableStateFlow(initial)
    override val sharingEnabled: Flow<Boolean> = state

    override suspend fun setSharingEnabled(value: Boolean) {
        state.value = value
    }
}

/** A clock that moves only when the test sets [instant]. */
class MutableClock(var instant: Instant, private val zone: ZoneId = ZoneOffset.UTC) : Clock() {
    override fun getZone(): ZoneId = zone

    override fun withZone(zone: ZoneId): Clock = MutableClock(instant, zone)

    override fun instant(): Instant = instant
}
