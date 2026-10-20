package club.leanmuscle.boji.core.data

import club.leanmuscle.boji.core.model.BojiSnapshot
import club.leanmuscle.boji.core.model.BojiState
import club.leanmuscle.boji.core.model.PlanKind
import club.leanmuscle.boji.core.model.StorageError
import club.leanmuscle.boji.core.model.WorkoutLibrary
import java.io.File
import java.nio.file.Files
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.temporal.WeekFields
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class BojiStoreTest {
    private val zone = ZoneId.of("Asia/Shanghai")

    /** Tuesday 2026-10-20 09:30 in Shanghai. */
    private var now = ZonedDateTime.of(2026, 10, 20, 9, 30, 0, 0, zone)

    private lateinit var directory: File
    private lateinit var stateFile: File
    private var opened: TestStore? = null

    @Before
    fun createDirectory() {
        directory = Files.createTempDirectory("BojiStoreTest").toFile()
        stateFile = File(directory, "state.json")
    }

    @After
    fun deleteDirectory() {
        directory.deleteRecursively()
    }

    /** Opens [file] after closing the previous store, as a new process would. */
    private suspend fun TestScope.open(file: File = stateFile): BojiStore {
        opened?.close()
        val next = TestStore(file, backgroundScope) { now }
        opened = next
        runCurrent()
        return next.store
    }

    private fun TestScope.current(store: BojiStore): BojiSnapshot {
        runCurrent()
        return checkNotNull(store.snapshot.value)
    }

    @Test
    fun persistenceReloadsState() = runTest {
        val first = open()
        first.setSelectedPlan(PlanKind.Gym)
        first.completeOnboarding(PlanKind.Gym)
        first.setDisplayName("小博")
        first.setJoinedChallenge(true)
        first.addWater(600)
        first.setSleep(7.5)
        first.completeWorkout(WorkoutLibrary.Gym)
        first.addBodyEntry(weight = 68.2, waist = 78.0)

        val reloaded = current(open())

        assertNull(reloaded.storageError)
        assertEquals(PlanKind.Gym, reloaded.state.selectedPlan)
        assertTrue(reloaded.state.hasOnboarded)
        assertEquals("小博", reloaded.state.displayName)
        assertTrue(reloaded.state.joinedChallenge)
        assertEquals(600, reloaded.todayRecord.waterML)
        assertEquals(7.5, reloaded.todayRecord.sleepHours!!, 0.0)
        assertEquals(1, reloaded.totalWorkouts)
        assertEquals(WorkoutLibrary.Gym.minutes, reloaded.todayRecord.minutes)
        assertEquals(1, reloaded.state.bodyEntries.size)
    }

    @Test
    fun missingFileStartsWithDefaults() = runTest {
        val snapshot = current(open())
        assertNull(snapshot.storageError)
        assertEquals(BojiState(), snapshot.state)
        assertFalse("reading alone does not create the file", stateFile.exists())
    }

    @Test
    fun completingSameWorkoutIsIdempotent() = runTest {
        val store = open()

        store.completeWorkout(WorkoutLibrary.Home)
        store.completeWorkout(WorkoutLibrary.Home)

        val snapshot = current(store)
        assertEquals(listOf(WorkoutLibrary.Home.id), snapshot.todayRecord.completedWorkoutIDs)
        assertEquals(WorkoutLibrary.Home.minutes, snapshot.todayRecord.minutes)
        assertEquals(1, snapshot.totalWorkouts)
        assertEquals(1, snapshot.activeDays)
    }

    @Test
    fun inputValidationRejectsInvalidValues() = runTest {
        val store = open()

        store.addWater(500)
        store.addWater(-900)
        assertEquals(0, current(store).todayRecord.waterML)

        store.addWater(100_001)
        store.addWater(Int.MIN_VALUE)
        assertEquals(0, current(store).todayRecord.waterML)

        store.setSleep(8.0)
        store.setSleep(16.1)
        store.setSleep(Double.NaN)
        assertEquals(8.0, current(store).todayRecord.sleepHours!!, 0.0)

        store.addBodyEntry(weight = 65.0, waist = 75.0)
        store.addBodyEntry(weight = 29.9, waist = 75.0)
        store.addBodyEntry(weight = 65.0, waist = 250.1)
        store.addBodyEntry(weight = Double.POSITIVE_INFINITY, waist = 75.0)
        assertEquals(1, current(store).state.bodyEntries.size)
    }

    @Test
    fun waterIsCappedPerDay() = runTest {
        val store = open()
        store.addWater(10_000)
        store.addWater(10_000)
        store.addWater(500)
        assertEquals(BojiStore.MAX_DAILY_WATER_ML, current(store).todayRecord.waterML)
    }

    @Test
    fun noOpChangesDoNotCreateRecords() = runTest {
        val store = open()
        store.addWater(-250)
        store.addWater(0)
        assertTrue(current(store).state.records.isEmpty())
        assertFalse("an unchanged state is not written", stateFile.exists())
    }

    @Test
    fun exportJsonMatchesIosFormat() = runTest {
        val store = open()
        store.setDisplayName("导出测试")
        store.addWater(300)
        runCurrent()

        val text = checkNotNull(store.exportJson())
        val root = Json.parseToJsonElement(text).jsonObject
        val record = root.getValue("records").jsonArray.single().jsonObject

        assertEquals("导出测试", root.getValue("displayName").jsonPrimitive.content)
        assertEquals("home", root.getValue("selectedPlan").jsonPrimitive.content)
        assertEquals(root.keys.sorted(), root.keys.toList())
        assertEquals(record.keys.sorted(), record.keys.toList())
        assertEquals("2026-10-20", record.getValue("id").jsonPrimitive.content)
        // Start of the Shanghai day, encoded like Swift `.iso8601`.
        assertEquals("2026-10-19T16:00:00Z", record.getValue("date").jsonPrimitive.content)
        assertFalse("nil optionals are omitted", "sleepHours" in record)
        assertEquals("the file and the export use the same bytes", text, stateFile.readText())
    }

    @Test
    fun decodesStateWrittenByIos() = runTest {
        val ios = """
            {
              "bodyEntries" : [
                { "date" : "2026-10-18T01:02:03Z", "id" : "6F9619FF-8B86-D011-B42D-00C04FC964FF", "waist" : 78, "weight" : 68.2 }
              ],
              "displayName" : "小博",
              "hasOnboarded" : true,
              "joinedChallenge" : false,
              "records" : [
                { "completedWorkoutIDs" : [ "gym-beginner" ], "date" : "2026-10-19T16:00:00Z", "id" : "2026-10-20", "minutes" : 30, "sleepHours" : 8, "waterML" : 250 }
              ],
              "selectedPlan" : "gym"
            }
        """.trimIndent()
        stateFile.writeText(ios)

        val snapshot = current(open())
        assertNull(snapshot.storageError)
        assertEquals(PlanKind.Gym, snapshot.state.selectedPlan)
        assertEquals(8.0, snapshot.todayRecord.sleepHours!!, 0.0)
        assertEquals(250, snapshot.todayRecord.waterML)
        assertTrue(snapshot.isCompletedToday(WorkoutLibrary.Gym))
        assertEquals(78.0, snapshot.state.bodyEntries.single().waist, 0.0)
    }

    @Test
    fun resetAllRestoresEmptyDefaults() = runTest {
        val store = open()
        store.completeOnboarding(PlanKind.Gym)
        store.setDisplayName("需要重置")
        store.setJoinedChallenge(true)
        store.addWater(250)
        store.addBodyEntry(weight = 70.0, waist = 80.0)

        store.resetAll()

        val snapshot = current(store)
        val state = snapshot.state
        assertEquals(PlanKind.Home, state.selectedPlan)
        assertFalse(state.hasOnboarded)
        assertEquals(BojiState.DEFAULT_DISPLAY_NAME, state.displayName)
        assertFalse(state.joinedChallenge)
        assertTrue(state.records.isEmpty())
        assertTrue(state.bodyEntries.isEmpty())
        assertEquals(0, snapshot.todayRecord.waterML)
    }

    @Test
    fun corruptFileIsNotOverwritten() = runTest {
        val corrupt = "not valid JSON"
        stateFile.writeText(corrupt)

        val store = open()
        assertTrue(current(store).storageError is StorageError.ReadFailed)

        store.setDisplayName("不应写入")
        store.addWater(500)

        assertEquals(corrupt, stateFile.readText())
        assertTrue(current(store).storageError is StorageError.ReadFailed)
    }

    @Test
    fun invalidDateCountsAsCorruption() = runTest {
        // Valid JSON, but the date is not ISO 8601. The parser throws DateTimeParseException.
        val invalid = """{"bodyEntries":[{"date":"yesterday","id":"A","waist":78,"weight":68.2}]}"""
        stateFile.writeText(invalid)

        val store = open()
        assertTrue(current(store).storageError is StorageError.ReadFailed)

        store.setDisplayName("不应写入")
        assertEquals(invalid, stateFile.readText())
    }

    @Test
    fun explicitResetClearsCorruptFile() = runTest {
        stateFile.writeText("private corrupted data")
        val store = open()
        assertTrue(current(store).storageError is StorageError.ReadFailed)

        store.resetAll()
        val afterReset = current(store)
        assertNull("the same store recovers after the reset", afterReset.storageError)

        val reloaded = current(open())
        assertNull(reloaded.storageError)
        assertTrue(reloaded.state.records.isEmpty())
        assertEquals(BojiState.DEFAULT_DISPLAY_NAME, reloaded.state.displayName)
    }

    @Test
    fun concurrentWritesKeepCallOrder() = runTest {
        val store = open()
        launch { store.addBodyEntry(weight = 70.0, waist = 80.0) }
        launch { store.addWater(250) }
        launch { store.resetAll() }
        runCurrent()

        val reloaded = current(open())
        assertTrue(reloaded.state.bodyEntries.isEmpty())
        assertTrue(reloaded.state.records.isEmpty())
    }

    @Test
    fun cancelledCallerDoesNotCancelTheWrite() = runTest {
        val store = open()
        // A view model scope that closes right after the call, like a dismissed screen.
        val screen = CoroutineScope(coroutineContext + Job())
        screen.launch { store.addWater(250) }
        runCurrent()
        screen.cancel()

        assertEquals(250, current(open()).todayRecord.waterML)
    }

    @Test
    fun habitDaysAndRollingWeek() = runTest {
        val store = open()
        assertEquals(7, current(store).weekRecords.size)
        assertEquals(0, current(store).activeDays)
        store.addWater(250)
        assertEquals(1, current(store).activeDays)
        store.setSleep(7.0)
        assertEquals(1, current(store).activeDays)
        assertEquals(250, current(store).weekRecords.last().waterML)
        assertEquals(LocalDate.of(2026, 10, 14), current(store).weekRecords.first().localDate(zone))
    }

    @Test
    fun trainingDaysCountOnlyTheCurrentCalendarWeek() = runTest {
        val store = open()
        now = ZonedDateTime.of(2026, 10, 18, 20, 0, 0, 0, zone) // Sunday, previous ISO week
        store.completeWorkout(WorkoutLibrary.Home)
        now = ZonedDateTime.of(2026, 10, 19, 8, 0, 0, 0, zone) // Monday
        store.completeWorkout(WorkoutLibrary.Home)
        now = ZonedDateTime.of(2026, 10, 20, 8, 0, 0, 0, zone) // Tuesday
        store.completeWorkout(WorkoutLibrary.Mobility)
        store.refreshDay()

        assertEquals(2, current(store).trainingDaysThisWeek(WeekFields.ISO))
        assertEquals(3, current(store).trainingDaysThisWeek(WeekFields.SUNDAY_START))
    }

    @Test
    fun refreshDayMovesTodayForward() = runTest {
        val store = open()
        store.addWater(250)
        now = now.plusDays(1)
        store.refreshDay()
        assertEquals(0, current(store).todayRecord.waterML)
        assertEquals(1, current(store).activeDays)
    }

    @Test
    fun deletingBodyEntry() = runTest {
        val store = open()
        store.addBodyEntry(weight = 70.0, waist = 80.0)
        val id = current(store).state.bodyEntries.first().id
        assertEquals(id.uppercase(), id)
        store.deleteBodyEntry(id)
        assertTrue(current(store).state.bodyEntries.isEmpty())
    }

    @Test
    fun writeFailureIsReported() = runTest {
        val blocker = File(directory, "blocked").apply { writeText("file, not a directory") }
        val store = open(File(blocker, "state.json"))
        store.addWater(250)
        assertNotNull(current(store).storageError as? StorageError.WriteFailed)
    }
}
