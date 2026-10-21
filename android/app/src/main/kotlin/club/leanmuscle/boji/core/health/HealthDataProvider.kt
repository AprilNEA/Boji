package club.leanmuscle.boji.core.health

import androidx.activity.result.contract.ActivityResultContract
import java.time.Instant

/** Whether Health Connect can be used on this device. */
enum class HealthAvailability {
    Available,

    /** Android 13 and lower without the Health Connect app, or with an old version of it. */
    UpdateRequired,

    /** Android 8, a work profile, or a device without Health Connect. */
    Unavailable,
}

/** The read permissions that Boji requests. Boji never requests write permissions. */
object HealthPermissions {
    const val READ_WEIGHT = "android.permission.health.READ_WEIGHT"
    const val READ_SLEEP = "android.permission.health.READ_SLEEP"
    val all: Set<String> = setOf(READ_WEIGHT, READ_SLEEP)
}

/**
 * The boundary for Health Connect reads, like `HealthDataProvider` on iOS. Production uses
 * [HealthConnectDataProvider]. Tests use a fake, so they never open the user's health data.
 */
interface HealthDataProvider {
    fun availability(): HealthAvailability

    /** Shows the Health Connect permission screen. The result is the set of granted permissions. */
    fun permissionContract(): ActivityResultContract<Set<String>, Set<String>>

    /** Reads the current grants. Users can revoke a grant at any time, so check before every read. */
    suspend fun grantedPermissions(): Set<String>

    suspend fun weights(start: Instant, end: Instant): List<HealthWeight>

    suspend fun sleepSamples(start: Instant, end: Instant): List<HealthSleepSample>
}
