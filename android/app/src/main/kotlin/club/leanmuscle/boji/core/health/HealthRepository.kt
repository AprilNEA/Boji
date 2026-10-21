package club.leanmuscle.boji.core.health

import java.time.Instant
import java.time.ZonedDateTime
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

sealed interface HealthError {
    /** The permission screen closed without any Boji permission granted. */
    data object NoPermission : HealthError

    /** A query failed. [detail] is the system message, or null when there is none. */
    data class ReadFailed(val detail: String?) : HealthError
}

data class HealthState(
    val availability: HealthAvailability,
    /** The user connected Health Connect in Boji. Survives restarts until disconnected. */
    val enabled: Boolean = false,
    val loading: Boolean = false,
    val snapshot: HealthSnapshot = HealthSnapshot.Empty,
    val lastSyncedAt: Instant? = null,
    /** Permissions that were not granted at the last refresh. Their data type shows no value. */
    val missingPermissions: Set<String> = emptySet(),
    val error: HealthError? = null,
)

/**
 * Read-only Health Connect data, with the rules of `HealthDataStore` on iOS:
 *
 * - Only the user's tap on 连接 Health Connect requests permissions. A refresh never does.
 * - A refresh reads the last 30 days and replaces all samples at once. A failed refresh clears them.
 * - Disconnecting clears Boji's preference and the samples in memory. It does not revoke the system
 *   grants and does not delete anything in Health Connect.
 * - A refresh that was running when the user disconnected does not publish its result.
 */
class HealthRepository(
    private val provider: HealthDataProvider,
    private val settings: HealthSettings,
    scope: CoroutineScope,
    private val now: () -> ZonedDateTime = ZonedDateTime::now,
) {
    private val _state = MutableStateFlow(HealthState(availability = provider.availability()))
    val state: StateFlow<HealthState> = _state.asStateFlow()

    /** Incremented by [disconnect]. Work that started under an older value drops its result. */
    private val generation = AtomicInteger(0)
    private val settingsLoaded = CompletableDeferred<Unit>()

    init {
        scope.launch {
            val started = generation.get()
            val enabled = settings.enabled.first()
            if (generation.get() == started) _state.update { it.copy(enabled = enabled) }
            settingsLoaded.complete(Unit)
        }
    }

    fun permissionContract() = provider.permissionContract()

    /** Call with the result of [permissionContract], which only the user's tap may launch. */
    suspend fun onPermissionResult(granted: Set<String>) {
        settingsLoaded.await()
        val started = generation.get()
        if (!_state.value.enabled) {
            if (granted.none { it in HealthPermissions.all }) {
                _state.update { it.copy(error = HealthError.NoPermission) }
                return
            }
            settings.setEnabled(true)
            if (generation.get() != started) return
            _state.update { it.copy(enabled = true, error = null) }
        }
        refresh()
    }

    /** Reads the last 30 days again. Does nothing while disconnected or while a refresh runs. */
    suspend fun refresh() {
        settingsLoaded.await()
        val availability = provider.availability()
        var start = false
        _state.update { current ->
            start = current.enabled && !current.loading && availability == HealthAvailability.Available
            current.copy(availability = availability, loading = current.loading || start, error = if (start) null else current.error)
        }
        if (!start) return

        val started = generation.get()
        try {
            val granted = provider.grantedPermissions()
            val end = now()
            val from = end.minusDays(QUERY_DAYS).toInstant()
            val until = end.toInstant()
            val (weights, sleep) = coroutineScope {
                val weights = async { if (HealthPermissions.READ_WEIGHT in granted) provider.weights(from, until) else emptyList() }
                val sleep = async { if (HealthPermissions.READ_SLEEP in granted) provider.sleepSamples(from, until) else emptyList() }
                weights.await() to sleep.await()
            }
            val snapshot = HealthSnapshot.of(weights, sleep, now = until)
            if (generation.get() != started) return
            _state.update {
                it.copy(
                    loading = false,
                    snapshot = snapshot,
                    lastSyncedAt = now().toInstant(),
                    missingPermissions = HealthPermissions.all - granted,
                    error = null,
                )
            }
        } catch (error: CancellationException) {
            throw error
        } catch (error: Exception) {
            // Health Connect throws SecurityException, RemoteException, IOException and, for
            // rate limits, IllegalStateException. None of them leaves usable samples.
            if (generation.get() != started) return
            _state.update {
                it.copy(
                    loading = false,
                    snapshot = HealthSnapshot.Empty,
                    lastSyncedAt = null,
                    error = HealthError.ReadFailed(error.message),
                )
            }
        } finally {
            if (generation.get() == started) _state.update { if (it.loading) it.copy(loading = false) else it }
        }
    }

    /** Clears Boji's preference and the samples. The system grants stay as they are. */
    suspend fun disconnect() {
        generation.incrementAndGet()
        _state.update { HealthState(availability = it.availability) }
        settings.setEnabled(false)
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }

    private companion object {
        const val QUERY_DAYS = 30L
    }
}
