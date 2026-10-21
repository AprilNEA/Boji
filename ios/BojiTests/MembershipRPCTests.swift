#if DEBUG
import Foundation
import XCTest
@testable import Boji

/// `MembershipRPCClient` 与 `bizserver/proto/boji/v1/` 契约的一致性测试。
final class MembershipRPCTests: XCTestCase {
    private let joinedAt = Date(timeIntervalSince1970: 1_792_483_200.125)

    func testListMembershipsSendsCallerParentAndMapsContractFields() async throws {
        let card = ClubMember(
            id: "0f6a4c8e-2d7b-4f3e-9a51-6c2b8d7e1f04",
            userId: "user-1",
            memberNumber: "opaque-number",
            displayName: "会员",
            joinedAt: joinedAt,
            tier: "community",
            status: "active",
            grantedEntitlements: [
                MembershipEntitlement(id: nil, code: "local_tracking", name: "日常记录", description: "训练、饮水与睡眠。", grantedAt: joinedAt, expiresAt: nil),
                MembershipEntitlement(id: nil, code: "progress_history", name: "成长足迹", description: "", grantedAt: joinedAt, expiresAt: joinedAt.addingTimeInterval(86_400))
            ],
            expiresAt: joinedAt.addingTimeInterval(365 * 86_400)
        )
        let transport = RPCRecordingTransport([MembershipRPCFixtures.memberships([card])])

        let result = try await client(transport).currentMembership(token: "session")

        XCTAssertEqual(result, card)
        let request = try XCTUnwrap(transport.last)
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.url?.absoluteString, "https://example.test/boji.v1.MembershipService/ListMemberships")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer session")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/proto")
        XCTAssertEqual(MembershipRPCFixtures.listMembershipsParent(from: request.httpBody), "users/me")
    }

    func testEmptyListMeansNoMembership() async throws {
        let transport = RPCRecordingTransport([MembershipRPCFixtures.memberships([])])
        let result = try await client(transport).currentMembership(token: "session")
        XCTAssertNil(result)
    }

    func testMoreThanOneMembershipIsRejected() async {
        let first = card(id: "m1")
        let second = card(id: "m2")
        let transport = RPCRecordingTransport([MembershipRPCFixtures.memberships([first, second])])
        await assertError(.invalidResponse) { try await self.client(transport).currentMembership(token: "session") }
    }

    func testUnknownStateIsSuspendedAndUnknownTierIsNotActive() async throws {
        let transport = RPCRecordingTransport([
            MembershipRPCFixtures.membership(name: "users/u1/memberships/m1", tier: 1, state: 9),
            MembershipRPCFixtures.membership(name: "users/u1/memberships/m1", tier: 7, state: 1)
        ])
        let unknownState = try await client(transport).createMembership(nickname: "会员", token: "session")
        XCTAssertEqual(unknownState.status, "suspended")
        XCTAssertFalse(unknownState.isActive)

        let unknownTier = try await client(transport).createMembership(nickname: "会员", token: "session")
        XCTAssertEqual(unknownTier.status, "active")
        XCTAssertNotEqual(unknownTier.tier, "community")
        XCTAssertFalse(unknownTier.isActive)
    }

    func testMalformedMembershipIsRejected() async {
        let responses = [
            MembershipRPCFixtures.membership(name: "users/me/memberships/m1"),
            MembershipRPCFixtures.membership(name: "users/u1/memberships/"),
            MembershipRPCFixtures.membership(name: "accounts/u1/memberships/m1"),
            MembershipRPCFixtures.membership(name: "users/u1/memberships/m1/extra"),
            MembershipRPCFixtures.membership(name: "users/u1/memberships/m1", memberNumber: ""),
            MembershipRPCFixtures.membership(name: "users/u1/memberships/m1", hasCreateTime: false)
        ]
        for response in responses {
            let transport = RPCRecordingTransport([response])
            await assertError(.invalidResponse) { try await self.client(transport).createMembership(nickname: "会员", token: "session") }
        }
    }

    func testCreateMembershipSendsNicknameAndTermsVersion() async throws {
        let created = card(id: "m1")
        let transport = RPCRecordingTransport([MembershipRPCFixtures.membership(created)])

        let result = try await client(transport).createMembership(nickname: "新会员", token: "session")

        XCTAssertEqual(result, created)
        XCTAssertEqual(transport.last?.url?.path, "/boji.v1.MembershipService/CreateMembership")
        XCTAssertEqual(
            MembershipRPCFixtures.createMembershipRequest(from: transport.last?.httpBody),
            MembershipRPCFixtures.CreateMembershipRequest(parent: "users/me", nickname: "新会员", termsVersion: "community-v1")
        )
    }

    func testExistingMembershipIsReturnedWhenCreateConflicts() async throws {
        let existing = card(id: "existing")
        let transport = RPCRecordingTransport([
            MembershipRPCFixtures.error(.alreadyExists, reason: "MEMBERSHIP_ALREADY_EXISTS"),
            MembershipRPCFixtures.memberships([existing])
        ])

        let result = try await client(transport).createMembership(nickname: "会员", token: "session")

        XCTAssertEqual(result, existing)
        XCTAssertEqual(transport.count, 2)
        XCTAssertEqual(transport.last?.url?.path, "/boji.v1.MembershipService/ListMemberships")
    }

    func testConnectErrorsMapToStatusAndReason() async {
        let cases: [(MembershipHTTPResponse, MembershipAPIError)] = [
            (MembershipRPCFixtures.error(.unauthenticated, reason: "SESSION_REQUIRED"), .server(statusCode: 401, code: "SESSION_REQUIRED")),
            (MembershipRPCFixtures.error(.permissionDenied, reason: "EMAIL_NOT_VERIFIED"), .server(statusCode: 403, code: "EMAIL_NOT_VERIFIED")),
            (MembershipRPCFixtures.error(.failedPrecondition, reason: "TERMS_NOT_ACCEPTED"), .server(statusCode: 400, code: "TERMS_NOT_ACCEPTED")),
            (MembershipRPCFixtures.error(.resourceExhausted, reason: nil), .server(statusCode: 429, code: nil)),
            (MembershipRPCFixtures.error(.unavailable, reason: "WALLET_SIGNING_FAILED"), .server(statusCode: 503, code: "WALLET_SIGNING_FAILED")),
            (MembershipRPCFixtures.error(.unavailable, reason: nil), .network),
            (MembershipRPCFixtures.error(.internalError, reason: nil), .server(statusCode: 500, code: nil))
        ]
        for (response, expected) in cases {
            let transport = RPCRecordingTransport([response])
            await assertError(expected) { try await self.client(transport).currentMembership(token: "session") }
        }
    }

    func testTransportFailureIsNetworkError() async {
        let transport = RPCRecordingTransport([])
        await assertError(.network) { try await self.client(transport).serverConfig() }
    }

    func testMissingConfigurationSendsNoRequest() async {
        let transport = RPCRecordingTransport([])
        let client = MembershipRPCClient(configuration: nil, transport: transport)
        await assertError(.notConfigured) { try await client.serverConfig() }
        XCTAssertEqual(transport.count, 0)
    }

    func testContentEncodingHeaderIsNotDecodedTwice() async throws {
        // URLSession 已经解压响应，但仍然保留 Content-Encoding 头。
        var response = MembershipRPCFixtures.serverConfig(appleSignIn: true, walletPass: true)
        response = MembershipHTTPResponse(
            data: response.data,
            statusCode: 200,
            headers: ["Content-Type": "application/proto", "Content-Encoding": "gzip"]
        )
        let transport = RPCRecordingTransport([response])

        let config = try await client(transport).serverConfig()

        XCTAssertEqual(config, MembershipCapabilities(appleSignIn: true, walletPass: true))
    }

    @MainActor
    func testEmailVerificationReasonFromRPCRequiresVerification() async {
        // 会话报告邮箱已验证，但 bizserver 仍然拒绝，例如验证状态刚被撤销。
        let transport = RPCRecordingTransport([
            MembershipHTTPResponse(data: Data("{}".utf8), statusCode: 200, headers: ["set-auth-token": "session"]),
            sessionResponse(emailVerified: true),
            MembershipRPCFixtures.error(.permissionDenied, reason: "EMAIL_NOT_VERIFIED")
        ])
        let store = MembershipStore.testing(serviceURL: URL(string: "https://example.test"), transport: transport)

        await store.signIn(email: "member@example.test", password: "password-1")

        XCTAssertEqual(transport.count, 3)
        XCTAssertEqual(transport.last?.url?.path, "/boji.v1.MembershipService/ListMemberships")
        XCTAssertTrue(store.requiresEmailVerification)
        XCTAssertNotNil(store.account)
    }

    func testCachedEntitlementWithoutIDRoundTrips() throws {
        let card = card(id: "m1")
        let data = try MembershipDateCoding.encoder().encode(card)
        let decoded = try MembershipDateCoding.decoder().decode(ClubMember.self, from: data)
        XCTAssertEqual(decoded, card)
        XCTAssertNil(decoded.entitlements.first?.id)
    }

    private func card(id: String) -> ClubMember {
        ClubMember(
            id: id,
            userId: "user-1",
            memberNumber: "opaque-\(id)",
            displayName: "会员",
            joinedAt: joinedAt,
            tier: "community",
            status: "active",
            grantedEntitlements: [
                MembershipEntitlement(id: nil, code: "local_tracking", name: "日常记录", description: "", grantedAt: joinedAt, expiresAt: nil)
            ],
            expiresAt: nil
        )
    }

    private func client(_ transport: RPCRecordingTransport) -> MembershipRPCClient {
        MembershipRPCClient(
            configuration: MembershipServiceConfiguration(validating: "https://example.test", allowLoopbackHTTP: false),
            transport: transport
        )
    }

    private func sessionResponse(emailVerified: Bool) -> MembershipHTTPResponse {
        let object: [String: Any] = [
            "user": ["id": "user-1", "name": "会员", "email": "member@example.test", "emailVerified": emailVerified],
            "session": [
                "id": "session-1",
                "userId": "user-1",
                "createdAt": MembershipDateCoding.string(from: Date().addingTimeInterval(-60)),
                "expiresAt": MembershipDateCoding.string(from: Date().addingTimeInterval(3600))
            ]
        ]
        return MembershipHTTPResponse(data: try! JSONSerialization.data(withJSONObject: object), statusCode: 200)
    }

    private func assertError<Value>(
        _ expected: MembershipAPIError,
        file: StaticString = #filePath,
        line: UInt = #line,
        _ operation: () async throws -> Value
    ) async {
        do {
            _ = try await operation()
            XCTFail("Expected \(expected)", file: file, line: line)
        } catch {
            XCTAssertEqual(error as? MembershipAPIError, expected, file: file, line: line)
        }
    }
}

private final class RPCRecordingTransport: MembershipTransport, @unchecked Sendable {
    private let lock = NSLock()
    private var responses: [MembershipHTTPResponse]
    private var requests: [URLRequest] = []
    init(_ responses: [MembershipHTTPResponse]) { self.responses = responses }
    var last: URLRequest? { lock.withLock { requests.last } }
    var count: Int { lock.withLock { requests.count } }
    func send(_ request: URLRequest) async throws -> MembershipHTTPResponse {
        try lock.withLock {
            requests.append(request)
            guard !responses.isEmpty else { throw URLError(.notConnectedToInternet) }
            return responses.removeFirst()
        }
    }
}
#endif
