import Foundation

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

struct BojiHTTPClient: Sendable {
    private struct APIErrorResponse: Decodable {
        let code: String?
    }

    private let configuration: MembershipServiceConfiguration?
    private let transport: any MembershipTransport

    init(configuration: MembershipServiceConfiguration?, transport: any MembershipTransport) {
        self.configuration = configuration
        self.transport = transport
    }

    func request<Response: Decodable>(
        path: String,
        method: String,
        token: String? = nil,
        body: Data? = nil,
        accept: String = "application/json"
    ) async throws -> Response {
        let response = try await perform(
            path: path,
            method: method,
            token: token,
            body: body,
            accept: accept
        )
        do {
            return try MembershipDateCoding.decoder().decode(Response.self, from: response.data)
        } catch {
            throw MembershipAPIError.invalidResponse
        }
    }

    func perform(
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

    func encodedBody<Value: Encodable>(_ value: Value) throws -> Data {
        do {
            return try JSONEncoder().encode(value)
        } catch {
            throw MembershipAPIError.invalidResponse
        }
    }
}
