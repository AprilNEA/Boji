package club.leanmuscle.boji

import android.app.Application
import club.leanmuscle.boji.core.companion.WearCompanionSync
import club.leanmuscle.boji.core.diagnostics.CrashReporting
import club.leanmuscle.boji.feature.widget.DailyWidgetSync
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

/** Hilt builds the dependency graph from the modules in `core/di`. */
@HiltAndroidApp
class BojiApplication : Application() {
    @Inject
    lateinit var dailyWidgetSync: DailyWidgetSync

    @Inject
    lateinit var wearCompanionSync: WearCompanionSync

    override fun onCreate() {
        // Before Hilt builds the graph in super.onCreate(), so that Sentry also reports its failures.
        CrashReporting.start(this)
        super.onCreate()
        // Placed widgets follow changes in the app. Without placed widgets this does no drawing.
        dailyWidgetSync.start()
        // The watch app gets each change while it is connected, and asks for the rest when it opens.
        wearCompanionSync.start()
    }
}
