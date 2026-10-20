package club.leanmuscle.boji.core.diagnostics

import android.content.Context
import club.leanmuscle.boji.BuildConfig
import io.sentry.KeyValueCollectionBehavior
import io.sentry.android.core.SentryAndroid

/**
 * Starts Sentry crash reporting when the build sets a DSN.
 *
 * A report holds the stack trace, device and OS context, app lifecycle breadcrumbs and a random
 * installation ID that Sentry stores in the app files. It never holds training or body records,
 * user identity, screenshots, the view hierarchy, or HTTP headers, bodies, cookies and query
 * strings. The SDK does not set an IP address. Performance tracing and Session Replay stay off.
 *
 * `AndroidManifest.xml` removes the SDK's start-up providers, so the SDK runs no code when the
 * DSN is empty.
 */
object CrashReporting {
    /** The Sentry environment of this build. */
    val environment: String
        get() = if (BuildConfig.DEBUG) "development" else "production"

    /** Starts the SDK. Call it once, from [android.app.Application.onCreate]. */
    fun start(context: Context) {
        val dsn = BuildConfig.SENTRY_DSN
        if (dsn.isEmpty()) return
        SentryAndroid.init(context) { options ->
            options.dsn = dsn
            options.environment = environment
            options.isAttachScreenshot = false
            options.isAttachViewHierarchy = false
            options.dataCollection.apply {
                userInfo = false
                cookies = KeyValueCollectionBehavior.off()
                urlQueryParams = KeyValueCollectionBehavior.off()
                httpBodies = emptySet()
                databaseQueryData = false
                filePaths = false
                httpHeaders.request = KeyValueCollectionBehavior.off()
                httpHeaders.response = KeyValueCollectionBehavior.off()
                graphql.document = false
                graphql.variables = false
            }
        }
    }
}
