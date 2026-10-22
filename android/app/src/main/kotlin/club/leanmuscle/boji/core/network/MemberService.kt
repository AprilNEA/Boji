package club.leanmuscle.boji.core.network

import club.leanmuscle.boji.v1.MembershipServiceClient
import club.leanmuscle.boji.v1.SystemServiceClient
import com.connectrpc.ProtocolClientConfig
import com.connectrpc.extensions.GoogleJavaLiteProtobufStrategy
import com.connectrpc.impl.ProtocolClient
import com.connectrpc.okhttp.ConnectOkHttpClient
import com.connectrpc.protocols.NetworkProtocol
import dagger.Lazy
import io.github.betterauth.client.BetterAuthClient
import io.ktor.client.engine.okhttp.OkHttp
import okhttp3.OkHttpClient
import javax.inject.Inject
import javax.inject.Singleton

/**
 * The member service URL of this build, or null when the build has none.
 *
 * @property googleServerClientId the Web client ID that Google ID tokens are requested for, or null
 *   when the build has none. Sign in with Google stays hidden without it.
 */
data class MemberServiceConfig(val endpoint: ServerEndpoint?, val googleServerClientId: String? = null)

/**
 * Entry point to the member service. The clients are created on first use, off the main thread,
 * because building OkHttp loads TLS data.
 */
@Singleton
class MemberService @Inject constructor(
    config: MemberServiceConfig,
    private val okHttpClient: Lazy<OkHttpClient>,
) {
    val endpoint: ServerEndpoint? = config.endpoint

    val googleServerClientId: String? = config.googleServerClientId?.takeIf { it.isNotBlank() }

    val isConfigured: Boolean get() = endpoint != null

    /**
     * The better-auth-kotlin-client for `/api/auth/`. It lives as long as the process and is never
     * closed: its OkHttp engine runs on the app's [OkHttpClient], and closing the engine would shut
     * down that client's dispatcher.
     */
    private val authClient: BetterAuthClient? by lazy {
        val endpoint = endpoint ?: return@lazy null
        val sharedClient = okHttpClient.get()
        BetterAuthClient {
            baseUrl = endpoint.authUrl
            // A blank origin sends no Origin header. The app is not a browser origin.
            origin = ""
            engine = OkHttp.create { preconfigured = sharedClient }
        }
    }

    private val protocolClient: ProtocolClient? by lazy {
        val endpoint = endpoint ?: return@lazy null
        ProtocolClient(
            httpClient = ConnectOkHttpClient(okHttpClient.get()),
            config = ProtocolClientConfig(
                host = endpoint.connectHost,
                serializationStrategy = GoogleJavaLiteProtobufStrategy(),
                networkProtocol = NetworkProtocol.CONNECT,
            ),
        )
    }

    private val membershipClient: MembershipClient? by lazy {
        protocolClient?.let { MembershipClient(MembershipServiceClient(it)) }
    }

    private val systemClient: SystemClient? by lazy {
        protocolClient?.let { SystemClient(SystemServiceClient(it)) }
    }

    /**
     * The Better Auth client. Its own session stays empty: call `withSession(token)` with the stored
     * token, or use a view without a session for the calls that create one.
     *
     * @throws MemberApiError.NotConfigured when the build has no member service URL.
     */
    fun auth(): BetterAuthClient = authClient ?: throw MemberApiError.NotConfigured

    /** @throws MemberApiError.NotConfigured when the build has no member service URL. */
    fun memberships(): MembershipClient = membershipClient ?: throw MemberApiError.NotConfigured

    /** @throws MemberApiError.NotConfigured when the build has no member service URL. */
    fun system(): SystemClient = systemClient ?: throw MemberApiError.NotConfigured
}
