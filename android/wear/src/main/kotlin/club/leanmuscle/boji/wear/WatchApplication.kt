package club.leanmuscle.boji.wear

import android.app.Application
import club.leanmuscle.boji.wear.data.FileSnapshotStore
import club.leanmuscle.boji.wear.data.PhoneLink
import club.leanmuscle.boji.wear.data.WatchCompanionRepository
import club.leanmuscle.boji.wear.data.WearablePhoneLink

/**
 * Holds the one [WatchCompanionRepository] of the process, which the screen and
 * [club.leanmuscle.boji.wear.data.SnapshotListenerService] share. The watch app has few objects, so
 * it creates them here instead of using Hilt.
 */
class WatchApplication : Application() {
    val phoneLink: PhoneLink by lazy { WearablePhoneLink(this) }

    val companion: WatchCompanionRepository by lazy {
        WatchCompanionRepository(link = phoneLink, store = FileSnapshotStore(noBackupFilesDir))
    }
}
