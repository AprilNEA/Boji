package club.leanmuscle.boji.core.health

import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId

/** One weight record from Health Connect. [source] is the label of the app that wrote it. */
data class HealthWeight(
    val id: String,
    val kilograms: Double,
    val time: Instant,
    val source: String,
)

/** Whether a sleep interval counts as sleep. Awake, in-bed and out-of-bed stages do not. */
enum class HealthSleepStage { Asleep, Awake }

/** One sleep interval: a whole session without stages, or one stage of a session. */
data class HealthSleepSample(
    val id: String,
    val start: Instant,
    val end: Instant,
    val stage: HealthSleepStage,
    val source: String,
)

/**
 * The samples of one refresh. They live in memory only: they are not written to state.json,
 * not exported and never mixed with manual records. Same rules as `HealthSnapshot` on iOS.
 */
class HealthSnapshot private constructor(
    val weights: List<HealthWeight>,
    val sleepSamples: List<HealthSleepSample>,
) {
    /** The newest weight. Ties on time are broken by ID, so the result is stable. */
    fun latestWeight(): HealthWeight? =
        weights.minWithOrNull(compareByDescending<HealthWeight> { it.time }.thenBy { it.id })

    /**
     * Asleep hours in the sleep day that ends at 18:00 on [day] in [zone]. The sleep day starts at
     * 18:00 on the day before. Overlapping intervals, for example from two apps, count once.
     * Returns null when no asleep interval falls in the sleep day.
     */
    fun sleepHours(day: LocalDate, zone: ZoneId): Double? {
        // atZone moves a time that does not exist in a DST gap forward, so the boundaries stay valid.
        val dayEnd = day.atTime(SLEEP_DAY_END).atZone(zone).toInstant()
        val dayStart = day.minusDays(1).atTime(SLEEP_DAY_END).atZone(zone).toInstant()
        val intervals = sleepSamples
            .asSequence()
            .filter { it.stage == HealthSleepStage.Asleep }
            .mapNotNull { sample ->
                val start = maxOf(sample.start, dayStart)
                val end = minOf(sample.end, dayEnd)
                if (start < end) start to end else null
            }
            .sortedWith(compareBy<Pair<Instant, Instant>> { it.first }.thenBy { it.second })
            .toList()
        if (intervals.isEmpty()) return null

        var total = Duration.ZERO
        var (currentStart, currentEnd) = intervals.first()
        for ((start, end) in intervals.drop(1)) {
            if (start <= currentEnd) {
                currentEnd = maxOf(currentEnd, end)
            } else {
                total += Duration.between(currentStart, currentEnd)
                currentStart = start
                currentEnd = end
            }
        }
        total += Duration.between(currentStart, currentEnd)
        return total.toMillis() / MILLIS_PER_HOUR
    }

    /** The app labels of all sleep samples, sorted, without duplicates. */
    fun sleepSources(): List<String> = sleepSamples.map { it.source }.distinct().sorted()

    val isEmpty: Boolean
        get() = weights.isEmpty() && sleepSamples.isEmpty()

    override fun equals(other: Any?): Boolean =
        other is HealthSnapshot && weights == other.weights && sleepSamples == other.sleepSamples

    override fun hashCode(): Int = 31 * weights.hashCode() + sleepSamples.hashCode()

    companion object {
        val Empty = HealthSnapshot(emptyList(), emptyList())

        private val SLEEP_DAY_END: LocalTime = LocalTime.of(18, 0)
        private const val MILLIS_PER_HOUR = 3_600_000.0

        /**
         * Keeps only valid samples. A weight must be finite, above zero and not after [now].
         * A sleep sample must end after it starts. For a duplicate ID, the first sample stays.
         */
        fun of(weights: List<HealthWeight>, sleepSamples: List<HealthSleepSample>, now: Instant): HealthSnapshot {
            val weightIds = HashSet<String>()
            val validWeights = weights.filter { weight ->
                weightIds.add(weight.id) && weight.kilograms.isFinite() && weight.kilograms > 0 && !weight.time.isAfter(now)
            }
            val sleepIds = HashSet<String>()
            val validSleep = sleepSamples.filter { sample -> sleepIds.add(sample.id) && sample.start < sample.end }
            return HealthSnapshot(validWeights, validSleep)
        }
    }
}
