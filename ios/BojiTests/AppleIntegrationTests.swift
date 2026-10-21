#if DEBUG
import Foundation
import XCTest
@testable import Boji

@MainActor
final class AppleIntegrationTests: XCTestCase {
    func testNonceIsRandomAndHasExpectedHashLength() throws {
        let first = try AppleSignInNonce()
        let second = try AppleSignInNonce()
        XCTAssertEqual(first.rawValue.count, 64)
        XCTAssertEqual(first.sha256.count, 64)
        XCTAssertNotEqual(first.rawValue, second.rawValue)
        XCTAssertNotEqual(first.sha256, first.rawValue)
        XCTAssertTrue(first.sha256.allSatisfy { $0.isHexDigit })
    }

    func testAppleRequestUsesRawNonceAndOpaqueSessionToken() async throws {
        let nonce = try AppleSignInNonce()
        let transport = AppleCaptureTransport([response("{}", headers: ["set-auth-token": "opaque.signed+token"])])
        let token = try await api(transport).signInWithApple(AppleIdentity(token: "identity-jwt", nonce: nonce.rawValue, firstName: "会员", lastName: nil))
        XCTAssertEqual(token, "opaque.signed+token")
        let request = try XCTUnwrap(transport.last)
        XCTAssertEqual(request.url?.path, "/api/auth/sign-in/social")
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: XCTUnwrap(request.httpBody)) as? [String: Any])
        XCTAssertEqual(json["provider"] as? String, "apple")
        let identity = try XCTUnwrap(json["idToken"] as? [String: Any])
        XCTAssertEqual(identity["nonce"] as? String, nonce.rawValue)
        XCTAssertNotEqual(identity["nonce"] as? String, nonce.sha256)
        XCTAssertNil(identity["email"])
    }

    func testCapabilitiesUseServerConfigWithoutSession() async throws {
        let transport = AppleCaptureTransport([MembershipRPCFixtures.serverConfig(appleSignIn: true, walletPass: false)])
        let capabilities = try await api(transport).capabilities()
        XCTAssertEqual(capabilities, MembershipCapabilities(appleSignIn: true, walletPass: false))
        let request = try XCTUnwrap(transport.last)
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.url?.absoluteString, "https://example.test/boji.v1.SystemService/GetServerConfig")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/proto")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Connect-Protocol-Version"), "1")
        XCTAssertNil(request.value(forHTTPHeaderField: "Authorization"))
    }

    func testCapabilitiesFailureDoesNotEnableAppleServices() async {
        let transport = AppleCaptureTransport([response("{}", status: 503)])
        let store = MembershipStore.testing(serviceURL: URL(string: "https://example.test"), transport: transport)
        await store.loadCapabilities()
        XCTAssertNil(store.capabilities)
        XCTAssertNotNil(store.capabilitiesError)
        await store.signInWithApple(AppleIdentity(token: "id", nonce: "nonce", firstName: nil, lastName: nil))
        XCTAssertNil(store.account)
        XCTAssertEqual(transport.count, 1)
    }

    func testAppleLoginReusesMembershipSessionFlow() async throws {
        let transport = AppleCaptureTransport([
            MembershipRPCFixtures.serverConfig(appleSignIn: true, walletPass: false),
            response("{}", headers: ["set-auth-token": "new-session"]),
            sessionResponse(userID: "apple-user", name: nil),
            MembershipRPCFixtures.memberships([])
        ])
        let tokens = InMemoryMembershipTokenStore()
        let store = MembershipStore.testing(serviceURL: URL(string: "https://example.test"), transport: transport, tokenStore: tokens)
        await store.loadCapabilities()
        await store.signInWithApple(AppleIdentity(token: "id", nonce: "nonce", firstName: nil, lastName: nil))
        XCTAssertEqual(store.account?.id, "apple-user")
        XCTAssertEqual(store.account?.name, "")
        XCTAssertEqual(tokens.loadToken(), "new-session")
        XCTAssertNil(store.errorMessage)
        XCTAssertEqual(transport.last?.url?.path, "/boji.v1.MembershipService/ListMemberships")
        XCTAssertEqual(transport.last?.value(forHTTPHeaderField: "Authorization"), "Bearer new-session")
        XCTAssertEqual(MembershipRPCFixtures.listMembershipsParent(from: transport.last?.httpBody), "users/me")
    }

    func testAppleLoginErrorsExplainTheCause() async {
        let cases: [(MembershipHTTPResponse, String)] = [
            (response("{\"code\":\"LINKING_NOT_ALLOWED\"}", status: 401), "这个邮箱已有俱乐部账号。请用邮箱和密码登录。"),
            (response("{\"code\":\"LINKING_DIFFERENT_EMAILS_NOT_ALLOWED\"}", status: 401), "这个邮箱已有俱乐部账号。请用邮箱和密码登录。"),
            (response("{\"code\":\"USER_EMAIL_NOT_FOUND\"}", status: 401), "Apple 没有提供邮箱，无法创建账号。请在 iPhone 设置中停止此 App 使用 Apple 登录，然后重试。"),
            (response("{\"code\":\"INVALID_TOKEN\"}", status: 401), "Apple 登录校验失败，请重新尝试。"),
            (response("{\"code\":\"PROVIDER_NOT_FOUND\"}", status: 404), "Apple 登录失败。若已有邮箱账号，请先使用原方式登录。")
        ]
        for (failure, message) in cases {
            let transport = AppleCaptureTransport([MembershipRPCFixtures.serverConfig(appleSignIn: true, walletPass: false), failure])
            let tokens = InMemoryMembershipTokenStore()
            let store = MembershipStore.testing(serviceURL: URL(string: "https://example.test"), transport: transport, tokenStore: tokens)
            await store.loadCapabilities()
            await store.signInWithApple(AppleIdentity(token: "id", nonce: "nonce", firstName: nil, lastName: nil))
            XCTAssertEqual(store.errorMessage, message)
            XCTAssertNil(store.account)
            XCTAssertNil(tokens.loadToken())
            XCTAssertEqual(transport.count, 2)
        }
    }

    func testWalletRequiresExpectedMIMETypeAndBoundedData() async {
        let invalid = [
            MembershipRPCFixtures.pass(Data([0x50, 0x4b]), mimeType: "application/json"),
            MembershipRPCFixtures.pass(Data()),
            MembershipRPCFixtures.pass(Data(repeating: 0, count: MembershipRPCClient.maxPassBytes + 1))
        ]
        for response in invalid {
            do {
                _ = try await api(AppleCaptureTransport([response])).walletPass(membershipID: "membership-1", token: "token")
                XCTFail("Invalid wallet response was accepted")
            } catch { XCTAssertEqual(error as? MembershipAPIError, .invalidResponse) }
        }
    }

    func testWalletRejectsMembershipIDThatChangesThePassName() async {
        let transport = AppleCaptureTransport([])
        for id in ["", "membership-1/pass", "../other"] {
            do {
                _ = try await api(transport).walletPass(membershipID: id, token: "token")
                XCTFail("A membership ID with a path separator was accepted")
            } catch { XCTAssertEqual(error as? MembershipAPIError, .invalidResponse) }
        }
        XCTAssertEqual(transport.count, 0)
    }

    func testWalletUnconfiguredResponseDoesNotReturnFakePass() async {
        do {
            _ = try await api(AppleCaptureTransport([MembershipRPCFixtures.error(.failedPrecondition, reason: "WALLET_NOT_CONFIGURED")]))
                .walletPass(membershipID: "membership-1", token: "token")
            XCTFail("An unconfigured signing service must fail")
        } catch { XCTAssertEqual(error as? MembershipAPIError, .server(statusCode: 400, code: "WALLET_NOT_CONFIGURED")) }
    }

    func testWalletUsesBearerAndRequestsPassByName() async throws {
        let bytes = Data([0x50, 0x4b, 0x03, 0x04]) // Transport fixture, not a signed Wallet pass.
        let transport = AppleCaptureTransport([MembershipRPCFixtures.pass(bytes)])
        let data = try await api(transport).walletPass(membershipID: "membership-1", token: "session")
        XCTAssertEqual(data, bytes)
        XCTAssertEqual(transport.last?.url?.path, "/boji.v1.WalletService/GetMembershipPass")
        XCTAssertEqual(transport.last?.value(forHTTPHeaderField: "Authorization"), "Bearer session")
        XCTAssertEqual(MembershipRPCFixtures.membershipPassName(from: transport.last?.httpBody), "users/me/memberships/membership-1/pass")
    }

    func testWalletNotConfiguredHidesWalletEntry() async throws {
        let card = ClubMember(
            id: "membership-1",
            userId: "user-1",
            memberNumber: "sample-member",
            displayName: "会员",
            joinedAt: Date(timeIntervalSince1970: 1_792_483_200),
            tier: "community",
            status: "active",
            grantedEntitlements: [],
            expiresAt: nil
        )
        let transport = AppleCaptureTransport([
            MembershipRPCFixtures.serverConfig(appleSignIn: true, walletPass: true),
            response("{}", headers: ["set-auth-token": "session"]),
            sessionResponse(userID: "user-1", name: "会员"),
            MembershipRPCFixtures.memberships([card]),
            MembershipRPCFixtures.error(.failedPrecondition, reason: "WALLET_NOT_CONFIGURED")
        ])
        let store = MembershipStore.testing(serviceURL: URL(string: "https://example.test"), transport: transport)
        await store.loadCapabilities()
        await store.signIn(email: "member@example.test", password: "password-1")
        XCTAssertEqual(store.card, card)

        let data = await store.walletPassData()

        XCTAssertNil(data)
        XCTAssertEqual(store.capabilities, MembershipCapabilities(appleSignIn: true, walletPass: false))
        XCTAssertEqual(store.errorMessage, "Wallet 签发服务尚未配置。")
        XCTAssertNotNil(store.account)
    }

    private func api(_ transport: AppleCaptureTransport) -> MembershipAPI {
        MembershipAPI(configuration: MembershipServiceConfiguration(validating: "https://example.test", allowLoopbackHTTP: false), transport: transport)
    }
    private func response(_ text: String, status: Int = 200, headers: [String: String] = [:]) -> MembershipHTTPResponse {
        MembershipHTTPResponse(data: Data(text.utf8), statusCode: status, headers: headers)
    }
    private func sessionResponse(userID: String, name: String?) -> MembershipHTTPResponse {
        let object: [String: Any] = [
            "user": ["id": userID, "name": name.map { $0 as Any } ?? NSNull(), "email": "relay@example.test", "emailVerified": true],
            "session": [
                "id": "session-1",
                "userId": userID,
                "createdAt": MembershipDateCoding.string(from: Date().addingTimeInterval(-60)),
                "expiresAt": MembershipDateCoding.string(from: Date().addingTimeInterval(3600))
            ]
        ]
        return MembershipHTTPResponse(data: try! JSONSerialization.data(withJSONObject: object), statusCode: 200)
    }
}

private final class AppleCaptureTransport: MembershipTransport, @unchecked Sendable {
    private let lock = NSLock()
    private var responses: [MembershipHTTPResponse]
    private var requests: [URLRequest] = []
    init(_ responses: [MembershipHTTPResponse]) { self.responses = responses }
    var last: URLRequest? { lock.withLock { requests.last } }
    var count: Int { lock.withLock { requests.count } }
    func send(_ request: URLRequest) async throws -> MembershipHTTPResponse {
        try lock.withLock {
            requests.append(request)
            guard !responses.isEmpty else { throw URLError(.badServerResponse) }
            return responses.removeFirst()
        }
    }
}
#endif
