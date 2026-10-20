package club.leanmuscle.boji.ui.components

import android.text.format.DateFormat
import androidx.annotation.DrawableRes
import androidx.annotation.StringRes
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.material3.MaterialTheme
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.model.ArticleIcon
import club.leanmuscle.boji.core.model.ArticleTone
import club.leanmuscle.boji.core.model.ClubArticle
import club.leanmuscle.boji.core.model.CourseLevel
import club.leanmuscle.boji.core.model.ExerciseIcon
import club.leanmuscle.boji.core.model.PlanKind
import club.leanmuscle.boji.core.model.Reps
import club.leanmuscle.boji.core.model.StorageError
import club.leanmuscle.boji.ui.theme.BojiThemeColors
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * The language of the displayed text. Format dates and numbers with it.
 *
 * `R.string.locale_tag` is generated into the same `strings_shared.xml` as the shared text, so
 * Android resolves both from the same `values*` directory. When the device language has no
 * translation, the text, the dates and the numbers all use the fallback language.
 */
val textLocale: Locale
    @Composable
    @ReadOnlyComposable
    get() = Locale.forLanguageTag(stringResource(R.string.locale_tag))

/** Month, day and weekday, such as 10月20日星期二. */
@Composable
@ReadOnlyComposable
fun formatLongDay(day: LocalDate): String = formatSkeleton(day, "MMMMdEEEE")

@Composable
@ReadOnlyComposable
fun formatNarrowWeekday(day: LocalDate): String =
    DateTimeFormatter.ofPattern("EEEEE", textLocale).format(day)

/** Year, month and day, such as 2026年10月20日. */
@Composable
@ReadOnlyComposable
fun formatMediumDate(day: LocalDate): String = formatSkeleton(day, "yMMMd")

/** Formats a date with the pattern that [textLocale] uses for a CLDR skeleton. */
@Composable
@ReadOnlyComposable
private fun formatSkeleton(day: LocalDate, skeleton: String): String {
    val locale = textLocale
    val pattern = DateFormat.getBestDateTimePattern(locale, skeleton)
    return DateTimeFormatter.ofPattern(pattern, locale).format(day)
}

@Composable
@ReadOnlyComposable
fun formatOneDecimal(value: Double): String = String.format(textLocale, "%.1f", value)

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

@get:StringRes
val CourseLevel.titleRes: Int
    get() = when (this) {
        CourseLevel.Beginner -> R.string.course_level_beginner
        CourseLevel.Intermediate -> R.string.course_level_intermediate
        CourseLevel.Gentle -> R.string.course_level_gentle
    }

/** The amount of one set, such as 8～10 次 or 每侧 20 秒. */
@Composable
@ReadOnlyComposable
fun repsText(reps: Reps): String = when (reps) {
    is Reps.Count -> pluralStringResource(R.plurals.exercise_reps_count, reps.count, reps.count)
    is Reps.CountRange -> stringResource(R.string.exercise_reps_count_range, reps.min, reps.max)
    is Reps.CountPerSide -> pluralStringResource(R.plurals.exercise_reps_count_per_side, reps.count, reps.count)
    is Reps.Seconds -> pluralStringResource(R.plurals.exercise_reps_seconds, reps.seconds, reps.seconds)
    is Reps.SecondsRange -> stringResource(R.string.exercise_reps_seconds_range, reps.min, reps.max)
    is Reps.SecondsPerSide ->
        pluralStringResource(R.plurals.exercise_reps_seconds_per_side, reps.seconds, reps.seconds)
}

/** Category and reading time of an article, such as 训练起步 · 2 分钟阅读. */
@Composable
@ReadOnlyComposable
fun articleMeta(article: ClubArticle): String =
    stringResource(R.string.article_meta, stringResource(article.category), article.readingMinutes)

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
