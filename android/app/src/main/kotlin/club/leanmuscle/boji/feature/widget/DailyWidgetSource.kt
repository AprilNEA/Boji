package club.leanmuscle.boji.feature.widget

import club.leanmuscle.boji.core.companion.CompanionSettings
import club.leanmuscle.boji.core.companion.DailyWidgetState
import club.leanmuscle.boji.core.data.BojiStore
import dagger.hilt.EntryPoint
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.filterNotNull

/**
 * The widget's view of the app data. The widget runs in the app process, so it reads the same
 * [BojiStore] as the screens, and a change in the app reaches it without a shared file.
 */
@Singleton
class DailyWidgetSource @Inject constructor(
    private val store: BojiStore,
    settings: CompanionSettings,
) {
    /** Emits after state.json is read. Repeats only when the widget content changes. */
    val state: Flow<DailyWidgetState> =
        combine(store.snapshot, settings.sharingEnabled) { snapshot, enabled -> DailyWidgetState.of(snapshot, enabled) }
            .filterNotNull()
            .distinctUntilChanged()

    /** Moves "today" to the current date. The process can live past midnight without a screen. */
    fun refreshDay() = store.refreshDay()
}

/** Glance creates the widget and the receiver itself, so they get their dependencies here. */
@EntryPoint
@InstallIn(SingletonComponent::class)
interface DailyWidgetEntryPoint {
    fun dailyWidgetSource(): DailyWidgetSource
}
