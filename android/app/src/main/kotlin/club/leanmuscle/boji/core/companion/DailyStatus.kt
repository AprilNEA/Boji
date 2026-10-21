package club.leanmuscle.boji.core.companion

import club.leanmuscle.boji.core.model.BojiSnapshot
import club.leanmuscle.boji.core.model.StorageError
import java.time.Instant
import java.time.ZonedDateTime

/**
 * Whether each manual check-in exists today, like `CompanionProgress` on iOS. Only these flags
 * leave the app: never amounts, health samples or account data.
 */
data class DailyStatus(
    val trainingCompleted: Boolean,
    val waterLogged: Boolean,
    val sleepLogged: Boolean,
) {
    val allLogged: Boolean get() = trainingCompleted && waterLogged && sleepLogged
}

/** Today's check-ins, with the same rules as `BojiSnapshot.todayTaskCount`. */
fun BojiSnapshot.dailyStatus(): DailyStatus = todayRecord.let {
    DailyStatus(
        trainingCompleted = it.completedWorkoutIDs.isNotEmpty(),
        waterLogged = it.waterML > 0,
        sleepLogged = it.sleepHours != null,
    )
}

/**
 * What the widget shows. iOS also has a "waiting to sync" state for an old App Group snapshot.
 * The Android widget reads state.json in the app process, so its data is never from another day.
 */
sealed interface DailyWidgetState {
    /** Sharing is off. The widget asks the user to turn it on in Settings. */
    data object Disabled : DailyWidgetState

    /** state.json cannot be read. The widget asks the user to open the app. */
    data object Unavailable : DailyWidgetState

    data class Current(val status: DailyStatus) : DailyWidgetState

    companion object {
        /**
         * The widget state for [snapshot], or null while state.json is still loading.
         * Sharing comes first, so a turned-off widget never shows a storage problem.
         */
        fun of(snapshot: BojiSnapshot?, sharingEnabled: Boolean): DailyWidgetState? = when {
            !sharingEnabled -> Disabled
            snapshot == null -> null
            snapshot.storageError is StorageError.ReadFailed -> Unavailable
            else -> Current(snapshot.dailyStatus())
        }
    }
}

/**
 * The next local midnight after [now]. A day can start at 01:00 when daylight saving time
 * begins at midnight, so this uses the zone rules instead of adding 24 hours.
 */
fun nextLocalMidnight(now: ZonedDateTime): Instant =
    now.toLocalDate().plusDays(1).atStartOfDay(now.zone).toInstant()
