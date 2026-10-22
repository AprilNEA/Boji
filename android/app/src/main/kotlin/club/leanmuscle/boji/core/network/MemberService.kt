package club.leanmuscle.boji.core.network

import club.leanmuscle.boji.v1.MembershipServiceClient
import club.leanmuscle.boji.v1.SystemServiceClient
import com.connectrpc.ProtocolClientConfig
import com.connectrpc.extensions.GoogleJavaLiteProtobufStrategy
import com.connectrpc.impl.ProtocolClient
import com.connectrpc.okhttp.ConnectOkHttpClient
import com.connectrpc.protocols.NetworkProtocol
import dagger.Lazy
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.time.Clock
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
 * because building OkHttp and Retrofit loads TLS and reflection data.
 */
@Singleton
class MemberService @Inject constructor(
    config: MemberServiceConfig,
    private val okHttpClient: Lazy<OkHttpClient>,
    private val clock: Clock,
) {
    val endpoint: ServerEndpoint? = config.endpoint

    val googleServerClientId: String? = config.googleServerClientId?.takeIf { it.isNotBlank() }

    val isConfigured: Boolean get() = endpoint != null

    private val authClient: BetterAuthClient? by lazy {
        val endpoint = endpoint ?: return@lazy null
        val client = okHttpClient.get().newBuilder()
            .addInterceptor { chain ->
                chain.proceed(chain.request().newBuilder().header("Accept", JSON_MEDIA_TYPE).build())
            }
            .build()
        val retrofit = Retrofit.Builder()
            .baseUrl(endpoint.directoryUrl)
            .client(client)
            .addConverterFactory(json.asConverterFactory(JSON_MEDIA_TYPE.toMediaType()))
            .build()
        BetterAuthClient(retrofit.create(BetterAuthApi::class.java), json, clock)
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

    /** @throws MemberApiError.NotConfigured when the build has no member service URL. */
    fun auth(): BetterAuthClient = authClient ?: throw MemberApiError.NotConfigured

    /** @throws MemberApiError.NotConfigured when the build has no member service URL. */
    fun memberships(): MembershipClient = membershipClient ?: throw MemberApiError.NotConfigured

    /** @throws MemberApiError.NotConfigured when the build has no member service URL. */
    fun system(): SystemClient = systemClient ?: throw MemberApiError.NotConfigured

    private companion object {
        const val JSON_MEDIA_TYPE = "application/json"

        val json = Json {
            ignoreUnknownKeys = true
            explicitNulls = false
        }
    }
}
