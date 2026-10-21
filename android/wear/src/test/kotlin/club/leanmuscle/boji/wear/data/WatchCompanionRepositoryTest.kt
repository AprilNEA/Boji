package club.leanmuscle.boji.wear.data

import club.leanmuscle.boji.shared.companion.CompanionProgress
import club.leanmuscle.boji.shared.companion.CompanionSnapshot
import java.time.Instant
import java.time.ZoneId
import java.time.ZonedDateTime
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class WatchCompanionRepositoryTest {
    private val zone = ZoneId.of("Asia/Shanghai")

    /** Tuesday 2026-10-20 09:30 in Shanghai. */
    private val now = ZonedDateTime.of(2026, 10, 20, 9, 30, 0, 0, zone).toInstant()
    private val link = FakePhoneLink()
    private val store = InMemorySnapshotStore()

    private fun TestScope.repository() = WatchCompanionRepository(link, store, StandardTestDispatcher(testScheduler))

    private fun snapshot(at: Instant, water: Boolean = false, day: String = "2026-10-20", plan: String = "居家训练") =
        CompanionSnapshot.of(
            CompanionProgress(dayKey = day, trainingCompleted = true, waterLogged = water, sleepLogged = false, planTitle = plan),
            generatedAt = at,
        )

    @Test
    fun connectAsksThePhoneAndShowsTheReply() = runTest {
        val reply = snapshot(now, water = true)
        link.reply = { reply.encode() }
        val repository = repository()

        repository.connect()

        val state = repository.state.value
        assertEquals(ConnectionState.Ready, state.connection)
        assertEquals(reply, state.snapshot)
        assertEquals(Presentation.Current(reply), state.presentation(now, zone))
        // The watch keeps it for the next start.
        assertEquals(reply, CompanionSnapshot.decode(store.bytes!!))
    }

    @Test
    fun anOlderSnapshotDoesNotReplaceTheSavedOne() = runTest {
        val saved = snapshot(now, water = true)
        store.bytes = saved.encode()
        link.reply = { snapshot(now.minusSeconds(60), water = false).encode() }
        val repository = repository()

        repository.connect()

        assertEquals(ConnectionState.Ready, repository.state.value.connection)
        assertEquals(saved, repository.state.value.snapshot)
    }

    @Test
    fun aSnapshotWithSharingOffHidesTheCheckIns() = runTest {
        val repository = repository()
        assertTrue(repository.receive(snapshot(now, water = true).encode()))

        assertTrue(repository.receive(CompanionSnapshot.disabled(now.plusSeconds(1), zone).encode()))

        val state = repository.state.value
        assertNull(state.snapshot)
        assertTrue(state.isSharingDisabled)
        assertEquals(Presentation.SharingDisabled, state.presentation(now, zone))
    }

    @Test
    fun invalidBytesChangeNothing() = runTest {
        val repository = repository()
        assertFalse(repository.receive("{}".encodeToByteArray()))
        assertFalse(repository.receive(ByteArray(0)))
        assertEquals(Presentation.NoData, repository.state.value.presentation(now, zone))
        assertNull(store.bytes)
    }

    @Test
    fun withoutAPhoneTheSavedSnapshotStays() = runTest {
        val saved = snapshot(now)
        store.bytes = saved.encode()
        link.phone = null
        val repository = repository()

        repository.connect()

        assertEquals(ConnectionState.Offline, repository.state.value.connection)
        assertEquals(saved, repository.state.value.snapshot)
        assertEquals(0, link.requests)
        assertFalse(repository.state.value.canRequest)
    }

    @Test
    fun withoutTheWearableApiNothingIsRequested() = runTest {
        link.available = false
        val repository = repository()

        repository.connect()

        assertEquals(ConnectionState.Unavailable, repository.state.value.connection)
        assertEquals(0, link.requests)
    }

    @Test
    fun aFailedRequestIsAFailureWhileThePhoneIsThere() = runTest {
        val repository = repository()

        repository.connect()

        assertEquals(ConnectionState.Failed, repository.state.value.connection)
        assertTrue(repository.state.value.canRequest)
    }

    @Test
    fun aRequestWithoutAnswerTimesOut() = runTest {
        link.hangs = true
        val repository = repository()

        repository.connect()

        assertEquals(ConnectionState.Failed, repository.state.value.connection)
    }

    @Test
    fun aFailedRequestIsOfflineWhenThePhoneLeft() = runTest {
        link.reply = {
            link.phone = null
            throw java.io.IOException("Disconnected")
        }
        val repository = repository()

        repository.connect()

        assertEquals(ConnectionState.Offline, repository.state.value.connection)
    }

    @Test
    fun aFailedWriteStillShowsTheSnapshot() = runTest {
        store.failWrites = true
        val repository = repository()
        val received = snapshot(now)

        assertTrue(repository.receive(received.encode()))

        assertEquals(received, repository.state.value.snapshot)
        assertNull(store.bytes)
    }

    @Test
    fun yesterdaysSnapshotIsStale() = runTest {
        val repository = repository()
        val yesterday = snapshot(now.minusSeconds(86_400), day = "2026-10-19")
        repository.receive(yesterday.encode())

        assertEquals(Presentation.Stale, repository.state.value.presentation(now, zone))
        // Just before midnight on the same day it is still current.
        val lateYesterday = ZonedDateTime.of(2026, 10, 19, 23, 59, 0, 0, zone).toInstant()
        assertEquals(Presentation.Current(yesterday), repository.state.value.presentation(lateYesterday, zone))
    }

    @Test
    fun reachabilityChangesDoNotSendRequests() = runTest {
        link.phone = null
        val repository = repository()
        repository.connect()
        assertEquals(ConnectionState.Offline, repository.state.value.connection)

        link.phone = "phone-1"
        repository.updateReachability()

        assertEquals(ConnectionState.Ready, repository.state.value.connection)
        assertEquals(0, link.requests)
    }
}
