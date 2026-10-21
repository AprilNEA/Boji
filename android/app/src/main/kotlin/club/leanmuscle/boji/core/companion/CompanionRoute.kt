package club.leanmuscle.boji.core.companion

import java.net.URI
import java.net.URISyntaxException

/**
 * Tabs that the widget can open, like `CompanionRoute` on iOS. The widget starts MainActivity
 * with an explicit intent and one of these URIs as data. The manifest does not register the
 * `boji` scheme, but MainActivity is exported, so [parse] accepts only the exact form.
 */
enum class CompanionRoute(val host: String) {
    Today("today"),
    Training("training"),
    Progress("progress"),
    Club("club"),
    ;

    val uri: String get() = "$SCHEME://$host"

    companion object {
        const val SCHEME = "boji"

        /** The route for `boji://<tab>`, or null for anything else. Same rules as iOS. */
        fun parse(value: String?): CompanionRoute? {
            if (value == null) return null
            val uri = try {
                URI(value)
            } catch (_: URISyntaxException) {
                return null
            }
            if (!SCHEME.equals(uri.scheme, ignoreCase = true)) return null
            if (uri.rawUserInfo != null || uri.port != -1 || uri.rawQuery != null || uri.rawFragment != null) return null
            val path = uri.rawPath.orEmpty()
            if (path.isNotEmpty() && path != "/") return null
            val host = uri.host?.lowercase() ?: return null
            return entries.firstOrNull { it.host == host }
        }
    }
}
