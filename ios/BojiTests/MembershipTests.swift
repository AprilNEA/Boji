#if DEBUG
import Foundation
import XCTest
@testable import Boji

@MainActor
final class MembershipTests: XCTestCase {
    func testInvalidCardNamesNeverReachService() async {
        let transport = FakeTransport(responses: [])
        let store = makeStore(transport: transport)
        for name in ["", String(repeating: "名", count: 25), "昵称\n换行", "昵称\u{0000}"] {
            await store.enroll(displayName: name, acceptedTerms: true)
            XCTAssertNotNil(store.errorMessage)
            XCTAssertEqual(transport.requestCount, 0)
            XCTAssertNil(store.card)
        }
    }

    func testCachedCardRemainsUnverifiedDuringRestoreAndRetry() async {
        let account = verifiedAccount()
        let card = member(account: account)
        let cache = InMemoryMembershipCacheStore(initialRecord: MembershipCacheRecord(
            serviceOrigin: "https://example.test", account: account, card: card, lastSyncedAt: Date()
        ))
        let transport = PendingMembershipTransport()
        let store = MembershipStore.testing(serviceURL: URL(string: "https://example.test"), transport: transport,
                                            tokenStore: InMemoryMembershipTokenStore(initialToken: "stored-token"), cacheStore: cache)
        let restore = Task { await store.restore() }
        await transport.waitUntilEntered()
        XCTAssertEqual(store.card, card)
        XCTAssertTrue(store.isBusy)
        XCTAssertTrue(store.isOffline)
        await transport.fail()
        await restore.value

        await transport.reset()
        let refresh = Task { await store.refresh() }
        await transport.waitUntilEntered()
        XCTAssertTrue(store.isBusy)
        XCTAssertTrue(store.isOffline)
        await transport.fail()
        await refresh.value
        XCTAssertTrue(store.isOffline)
        XCTAssertFalse(store.isBusy)
    }

    func testEnrollmentRequiresTermsAndDoesNotSendRequest() async throws {
        let transport = FakeTransport(responses: [
            signInResponse(token: "token-1"),
            meResponse(verifiedAccount()),
            listResponse(nil)
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
            listResponse(nil),
            createResponse(serverCard),
            createResponse(updatedCard)
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
        XCTAssertEqual(transport.lastRequest?.url?.path, "/boji.v1.MembershipService/CreateMembership")
        XCTAssertEqual(transport.lastRequest?.httpMethod, "POST")
        XCTAssertEqual(transport.lastRequest?.value(forHTTPHeaderField: "Content-Type"), "application/proto")
        let request = try XCTUnwrap(MembershipRPCFixtures.createMembershipRequest(from: transport.lastRequest?.httpBody))
        XCTAssertEqual(request, MembershipRPCFixtures.CreateMembershipRequest(
            parent: "users/me",
            nickname: "客户端请求名称",
            termsVersion: "community-v1"
        ))
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
            listResponse(member(account: account))
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
        // Protobuf 时间戳以纳秒存储。固定的整秒时间可以无损往返。
        joinedAt: Date = Date(timeIntervalSince1970: 1_792_483_200),
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
            grantedEntitlements: ["local_tracking", "training_library", "progress_history"].map {
                MembershipEntitlement(id: nil, code: $0, name: $0, description: "", grantedAt: joinedAt, expiresAt: nil)
            },
            expiresAt: nil
        )
    }

    private func signInResponse(token: String) -> MembershipHTTPResponse {
        MembershipHTTPResponse(data: Data("{}".utf8), statusCode: 200, headers: ["set-auth-token": token])
    }

    private func meResponse(_ account: MembershipAccount) -> MembershipHTTPResponse {
        let object: [String: Any] = [
            "user": ["id": account.id, "name": account.name, "email": account.email, "emailVerified": account.emailVerified],
            "session": [
                "id": "session-1",
                "userId": account.id,
                "createdAt": MembershipDateCoding.string(from: Date().addingTimeInterval(-60)),
                "expiresAt": MembershipDateCoding.string(from: Date().addingTimeInterval(3600))
            ]
        ]
        let data = try! JSONSerialization.data(withJSONObject: object)
        return MembershipHTTPResponse(data: data, statusCode: 200)
    }

    /// `ListMemberships` 的响应。nil 表示没有会员卡。
    private func listResponse(_ member: ClubMember?) -> MembershipHTTPResponse {
        MembershipRPCFixtures.memberships(member.map { [$0] } ?? [])
    }

    /// `CreateMembership` 的响应。
    private func createResponse(_ member: ClubMember) -> MembershipHTTPResponse {
        MembershipRPCFixtures.membership(member)
    }

    private func errorResponse(statusCode: Int, code: String) -> MembershipHTTPResponse {
        MembershipHTTPResponse(
            data: Data("{\"code\":\"\(code)\",\"message\":\"server message\"}".utf8),
            statusCode: statusCode
        )
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

private actor PendingMembershipTransport: MembershipTransport {
    private var continuation: CheckedContinuation<MembershipHTTPResponse, Error>?
    private var waiting: CheckedContinuation<Void, Never>?
    private var entered = false

    func send(_ request: URLRequest) async throws -> MembershipHTTPResponse {
        entered = true
        waiting?.resume()
        waiting = nil
        return try await withCheckedThrowingContinuation { continuation = $0 }
    }

    func waitUntilEntered() async {
        if entered { return }
        await withCheckedContinuation { waiting = $0 }
    }

    func fail() {
        continuation?.resume(throwing: URLError(.notConnectedToInternet))
        continuation = nil
    }

    func reset() { entered = false }
}
#endif
