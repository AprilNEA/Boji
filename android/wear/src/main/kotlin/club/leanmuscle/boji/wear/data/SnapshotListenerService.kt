package club.leanmuscle.boji.wear.data

import club.leanmuscle.boji.shared.companion.CompanionDataLayer
import club.leanmuscle.boji.wear.WatchApplication
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService
import kotlinx.coroutines.runBlocking

/**
 * Receives the snapshots that the phone app sends while the watch is connected. The system binds
 * this service also when the watch app is not open, so the next start shows the newest check-ins.
 */
class SnapshotListenerService : WearableListenerService() {
    override fun onMessageReceived(event: MessageEvent) {
        if (event.path != CompanionDataLayer.SNAPSHOT_PATH) return
        val repository = (application as WatchApplication).companion
        // Listener callbacks run on a background thread. Block it until the snapshot is saved,
        // so the system does not unbind the service in the middle of the write.
        runBlocking { repository.receive(event.data) }
    }
}
