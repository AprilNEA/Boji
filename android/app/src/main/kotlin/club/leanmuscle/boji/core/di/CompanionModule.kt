package club.leanmuscle.boji.core.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import club.leanmuscle.boji.core.companion.CompanionSettings
import club.leanmuscle.boji.core.companion.DataStoreCompanionSettings
import club.leanmuscle.boji.core.companion.PlanTitles
import club.leanmuscle.boji.core.companion.WatchLink
import club.leanmuscle.boji.core.companion.WearableWatchLink
import club.leanmuscle.boji.ui.components.titleRes
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object CompanionModule {
    /** The sharing switch lives in the "settings" file, next to the display mode. */
    @Provides
    @Singleton
    fun companionSettings(@SettingsPreferences dataStore: DataStore<Preferences>): CompanionSettings =
        DataStoreCompanionSettings(dataStore)

    /** In the app language, the same title that Today shows. */
    @Provides
    fun planTitles(@ApplicationContext context: Context): PlanTitles = PlanTitles { context.getString(it.titleRes) }
}

/** The Wear OS Data Layer. UI tests replace this module, because emulators have no paired watch. */
@Module
@InstallIn(SingletonComponent::class)
object WatchLinkModule {
    @Provides
    @Singleton
    fun watchLink(@ApplicationContext context: Context): WatchLink = WearableWatchLink(context)
}
