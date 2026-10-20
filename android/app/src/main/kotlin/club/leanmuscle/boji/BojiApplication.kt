package club.leanmuscle.boji

import android.app.Application
import android.content.Context
import androidx.datastore.preferences.preferencesDataStore
import club.leanmuscle.boji.core.data.AppearanceSettings
import club.leanmuscle.boji.core.data.BojiStore
import club.leanmuscle.boji.core.data.DataStoreAppearanceSettings
import club.leanmuscle.boji.core.diagnostics.CrashReporting
import java.io.File
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob

private val Context.settingsDataStore by preferencesDataStore(name = "settings")

/** App-wide objects. Manual injection keeps the dependency graph small and explicit. */
class AppContainer(context: Context) {
    private val appScope = CoroutineScope(SupervisorJob())

    val store: BojiStore = BojiStore.persistent(File(context.filesDir, "state.json"), appScope)

    val appearance: AppearanceSettings = DataStoreAppearanceSettings(context.settingsDataStore)
}

class BojiApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        // Before super.onCreate(), so that Sentry also reports failures during app startup.
        CrashReporting.start(this)
        super.onCreate()
        container = AppContainer(this)
    }
}
