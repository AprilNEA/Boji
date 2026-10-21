package club.leanmuscle.boji.feature.progress

import club.leanmuscle.boji.core.model.BodyEntry
import java.time.ZoneId
import kotlin.math.ceil
import kotlin.math.floor

/**
 * The data of the body trend chart for one metric.
 *
 * The x values are epoch days in the zone of the store, so the gaps between points match the gaps
 * between the dates. A day with more than one entry shows its last entry. The y range fits the data
 * and does not start at zero, as on iOS. Its ends are multiples of [yStep].
 *
 * With one day of data, the x range adds a day on each side, so that the point is in the middle.
 */
internal data class BodyTrend(
    val days: List<Long>,
    val values: List<Double>,
    val minY: Double,
    val maxY: Double,
    val yStep: Double,
) {
    val minX: Long get() = if (days.size == 1) days.first() - 1 else days.first()
    val maxX: Long get() = if (days.size == 1) days.first() + 1 else days.last()

    /** The number of days between two date labels, so that the axis shows at most four dates. */
    val labelSpacing: Int
        get() = if (days.size == 1) 2 else maxOf(1, ceil((maxX - minX) / (MAX_DATE_LABELS - 1).toDouble()).toInt())

    /** The number of days from [minX] to the first date label. Only a single day is not at [minX]. */
    val labelOffset: Int get() = if (days.size == 1) 1 else 0
}

private const val MAX_DATE_LABELS = 4
private const val MAX_VALUE_INTERVALS = 4
private val VALUE_STEPS = listOf(1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0)

/** Returns null when [entries] is empty. [entries] can be in any order. */
internal fun bodyTrend(entries: List<BodyEntry>, zone: ZoneId, value: (BodyEntry) -> Double): BodyTrend? {
    if (entries.isEmpty()) return null
    // associateBy keeps the last entry for a key and the order in which the keys first appear.
    val lastPerDay = entries.sortedBy { it.date }.associateBy { it.date.atZone(zone).toLocalDate().toEpochDay() }
    val values = lastPerDay.values.map(value)
    val low = values.min()
    val high = values.max()
    val margin = maxOf((high - low) * 0.15, 0.5)
    val span = (high + margin) - (low - margin)
    val step = VALUE_STEPS.firstOrNull { span / it <= MAX_VALUE_INTERVALS } ?: VALUE_STEPS.last()
    return BodyTrend(
        days = lastPerDay.keys.toList(),
        values = values,
        minY = floor((low - margin) / step) * step,
        maxY = ceil((high + margin) / step) * step,
        yStep = step,
    )
}
