import Foundation
import Security

struct MembershipAPI: Sendable {
    private struct MeResponse: Decodable {
        let user: MembershipAccount
    }

    private struct MembershipResponse: Decodable {
        let membership: ClubMember?
    }

    private struct EnrollmentRequest: Encodable {
        let displayName: String
        let termsVersion: String
    }

    private let client: BojiHTTPClient
    private let betterAuth: BetterAuthClient

    init(configuration: MembershipServiceConfiguration?, transport: any MembershipTransport) {
        let client = BojiHTTPClient(configuration: configuration, transport: transport)
        self.client = client
        betterAuth = BetterAuthClient(httpClient: client)
    }

    func me(token: String) async throws -> MembershipAccount {
        let response: MeResponse = try await client.request(path: "api/me", method: "GET", token: token)
        return response.user
    }

    func membership(token: String) async throws -> ClubMember? {
        let response: MembershipResponse = try await client.request(
            path: "api/membership",
            method: "GET",
            token: token
        )
        return response.membership
    }

    func enroll(displayName: String, token: String) async throws -> ClubMember {
        let body = EnrollmentRequest(displayName: displayName, termsVersion: "community-v1")
        let response: MembershipResponse = try await client.request(
            path: "api/membership/enroll",
            method: "POST",
            token: token,
            body: try client.encodedBody(body)
        )
        guard let membership = response.membership else {
            throw MembershipAPIError.invalidResponse
        }
        return membership
    }

    func signIn(email: String, password: String) async throws -> String {
        try await betterAuth.signIn(email: email, password: password)
    }

    func signInWithApple(_ identity: AppleIdentity) async throws -> String {
        try await betterAuth.signInWithApple(identity)
    }

    func capabilities() async throws -> MembershipCapabilities {
        try await client.request(path: "api/capabilities", method: "GET")
    }

    func walletPass(token: String) async throws -> Data {
        let response = try await client.perform(
            path: "api/membership/wallet/pass",
            method: "GET",
            token: token,
            accept: "application/vnd.apple.pkpass"
        )
        let contentType = response.header(named: "Content-Type")?
            .split(separator: ";")
            .first?
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()
        guard response.statusCode == 200,
              contentType == "application/vnd.apple.pkpass",
              !response.data.isEmpty,
              response.data.count <= 2 * 1024 * 1024
        else {
            throw MembershipAPIError.invalidResponse
        }
        return response.data
    }

    func register(name: String, email: String, password: String) async throws {
        try await betterAuth.register(name: name, email: email, password: password)
    }

    func sendVerification(email: String) async throws {
        try await betterAuth.sendVerification(email: email)
    }

    func requestPasswordReset(email: String) async throws {
        try await betterAuth.requestPasswordReset(email: email)
    }

    func signOut(token: String) async throws {
        try await betterAuth.signOut(token: token)
    }

    func getSession(token: String) async throws -> BetterAuthSession? {
        try await betterAuth.getSession(token: token)
    }

    func changePassword(
        currentPassword: String,
        newPassword: String,
        token: String
    ) async throws -> String? {
        try await betterAuth.changePassword(
            currentPassword: currentPassword,
            newPassword: newPassword,
            token: token
        )
    }

    func revokeOtherSessions(token: String) async throws {
        try await betterAuth.revokeOtherSessions(token: token)
    }
}

protocol MembershipTokenStore: Sendable {
    func loadToken() -> String?
    func saveToken(_ token: String) throws
    func deleteToken() throws
}

enum MembershipTokenStoreError: Error, Sendable {
    case unavailable
}

final class KeychainMembershipTokenStore: @unchecked Sendable, MembershipTokenStore {
    private let service: String
    private let account = "membership-auth-token"

    init(service: String = Bundle.main.bundleIdentifier ?? "club.leanmuscle.boji") {
        self.service = service
    }

    func loadToken() -> String? {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: account,
            kSecReturnData: true,
            kSecMatchLimit: kSecMatchLimitOne
        ]
        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8)
        else {
            return nil
        }
        return token
    }

    func saveToken(_ token: String) throws {
        let data = Data(token.utf8)
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: account
        ]
        let updates: [CFString: Any] = [
            kSecValueData: data,
            kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]
        let updateStatus = SecItemUpdate(query as CFDictionary, updates as CFDictionary)
        if updateStatus == errSecSuccess { return }
        guard updateStatus == errSecItemNotFound else { throw MembershipTokenStoreError.unavailable }

        var insert = query
        insert[kSecValueData] = data
        insert[kSecAttrAccessible] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        let insertStatus = SecItemAdd(insert as CFDictionary, nil)
        guard insertStatus == errSecSuccess else { throw MembershipTokenStoreError.unavailable }
    }

    func deleteToken() throws {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: account
        ]
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw MembershipTokenStoreError.unavailable
        }
    }
}

struct MembershipCacheRecord: Codable, Equatable, Sendable {
    let serviceOrigin: String
    let account: MembershipAccount
    let card: ClubMember?
    let lastSyncedAt: Date

    enum CodingKeys: String, CodingKey {
        case serviceOrigin
        case account
        case card
        case lastSyncedAt
    }

    init(serviceOrigin: String, account: MembershipAccount, card: ClubMember?, lastSyncedAt: Date) {
        self.serviceOrigin = serviceOrigin
        self.account = account
        self.card = card
        self.lastSyncedAt = lastSyncedAt
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        serviceOrigin = try container.decode(String.self, forKey: .serviceOrigin)
        account = try container.decode(MembershipAccount.self, forKey: .account)
        card = try container.decodeIfPresent(ClubMember.self, forKey: .card)
        let dateDecoder = try container.superDecoder(forKey: .lastSyncedAt)
        let dateContainer = try dateDecoder.singleValueContainer()
        lastSyncedAt = try MembershipDateCoding.decodeDate(from: dateContainer)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(serviceOrigin, forKey: .serviceOrigin)
        try container.encode(account, forKey: .account)
        try container.encodeIfPresent(card, forKey: .card)
        let dateEncoder = container.superEncoder(forKey: .lastSyncedAt)
        let dateContainer = dateEncoder.singleValueContainer()
        try MembershipDateCoding.encodeDate(lastSyncedAt, to: dateContainer)
    }
}

protocol MembershipCacheStore: Sendable {
    func load() throws -> MembershipCacheRecord?
    func save(_ record: MembershipCacheRecord) throws
    func delete() throws
}

enum MembershipCacheStoreError: Error, Sendable {
    case unavailable
}

final class FileMembershipCacheStore: @unchecked Sendable, MembershipCacheStore {
    private let fileURL: URL?

    init(fileURL: URL? = FileMembershipCacheStore.defaultFileURL()) {
        self.fileURL = fileURL
    }

    func load() throws -> MembershipCacheRecord? {
        guard let fileURL else { throw MembershipCacheStoreError.unavailable }
        guard FileManager.default.fileExists(atPath: fileURL.path) else { return nil }
        do {
            let data = try Data(contentsOf: fileURL)
            return try MembershipDateCoding.decoder().decode(MembershipCacheRecord.self, from: data)
        } catch {
            throw MembershipCacheStoreError.unavailable
        }
    }

    func save(_ record: MembershipCacheRecord) throws {
        guard let fileURL else { throw MembershipCacheStoreError.unavailable }
        let directory = fileURL.deletingLastPathComponent()
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            try FileManager.default.setAttributes(
                [.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication],
                ofItemAtPath: directory.path
            )
            let data = try MembershipDateCoding.encoder().encode(record)
            try data.write(to: fileURL, options: .atomic)
            try FileManager.default.setAttributes(
                [.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication],
                ofItemAtPath: fileURL.path
            )
        } catch {
            throw MembershipCacheStoreError.unavailable
        }
    }

    func delete() throws {
        guard let fileURL else { throw MembershipCacheStoreError.unavailable }
        guard FileManager.default.fileExists(atPath: fileURL.path) else { return }
        do {
            try FileManager.default.removeItem(at: fileURL)
        } catch {
            throw MembershipCacheStoreError.unavailable
        }
    }

    private static func defaultFileURL() -> URL? {
        guard let applicationSupport = try? FileManager.default.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        ) else {
            return nil
        }
        return applicationSupport
            .appendingPathComponent("Boji", isDirectory: true)
            .appendingPathComponent("membership-cache.json", isDirectory: false)
    }
}

#if DEBUG
final class InMemoryMembershipTokenStore: @unchecked Sendable, MembershipTokenStore {
    private let lock = NSLock()
    private var token: String?

    init(initialToken: String? = nil) {
        token = initialToken
    }

    func loadToken() -> String? {
        lock.lock()
        defer { lock.unlock() }
        return token
    }

    func saveToken(_ token: String) throws {
        lock.lock()
        self.token = token
        lock.unlock()
    }

    func deleteToken() throws {
        lock.lock()
        token = nil
        lock.unlock()
    }
}

final class InMemoryMembershipCacheStore: @unchecked Sendable, MembershipCacheStore {
    private let lock = NSLock()
    private var record: MembershipCacheRecord?

    init(initialRecord: MembershipCacheRecord? = nil) {
        record = initialRecord
    }

    func load() throws -> MembershipCacheRecord? {
        lock.lock()
        defer { lock.unlock() }
        return record
    }

    func save(_ record: MembershipCacheRecord) throws {
        lock.lock()
        self.record = record
        lock.unlock()
    }

    func delete() throws {
        lock.lock()
        record = nil
        lock.unlock()
    }

    func snapshot() -> MembershipCacheRecord? {
        loadOrNil()
    }

    private func loadOrNil() -> MembershipCacheRecord? {
        lock.lock()
        defer { lock.unlock() }
        return record
    }
}

actor UITestingMembershipTransport: MembershipTransport {
    private let token = "ui-test-token"
    private let account = MembershipAccount(
        id: "ui-test-user",
        name: "UI Test User",
        email: "ui-test@example.invalid",
        emailVerified: true
    )
    private var card: ClubMember?

    func send(_ request: URLRequest) async throws -> MembershipHTTPResponse {
        let path = request.url?.path ?? ""
        switch (request.httpMethod ?? "GET", path) {
        case ("POST", "/api/auth/sign-in/email"):
            return MembershipHTTPResponse(data: Data("{}".utf8), statusCode: 200, headers: ["set-auth-token": token])
        case ("POST", "/api/auth/sign-up/email"),
             ("POST", "/api/auth/send-verification-email"),
             ("POST", "/api/auth/request-password-reset"),
             ("POST", "/api/auth/sign-out"):
            return MembershipHTTPResponse(data: Data("{}".utf8), statusCode: 200)
        case ("GET", "/api/auth/get-session"):
            guard request.value(forHTTPHeaderField: "Authorization") == "Bearer \(token)" else {
                return errorResponse(statusCode: 401, code: "UNAUTHORIZED")
            }
            return try encoded(UITestingSessionResponse(
                user: account,
                session: UITestingSessionDetails(
                    id: "ui-test-session",
                    userId: account.id,
                    createdAt: Date(),
                    expiresAt: Date().addingTimeInterval(60 * 60)
                )
            ))
        case ("POST", "/api/auth/change-password"):
            guard request.value(forHTTPHeaderField: "Authorization") == "Bearer \(token)" else {
                return errorResponse(statusCode: 401, code: "UNAUTHORIZED")
            }
            return MembershipHTTPResponse(
                data: Data("{}".utf8),
                statusCode: 200,
                headers: ["set-auth-token": token]
            )
        case ("POST", "/api/auth/revoke-other-sessions"):
            guard request.value(forHTTPHeaderField: "Authorization") == "Bearer \(token)" else {
                return errorResponse(statusCode: 401, code: "UNAUTHORIZED")
            }
            return try encoded(UITestingRevokeResponse(status: true))
        case ("GET", "/api/me"):
            guard request.value(forHTTPHeaderField: "Authorization") == "Bearer \(token)" else {
                return errorResponse(statusCode: 401, code: "UNAUTHORIZED")
            }
            return try encoded(["user": account])
        case ("GET", "/api/membership"):
            guard request.value(forHTTPHeaderField: "Authorization") == "Bearer \(token)" else {
                return errorResponse(statusCode: 401, code: "UNAUTHORIZED")
            }
            return try encoded(MembershipPayload(membership: card))
        case ("POST", "/api/membership/enroll"):
            guard request.value(forHTTPHeaderField: "Authorization") == "Bearer \(token)" else {
                return errorResponse(statusCode: 401, code: "UNAUTHORIZED")
            }
            if card == nil {
                let displayName = displayName(from: request.httpBody) ?? "测试会员"
                card = ClubMember(
                    id: "ui-test-membership",
                    userId: account.id,
                    memberNumber: "PREVIEW-MEMBER",
                    displayName: displayName,
                    joinedAt: Date(),
                    tier: "community",
                    status: "active",
                    grantedEntitlements: [
                        MembershipEntitlement(id: "47ad41b2-f031-41ee-8b01-4ff2e5e6e221", code: "local_tracking", name: "日常记录", description: "训练、饮水与睡眠，按自己的节奏。", grantedAt: Date(), expiresAt: nil),
                        MembershipEntitlement(id: "47ad41b2-f031-41ee-8b01-4ff2e5e6e222", code: "training_library", name: "基础训练库", description: "居家与健身房课程，逐组完成。", grantedAt: Date(), expiresAt: nil),
                        MembershipEntitlement(id: "47ad41b2-f031-41ee-8b01-4ff2e5e6e223", code: "progress_history", name: "成长足迹", description: "查看训练历史与身体数据趋势。", grantedAt: Date(), expiresAt: nil)
                    ],
                    expiresAt: nil
                )
            }
            return try encoded(MembershipPayload(membership: card))
        default:
            return errorResponse(statusCode: 404, code: "NOT_FOUND")
        }
    }

    private struct MembershipPayload: Encodable {
        let membership: ClubMember?
    }

    private struct UITestingSessionResponse: Encodable {
        let user: MembershipAccount
        let session: UITestingSessionDetails
    }

    private struct UITestingSessionDetails: Encodable {
        let id: String
        let userId: String
        let createdAt: Date
        let expiresAt: Date
    }

    private struct UITestingRevokeResponse: Encodable {
        let status: Bool
    }

    private func encoded<Response: Encodable>(_ response: Response) throws -> MembershipHTTPResponse {
        MembershipHTTPResponse(data: try MembershipDateCoding.encoder().encode(response), statusCode: 200)
    }

    private func errorResponse(statusCode: Int, code: String) -> MembershipHTTPResponse {
        MembershipHTTPResponse(
            data: Data("{\"code\":\"\(code)\",\"message\":\"test\"}".utf8),
            statusCode: statusCode
        )
    }

    private func displayName(from data: Data?) -> String? {
        guard let data,
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            return nil
        }
        return object["displayName"] as? String
    }
}
#endif
