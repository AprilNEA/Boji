package club.leanmuscle.boji.core.health

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class HealthSnapshotTest {
    private val shanghai = ZoneId.of("Asia/Shanghai")
    private val day = LocalDate.of(2026, 10, 20)
    private val now = at(2026, 10, 20, 12, 0)

    private fun at(year: Int, month: Int, dayOfMonth: Int, hour: Int, minute: Int, zone: ZoneId = shanghai) =
        LocalDateTime.of(year, month, dayOfMonth, hour, minute).atZone(zone).toInstant()

    private fun weight(id: String, kilograms: Double, hour: Int, dayOfMonth: Int = 20) =
        HealthWeight(id, kilograms, at(2026, 10, dayOfMonth, hour, 0), "Scale")

    private fun sleep(
        id: String,
        from: Pair<Int, Int>,
        until: Pair<Int, Int>,
        stage: HealthSleepStage = HealthSleepStage.Asleep,
        source: String = "Watch",
        fromDay: Int = 19,
        untilDay: Int = 20,
    ) = HealthSleepSample(
        id,
        at(2026, 10, fromDay, from.first, from.second),
        at(2026, 10, untilDay, until.first, until.second),
        stage,
        source,
    )

    @Test
    fun latestWeightIgnoresInvalidAndFutureSamples() {
        val snapshot = HealthSnapshot.of(
            weights = listOf(
                weight("old", 72.0, hour = 8, dayOfMonth = 18),
                weight("latest", 71.6, hour = 7),
                weight("future", 70.0, hour = 13),
                weight("zero", 0.0, hour = 9),
                weight("nan", Double.NaN, hour = 10),
                weight("latest", 99.0, hour = 11),
            ),
            sleepSamples = emptyList(),
            now = now,
        )

        assertEquals(listOf("old", "latest"), snapshot.weights.map { it.id })
        assertEquals(71.6, snapshot.latestWeight()!!.kilograms, 0.0)
    }

    @Test
    fun latestWeightBreaksTiesByIdentifier() {
        val snapshot = HealthSnapshot.of(listOf(weight("b", 71.0, hour = 7), weight("a", 72.0, hour = 7)), emptyList(), now)

        assertEquals("a", snapshot.latestWeight()!!.id)
    }

    @Test
    fun sleepDayRunsFromSixPmToSixPm() {
        val snapshot = HealthSnapshot.of(emptyList(), listOf(sleep("night", 23 to 0, 7 to 0)), now)

        assertEquals(8.0, snapshot.sleepHours(day, shanghai)!!, 1e-9)
        assertNull(snapshot.sleepHours(day.minusDays(1), shanghai))
        assertNull(snapshot.sleepHours(day.plusDays(1), shanghai))
    }

    @Test
    fun intervalsAreClippedAtTheSleepDayBoundary() {
        // A nap from 17:00 to 19:00 on 10-20 belongs half to the 10-20 sleep day, half to 10-21.
        val nap = sleep("nap", 17 to 0, 19 to 0, fromDay = 20, untilDay = 20)
        val snapshot = HealthSnapshot.of(emptyList(), listOf(nap), now)

        assertEquals(1.0, snapshot.sleepHours(day, shanghai)!!, 1e-9)
        assertEquals(1.0, snapshot.sleepHours(day.plusDays(1), shanghai)!!, 1e-9)
    }

    @Test
    fun overlappingSourcesCountOnce() {
        val snapshot = HealthSnapshot.of(
            emptyList(),
            listOf(
                sleep("watch", 23 to 0, 7 to 0, source = "Watch"),
                sleep("phone", 1 to 0, 8 to 0, source = "Phone", fromDay = 20),
            ),
            now,
        )

        assertEquals(9.0, snapshot.sleepHours(day, shanghai)!!, 1e-9)
        assertEquals(listOf("Phone", "Watch"), snapshot.sleepSources())
    }

    @Test
    fun awakeStagesDoNotCount() {
        val snapshot = HealthSnapshot.of(
            emptyList(),
            listOf(
                sleep("s1", 23 to 0, 3 to 0),
                sleep("awake", 3 to 0, 3 to 30, stage = HealthSleepStage.Awake, fromDay = 20),
                sleep("s2", 3 to 30, 7 to 0, fromDay = 20),
            ),
            now,
        )

        assertEquals(7.5, snapshot.sleepHours(day, shanghai)!!, 1e-9)
    }

    @Test
    fun onlyAwakeOrInvalidSamplesGiveNoValue() {
        val snapshot = HealthSnapshot.of(
            emptyList(),
            listOf(
                sleep("awake", 23 to 0, 7 to 0, stage = HealthSleepStage.Awake),
                sleep("backwards", 7 to 0, 6 to 0, fromDay = 20),
            ),
            now,
        )

        assertEquals(listOf("awake"), snapshot.sleepSamples.map { it.id })
        assertNull(snapshot.sleepHours(day, shanghai))
    }

    @Test
    fun sleepHoursUseElapsedTimeAcrossDaylightSavingChanges() {
        // New York moves from 02:00 EST to 03:00 EDT on 2026-03-08. 23:00 to 07:00 is 7 hours.
        val newYork = ZoneId.of("America/New_York")
        val night = HealthSleepSample(
            "dst",
            at(2026, 3, 7, 23, 0, newYork),
            at(2026, 3, 8, 7, 0, newYork),
            HealthSleepStage.Asleep,
            "Watch",
        )
        val snapshot = HealthSnapshot.of(emptyList(), listOf(night), now = at(2026, 3, 8, 12, 0, newYork))

        assertEquals(7.0, snapshot.sleepHours(LocalDate.of(2026, 3, 8), newYork)!!, 1e-9)
    }
}
