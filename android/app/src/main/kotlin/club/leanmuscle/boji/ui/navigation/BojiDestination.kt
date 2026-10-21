package club.leanmuscle.boji.ui.navigation

import androidx.annotation.DrawableRes
import androidx.annotation.StringRes
import androidx.navigation3.runtime.NavKey
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.companion.CompanionRoute

/** Top-level destinations. The order matches the iOS `TabView` in `ios/Boji/BojiApp.swift`. */
enum class BojiDestination(
    @param:StringRes val label: Int,
    @param:DrawableRes val icon: Int,
    @param:DrawableRes val selectedIcon: Int,
) {
    Today(R.string.tab_today, R.drawable.ic_tab_today, R.drawable.ic_tab_today_selected),
    Training(R.string.tab_training, R.drawable.ic_tab_training, R.drawable.ic_tab_training_selected),
    Progress(R.string.tab_progress, R.drawable.ic_tab_progress, R.drawable.ic_tab_progress_selected),
    Club(R.string.tab_club, R.drawable.ic_tab_club, R.drawable.ic_tab_club_selected),
    ;

    val tabTag: String get() = "tab_$name"
    val screenTag: String get() = "screen_$name"

    /** First entry of this tab's back stack. */
    val root: NavKey
        get() = when (this) {
            Today -> TodayRoute
            Training -> TrainingRoute
            Progress -> ProgressRoute
            Club -> ClubRoute
        }

    companion object {
        val Start = Today
    }
}

/** The tab for a widget route. Same tab order as `CompanionRoute.tabIndex` on iOS. */
val CompanionRoute.destination: BojiDestination
    get() = when (this) {
        CompanionRoute.Today -> BojiDestination.Today
        CompanionRoute.Training -> BojiDestination.Training
        CompanionRoute.Progress -> BojiDestination.Progress
        CompanionRoute.Club -> BojiDestination.Club
    }
