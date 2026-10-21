package club.leanmuscle.boji.core.health

import java.time.LocalDateTime
import java.time.ZoneId
import java.time.ZonedDateTime
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.async
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

// runCurrent is experimental in kotlinx-coroutines-test.
@OptIn(ExperimentalCoroutinesApi::class)
class HealthRepositoryTest {
    private val zone = ZoneId.of("Asia/Shanghai")
    private val now: ZonedDateTime = LocalDateTime.of(2026, 10, 21, 9, 0).atZone(zone)
    private val weight = HealthWeight("w1", 71.6, now.minusDays(1).toInstant(), "Scale")
    private val night = HealthSleepSample(
        "s1",
        now.minusHours(10).toInstant(),
        now.minusHours(2).toInstant(),
        HealthSleepStage.Asleep,
        "Watch",
    )

    private fun TestScope.repository(
        provider: FakeHealthDataProvider = FakeHealthDataProvider(weights = listOf(weight), sleepSamples = listOf(night)),
        settings: InMemoryHealthSettings = InMemoryHealthSettings(),
    ): HealthRepository = HealthRepository(provider, settings, backgroundScope, now = { now })

    @Test
    fun refreshDoesNothingWhileDisconnected() = runTest {
        val provider = FakeHealthDataProvider(weights = listOf(weight))
        val repository = repository(provider)

        repository.refresh()

        assertFalse(repository.state.value.enabled)
        assertEquals(0, provider.weightReads)
        assertTrue(repository.state.value.snapshot.isEmpty)
    }

    @Test
    fun storedPreferenceIsRestored() = runTest {
        val provider = FakeHealthDataProvider(weights = listOf(weight))
        val repository = repository(provider, InMemoryHealthSettings(initial = true))
        runCurrent()

        assertTrue(repository.state.value.enabled)
        repository.refresh()
        assertEquals(1, provider.weightReads)
    }

    @Test
    fun connectingWithoutAnyGrantStaysDisconnected() = runTest {
        val settings = InMemoryHealthSettings()
        val repository = repository(settings = settings)

        repository.onPermissionResult(emptySet())

        assertFalse(repository.state.value.enabled)
        assertFalse(settings.value)
        assertEquals(HealthError.NoPermission, repository.state.value.error)
    }

    @Test
    fun connectingReadsTheLastThirtyDays() = runTest {
        val provider = FakeHealthDataProvider(weights = listOf(weight), sleepSamples = listOf(night))
        val settings = InMemoryHealthSettings()
        val repository = repository(provider, settings)

        repository.onPermissionResult(HealthPermissions.all)

        val state = repository.state.value
        assertTrue(state.enabled)
        assertTrue(settings.value)
        assertFalse(state.loading)
        assertEquals(71.6, state.snapshot.latestWeight()!!.kilograms, 0.0)
        assertEquals(8.0, state.snapshot.sleepHours(now.toLocalDate(), zone)!!, 1e-9)
        assertEquals(now.toInstant(), state.lastSyncedAt)
        assertTrue(state.missingPermissions.isEmpty())
        assertNull(state.error)
        val expected = now.minusDays(30).toInstant() to now.toInstant()
        assertEquals(listOf(expected, expected), provider.ranges)
    }

    @Test
    fun partialGrantReadsOnlyTheGrantedType() = runTest {
        val provider = FakeHealthDataProvider(granted = setOf(HealthPermissions.READ_WEIGHT), weights = listOf(weight), sleepSamples = listOf(night))
        val repository = repository(provider)

        repository.onPermissionResult(setOf(HealthPermissions.READ_WEIGHT))

        val state = repository.state.value
        assertEquals(1, provider.weightReads)
        assertEquals(0, provider.sleepReads)
        assertEquals(setOf(HealthPermissions.READ_SLEEP), state.missingPermissions)
        assertNull(state.snapshot.sleepHours(now.toLocalDate(), zone))
    }

    @Test
    fun failedRefreshClearsTheSamples() = runTest {
        val provider = FakeHealthDataProvider(weights = listOf(weight))
        val repository = repository(provider)
        repository.onPermissionResult(HealthPermissions.all)
        assertFalse(repository.state.value.snapshot.isEmpty)

        provider.failure = SecurityException("revoked")
        repository.refresh()

        val state = repository.state.value
        assertTrue(state.enabled)
        assertFalse(state.loading)
        assertTrue(state.snapshot.isEmpty)
        assertNull(state.lastSyncedAt)
        assertEquals(HealthError.ReadFailed("revoked"), state.error)
    }

    @Test
    fun disconnectDuringRefreshDropsTheResult() = runTest {
        val provider = FakeHealthDataProvider(weights = listOf(weight))
        val settings = InMemoryHealthSettings(initial = true)
        val repository = repository(provider, settings)
        val gate = CompletableDeferred<Unit>()
        provider.gate = gate

        val refresh = async { repository.refresh() }
        runCurrent()
        assertTrue(repository.state.value.loading)

        repository.disconnect()
        gate.complete(Unit)
        refresh.await()

        val state = repository.state.value
        assertFalse(state.enabled)
        assertFalse(state.loading)
        assertTrue(state.snapshot.isEmpty)
        assertNull(state.lastSyncedAt)
        assertFalse(settings.value)
    }

    @Test
    fun aSecondRefreshWhileOneRunsIsIgnored() = runTest {
        val provider = FakeHealthDataProvider(weights = listOf(weight))
        val repository = repository(provider, InMemoryHealthSettings(initial = true))
        val gate = CompletableDeferred<Unit>()
        provider.gate = gate

        val first = async { repository.refresh() }
        runCurrent()
        repository.refresh()
        gate.complete(Unit)
        first.await()

        assertEquals(1, provider.weightReads)
        assertFalse(repository.state.value.snapshot.isEmpty)
    }

    @Test
    fun unavailableHealthConnectIsNotRead() = runTest {
        val provider = FakeHealthDataProvider(availability = HealthAvailability.UpdateRequired, weights = listOf(weight))
        val repository = repository(provider, InMemoryHealthSettings(initial = true))

        repository.refresh()

        assertEquals(HealthAvailability.UpdateRequired, repository.state.value.availability)
        assertEquals(0, provider.weightReads)
        assertFalse(repository.state.value.loading)

        // After the user installs Health Connect, the next refresh sees it.
        provider.availability = HealthAvailability.Available
        repository.refresh()
        assertEquals(HealthAvailability.Available, repository.state.value.availability)
        assertEquals(1, provider.weightReads)
    }
}
