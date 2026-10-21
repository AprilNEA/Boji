package club.leanmuscle.boji

import android.content.Context
import android.content.Intent
import androidx.activity.result.contract.ActivityResultContract
import club.leanmuscle.boji.core.di.HealthProviderModule
import club.leanmuscle.boji.core.health.HealthAvailability
import club.leanmuscle.boji.core.health.HealthDataProvider
import club.leanmuscle.boji.core.health.HealthPermissions
import club.leanmuscle.boji.core.health.HealthSleepSample
import club.leanmuscle.boji.core.health.HealthWeight
import dagger.Module
import dagger.Provides
import dagger.hilt.components.SingletonComponent
import dagger.hilt.testing.TestInstallIn
import java.time.Instant
import javax.inject.Singleton

/**
 * Health Connect stand-in for UI tests, so they never read the device's health data. The
 * permission contract answers synchronously with [grantOnRequest], without opening a screen.
 */
class FakeUiHealthProvider : HealthDataProvider {
    @Volatile var availability: HealthAvailability = HealthAvailability.Available
    @Volatile var grantOnRequest: Set<String> = HealthPermissions.all
    @Volatile var granted: Set<String> = emptySet()
    @Volatile var weights: List<HealthWeight> = emptyList()
    @Volatile var sleepSamples: List<HealthSleepSample> = emptyList()

    override fun availability(): HealthAvailability = availability

    override fun permissionContract(): ActivityResultContract<Set<String>, Set<String>> =
        object : ActivityResultContract<Set<String>, Set<String>>() {
            override fun createIntent(context: Context, input: Set<String>): Intent = Intent()

            override fun getSynchronousResult(context: Context, input: Set<String>): SynchronousResult<Set<String>> {
                granted = granted + (grantOnRequest intersect input)
                return SynchronousResult(granted)
            }

            override fun parseResult(resultCode: Int, intent: Intent?): Set<String> = granted
        }

    override suspend fun grantedPermissions(): Set<String> = granted

    override suspend fun weights(start: Instant, end: Instant): List<HealthWeight> =
        weights.filter { it.time in start..end }

    override suspend fun sleepSamples(start: Instant, end: Instant): List<HealthSleepSample> =
        sleepSamples.filter { it.end > start && it.start < end }
}

/** Every test gets a new Hilt component, and with it a new fake. Tests inject it to configure it. */
@Module
@TestInstallIn(components = [SingletonComponent::class], replaces = [HealthProviderModule::class])
object TestHealthModule {
    @Provides
    @Singleton
    fun fakeHealthProvider(): FakeUiHealthProvider = FakeUiHealthProvider()

    @Provides
    fun healthDataProvider(fake: FakeUiHealthProvider): HealthDataProvider = fake
}
