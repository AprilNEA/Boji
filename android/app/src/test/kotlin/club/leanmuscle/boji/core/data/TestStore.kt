package club.leanmuscle.boji.core.data

import androidx.datastore.core.DataStoreFactory
import club.leanmuscle.boji.core.model.BojiState
import java.io.File
import java.time.ZonedDateTime
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.job

/**
 * A [BojiStore] on [file] with a real DataStore, as in the app. It runs in a child of
 * [parent], usually `TestScope.backgroundScope`.
 *
 * DataStore allows one active instance per file. Call [close] before opening the same file again.
 */
class TestStore(file: File, parent: CoroutineScope, now: () -> ZonedDateTime = ZonedDateTime::now) {
    private val job = Job(parent.coroutineContext.job)
    private val scope = CoroutineScope(parent.coroutineContext + job)
    private val defaultDisplayName = { BojiState.DEFAULT_DISPLAY_NAME }

    val store = BojiStore(
        dataStore = DataStoreFactory.create(
            serializer = BojiStateSerializer(defaultDisplayName),
            scope = scope,
            produceFile = { file },
        ),
        stateFile = file,
        externalScope = scope,
        defaultDisplayName = defaultDisplayName,
        now = now,
    )

    suspend fun close() = job.cancelAndJoin()
}
