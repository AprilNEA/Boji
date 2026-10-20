package club.leanmuscle.boji

import android.graphics.Color
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.lifecycleScope
import club.leanmuscle.boji.core.data.Appearance
import club.leanmuscle.boji.ui.BojiApp
import club.leanmuscle.boji.ui.theme.BojiTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Android 15+ enforces edge-to-edge for apps that target API 35 or higher.
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        val container = (application as BojiApplication).container
        setContent {
            val appearance by container.appearance.appearance.collectAsStateWithLifecycle(initialValue = null)
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
                val loaded = appearance ?: return@BojiTheme
                BojiApp(
                    store = container.store,
                    appearance = loaded,
                    onAppearanceChange = { value -> lifecycleScope.launch { container.appearance.setAppearance(value) } },
                )
            }
        }
    }

    private companion object {
        // Scrims for three-button navigation, same values as the AndroidX defaults.
        val LIGHT_SCRIM = Color.argb(0xe6, 0xFF, 0xFF, 0xFF)
        val DARK_SCRIM = Color.argb(0x80, 0x1b, 0x1b, 0x1b)
    }
}
