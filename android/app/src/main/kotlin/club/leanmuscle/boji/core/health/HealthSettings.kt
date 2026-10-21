package club.leanmuscle.boji.core.health

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import java.io.IOException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map

/**
 * Whether the user connected Health Connect in Boji, like `Boji.HealthDataStore.isEnabled` on iOS.
 * It is kept outside state.json, so export does not include it. It does not reflect the system
 * grants: [HealthRepository] reads those before every query.
 */
interface HealthSettings {
    val enabled: Flow<Boolean>

    suspend fun setEnabled(value: Boolean)
}

class DataStoreHealthSettings(private val dataStore: DataStore<Preferences>) : HealthSettings {
    override val enabled: Flow<Boolean> = dataStore.data
        .catch { error -> if (error is IOException) emit(emptyPreferences()) else throw error }
        .map { it[KEY] ?: false }

    override suspend fun setEnabled(value: Boolean) {
        dataStore.edit { if (value) it[KEY] = true else it.remove(KEY) }
    }

    private companion object {
        val KEY = booleanPreferencesKey("health_connect_enabled")
    }
}
