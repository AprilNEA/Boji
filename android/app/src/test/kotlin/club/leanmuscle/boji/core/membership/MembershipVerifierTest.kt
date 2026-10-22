package club.leanmuscle.boji.core.membership

import club.leanmuscle.boji.admin.v1.MembershipCodeKind
import club.leanmuscle.boji.admin.v1.VerifyMembershipCodeRequest
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.GET_SERVER_CONFIG
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.GET_SESSION
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.HAS_PERMISSION
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.LIST_MEMBERSHIPS
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.SIGN_OUT
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.VERIFY_MEMBERSHIP_CODE
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.connectError
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.json
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.list
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.membership
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.permissionJson
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.proto
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.serverConfig
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.sessionJson
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.verification
import club.leanmuscle.boji.v1.Membership
import com.google.protobuf.Timestamp
import java.io.File
import java.nio.file.Files
import java.time.Instant
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class MembershipVerifierTest {
    private lateinit var dir: File
    private lateinit var server: FakeMemberServer

    @Before
    fun setUp() {
        dir = Files.createTempDirectory("boji-membership-verifier").toFile()
        server = FakeMemberServer()
    }

    @After
    fun tearDown() {
        // Some tests close the server early to simulate a network failure.
        runCatching { server.close() }
        dir.deleteRecursively()
    }

    private fun TestScope.harness() = AccountHarness(dir, backgroundScope, server.endpoint)

    /** A signed-in operator, after the restore at launch and the permission check. */
    private suspend fun AccountHarness.signedInStaff(codes: Boolean = true, granted: Boolean = true) {
        server.on(GET_SESSION) { json(sessionJson()) }
        server.on(LIST_MEMBERSHIPS) { proto(list()) }
        server.on(GET_SERVER_CONFIG) { proto(serverConfig(membershipCode = codes)) }
        server.on(HAS_PERMISSION) { json(permissionJson(granted)) }
        server.on(VERIFY_MEMBERSHIP_CODE) { proto(verification()) }
        seed(storedSession())
        awaitRestore()
        repository.loadCapabilities()
        verifier.refreshPermission()
    }

    /** Waits in real time, because the verifier works on [Dispatchers.IO]. */
    private suspend fun <T> StateFlow<T>.await(predicate: (T) -> Boolean): T =
        withContext(Dispatchers.Default) { withTimeout(5_000) { first(predicate) } }

    private fun verifiedCode(): String =
        VerifyMembershipCodeRequest.parseFrom(checkNotNull(server.requests(VERIFY_MEMBERSHIP_CODE).last().body).toByteArray()).code

    private fun AccountHarness.outcome(): ScanOutcome? = verifier.outcome.value

    // region Permission

    @Test
    fun theScannerShowsForAnOperatorWithThePermission() = runTest {
        val h = harness()
        h.signedInStaff()
        assertTrue(h.verifier.canVerify.value)

        val requests = server.requests(HAS_PERMISSION)
        assertTrue(requests.isNotEmpty())
        for (request in requests) {
            assertEquals("Bearer tok-1", request.headers["authorization"])
            assertEquals(
                """{"permissions":{"membership":["read"]}}""",
                checkNotNull(request.body).utf8(),
            )
        }
        h.close()
    }

    @Test
    fun aMemberWithoutThePermissionSeesNoScanner() = runTest {
        val h = harness()
        h.signedInStaff(granted = false)
        assertFalse(h.verifier.canVerify.value)

        // A role that the server revokes hides the scanner the next time the member center opens.
        server.on(HAS_PERMISSION) { json(permissionJson(true)) }
        h.verifier.refreshPermission()
        assertTrue(h.verifier.canVerify.value)
        server.on(HAS_PERMISSION) { connectError("forbidden", 403) }
        h.verifier.refreshPermission()
        assertFalse(h.verifier.canVerify.value)
        h.close()
    }

    @Test
    fun withoutServerCodesTheAppAsksNothing() = runTest {
        val h = harness()
        h.signedInStaff(codes = false)
        assertFalse(h.verifier.canVerify.value)
        assertTrue(server.requests(HAS_PERMISSION).isEmpty())
        h.close()
    }

    // endregion

    // region Verification

    @Test
    fun staticAndDynamicCodesShowTheCardAndWhereTheCodeCameFrom() = runTest {
        val h = harness()
        h.signedInStaff()
        server.on(VERIFY_MEMBERSHIP_CODE) {
            proto(verification(membership(memberNumber = "1", nickname = "薄肌同学"), MembershipCodeKind.MEMBERSHIP_CODE_KIND_STATIC))
        }

        h.verifier.verify("  BJ1.S.static\n")
        assertEquals("BJ1.S.static", verifiedCode())
        assertEquals("Bearer tok-1", server.requests(VERIFY_MEMBERSHIP_CODE).last().headers["authorization"])
        val static = h.outcome() as ScanOutcome.Verified
        assertEquals(MembershipVerification.Kind.WALLET_PASS, static.verification.kind)
        assertEquals(MembershipVerification.Standing.VALID, static.standing)
        // Opaque: the member number arrives as the server sent it.
        assertEquals("1", static.verification.card.memberNumber)
        assertEquals("薄肌同学", static.verification.card.nickname)

        h.verifier.clearOutcome()
        server.on(VERIFY_MEMBERSHIP_CODE) { proto(verification()) }
        h.verifier.verify("BJ1.D.m1.12345678")
        val dynamic = h.outcome() as ScanOutcome.Verified
        assertEquals(MembershipVerification.Kind.APP, dynamic.verification.kind)
        assertEquals("000042", dynamic.verification.card.memberNumber)
        assertFalse(h.verifier.verifying.value)
        h.close()
    }

    @Test
    fun suspendedAndExpiredCardsAreReportedAsSuch() = runTest {
        val h = harness()
        h.signedInStaff()

        server.on(VERIFY_MEMBERSHIP_CODE) { proto(verification(membership().toBuilder().setState(Membership.State.SUSPENDED).build())) }
        h.verifier.verify("BJ1.D.m1.1")
        assertEquals(MembershipVerification.Standing.SUSPENDED, (h.outcome() as ScanOutcome.Verified).standing)

        h.verifier.clearOutcome()
        // The harness clock reads 2026-10-20. The card expired on 2026-10-01.
        val expired = membership().toBuilder().setExpireTime(Timestamp.newBuilder().setSeconds(1_790_812_800)).build()
        server.on(VERIFY_MEMBERSHIP_CODE) { proto(verification(expired)) }
        h.verifier.verify("BJ1.D.m1.2")
        assertEquals(MembershipVerification.Standing.EXPIRED, (h.outcome() as ScanOutcome.Verified).standing)

        h.verifier.clearOutcome()
        val unknownTier = membership().toBuilder().setTier(Membership.Tier.TIER_UNSPECIFIED).build()
        server.on(VERIFY_MEMBERSHIP_CODE) { proto(verification(unknownTier)) }
        h.verifier.verify("BJ1.D.m1.3")
        assertEquals(MembershipVerification.Standing.SUSPENDED, (h.outcome() as ScanOutcome.Verified).standing)
        h.close()
    }

    @Test
    fun serverErrorsMapToScanProblems() = runTest {
        val h = harness()
        h.signedInStaff()
        val cases = listOf(
            connectError("invalid_argument", 400, reason = "MEMBERSHIP_CODE_INVALID") to ScanProblem.INVALID,
            connectError("failed_precondition", 400, reason = "MEMBERSHIP_CODE_EXPIRED") to ScanProblem.CODE_EXPIRED,
            connectError("not_found", 404, reason = "MEMBERSHIP_NOT_FOUND") to ScanProblem.NOT_FOUND,
            connectError("failed_precondition", 400, reason = "MEMBERSHIP_CODE_NOT_CONFIGURED") to ScanProblem.NOT_CONFIGURED,
            connectError("permission_denied", 403, reason = "FRESH_SESSION_REQUIRED") to ScanProblem.SIGN_IN_AGAIN,
            connectError("unauthenticated", 401) to ScanProblem.SIGN_IN_AGAIN,
            connectError("internal", 500) to ScanProblem.FAILED,
            proto(verification(kind = MembershipCodeKind.MEMBERSHIP_CODE_KIND_UNSPECIFIED)) to ScanProblem.FAILED,
            proto(verification().toBuilder().clearMembership().build()) to ScanProblem.FAILED,
        )
        for ((response, problem) in cases) {
            server.on(VERIFY_MEMBERSHIP_CODE) { response }
            h.verifier.verify("BJ1.D.m1.1")
            assertEquals(problem.name, ScanOutcome.Failed(problem), h.outcome())
            h.verifier.clearOutcome()
        }
        // None of these takes the scanner away.
        assertTrue(h.verifier.canVerify.value)
        h.close()
    }

    @Test
    fun aRevokedRoleHidesTheScanner() = runTest {
        val h = harness()
        h.signedInStaff()
        server.on(VERIFY_MEMBERSHIP_CODE) { connectError("permission_denied", 403) }

        h.verifier.verify("BJ1.D.m1.1")
        assertEquals(ScanOutcome.Failed(ScanProblem.FORBIDDEN), h.outcome())
        assertFalse(h.verifier.canVerify.value)
        h.close()
    }

    @Test
    fun aNetworkFailureIsReported() = runTest {
        val h = harness()
        h.signedInStaff()
        server.close()

        h.verifier.verify("BJ1.D.m1.1")
        assertEquals(ScanOutcome.Failed(ScanProblem.NETWORK), h.outcome())
        h.close()
    }

    @Test
    fun aShownResultIgnoresNewValuesUntilStaffDismissIt() = runTest {
        val h = harness()
        h.signedInStaff()
        h.verifier.verify("BJ1.D.m1.1")
        assertEquals(1, server.requests(VERIFY_MEMBERSHIP_CODE).size)

        // The camera keeps reading codes while the result is on screen.
        h.verifier.verify("BJ1.D.m1.2")
        h.verifier.verify("   ")
        assertEquals(1, server.requests(VERIFY_MEMBERSHIP_CODE).size)

        h.verifier.clearOutcome()
        h.verifier.verify("   ")
        assertNull(h.outcome())
        h.verifier.verify("BJ1.D.m1.2")
        assertEquals(2, server.requests(VERIFY_MEMBERSHIP_CODE).size)
        assertEquals("BJ1.D.m1.2", verifiedCode())
        h.close()
    }

    @Test
    fun signingOutClearsTheResultAndThePermission() = runTest {
        val h = harness()
        h.signedInStaff()
        server.on(SIGN_OUT) { json("""{"success":true}""") }
        h.verifier.verify("BJ1.D.m1.1")
        assertTrue(h.outcome() is ScanOutcome.Verified)

        h.repository.signOut()
        h.verifier.canVerify.await { !it }
        h.verifier.outcome.await { it == null }

        // Without a session the app sends nothing.
        h.verifier.verify("BJ1.D.m1.2")
        assertEquals(ScanOutcome.Failed(ScanProblem.FORBIDDEN), h.outcome())
        assertEquals(1, server.requests(VERIFY_MEMBERSHIP_CODE).size)
        h.close()
    }

    // endregion
}
