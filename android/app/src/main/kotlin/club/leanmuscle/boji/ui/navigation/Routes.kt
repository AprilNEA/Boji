package club.leanmuscle.boji.ui.navigation

import androidx.navigation3.runtime.NavKey
import kotlinx.serialization.Serializable

// App-level destinations. The training session covers the tab bar, like the iOS full-screen cover.
@Serializable
data object HomeRoute : NavKey

@Serializable
data class SessionRoute(val workoutId: String) : NavKey

// Tab roots.
@Serializable
data object TodayRoute : NavKey

@Serializable
data object TrainingRoute : NavKey

@Serializable
data object ProgressRoute : NavKey

@Serializable
data object ClubRoute : NavKey

// Pushed inside a tab.
@Serializable
data class WorkoutRoute(val workoutId: String) : NavKey

@Serializable
data class ArticleRoute(val articleId: Int) : NavKey

@Serializable
data object SettingsRoute : NavKey

// Member center. Pushed in the tab that opened it: the Club tab or Settings.
@Serializable
data object MembershipRoute : NavKey

@Serializable
data object AuthRoute : NavKey

@Serializable
data object EnrollRoute : NavKey

@Serializable
data object MembershipTermsRoute : NavKey

@Serializable
data object AccountSecurityRoute : NavKey
