package club.leanmuscle.boji.core.data

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import java.io.IOException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map

/** Display mode. Stored values match the iOS `appearance` setting. */
enum class Appearance(val storageValue: String) {
    System("system"),
    Light("light"),
    Dark("dark"),
    ;

    companion object {
        fun fromStorage(value: String?): Appearance = entries.firstOrNull { it.storageValue == value } ?: System
    }
}

/** Display preference. It is kept outside state.json, so export and reset do not touch it. */
interface AppearanceSettings {
    val appearance: Flow<Appearance>

    suspend fun setAppearance(value: Appearance)
}

class DataStoreAppearanceSettings(private val dataStore: DataStore<Preferences>) : AppearanceSettings {
    override val appearance: Flow<Appearance> = dataStore.data
        .catch { error -> if (error is IOException) emit(emptyPreferences()) else throw error }
        .map { Appearance.fromStorage(it[KEY]) }

    override suspend fun setAppearance(value: Appearance) {
        dataStore.edit { it[KEY] = value.storageValue }
    }

    private companion object {
        val KEY = stringPreferencesKey("appearance")
    }
}

class InMemoryAppearanceSettings(initial: Appearance = Appearance.System) : AppearanceSettings {
    private val state = MutableStateFlow(initial)
    override val appearance: Flow<Appearance> = state

    override suspend fun setAppearance(value: Appearance) {
        state.value = value
    }
}
