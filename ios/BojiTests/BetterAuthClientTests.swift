#if DEBUG
import Foundation
import XCTest
@testable import Boji

@MainActor
final class BetterAuthClientTests: XCTestCase {
    func testSignInReadsOnlySetAuthTokenHeader() async {
        let transport = BetterAuthRecordingTransport(responses: [
            response(
                data: #"{"token":"body-token"}"#,
                headers: ["set-auth-token": "header-token"]
            ),
            response(data: #"{"token":"body-token"}"#)
        ])
        let client = makeClient(transport)

        do {
            let token = try await client.signIn(email: "member@example.test", password: "password")
            XCTAssertEqual(token, "header-token")
        } catch {
            XCTFail("收到意外错误：\(error)")
        }

        do {
            _ = try await client.signIn(email: "member@example.test", password: "password")
            XCTFail("登录不应接受响应正文中的令牌。")
        } catch let error as MembershipAPIError {
            XCTAssertEqual(error, .invalidResponse)
        } catch {
            XCTFail("收到意外错误：\(error)")
        }

        XCTAssertEqual(transport.requestCount, 2)
    }

    func testRegisterAcceptsNullTokenWithoutCreatingAuthentication() async throws {
        let transport = BetterAuthRecordingTransport(responses: [
            response(data: #"{"token":null}"#)
        ])
        let client = makeClient(transport)

        try await client.register(
            name: "New Member",
            email: "new@example.test",
            password: "password"
        )

        let request = try XCTUnwrap(transport.lastRequest)
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.url?.path, "/api/auth/sign-up/email")
        XCTAssertNil(request.value(forHTTPHeaderField: "Authorization"))
    }

    func testGetSessionSendsProvidedBearerAndParsesValidSession() async throws {
        let expiresAt = Date().addingTimeInterval(300)
        let transport = BetterAuthRecordingTransport(responses: [
            sessionResponse(userID: "user-1", expiresAt: expiresAt)
        ])
        let client = makeClient(transport)

        let result = try await client.getSession(token: "provided-session-token")
        let session = try XCTUnwrap(result)

        XCTAssertEqual(session.user.id, "user-1")
        XCTAssertEqual(session.session.userId, "user-1")
        XCTAssertEqual(session.session.expiresAt.timeIntervalSince1970, expiresAt.timeIntervalSince1970, accuracy: 0.001)
        let request = try XCTUnwrap(transport.lastRequest)
        XCTAssertEqual(request.httpMethod, "GET")
        XCTAssertEqual(request.url?.path, "/api/auth/get-session")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer provided-session-token")
    }

    func testGetSessionReturnsNilForJSONNull() async throws {
        let transport = BetterAuthRecordingTransport(responses: [response(data: "null")])
        let client = makeClient(transport)

        let session = try await client.getSession(token: "session-token")

        XCTAssertNil(session)
    }

    func testGetSessionAcceptsAppleUserWithoutName() async throws {
        // Apple 只在首次授权时提供姓名，所以 Better Auth 的 name 可以为 null。日期格式与 better-auth-rs 相同。
        let expiresAt = MembershipDateCoding.string(from: Date().addingTimeInterval(3600))
        let transport = BetterAuthRecordingTransport(responses: [response(data: """
        {"user":{"id":"apple-user","name":null,"email":"relay@privaterelay.appleid.com","emailVerified":true,"image":null,"createdAt":"2026-10-21T11:20:31.123Z","updatedAt":"2026-10-21T11:20:31.123Z"},
         "session":{"id":"session-1","userId":"apple-user","token":"server-token","createdAt":"2026-10-21T11:20:31.123Z","updatedAt":"2026-10-21T11:20:31.123Z","expiresAt":"\(expiresAt)","ipAddress":null,"userAgent":null}}
        """)])

        let session = try await makeClient(transport).getSession(token: "session-token")

        let user = try XCTUnwrap(session?.user)
        XCTAssertEqual(user.id, "apple-user")
        XCTAssertEqual(user.name, "")
        XCTAssertEqual(user.email, "relay@privaterelay.appleid.com")
        XCTAssertTrue(user.emailVerified)
    }

    func testGetSessionReturnsNilForExpiredSession() async throws {
        let transport = BetterAuthRecordingTransport(responses: [
            sessionResponse(userID: "user-1", expiresAt: Date().addingTimeInterval(-1))
        ])
        let client = makeClient(transport)

        let session = try await client.getSession(token: "session-token")

        XCTAssertNil(session)
    }

    func testGetSessionRejectsSessionForAnotherUser() async {
        let transport = BetterAuthRecordingTransport(responses: [
            sessionResponse(userID: "other-user", expiresAt: Date().addingTimeInterval(300))
        ])
        let client = makeClient(transport)

        do {
            _ = try await client.getSession(token: "session-token")
            XCTFail("用户不匹配的会话必须被拒绝。")
        } catch let error as MembershipAPIError {
            XCTAssertEqual(error, .invalidResponse)
        } catch {
            XCTFail("收到意外错误：\(error)")
        }
    }

    func testChangePasswordSendsRequiredBodyAndUsesHeaderToken() async throws {
        let transport = BetterAuthRecordingTransport(responses: [
            response(data: #"{"token":"body-token"}"#, headers: ["set-auth-token": "rotated-token"])
        ])
        let client = makeClient(transport)

        let token = try await client.changePassword(
            currentPassword: "old-password",
            newPassword: "new-password",
            token: "current-session-token"
        )

        XCTAssertEqual(token, "rotated-token")
        let request = try XCTUnwrap(transport.lastRequest)
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.url?.path, "/api/auth/change-password")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer current-session-token")
        let body = try XCTUnwrap(request.httpBody)
        let object = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
        XCTAssertEqual(object["currentPassword"] as? String, "old-password")
        XCTAssertEqual(object["newPassword"] as? String, "new-password")
        XCTAssertEqual(object["revokeOtherSessions"] as? Bool, true)
    }

    func testChangePasswordReturnsNilWithoutHeaderAndDoesNotUseBodyToken() async throws {
        let transport = BetterAuthRecordingTransport(responses: [
            response(data: #"{"token":"body-token"}"#)
        ])
        let client = makeClient(transport)

        let token = try await client.changePassword(
            currentPassword: "old-password",
            newPassword: "new-password",
            token: "current-session-token"
        )

        XCTAssertNil(token)
    }

    func testRevokeOtherSessionsSendsEmptyJSONAndRequiresTrueStatus() async throws {
        let transport = BetterAuthRecordingTransport(responses: [
            response(data: #"{"status":true}"#),
            response(data: #"{"status":false}"#)
        ])
        let client = makeClient(transport)

        try await client.revokeOtherSessions(token: "session-token")

        let request = try XCTUnwrap(transport.lastRequest)
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.url?.path, "/api/auth/revoke-other-sessions")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer session-token")
        XCTAssertEqual(String(decoding: try XCTUnwrap(request.httpBody), as: UTF8.self), "{}")

        do {
            try await client.revokeOtherSessions(token: "session-token")
            XCTFail("status 为 false 时必须失败。")
        } catch let error as MembershipAPIError {
            XCTAssertEqual(error, .invalidResponse)
        } catch {
            XCTFail("收到意外错误：\(error)")
        }
    }

    func testHTTP401IsPassedThroughForPost() async {
        let transport = BetterAuthRecordingTransport(responses: [
            response(data: #"{"code":"UNAUTHORIZED"}"#, statusCode: 401)
        ])
        let client = makeClient(transport)

        do {
            try await client.revokeOtherSessions(token: "session-token")
            XCTFail("401 必须传递给调用方。")
        } catch let error as MembershipAPIError {
            XCTAssertEqual(error, .server(statusCode: 401, code: "UNAUTHORIZED"))
        } catch {
            XCTFail("收到意外错误：\(error)")
        }

        XCTAssertEqual(transport.requestCount, 1)
    }

    func testHTTP429IsPassedThroughWithoutRetryingPost() async {
        let transport = BetterAuthRecordingTransport(responses: [
            response(data: #"{"code":"RATE_LIMITED"}"#, statusCode: 429)
        ])
        let client = makeClient(transport)

        do {
            _ = try await client.changePassword(
                currentPassword: "old-password",
                newPassword: "new-password",
                token: "session-token"
            )
            XCTFail("429 必须传递给调用方。")
        } catch let error as MembershipAPIError {
            XCTAssertEqual(error, .server(statusCode: 429, code: "RATE_LIMITED"))
        } catch {
            XCTFail("收到意外错误：\(error)")
        }

        XCTAssertEqual(transport.requestCount, 1)
    }

    private func makeClient(_ transport: BetterAuthRecordingTransport) -> BetterAuthClient {
        let configuration = MembershipServiceConfiguration(
            validating: "https://example.test",
            allowLoopbackHTTP: false
        )
        return BetterAuthClient(configuration: configuration, transport: transport)
    }

    private func response(
        data: String,
        statusCode: Int = 200,
        headers: [String: String] = [:]
    ) -> MembershipHTTPResponse {
        MembershipHTTPResponse(data: Data(data.utf8), statusCode: statusCode, headers: headers)
    }

    private func sessionResponse(userID: String, expiresAt: Date) -> MembershipHTTPResponse {
        let object: [String: Any] = [
            "user": [
                "id": "user-1",
                "name": "Member",
                "email": "member@example.test",
                "emailVerified": true
            ],
            "session": [
                "id": "session-1",
                "userId": userID,
                "createdAt": MembershipDateCoding.string(from: Date().addingTimeInterval(-60)),
                "expiresAt": MembershipDateCoding.string(from: expiresAt),
                "token": "server-token-must-not-be-stored",
                "ipAddress": "192.0.2.1",
                "userAgent": "test-agent"
            ]
        ]
        let data = try! JSONSerialization.data(withJSONObject: object)
        return MembershipHTTPResponse(data: data, statusCode: 200)
    }
}

private final class BetterAuthRecordingTransport: MembershipTransport, @unchecked Sendable {
    private let lock = NSLock()
    private var queuedResponses: [Result<MembershipHTTPResponse, Error>]
    private var storedRequests: [URLRequest] = []

    init(responses: [MembershipHTTPResponse]) {
        queuedResponses = responses.map(Result.success)
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
        let result = lock.withLock {
            storedRequests.append(request)
            return queuedResponses.isEmpty
                ? Result<MembershipHTTPResponse, Error>.failure(BetterAuthMockError.noResponse)
                : queuedResponses.removeFirst()
        }
        return try result.get()
    }
}

private enum BetterAuthMockError: Error {
    case noResponse
}
#endif
