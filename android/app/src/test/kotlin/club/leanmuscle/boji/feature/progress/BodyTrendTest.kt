package club.leanmuscle.boji.feature.progress

import club.leanmuscle.boji.core.model.BodyEntry
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class BodyTrendTest {
    private val shanghai = ZoneId.of("Asia/Shanghai")

    private fun entry(id: String, at: LocalDateTime, weight: Double, waist: Double = 80.0, zone: ZoneId = shanghai) =
        BodyEntry(id = id, date = at.atZone(zone).toInstant(), weight = weight, waist = waist)

    @Test
    fun returnsNullWithoutEntries() {
        assertNull(bodyTrend(emptyList(), shanghai) { it.weight })
    }

    @Test
    fun usesEpochDaysSoThatGapsMatchTheDates() {
        val entries = listOf(
            entry("A", LocalDateTime.of(2026, 10, 1, 8, 0), 70.0),
            entry("B", LocalDateTime.of(2026, 10, 2, 8, 0), 70.4),
            entry("C", LocalDateTime.of(2026, 10, 9, 8, 0), 69.8),
        )
        val trend = bodyTrend(entries, shanghai) { it.weight }!!
        val first = LocalDate.of(2026, 10, 1).toEpochDay()
        assertEquals(listOf(first, first + 1, first + 8), trend.days)
        assertEquals(listOf(70.0, 70.4, 69.8), trend.values)
        assertEquals(first, trend.minX)
        assertEquals(first + 8, trend.maxX)
        assertEquals(0, trend.labelOffset)
    }

    @Test
    fun keepsTheLastEntryOfADayAndSortsByDate() {
        val entries = listOf(
            entry("late", LocalDateTime.of(2026, 10, 1, 21, 0), 71.0),
            entry("next", LocalDateTime.of(2026, 10, 2, 7, 0), 70.5),
            entry("early", LocalDateTime.of(2026, 10, 1, 7, 0), 70.0),
        )
        val trend = bodyTrend(entries, shanghai) { it.weight }!!
        assertEquals(2, trend.days.size)
        assertEquals(listOf(71.0, 70.5), trend.values)
    }

    @Test
    fun groupsDaysInTheZoneOfTheStore() {
        val utc = ZoneId.of("UTC")
        // 1 October 23:30 UTC and 2 October 00:30 UTC are 07:30 and 08:30 on 2 October in Shanghai.
        val entries = listOf(
            entry("A", LocalDateTime.of(2026, 10, 1, 23, 30), 70.0, zone = utc),
            entry("B", LocalDateTime.of(2026, 10, 2, 0, 30), 71.0, zone = utc),
        )
        // In UTC the entries are on two days. In Shanghai (UTC+8) both are on 2 October.
        assertEquals(2, bodyTrend(entries, utc) { it.weight }!!.days.size)
        val local = bodyTrend(entries, shanghai) { it.weight }!!
        assertEquals(listOf(LocalDate.of(2026, 10, 2).toEpochDay()), local.days)
        assertEquals(listOf(71.0), local.values)
    }

    @Test
    fun rangeFitsTheDataInsteadOfStartingAtZero() {
        val entries = listOf(
            entry("A", LocalDateTime.of(2026, 10, 1, 8, 0), 70.2),
            entry("B", LocalDateTime.of(2026, 10, 3, 8, 0), 70.8),
        )
        val trend = bodyTrend(entries, shanghai) { it.weight }!!
        assertEquals(1.0, trend.yStep, 0.0)
        assertEquals(69.0, trend.minY, 0.0)
        assertEquals(72.0, trend.maxY, 0.0)
    }

    @Test
    fun rangeEndsAreMultiplesOfAStepWithAtMostSixIntervals() {
        val entries = listOf(
            entry("A", LocalDateTime.of(2026, 1, 1, 8, 0), 60.0, waist = 70.0),
            entry("B", LocalDateTime.of(2026, 6, 1, 8, 0), 80.0, waist = 95.0),
        )
        for (metric in listOf<(BodyEntry) -> Double>({ it.weight }, { it.waist })) {
            val trend = bodyTrend(entries, shanghai, metric)!!
            assertEquals(0.0, trend.minY % trend.yStep, 1e-9)
            assertEquals(0.0, trend.maxY % trend.yStep, 1e-9)
            assertTrue(trend.minY < trend.values.min() && trend.maxY > trend.values.max())
            assertTrue((trend.maxY - trend.minY) / trend.yStep <= 6)
        }
    }

    @Test
    fun singleDayIsInTheMiddleWithOneLabel() {
        val trend = bodyTrend(listOf(entry("A", LocalDateTime.of(2026, 10, 1, 8, 0), 70.0)), shanghai) { it.weight }!!
        val day = LocalDate.of(2026, 10, 1).toEpochDay()
        assertEquals(69.0, trend.minY, 0.0)
        assertEquals(71.0, trend.maxY, 0.0)
        assertEquals(day - 1, trend.minX)
        assertEquals(day + 1, trend.maxX)
        // The only label is at minX + offset, the day itself. The next one would be after maxX.
        assertEquals(day, trend.minX + trend.labelOffset)
        assertTrue(trend.minX + trend.labelOffset + trend.labelSpacing > trend.maxX)
    }

    @Test
    fun labelSpacingShowsAtMostFourDates() {
        val start = LocalDateTime.of(2026, 1, 1, 8, 0)
        for (days in listOf(1L, 2L, 3L, 4L, 10L, 30L, 365L)) {
            val entries = listOf(entry("A", start, 70.0), entry("B", start.plusDays(days), 71.0))
            val trend = bodyTrend(entries, shanghai) { it.weight }!!
            val labels = days / trend.labelSpacing + 1
            assertTrue("$days days give $labels labels", labels <= 4)
        }
    }
}
