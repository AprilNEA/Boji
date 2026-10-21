package club.leanmuscle.boji.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import club.leanmuscle.boji.core.companion.CompanionRoute
import club.leanmuscle.boji.core.data.Appearance
import club.leanmuscle.boji.core.data.AppearanceSettings
import club.leanmuscle.boji.core.data.BojiStore
import club.leanmuscle.boji.core.health.HealthRepository
import club.leanmuscle.boji.core.model.BojiSnapshot
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

/** State of the app shell: the loaded records, the display mode and foreground refreshes. Scoped to the activity. */
@HiltViewModel
class AppViewModel @Inject constructor(
    private val store: BojiStore,
    appearanceSettings: AppearanceSettings,
    private val health: HealthRepository,
) : ViewModel() {
    /** Null until state.json has been read. */
    val snapshot: StateFlow<BojiSnapshot?> = store.snapshot

    /** Null until the stored mode has been read, so the first frame uses the right mode. */
    val appearance: StateFlow<Appearance?> = appearanceSettings.appearance
        .stateIn(viewModelScope, SharingStarted.Eagerly, null)

    private val pendingRoute = MutableStateFlow<CompanionRoute?>(null)

    /** A tab that the widget asked for. The tabs show it once and then call [routeOpened]. */
    val requestedRoute: StateFlow<CompanionRoute?> = pendingRoute.asStateFlow()

    /** Called by MainActivity for a `boji://` intent from the widget. */
    fun openRoute(route: CompanionRoute) {
        pendingRoute.value = route
    }

    fun routeOpened() {
        pendingRoute.value = null
    }

    /** Moves "today" forward after midnight. The shell calls it while the app is visible. */
    fun refreshDay() = store.refreshDay()

    /** Reads Health Connect again if the user connected it. The shell calls it on every resume. */
    fun refreshHealth() {
        viewModelScope.launch { health.refresh() }
    }
}
