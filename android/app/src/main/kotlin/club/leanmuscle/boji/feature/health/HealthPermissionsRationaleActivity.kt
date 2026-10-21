package club.leanmuscle.boji.feature.health

import android.content.ActivityNotFoundException
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.core.net.toUri
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.data.Appearance
import club.leanmuscle.boji.core.data.AppearanceSettings
import club.leanmuscle.boji.ui.components.BojiCard
import club.leanmuscle.boji.ui.components.BojiScaffold
import club.leanmuscle.boji.ui.components.PageColumn
import club.leanmuscle.boji.ui.components.PrimaryButton
import club.leanmuscle.boji.ui.theme.BojiTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

/**
 * Explains how Boji uses health data. Health Connect requires this screen: its permission dialog
 * links here on Android 13 and lower (ACTION_SHOW_PERMISSIONS_RATIONALE), and its app settings link
 * here on Android 14 and higher (the ViewPermissionUsageActivity alias in the manifest).
 */
@AndroidEntryPoint
class HealthPermissionsRationaleActivity : ComponentActivity() {
    @Inject
    lateinit var appearanceSettings: AppearanceSettings

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        val policyUrl = getString(R.string.health_privacy_url)
        setContent {
            val appearance by appearanceSettings.appearance.collectAsStateWithLifecycle(initialValue = null)
            val systemDark = isSystemInDarkTheme()
            val dark = when (appearance) {
                Appearance.Light -> false
                Appearance.Dark -> true
                Appearance.System, null -> systemDark
            }
            BojiTheme(darkTheme = dark) {
                // Wait for the stored mode, like MainActivity, so the first frame uses the right mode.
                if (appearance != null) {
                    HealthRationaleScreen(onBack = ::finish, onOpenPolicy = { openPolicy(policyUrl) })
                }
            }
        }
    }

    private fun openPolicy(url: String) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, url.toUri()))
        } catch (_: ActivityNotFoundException) {
            // No browser. The screen already lists what Boji does with the data.
        }
    }
}

@Composable
fun HealthRationaleScreen(onBack: () -> Unit, onOpenPolicy: () -> Unit, modifier: Modifier = Modifier) {
    BojiScaffold(
        title = stringResource(R.string.health_rationale_title),
        modifier = modifier.testTag("screen_HealthRationale"),
        onBack = onBack,
    ) { padding ->
        PageColumn(modifier = Modifier.padding(padding), spacing = 20.dp) {
            BojiCard {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    listOf(
                        R.string.health_rationale_read,
                        R.string.health_rationale_use,
                        R.string.health_rationale_storage,
                        R.string.health_share_revoke,
                    ).forEach { text ->
                        Text(stringResource(text), style = MaterialTheme.typography.bodyLarge)
                    }
                }
            }
            PrimaryButton(
                text = stringResource(R.string.health_rationale_policy),
                icon = R.drawable.ic_arrow_outward,
                onClick = onOpenPolicy,
                modifier = Modifier.testTag("health_policy"),
            )
        }
    }
}
