package club.leanmuscle.boji.core.data

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
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
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

    @Before
    fun createDirectory() {
        directory = Files.createTempDirectory("BojiStoreTest").toFile()
        stateFile = File(directory, "state.json")
    }

    @After
    fun deleteDirectory() {
        directory.deleteRecursively()
    }

    private fun TestScope.persistentStore(): BojiStore {
        val store = BojiStore.persistent(stateFile, backgroundScope, StandardTestDispatcher(testScheduler)) { now }
        runCurrent()
        return store
    }

    private fun memoryStore() = BojiStore.inMemory { now }

    private val BojiStore.current get() = checkNotNull(snapshot.value)

    @Test
    fun persistenceReloadsState() = runTest {
        val first = persistentStore()
        first.setSelectedPlan(PlanKind.Gym)
        first.completeOnboarding(PlanKind.Gym)
        first.setDisplayName("小博")
        first.setJoinedChallenge(true)
        first.addWater(600)
        first.setSleep(7.5)
        first.completeWorkout(WorkoutLibrary.Gym)
        first.addBodyEntry(weight = 68.2, waist = 78.0)
        runCurrent()

        val reloaded = persistentStore().current

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
    fun completingSameWorkoutIsIdempotent() {
        val store = memoryStore()

        store.completeWorkout(WorkoutLibrary.Home)
        store.completeWorkout(WorkoutLibrary.Home)

        assertEquals(listOf(WorkoutLibrary.Home.id), store.current.todayRecord.completedWorkoutIDs)
        assertEquals(WorkoutLibrary.Home.minutes, store.current.todayRecord.minutes)
        assertEquals(1, store.current.totalWorkouts)
        assertEquals(1, store.current.activeDays)
    }

    @Test
    fun inputValidationRejectsInvalidValues() {
        val store = memoryStore()

        store.addWater(500)
        store.addWater(-900)
        assertEquals(0, store.current.todayRecord.waterML)

        store.addWater(100_001)
        store.addWater(Int.MIN_VALUE)
        assertEquals(0, store.current.todayRecord.waterML)

        store.setSleep(8.0)
        store.setSleep(16.1)
        store.setSleep(Double.NaN)
        assertEquals(8.0, store.current.todayRecord.sleepHours!!, 0.0)

        store.addBodyEntry(weight = 65.0, waist = 75.0)
        store.addBodyEntry(weight = 29.9, waist = 75.0)
        store.addBodyEntry(weight = 65.0, waist = 250.1)
        store.addBodyEntry(weight = Double.POSITIVE_INFINITY, waist = 75.0)
        assertEquals(1, store.current.state.bodyEntries.size)
    }

    @Test
    fun waterIsCappedPerDay() {
        val store = memoryStore()
        store.addWater(10_000)
        store.addWater(10_000)
        store.addWater(500)
        assertEquals(BojiStore.MAX_DAILY_WATER_ML, store.current.todayRecord.waterML)
    }

    @Test
    fun noOpChangesDoNotCreateRecords() {
        val store = memoryStore()
        store.addWater(-250)
        store.addWater(0)
        assertTrue(store.current.state.records.isEmpty())
    }

    @Test
    fun exportJsonMatchesIosFormat() {
        val store = memoryStore()
        store.setDisplayName("导出测试")
        store.addWater(300)

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
    }

    @Test
    fun decodesStateWrittenByIos() {
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

        runTest {
            val snapshot = persistentStore().current
            assertNull(snapshot.storageError)
            assertEquals(PlanKind.Gym, snapshot.state.selectedPlan)
            assertEquals(8.0, snapshot.todayRecord.sleepHours!!, 0.0)
            assertEquals(250, snapshot.todayRecord.waterML)
            assertTrue(snapshot.isCompletedToday(WorkoutLibrary.Gym))
            assertEquals(78.0, snapshot.state.bodyEntries.single().waist, 0.0)
        }
    }

    @Test
    fun resetAllRestoresEmptyDefaults() {
        val store = memoryStore()
        store.completeOnboarding(PlanKind.Gym)
        store.setDisplayName("需要重置")
        store.setJoinedChallenge(true)
        store.addWater(250)
        store.addBodyEntry(weight = 70.0, waist = 80.0)

        store.resetAll()

        val state = store.current.state
        assertEquals(PlanKind.Home, state.selectedPlan)
        assertFalse(state.hasOnboarded)
        assertEquals(BojiState.DEFAULT_DISPLAY_NAME, state.displayName)
        assertFalse(state.joinedChallenge)
        assertTrue(state.records.isEmpty())
        assertTrue(state.bodyEntries.isEmpty())
        assertEquals(0, store.current.todayRecord.waterML)
    }

    @Test
    fun corruptFileIsNotOverwritten() = runTest {
        val corrupt = "not valid JSON"
        stateFile.writeText(corrupt)

        val store = persistentStore()
        assertTrue(store.current.storageError is StorageError.ReadFailed)

        store.setDisplayName("不应写入")
        store.addWater(500)
        runCurrent()

        assertEquals(corrupt, stateFile.readText())
        assertTrue(store.current.storageError is StorageError.ReadFailed)
    }

    @Test
    fun explicitResetClearsCorruptFile() = runTest {
        stateFile.writeText("private corrupted data")
        val store = persistentStore()
        store.resetAll()
        runCurrent()

        val reloaded = persistentStore().current
        assertNull(reloaded.storageError)
        assertTrue(reloaded.state.records.isEmpty())
        assertEquals(BojiState.DEFAULT_DISPLAY_NAME, reloaded.state.displayName)
    }

    @Test
    fun queuedWritesDoNotRestoreDataAfterReset() = runTest {
        val store = persistentStore()
        store.addBodyEntry(weight = 70.0, waist = 80.0)
        store.addWater(250)
        store.resetAll()
        runCurrent()

        val reloaded = persistentStore().current
        assertTrue(reloaded.state.bodyEntries.isEmpty())
        assertTrue(reloaded.state.records.isEmpty())
    }

    @Test
    fun habitDaysAndRollingWeek() {
        val store = memoryStore()
        assertEquals(7, store.current.weekRecords.size)
        assertEquals(0, store.current.activeDays)
        store.addWater(250)
        assertEquals(1, store.current.activeDays)
        store.setSleep(7.0)
        assertEquals(1, store.current.activeDays)
        assertEquals(250, store.current.weekRecords.last().waterML)
        assertEquals(LocalDate.of(2026, 10, 14), store.current.weekRecords.first().localDate(zone))
    }

    @Test
    fun trainingDaysCountOnlyTheCurrentCalendarWeek() {
        val store = memoryStore()
        now = ZonedDateTime.of(2026, 10, 18, 20, 0, 0, 0, zone) // Sunday, previous ISO week
        store.completeWorkout(WorkoutLibrary.Home)
        now = ZonedDateTime.of(2026, 10, 19, 8, 0, 0, 0, zone) // Monday
        store.completeWorkout(WorkoutLibrary.Home)
        now = ZonedDateTime.of(2026, 10, 20, 8, 0, 0, 0, zone) // Tuesday
        store.completeWorkout(WorkoutLibrary.Mobility)
        store.refreshDay()

        assertEquals(2, store.current.trainingDaysThisWeek(WeekFields.ISO))
        assertEquals(3, store.current.trainingDaysThisWeek(WeekFields.SUNDAY_START))
    }

    @Test
    fun refreshDayMovesTodayForward() {
        val store = memoryStore()
        store.addWater(250)
        now = now.plusDays(1)
        store.refreshDay()
        assertEquals(0, store.current.todayRecord.waterML)
        assertEquals(1, store.current.activeDays)
    }

    @Test
    fun deletingBodyEntry() {
        val store = memoryStore()
        store.addBodyEntry(weight = 70.0, waist = 80.0)
        val id = store.current.state.bodyEntries.first().id
        assertEquals(id.uppercase(), id)
        store.deleteBodyEntry(id)
        assertTrue(store.current.state.bodyEntries.isEmpty())
    }

    @Test
    fun writeFailureIsReported() = runTest {
        val blocker = File(directory, "blocked").apply { writeText("file, not a directory") }
        val store = BojiStore.persistent(File(blocker, "state.json"), backgroundScope, StandardTestDispatcher(testScheduler)) { now }
        runCurrent()
        store.addWater(250)
        runCurrent()
        assertNotNull(store.current.storageError as? StorageError.WriteFailed)
    }
}
