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
            response("{\"appleSignIn\":true,\"walletPass\":false}"),
            response("{}", headers: ["set-auth-token": "new-session"]),
            response("{\"user\":{\"id\":\"apple-user\",\"name\":\"会员\",\"email\":\"relay@example.test\",\"emailVerified\":true}}"),
            response("{\"membership\":null}")
        ])
        let tokens = InMemoryMembershipTokenStore()
        let store = MembershipStore.testing(serviceURL: URL(string: "https://example.test"), transport: transport, tokenStore: tokens)
        await store.loadCapabilities()
        await store.signInWithApple(AppleIdentity(token: "id", nonce: "nonce", firstName: nil, lastName: nil))
        XCTAssertEqual(store.account?.id, "apple-user")
        XCTAssertEqual(tokens.loadToken(), "new-session")
        XCTAssertNil(store.errorMessage)
        XCTAssertEqual(transport.last?.value(forHTTPHeaderField: "Authorization"), "Bearer new-session")
    }

    func testWalletRequiresExpectedMIMETypeAndBoundedData() async {
        let invalid = [
            response("{}", headers: ["Content-Type": "application/json"]),
            response("", headers: ["Content-Type": "application/vnd.apple.pkpass"]),
            MembershipHTTPResponse(data: Data(repeating: 0, count: 2 * 1024 * 1024 + 1), statusCode: 200, headers: ["Content-Type": "application/vnd.apple.pkpass"])
        ]
        for response in invalid {
            do {
                _ = try await api(AppleCaptureTransport([response])).walletPass(token: "token")
                XCTFail("Invalid wallet response was accepted")
            } catch { XCTAssertEqual(error as? MembershipAPIError, .invalidResponse) }
        }
    }

    func testWalletUnconfiguredResponseDoesNotReturnFakePass() async {
        do {
            _ = try await api(AppleCaptureTransport([response("{\"code\":\"WALLET_NOT_CONFIGURED\"}", status: 503)])).walletPass(token: "token")
            XCTFail("An unconfigured signing service must fail")
        } catch { XCTAssertEqual(error as? MembershipAPIError, .server(statusCode: 503, code: "WALLET_NOT_CONFIGURED")) }
    }

    func testWalletUsesBearerAndRequestsPassMIMEType() async throws {
        let bytes = Data([0x50, 0x4b, 0x03, 0x04]) // Transport fixture, not a signed Wallet pass.
        let transport = AppleCaptureTransport([MembershipHTTPResponse(data: bytes, statusCode: 200, headers: ["Content-Type": "application/vnd.apple.pkpass"])])
        let data = try await api(transport).walletPass(token: "session")
        XCTAssertEqual(data, bytes)
        XCTAssertEqual(transport.last?.url?.path, "/api/membership/wallet/pass")
        XCTAssertEqual(transport.last?.value(forHTTPHeaderField: "Accept"), "application/vnd.apple.pkpass")
        XCTAssertEqual(transport.last?.value(forHTTPHeaderField: "Authorization"), "Bearer session")
    }

    private func api(_ transport: AppleCaptureTransport) -> MembershipAPI {
        MembershipAPI(configuration: MembershipServiceConfiguration(validating: "https://example.test", allowLoopbackHTTP: false), transport: transport)
    }
    private func response(_ text: String, status: Int = 200, headers: [String: String] = [:]) -> MembershipHTTPResponse {
        MembershipHTTPResponse(data: Data(text.utf8), statusCode: status, headers: headers)
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
