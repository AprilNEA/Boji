package club.leanmuscle.boji.core.companion

import club.leanmuscle.boji.core.model.BojiSnapshot
import club.leanmuscle.boji.core.model.BojiState
import club.leanmuscle.boji.core.model.DailyRecord
import club.leanmuscle.boji.core.model.StorageError
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.ZonedDateTime
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class CompanionTest {
    private val shanghai = ZoneId.of("Asia/Shanghai")
    private val today = LocalDate.of(2026, 10, 21)

    private fun record(day: LocalDate, water: Int = 0, sleep: Double? = null, workouts: List<String> = emptyList()) =
        DailyRecord(
            id = day.toString(),
            date = day.atStartOfDay(shanghai).toInstant(),
            waterML = water,
            sleepHours = sleep,
            completedWorkoutIDs = workouts,
        )

    private fun snapshot(vararg records: DailyRecord, error: StorageError? = null) =
        BojiSnapshot(state = BojiState(records = records.toList()), today = today, zone = shanghai, storageError = error)

    @Test
    fun sharingOffWinsOverEverything() {
        assertEquals(DailyWidgetState.Disabled, DailyWidgetState.of(null, sharingEnabled = false))
        assertEquals(DailyWidgetState.Disabled, DailyWidgetState.of(snapshot(error = StorageError.ReadFailed(null)), sharingEnabled = false))
        assertEquals(DailyWidgetState.Disabled, DailyWidgetState.of(snapshot(record(today, water = 250)), sharingEnabled = false))
    }

    @Test
    fun waitsForStateJsonAndReportsAReadFailure() {
        assertNull(DailyWidgetState.of(null, sharingEnabled = true))
        assertEquals(DailyWidgetState.Unavailable, DailyWidgetState.of(snapshot(error = StorageError.ReadFailed("io")), sharingEnabled = true))
        // A failed write keeps the data on screen, so the widget keeps showing it too.
        val afterWriteFailure = DailyWidgetState.of(snapshot(record(today, water = 250), error = StorageError.WriteFailed(null)), sharingEnabled = true)
        assertEquals(DailyWidgetState.Current(DailyStatus(trainingCompleted = false, waterLogged = true, sleepLogged = false)), afterWriteFailure)
    }

    @Test
    fun countsOnlyTodaysRecord() {
        val yesterday = record(today.minusDays(1), water = 500, sleep = 7.5, workouts = listOf("bodyweight-squat"))
        val state = DailyWidgetState.of(snapshot(yesterday), sharingEnabled = true)
        assertEquals(DailyWidgetState.Current(DailyStatus(trainingCompleted = false, waterLogged = false, sleepLogged = false)), state)
    }

    @Test
    fun usesTheSameRulesAsTodayTaskCount() {
        val current = snapshot(record(today, water = 0, sleep = 0.0, workouts = listOf("bodyweight-squat")))
        val status = current.dailyStatus()
        // Zero water is not a log. A sleep entry of zero hours is, as on iOS (sleepHours != nil).
        assertEquals(DailyStatus(trainingCompleted = true, waterLogged = false, sleepLogged = true), status)
        assertEquals(current.todayTaskCount, listOf(status.trainingCompleted, status.waterLogged, status.sleepLogged).count { it })
        assertFalse(status.allLogged)
        assertTrue(snapshot(record(today, water = 1, sleep = 6.0, workouts = listOf("x"))).dailyStatus().allLogged)
    }

    @Test
    fun nextMidnightIsTheStartOfTheNextLocalDay() {
        val now = ZonedDateTime.of(LocalDateTime.of(2026, 10, 21, 23, 59, 30), shanghai)
        assertEquals(ZonedDateTime.of(LocalDateTime.of(2026, 10, 22, 0, 0), shanghai).toInstant(), nextLocalMidnight(now))
        val justAfter = ZonedDateTime.of(LocalDateTime.of(2026, 10, 22, 0, 0), shanghai)
        assertEquals(ZonedDateTime.of(LocalDateTime.of(2026, 10, 23, 0, 0), shanghai).toInstant(), nextLocalMidnight(justAfter))
    }

    @Test
    fun nextMidnightFollowsADaylightSavingGapAtMidnight() {
        // Cuba starts daylight saving time at 00:00 on the second Sunday of March: 2026-03-08 begins at 01:00.
        val havana = ZoneId.of("America/Havana")
        val now = ZonedDateTime.of(LocalDateTime.of(2026, 3, 7, 22, 0), havana)
        val midnight = nextLocalMidnight(now).atZone(havana)
        assertEquals(LocalDateTime.of(2026, 3, 8, 1, 0), midnight.toLocalDateTime())
        assertEquals(2, java.time.Duration.between(now.toInstant(), midnight.toInstant()).toHours())
    }

    @Test
    fun parsesEveryRouteAndIgnoresCase() {
        for (route in CompanionRoute.entries) assertEquals(route, CompanionRoute.parse(route.uri))
        assertEquals(CompanionRoute.Training, CompanionRoute.parse("BOJI://Training"))
        assertEquals(CompanionRoute.Today, CompanionRoute.parse("boji://today/"))
        assertEquals("boji://progress", CompanionRoute.Progress.uri)
    }

    @Test
    fun rejectsEverythingElseLikeIos() {
        val rejected = listOf(
            null,
            "",
            "boji://today?tab=club",
            "boji://today#top",
            "boji://user@today",
            "boji://user:secret@today",
            "boji://today:443",
            "boji://today/settings",
            "boji://settings",
            "boji:today",
            "https://today",
            "boji://",
            "boji://to day",
        )
        for (value in rejected) assertNull(value, CompanionRoute.parse(value))
    }
}
