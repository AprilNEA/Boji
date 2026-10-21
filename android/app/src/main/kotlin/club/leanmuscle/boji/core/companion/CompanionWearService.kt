package club.leanmuscle.boji.core.companion

import club.leanmuscle.boji.core.di.ApplicationScope
import club.leanmuscle.boji.shared.companion.CompanionDataLayer
import com.google.android.gms.tasks.Task
import com.google.android.gms.tasks.TaskCompletionSource
import com.google.android.gms.wearable.WearableListenerService
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject
import kotlin.coroutines.cancellation.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

/**
 * Answers the watch app's request for today's snapshot, like the `didReceiveMessage` reply on iOS.
 * Google Play services binds this service when a request arrives, so it also works while the
 * phone app is not running. The manifest filters it to [CompanionDataLayer.REQUEST_PATH].
 */
@AndroidEntryPoint
class CompanionWearService : WearableListenerService() {
    @Inject
    lateinit var sync: WearCompanionSync

    @Inject
    @ApplicationScope
    lateinit var scope: CoroutineScope

    override fun onRequest(nodeId: String, path: String, request: ByteArray): Task<ByteArray>? {
        if (path != CompanionDataLayer.REQUEST_PATH) return null
        val reply = TaskCompletionSource<ByteArray>()
        scope.launch {
            try {
                reply.setResult(sync.snapshotForRequest().encode())
            } catch (error: CancellationException) {
                // The timeout while state.json loads. The watch shows that the request failed.
                reply.setException(error)
            } catch (error: Exception) {
                reply.setException(error)
            }
        }
        return reply.task
    }
}
