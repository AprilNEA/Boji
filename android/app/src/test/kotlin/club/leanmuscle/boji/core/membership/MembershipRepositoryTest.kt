package club.leanmuscle.boji.core.membership

import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.CHANGE_EMAIL
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.CHANGE_PASSWORD
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.CREATE_MEMBERSHIP
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.DELETE_USER
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.GET_SERVER_CONFIG
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.GET_SESSION
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.LIST_MEMBERSHIPS
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.SIGN_IN
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.SIGN_IN_SOCIAL
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.SIGN_OUT
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.connectError
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.json
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.list
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.membership
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.proto
import club.leanmuscle.boji.core.membership.FakeMemberServer.Companion.sessionJson
import club.leanmuscle.boji.v1.CreateMembershipRequest
import club.leanmuscle.boji.v1.GetServerConfigRequest
import club.leanmuscle.boji.v1.ListMembershipsRequest
import club.leanmuscle.boji.v1.ServerConfig
import java.io.File
import java.nio.file.Files
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import mockwebserver3.MockResponse
import mockwebserver3.RecordedRequest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class MembershipRepositoryTest {

    private lateinit var dir: File
    private lateinit var server: FakeMemberServer

    @Before
    fun setUp() {
        dir = Files.createTempDirectory("boji-membership").toFile()
        server = FakeMemberServer()
    }

    @After
    fun tearDown() {
        // Some tests close the server early to simulate a network failure.
        runCatching { server.close() }
        dir.deleteRecursively()
    }

    private fun TestScope.harness(configured: Boolean = true) =
        AccountHarness(dir, backgroundScope, if (configured) server.endpoint else null)

    private fun signedIn(state: AccountState): AccountState.SignedIn {
        assertTrue("Expected SignedIn, got $state", state is AccountState.SignedIn)
        return state as AccountState.SignedIn
    }

    private fun RecordedRequest.jsonBody() = Json.parseToJsonElement(checkNotNull(body).utf8()).jsonObject

    /** The member service accepts the session and returns [memberships]. */
    private fun serveSignedInAccount(vararg memberships: club.leanmuscle.boji.v1.Membership) {
        server.on(GET_SESSION) { json(sessionJson()) }
        server.on(LIST_MEMBERSHIPS) { proto(list(*memberships)) }
    }

    // region Configuration

    @Test
    fun buildWithoutAServiceUrlMakesNoRequest() = runTest {
        val h = harness(configured = false)
        val repository = h.repository

        assertEquals(AccountState.NotConfigured, repository.state.value)
        assertEquals(AccountMessage.NotConfigured, repository.refresh())
        assertEquals(AccountMessage.NotConfigured, repository.signIn(FakeMemberServer.EMAIL, "password1"))
        assertEquals(
            AccountMessage.NotConfigured,
            repository.enroll("小林", MembershipRules.PLEDGES.toSet(), acceptedTerms = true),
        )
        assertEquals(0, server.requestCount)
        h.close()
    }

    @Test
    fun sessionOfAnotherServerIsDeletedAtLaunch() = runTest {
        val h = harness()
        h.seed(h.storedSession(origin = "https://other.example"), card = h.cardOf(membership()))

        h.awaitRestore()

        assertEquals(AccountState.SignedOut, h.repository.state.value)
        assertNull(h.sessions.current())
        assertEquals(0L, h.cacheFile.length())
        assertEquals(0, server.requestCount)
        h.close()
    }

    // endregion

    // region Sign-in

    @Test
    fun signInStoresTheSessionAndShowsTheCard() = runTest {
        server.on(SIGN_IN) { json("""{"redirect":false,"token":"body-token-is-ignored"}""", authToken = "tok-1") }
        serveSignedInAccount(membership(memberNumber = "000042"))
        val h = harness()
        h.awaitRestore()
        assertEquals(AccountState.SignedOut, h.repository.state.value)

        val message = h.repository.signIn("  ${FakeMemberServer.EMAIL} ", "password1")

        assertEquals(AccountMessage.SignedIn, message)
        val state = signedIn(h.repository.state.value)
        // The member number is an opaque string: the leading zeros stay.
        assertEquals("000042", state.card?.memberNumber)
        assertFalse(state.isOffline)
        assertEquals(h.clock.instant(), state.syncedAt)
        assertEquals(FakeMemberServer.EMAIL, state.account.email)

        val signIn = server.requests(SIGN_IN).single().jsonBody()
        assertEquals(FakeMemberServer.EMAIL, signIn["email"]?.jsonPrimitive?.content)
        assertEquals("Bearer tok-1", server.requests(GET_SESSION).single().headers["Authorization"])
        val list = server.requests(LIST_MEMBERSHIPS).single()
        assertEquals("Bearer tok-1", list.headers["authorization"])
        assertEquals("users/me", ListMembershipsRequest.parseFrom(checkNotNull(list.body).toByteArray()).parent)

        val stored = checkNotNull(h.sessions.current())
        assertEquals("tok-1", stored.token)
        assertEquals(server.endpoint.origin, stored.origin)
        assertEquals("000042", h.cache.read(server.endpoint.origin, FakeMemberServer.USER_ID)?.card?.memberNumber)
        h.close()
    }

    @Test
    fun signInFailuresKeepTheUserSignedOut() = runTest {
        val h = harness()
        h.awaitRestore()
        val repository = h.repository

        assertEquals(AccountMessage.EmailAndPasswordRequired, repository.signIn("  ", "password1"))
        assertEquals(0, server.requestCount)

        server.on(SIGN_IN) { json("""{"code":"INVALID_EMAIL_OR_PASSWORD","message":"x"}""", code = 401) }
        assertEquals(AccountMessage.InvalidCredentials, repository.signIn(FakeMemberServer.EMAIL, "wrong-password"))

        server.on(SIGN_IN) { json("""{"code":"TOO_MANY_REQUESTS"}""", code = 429) }
        assertEquals(AccountMessage.TooManyRequests, repository.signIn(FakeMemberServer.EMAIL, "password1"))

        // 200 without the set-auth-token header breaks the contract.
        server.on(SIGN_IN) { json("""{"token":"body-token"}""") }
        assertEquals(AccountMessage.Failed(AccountAction.SIGN_IN), repository.signIn(FakeMemberServer.EMAIL, "password1"))

        assertEquals(AccountState.SignedOut, repository.state.value)
        assertNull(h.sessions.current())
        h.close()
    }

    @Test
    fun secondOperationWhileOneRunsDoesNothing() = runTest {
        server.on(SIGN_IN) {
            MockResponse.Builder()
                .code(401)
                .headersDelay(1, TimeUnit.SECONDS)
                .body("""{"code":"INVALID_EMAIL_OR_PASSWORD"}""")
                .build()
        }
        val h = harness()
        h.awaitRestore()

        val first = backgroundScope.async { h.repository.signIn(FakeMemberServer.EMAIL, "password1") }
        h.repository.busy.first { it }

        assertNull(h.repository.refresh())
        assertEquals(AccountMessage.InvalidCredentials, first.await())
        assertEquals(1, server.requests(SIGN_IN).size)
        assertTrue(server.requests(GET_SESSION).isEmpty())
        h.close()
    }

    // endregion

    // region Restore and refresh

    @Test
    fun launchShowsTheOfflineCopyWhenTheServerIsUnreachable() = runTest {
        val h = harness()
        h.seed(h.storedSession(), card = h.cardOf(membership(memberNumber = "000042")))
        server.close()

        h.awaitRestore()

        val state = signedIn(h.repository.state.value)
        assertEquals("000042", state.card?.memberNumber)
        assertTrue(state.isOffline)
        assertEquals(AccountHarness.SYNCED_AT, state.syncedAt)
        assertEquals(AccountMessage.OfflineShowingCard, h.repository.refresh())
        // A network failure keeps the session and the offline copy.
        assertEquals("tok-1", h.sessions.current()?.token)
        h.close()
    }

    @Test
    fun launchConfirmsTheCachedCardOnline() = runTest {
        serveSignedInAccount(membership(memberNumber = "000042", nickname = "新昵称"))
        val h = harness()
        h.seed(h.storedSession(), card = h.cardOf(membership(memberNumber = "000042")))

        h.awaitRestore()

        val state = signedIn(h.repository.state.value)
        assertFalse(state.isOffline)
        assertEquals("新昵称", state.card?.nickname)
        assertEquals(h.clock.instant(), state.syncedAt)
        assertEquals(AccountMessage.CardUpdated, h.repository.refresh())
        h.close()
    }

    @Test
    fun rejectedTokenClearsTheSessionAndTheCard() = runTest {
        server.on(GET_SESSION) { json("""{"code":"UNAUTHORIZED"}""", code = 401) }
        val h = harness()
        h.seed(h.storedSession(), card = h.cardOf(membership()))

        h.awaitRestore()

        assertEquals(AccountState.SignedOut, h.repository.state.value)
        assertNull(h.sessions.current())
        assertNull(h.cache.read(server.endpoint.origin, FakeMemberServer.USER_ID))
        // Signing out leaves no ciphertext behind.
        assertEquals(0L, h.sessionFile.length())
        assertEquals(0L, h.cacheFile.length())
        h.close()
    }

    @Test
    fun sessionThatTheServerNoLongerKnowsIsCleared() = runTest {
        // Better Auth returns the JSON literal null for an unknown or expired token.
        server.on(GET_SESSION) { json("null") }
        val h = harness()
        h.seed(h.storedSession())

        h.awaitRestore()

        assertEquals(AccountState.SignedOut, h.repository.state.value)
        assertEquals(AccountMessage.SignInRequired, h.repository.refresh())
        h.close()
    }

    @Test
    fun connectUnauthenticatedWithoutDetailsSignsOut() = runTest {
        server.on(GET_SESSION) { json(sessionJson()) }
        server.on(LIST_MEMBERSHIPS) { connectError("unauthenticated", 401) }
        val h = harness()
        h.seed(h.storedSession(), card = h.cardOf(membership()))

        h.awaitRestore()

        assertEquals(AccountState.SignedOut, h.repository.state.value)
        assertNull(h.sessions.current())
        h.close()
    }

    @Test
    fun emailNotVerifiedReasonDropsTheCard() = runTest {
        server.on(GET_SESSION) { json(sessionJson(emailVerified = true)) }
        server.on(LIST_MEMBERSHIPS) { connectError("permission_denied", 403, reason = "EMAIL_NOT_VERIFIED") }
        val h = harness()
        h.seed(h.storedSession(), card = h.cardOf(membership()))

        h.awaitRestore()

        val state = signedIn(h.repository.state.value)
        assertNull(state.card)
        assertFalse(state.account.emailVerified)
        assertNull(h.cache.read(server.endpoint.origin, FakeMemberServer.USER_ID))
        assertEquals(AccountMessage.EmailNotVerified, h.repository.refresh())
        // The session stays: the user can verify the email and refresh.
        assertEquals("tok-1", h.sessions.current()?.token)
        h.close()
    }

    @Test
    fun unverifiedAccountGetsNoCardRequest() = runTest {
        server.on(GET_SESSION) { json(sessionJson(emailVerified = false)) }
        server.on(LIST_MEMBERSHIPS) { proto(list(membership())) }
        val h = harness()
        h.seed(h.storedSession(emailVerified = false), card = h.cardOf(membership()))

        h.awaitRestore()

        val state = signedIn(h.repository.state.value)
        assertNull(state.card)
        assertTrue(server.requests(LIST_MEMBERSHIPS).isEmpty())
        assertEquals(0L, h.cacheFile.length())
        h.close()
    }

    // endregion

    // region Enrollment

    @Test
    fun enrollmentChecksTheFormBeforeAnyRequest() = runTest {
        serveSignedInAccount()
        val h = harness()
        h.seed(h.storedSession())
        h.awaitRestore()
        val all = MembershipRules.PLEDGES.toSet()

        assertEquals(
            AccountMessage.InvalidNickname(MembershipRules.NicknameProblem.EMPTY),
            h.repository.enroll("   ", all, acceptedTerms = true),
        )
        assertEquals(AccountMessage.TermsRequired, h.repository.enroll("小林", all - MembershipRules.Pledge.PACE, true))
        assertEquals(AccountMessage.TermsRequired, h.repository.enroll("小林", all, acceptedTerms = false))
        assertTrue(server.requests(CREATE_MEMBERSHIP).isEmpty())
        h.close()
    }

    @Test
    fun enrollmentSendsTheTrimmedNicknameAndShowsTheNewCard() = runTest {
        serveSignedInAccount()
        server.on(CREATE_MEMBERSHIP) { proto(membership(memberNumber = "000043", nickname = "小林")) }
        val h = harness()
        h.seed(h.storedSession())
        h.awaitRestore()
        assertNull(signedIn(h.repository.state.value).card)

        val message = h.repository.enroll("  小林 ", MembershipRules.PLEDGES.toSet(), acceptedTerms = true)

        assertEquals(AccountMessage.CardUpdated, message)
        assertEquals("000043", signedIn(h.repository.state.value).card?.memberNumber)
        val request = CreateMembershipRequest.parseFrom(checkNotNull(server.requests(CREATE_MEMBERSHIP).single().body).toByteArray())
        assertEquals("users/me", request.parent)
        assertEquals("小林", request.membership.nickname)
        assertEquals(MembershipRules.TERMS_VERSION, request.membership.termsVersion)
        // The server assigns the number.
        assertEquals("", request.membership.memberNumber)
        h.close()
    }

    @Test
    fun enrollmentWhenACardAlreadyExistsShowsIt() = runTest {
        serveSignedInAccount()
        server.on(CREATE_MEMBERSHIP) { connectError("already_exists", 409, reason = "MEMBERSHIP_ALREADY_EXISTS") }
        val h = harness()
        h.seed(h.storedSession())
        h.awaitRestore()
        // Another device claimed the card in the meantime.
        server.on(LIST_MEMBERSHIPS) { proto(list(membership(memberNumber = "000044"))) }

        val message = h.repository.enroll("小林", MembershipRules.PLEDGES.toSet(), acceptedTerms = true)

        assertEquals(AccountMessage.CardUpdated, message)
        assertEquals("000044", signedIn(h.repository.state.value).card?.memberNumber)
        h.close()
    }

    // endregion

    // region Sign in with Google

    @Test
    fun googleSignInIsOfferedOnlyWhenTheBuildAndTheServerEnableIt() = runTest {
        server.on(GET_SERVER_CONFIG) { proto(ServerConfig.newBuilder().setGoogleLoginEnabled(true).build()) }
        val h = harness()
        assertTrue(h.repository.isGoogleSignInAvailable())
        val request = GetServerConfigRequest.parseFrom(checkNotNull(server.requests(GET_SERVER_CONFIG).single().body).toByteArray())
        assertEquals("serverConfig", request.name)

        server.on(GET_SERVER_CONFIG) { proto(ServerConfig.getDefaultInstance()) }
        assertFalse(h.repository.isGoogleSignInAvailable())
        server.on(GET_SERVER_CONFIG) { connectError("unavailable", 503) }
        assertFalse(h.repository.isGoogleSignInAvailable())
        h.close()

        // A build without a client ID never asks the server.
        val requestsBefore = server.requestCount
        val withoutClientId = AccountHarness(dir, backgroundScope, server.endpoint, googleServerClientId = null)
        withoutClientId.awaitRestore()
        assertFalse(withoutClientId.repository.isGoogleSignInAvailable())
        assertEquals(AccountMessage.GoogleSignInUnavailable, withoutClientId.repository.signInWithGoogle("id-token", "nonce"))
        assertEquals(requestsBefore, server.requestCount)
        withoutClientId.close()
    }

    @Test
    fun googleSignInSendsTheTokenAndTheNonceAndStoresTheSession() = runTest {
        serveSignedInAccount(membership())
        server.on(SIGN_IN_SOCIAL) { json("""{"redirect":false,"token":"raw"}""", authToken = "tok-g") }
        val h = harness()
        h.awaitRestore()

        assertEquals(AccountMessage.SignedIn, h.repository.signInWithGoogle("google-id-token", "raw-nonce"))

        val body = server.requests(SIGN_IN_SOCIAL).single().jsonBody()
        assertEquals("google", body["provider"]!!.jsonPrimitive.content)
        val idToken = body["idToken"]!!.jsonObject
        assertEquals("google-id-token", idToken["token"]!!.jsonPrimitive.content)
        assertEquals("raw-nonce", idToken["nonce"]!!.jsonPrimitive.content)
        assertEquals("tok-g", h.sessions.current()?.token)
        assertEquals("000042", signedIn(h.repository.state.value).card?.memberNumber)
        h.close()
    }

    @Test
    fun rejectedGoogleSignInKeepsTheUserSignedOut() = runTest {
        val h = harness()
        h.awaitRestore()

        server.on(SIGN_IN_SOCIAL) { json("""{"code":"INVALID_TOKEN","message":"Invalid token"}""", code = 401) }
        assertEquals(AccountMessage.GoogleSignInRejected, h.repository.signInWithGoogle("bad", "nonce"))
        server.on(SIGN_IN_SOCIAL) { json("""{"code":"LINKING_NOT_ALLOWED","message":"Account not linked"}""", code = 401) }
        assertEquals(AccountMessage.EmailAccountExists, h.repository.signInWithGoogle("token", "nonce"))
        assertEquals(AccountMessage.GoogleSignInIncomplete, h.repository.signInWithGoogle(" ", "nonce"))

        assertEquals(2, server.requests(SIGN_IN_SOCIAL).size)
        assertEquals(AccountState.SignedOut, h.repository.state.value)
        assertNull(h.sessions.current())
        h.close()
    }

    // endregion

    // region Account security, sign-out and local data

    @Test
    fun changingThePasswordStoresTheNewToken() = runTest {
        serveSignedInAccount(membership())
        server.on(CHANGE_PASSWORD) { json("""{"token":"tok-2"}""", authToken = "tok-2") }
        val h = harness()
        h.seed(h.storedSession())
        h.awaitRestore()

        assertEquals(AccountMessage.SamePassword, h.repository.changePassword("password1", "password1"))
        assertEquals(AccountMessage.PasswordRules, h.repository.changePassword("password1", "short"))
        assertEquals(AccountMessage.PasswordChanged, h.repository.changePassword("password1", "password2"))

        val request = server.requests(CHANGE_PASSWORD).single()
        assertEquals("Bearer tok-1", request.headers["Authorization"])
        assertTrue(request.jsonBody()["revokeOtherSessions"]!!.jsonPrimitive.boolean)
        assertEquals("tok-2", h.sessions.current()?.token)
        assertEquals("Bearer tok-2", server.requests(GET_SESSION).last().headers["Authorization"])
        h.close()
    }

    @Test
    fun changingThePasswordWithoutANewTokenSignsOut() = runTest {
        serveSignedInAccount(membership())
        val h = harness()
        h.seed(h.storedSession())
        h.awaitRestore()

        server.on(CHANGE_PASSWORD) { json("""{"code":"INVALID_PASSWORD"}""", code = 400) }
        assertEquals(AccountMessage.WrongCurrentPassword, h.repository.changePassword("wrong-pass", "password2"))
        assertEquals("tok-1", h.sessions.current()?.token)

        server.on(CHANGE_PASSWORD) { json("""{"token":null}""") }
        assertEquals(AccountMessage.PasswordChangedSignInAgain, h.repository.changePassword("password1", "password2"))
        assertEquals(AccountState.SignedOut, h.repository.state.value)
        assertNull(h.sessions.current())
        h.close()
    }

    @Test
    fun requestingAccountDeletionSendsAnEmptyBodyAndKeepsTheSession() = runTest {
        serveSignedInAccount(membership())
        server.on(DELETE_USER) { json("""{"success":true,"message":"Verification email sent"}""") }
        val h = harness()
        h.seed(h.storedSession(), card = h.cardOf(membership()))
        h.awaitRestore()

        assertEquals(AccountMessage.DeletionCodeSent, h.repository.requestAccountDeletion())

        val request = server.requests(DELETE_USER).single()
        assertEquals("Bearer tok-1", request.headers["Authorization"])
        assertTrue(request.jsonBody().isEmpty())
        assertEquals("tok-1", h.sessions.current()?.token)
        assertEquals("000042", signedIn(h.repository.state.value).card?.memberNumber)
        h.close()
    }

    @Test
    fun changingTheEmailWaitsUntilTheSessionShowsTheNewAddress() = runTest {
        serveSignedInAccount(membership())
        server.on(CHANGE_EMAIL) { json("""{"status":true}""") }
        val h = harness()
        h.seed(h.storedSession(), card = h.cardOf(membership()))
        h.awaitRestore()

        assertEquals(
            AccountMessage.EmailChangeRequested(currentEmail = FakeMemberServer.EMAIL, newEmail = "New@Example.com"),
            h.repository.changeEmail("  New@Example.com "),
        )
        val request = server.requests(CHANGE_EMAIL).single()
        assertEquals("Bearer tok-1", request.headers["Authorization"])
        assertEquals("New@Example.com", request.jsonBody()["newEmail"]?.jsonPrimitive?.content)
        // The old address has not confirmed yet, so the session keeps it.
        assertEquals(FakeMemberServer.EMAIL, signedIn(h.repository.state.value).account.email)
        assertEquals(AccountMessage.EmailChangePending, h.repository.checkEmailChange("New@Example.com"))

        // The server lowercases the address.
        server.on(GET_SESSION) { json(sessionJson(email = "new@example.com")) }
        assertEquals(AccountMessage.EmailChanged("new@example.com"), h.repository.checkEmailChange("New@Example.com"))
        assertEquals("new@example.com", signedIn(h.repository.state.value).account.email)
        assertEquals("new@example.com", h.sessions.current()?.email)
        assertEquals("tok-1", h.sessions.current()?.token)
        h.close()
    }

    @Test
    fun emailChangeChecksTheAddressBeforeAnyRequest() = runTest {
        serveSignedInAccount()
        val h = harness()
        h.seed(h.storedSession())
        h.awaitRestore()

        assertEquals(AccountMessage.SameEmail, h.repository.changeEmail(FakeMemberServer.EMAIL.uppercase()))
        for (invalid in listOf("not-an-email", "a@b", "two words@example.com", "@example.com", "a@b@example.com")) {
            assertEquals(invalid, AccountMessage.InvalidNewEmail, h.repository.changeEmail(invalid))
        }
        assertTrue(server.requests(CHANGE_EMAIL).isEmpty())
        h.close()
    }

    @Test
    fun emailChangeNeedsAVerifiedEmail() = runTest {
        server.on(GET_SESSION) { json(sessionJson(emailVerified = false)) }
        val h = harness()
        h.seed(h.storedSession(emailVerified = false))
        h.awaitRestore()

        assertEquals(AccountMessage.VerifyEmailBeforeChange, h.repository.changeEmail("new@example.com"))
        assertTrue(server.requests(CHANGE_EMAIL).isEmpty())
        h.close()
    }

    @Test
    fun rejectedEmailChangeKeepsTheSession() = runTest {
        serveSignedInAccount()
        val h = harness()
        h.seed(h.storedSession())
        h.awaitRestore()

        server.on(CHANGE_EMAIL) { json("""{"code":"CHANGE_EMAIL_DISABLED","message":"x"}""", code = 400) }
        assertEquals(AccountMessage.EmailChangeDisabled, h.repository.changeEmail("new@example.com"))
        server.on(CHANGE_EMAIL) { json("""{"message":"Email is the same"}""", code = 400) }
        assertEquals(AccountMessage.EmailChangeRejected, h.repository.changeEmail("new@example.com"))
        server.on(CHANGE_EMAIL) { json("""{"code":"TOO_MANY_REQUESTS"}""", code = 429) }
        assertEquals(AccountMessage.TooManyRequests, h.repository.changeEmail("new@example.com"))

        assertEquals("tok-1", h.sessions.current()?.token)
        assertEquals(FakeMemberServer.EMAIL, signedIn(h.repository.state.value).account.email)
        h.close()
    }

    @Test
    fun deletingTheAccountSendsThePastedCodeAndClearsLocalData() = runTest {
        serveSignedInAccount(membership())
        server.on(DELETE_USER) { json("""{"success":true,"message":"User deleted"}""") }
        val h = harness()
        h.seed(h.storedSession(), card = h.cardOf(membership()))
        h.awaitRestore()

        assertEquals(AccountMessage.AccountDeleted, h.repository.deleteAccount("  7fb0fa42\n7383450f "))

        val request = server.requests(DELETE_USER).single()
        assertEquals("Bearer tok-1", request.headers["Authorization"])
        assertEquals("7fb0fa427383450f", request.jsonBody()["token"]!!.jsonPrimitive.content)
        assertEquals(AccountState.SignedOut, h.repository.state.value)
        assertNull(h.sessions.current())
        assertEquals(0L, h.cacheFile.length())
        h.close()
    }

    @Test
    fun wrongOrMissingDeletionCodeKeepsTheAccount() = runTest {
        serveSignedInAccount(membership())
        server.on(DELETE_USER) { json("""{"code":"INVALID_TOKEN","message":"Invalid token"}""", code = 404) }
        val h = harness()
        h.seed(h.storedSession(), card = h.cardOf(membership()))
        h.awaitRestore()

        assertEquals(AccountMessage.DeletionCodeRequired, h.repository.deleteAccount(" \n "))
        assertTrue(server.requests(DELETE_USER).isEmpty())

        assertEquals(AccountMessage.InvalidDeletionCode, h.repository.deleteAccount("000000"))
        assertEquals("tok-1", h.sessions.current()?.token)
        assertEquals("000042", signedIn(h.repository.state.value).card?.memberNumber)

        server.on(DELETE_USER) { json("""{"code":"UNAUTHORIZED","message":"Unauthorized"}""", code = 401) }
        assertEquals(AccountMessage.SessionExpired, h.repository.deleteAccount("000000"))
        assertEquals(AccountState.SignedOut, h.repository.state.value)
        h.close()
    }

    @Test
    fun signOutClearsLocalDataEvenWhenTheServerFails() = runTest {
        serveSignedInAccount(membership())
        server.on(SIGN_OUT) { json("""{"success":true}""") }
        val h = harness()
        h.seed(h.storedSession(), card = h.cardOf(membership()))
        h.awaitRestore()

        assertEquals(AccountMessage.SignedOut, h.repository.signOut())
        assertEquals("Bearer tok-1", server.requests(SIGN_OUT).single().headers["Authorization"])
        assertEquals(AccountState.SignedOut, h.repository.state.value)
        assertNull(h.sessions.current())

        h.seed(h.storedSession(token = "tok-3"), card = h.cardOf(membership()))
        server.on(SIGN_OUT) { json("""{"code":"INTERNAL"}""", code = 500) }
        assertEquals(AccountMessage.SignedOutLocally, h.repository.signOut())
        assertNull(h.sessions.current())
        assertEquals(0L, h.cacheFile.length())
        h.close()
    }

    @Test
    fun deletingLocalDataMakesNoRequestAndLeavesEmptyFiles() = runTest {
        serveSignedInAccount(membership())
        val h = harness()
        h.seed(h.storedSession(), card = h.cardOf(membership()))
        h.awaitRestore()
        val requestsBefore = server.requestCount

        assertTrue(h.repository.clearLocalData())

        assertEquals(requestsBefore, server.requestCount)
        assertEquals(AccountState.SignedOut, h.repository.state.value)
        assertEquals(0L, h.sessionFile.length())
        assertEquals(0L, h.cacheFile.length())
        h.close()
    }

    // endregion

    private fun AccountHarness.cardOf(proto: club.leanmuscle.boji.v1.Membership): MembershipCard = proto.toCard()
}
