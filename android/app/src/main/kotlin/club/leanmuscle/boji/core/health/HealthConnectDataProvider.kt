package club.leanmuscle.boji.core.health

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.result.contract.ActivityResultContract
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.records.Record
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.records.metadata.Metadata
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap
import kotlin.reflect.KClass
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.withContext

/**
 * Reads weight and sleep from Health Connect. It only reads: Boji declares no write permission.
 * Reads run while the app is in the foreground, so no background permission is needed.
 */
class HealthConnectDataProvider(
    private val context: Context,
    private val io: CoroutineDispatcher,
) : HealthDataProvider {
    private val labels = ConcurrentHashMap<String, String>()

    override fun availability(): HealthAvailability = when (HealthConnectClient.getSdkStatus(context)) {
        HealthConnectClient.SDK_AVAILABLE -> HealthAvailability.Available
        HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> HealthAvailability.UpdateRequired
        else -> HealthAvailability.Unavailable
    }

    override fun permissionContract(): ActivityResultContract<Set<String>, Set<String>> =
        PermissionController.createRequestPermissionResultContract()

    override suspend fun grantedPermissions(): Set<String> =
        client().permissionController.getGrantedPermissions()

    override suspend fun weights(start: Instant, end: Instant): List<HealthWeight> =
        readAll(WeightRecord::class, start, end).map { record ->
            HealthWeight(
                id = record.metadata.id,
                kilograms = record.weight.inKilograms,
                time = record.time,
                source = sourceLabel(record.metadata),
            )
        }

    override suspend fun sleepSamples(start: Instant, end: Instant): List<HealthSleepSample> =
        readAll(SleepSessionRecord::class, start, end).flatMap { session ->
            val source = sourceLabel(session.metadata)
            if (session.stages.isEmpty()) {
                // A session without stages is one block of sleep, as Health Connect's sleep total counts it.
                listOf(HealthSleepSample(session.metadata.id, session.startTime, session.endTime, HealthSleepStage.Asleep, source))
            } else {
                session.stages.mapIndexedNotNull { index, stage ->
                    val kind = sleepStage(stage.stage) ?: return@mapIndexedNotNull null
                    HealthSleepSample("${session.metadata.id}#$index", stage.startTime, stage.endTime, kind, source)
                }
            }
        }

    private fun client(): HealthConnectClient = HealthConnectClient.getOrCreate(context)

    /** Reads every page. Some Health Connect versions end with an empty token instead of null. */
    private suspend fun <T : Record> readAll(type: KClass<T>, start: Instant, end: Instant): List<T> {
        val client = client()
        val records = mutableListOf<T>()
        var token: String? = null
        var pages = 0
        do {
            val response = client.readRecords(
                ReadRecordsRequest(type, TimeRangeFilter.between(start, end), pageToken = token),
            )
            records += response.records
            token = response.pageToken
            pages += 1
        } while (!token.isNullOrEmpty() && pages < MAX_PAGES)
        return records
    }

    /**
     * The label of the app that wrote a record, or its package name when the label is not visible.
     * Apps that use Health Connect declare its intents, which the manifest's queries element matches.
     */
    private suspend fun sourceLabel(metadata: Metadata): String {
        val packageName = metadata.dataOrigin.packageName
        labels[packageName]?.let { return it }
        val label = withContext(io) {
            try {
                val pm = context.packageManager
                val info = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    pm.getApplicationInfo(packageName, PackageManager.ApplicationInfoFlags.of(0))
                } else {
                    pm.getApplicationInfo(packageName, 0)
                }
                pm.getApplicationLabel(info).toString().ifBlank { packageName }
            } catch (_: PackageManager.NameNotFoundException) {
                packageName
            }
        }
        labels[packageName] = label
        return label
    }

    private companion object {
        /** 1,000 records per page. Thirty days of weight and sleep stay far below this limit. */
        const val MAX_PAGES = 20

        fun sleepStage(stage: Int): HealthSleepStage? = when (stage) {
            SleepSessionRecord.STAGE_TYPE_SLEEPING,
            SleepSessionRecord.STAGE_TYPE_LIGHT,
            SleepSessionRecord.STAGE_TYPE_DEEP,
            SleepSessionRecord.STAGE_TYPE_REM,
            -> HealthSleepStage.Asleep
            SleepSessionRecord.STAGE_TYPE_AWAKE,
            SleepSessionRecord.STAGE_TYPE_AWAKE_IN_BED,
            SleepSessionRecord.STAGE_TYPE_OUT_OF_BED,
            -> HealthSleepStage.Awake
            // Unknown stages are left out, like unknown HealthKit sleep values on iOS.
            else -> null
        }
    }
}
