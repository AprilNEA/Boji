package club.leanmuscle.boji.core.membership

import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.GET_MEMBERSHIP_CODE
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.GET_SERVER_CONFIG
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.GET_SESSION
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.LIST_MEMBERSHIPS
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.RFC6238_SECRET
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.SIGN_OUT
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.connectError
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.json
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.list
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.membership
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.membershipCode
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.proto
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.serverConfig
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.sessionJson
import club.leanmuscle.boji.core.network.MemberApiError
import club.leanmuscle.boji.core.network.toMembershipCode
import club.leanmuscle.boji.v1.GetMembershipCodeRequest
import club.leanmuscle.boji.v1.Membership
import java.io.File
import java.nio.file.Files
import java.time.Instant
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.withTimeout
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class MembershipCodeTest {
    private lateinit var dir: File
    private lateinit var server: FakeMemberServer

    @Before
    fun setUp() {
        dir = Files.createTempDirectory("boji-membership-code").toFile()
        server = FakeMemberServer()
    }

    @After
    fun tearDown() {
        // Some tests close the server early to simulate a network failure.
        runCatching { server.close() }
        dir.deleteRecursively()
    }

    private fun TestScope.harness() = AccountHarness(dir, backgroundScope, server.endpoint)

    private fun rfcCode(digits: Int = 8, period: Int = 30) = MembershipCode(
        membershipId = "m1",
        staticValue = "BJ1.S.static",
        dynamicValuePrefix = "BJ1.D.m1.",
        secret = RFC6238_SECRET,
        digits = digits,
        period = period,
    )

    /** A signed-in account with the active card m1, after the restore at launch. */
    private suspend fun AccountHarness.signedInWithCard(codes: Boolean = true) {
        server.on(GET_SESSION) { json(sessionJson()) }
        server.on(LIST_MEMBERSHIPS) { proto(list(membership())) }
        server.on(GET_SERVER_CONFIG) { proto(serverConfig(membershipCode = codes)) }
        server.on(GET_MEMBERSHIP_CODE) { proto(membershipCode()) }
        seed(storedSession(), card = membership().toCard())
        awaitRestore()
        repository.loadCapabilities()
    }

    // region TOTP

    /** RFC 6238 appendix B, SHA-1 column. */
    @Test
    fun totpMatchesTheRfc6238Vectors() {
        val code = rfcCode()
        val vectors = mapOf(
            59L to "94287082",
            1_111_111_109L to "07081804",
            1_111_111_111L to "14050471",
            1_234_567_890L to "89005924",
            2_000_000_000L to "69279037",
            20_000_000_000L to "65353130",
        )
        for ((seconds, expected) in vectors) {
            val at = Instant.ofEpochSecond(seconds)
            assertEquals("t=$seconds", expected, code.totp(code.step(at)))
            assertEquals("BJ1.D.m1.$expected", code.dynamicValue(at))
        }
    }

    @Test
    fun stepAndCountdownFollowThePeriod() {
        val code = rfcCode(digits = 6)
        assertEquals(0L, code.step(Instant.ofEpochSecond(29)))
        assertEquals(1L, code.step(Instant.ofEpochSecond(30)))
        assertEquals(30, code.secondsRemaining(Instant.ofEpochSecond(30)))
        assertEquals(1, code.secondsRemaining(Instant.ofEpochSecond(59)))
        assertEquals(6, code.totp(1).length)
    }

    @Test
    fun theSecretStaysOutOfToString() {
        val text = rfcCode().toString()
        assertFalse(text.contains("1234567890"))
        assertFalse(text.contains("BJ1."))
    }

    @Test
    fun parametersOutsideTheLimitsAreRejected() {
        assertThrows(IllegalArgumentException::class.java) { rfcCode(digits = 5) }
        assertThrows(IllegalArgumentException::class.java) { rfcCode(digits = 11) }
        assertThrows(IllegalArgumentException::class.java) { rfcCode(period = 0) }
        assertThrows(IllegalArgumentException::class.java) { rfcCode(period = 301) }
        assertThrows(IllegalArgumentException::class.java) {
            MembershipCode("m1", "s", "d", ByteArray(15), digits = 6, period = 30)
        }
    }

    // endregion

    // region Response checks

    @Test
    fun responseOfTheRequestedCardIsAccepted() {
        val code = membershipCode().toMembershipCode("m1")
        assertEquals(rfcCode(), code)
    }

    @Test
    fun responseOfAnotherCardOrWithBadParametersIsRejected() {
        val bad = listOf(
            membershipCode(name = "users/user-1/memberships/m2/code"),
            membershipCode(name = "users/user-1/memberships/m1"),
            membershipCode(secret = ByteArray(15)),
            membershipCode(digits = 5),
            membershipCode(periodSeconds = 0),
            membershipCode(periodSeconds = 301),
            membershipCode().toBuilder().clearTotp().build(),
            membershipCode().toBuilder().setStaticValue("").build(),
            membershipCode().toBuilder().setDynamicValuePrefix("").build(),
        )
        for (response in bad) {
            assertThrows(MemberApiError.InvalidResponse::class.java) { response.toMembershipCode("m1") }
        }
    }

    @Test
    fun membershipIdIsTheLastSegmentOfTheCardName() {
        assertEquals("m1", membership().toCard().membershipId)
        assertNull(membership().toBuilder().setName("users/user-1/cards/m1").build().toCard().membershipId)
        assertNull(membership().toBuilder().setName("users/user-1/memberships/").build().toCard().membershipId)
    }

    // endregion

    // region Repository

    @Test
    fun theActiveCardGetsItsCodeOnceAndKeepsItInMemory() = runTest {
        val h = harness()
        h.signedInWithCard()
        assertTrue(h.repository.membershipCodeEnabled.value)

        assertNull(h.repository.prepareMembershipCode())
        assertEquals(rfcCode(), h.repository.membershipCode.value)
        val request = server.requests(GET_MEMBERSHIP_CODE).single()
        assertEquals("Bearer tok-1", request.headers["authorization"])
        assertEquals(
            "users/me/memberships/m1/code",
            GetMembershipCodeRequest.parseFrom(checkNotNull(request.body).toByteArray()).name,
        )

        // A fetched code stays valid, also when the server is gone.
        server.close()
        assertNull(h.repository.prepareMembershipCode())
        assertEquals(1, server.requests(GET_MEMBERSHIP_CODE).size)
        assertNotNull(h.repository.membershipCode.value)
        h.close()
    }

    @Test
    fun withoutTheCapabilityTheAppAsksForNoCode() = runTest {
        val h = harness()
        h.signedInWithCard(codes = false)
        assertFalse(h.repository.membershipCodeEnabled.value)

        assertEquals(AccountMessage.MembershipCodeNotConfigured, h.repository.prepareMembershipCode())
        assertTrue(server.requests(GET_MEMBERSHIP_CODE).isEmpty())
        h.close()
    }

    @Test
    fun aSuspendedCardGetsNoCode() = runTest {
        val h = harness()
        server.on(GET_SESSION) { json(sessionJson()) }
        server.on(LIST_MEMBERSHIPS) { proto(list(membership().toBuilder().setState(Membership.State.SUSPENDED).build())) }
        server.on(GET_SERVER_CONFIG) { proto(serverConfig(membershipCode = true)) }
        h.seed(h.storedSession())
        h.awaitRestore()
        h.repository.loadCapabilities()

        assertEquals(AccountMessage.MembershipCodeNeedsActiveCard, h.repository.prepareMembershipCode())
        assertTrue(server.requests(GET_MEMBERSHIP_CODE).isEmpty())
        h.close()
    }

    @Test
    fun serverErrorsMapToTheMemberCodeMessages() = runTest {
        val h = harness()
        h.signedInWithCard()

        server.on(GET_MEMBERSHIP_CODE) { connectError("failed_precondition", 400, reason = "MEMBERSHIP_SUSPENDED") }
        assertEquals(AccountMessage.MembershipCodeCardChanged, h.repository.prepareMembershipCode())

        server.on(GET_MEMBERSHIP_CODE) { connectError("not_found", 404, reason = "MEMBERSHIP_NOT_FOUND") }
        assertEquals(AccountMessage.MembershipCodeCardChanged, h.repository.prepareMembershipCode())

        server.on(GET_MEMBERSHIP_CODE) { proto(membershipCode(name = "users/user-1/memberships/m2/code")) }
        assertEquals(AccountMessage.Failed(AccountAction.MEMBERSHIP_CODE), h.repository.prepareMembershipCode())
        assertNull(h.repository.membershipCode.value)

        server.on(GET_MEMBERSHIP_CODE) { connectError("failed_precondition", 400, reason = "MEMBERSHIP_CODE_NOT_CONFIGURED") }
        assertEquals(AccountMessage.MembershipCodeNotConfigured, h.repository.prepareMembershipCode())
        assertFalse(h.repository.membershipCodeEnabled.value)
        h.close()
    }

    @Test
    fun theCodeDisappearsWhenTheCardIsSuspended() = runTest {
        val h = harness()
        h.signedInWithCard()
        assertNull(h.repository.prepareMembershipCode())
        assertNotNull(h.repository.membershipCode.value)

        server.on(LIST_MEMBERSHIPS) { proto(list(membership().toBuilder().setState(Membership.State.SUSPENDED).build())) }
        h.repository.refresh()
        withTimeout(5_000) { h.repository.membershipCode.first { it == null } }
        h.close()
    }

    @Test
    fun signingOutClearsTheCode() = runTest {
        val h = harness()
        h.signedInWithCard()
        server.on(SIGN_OUT) { json("""{"success":true}""") }
        assertNull(h.repository.prepareMembershipCode())

        h.repository.signOut()
        assertNull(h.repository.membershipCode.value)
        h.close()
    }

    // endregion
}
