package club.leanmuscle.boji.core.network

import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull

/**
 * The validated base URL of the member service (bizserver).
 *
 * The rules match `MembershipServiceConfiguration` on iOS: https only, or http for a loopback host in
 * debug builds. Android adds 10.0.2.2, the address at which an emulator reaches the host computer.
 * The URL must not contain a user, a password, a query or a fragment.
 */
class ServerEndpoint private constructor(val baseUrl: HttpUrl) {

    /**
     * `scheme://host[:port]`. The stored session and the card cache record this value, so that a
     * build that points at another server never shows them.
     */
    val origin: String = buildString {
        append(baseUrl.scheme).append("://")
        val host = baseUrl.host
        if (':' in host) append('[').append(host).append(']') else append(host)
        if (baseUrl.port != HttpUrl.defaultPort(baseUrl.scheme)) append(':').append(baseUrl.port)
    }

    /** Base URL for Retrofit, which requires a trailing slash. */
    val directoryUrl: HttpUrl =
        if (baseUrl.encodedPath.endsWith("/")) baseUrl else baseUrl.newBuilder().addPathSegment("").build()

    /** Host for connect-kotlin, which appends `/<service>/<method>` itself. */
    val connectHost: String = directoryUrl.toString().removeSuffix("/")

    override fun toString(): String = baseUrl.toString()

    companion object {
        /** Hosts that accept plain http in debug builds. Keep equal to the debug network security config. */
        val LOCAL_HTTP_HOSTS: Set<String> = setOf("localhost", "127.0.0.1", "::1", "10.0.2.2")

        /** Returns null when [raw] is empty or breaks a rule. */
        fun parse(raw: String, allowLocalHttp: Boolean): ServerEndpoint? {
            val value = raw.trim()
            if (value.isEmpty()) return null
            // OkHttp accepts only http and https, lowercases the host and checks the port range.
            val url = value.toHttpUrlOrNull() ?: return null
            if (url.username.isNotEmpty() || url.password.isNotEmpty()) return null
            if (url.encodedQuery != null || url.encodedFragment != null) return null
            if (url.host.isEmpty()) return null
            val allowed = when (url.scheme) {
                "https" -> true
                "http" -> allowLocalHttp && url.host in LOCAL_HTTP_HOSTS
                else -> false
            }
            return if (allowed) ServerEndpoint(url) else null
        }
    }
}
