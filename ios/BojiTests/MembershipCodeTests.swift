#if DEBUG
import Foundation
import XCTest
@testable import Boji

/// 会员码：TOTP 计算、`MembershipCodeService` 契约和 `MembershipStore` 的保存规则。
final class MembershipCodeTests: XCTestCase {
    private let membershipID = "0f6a4c8e-2d7b-4f3e-9a51-6c2b8d7e1f04"

    /// RFC 6238 附录 B 中 SHA-1 的 8 位测试向量。
    func testTOTPMatchesRFC6238Vectors() {
        let code = sampleCode()
        let vectors: [(TimeInterval, String)] = [
            (59, "94287082"),
            (1_111_111_109, "07081804"),
            (1_111_111_111, "14050471"),
            (1_234_567_890, "89005924"),
            (2_000_000_000, "69279037"),
            (20_000_000_000, "65353130")
        ]
        for (seconds, expected) in vectors {
            let date = Date(timeIntervalSince1970: seconds)
            XCTAssertEqual(code.totp(step: code.step(at: date)), expected, "t=\(seconds)")
            XCTAssertEqual(code.dynamicValue(at: date), "BOJI1.D.TEST.\(expected)", "t=\(seconds)")
        }
    }

    func testSecondsRemainingCountsDownWithinOneStep() {
        let code = sampleCode()
        XCTAssertEqual(code.secondsRemaining(at: Date(timeIntervalSince1970: 60)), 30)
        XCTAssertEqual(code.secondsRemaining(at: Date(timeIntervalSince1970: 60.5)), 30)
        XCTAssertEqual(code.secondsRemaining(at: Date(timeIntervalSince1970: 75)), 15)
        XCTAssertEqual(code.secondsRemaining(at: Date(timeIntervalSince1970: 89.9)), 1)
    }

    func testGetMembershipCodeSendsCallerNameAndMapsFields() async throws {
        let transport = CodeRecordingTransport([
            MembershipRPCFixtures.membershipCode(name: "users/user-1/memberships/\(membershipID)/code")
        ])

        let code = try await client(transport).membershipCode(membershipID: membershipID, token: "session")

        XCTAssertEqual(code, sampleCode())
        let request = try XCTUnwrap(transport.last)
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.url?.absoluteString, "https://example.test/boji.v1.MembershipCodeService/GetMembershipCode")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer session")
        XCTAssertEqual(
            MembershipRPCFixtures.membershipCodeName(from: request.httpBody),
            "users/me/memberships/\(membershipID)/code"
        )
    }

    func testMalformedMembershipCodeIsRejected() async {
        let name = "users/user-1/memberships/\(membershipID)/code"
        let responses = [
            MembershipRPCFixtures.membershipCode(name: "users/user-1/memberships/another/code"),
            MembershipRPCFixtures.membershipCode(name: "users/user-1/memberships/\(membershipID)"),
            MembershipRPCFixtures.membershipCode(name: name, staticValue: ""),
            MembershipRPCFixtures.membershipCode(name: name, dynamicValuePrefix: ""),
            MembershipRPCFixtures.membershipCode(name: name, secret: Data(repeating: 1, count: 15)),
            MembershipRPCFixtures.membershipCode(name: name, digits: 4),
            MembershipRPCFixtures.membershipCode(name: name, digits: 11),
            MembershipRPCFixtures.membershipCode(name: name, periodSeconds: 0),
            MembershipRPCFixtures.membershipCode(name: name, hasTotp: false)
        ]
        for response in responses {
            let transport = CodeRecordingTransport([response])
            do {
                _ = try await client(transport).membershipCode(membershipID: membershipID, token: "session")
                XCTFail("Expected invalidResponse")
            } catch {
                XCTAssertEqual(error as? MembershipAPIError, .invalidResponse)
            }
        }
    }

    func testServerConfigMapsMembershipCodeSwitch() async throws {
        let transport = CodeRecordingTransport([
            MembershipRPCFixtures.serverConfig(appleSignIn: false, walletPass: true, membershipCode: true)
        ])
        let capabilities = try await client(transport).serverConfig()
        XCTAssertEqual(capabilities, MembershipCapabilities(appleSignIn: false, walletPass: true, membershipCode: true))
    }

    @MainActor
    func testStoreKeepsCodeInMemoryAndDropsItWhenCardIsSuspended() async throws {
        let transport = CodeRecordingTransport([
            MembershipHTTPResponse(data: Data("{}".utf8), statusCode: 200, headers: ["set-auth-token": "session"]),
            sessionResponse(),
            MembershipRPCFixtures.memberships([card(status: "active")]),
            MembershipRPCFixtures.serverConfig(appleSignIn: false, walletPass: false, membershipCode: true),
            MembershipRPCFixtures.membershipCode(name: "users/user-1/memberships/\(membershipID)/code"),
            sessionResponse(),
            MembershipRPCFixtures.memberships([card(status: "suspended")])
        ])
        let cache = InMemoryMembershipCacheStore()
        let store = MembershipStore.testing(
            serviceURL: URL(string: "https://example.test"),
            transport: transport,
            cacheStore: cache
        )
        await store.signIn(email: "member@example.test", password: "password-1")
        await store.loadCapabilities()

        let code = await store.prepareMembershipCode()
        XCTAssertEqual(code, sampleCode())
        XCTAssertEqual(store.activeMembershipCode, sampleCode())

        // 已经取得的会员码不再请求服务端。
        let again = await store.prepareMembershipCode()
        XCTAssertEqual(again, sampleCode())
        XCTAssertEqual(transport.count, 5)

        // 会员码不进入磁盘缓存。
        let cached = try XCTUnwrap(cache.snapshot())
        let encoded = try MembershipDateCoding.encoder().encode(cached)
        XCTAssertNil(String(data: encoded, encoding: .utf8)?.range(of: "BOJI1"))

        await store.refresh()
        XCTAssertEqual(store.card?.isActive, false)
        XCTAssertNil(store.activeMembershipCode)
    }

    @MainActor
    func testStoreDoesNotRequestCodeWhenServerHasNoKey() async {
        let transport = CodeRecordingTransport([
            MembershipRPCFixtures.serverConfig(appleSignIn: false, walletPass: false, membershipCode: false)
        ])
        let store = MembershipStore.testing(serviceURL: URL(string: "https://example.test"), transport: transport)
        await store.loadCapabilities()
        let code = await store.prepareMembershipCode()
        XCTAssertNil(code)
        XCTAssertEqual(transport.count, 1)
        XCTAssertEqual(store.errorMessage, "会员码服务尚未配置。")
    }

    private func sampleCode() -> MembershipCode {
        MembershipCode(
            membershipID: membershipID,
            staticValue: "BOJI1.S.TEST.0123456789ABCDEF0123456789ABCDEF",
            dynamicValuePrefix: "BOJI1.D.TEST.",
            secret: MembershipRPCFixtures.testTOTPSecret,
            digits: 8,
            period: 30
        )
    }

    private func card(status: String) -> ClubMember {
        ClubMember(
            id: membershipID,
            userId: "user-1",
            memberNumber: "1",
            displayName: "会员",
            joinedAt: Date(timeIntervalSince1970: 1_792_483_200),
            tier: "community",
            status: status,
            grantedEntitlements: [],
            expiresAt: nil
        )
    }

    private func client(_ transport: CodeRecordingTransport) -> MembershipRPCClient {
        MembershipRPCClient(
            configuration: MembershipServiceConfiguration(validating: "https://example.test", allowLoopbackHTTP: false),
            transport: transport
        )
    }

    private func sessionResponse() -> MembershipHTTPResponse {
        let object: [String: Any] = [
            "user": ["id": "user-1", "name": "会员", "email": "member@example.test", "emailVerified": true],
            "session": [
                "id": "session-1",
                "userId": "user-1",
                "createdAt": MembershipDateCoding.string(from: Date().addingTimeInterval(-60)),
                "expiresAt": MembershipDateCoding.string(from: Date().addingTimeInterval(3600))
            ]
        ]
        return MembershipHTTPResponse(data: try! JSONSerialization.data(withJSONObject: object), statusCode: 200)
    }
}

/// 按顺序返回预设响应，并记录请求。
private final class CodeRecordingTransport: MembershipTransport, @unchecked Sendable {
    private let lock = NSLock()
    private var responses: [MembershipHTTPResponse]
    private var requests: [URLRequest] = []

    init(_ responses: [MembershipHTTPResponse]) { self.responses = responses }

    var count: Int { lock.withLock { requests.count } }
    var last: URLRequest? { lock.withLock { requests.last } }

    func send(_ request: URLRequest) async throws -> MembershipHTTPResponse {
        try lock.withLock {
            requests.append(request)
            guard !responses.isEmpty else { throw URLError(.badServerResponse) }
            return responses.removeFirst()
        }
    }
}
#endif
