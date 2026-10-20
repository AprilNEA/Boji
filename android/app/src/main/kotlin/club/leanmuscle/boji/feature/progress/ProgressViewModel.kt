package club.leanmuscle.boji.feature.progress

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import club.leanmuscle.boji.core.data.BojiStore
import club.leanmuscle.boji.core.model.BojiSnapshot
import club.leanmuscle.boji.feature.entry.DailyEntryActions
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class ProgressViewModel @Inject constructor(private val store: BojiStore) : ViewModel(), DailyEntryActions {
    val snapshot: StateFlow<BojiSnapshot?> = store.snapshot

    fun deleteBodyEntry(id: String) {
        viewModelScope.launch { store.deleteBodyEntry(id) }
    }

    override fun addWater(ml: Int) {
        viewModelScope.launch { store.addWater(ml) }
    }

    override fun setSleep(hours: Double) {
        viewModelScope.launch { store.setSleep(hours) }
    }

    override fun addBodyEntry(weight: Double, waist: Double) {
        viewModelScope.launch { store.addBodyEntry(weight, waist) }
    }
}
