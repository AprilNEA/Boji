package club.leanmuscle.boji.core.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.core.DataStoreFactory
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStoreFile
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.data.AppearanceSettings
import club.leanmuscle.boji.core.data.BojiStateSerializer
import club.leanmuscle.boji.core.data.BojiStore
import club.leanmuscle.boji.core.data.DataStoreAppearanceSettings
import club.leanmuscle.boji.core.model.BojiState
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import java.io.File
import javax.inject.Qualifier
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope

/** Location of state.json. */
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class StateFile

/** Preferences file "settings", which holds the display mode. */
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class SettingsPreferences

/** File locations. UI tests replace this module to use a new directory for every test. */
@Module
@InstallIn(SingletonComponent::class)
object DataFileModule {
    @Provides
    @StateFile
    fun stateFile(@ApplicationContext context: Context): File = File(context.filesDir, BojiStore.STATE_FILE_NAME)

    @Provides
    @SettingsPreferences
    fun settingsFile(@ApplicationContext context: Context): File = context.preferencesDataStoreFile("settings")
}

@Module
@InstallIn(SingletonComponent::class)
object DataModule {
    @Provides
    @Singleton
    fun stateDataStore(
        @ApplicationContext context: Context,
        @StateFile file: File,
        @ApplicationScope scope: CoroutineScope,
        @IoDispatcher io: CoroutineDispatcher,
    ): DataStore<BojiState> = DataStoreFactory.create(
        serializer = BojiStateSerializer(defaultDisplayName(context)),
        scope = CoroutineScope(scope.coroutineContext + io),
        produceFile = { file },
    )

    @Provides
    @Singleton
    fun bojiStore(
        @ApplicationContext context: Context,
        dataStore: DataStore<BojiState>,
        @StateFile file: File,
        @ApplicationScope scope: CoroutineScope,
    ): BojiStore = BojiStore(dataStore, file, scope, defaultDisplayName(context))

    /** Reads the string on every call, so a new state uses the language of that moment. */
    private fun defaultDisplayName(context: Context): () -> String =
        { context.getString(R.string.default_display_name) }

    @Provides
    @Singleton
    @SettingsPreferences
    fun settingsDataStore(
        @SettingsPreferences file: File,
        @ApplicationScope scope: CoroutineScope,
        @IoDispatcher io: CoroutineDispatcher,
    ): DataStore<Preferences> = PreferenceDataStoreFactory.create(
        scope = CoroutineScope(scope.coroutineContext + io),
        produceFile = { file },
    )

    @Provides
    @Singleton
    fun appearanceSettings(@SettingsPreferences dataStore: DataStore<Preferences>): AppearanceSettings =
        DataStoreAppearanceSettings(dataStore)
}
