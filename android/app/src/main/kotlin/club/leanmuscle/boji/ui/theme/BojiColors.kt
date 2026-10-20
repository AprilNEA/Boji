package club.leanmuscle.boji.ui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

/**
 * Colors that Material 3 roles do not cover. Habit colors follow the iOS roles (accent, blue,
 * purple, green) but use darker tones in light mode, so text and icons on cards reach 4.5:1.
 */
@Immutable
data class BojiColors(
    val page: Color,
    val card: Color,
    val workoutCard: Color,
    val water: Color,
    val sleep: Color,
    val calm: Color,
    val error: Color,
    val errorContainer: Color,
)

internal val LightBojiColors = BojiColors(
    page = Color(0xFFF7F5F0),
    card = Color(0xFFFFFFFF),
    workoutCard = Color(0xFFF2DBC4),
    water = Color(0xFF1F5FA8),
    sleep = Color(0xFF7A4FA3),
    calm = Color(0xFF26664F),
    error = Color(0xFFBA1A1A),
    errorContainer = Color(0xFFFFDAD6),
)

internal val DarkBojiColors = BojiColors(
    page = Color(0xFF131312),
    card = Color(0xFF222220),
    workoutCard = Color(0xFF47261A),
    water = Color(0xFFA6C8FF),
    sleep = Color(0xFFDDB8FF),
    calm = Color(0xFF8CD5BC),
    error = Color(0xFFFFB4AB),
    errorContainer = Color(0xFF5C1A14),
)

/** Neutral containers for bars, sheets and dialogs, so they match the warm gray page. */
internal data class NeutralSurfaces(
    val low: Color,
    val container: Color,
    val high: Color,
    val highest: Color,
)

internal val LightNeutralSurfaces = NeutralSurfaces(
    low = Color(0xFFF2EFE9),
    container = Color(0xFFECE8E1),
    high = Color(0xFFE6E2DA),
    highest = Color(0xFFE0DCD4),
)

internal val DarkNeutralSurfaces = NeutralSurfaces(
    low = Color(0xFF1A1A19),
    container = Color(0xFF1E1E1D),
    high = Color(0xFF282827),
    highest = Color(0xFF333331),
)

val LocalBojiColors = staticCompositionLocalOf { LightBojiColors }
