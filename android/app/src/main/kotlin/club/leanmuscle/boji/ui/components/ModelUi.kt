package club.leanmuscle.boji.ui.components

import androidx.annotation.DrawableRes
import androidx.annotation.StringRes
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.material3.MaterialTheme
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.model.ArticleIcon
import club.leanmuscle.boji.core.model.ArticleTone
import club.leanmuscle.boji.core.model.ExerciseIcon
import club.leanmuscle.boji.core.model.PlanKind
import club.leanmuscle.boji.core.model.StorageError
import club.leanmuscle.boji.ui.theme.BojiThemeColors
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

/** The app text is Chinese only, so numbers and dates use zh-CN on every device, as on iOS. */
val BojiLocale: Locale = Locale.SIMPLIFIED_CHINESE

private val longDayFormatter = DateTimeFormatter.ofPattern("M月d日 EEEE", BojiLocale)
private val narrowWeekdayFormatter = DateTimeFormatter.ofPattern("EEEEE", BojiLocale)
private val mediumDateFormatter = DateTimeFormatter.ofPattern("y年M月d日", BojiLocale)

fun formatLongDay(day: LocalDate): String = longDayFormatter.format(day)

fun formatNarrowWeekday(day: LocalDate): String = narrowWeekdayFormatter.format(day)

fun formatMediumDate(day: LocalDate): String = mediumDateFormatter.format(day)

fun formatOneDecimal(value: Double): String = String.format(BojiLocale, "%.1f", value)

/** Accepts both `.` and `,` as decimal separator. Returns null for anything else. */
fun parseDecimal(text: String): Double? = text.trim().replace(',', '.').toDoubleOrNull()

@get:StringRes
val PlanKind.titleRes: Int
    get() = when (this) {
        PlanKind.Home -> R.string.plan_home_title
        PlanKind.Gym -> R.string.plan_gym_title
    }

@get:StringRes
val PlanKind.subtitleRes: Int
    get() = when (this) {
        PlanKind.Home -> R.string.plan_home_subtitle
        PlanKind.Gym -> R.string.plan_gym_subtitle
    }

@get:DrawableRes
val PlanKind.iconRes: Int
    get() = when (this) {
        PlanKind.Home -> R.drawable.ic_home
        PlanKind.Gym -> R.drawable.ic_fitness_center
    }

@get:DrawableRes
val ExerciseIcon.iconRes: Int
    get() = when (this) {
        ExerciseIcon.Strength, ExerciseIcon.Dumbbell -> R.drawable.ic_fitness_center
        ExerciseIcon.Walk -> R.drawable.ic_directions_walk
        ExerciseIcon.Core, ExerciseIcon.Flexibility -> R.drawable.ic_sports_gymnastics
        ExerciseIcon.Cooldown -> R.drawable.ic_self_improvement
        ExerciseIcon.Row -> R.drawable.ic_swap_horiz
        ExerciseIcon.PullDown -> R.drawable.ic_arrow_downward
        ExerciseIcon.Lunge -> R.drawable.ic_directions_run
        ExerciseIcon.ArmsOpen -> R.drawable.ic_accessibility_new
    }

@get:DrawableRes
val ArticleIcon.iconRes: Int
    get() = when (this) {
        ArticleIcon.Strength -> R.drawable.ic_fitness_center
        ArticleIcon.Meal -> R.drawable.ic_restaurant
        ArticleIcon.Rest -> R.drawable.ic_bedtime
    }

val ArticleTone.color: Color
    @Composable
    @ReadOnlyComposable
    get() = when (this) {
        ArticleTone.Workout -> MaterialTheme.colorScheme.primary
        ArticleTone.Calm -> BojiThemeColors.current.calm
        ArticleTone.Sleep -> BojiThemeColors.current.sleep
    }

@Composable
fun storageErrorMessage(error: StorageError): String {
    val detail = error.detail?.takeIf { it.isNotBlank() } ?: stringResource(R.string.storage_unknown_error)
    return when (error) {
        is StorageError.ReadFailed -> stringResource(R.string.storage_read_failed, detail)
        is StorageError.WriteFailed -> stringResource(R.string.storage_write_failed, detail)
        is StorageError.DeleteFailed -> stringResource(R.string.storage_delete_failed, detail)
    }
}
