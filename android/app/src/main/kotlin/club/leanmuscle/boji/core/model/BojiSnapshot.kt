package club.leanmuscle.boji.core.model

import java.time.LocalDate
import java.time.ZoneId
import java.time.temporal.WeekFields

/** Problems with state.json. The UI maps each case to a message. */
sealed interface StorageError {
    val detail: String?

    /** The file exists but cannot be read. Writes stay blocked so the file is not overwritten. */
    data class ReadFailed(override val detail: String?) : StorageError

    data class WriteFailed(override val detail: String?) : StorageError

    data class DeleteFailed(override val detail: String?) : StorageError
}

/** Immutable view of the store for one point in time. Derived values follow iOS `BojiStore`. */
data class BojiSnapshot(
    val state: BojiState,
    val today: LocalDate,
    val zone: ZoneId,
    val storageError: StorageError? = null,
) {
    fun recordOn(day: LocalDate): DailyRecord? = state.records.firstOrNull { it.localDate(zone) == day }

    val todayRecord: DailyRecord
        get() = recordOn(today) ?: DailyRecord.empty(today, zone)

    /** 0 to [TODAY_TASK_TOTAL]: a workout, any water, and a sleep entry today. */
    val todayTaskCount: Int
        get() = todayRecord.let {
            (if (it.completedWorkoutIDs.isEmpty()) 0 else 1) +
                (if (it.waterML > 0) 1 else 0) +
                (if (it.sleepHours == null) 0 else 1)
        }

    companion object {
        /** The number of daily tasks that [todayTaskCount] counts. */
        const val TODAY_TASK_TOTAL = 3
    }

    val totalWorkouts: Int
        get() = state.records.sumOf { it.completedWorkoutIDs.size }

    val activeDays: Int
        get() = state.records.count { it.isActive }

    /** The last 7 days, oldest first, ending today. Missing days are empty records. */
    val weekRecords: List<DailyRecord>
        get() = (6 downTo 0).map { offset ->
            val day = today.minusDays(offset.toLong())
            recordOn(day) ?: DailyRecord.empty(day, zone)
        }

    val bodyEntriesByDate: List<BodyEntry>
        get() = state.bodyEntries.sortedBy { it.date }

    val recommendedWorkout: Workout
        get() = WorkoutLibrary.recommended(state.selectedPlan)

    fun isCompletedToday(workout: Workout): Boolean = workout.id in todayRecord.completedWorkoutIDs

    /** Days with a workout in the current calendar week, as defined by [weekFields]. */
    fun trainingDaysThisWeek(weekFields: WeekFields): Int {
        val start = today.with(weekFields.dayOfWeek(), 1)
        val end = start.plusDays(7)
        return weekRecords.count { record ->
            val day = record.localDate(zone)
            !day.isBefore(start) && day.isBefore(end) && record.completedWorkoutIDs.isNotEmpty()
        }
    }
}
