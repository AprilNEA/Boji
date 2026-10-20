#if DEBUG
import Foundation
import XCTest
@testable import Boji

@MainActor
final class MembershipTests: XCTestCase {
    func testEnrollmentRequiresTermsAndDoesNotSendRequest() async throws {
        let transport = FakeTransport(responses: [
            signInResponse(token: "token-1"),
            meResponse(verifiedAccount()),
            membershipResponse(nil)
        ])
        let store = makeStore(transport: transport)

        await store.signIn(email: "member@example.com", password: "password")
        let requestsBeforeEnrollment = transport.requestCount
        await store.enroll(displayName: "会员", acceptedTerms: false)

        XCTAssertEqual(transport.requestCount, requestsBeforeEnrollment)
        XCTAssertEqual(store.errorMessage, "请先同意社区会员条款。")
    }

    func testEnrollmentUsesLatestOpaqueServerResponse() async throws {
        let account = verifiedAccount()
        let joinedAt = try XCTUnwrap(MembershipDateCoding.parse("2026-10-20T08:00:00.125Z"))
        let serverCard = member(account: account, displayName: "服务端名称", joinedAt: joinedAt)
        let updatedCard = member(account: account, displayName: "服务端最新名称", joinedAt: joinedAt, memberNumber: "00sample-next")
        let transport = FakeTransport(responses: [
            signInResponse(token: "token-1"),
            meResponse(account),
            membershipResponse(nil),
            membershipResponse(serverCard),
            membershipResponse(updatedCard)
        ])
        let store = makeStore(transport: transport)

        await store.signIn(email: account.email, password: "password")
        await store.enroll(displayName: "客户端昵称", acceptedTerms: true)
        XCTAssertEqual(store.card, serverCard)
        await store.enroll(displayName: "客户端请求名称", acceptedTerms: true)

        XCTAssertEqual(store.card, updatedCard)
        XCTAssertEqual(store.card?.memberNumber, "00sample-next")
        XCTAssertEqual(store.card?.displayName, "服务端最新名称")
        XCTAssertEqual(store.card?.joinedAt, joinedAt)
        XCTAssertEqual(store.card?.status, "active")
        XCTAssertEqual(transport.requestCount, 5)
        XCTAssertEqual(transport.lastRequest?.url?.path, "/api/membership/enroll")
        let body = try XCTUnwrap(transport.lastRequest?.httpBody)
        let request = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: String])
        XCTAssertEqual(request["termsVersion"], "community-v1")
    }

    func testUnverifiedLoginDoesNotStoreToken() async {
        let tokenStore = InMemoryMembershipTokenStore()
        let transport = FakeTransport(responses: [
            errorResponse(statusCode: 403, code: "EMAIL_NOT_VERIFIED")
        ])
        let store = makeStore(transport: transport, tokenStore: tokenStore)

        await store.signIn(email: "member@example.com", password: "password")

        XCTAssertNil(tokenStore.loadToken())
        XCTAssertNil(store.account)
        XCTAssertTrue(store.requiresEmailVerification)
        XCTAssertEqual(store.errorMessage, "邮箱尚未验证，请先完成验证。")
    }

    func testUnauthorizedRefreshClearsTokenAndCachedIdentity() async throws {
        let account = verifiedAccount()
        let cache = InMemoryMembershipCacheStore(initialRecord: MembershipCacheRecord(
            serviceOrigin: "https://example.test",
            account: account,
            card: member(account: account),
            lastSyncedAt: Date()
        ))
        let tokenStore = InMemoryMembershipTokenStore(initialToken: "old-token")
        let transport = FakeTransport(responses: [
            errorResponse(statusCode: 401, code: "UNAUTHORIZED")
        ])
        let store = makeStore(
            transport: transport,
            tokenStore: tokenStore,
            cacheStore: cache,
            serviceURL: URL(string: "https://example.test")
        )

        await store.restore()

        XCTAssertNil(tokenStore.loadToken())
        XCTAssertNil(cache.snapshot())
        XCTAssertNil(store.account)
        XCTAssertNil(store.card)
        XCTAssertEqual(store.errorMessage, "登录已失效，请重新登录。")
    }

    func testOfflineRestoreRetainsMatchingCachedCard() async throws {
        let account = verifiedAccount()
        let cachedCard = member(account: account)
        let cache = InMemoryMembershipCacheStore(initialRecord: MembershipCacheRecord(
            serviceOrigin: "https://example.test",
            account: account,
            card: cachedCard,
            lastSyncedAt: Date()
        ))
        let transport = FakeTransport(failure: FakeTransportFailure.offline)
        let store = makeStore(
            transport: transport,
            tokenStore: InMemoryMembershipTokenStore(initialToken: "stored-token"),
            cacheStore: cache,
            serviceURL: URL(string: "https://example.test")
        )

        await store.restore()

        XCTAssertEqual(store.account, account)
        XCTAssertEqual(store.card, cachedCard)
        XCTAssertTrue(store.isOffline)
        XCTAssertEqual(store.errorMessage, "网络不可用，正在显示本地会员卡。")
    }

    func testMismatchedCachedCardIsDiscarded() async {
        let account = verifiedAccount()
        let wrongCard = ClubMember(
            id: "membership-1",
            userId: "another-user",
            memberNumber: "sample-member",
            displayName: "错误账户",
            joinedAt: Date(),
            tier: "community",
            status: "active",
            entitlements: [],
            expiresAt: nil
        )
        let cache = InMemoryMembershipCacheStore(initialRecord: MembershipCacheRecord(
            serviceOrigin: "https://example.test",
            account: account,
            card: wrongCard,
            lastSyncedAt: Date()
        ))
        let store = makeStore(
            transport: FakeTransport(failure: FakeTransportFailure.offline),
            tokenStore: InMemoryMembershipTokenStore(initialToken: "stored-token"),
            cacheStore: cache,
            serviceURL: URL(string: "https://example.test")
        )

        await store.restore()

        XCTAssertNil(store.account)
        XCTAssertNil(store.card)
        XCTAssertNil(cache.snapshot())
    }

    func testSignOutClearsOnlyLocalSession() async throws {
        let account = verifiedAccount()
        let cache = InMemoryMembershipCacheStore(initialRecord: MembershipCacheRecord(
            serviceOrigin: "https://example.test",
            account: account,
            card: member(account: account),
            lastSyncedAt: Date()
        ))
        let tokenStore = InMemoryMembershipTokenStore(initialToken: "stored-token")
        let transport = FakeTransport(responses: [MembershipHTTPResponse(data: Data("{}".utf8), statusCode: 200)])
        let store = makeStore(
            transport: transport,
            tokenStore: tokenStore,
            cacheStore: cache,
            serviceURL: URL(string: "https://example.test")
        )

        await store.signOut()

        XCTAssertNil(tokenStore.loadToken())
        XCTAssertNil(cache.snapshot())
        XCTAssertEqual(transport.requestCount, 1)
        XCTAssertEqual(transport.lastRequest?.url?.path, "/api/auth/sign-out")
        XCTAssertEqual(store.notice, "已退出登录。")
    }

    func testFractionalISO8601MembershipDateDecodes() throws {
        let json = """
        {
          "id":"membership-1",
          "userId":"user-1",
          "memberNumber":"sample-member",
          "displayName":"测试",
          "joinedAt":"2026-10-20T08:00:00.123Z",
          "tier":"community",
          "status":"active",
          "entitlements":["local_tracking"],
          "expiresAt":null
        }
        """

        let card = try MembershipDateCoding.decoder().decode(ClubMember.self, from: Data(json.utf8))

        XCTAssertEqual(card.joinedAt.timeIntervalSince1970, 1_792_483_200.123, accuracy: 0.001)
        XCTAssertTrue(card.isActive)
    }

    func testMemberNumberRoundTripsWithoutFormatAssumptions() throws {
        for value in ["00opaque-example", "sample/member-x", "opaque-value-with-a-different-length"] {
            let original = member(account: verifiedAccount(), memberNumber: value)
            let data = try MembershipDateCoding.encoder().encode(original)
            let decoded = try MembershipDateCoding.decoder().decode(ClubMember.self, from: data)
            XCTAssertEqual(decoded.memberNumber, value)
        }
    }

    func testRegisterDoesNotCreateLoginSession() async {
        let tokenStore = InMemoryMembershipTokenStore()
        let transport = FakeTransport(responses: [MembershipHTTPResponse(data: Data("{\"token\":null}".utf8), statusCode: 200)])
        let store = makeStore(transport: transport, tokenStore: tokenStore)

        await store.register(name: "新用户", email: "new@example.com", password: "password")

        XCTAssertNil(tokenStore.loadToken())
        XCTAssertNil(store.account)
        XCTAssertNil(store.card)
        XCTAssertTrue(store.requiresEmailVerification)
        XCTAssertEqual(store.notice, "注册成功，请在邮箱完成验证后登录。")
        XCTAssertEqual(transport.requestCount, 1)
    }

    func testAuthenticationTokenUsesTokenStoreAndNeverCache() async throws {
        let account = verifiedAccount()
        let cache = InMemoryMembershipCacheStore()
        let tokenStore = InMemoryMembershipTokenStore()
        let transport = FakeTransport(responses: [
            signInResponse(token: "super-secret-token"),
            meResponse(account),
            membershipResponse(member(account: account))
        ])
        let store = makeStore(transport: transport, tokenStore: tokenStore, cacheStore: cache)

        await store.signIn(email: account.email, password: "password")

        XCTAssertEqual(tokenStore.loadToken(), "super-secret-token")
        let cacheData = try MembershipDateCoding.encoder().encode(try XCTUnwrap(cache.snapshot()))
        XCTAssertFalse(String(decoding: cacheData, as: UTF8.self).contains("super-secret-token"))
        XCTAssertEqual(transport.lastRequest?.value(forHTTPHeaderField: "Authorization"), "Bearer super-secret-token")
    }

    func testUnconfiguredServiceDoesNotRequestOrSimulateSuccess() async {
        let transport = FakeTransport(responses: [])
        let store = MembershipStore.testing(serviceURL: nil, transport: transport)

        await store.refresh()

        XCTAssertFalse(store.isConfigured)
        XCTAssertEqual(store.errorMessage, "会员服务尚未配置。")
        XCTAssertEqual(transport.requestCount, 0)
        XCTAssertNil(store.account)
        XCTAssertNil(store.card)
    }

    private func makeStore(
        transport: FakeTransport,
        tokenStore: InMemoryMembershipTokenStore = InMemoryMembershipTokenStore(),
        cacheStore: InMemoryMembershipCacheStore = InMemoryMembershipCacheStore(),
        serviceURL: URL? = URL(string: "https://example.test")
    ) -> MembershipStore {
        MembershipStore.testing(
            serviceURL: serviceURL,
            transport: transport,
            tokenStore: tokenStore,
            cacheStore: cacheStore
        )
    }

    private func verifiedAccount() -> MembershipAccount {
        MembershipAccount(id: "user-1", name: "会员", email: "member@example.com", emailVerified: true)
    }

    private func member(
        account: MembershipAccount,
        displayName: String = "会员",
        joinedAt: Date = Date(),
        memberNumber: String = "sample-member"
    ) -> ClubMember {
        ClubMember(
            id: "membership-1",
            userId: account.id,
            memberNumber: memberNumber,
            displayName: displayName,
            joinedAt: joinedAt,
            tier: "community",
            status: "active",
            entitlements: ["local_tracking", "training_library", "progress_history"],
            expiresAt: nil
        )
    }

    private func signInResponse(token: String) -> MembershipHTTPResponse {
        MembershipHTTPResponse(data: Data("{}".utf8), statusCode: 200, headers: ["set-auth-token": token])
    }

    private func meResponse(_ account: MembershipAccount) -> MembershipHTTPResponse {
        let data = try! MembershipDateCoding.encoder().encode(MePayload(user: account))
        return MembershipHTTPResponse(data: data, statusCode: 200)
    }

    private func membershipResponse(_ member: ClubMember?) -> MembershipHTTPResponse {
        let data = try! MembershipDateCoding.encoder().encode(MembershipPayload(membership: member))
        return MembershipHTTPResponse(data: data, statusCode: 200)
    }

    private func errorResponse(statusCode: Int, code: String) -> MembershipHTTPResponse {
        MembershipHTTPResponse(
            data: Data("{\"code\":\"\(code)\",\"message\":\"server message\"}".utf8),
            statusCode: statusCode
        )
    }

    private struct MePayload: Encodable {
        let user: MembershipAccount
    }

    private struct MembershipPayload: Encodable {
        let membership: ClubMember?
    }
}

private enum FakeTransportFailure: Error {
    case offline
}

private final class FakeTransport: MembershipTransport, @unchecked Sendable {
    private let lock = NSLock()
    private var queuedResponses: [Result<MembershipHTTPResponse, Error>]
    private var storedRequests: [URLRequest] = []

    init(responses: [MembershipHTTPResponse]) {
        queuedResponses = responses.map(Result.success)
    }

    init(failure: Error) {
        queuedResponses = [.failure(failure)]
    }

    var requestCount: Int {
        lock.lock()
        defer { lock.unlock() }
        return storedRequests.count
    }

    var lastRequest: URLRequest? {
        lock.lock()
        defer { lock.unlock() }
        return storedRequests.last
    }

    func send(_ request: URLRequest) async throws -> MembershipHTTPResponse {
        let response = lock.withLock {
            storedRequests.append(request)
            return queuedResponses.isEmpty
                ? Result<MembershipHTTPResponse, Error>.failure(FakeTransportFailure.offline)
                : queuedResponses.removeFirst()
        }
        return try response.get()
    }
}
#endif
