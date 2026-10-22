#if DEBUG
import Foundation
import XCTest
@testable import Boji

/// 工作人员扫码校验：has-permission 请求、`boji.admin.v1.MembershipCodeService` 契约和 `MembershipVerifier` 的规则。
@MainActor
final class MembershipVerifierTests: XCTestCase {
    private let membershipID = "0f6a4c8e-2d7b-4f3e-9a51-6c2b8d7e1f04"

    func testPermissionAsksForMembershipRead() async throws {
        let transport = VerifierRecordingTransport([permission(true)])
        let api = api(transport)

        let allowed = try await api.canVerifyMembershipCodes(token: "staff")

        XCTAssertTrue(allowed)
        let request = try XCTUnwrap(transport.last)
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.url?.absoluteString, "https://example.test/api/auth/admin/has-permission")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer staff")
        let body = try XCTUnwrap(request.httpBody)
        let object = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
        XCTAssertEqual(object["permissions"] as? [String: [String]], ["membership": ["read"]])
    }

    func testVerifySendsCodeAndMapsKind() async throws {
        let transport = VerifierRecordingTransport([
            MembershipRPCFixtures.verification(card(status: "active"), kind: .dynamic),
            MembershipRPCFixtures.verification(card(status: "active"), kind: .static)
        ])
        let api = api(transport)

        let dynamic = try await api.verifyMembershipCode("BOJI1.D.TEST.12345678", token: "staff")
        XCTAssertEqual(dynamic.kind, .app)
        XCTAssertEqual(dynamic.member.memberNumber, "1")
        XCTAssertEqual(dynamic.standing, .valid)
        let request = try XCTUnwrap(transport.last)
        XCTAssertEqual(
            request.url?.absoluteString,
            "https://example.test/boji.admin.v1.MembershipCodeService/VerifyMembershipCode"
        )
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer staff")
        XCTAssertEqual(MembershipRPCFixtures.verifiedCode(from: request.httpBody), "BOJI1.D.TEST.12345678")

        let walletPass = try await api.verifyMembershipCode("BOJI1.S.TEST.0123", token: "staff")
        XCTAssertEqual(walletPass.kind, .walletPass)
    }

    func testMalformedVerificationIsRejected() async {
        let responses = [
            MembershipRPCFixtures.verification(card(status: "active"), kind: .unspecified),
            MembershipRPCFixtures.verification(nil, kind: .dynamic)
        ]
        for response in responses {
            do {
                _ = try await api(VerifierRecordingTransport([response])).verifyMembershipCode("x", token: "staff")
                XCTFail("Expected invalidResponse")
            } catch {
                XCTAssertEqual(error as? MembershipAPIError, .invalidResponse)
            }
        }
    }

    func testStandingSeparatesSuspendedAndExpiredCards() {
        let suspended = MembershipVerification(member: card(status: "suspended"), kind: .app)
        XCTAssertEqual(suspended.standing, .suspended)
        let expired = MembershipVerification(
            member: card(status: "active", expiresAt: Date().addingTimeInterval(-60)),
            kind: .app
        )
        XCTAssertEqual(expired.standing, .expired)
    }

    func testVerifierShowsResultAndIgnoresRepeatedScans() async {
        let transport = VerifierRecordingTransport([
            permission(true),
            MembershipRPCFixtures.verification(card(status: "active"), kind: .dynamic)
        ])
        let verifier = verifier(transport)

        await verifier.refreshPermission(serviceEnabled: true)
        XCTAssertTrue(verifier.canVerify)

        await verifier.verify("  BOJI1.D.TEST.12345678\n")
        guard case .verified(let result) = verifier.outcome else {
            return XCTFail("Expected a verified outcome, got \(String(describing: verifier.outcome))")
        }
        XCTAssertEqual(result.member.id, membershipID)
        XCTAssertEqual(MembershipRPCFixtures.verifiedCode(from: transport.last?.httpBody), "BOJI1.D.TEST.12345678")

        // 结果关闭前，相机再次识别同一个码，不发请求。
        await verifier.verify("BOJI1.D.TEST.12345678")
        XCTAssertEqual(transport.count, 2)

        verifier.clearOutcome()
        XCTAssertNil(verifier.outcome)
    }

    func testVerifierMapsServerErrors() async {
        let cases: [(MembershipHTTPResponse, String)] = [
            (MembershipRPCFixtures.error(.invalidArgument, reason: "MEMBERSHIP_CODE_INVALID"), "这不是有效的薄肌会员码。"),
            (MembershipRPCFixtures.error(.failedPrecondition, reason: "MEMBERSHIP_CODE_EXPIRED"), "会员码已过期。请会员刷新后重新出示。"),
            (MembershipRPCFixtures.error(.notFound, reason: "MEMBERSHIP_NOT_FOUND"), "这张会员卡已不存在。"),
            (MembershipRPCFixtures.error(.unauthenticated, reason: "FRESH_SESSION_REQUIRED"), "请退出后重新登录，再继续扫码。校验需要 12 小时内登录的账号。"),
            (MembershipRPCFixtures.error(.permissionDenied, reason: "ADMIN_FORBIDDEN"), "当前账号没有校验会员码的权限。")
        ]
        for (response, message) in cases {
            let transport = VerifierRecordingTransport([permission(true), response])
            let verifier = verifier(transport)
            await verifier.refreshPermission(serviceEnabled: true)
            await verifier.verify("BOJI1.D.TEST.12345678")
            XCTAssertEqual(verifier.outcome, .failed(message))
        }
    }

    func testForbiddenVerificationHidesTheEntry() async {
        let transport = VerifierRecordingTransport([
            permission(true),
            MembershipRPCFixtures.error(.permissionDenied, reason: "ADMIN_FORBIDDEN")
        ])
        let verifier = verifier(transport)
        await verifier.refreshPermission(serviceEnabled: true)
        await verifier.verify("BOJI1.D.TEST.12345678")
        XCTAssertFalse(verifier.canVerify)
    }

    func testNoPermissionRequestWhenServiceIsOffOrSignedOut() async {
        let transport = VerifierRecordingTransport([])
        let signedIn = verifier(transport)
        await signedIn.refreshPermission(serviceEnabled: false)
        XCTAssertFalse(signedIn.canVerify)

        let signedOut = MembershipVerifier(api: api(transport), tokenStore: InMemoryMembershipTokenStore())
        await signedOut.refreshPermission(serviceEnabled: true)
        XCTAssertFalse(signedOut.canVerify)
        XCTAssertEqual(transport.count, 0)
    }

    func testResetClearsPermissionAndResult() async {
        let transport = VerifierRecordingTransport([
            permission(true),
            MembershipRPCFixtures.verification(card(status: "active"), kind: .dynamic)
        ])
        let verifier = verifier(transport)
        await verifier.refreshPermission(serviceEnabled: true)
        await verifier.verify("BOJI1.D.TEST.12345678")
        XCTAssertNotNil(verifier.outcome)

        verifier.reset()
        XCTAssertFalse(verifier.canVerify)
        XCTAssertFalse(verifier.isVerifying)
        XCTAssertNil(verifier.outcome)
    }

    private func card(status: String, expiresAt: Date? = nil) -> ClubMember {
        ClubMember(
            id: membershipID,
            userId: "user-1",
            memberNumber: "1",
            displayName: "会员",
            joinedAt: Date(timeIntervalSince1970: 1_792_483_200),
            tier: "community",
            status: status,
            grantedEntitlements: [],
            expiresAt: expiresAt
        )
    }

    private func permission(_ success: Bool) -> MembershipHTTPResponse {
        MembershipHTTPResponse(data: Data(#"{"success":\#(success)}"#.utf8), statusCode: 200)
    }

    private func api(_ transport: VerifierRecordingTransport) -> MembershipAPI {
        MembershipAPI(
            configuration: MembershipServiceConfiguration(validating: "https://example.test", allowLoopbackHTTP: false),
            transport: transport
        )
    }

    private func verifier(_ transport: VerifierRecordingTransport) -> MembershipVerifier {
        let tokens = InMemoryMembershipTokenStore()
        try? tokens.saveToken("staff")
        return MembershipVerifier(api: api(transport), tokenStore: tokens)
    }
}

/// 按顺序返回预设响应，并记录请求。
private final class VerifierRecordingTransport: MembershipTransport, @unchecked Sendable {
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
