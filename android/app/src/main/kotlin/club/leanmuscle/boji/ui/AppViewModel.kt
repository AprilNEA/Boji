package club.leanmuscle.boji.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import club.leanmuscle.boji.core.data.Appearance
import club.leanmuscle.boji.core.data.AppearanceSettings
import club.leanmuscle.boji.core.data.BojiStore
import club.leanmuscle.boji.core.model.BojiSnapshot
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn

/** State of the app shell: the loaded records and the display mode. Scoped to the activity. */
@HiltViewModel
class AppViewModel @Inject constructor(
    private val store: BojiStore,
    appearanceSettings: AppearanceSettings,
) : ViewModel() {
    /** Null until state.json has been read. */
    val snapshot: StateFlow<BojiSnapshot?> = store.snapshot

    /** Null until the stored mode has been read, so the first frame uses the right mode. */
    val appearance: StateFlow<Appearance?> = appearanceSettings.appearance
        .stateIn(viewModelScope, SharingStarted.Eagerly, null)

    /** Moves "today" forward after midnight. The shell calls it while the app is visible. */
    fun refreshDay() = store.refreshDay()
}
