import Foundation
import XCTest
@testable import Boji

@MainActor
final class AuthSecurityStoreTests: XCTestCase {
    func testInvalidLoginHasCredentialErrorInsteadOfExpiredSession() async {
        let transport = SecurityTestTransport([response(401, ["code": "INVALID_EMAIL_OR_PASSWORD"])])
        let store = makeStore(transport)
        await store.signIn(email: "member@example.test", password: "invalid-password")
        XCTAssertEqual(store.errorMessage, "邮箱或密码不正确，请检查后重试。")
        XCTAssertNil(store.account)
    }

    func testRejectedIssuedTokenIsClearedRatherThanReportedAsWrongPassword() async {
        let tokenStore = InMemoryMembershipTokenStore()
        let transport = SecurityTestTransport([
            response(200, ["token": "raw"], headers: ["set-auth-token": "rejected.signed-token"]),
            response(401, ["code": "UNAUTHORIZED"])
        ])
        let store = makeStore(transport, tokenStore: tokenStore)
        await store.signIn(email: "member@example.test", password: "old-password")
        XCTAssertNil(tokenStore.loadToken())
        XCTAssertNil(store.account)
        XCTAssertEqual(store.errorMessage, "登录已失效，请重新登录。")
    }

    func testNullSessionClearsExistingAuthentication() async {
        let tokenStore = InMemoryMembershipTokenStore()
        let transport = SecurityTestTransport(loginResponses() + [MembershipHTTPResponse(data: Data("null".utf8), statusCode: 200)])
        let store = makeStore(transport, tokenStore: tokenStore)
        await login(store)
        await store.refreshAuthSession()
        XCTAssertNil(tokenStore.loadToken())
        XCTAssertNil(store.account)
        XCTAssertNil(store.authSession)
    }

    func testPasswordChangeUsesRotatedSignedHeader() async {
        let tokenStore = InMemoryMembershipTokenStore()
        let transport = SecurityTestTransport(loginResponses() + [response(200, ["token": "never-use-this-raw-token"], headers: ["set-auth-token": "rotated.signed%2Btoken"]), sessionResponse()])
        let store = makeStore(transport, tokenStore: tokenStore)
        await login(store)
        let changed = await store.changePassword(currentPassword: "old-password", newPassword: "new-password")
        XCTAssertTrue(changed)
        XCTAssertEqual(tokenStore.loadToken(), "rotated.signed%2Btoken")
        XCTAssertEqual(transport.requests.last?.value(forHTTPHeaderField: "Authorization"), "Bearer rotated.signed%2Btoken")
        XCTAssertNotNil(store.authSession)
    }

    func testPasswordChangeWithoutSignedHeaderRequiresLogin() async {
        let tokenStore = InMemoryMembershipTokenStore()
        let transport = SecurityTestTransport(loginResponses() + [response(200, ["token": "raw-token"])])
        let store = makeStore(transport, tokenStore: tokenStore)
        await login(store)
        let changed = await store.changePassword(currentPassword: "old-password", newPassword: "new-password")
        XCTAssertTrue(changed)
        XCTAssertNil(tokenStore.loadToken())
        XCTAssertNil(store.account)
        XCTAssertEqual(store.notice, "密码已修改，请使用新密码重新登录。")
    }

    func testWrongCurrentPasswordDoesNotDestroySession() async {
        let tokenStore = InMemoryMembershipTokenStore()
        let transport = SecurityTestTransport(loginResponses() + [response(400, ["code": "INVALID_PASSWORD"])])
        let store = makeStore(transport, tokenStore: tokenStore)
        await login(store)
        let changed = await store.changePassword(currentPassword: "wrong-password", newPassword: "new-password")
        XCTAssertFalse(changed)
        XCTAssertEqual(tokenStore.loadToken(), "original.signed-token")
        XCTAssertNotNil(store.account)
        XCTAssertEqual(store.errorMessage, "当前密码不正确，请重新输入。")
    }

    func testRevokeOthersPreservesCurrentAuthentication() async throws {
        let tokenStore = InMemoryMembershipTokenStore()
        let transport = SecurityTestTransport(loginResponses() + [response(200, ["status": true])])
        let store = makeStore(transport, tokenStore: tokenStore)
        await login(store)
        let revoked = await store.revokeOtherSessions()
        XCTAssertTrue(revoked)
        XCTAssertEqual(tokenStore.loadToken(), "original.signed-token")
        XCTAssertNotNil(store.account)
        let request = try XCTUnwrap(transport.requests.last)
        XCTAssertEqual(request.url?.path, "/api/auth/revoke-other-sessions")
        let body = try XCTUnwrap(request.httpBody)
        XCTAssertEqual((try JSONSerialization.jsonObject(with: body) as? [String: String])?.count, 0)
    }

    func testRateLimitIsNotReportedAsNetworkOrExpiredSession() async {
        let tokenStore = InMemoryMembershipTokenStore()
        let transport = SecurityTestTransport(loginResponses() + [response(429, ["code": "TOO_MANY_REQUESTS"])])
        let store = makeStore(transport, tokenStore: tokenStore)
        await login(store)
        _ = await store.revokeOtherSessions()
        XCTAssertEqual(store.errorMessage, "操作过于频繁，请稍后再试。")
        XCTAssertFalse(store.isOffline)
        XCTAssertEqual(tokenStore.loadToken(), "original.signed-token")
    }

    func testInvalidNewPasswordSendsNoMutation() async {
        let transport = SecurityTestTransport(loginResponses())
        let store = makeStore(transport)
        await login(store)
        let changed = await store.changePassword(currentPassword: "old-password", newPassword: "short")
        XCTAssertFalse(changed)
        XCTAssertEqual(transport.requests.count, 3)
    }

    private func makeStore(_ transport: SecurityTestTransport, tokenStore: InMemoryMembershipTokenStore = .init()) -> MembershipStore {
        MembershipStore.testing(serviceURL: URL(string: "https://auth.example.test"), transport: transport, tokenStore: tokenStore)
    }
    private func login(_ store: MembershipStore) async {
        await store.signIn(email: "member@example.test", password: "old-password")
        XCTAssertNotNil(store.account)
    }
    private var user: [String: Any] {
        ["id": "user-1", "name": "测试会员", "email": "member@example.test", "emailVerified": true]
    }
    private func loginResponses() -> [MembershipHTTPResponse] {
        [response(200, ["token": "raw-token"], headers: ["set-auth-token": "original.signed-token"]), response(200, ["user": user]), response(200, ["membership": NSNull()])]
    }
    private func sessionResponse() -> MembershipHTTPResponse {
        response(200, ["user": user, "session": ["id": "session-1", "userId": "user-1", "token": "do-not-persist", "createdAt": MembershipDateCoding.string(from: Date().addingTimeInterval(-60)), "expiresAt": MembershipDateCoding.string(from: Date().addingTimeInterval(3600))]])
    }
    private func response(_ status: Int, _ object: [String: Any], headers: [String: String] = [:]) -> MembershipHTTPResponse {
        MembershipHTTPResponse(data: try! JSONSerialization.data(withJSONObject: object), statusCode: status, headers: headers)
    }
}

private final class SecurityTestTransport: MembershipTransport, @unchecked Sendable {
    private let lock = NSLock()
    private var responses: [MembershipHTTPResponse]
    private var recorded: [URLRequest] = []
    init(_ responses: [MembershipHTTPResponse]) { self.responses = responses }
    var requests: [URLRequest] { lock.withLock { recorded } }
    func send(_ request: URLRequest) async throws -> MembershipHTTPResponse {
        try lock.withLock {
            recorded.append(request)
            guard !responses.isEmpty else { throw MembershipAPIError.network }
            return responses.removeFirst()
        }
    }
}
