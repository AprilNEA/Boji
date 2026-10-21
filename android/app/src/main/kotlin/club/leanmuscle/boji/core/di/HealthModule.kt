package club.leanmuscle.boji.core.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import club.leanmuscle.boji.core.health.DataStoreHealthSettings
import club.leanmuscle.boji.core.health.HealthConnectDataProvider
import club.leanmuscle.boji.core.health.HealthDataProvider
import club.leanmuscle.boji.core.health.HealthRepository
import club.leanmuscle.boji.core.health.HealthSettings
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope

/** The Health Connect data source. UI tests replace this module with a fake. */
@Module
@InstallIn(SingletonComponent::class)
object HealthProviderModule {
    @Provides
    @Singleton
    fun healthDataProvider(
        @ApplicationContext context: Context,
        @IoDispatcher io: CoroutineDispatcher,
    ): HealthDataProvider = HealthConnectDataProvider(context, io)
}

@Module
@InstallIn(SingletonComponent::class)
object HealthModule {
    /** The connection preference lives in the "settings" file, next to the display mode. */
    @Provides
    @Singleton
    fun healthSettings(@SettingsPreferences dataStore: DataStore<Preferences>): HealthSettings =
        DataStoreHealthSettings(dataStore)

    @Provides
    @Singleton
    fun healthRepository(
        provider: HealthDataProvider,
        settings: HealthSettings,
        @ApplicationScope scope: CoroutineScope,
    ): HealthRepository = HealthRepository(provider, settings, scope)
}
