package club.leanmuscle.boji.core.data

import androidx.datastore.core.DataStore
import club.leanmuscle.boji.core.model.BodyEntry
import club.leanmuscle.boji.core.model.BojiSnapshot
import club.leanmuscle.boji.core.model.BojiState
import club.leanmuscle.boji.core.model.DailyRecord
import club.leanmuscle.boji.core.model.PlanKind
import club.leanmuscle.boji.core.model.StorageError
import club.leanmuscle.boji.core.model.Workout
import java.io.File
import java.io.IOException
import java.nio.file.Files
import java.time.ZonedDateTime
import java.time.temporal.ChronoUnit
import java.util.Locale
import java.util.UUID
import kotlin.math.abs
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * Local-first store for all user records. It follows the rules of iOS `BojiStore`.
 *
 * [dataStore] holds state.json. [snapshot] is null until the first read finishes. Every change
 * runs in [externalScope], so a closed screen cannot cancel a write that has started.
 *
 * A failed read blocks all writes, so the unreadable file is never overwritten. Only
 * [resetAll] removes such a file, because the user confirmed the deletion.
 *
 * [defaultDisplayName] returns the nickname of a new state in the current text language. Pass
 * the same function to [BojiStateSerializer].
 */
class BojiStore(
    private val dataStore: DataStore<BojiState>,
    private val stateFile: File,
    private val externalScope: CoroutineScope,
    private val defaultDisplayName: () -> String,
    private val now: () -> ZonedDateTime = ZonedDateTime::now,
) {
    private sealed interface Load {
        data class Loaded(val state: BojiState) : Load
        data class Failed(val detail: String?) : Load
    }

    private val clock = MutableStateFlow(now())
    private val writeError = MutableStateFlow<StorageError?>(null)

    /** Incremented after a reset replaced an unreadable file, so the data flow starts again. */
    private val generation = MutableStateFlow(0)
    private val resetLock = Mutex()

    @OptIn(ExperimentalCoroutinesApi::class)
    private val load: Flow<Load> = generation.flatMapLatest {
        dataStore.data
            .map<BojiState, Load> { Load.Loaded(it) }
            .catch { error -> if (error is IOException) emit(Load.Failed(error.message)) else throw error }
    }

    val snapshot: StateFlow<BojiSnapshot?> = combine(load, clock, writeError) { load, current, error ->
        when (load) {
            is Load.Loaded -> snapshotOf(load.state, current, error)
            is Load.Failed -> snapshotOf(newState(), current, StorageError.ReadFailed(load.detail))
        }
    }.stateIn(externalScope, SharingStarted.Eagerly, null)

    private fun newState() = BojiState(displayName = defaultDisplayName())

    fun refreshDay() {
        clock.value = now()
    }

    suspend fun setSelectedPlan(plan: PlanKind) = mutate { state, _ -> state.copy(selectedPlan = plan) }

    suspend fun completeOnboarding(plan: PlanKind) = mutate { state, _ -> state.copy(selectedPlan = plan, hasOnboarded = true) }

    suspend fun setDisplayName(name: String) = mutate { state, _ -> state.copy(displayName = name) }

    suspend fun setJoinedChallenge(joined: Boolean) = mutate { state, _ -> state.copy(joinedChallenge = joined) }

    /** Adds or removes water for today. Invalid changes are ignored. */
    suspend fun addWater(ml: Int) {
        if (ml == 0 || ml == Int.MIN_VALUE || abs(ml) > MAX_WATER_CHANGE_ML) return
        mutateToday { record ->
            val safePrevious = record.waterML.coerceIn(0, MAX_DAILY_WATER_ML)
            val updated = if (ml > 0) {
                if (safePrevious >= MAX_DAILY_WATER_ML) return@mutateToday null
                minOf(MAX_DAILY_WATER_ML, safePrevious + ml)
            } else {
                if (safePrevious <= 0) return@mutateToday null
                maxOf(0, safePrevious + ml)
            }
            if (updated == record.waterML) null else record.copy(waterML = updated)
        }
    }

    suspend fun setSleep(hours: Double) {
        if (!hours.isFinite() || hours !in SLEEP_RANGE) return
        mutateToday { record -> if (record.sleepHours == hours) null else record.copy(sleepHours = hours) }
    }

    /** Records [workout] once per day. Repeating the same workout on the same day changes nothing. */
    suspend fun completeWorkout(workout: Workout) {
        mutateToday { record ->
            if (workout.id in record.completedWorkoutIDs) return@mutateToday null
            val sum = record.minutes.toLong() + maxOf(0, workout.minutes)
            record.copy(
                completedWorkoutIDs = record.completedWorkoutIDs + workout.id,
                minutes = if (sum > Int.MAX_VALUE) Int.MAX_VALUE else sum.toInt(),
            )
        }
    }

    suspend fun addBodyEntry(weight: Double, waist: Double) {
        if (!isValidBodyEntry(weight, waist)) return
        mutate { state, current ->
            val entry = BodyEntry(
                id = UUID.randomUUID().toString().uppercase(Locale.ROOT),
                date = current.toInstant().truncatedTo(ChronoUnit.SECONDS),
                weight = weight,
                waist = waist,
            )
            state.copy(bodyEntries = state.bodyEntries + entry)
        }
    }

    suspend fun deleteBodyEntry(id: String) = mutate { state, _ ->
        state.copy(bodyEntries = state.bodyEntries.filterNot { it.id == id })
    }

    /**
     * Restores the defaults and saves them. When state.json cannot be read, the file is deleted
     * first. If that fails, the data stays unchanged and [snapshot] reports
     * [StorageError.DeleteFailed].
     */
    suspend fun resetAll() = externalScope.async {
        resetLock.withLock {
            if (snapshot.value?.storageError is StorageError.ReadFailed) {
                try {
                    // DataStore holds no data after a failed read, so the file can be removed.
                    Files.deleteIfExists(stateFile.toPath())
                } catch (error: IOException) {
                    writeError.value = StorageError.DeleteFailed(error.message)
                    return@withLock
                }
                generation.value += 1
            }
            clock.value = now()
            writeError.value = try {
                dataStore.updateData { newState() }
                null
            } catch (error: IOException) {
                StorageError.DeleteFailed(error.message)
            }
        }
    }.await()

    /** The current state as JSON, or null before the first read finishes. */
    fun exportJson(): String? = snapshot.value?.state?.let(StateJson::encode)

    /**
     * Applies [transform] and saves the result. DataStore skips the write when nothing changed.
     * After a failed read, DataStore rejects the write and the read error stays visible.
     */
    private suspend fun mutate(transform: (state: BojiState, now: ZonedDateTime) -> BojiState) {
        val current = now()
        clock.value = current
        externalScope.async {
            if (snapshot.value?.storageError is StorageError.ReadFailed) return@async
            writeError.value = try {
                dataStore.updateData { transform(it, current) }
                null
            } catch (error: IOException) {
                StorageError.WriteFailed(error.message)
            }
        }.await()
    }

    /** Applies [transform] to today's record. A null result means nothing changed. */
    private suspend fun mutateToday(transform: (DailyRecord) -> DailyRecord?) = mutate { state, current ->
        val day = current.toLocalDate()
        val index = state.records.indexOfFirst { it.localDate(current.zone) == day }
        val record = if (index >= 0) state.records[index] else DailyRecord.empty(day, current.zone)
        val updated = transform(record) ?: return@mutate state
        val records = if (index >= 0) {
            state.records.toMutableList().also { it[index] = updated }
        } else {
            state.records + updated
        }
        state.copy(records = records)
    }

    companion object {
        /** The file name is the same as before DataStore, so existing data stays readable. */
        const val STATE_FILE_NAME = "state.json"
        const val MAX_WATER_CHANGE_ML = 10_000
        const val MAX_DAILY_WATER_ML = 20_000
        val SLEEP_RANGE = 0.0..16.0
        val WEIGHT_RANGE_KG = 30.0..300.0
        val WAIST_RANGE_CM = 30.0..250.0

        fun isValidBodyEntry(weight: Double, waist: Double): Boolean =
            weight.isFinite() && waist.isFinite() && weight in WEIGHT_RANGE_KG && waist in WAIST_RANGE_CM

        private fun snapshotOf(state: BojiState, now: ZonedDateTime, error: StorageError?) =
            BojiSnapshot(state = state, today = now.toLocalDate(), zone = now.zone, storageError = error)
    }
}
