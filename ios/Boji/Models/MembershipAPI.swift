import Foundation
import Security

struct MembershipServiceConfiguration: Sendable, Equatable {
    let baseURL: URL
    let origin: String

    init?(validating rawValue: String, allowLoopbackHTTP: Bool) {
        let trimmedValue = rawValue.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedValue.isEmpty,
              let components = URLComponents(string: trimmedValue),
              let url = components.url,
              let scheme = components.scheme?.lowercased(),
              let host = components.host?.lowercased(),
              !host.isEmpty,
              components.user == nil,
              components.password == nil,
              components.query == nil,
              components.fragment == nil,
              components.port.map({ (1...65_535).contains($0) }) ?? true
        else {
            return nil
        }

        switch scheme {
        case "https":
            break
        case "http":
            let loopbackHosts: Set<String> = ["localhost", "127.0.0.1", "::1", "[::1]"]
            guard allowLoopbackHTTP, loopbackHosts.contains(host) else { return nil }
        default:
            return nil
        }

        self.baseURL = url
        let bracketedHost = host.contains(":") && !host.hasPrefix("[") ? "[\(host)]" : host
        let defaultPort = (scheme == "https" && components.port == 443)
            || (scheme == "http" && components.port == 80)
        let portPart = components.port == nil || defaultPort ? "" : ":\(components.port ?? 0)"
        self.origin = "\(scheme)://\(bracketedHost)\(portPart)"
    }

    static func live() -> MembershipServiceConfiguration? {
        let configuredValue = Bundle.main.object(forInfoDictionaryKey: "BojiAPIBaseURL") as? String
        #if DEBUG
        if let configuredValue,
           !configuredValue.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return MembershipServiceConfiguration(validating: configuredValue, allowLoopbackHTTP: true)
        }
        return MembershipServiceConfiguration(
            validating: "http://localhost:3000",
            allowLoopbackHTTP: true
        )
        #else
        guard let configuredValue,
              !configuredValue.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        else {
            return nil
        }
        return MembershipServiceConfiguration(validating: configuredValue, allowLoopbackHTTP: false)
        #endif
    }
}

struct MembershipHTTPResponse: Sendable {
    let data: Data
    let statusCode: Int
    let headers: [String: String]

    init(data: Data, statusCode: Int, headers: [String: String] = [:]) {
        self.data = data
        self.statusCode = statusCode
        self.headers = headers
    }

    func header(named name: String) -> String? {
        let expectedName = name.lowercased()
        return headers.first { $0.key.lowercased() == expectedName }?.value
    }
}

protocol MembershipTransport: Sendable {
    func send(_ request: URLRequest) async throws -> MembershipHTTPResponse
}

private final class MembershipRedirectBlocker: NSObject, URLSessionTaskDelegate, @unchecked Sendable {
    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        willPerformHTTPRedirection response: HTTPURLResponse,
        newRequest request: URLRequest,
        completionHandler: @escaping @Sendable (URLRequest?) -> Void
    ) {
        completionHandler(nil)
    }
}

struct URLSessionMembershipTransport: @unchecked Sendable, MembershipTransport {
    private let redirectBlocker: MembershipRedirectBlocker
    private let session: URLSession

    init() {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.httpCookieStorage = nil
        configuration.httpShouldSetCookies = false
        configuration.urlCache = nil
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        configuration.httpAdditionalHeaders = ["Accept": "application/json"]

        let redirectBlocker = MembershipRedirectBlocker()
        self.redirectBlocker = redirectBlocker
        self.session = URLSession(
            configuration: configuration,
            delegate: redirectBlocker,
            delegateQueue: nil
        )
    }

    func send(_ request: URLRequest) async throws -> MembershipHTTPResponse {
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw MembershipAPIError.invalidResponse
        }

        var headers: [String: String] = [:]
        for (key, value) in httpResponse.allHeaderFields {
            guard let name = key as? String, let headerValue = value as? String else { continue }
            headers[name] = headerValue
        }
        return MembershipHTTPResponse(data: data, statusCode: httpResponse.statusCode, headers: headers)
    }
}

enum MembershipAPIError: Error, Sendable, Equatable {
    case notConfigured
    case invalidResponse
    case network
    case server(statusCode: Int, code: String?)
}

struct MembershipAPI: Sendable {
    private struct APIErrorResponse: Decodable {
        let code: String?
        let message: String?
    }

    private struct MeResponse: Decodable {
        let user: MembershipAccount
    }

    private struct MembershipResponse: Decodable {
        let membership: ClubMember?
    }

    private struct SignUpRequest: Encodable {
        let name: String
        let email: String
        let password: String
    }

    private struct SignInRequest: Encodable {
        let email: String
        let password: String
    }

    private struct EmailRequest: Encodable {
        let email: String
    }

    private struct AppleSignInRequest: Encodable {
        let provider = "apple"
        let idToken: AppleIdentity
    }

    private struct EnrollmentRequest: Encodable {
        let displayName: String
        let termsVersion: String
    }

    private let configuration: MembershipServiceConfiguration?
    private let transport: any MembershipTransport

    init(configuration: MembershipServiceConfiguration?, transport: any MembershipTransport) {
        self.configuration = configuration
        self.transport = transport
    }

    func me(token: String) async throws -> MembershipAccount {
        let response: MeResponse = try await request(path: "api/me", method: "GET", token: token)
        return response.user
    }

    func membership(token: String) async throws -> ClubMember? {
        let response: MembershipResponse = try await request(path: "api/membership", method: "GET", token: token)
        return response.membership
    }

    func enroll(displayName: String, token: String) async throws -> ClubMember {
        let body = EnrollmentRequest(displayName: displayName, termsVersion: "community-v1")
        let response: MembershipResponse = try await request(
            path: "api/membership/enroll",
            method: "POST",
            token: token,
            body: try encodedBody(body)
        )
        guard let membership = response.membership else {
            throw MembershipAPIError.invalidResponse
        }
        return membership
    }

    func signIn(email: String, password: String) async throws -> String {
        let body = SignInRequest(email: email, password: password)
        let response = try await perform(
            path: "api/auth/sign-in/email",
            method: "POST",
            body: try encodedBody(body)
        )
        guard let token = response.header(named: "set-auth-token"), !token.isEmpty else {
            throw MembershipAPIError.invalidResponse
        }
        return token
    }

    func signInWithApple(_ identity: AppleIdentity) async throws -> String {
        let response = try await perform(path: "api/auth/sign-in/social", method: "POST", body: try encodedBody(AppleSignInRequest(idToken: identity)))
        guard let token = response.header(named: "set-auth-token"), !token.isEmpty else {
            throw MembershipAPIError.invalidResponse
        }
        return token
    }

    func capabilities() async throws -> MembershipCapabilities {
        try await request(path: "api/capabilities", method: "GET")
    }

    func walletPass(token: String) async throws -> Data {
        let response = try await perform(path: "api/membership/wallet/pass", method: "GET", token: token, accept: "application/vnd.apple.pkpass")
        let contentType = response.header(named: "Content-Type")?.split(separator: ";").first?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard response.statusCode == 200, contentType == "application/vnd.apple.pkpass",
              !response.data.isEmpty, response.data.count <= 2 * 1024 * 1024 else {
            throw MembershipAPIError.invalidResponse
        }
        return response.data
    }

    func register(name: String, email: String, password: String) async throws {
        let body = SignUpRequest(name: name, email: email, password: password)
        _ = try await perform(
            path: "api/auth/sign-up/email",
            method: "POST",
            body: try encodedBody(body)
        )
    }

    func sendVerification(email: String) async throws {
        _ = try await perform(
            path: "api/auth/send-verification-email",
            method: "POST",
            body: try encodedBody(EmailRequest(email: email))
        )
    }

    func requestPasswordReset(email: String) async throws {
        _ = try await perform(
            path: "api/auth/request-password-reset",
            method: "POST",
            body: try encodedBody(EmailRequest(email: email))
        )
    }

    func signOut(token: String) async throws {
        _ = try await perform(path: "api/auth/sign-out", method: "POST", token: token, body: Data("{}".utf8))
    }

    private func request<Response: Decodable>(
        path: String,
        method: String,
        token: String? = nil,
        body: Data? = nil
    ) async throws -> Response {
        let response = try await perform(path: path, method: method, token: token, body: body)
        do {
            return try MembershipDateCoding.decoder().decode(Response.self, from: response.data)
        } catch {
            throw MembershipAPIError.invalidResponse
        }
    }

    private func perform(
        path: String,
        method: String,
        token: String? = nil,
        body: Data? = nil,
        accept: String = "application/json"
    ) async throws -> MembershipHTTPResponse {
        guard let configuration else { throw MembershipAPIError.notConfigured }
        let url = configuration.baseURL.appendingPathComponent(path)
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue(accept, forHTTPHeaderField: "Accept")
        request.timeoutInterval = 20

        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }

        let response: MembershipHTTPResponse
        do {
            response = try await transport.send(request)
        } catch {
            throw MembershipAPIError.network
        }

        guard (200...299).contains(response.statusCode) else {
            let errorCode = try? MembershipDateCoding.decoder()
                .decode(APIErrorResponse.self, from: response.data)
                .code
            throw MembershipAPIError.server(statusCode: response.statusCode, code: errorCode)
        }
        return response
    }

    private func encodedBody(_ value: some Encodable) throws -> Data {
        do {
            return try JSONEncoder().encode(value)
        } catch {
            throw MembershipAPIError.invalidResponse
        }
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
                    memberNumber: "TEST-000001",
                    displayName: displayName,
                    joinedAt: Date(),
                    tier: "community",
                    status: "active",
                    entitlements: ["local_tracking", "training_library", "progress_history"],
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
