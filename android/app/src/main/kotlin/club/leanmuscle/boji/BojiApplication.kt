package club.leanmuscle.boji

import android.app.Application
import club.leanmuscle.boji.core.diagnostics.CrashReporting
import dagger.hilt.android.HiltAndroidApp

/** Hilt builds the dependency graph from the modules in `core/di`. */
@HiltAndroidApp
class BojiApplication : Application() {
    override fun onCreate() {
        // Before Hilt builds the graph in super.onCreate(), so that Sentry also reports its failures.
        CrashReporting.start(this)
        super.onCreate()
    }
}
