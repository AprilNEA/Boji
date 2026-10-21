package club.leanmuscle.boji.shared.companion

import java.nio.charset.CharacterCodingException
import java.time.Instant
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import java.time.temporal.ChronoUnit
import java.util.Locale
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.Json

/**
 * Today's manual check-ins on the phone, like `CompanionProgress` on iOS. Only these flags and the
 * plan title leave the phone. Never add amounts, health samples or account data.
 */
data class CompanionProgress(
    /** The local date on the phone, `yyyy-MM-dd`. See [CompanionSnapshot.dayKey]. */
    val dayKey: String,
    val trainingCompleted: Boolean,
    val waterLogged: Boolean,
    val sleepLogged: Boolean,
    /** The localized title of the selected plan. */
    val planTitle: String,
)

/**
 * What the phone sends to the watch. The JSON has the same fields and date format as
 * `CompanionSnapshot` in `ios/Shared/CompanionSnapshot.swift`, so one contract describes both
 * platforms. A phone and a watch of different platforms never exchange it, because the Data Layer
 * connects only Android phones and Wear OS watches.
 *
 * Create a value with [of] or [disabled], and read one with [decode]. The constructor does not
 * apply the sharing or length rules.
 */
@Serializable
data class CompanionSnapshot(
    val schemaVersion: Int,
    @Serializable(with = SnapshotInstantSerializer::class)
    val generatedAt: Instant,
    val isSharingEnabled: Boolean,
    val dayKey: String,
    val trainingCompleted: Boolean,
    val waterLogged: Boolean,
    val sleepLogged: Boolean,
    val planTitle: String,
) {
    val completedCount: Int
        get() = listOf(trainingCompleted, waterLogged, sleepLogged).count { it }

    /**
     * Whether the watch shows these check-ins at [now]. Like iOS, a snapshot from another day, or one
     * that claims to come from more than five minutes in the future, is not current.
     */
    fun isCurrent(now: Instant, zone: ZoneId): Boolean =
        schemaVersion == SCHEMA_VERSION &&
            isSharingEnabled &&
            dayKey == dayKey(now.atZone(zone).toLocalDate()) &&
            !generatedAt.isAfter(now.plus(CLOCK_TOLERANCE_SECONDS, ChronoUnit.SECONDS))

    fun encode(): ByteArray = json.encodeToString(serializer(), this).encodeToByteArray()

    companion object {
        const val SCHEMA_VERSION = 1

        /** The largest payload that [decode] reads, the same 16 KiB limit as iOS. */
        const val MAX_BYTES = 16_384

        /** The plan title limit. iOS counts characters; this counts code points, which is never fewer. */
        const val MAX_PLAN_TITLE = 40

        private const val CLOCK_TOLERANCE_SECONDS = 300L

        private val json = Json {
            // A newer phone may add fields. JSONDecoder on iOS ignores unknown keys too.
            ignoreUnknownKeys = true
        }

        /** The snapshot for [progress]. With sharing off it carries no check-ins and no title. */
        fun of(progress: CompanionProgress, generatedAt: Instant, isSharingEnabled: Boolean = true) = CompanionSnapshot(
            schemaVersion = SCHEMA_VERSION,
            generatedAt = generatedAt,
            isSharingEnabled = isSharingEnabled,
            dayKey = progress.dayKey,
            trainingCompleted = isSharingEnabled && progress.trainingCompleted,
            waterLogged = isSharingEnabled && progress.waterLogged,
            sleepLogged = isSharingEnabled && progress.sleepLogged,
            planTitle = if (isSharingEnabled) progress.planTitle.prefixCodePoints(MAX_PLAN_TITLE) else "",
        )

        /** Tells the watch that sharing is off. */
        fun disabled(at: Instant, zone: ZoneId) = of(
            CompanionProgress(
                dayKey = dayKey(at.atZone(zone).toLocalDate()),
                trainingCompleted = false,
                waterLogged = false,
                sleepLogged = false,
                planTitle = "",
            ),
            generatedAt = at,
            isSharingEnabled = false,
        )

        /** `yyyy-MM-dd` with ASCII digits, like `String(format: "%04d-%02d-%02d")` on iOS. */
        fun dayKey(date: LocalDate): String =
            String.format(Locale.ROOT, "%04d-%02d-%02d", date.year, date.monthValue, date.dayOfMonth)

        /** Reads a snapshot, or returns null when the bytes are too large, malformed or of another schema. */
        fun decode(bytes: ByteArray): CompanionSnapshot? {
            if (bytes.size > MAX_BYTES) return null
            val value = try {
                json.decodeFromString(serializer(), bytes.decodeToString(throwOnInvalidSequence = true))
            } catch (_: CharacterCodingException) {
                // Not UTF-8.
                return null
            } catch (_: IllegalArgumentException) {
                // Malformed JSON or a missing field. SerializationException is a subclass.
                return null
            }
            val valid = value.schemaVersion == SCHEMA_VERSION &&
                value.dayKey.length == 10 &&
                value.planTitle.codePointCount(0, value.planTitle.length) <= MAX_PLAN_TITLE
            return value.takeIf { valid }
        }
    }
}

private fun String.prefixCodePoints(count: Int): String =
    if (codePointCount(0, length) <= count) this else substring(0, offsetByCodePoints(0, count))

/**
 * ISO 8601 with milliseconds in UTC, for example `2026-10-21T06:30:00.000Z`. iOS writes this form
 * with `.withFractionalSeconds`, and reads it with or without the fraction. Reading also accepts an
 * offset other than `Z`.
 */
internal object SnapshotInstantSerializer : KSerializer<Instant> {
    private val writer = DateTimeFormatter.ofPattern("uuuu-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.ROOT).withZone(ZoneOffset.UTC)

    override val descriptor = PrimitiveSerialDescriptor("club.leanmuscle.boji.SnapshotInstant", PrimitiveKind.STRING)

    override fun serialize(encoder: Encoder, value: Instant) {
        encoder.encodeString(writer.format(value.truncatedTo(ChronoUnit.MILLIS)))
    }

    override fun deserialize(decoder: Decoder): Instant {
        val text = decoder.decodeString()
        return try {
            OffsetDateTime.parse(text, DateTimeFormatter.ISO_OFFSET_DATE_TIME).toInstant()
        } catch (error: DateTimeParseException) {
            throw SerializationException("Invalid snapshot date", error)
        }
    }
}
