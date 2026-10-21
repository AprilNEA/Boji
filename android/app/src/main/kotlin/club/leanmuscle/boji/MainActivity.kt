package club.leanmuscle.boji

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import club.leanmuscle.boji.core.companion.CompanionRoute
import club.leanmuscle.boji.core.data.Appearance
import club.leanmuscle.boji.ui.AppViewModel
import club.leanmuscle.boji.ui.BojiApp
import club.leanmuscle.boji.ui.theme.BojiTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private val appViewModel: AppViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        // Android 15+ enforces edge-to-edge for apps that target API 35 or higher.
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        // After a configuration change or process restore, the tab is already part of the saved state.
        if (savedInstanceState == null) openRoute(intent)
        setContent {
            val appearance by appViewModel.appearance.collectAsStateWithLifecycle()
            val systemDark = isSystemInDarkTheme()
            val dark = when (appearance) {
                Appearance.Light -> false
                Appearance.Dark -> true
                Appearance.System, null -> systemDark
            }
            // The app mode can differ from the system mode, so system bar icons follow the app.
            DisposableEffect(dark) {
                enableEdgeToEdge(
                    statusBarStyle = SystemBarStyle.auto(Color.TRANSPARENT, Color.TRANSPARENT) { dark },
                    navigationBarStyle = SystemBarStyle.auto(LIGHT_SCRIM, DARK_SCRIM) { dark },
                )
                onDispose {}
            }
            BojiTheme(darkTheme = dark) {
                // Wait for the stored mode, so the first frame does not flash the other mode.
                // Test tags become resource IDs, so UiAutomator journeys in :baselineprofile can find them.
                if (appearance != null) BojiApp(modifier = Modifier.semantics { testTagsAsResourceId = true }, viewModel = appViewModel)
            }
        }
    }

    /** The widget starts this activity with CLEAR_TOP and SINGLE_TOP, so a running instance gets its route here. */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        openRoute(intent)
    }

    private fun openRoute(intent: Intent?) {
        CompanionRoute.parse(intent?.dataString)?.let(appViewModel::openRoute)
    }

    private companion object {
        // Scrims for three-button navigation, same values as the AndroidX defaults.
        val LIGHT_SCRIM = Color.argb(0xe6, 0xFF, 0xFF, 0xFF)
        val DARK_SCRIM = Color.argb(0x80, 0x1b, 0x1b, 0x1b)
    }
}
