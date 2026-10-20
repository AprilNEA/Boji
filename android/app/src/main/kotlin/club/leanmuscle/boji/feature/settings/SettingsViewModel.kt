package club.leanmuscle.boji.feature.settings

import android.content.ContentResolver
import android.net.Uri
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import club.leanmuscle.boji.core.data.Appearance
import club.leanmuscle.boji.core.data.AppearanceSettings
import club.leanmuscle.boji.core.data.BojiStore
import club.leanmuscle.boji.core.di.IoDispatcher
import club.leanmuscle.boji.core.membership.AccountState
import club.leanmuscle.boji.core.membership.MembershipRepository
import club.leanmuscle.boji.core.model.BojiSnapshot
import club.leanmuscle.boji.core.model.PlanKind
import dagger.hilt.android.lifecycle.HiltViewModel
import java.io.IOException
import javax.inject.Inject
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/** Result of one export. The screen shows a snackbar or a dialog, then calls [SettingsViewModel.clearExportResult]. */
sealed interface ExportResult {
    data object Saved : ExportResult

    /** [detail] is the system message, or null when the system gave none. */
    data class Failed(val detail: String?) : ExportResult
}

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val store: BojiStore,
    private val appearanceSettings: AppearanceSettings,
    private val membership: MembershipRepository,
    private val contentResolver: ContentResolver,
    @param:IoDispatcher private val io: CoroutineDispatcher,
) : ViewModel() {
    val snapshot: StateFlow<BojiSnapshot?> = store.snapshot

    val appearance: StateFlow<Appearance> = appearanceSettings.appearance
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), Appearance.System)

    /** The signed-in email for the 俱乐部账号 row, or null when nobody is signed in. */
    val accountEmail: StateFlow<String?> = membership.state
        .map { (it as? AccountState.SignedIn)?.account?.email }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    /**
     * Text of the nickname field. The field reads this synchronous value, not the stored one,
     * because a field that waits for a disk write loses the cursor position.
     */
    var nickname by mutableStateOf(store.snapshot.value?.state?.displayName.orEmpty())
        private set

    private val _exportResult = MutableStateFlow<ExportResult?>(null)
    val exportResult: StateFlow<ExportResult?> = _exportResult.asStateFlow()

    fun updateNickname(value: String) {
        nickname = value
        viewModelScope.launch { store.setDisplayName(value) }
    }

    fun setSelectedPlan(plan: PlanKind) {
        viewModelScope.launch { store.setSelectedPlan(plan) }
    }

    fun setAppearance(value: Appearance) {
        viewModelScope.launch { appearanceSettings.setAppearance(value) }
    }

    /** Writes the current state.json content to [uri], which the system file picker returned. */
    fun export(uri: Uri) {
        val json = store.exportJson() ?: return
        viewModelScope.launch {
            _exportResult.value = withContext(io) {
                try {
                    val stream = contentResolver.openOutputStream(uri, "wt") ?: throw IOException()
                    stream.use { it.write(json.toByteArray(Charsets.UTF_8)) }
                    ExportResult.Saved
                } catch (error: IOException) {
                    ExportResult.Failed(error.message)
                } catch (error: SecurityException) {
                    ExportResult.Failed(error.message)
                }
            }
        }
    }

    fun clearExportResult() {
        _exportResult.value = null
    }

    fun resetAll() {
        viewModelScope.launch {
            // As on iOS: the session and the card cache go first, then the records.
            // This does not delete the account or the card on the server.
            membership.clearLocalData()
            store.resetAll()
            nickname = store.snapshot.value?.state?.displayName.orEmpty()
        }
    }
}
