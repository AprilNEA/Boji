package club.leanmuscle.boji.feature.widget

import android.content.Context
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.content.pm.PackageInfoCompat
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.updateAll
import club.leanmuscle.boji.core.di.ApplicationScope
import club.leanmuscle.boji.core.di.SettingsPreferences
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.IOException
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

/**
 * Keeps placed widgets current while the app process runs, like the `WidgetCenter` reload in
 * the iOS `CompanionSharingStore`. [BojiApplication][club.leanmuscle.boji.BojiApplication] starts it.
 */
@Singleton
class DailyWidgetSync @Inject constructor(
    @param:ApplicationContext private val context: Context,
    private val source: DailyWidgetSource,
    @param:SettingsPreferences private val preferences: DataStore<Preferences>,
    @param:ApplicationScope private val scope: CoroutineScope,
) {
    fun start() {
        scope.launch {
            // The first value is what the widget already shows. updateAll does nothing without placed widgets.
            source.state.drop(1).collectLatest { DailyWidget().updateAll(context) }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            scope.launch { publishPreview() }
        }
    }

    /**
     * Publishes the generated picker preview once per app version and language. The system
     * allows about two calls per hour, so a rate-limited call is retried on a later start.
     */
    @RequiresApi(Build.VERSION_CODES.VANILLA_ICE_CREAM)
    private suspend fun publishPreview() {
        val version = PackageInfoCompat.getLongVersionCode(context.packageManager.getPackageInfo(context.packageName, 0))
        val key = "$version/${Locale.getDefault().toLanguageTag()}"
        val published = try {
            preferences.data.first()[PREVIEW_KEY]
        } catch (_: IOException) {
            null
        }
        if (published == key) return
        val result = GlanceAppWidgetManager(context).setWidgetPreviews(DailyWidgetReceiver::class)
        if (result == GlanceAppWidgetManager.SET_WIDGET_PREVIEWS_RESULT_SUCCESS) {
            try {
                preferences.edit { it[PREVIEW_KEY] = key }
            } catch (error: IOException) {
                Log.w(TAG, "Cannot save the widget preview version", error)
            }
        }
    }

    private companion object {
        const val TAG = "DailyWidgetSync"
        val PREVIEW_KEY = stringPreferencesKey("widget_preview_published")
    }
}
