package club.leanmuscle.boji.core.membership

import club.leanmuscle.boji.core.network.MembershipClient
import club.leanmuscle.boji.core.network.ServerEndpoint
import club.leanmuscle.boji.v1.ListMembershipsResponse
import club.leanmuscle.boji.v1.Membership
import com.google.protobuf.MessageLite
import com.google.protobuf.Timestamp
import com.google.rpc.ErrorInfo
import java.io.Closeable
import java.net.InetAddress
import java.util.Base64
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList
import mockwebserver3.Dispatcher
import mockwebserver3.MockResponse
import mockwebserver3.MockWebServer
import mockwebserver3.RecordedRequest
import okio.Buffer

/**
 * A member service on 127.0.0.1 for JVM tests. Each path has one handler, which a test can replace
 * at any time. Unknown paths return 404. The server records every request.
 *
 * Responses follow the real wire formats: Better Auth JSON with the `set-auth-token` header, and the
 * Connect unary protocol with binary proto bodies and JSON errors that carry `google.rpc.ErrorInfo`.
 */
class FakeMemberServer : Closeable {
    private val server = MockWebServer()
    private val routes = ConcurrentHashMap<String, (RecordedRequest) -> MockResponse>()
    private val recorded = CopyOnWriteArrayList<RecordedRequest>()

    init {
        server.dispatcher = object : Dispatcher() {
            override fun dispatch(request: RecordedRequest): MockResponse {
                recorded += request
                val handler = routes[request.url.encodedPath] ?: return MockResponse.Builder().code(404).build()
                return handler(request)
            }
        }
        server.start(InetAddress.getByName("127.0.0.1"), 0)
    }

    val endpoint: ServerEndpoint =
        checkNotNull(ServerEndpoint.parse("http://127.0.0.1:${server.port}", allowLocalHttp = true))

    val requestCount: Int get() = recorded.size

    fun on(path: String, handler: (RecordedRequest) -> MockResponse) {
        routes[path] = handler
    }

    fun requests(path: String): List<RecordedRequest> = recorded.filter { it.url.encodedPath == path }

    override fun close() = server.close()

    companion object {
        const val SIGN_IN = "/api/auth/sign-in/email"
        const val SIGN_OUT = "/api/auth/sign-out"
        const val GET_SESSION = "/api/auth/get-session"
        const val CHANGE_PASSWORD = "/api/auth/change-password"
        const val DELETE_USER = "/api/auth/delete-user"
        const val LIST_MEMBERSHIPS = "/boji.v1.MembershipService/ListMemberships"
        const val CREATE_MEMBERSHIP = "/boji.v1.MembershipService/CreateMembership"

        const val USER_ID = "user-1"
        const val EMAIL = "member@example.com"

        fun json(body: String, code: Int = 200, authToken: String? = null): MockResponse =
            MockResponse.Builder()
                .code(code)
                .setHeader("Content-Type", "application/json")
                .apply { if (authToken != null) setHeader("set-auth-token", authToken) }
                .body(body)
                .build()

        fun proto(message: MessageLite): MockResponse =
            MockResponse.Builder()
                .code(200)
                .setHeader("Content-Type", "application/proto")
                .body(Buffer().write(message.toByteArray()))
                .build()

        /** A Connect error. [reason] adds an `ErrorInfo` detail of the bizserver domain. */
        fun connectError(code: String, httpStatus: Int, reason: String? = null): MockResponse {
            val details = if (reason == null) {
                ""
            } else {
                val info = ErrorInfo.newBuilder()
                    .setReason(reason)
                    .setDomain(MembershipClient.ERROR_DOMAIN)
                    .build()
                val value = Base64.getEncoder().withoutPadding().encodeToString(info.toByteArray())
                ""","details":[{"type":"google.rpc.ErrorInfo","value":"$value"}]"""
            }
            return MockResponse.Builder()
                .code(httpStatus)
                .setHeader("Content-Type", "application/json")
                .body("""{"code":"$code","message":"test error"$details}""")
                .build()
        }

        /** A Better Auth `get-session` body. */
        fun sessionJson(
            userId: String = USER_ID,
            emailVerified: Boolean = true,
            expiresAt: String = "2026-11-20T08:00:00.000Z",
        ): String = """
            {
              "session": {
                "id": "session-1",
                "userId": "$userId",
                "token": "not-used-by-the-client",
                "expiresAt": "$expiresAt",
                "createdAt": "2026-10-20T07:00:00.000Z"
              },
              "user": {
                "id": "$userId",
                "email": "$EMAIL",
                "name": "小林",
                "emailVerified": $emailVerified,
                "image": null
              }
            }
        """.trimIndent()

        fun membership(memberNumber: String = "000042", nickname: String = "小林"): Membership =
            Membership.newBuilder()
                .setName("users/$USER_ID/memberships/m1")
                .setMemberNumber(memberNumber)
                .setNickname(nickname)
                .setTermsVersion(MembershipRules.TERMS_VERSION)
                .setTier(Membership.Tier.COMMUNITY)
                .setState(Membership.State.ACTIVE)
                .setCreateTime(Timestamp.newBuilder().setSeconds(1_760_000_000))
                .build()

        fun list(vararg memberships: Membership): ListMembershipsResponse =
            ListMembershipsResponse.newBuilder().addAllMemberships(memberships.asList()).build()
    }
}
