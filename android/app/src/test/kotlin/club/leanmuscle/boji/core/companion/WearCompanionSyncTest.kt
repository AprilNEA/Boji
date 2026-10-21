package club.leanmuscle.boji.core.companion

import club.leanmuscle.boji.core.data.BojiStore
import club.leanmuscle.boji.core.data.TestStore
import club.leanmuscle.boji.core.model.PlanKind
import club.leanmuscle.boji.core.model.WorkoutLibrary
import club.leanmuscle.boji.shared.companion.CompanionDataLayer
import java.io.File
import java.io.IOException
import java.nio.file.Files
import java.time.ZoneId
import java.time.ZonedDateTime
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class WearCompanionSyncTest {
    private val zone = ZoneId.of("Asia/Shanghai")

    /** Tuesday 2026-10-20 09:30 in Shanghai. */
    private val now = ZonedDateTime.of(2026, 10, 20, 9, 30, 0, 0, zone)
    private val clock = MutableClock(now.toInstant())
    private val link = FakeWatchLink()
    private val settings = InMemoryCompanionSettings()
    private lateinit var directory: File

    @Before
    fun createDirectory() {
        directory = Files.createTempDirectory("WearCompanionSyncTest").toFile()
    }

    @After
    fun deleteDirectory() {
        directory.deleteRecursively()
    }

    private fun TestScope.start(): Pair<BojiStore, WearCompanionSync> {
        val store = TestStore(File(directory, "state.json"), backgroundScope) { now }.store
        val sync = WearCompanionSync(
            store = store,
            settings = settings,
            planTitles = PlanTitles { "title-${it.name}" },
            link = link,
            clock = clock,
            scope = backgroundScope,
        )
        sync.start()
        runCurrent()
        return store to sync
    }

    @Test
    fun sharingOffSendsOnlyTheDisabledSnapshot() = runTest {
        val (store, _) = start()
        store.addWater(250)
        runCurrent()

        val snapshot = link.lastSnapshot!!
        assertFalse(snapshot.isSharingEnabled)
        assertFalse(snapshot.waterLogged)
        assertEquals("", snapshot.planTitle)
        assertEquals("2026-10-20", snapshot.dayKey)
        // The water entry changed nothing that the watch may see.
        assertEquals(1, link.sent.size)
        assertEquals(CompanionDataLayer.SNAPSHOT_PATH, link.sent.single().second)
    }

    @Test
    fun sharingOnSendsTodaysCheckInsAndPlanTitle() = runTest {
        settings.setSharingEnabled(true)
        val (store, sync) = start()
        store.setSelectedPlan(PlanKind.Gym)
        store.addWater(250)
        store.setSleep(7.0)
        runCurrent()

        val snapshot = link.lastSnapshot!!
        assertTrue(snapshot.isSharingEnabled)
        assertFalse(snapshot.trainingCompleted)
        assertTrue(snapshot.waterLogged)
        assertTrue(snapshot.sleepLogged)
        assertEquals("title-Gym", snapshot.planTitle)
        assertEquals("2026-10-20", snapshot.dayKey)
        assertEquals("watch-1", link.sent.last().first)
        assertEquals(WatchStatus.Connected, sync.status.value)
    }

    @Test
    fun changesThatTheWatchCannotSeeSendNothing() = runTest {
        settings.setSharingEnabled(true)
        val (store, _) = start()
        store.addWater(250)
        runCurrent()
        val count = link.sent.size

        store.addWater(500)
        store.setDisplayName("小博")
        store.addBodyEntry(weight = 68.2, waist = 78.0)
        runCurrent()

        assertEquals(count, link.sent.size)
    }

    @Test
    fun eachSnapshotIsNewerThanTheLastOneEvenWhenTheClockStands() = runTest {
        settings.setSharingEnabled(true)
        val (store, _) = start()
        store.addWater(250)
        runCurrent()
        // The clock did not move. The watch keeps only newer snapshots, so the time still grows.
        clock.instant = now.toInstant().minusSeconds(60)
        store.setSleep(7.0)
        runCurrent()

        val times = link.sent.map { it.third.generatedAt }
        assertTrue(times.size >= 3)
        assertTrue(times.zipWithNext().all { (a, b) -> b.isAfter(a) })
    }

    @Test
    fun turningSharingOffClearsTheWatch() = runTest {
        settings.setSharingEnabled(true)
        val (store, _) = start()
        store.addWater(250)
        runCurrent()

        settings.setSharingEnabled(false)
        runCurrent()

        val snapshot = link.lastSnapshot!!
        assertFalse(snapshot.isSharingEnabled)
        assertFalse(snapshot.waterLogged)
    }

    @Test
    fun statusDescribesTheWatches() = runTest {
        settings.setSharingEnabled(true)
        val (_, sync) = start()
        assertEquals(WatchStatus.Connected, sync.status.value)

        link.nodes = WatchNodes(reachable = emptyList(), withApp = 1, connected = 1)
        sync.refreshStatus()
        assertEquals(WatchStatus.Waiting, sync.status.value)

        link.nodes = WatchNodes(reachable = emptyList(), withApp = 0, connected = 1)
        sync.refreshStatus()
        assertEquals(WatchStatus.AppMissing, sync.status.value)

        link.nodes = WatchNodes(reachable = emptyList(), withApp = 0, connected = 0)
        sync.refreshStatus()
        assertEquals(WatchStatus.NoWatch, sync.status.value)

        link.failure = IOException("Data Layer")
        sync.refreshStatus()
        assertEquals(WatchStatus.Failed, sync.status.value)

        link.failure = null
        link.available = false
        sync.refreshStatus()
        assertEquals(WatchStatus.Unavailable, sync.status.value)
    }

    @Test
    fun aWatchThatConnectsGetsTheSnapshotAgain() = runTest {
        settings.setSharingEnabled(true)
        link.nodes = WatchNodes(reachable = emptyList(), withApp = 1, connected = 0)
        val (_, sync) = start()
        assertEquals(0, link.sent.size)
        assertEquals(WatchStatus.Waiting, sync.status.value)

        link.nodes = WatchNodes(reachable = listOf("watch-2"), withApp = 1, connected = 1)
        link.changeEvents.emit(Unit)
        runCurrent()

        assertEquals("watch-2", link.sent.single().first)
        assertEquals(WatchStatus.Connected, sync.status.value)
    }

    @Test
    fun requestsGetTheCurrentSnapshot() = runTest {
        settings.setSharingEnabled(true)
        val (store, sync) = start()
        store.completeWorkout(WorkoutLibrary.Gym)
        runCurrent()

        val reply = sync.snapshotForRequest()
        assertTrue(reply.trainingCompleted)
        assertEquals(link.lastSnapshot, reply)
    }
}
