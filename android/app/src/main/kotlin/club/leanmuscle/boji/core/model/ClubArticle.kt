package club.leanmuscle.boji.core.model

import androidx.annotation.StringRes
import club.leanmuscle.boji.R

/** Color role of an article. The UI layer maps it to a theme color. */
enum class ArticleTone { Workout, Calm, Sleep }

/** Icon role of an article. The UI layer maps it to a drawable. */
enum class ArticleIcon { Strength, Meal, Rest }

data class ArticleSection(@StringRes val title: Int, @StringRes val body: Int)

/**
 * A starter guide article. The UI layer shows [category] and [readingMinutes] with the
 * `article_meta` string, for example 训练起步 · 2 分钟阅读.
 */
data class ClubArticle(
    val id: Int,
    @StringRes val title: Int,
    @StringRes val category: Int,
    val readingMinutes: Int,
    val icon: ArticleIcon,
    val tone: ArticleTone,
    val sections: List<ArticleSection>,
)

/**
 * Starter guide. Structure and IDs match `ClubArticle.all` in ios/Boji/Views/ClubView.swift.
 * The text is in the `article` group of `locales/`. Keys use a name, not the ID, for example
 * `article_first_workout_title`.
 */
object ClubArticles {
    val all: List<ClubArticle> = listOf(
        ClubArticle(
            id = 0,
            title = R.string.article_first_workout_title,
            category = R.string.article_first_workout_category,
            readingMinutes = 2,
            icon = ArticleIcon.Strength,
            tone = ArticleTone.Workout,
            sections = listOf(
                ArticleSection(R.string.article_first_workout_s1_title, R.string.article_first_workout_s1_body),
                ArticleSection(R.string.article_first_workout_s2_title, R.string.article_first_workout_s2_body),
                ArticleSection(R.string.article_first_workout_s3_title, R.string.article_first_workout_s3_body),
            ),
        ),
        ClubArticle(
            id = 1,
            title = R.string.article_eat_well_title,
            category = R.string.article_eat_well_category,
            readingMinutes = 2,
            icon = ArticleIcon.Meal,
            tone = ArticleTone.Calm,
            sections = listOf(
                ArticleSection(R.string.article_eat_well_s1_title, R.string.article_eat_well_s1_body),
                ArticleSection(R.string.article_eat_well_s2_title, R.string.article_eat_well_s2_body),
                ArticleSection(R.string.article_eat_well_s3_title, R.string.article_eat_well_s3_body),
            ),
        ),
        ClubArticle(
            id = 2,
            title = R.string.article_rest_well_title,
            category = R.string.article_rest_well_category,
            readingMinutes = 1,
            icon = ArticleIcon.Rest,
            tone = ArticleTone.Sleep,
            sections = listOf(
                ArticleSection(R.string.article_rest_well_s1_title, R.string.article_rest_well_s1_body),
                ArticleSection(R.string.article_rest_well_s2_title, R.string.article_rest_well_s2_body),
                ArticleSection(R.string.article_rest_well_s3_title, R.string.article_rest_well_s3_body),
            ),
        ),
    )

    fun byId(id: Int): ClubArticle? = all.firstOrNull { it.id == id }
}
