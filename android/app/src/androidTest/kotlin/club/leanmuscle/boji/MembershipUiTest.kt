package club.leanmuscle.boji

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.ext.junit.runners.AndroidJUnit4
import club.leanmuscle.boji.core.auth.AuthSessionStore
import club.leanmuscle.boji.core.auth.StoredSession
import club.leanmuscle.boji.core.membership.MembershipRules
import club.leanmuscle.boji.core.model.BojiState
import club.leanmuscle.boji.core.network.ServerEndpoint
import club.leanmuscle.boji.feature.membership.MEMBERSHIP_ENTRY_TAG
import club.leanmuscle.boji.feature.membership.MEMBERSHIP_SCREEN_TAG
import club.leanmuscle.boji.ui.navigation.BojiDestination
import club.leanmuscle.boji.v1.ListMembershipsResponse
import club.leanmuscle.boji.v1.Membership
import com.google.protobuf.Timestamp
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import java.net.InetAddress
import java.time.Duration
import java.time.Instant
import java.util.concurrent.CopyOnWriteArrayList
import javax.inject.Inject
import kotlinx.coroutines.runBlocking
import mockwebserver3.Dispatcher
import mockwebserver3.MockResponse
import mockwebserver3.MockWebServer
import mockwebserver3.RecordedRequest
import okio.Buffer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.ExternalResource
import org.junit.runner.RunWith

/**
 * A member service on the device's 127.0.0.1. The debug network security config allows plain
 * HTTP to this host. It serves a verified account with the card [MEMBER_NUMBER].
 */
class FakeMemberServerRule : ExternalResource() {
    private val server = MockWebServer()
    val requests = CopyOnWriteArrayList<RecordedRequest>()
    lateinit var endpoint: ServerEndpoint
        private set

    override fun before() {
        server.dispatcher = object : Dispatcher() {
            override fun dispatch(request: RecordedRequest): MockResponse {
                requests += request
                return when (request.url.encodedPath) {
                    "/api/auth/get-session" -> json(sessionJson())
                    "/boji.v1.MembershipService/ListMemberships" -> proto(cardList())
                    else -> MockResponse.Builder().code(404).build()
                }
            }
        }
        server.start(InetAddress.getByName("127.0.0.1"), 0)
        endpoint = checkNotNull(ServerEndpoint.parse("http://127.0.0.1:${server.port}", allowLocalHttp = true))
        TestNetwork.endpoint = endpoint
    }

    override fun after() {
        TestNetwork.endpoint = null
        server.close()
    }

    private fun json(body: String) = MockResponse.Builder()
        .setHeader("Content-Type", "application/json")
        .body(body)
        .build()

    private fun proto(message: ListMembershipsResponse) = MockResponse.Builder()
        .setHeader("Content-Type", "application/proto")
        .body(Buffer().write(message.toByteArray()))
        .build()

    private fun sessionJson(): String {
        val expiresAt = Instant.now().plus(Duration.ofDays(30))
        return """
            {"session":{"id":"s1","userId":"$USER_ID","token":"unused","expiresAt":"$expiresAt","createdAt":"2026-10-20T07:00:00Z"},
             "user":{"id":"$USER_ID","email":"$EMAIL","name":"小林","emailVerified":true}}
        """.trimIndent()
    }

    private fun cardList(): ListMembershipsResponse = ListMembershipsResponse.newBuilder()
        .addMemberships(
            Membership.newBuilder()
                .setName("users/$USER_ID/memberships/m1")
                .setMemberNumber(MEMBER_NUMBER)
                .setNickname("小林")
                .setTermsVersion(MembershipRules.TERMS_VERSION)
                .setTier(Membership.Tier.COMMUNITY)
                .setState(Membership.State.ACTIVE)
                .setCreateTime(Timestamp.newBuilder().setSeconds(1_760_000_000)),
        )
        .build()

    companion object {
        const val USER_ID = "user-1"
        const val EMAIL = "member@example.com"
        const val MEMBER_NUMBER = "000042"
    }
}

/** The member center opened from 俱乐部 and from 设置, with account files in a new test directory. */
@HiltAndroidTest
@RunWith(AndroidJUnit4::class)
class MembershipUiTest {

    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val stateRule = StateFileRule(BojiState(hasOnboarded = true))

    @get:Rule(order = 2)
    val server = FakeMemberServerRule()

    @get:Rule(order = 3)
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Inject
    lateinit var sessions: AuthSessionStore

    private val context get() = composeRule.activity

    @Before
    fun waitForToday() {
        hiltRule.inject()
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithTag(BojiDestination.Today.screenTag).fetchSemanticsNodes().isNotEmpty()
        }
    }

    private fun awaitTag(tag: String) = composeRule.waitUntil(timeoutMillis = 5_000) {
        composeRule.onAllNodesWithTag(tag).fetchSemanticsNodes().isNotEmpty()
    }

    @Test
    fun buildWithoutAServiceShowsTheOfflineNotice() {
        // The member service is created when 俱乐部 first needs it, so this still applies.
        TestNetwork.endpoint = null

        composeRule.onNodeWithTag(BojiDestination.Club.tabTag).performClick()
        composeRule.onNodeWithTag(MEMBERSHIP_ENTRY_TAG).performClick()
        awaitTag(MEMBERSHIP_SCREEN_TAG)

        composeRule.onNodeWithText(context.getString(R.string.membership_not_configured_title)).assertIsDisplayed()
        assertTrue(server.requests.isEmpty())
    }

    @Test
    fun settingsOpensTheSameMemberCenter() {
        TestNetwork.endpoint = null

        composeRule.onNodeWithTag("open_settings").performClick()
        composeRule.onNodeWithTag("settings_membership").performScrollTo().performClick()
        awaitTag(MEMBERSHIP_SCREEN_TAG)

        composeRule.onNodeWithText(context.getString(R.string.membership_not_configured_title)).assertIsDisplayed()
    }

    @Test
    fun signedInMemberSeesTheCardFromTheServer() {
        runBlocking {
            sessions.save(
                StoredSession(
                    origin = server.endpoint.origin,
                    token = "tok-ui",
                    userId = FakeMemberServerRule.USER_ID,
                    email = FakeMemberServerRule.EMAIL,
                    name = "小林",
                    emailVerified = true,
                ),
            )
        }
        val cardWithNumber = hasContentDescription(FakeMemberServerRule.MEMBER_NUMBER, substring = true)

        composeRule.onNodeWithTag(BojiDestination.Club.tabTag).performClick()
        // The entry shows the card after the restore confirmed the session online.
        composeRule.waitUntil(timeoutMillis = 10_000) {
            composeRule.onAllNodes(hasTestTag(MEMBERSHIP_ENTRY_TAG) and cardWithNumber)
                .fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithTag(MEMBERSHIP_ENTRY_TAG).performClick()
        awaitTag(MEMBERSHIP_SCREEN_TAG)

        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodes(cardWithNumber).fetchSemanticsNodes().isNotEmpty()
        }
        val sessionRequest = server.requests.first { it.url.encodedPath == "/api/auth/get-session" }
        assertEquals("Bearer tok-ui", sessionRequest.headers["Authorization"])
    }
}
