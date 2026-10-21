package club.leanmuscle.boji

import club.leanmuscle.boji.core.companion.WatchLink
import club.leanmuscle.boji.core.companion.WatchNodes
import club.leanmuscle.boji.core.di.WatchLinkModule
import dagger.Module
import dagger.Provides
import dagger.hilt.components.SingletonComponent
import dagger.hilt.testing.TestInstallIn
import java.util.concurrent.CopyOnWriteArrayList
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow

/** Wear OS Data Layer stand-in for UI tests. Emulators have no paired watch. */
class FakeUiWatchLink : WatchLink {
    @Volatile var nodes: WatchNodes = WatchNodes(reachable = listOf("watch-1"), withApp = 1, connected = 1)
    val sentPaths = CopyOnWriteArrayList<String>()
    val changeEvents = MutableSharedFlow<Unit>(extraBufferCapacity = 8)

    override suspend fun isAvailable(): Boolean = true

    override suspend fun watches(): WatchNodes = nodes

    override suspend fun send(nodeId: String, path: String, payload: ByteArray) {
        sentPaths += path
    }

    override val changes: Flow<Unit> = changeEvents
}

@Module
@TestInstallIn(components = [SingletonComponent::class], replaces = [WatchLinkModule::class])
object TestWatchLinkModule {
    @Provides
    @Singleton
    fun fakeWatchLink(): FakeUiWatchLink = FakeUiWatchLink()

    @Provides
    fun watchLink(fake: FakeUiWatchLink): WatchLink = fake
}
