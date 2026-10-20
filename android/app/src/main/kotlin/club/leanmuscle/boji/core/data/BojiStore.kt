package club.leanmuscle.boji.core.data

import club.leanmuscle.boji.core.model.BodyEntry
import club.leanmuscle.boji.core.model.BojiSnapshot
import club.leanmuscle.boji.core.model.BojiState
import club.leanmuscle.boji.core.model.DailyRecord
import club.leanmuscle.boji.core.model.PlanKind
import club.leanmuscle.boji.core.model.StorageError
import club.leanmuscle.boji.core.model.Workout
import java.io.File
import java.time.ZonedDateTime
import java.time.temporal.ChronoUnit
import java.util.Locale
import java.util.UUID
import kotlin.math.abs
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * Local-first store for all user records. It follows the rules of iOS `BojiStore`.
 *
 * [snapshot] is null until state.json has been read. Mutations update [snapshot] at once.
 * One coroutine runs every file operation in order: load first, then writes and deletes.
 * A write always saves the latest state, so a queued write cannot restore deleted data.
 */
class BojiStore private constructor(
    private val file: StateFile?,
    scope: CoroutineScope?,
    ioDispatcher: CoroutineDispatcher,
    private val now: () -> ZonedDateTime,
    initialState: BojiState,
) {
    private sealed interface Command {
        data object Persist : Command
        data object Reset : Command
    }

    private val _snapshot = MutableStateFlow(if (file == null) snapshotOf(initialState, now(), null) else null)
    val snapshot: StateFlow<BojiSnapshot?> = _snapshot.asStateFlow()

    private val commands = Channel<Command>(Channel.UNLIMITED)

    /** Set after a failed read. Only the writer coroutine reads or changes it. */
    private var writesBlocked = false

    init {
        if (file != null) {
            requireNotNull(scope) { "A persistent store needs a scope." }
            scope.launch(ioDispatcher) { runFileOperations(file) }
        }
    }

    fun refreshDay() {
        val current = now()
        _snapshot.update { it?.copy(today = current.toLocalDate(), zone = current.zone) }
    }

    fun setSelectedPlan(plan: PlanKind) = mutate { state, _ -> state.copy(selectedPlan = plan) }

    fun completeOnboarding(plan: PlanKind) = mutate { state, _ -> state.copy(selectedPlan = plan, hasOnboarded = true) }

    fun setDisplayName(name: String) = mutate { state, _ -> state.copy(displayName = name) }

    fun setJoinedChallenge(joined: Boolean) = mutate { state, _ -> state.copy(joinedChallenge = joined) }

    /** Adds or removes water for today. Invalid changes are ignored. */
    fun addWater(ml: Int) {
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

    fun setSleep(hours: Double) {
        if (!hours.isFinite() || hours !in SLEEP_RANGE) return
        mutateToday { record -> if (record.sleepHours == hours) null else record.copy(sleepHours = hours) }
    }

    /** Records [workout] once per day. Repeating the same workout on the same day changes nothing. */
    fun completeWorkout(workout: Workout) {
        mutateToday { record ->
            if (workout.id in record.completedWorkoutIDs) return@mutateToday null
            val sum = record.minutes.toLong() + maxOf(0, workout.minutes)
            record.copy(
                completedWorkoutIDs = record.completedWorkoutIDs + workout.id,
                minutes = if (sum > Int.MAX_VALUE) Int.MAX_VALUE else sum.toInt(),
            )
        }
    }

    fun addBodyEntry(weight: Double, waist: Double) {
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

    fun deleteBodyEntry(id: String) = mutate { state, _ ->
        state.copy(bodyEntries = state.bodyEntries.filterNot { it.id == id })
    }

    /**
     * Deletes state.json and restores defaults. If the delete fails, the state stays unchanged
     * and [snapshot] reports [StorageError.DeleteFailed].
     */
    fun resetAll() {
        if (file == null) {
            _snapshot.value = snapshotOf(BojiState(), now(), null)
        } else {
            commands.trySend(Command.Reset)
        }
    }

    /** The current state as JSON, or null before the first load completes. */
    fun exportJson(): String? = _snapshot.value?.state?.let(StateJson::encode)

    private fun mutate(transform: (state: BojiState, now: ZonedDateTime) -> BojiState) {
        val current = now()
        var changed = false
        _snapshot.update { snapshot ->
            if (snapshot == null) return@update null
            val updated = transform(snapshot.state, current)
            changed = updated != snapshot.state
            snapshot.copy(state = updated, today = current.toLocalDate(), zone = current.zone)
        }
        if (changed && file != null) commands.trySend(Command.Persist)
    }

    /** Applies [transform] to today's record. A null result means nothing changed. */
    private fun mutateToday(transform: (DailyRecord) -> DailyRecord?) = mutate { state, current ->
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

    private suspend fun runFileOperations(file: StateFile) {
        load(file)
        var next: Command? = null
        while (true) {
            val command = next ?: commands.receiveCatching().getOrNull() ?: return
            next = null
            when (command) {
                Command.Persist -> {
                    // Later writes save the same latest state, so skip queued duplicates.
                    var pending = commands.tryReceive().getOrNull()
                    while (pending == Command.Persist) pending = commands.tryReceive().getOrNull()
                    persist(file)
                    next = pending
                }
                Command.Reset -> reset(file)
            }
        }
    }

    private fun load(file: StateFile) {
        val current = now()
        _snapshot.value = try {
            val state = file.readOrNull()?.let(StateJson::decode) ?: BojiState()
            snapshotOf(state, current, null)
        } catch (error: Exception) {
            writesBlocked = true
            snapshotOf(BojiState(), current, StorageError.ReadFailed(error.message))
        }
    }

    private fun persist(file: StateFile) {
        if (writesBlocked) return
        val state = _snapshot.value?.state ?: return
        val error = try {
            file.write(StateJson.encode(state))
            null
        } catch (error: Exception) {
            StorageError.WriteFailed(error.message)
        }
        _snapshot.update { it?.copy(storageError = error) }
    }

    private fun reset(file: StateFile) {
        try {
            file.delete()
        } catch (error: Exception) {
            _snapshot.update { it?.copy(storageError = StorageError.DeleteFailed(error.message)) }
            return
        }
        writesBlocked = false
        _snapshot.value = snapshotOf(BojiState(), now(), null)
        persist(file)
    }

    companion object {
        const val MAX_WATER_CHANGE_ML = 10_000
        const val MAX_DAILY_WATER_ML = 20_000
        val SLEEP_RANGE = 0.0..16.0
        val WEIGHT_RANGE_KG = 30.0..300.0
        val WAIST_RANGE_CM = 30.0..250.0

        fun isValidBodyEntry(weight: Double, waist: Double): Boolean =
            weight.isFinite() && waist.isFinite() && weight in WEIGHT_RANGE_KG && waist in WAIST_RANGE_CM

        /** Store backed by [file]. File operations run on [ioDispatcher] inside [scope]. */
        fun persistent(
            file: File,
            scope: CoroutineScope,
            ioDispatcher: CoroutineDispatcher = Dispatchers.IO,
            now: () -> ZonedDateTime = ZonedDateTime::now,
        ): BojiStore = BojiStore(StateFile(file), scope, ioDispatcher, now, BojiState())

        /** Store without a file, for previews and UI tests. It is loaded at once. */
        fun inMemory(
            initialState: BojiState = BojiState(),
            now: () -> ZonedDateTime = ZonedDateTime::now,
        ): BojiStore = BojiStore(null, null, Dispatchers.Unconfined, now, initialState)

        private fun snapshotOf(state: BojiState, now: ZonedDateTime, error: StorageError?) =
            BojiSnapshot(state = state, today = now.toLocalDate(), zone = now.zone, storageError = error)
    }
}
