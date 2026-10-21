package club.leanmuscle.boji.wear.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import club.leanmuscle.boji.wear.WatchApplication
import club.leanmuscle.boji.wear.data.PhoneLink
import club.leanmuscle.boji.wear.data.WatchCompanionRepository
import club.leanmuscle.boji.wear.data.WatchState
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class WatchViewModel(
    private val repository: WatchCompanionRepository,
    private val link: PhoneLink,
) : ViewModel() {
    val state: StateFlow<WatchState> = repository.state

    private var foreground: Job? = null

    /** The screen appeared: ask the phone for a snapshot, and follow the connection while visible. */
    fun onForeground() {
        if (foreground?.isActive == true) return
        foreground = viewModelScope.launch {
            launch { repository.connect() }
            link.changes.collect { repository.updateReachability() }
        }
    }

    fun onBackground() {
        foreground?.cancel()
        foreground = null
    }

    fun refresh() {
        viewModelScope.launch { repository.refresh() }
    }

    companion object {
        val Factory = viewModelFactory {
            initializer {
                val app = this[APPLICATION_KEY] as WatchApplication
                WatchViewModel(app.companion, app.phoneLink)
            }
        }
    }
}
