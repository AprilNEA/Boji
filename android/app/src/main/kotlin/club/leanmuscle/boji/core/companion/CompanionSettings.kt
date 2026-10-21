package club.leanmuscle.boji.core.companion

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import java.io.IOException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map

/**
 * Whether the user shares today's check-ins with the home screen widget, like
 * `CompanionSharingStore.isEnabled` on iOS. Off by default. It is kept outside state.json, so
 * export does not include it, and deleting all data turns it off.
 */
interface CompanionSettings {
    val sharingEnabled: Flow<Boolean>
    suspend fun setSharingEnabled(value: Boolean)
}

class DataStoreCompanionSettings(private val dataStore: DataStore<Preferences>) : CompanionSettings {
    override val sharingEnabled: Flow<Boolean> = dataStore.data
        .catch { error -> if (error is IOException) emit(emptyPreferences()) else throw error }
        .map { it[KEY] ?: false }
        .distinctUntilChanged()

    override suspend fun setSharingEnabled(value: Boolean) {
        dataStore.edit { if (value) it[KEY] = true else it.remove(KEY) }
    }

    private companion object {
        // Same name as the iOS UserDefaults key.
        val KEY = booleanPreferencesKey("companionSharingEnabled")
    }
}
