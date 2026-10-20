package club.leanmuscle.boji.core.model

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import kotlinx.serialization.Serializable

/**
 * One calendar day of habits. `date` is the start of that day in the zone where it was
 * recorded, and `id` is the same day as `yyyy-MM-dd`. Field names match the iOS JSON.
 */
@Serializable
data class DailyRecord(
    val id: String,
    @Serializable(with = Iso8601InstantSerializer::class)
    val date: Instant,
    val waterML: Int = 0,
    val sleepHours: Double? = null,
    val completedWorkoutIDs: List<String> = emptyList(),
    val minutes: Int = 0,
) {
    val isActive: Boolean
        get() = completedWorkoutIDs.isNotEmpty() || waterML > 0 || sleepHours != null

    fun localDate(zone: ZoneId): LocalDate = date.atZone(zone).toLocalDate()

    companion object {
        fun empty(day: LocalDate, zone: ZoneId): DailyRecord =
            DailyRecord(id = day.toString(), date = day.atStartOfDay(zone).toInstant())
    }
}

/** A manual body measurement. `id` is an uppercase UUID string, as on iOS. */
@Serializable
data class BodyEntry(
    val id: String,
    @Serializable(with = Iso8601InstantSerializer::class)
    val date: Instant,
    val weight: Double,
    val waist: Double,
)

/** Everything stored in state.json. Field names and value formats match iOS `StoredState`. */
@Serializable
data class BojiState(
    val selectedPlan: PlanKind = PlanKind.Home,
    val hasOnboarded: Boolean = false,
    val displayName: String = DEFAULT_DISPLAY_NAME,
    val joinedChallenge: Boolean = false,
    val records: List<DailyRecord> = emptyList(),
    val bodyEntries: List<BodyEntry> = emptyList(),
) {
    companion object {
        const val DEFAULT_DISPLAY_NAME = "薄肌同学"
    }
}
