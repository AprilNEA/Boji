package club.leanmuscle.boji.feature.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import club.leanmuscle.boji.core.data.BojiStore
import club.leanmuscle.boji.core.model.PlanKind
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

@HiltViewModel
class WelcomeViewModel @Inject constructor(private val store: BojiStore) : ViewModel() {
    /** Saves the plan and ends onboarding. The shell then shows the tabs. */
    fun start(plan: PlanKind) {
        viewModelScope.launch { store.completeOnboarding(plan) }
    }
}
