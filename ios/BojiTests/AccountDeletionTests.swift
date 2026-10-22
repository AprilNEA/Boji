#if DEBUG
import Foundation
import XCTest
@testable import Boji

@MainActor
final class AccountDeletionTests: XCTestCase {
    func testRequestSendsEmptyJSONWithSignedBearerAndPreservesSession() async throws {
        let account = account(id: "user-1")
        let card = member(account: account)
        let tokens = InMemoryMembershipTokenStore()
        let cache = InMemoryMembershipCacheStore()
        let transport = AccountDeletionTransport(responses: signInResponses(account: account, card: card) + [
            response(200, ["success": true, "message": "Verification email sent"])
        ])
        let store = makeStore(transport: transport, tokenStore: tokens, cacheStore: cache)

        await signIn(store, account: account)
        let requested = await store.requestAccountDeletion()

        XCTAssertTrue(requested)
        XCTAssertTrue(store.hasPendingAccountDeletion)
        XCTAssertEqual(tokens.loadToken(), "signed-token-user-1")
        XCTAssertEqual(store.account, account)
        XCTAssertEqual(store.card, card)
        XCTAssertNotNil(cache.snapshot())

        let request = try XCTUnwrap(transport.lastRequest)
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.url?.path, "/api/auth/delete-user")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer signed-token-user-1")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")
        let body = try XCTUnwrap(request.httpBody)
        let object = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
        XCTAssertTrue(object.isEmpty)
    }

    func testConfirmationTrimsOnlyOuterWhitespaceAndClearsMembershipSession() async throws {
        let account = account(id: "user-1")
        let card = member(account: account)
        let tokens = InMemoryMembershipTokenStore()
        let cache = InMemoryMembershipCacheStore()
        let transport = AccountDeletionTransport(responses: signInResponses(account: account, card: card) + [
            sessionResponse(account),
            response(200, ["success": true, "message": "Verification email sent"]),
            response(200, ["success": true, "message": "User deleted"])
        ])
        let store = makeStore(transport: transport, tokenStore: tokens, cacheStore: cache)

        await signIn(store, account: account)
        await store.refreshAuthSession()
        XCTAssertNotNil(store.authSession)
        let requested = await store.requestAccountDeletion()
        XCTAssertTrue(requested)

        let deleted = await store.confirmAccountDeletion(code: "  ci-delete-token:opaque/=/7  ")

        XCTAssertTrue(deleted)
        XCTAssertNil(tokens.loadToken())
        XCTAssertNil(cache.snapshot())
        XCTAssertNil(store.account)
        XCTAssertNil(store.card)
        XCTAssertNil(store.authSession)
        XCTAssertFalse(store.hasPendingAccountDeletion)
        XCTAssertEqual(store.notice, "账号已注销。本机训练记录已保留。")

        let request = try XCTUnwrap(transport.lastRequest)
        let body = try XCTUnwrap(request.httpBody)
        let object = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: String])
        XCTAssertEqual(object["token"], "ci-delete-token:opaque/=/7")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer signed-token-user-1")
    }

    func testBlankConfirmationCodeSendsNoConfirmationRequest() async {
        let account = account(id: "user-1")
        let tokens = InMemoryMembershipTokenStore()
        let transport = AccountDeletionTransport(responses: signInResponses(account: account, card: nil) + [
            response(200, ["success": true, "message": "Verification email sent"])
        ])
        let store = makeStore(transport: transport, tokenStore: tokens)

        await signIn(store, account: account)
        let requested = await store.requestAccountDeletion()
        XCTAssertTrue(requested)
        let requestCount = transport.requestCount

        let deleted = await store.confirmAccountDeletion(code: " \n\t ")

        XCTAssertFalse(deleted)
        XCTAssertEqual(transport.requestCount, requestCount)
        XCTAssertTrue(store.hasPendingAccountDeletion)
        XCTAssertEqual(tokens.loadToken(), "signed-token-user-1")
        XCTAssertEqual(store.errorMessage, "请输入邮件中的确认码。")
    }

    func testRequestWithoutCurrentSessionSendsNoDeletionRequest() async {
        let transport = AccountDeletionTransport(responses: [])
        let store = makeStore(transport: transport)

        let requested = await store.requestAccountDeletion()

        XCTAssertFalse(requested)
        XCTAssertEqual(transport.requestCount, 0)
        XCTAssertFalse(store.hasPendingAccountDeletion)
        XCTAssertEqual(store.errorMessage, "请先登录后再申请注销账号。")
    }

    func testConfirmationWithoutSentCodeSendsNoDeletionRequest() async {
        let account = account(id: "user-1")
        let transport = AccountDeletionTransport(responses: signInResponses(account: account, card: nil))
        let store = makeStore(transport: transport)

        await signIn(store, account: account)
        let requestCount = transport.requestCount
        let deleted = await store.confirmAccountDeletion(code: "ci-delete-token")

        XCTAssertFalse(deleted)
        XCTAssertEqual(transport.requestCount, requestCount)
        XCTAssertFalse(store.hasPendingAccountDeletion)
        XCTAssertEqual(store.errorMessage, "当前登录状态已变化，请重新发送注销确认邮件。")
    }

    func testDeleteRequestPreservesNativeServerErrorCode() async {
        let transport = AccountDeletionTransport(responses: [
            response(400, ["code": "DELETE_REQUEST_REJECTED"])
        ])
        let api = MembershipAPI(
            configuration: MembershipServiceConfiguration(
                validating: "https://example.test",
                allowLoopbackHTTP: false
            ),
            transport: transport
        )

        do {
            try await api.requestAccountDeletion(token: "signed-token")
            XCTFail("服务端错误码必须传递给调用方。")
        } catch let error as MembershipAPIError {
            XCTAssertEqual(error, .server(statusCode: 400, code: "DELETE_REQUEST_REJECTED"))
        } catch {
            XCTFail("收到意外错误：\(error)")
        }
    }

    func testInvalidConfirmationResponseDoesNotClearLocalSession() async {
        let account = account(id: "user-1")
        let card = member(account: account)
        let tokens = InMemoryMembershipTokenStore()
        let cache = InMemoryMembershipCacheStore()
        let transport = AccountDeletionTransport(responses: signInResponses(account: account, card: card) + [
            response(200, ["success": true, "message": "Verification email sent"]),
            MembershipHTTPResponse(data: Data("{}".utf8), statusCode: 200)
        ])
        let store = makeStore(transport: transport, tokenStore: tokens, cacheStore: cache)

        await signIn(store, account: account)
        let requested = await store.requestAccountDeletion()
        XCTAssertTrue(requested)
        let deleted = await store.confirmAccountDeletion(code: "ci-delete-token")

        XCTAssertFalse(deleted)
        XCTAssertEqual(tokens.loadToken(), "signed-token-user-1")
        XCTAssertNotNil(cache.snapshot())
        XCTAssertEqual(store.account, account)
        XCTAssertEqual(store.card, card)
        XCTAssertFalse(store.hasPendingAccountDeletion)
        XCTAssertEqual(store.errorMessage, "注销结果未确认。请不要重复提交确认码，请稍后登录确认账号状态。")
        let requestCount = transport.requestCount
        let retried = await store.confirmAccountDeletion(code: "ci-delete-token")
        XCTAssertFalse(retried)
        XCTAssertEqual(transport.requestCount, requestCount)
    }

    func testServerFailureLeavesDeletionUnconfirmedAndPreventsReplay() async {
        let account = account(id: "user-1")
        let tokens = InMemoryMembershipTokenStore()
        let transport = AccountDeletionTransport(responses: signInResponses(account: account, card: nil) + [
            response(200, ["success": true, "message": "Verification email sent"]),
            response(503, ["code": "AUTH_UNAVAILABLE"])
        ])
        let store = makeStore(transport: transport, tokenStore: tokens)
        await signIn(store, account: account)
        let requested = await store.requestAccountDeletion()
        XCTAssertTrue(requested)
        let deleted = await store.confirmAccountDeletion(code: "ci-delete-token")
        XCTAssertFalse(deleted)
        XCTAssertFalse(store.hasPendingAccountDeletion)
        XCTAssertEqual(tokens.loadToken(), "signed-token-user-1")
        XCTAssertEqual(store.account, account)
        XCTAssertEqual(store.errorMessage, "注销结果未确认。请不要重复提交确认码，请稍后登录确认账号状态。")
        let requestCount = transport.requestCount
        let retried = await store.confirmAccountDeletion(code: "ci-delete-token")
        XCTAssertFalse(retried)
        XCTAssertEqual(transport.requestCount, requestCount)
    }

    func testExpiredSessionClearsPendingDeletionAndLocalSession() async {
        let account = account(id: "user-1")
        let card = member(account: account)
        let tokens = InMemoryMembershipTokenStore()
        let cache = InMemoryMembershipCacheStore()
        let transport = AccountDeletionTransport(responses: signInResponses(account: account, card: card) + [
            response(200, ["success": true, "message": "Verification email sent"]),
            response(401, ["code": "UNAUTHORIZED"])
        ])
        let store = makeStore(transport: transport, tokenStore: tokens, cacheStore: cache)

        await signIn(store, account: account)
        let requested = await store.requestAccountDeletion()
        XCTAssertTrue(requested)
        let deleted = await store.confirmAccountDeletion(code: "ci-delete-token")

        XCTAssertFalse(deleted)
        XCTAssertNil(tokens.loadToken())
        XCTAssertNil(cache.snapshot())
        XCTAssertNil(store.account)
        XCTAssertNil(store.card)
        XCTAssertFalse(store.hasPendingAccountDeletion)
        XCTAssertEqual(store.errorMessage, "登录已失效，请重新登录。")
    }

    func testConfirmationIsNotSentAfterAnotherAccountSignsIn() async {
        let firstAccount = account(id: "user-1")
        let secondAccount = account(id: "user-2")
        let tokens = InMemoryMembershipTokenStore()
        let transport = AccountDeletionTransport(responses: signInResponses(account: firstAccount, card: nil) + [
            response(200, ["success": true, "message": "Verification email sent"])
        ] + signInResponses(account: secondAccount, card: nil))
        let store = makeStore(transport: transport, tokenStore: tokens)

        await signIn(store, account: firstAccount)
        let requested = await store.requestAccountDeletion()
        XCTAssertTrue(requested)
        await signIn(store, account: secondAccount)
        let requestCount = transport.requestCount

        let deleted = await store.confirmAccountDeletion(code: "ci-delete-token")

        XCTAssertFalse(deleted)
        XCTAssertEqual(transport.requestCount, requestCount)
        XCTAssertEqual(tokens.loadToken(), "signed-token-user-2")
        XCTAssertEqual(store.account, secondAccount)
        XCTAssertFalse(store.hasPendingAccountDeletion)
    }

    func testCancelledConfirmationReplyCannotAdvanceOrClearNewAccount() async {
        let firstAccount = account(id: "user-1")
        let secondAccount = account(id: "user-2")
        let tokens = InMemoryMembershipTokenStore()
        let transport = DeferredAccountDeletionTransport(
            responses: signInResponses(account: firstAccount, card: nil) + [
                response(200, ["success": true, "message": "Verification email sent"])
            ] + signInResponses(account: secondAccount, card: nil),
            deferConfirmation: true
        )
        let store = makeStore(transport: transport, tokenStore: tokens)

        await signIn(store, account: firstAccount)
        let requested = await store.requestAccountDeletion()
        XCTAssertTrue(requested)
        let confirmationTask = Task { await store.confirmAccountDeletion(code: "ci-delete-token") }
        await transport.waitUntilDeleteRequestEntered()
        XCTAssertTrue(store.isBusy)

        store.cancelAccountDeletion()
        await signIn(store, account: secondAccount)
        await transport.finishDeleteRequest(response(200, ["success": true, "message": "User deleted"]))
        let deleted = await confirmationTask.value

        XCTAssertFalse(deleted)
        XCTAssertFalse(store.hasPendingAccountDeletion)
        XCTAssertEqual(tokens.loadToken(), "signed-token-user-2")
        XCTAssertEqual(store.account, secondAccount)
        XCTAssertFalse(store.isBusy)
    }

    func testInFlightDeletionRequestBlocksDoubleTap() async {
        let account = account(id: "user-1")
        let transport = DeferredAccountDeletionTransport(responses: signInResponses(account: account, card: nil))
        let store = makeStore(transport: transport)

        await signIn(store, account: account)
        let firstRequest = Task { await store.requestAccountDeletion() }
        await transport.waitUntilDeleteRequestEntered()
        let duplicateRequest = await store.requestAccountDeletion()
        let requestCount = await transport.deleteRequestCount()

        XCTAssertFalse(duplicateRequest)
        XCTAssertEqual(requestCount, 1)
        store.cancelAccountDeletion()
        await transport.finishDeleteRequest(response(200, ["success": true, "message": "Verification email sent"]))
        let firstRequestSucceeded = await firstRequest.value
        XCTAssertFalse(firstRequestSucceeded)
    }

    private func makeStore(
        transport: any MembershipTransport,
        tokenStore: InMemoryMembershipTokenStore = InMemoryMembershipTokenStore(),
        cacheStore: InMemoryMembershipCacheStore = InMemoryMembershipCacheStore()
    ) -> MembershipStore {
        MembershipStore.testing(
            serviceURL: URL(string: "https://example.test"),
            transport: transport,
            tokenStore: tokenStore,
            cacheStore: cacheStore
        )
    }

    private func signIn(_ store: MembershipStore, account: MembershipAccount) async {
        await store.signIn(email: account.email, password: "password")
        XCTAssertEqual(store.account, account)
    }

    private func account(id: String) -> MembershipAccount {
        MembershipAccount(id: id, name: "会员 \(id)", email: "\(id)@example.test", emailVerified: true)
    }

    private func member(account: MembershipAccount) -> ClubMember {
        ClubMember(
            id: "membership-\(account.id)",
            userId: account.id,
            memberNumber: "member-\(account.id)",
            displayName: account.name,
            joinedAt: Date(timeIntervalSince1970: 1_792_483_200),
            tier: "community",
            status: "active",
            entitlements: [],
            expiresAt: nil
        )
    }

    private func signInResponses(account: MembershipAccount, card: ClubMember?) -> [MembershipHTTPResponse] {
        [
            MembershipHTTPResponse(data: Data("{}".utf8), statusCode: 200, headers: ["set-auth-token": "signed-token-\(account.id)"]),
            sessionResponse(account),
            MembershipRPCFixtures.memberships(card.map { [$0] } ?? [])
        ]
    }

    private func sessionResponse(_ account: MembershipAccount) -> MembershipHTTPResponse {
        response(200, [
            "user": [
                "id": account.id,
                "name": account.name,
                "email": account.email,
                "emailVerified": account.emailVerified
            ],
            "session": [
                "id": "session-\(account.id)",
                "userId": account.id,
                "token": "raw-token-must-not-be-used",
                "createdAt": MembershipDateCoding.string(from: Date().addingTimeInterval(-60)),
                "expiresAt": MembershipDateCoding.string(from: Date().addingTimeInterval(3600))
            ]
        ])
    }

    private func response(_ status: Int, _ object: [String: Any]) -> MembershipHTTPResponse {
        MembershipHTTPResponse(
            data: try! JSONSerialization.data(withJSONObject: object),
            statusCode: status
        )
    }
}

private final class AccountDeletionTransport: MembershipTransport, @unchecked Sendable {
    private let lock = NSLock()
    private var responses: [MembershipHTTPResponse]
    private var recorded: [URLRequest] = []

    init(responses: [MembershipHTTPResponse]) {
        self.responses = responses
    }

    var requestCount: Int {
        lock.withLock { recorded.count }
    }

    var lastRequest: URLRequest? {
        lock.withLock { recorded.last }
    }

    func send(_ request: URLRequest) async throws -> MembershipHTTPResponse {
        try lock.withLock {
            recorded.append(request)
            guard !responses.isEmpty else { throw AccountDeletionTransportError.noResponse }
            return responses.removeFirst()
        }
    }
}

private actor DeferredAccountDeletionTransport: MembershipTransport {
    private var responses: [MembershipHTTPResponse]
    private let deferConfirmation: Bool
    private var deleteContinuation: CheckedContinuation<MembershipHTTPResponse, Error>?
    private var deleteWaiter: CheckedContinuation<Void, Never>?
    private var deleteRequests = 0

    init(responses: [MembershipHTTPResponse], deferConfirmation: Bool = false) {
        self.responses = responses
        self.deferConfirmation = deferConfirmation
    }

    func send(_ request: URLRequest) async throws -> MembershipHTTPResponse {
        if request.url?.path == "/api/auth/delete-user" {
            deleteRequests += 1
            if deferConfirmation, !isConfirmation(request) {
                guard !responses.isEmpty else { throw AccountDeletionTransportError.noResponse }
                return responses.removeFirst()
            }
            deleteWaiter?.resume()
            deleteWaiter = nil
            return try await withCheckedThrowingContinuation { continuation in
                deleteContinuation = continuation
            }
        }
        guard !responses.isEmpty else { throw AccountDeletionTransportError.noResponse }
        return responses.removeFirst()
    }

    private func isConfirmation(_ request: URLRequest) -> Bool {
        guard let body = request.httpBody,
              let object = try? JSONSerialization.jsonObject(with: body) as? [String: Any]
        else {
            return false
        }
        return object["token"] is String
    }

    func waitUntilDeleteRequestEntered() async {
        if deleteContinuation != nil { return }
        await withCheckedContinuation { deleteWaiter = $0 }
    }

    func deleteRequestCount() -> Int {
        deleteRequests
    }

    func finishDeleteRequest(_ response: MembershipHTTPResponse) {
        let continuation = deleteContinuation
        deleteContinuation = nil
        continuation?.resume(returning: response)
    }
}

private enum AccountDeletionTransportError: Error {
    case noResponse
}
#endif
