package club.leanmuscle.boji.core.health

import androidx.activity.result.contract.ActivityResultContract
import java.time.Instant
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow

/** Health Connect stand-in. [gate], when set, holds every read until the test completes it. */
class FakeHealthDataProvider(
    var availability: HealthAvailability = HealthAvailability.Available,
    var granted: Set<String> = HealthPermissions.all,
    var weights: List<HealthWeight> = emptyList(),
    var sleepSamples: List<HealthSleepSample> = emptyList(),
) : HealthDataProvider {
    var failure: Exception? = null
    var gate: CompletableDeferred<Unit>? = null
    var weightReads = 0
        private set
    var sleepReads = 0
        private set
    val ranges = mutableListOf<Pair<Instant, Instant>>()

    override fun availability(): HealthAvailability = availability

    override fun permissionContract(): ActivityResultContract<Set<String>, Set<String>> =
        throw UnsupportedOperationException("JVM tests pass the permission result directly")

    override suspend fun grantedPermissions(): Set<String> {
        gate?.await()
        failure?.let { throw it }
        return granted
    }

    override suspend fun weights(start: Instant, end: Instant): List<HealthWeight> {
        weightReads += 1
        ranges += start to end
        return weights
    }

    override suspend fun sleepSamples(start: Instant, end: Instant): List<HealthSleepSample> {
        sleepReads += 1
        ranges += start to end
        return sleepSamples
    }
}

class InMemoryHealthSettings(initial: Boolean = false) : HealthSettings {
    private val state = MutableStateFlow(initial)
    override val enabled: Flow<Boolean> = state
    val value: Boolean
        get() = state.value

    override suspend fun setEnabled(value: Boolean) {
        state.value = value
    }
}
