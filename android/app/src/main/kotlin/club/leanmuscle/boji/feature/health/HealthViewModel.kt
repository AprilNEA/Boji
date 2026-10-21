package club.leanmuscle.boji.feature.health

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import club.leanmuscle.boji.core.data.BojiStore
import club.leanmuscle.boji.core.health.HealthRepository
import club.leanmuscle.boji.core.health.HealthState
import club.leanmuscle.boji.core.model.BojiSnapshot
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

/** Health Connect page and summary card. Both read the same [HealthRepository]. */
@HiltViewModel
class HealthViewModel @Inject constructor(
    private val repository: HealthRepository,
    store: BojiStore,
) : ViewModel() {
    val health: StateFlow<HealthState> = repository.state

    /** Supplies today and the time zone, which move forward at midnight like the rest of the app. */
    val snapshot: StateFlow<BojiSnapshot?> = store.snapshot

    /** Launch only from a user tap, as on iOS. */
    val permissionContract = repository.permissionContract()

    fun onPermissionResult(granted: Set<String>) {
        viewModelScope.launch { repository.onPermissionResult(granted) }
    }

    fun refresh() {
        viewModelScope.launch { repository.refresh() }
    }

    fun disconnect() {
        viewModelScope.launch { repository.disconnect() }
    }

    fun clearError() = repository.clearError()
}
