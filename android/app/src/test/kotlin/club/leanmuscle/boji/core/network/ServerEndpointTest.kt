package club.leanmuscle.boji.core.network

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class ServerEndpointTest {

    private fun parse(raw: String, allowLocalHttp: Boolean = false) = ServerEndpoint.parse(raw, allowLocalHttp)

    @Test
    fun acceptsHttpsAndTrimsWhiteSpace() {
        val endpoint = checkNotNull(parse("  https://api.leanmuscle.club  "))
        assertEquals("https://api.leanmuscle.club", endpoint.origin)
        assertEquals("https://api.leanmuscle.club/", endpoint.directoryUrl.toString())
        assertEquals("https://api.leanmuscle.club", endpoint.connectHost)
        assertEquals("https://api.leanmuscle.club/api/auth", endpoint.authUrl)
    }

    @Test
    fun emptyValueMeansNotConfigured() {
        assertNull(parse(""))
        assertNull(parse("   "))
    }

    @Test
    fun keepsAPathPrefixForBothClients() {
        val endpoint = checkNotNull(parse("https://example.com/boji"))
        assertEquals("https://example.com/boji/", endpoint.directoryUrl.toString())
        assertEquals("https://example.com/boji", endpoint.connectHost)
        assertEquals("https://example.com/boji/api/auth", endpoint.authUrl)
        assertEquals("https://example.com", endpoint.origin)
    }

    @Test
    fun originKeepsANonDefaultPortAndBracketsIpv6() {
        assertEquals("https://example.com:8443", checkNotNull(parse("https://example.com:8443/")).origin)
        assertEquals("https://example.com", checkNotNull(parse("https://example.com:443/")).origin)
        assertEquals("http://[::1]:3000", checkNotNull(parse("http://[::1]:3000", allowLocalHttp = true)).origin)
    }

    @Test
    fun plainHttpOnlyForLocalHostsInDebugBuilds() {
        for (host in listOf("localhost", "127.0.0.1", "[::1]", "10.0.2.2")) {
            assertNotNull(host, parse("http://$host:3000", allowLocalHttp = true))
            assertNull(host, parse("http://$host:3000", allowLocalHttp = false))
        }
        assertNull(parse("http://example.com", allowLocalHttp = true))
        assertNull(parse("http://192.168.1.20:3000", allowLocalHttp = true))
    }

    @Test
    fun rejectsOtherSchemesCredentialsQueriesAndFragments() {
        assertNull(parse("ftp://example.com"))
        assertNull(parse("example.com"))
        assertNull(parse("https://user:pass@example.com"))
        assertNull(parse("https://user@example.com"))
        assertNull(parse("https://example.com/?debug=1"))
        assertNull(parse("https://example.com/#top"))
    }
}
