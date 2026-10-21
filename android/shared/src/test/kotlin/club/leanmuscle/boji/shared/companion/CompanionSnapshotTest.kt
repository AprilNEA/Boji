package club.leanmuscle.boji.shared.companion

import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class CompanionSnapshotTest {
    private val shanghai = ZoneId.of("Asia/Shanghai")
    private val now = Instant.parse("2026-10-21T02:30:00.123Z") // 10:30 in Shanghai
    private val progress = CompanionProgress(
        dayKey = "2026-10-21",
        trainingCompleted = true,
        waterLogged = false,
        sleepLogged = true,
        planTitle = "居家计划",
    )

    @Test
    fun encodesTheIosFieldsAndMillisecondDates() {
        val text = CompanionSnapshot.of(progress, now).encode().decodeToString()

        assertEquals(
            """{"schemaVersion":1,"generatedAt":"2026-10-21T02:30:00.123Z","isSharingEnabled":true,""" +
                """"dayKey":"2026-10-21","trainingCompleted":true,"waterLogged":false,"sleepLogged":true,"planTitle":"居家计划"}""",
            text,
        )
    }

    @Test
    fun writesMillisecondsEvenWhenTheyAreZero() {
        val text = CompanionSnapshot.of(progress, Instant.parse("2026-10-21T02:30:00Z")).encode().decodeToString()

        assertTrue(text, text.contains(""""generatedAt":"2026-10-21T02:30:00.000Z""""))
    }

    @Test
    fun readsWhatIosWritesWithAndWithoutFractionsAndIgnoresNewFields() {
        val withFraction = """{"planTitle":"Home","sleepLogged":false,"waterLogged":true,"trainingCompleted":false,""" +
            """"dayKey":"2026-10-21","isSharingEnabled":true,"generatedAt":"2026-10-21T02:30:00.5Z","schemaVersion":1,"extra":3}"""
        val withoutFraction = withFraction.replace("02:30:00.5Z", "10:30:00+08:00")

        val first = requireSnapshot(CompanionSnapshot.decode(withFraction.encodeToByteArray()))
        val second = requireSnapshot(CompanionSnapshot.decode(withoutFraction.encodeToByteArray()))

        assertEquals(Instant.parse("2026-10-21T02:30:00.500Z"), first.generatedAt)
        assertEquals(Instant.parse("2026-10-21T02:30:00Z"), second.generatedAt)
        assertTrue(first.waterLogged)
        assertEquals("Home", first.planTitle)
    }

    @Test
    fun roundTrips() {
        val snapshot = CompanionSnapshot.of(progress, now)

        assertEquals(snapshot, CompanionSnapshot.decode(snapshot.encode()))
    }

    @Test
    fun sharingOffCarriesNoCheckInsAndNoTitle() {
        val off = CompanionSnapshot.of(progress, now, isSharingEnabled = false)
        val disabled = CompanionSnapshot.disabled(now, shanghai)

        for (snapshot in listOf(off, disabled)) {
            assertFalse(snapshot.isSharingEnabled)
            assertEquals(0, snapshot.completedCount)
            assertEquals("", snapshot.planTitle)
        }
        assertEquals("2026-10-21", disabled.dayKey)
    }

    @Test
    fun cutsTheTitleAtFortyCodePointsWithoutSplittingASurrogatePair() {
        val title = "训".repeat(39) + "\uD83D\uDCAA" + "尾" // 39 + 1 emoji + 1
        val snapshot = CompanionSnapshot.of(progress.copy(planTitle = title), now)

        assertEquals("训".repeat(39) + "\uD83D\uDCAA", snapshot.planTitle)
        requireSnapshot(CompanionSnapshot.decode(snapshot.encode()))
    }

    @Test
    fun rejectsLargeMalformedAndOtherSchemaPayloads() {
        val good = CompanionSnapshot.of(progress, now)

        assertNull(CompanionSnapshot.decode(ByteArray(CompanionSnapshot.MAX_BYTES + 1) { ' '.code.toByte() }))
        assertNull(CompanionSnapshot.decode("{".encodeToByteArray()))
        assertNull(CompanionSnapshot.decode(byteArrayOf(0xC3.toByte(), 0x28)))
        assertNull(CompanionSnapshot.decode(good.copy(schemaVersion = 2).encode()))
        assertNull(CompanionSnapshot.decode(good.copy(dayKey = "2026-1-2").encode()))
        assertNull(CompanionSnapshot.decode(good.copy(planTitle = "x".repeat(41)).encode()))
        val noDate = good.encode().decodeToString().replace("2026-10-21T02:30:00.123Z", "yesterday")
        assertNull(CompanionSnapshot.decode(noDate.encodeToByteArray()))
        val missingField = good.encode().decodeToString().replace(""""sleepLogged":true,""", "")
        assertNull(CompanionSnapshot.decode(missingField.encodeToByteArray()))
    }

    @Test
    fun isCurrentOnlyOnTheSameLocalDayAndWithinFiveMinutesOfTheClock() {
        val snapshot = CompanionSnapshot.of(progress, now)

        assertTrue(snapshot.isCurrent(now, shanghai))
        // 23:59 in Shanghai is still the same day; 00:00 is the next one.
        assertTrue(snapshot.isCurrent(Instant.parse("2026-10-21T15:59:00Z"), shanghai))
        assertFalse(snapshot.isCurrent(Instant.parse("2026-10-21T16:00:00Z"), shanghai))
        // The same instant is still the 20th in New York.
        assertFalse(snapshot.isCurrent(now, ZoneId.of("America/New_York")))
        // A snapshot from more than five minutes in the future means a wrong clock.
        assertTrue(snapshot.isCurrent(now.minusSeconds(300), shanghai))
        assertFalse(snapshot.isCurrent(now.minusSeconds(301), shanghai))
        assertFalse(CompanionSnapshot.of(progress, now, isSharingEnabled = false).isCurrent(now, shanghai))
    }

    @Test
    fun dayKeyUsesAsciiDigitsWithZeroPadding() {
        assertEquals("0987-03-04", CompanionSnapshot.dayKey(LocalDate.of(987, 3, 4)))
    }

    private fun requireSnapshot(value: CompanionSnapshot?): CompanionSnapshot {
        assertNotNull("The snapshot did not decode", value)
        return value!!
    }
}
