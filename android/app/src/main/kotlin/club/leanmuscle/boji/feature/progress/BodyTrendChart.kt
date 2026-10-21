package club.leanmuscle.boji.feature.progress

import android.text.format.DateFormat
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.unit.dp
import club.leanmuscle.boji.ui.components.textLocale
import com.patrykandpatrick.vico.compose.cartesian.CartesianChartHost
import com.patrykandpatrick.vico.compose.cartesian.Zoom
import com.patrykandpatrick.vico.compose.cartesian.axis.HorizontalAxis
import com.patrykandpatrick.vico.compose.cartesian.axis.VerticalAxis
import com.patrykandpatrick.vico.compose.cartesian.data.CartesianChartModelProducer
import com.patrykandpatrick.vico.compose.cartesian.data.CartesianLayerRangeProvider
import com.patrykandpatrick.vico.compose.cartesian.data.CartesianValueFormatter
import com.patrykandpatrick.vico.compose.cartesian.data.lineModel
import com.patrykandpatrick.vico.compose.cartesian.layer.LineCartesianLayer
import com.patrykandpatrick.vico.compose.cartesian.layer.rememberLine
import com.patrykandpatrick.vico.compose.cartesian.layer.rememberLineCartesianLayer
import com.patrykandpatrick.vico.compose.cartesian.rememberCartesianChart
import com.patrykandpatrick.vico.compose.cartesian.rememberVicoScrollState
import com.patrykandpatrick.vico.compose.cartesian.rememberVicoZoomState
import com.patrykandpatrick.vico.compose.common.Fill
import com.patrykandpatrick.vico.compose.common.ProvideVicoTheme
import com.patrykandpatrick.vico.compose.common.component.rememberShapeComponent
import com.patrykandpatrick.vico.compose.m3.common.rememberM3VicoTheme
import java.text.NumberFormat
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import kotlin.math.roundToLong

/**
 * Line and points of [trend], drawn with Vico.
 *
 * The chart fits its width and does not scroll or zoom. The value axis is at the end, as in Swift
 * Charts on iOS. The chart is a picture for TalkBack: the caller sets its content description.
 */
@Composable
internal fun BodyTrendChart(trend: BodyTrend, modifier: Modifier = Modifier) {
    val color = MaterialTheme.colorScheme.primary
    val locale = textLocale
    val dateFormatter = remember(locale) {
        DateTimeFormatter.ofPattern(DateFormat.getBestDateTimePattern(locale, "Md"), locale)
    }
    val dateLabels = remember(dateFormatter) {
        CartesianValueFormatter { _, x, _ -> dateFormatter.format(LocalDate.ofEpochDay(x.roundToLong())) }
    }
    val valueLabels = remember(locale) {
        val format = NumberFormat.getIntegerInstance(locale)
        CartesianValueFormatter { _, y, _ -> format.format(y.roundToLong()) }
    }
    val modelProducer = remember { CartesianChartModelProducer() }
    LaunchedEffect(trend.days, trend.values) {
        modelProducer.runTransaction { lineModel { series(x = trend.days, y = trend.values) } }
    }
    val point = rememberShapeComponent(fill = Fill(color), shape = CircleShape)
    ProvideVicoTheme(
        rememberM3VicoTheme(
            lineColor = MaterialTheme.colorScheme.outlineVariant,
            textColor = MaterialTheme.colorScheme.onSurfaceVariant,
        ),
    ) {
        CartesianChartHost(
            chart = rememberCartesianChart(
                rememberLineCartesianLayer(
                    lineProvider = LineCartesianLayer.LineProvider.series(
                        LineCartesianLayer.rememberLine(
                            fill = remember(color) { LineCartesianLayer.LineFill.single(Fill(color)) },
                            stroke = LineCartesianLayer.LineStroke.Continuous(thickness = 2.5.dp, cap = StrokeCap.Round),
                            pointProvider = LineCartesianLayer.PointProvider.single(LineCartesianLayer.Point(point, size = 8.dp)),
                            interpolator = LineCartesianLayer.Interpolator.cubic(),
                        ),
                    ),
                    rangeProvider = remember(trend.minX, trend.maxX, trend.minY, trend.maxY) {
                        CartesianLayerRangeProvider.fixed(
                            minX = trend.minX.toDouble(),
                            maxX = trend.maxX.toDouble(),
                            minY = trend.minY,
                            maxY = trend.maxY,
                        )
                    },
                ),
                endAxis = VerticalAxis.rememberEnd(
                    line = null,
                    tick = null,
                    valueFormatter = valueLabels,
                    itemPlacer = remember(trend.yStep) { VerticalAxis.ItemPlacer.step(step = { trend.yStep }) },
                ),
                bottomAxis = HorizontalAxis.rememberBottom(
                    guideline = null,
                    valueFormatter = dateLabels,
                    itemPlacer = remember(trend.labelSpacing, trend.labelOffset) {
                        HorizontalAxis.ItemPlacer.aligned(spacing = { trend.labelSpacing }, offset = { trend.labelOffset })
                    },
                ),
                // One x step is one day, whatever the gaps between the entries are.
                getXStep = { _, _, _ -> 1.0 },
            ),
            modelProducer = modelProducer,
            modifier = modifier,
            scrollState = rememberVicoScrollState(scrollEnabled = false),
            zoomState = rememberVicoZoomState(
                zoomEnabled = false,
                initialZoom = Zoom.Content,
                minZoom = Zoom.Content,
                maxZoom = Zoom.Content,
            ),
        )
    }
}
