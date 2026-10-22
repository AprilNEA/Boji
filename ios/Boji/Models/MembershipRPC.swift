import BojiAPI
import Connect
import Foundation
import SwiftProtobuf

/// 调用 bizserver 的 Connect 服务：`boji.v1` 的系统配置、会员卡、钱包凭证和会员码，
/// 以及工作人员校验会员码的 `boji.admin.v1.MembershipCodeService`。
///
/// 请求类型来自 `BojiAPI` 的生成代码，契约以 `bizserver/proto/boji/` 为准。
/// 请求经过 `MembershipTransport`，与 Better Auth 端点共用无 Cookie 会话、重定向拦截和测试传输层。
struct MembershipRPCClient: Sendable {
    /// bizserver 错误的 `ErrorInfo.domain`。
    static let errorDomain = "boji.leanmuscle.club"
    /// 当前社区守则版本。`CreateMembership` 必须提交此值。
    static let termsVersion = "community-v1"
    /// `MembershipPass.content` 的契约上限。
    static let maxPassBytes = 1024 * 1024

    private let system: Boji_V1_SystemServiceClient?
    private let memberships: Boji_V1_MembershipServiceClient?
    private let wallet: Boji_V1_WalletServiceClient?
    private let codes: Boji_V1_MembershipCodeServiceClient?
    private let staffCodes: Boji_Admin_V1_MembershipCodeServiceClient?

    init(configuration: MembershipServiceConfiguration?, transport: any MembershipTransport) {
        guard let configuration else {
            system = nil
            memberships = nil
            wallet = nil
            codes = nil
            staffCodes = nil
            return
        }
        // URLSession 已解码 Content-Encoding，所以 Connect 不再声明或解压响应压缩。
        let client = ProtocolClient(
            httpClient: MembershipConnectHTTPClient(transport: transport),
            config: ProtocolClientConfig(
                host: configuration.baseURL.absoluteString,
                networkProtocol: .connect,
                codec: ProtoCodec(),
                responseCompressionPools: []
            )
        )
        system = Boji_V1_SystemServiceClient(client: client)
        memberships = Boji_V1_MembershipServiceClient(client: client)
        wallet = Boji_V1_WalletServiceClient(client: client)
        codes = Boji_V1_MembershipCodeServiceClient(client: client)
        staffCodes = Boji_Admin_V1_MembershipCodeServiceClient(client: client)
    }

    /// 读取服务端开关。此调用不需要登录。
    func serverConfig() async throws -> MembershipCapabilities {
        guard let system else { throw MembershipAPIError.notConfigured }
        var request = Boji_V1_GetServerConfigRequest()
        request.name = "serverConfig"
        let config = try Self.output(of: await system.getServerConfig(request: request, headers: [:]))
        return MembershipCapabilities(
            appleSignIn: config.appleLoginEnabled,
            walletPass: config.walletPassEnabled,
            membershipCode: config.membershipCodeEnabled
        )
    }

    /// 返回当前用户的会员卡。没有会员卡时返回 nil。
    func currentMembership(token: String) async throws -> ClubMember? {
        guard let memberships else { throw MembershipAPIError.notConfigured }
        var request = Boji_V1_ListMembershipsRequest()
        request.parent = "users/me"
        let response = try Self.output(of: await memberships.listMemberships(
            request: request,
            headers: Self.authorization(token)
        ))
        // 每个用户最多有一张会员卡。
        guard response.memberships.count <= 1 else { throw MembershipAPIError.invalidResponse }
        return try response.memberships.first.map(ClubMember.init(rpc:))
    }

    /// 领取会员卡。卡已存在时，返回服务器上的现有卡，不修改它。
    func createMembership(nickname: String, token: String) async throws -> ClubMember {
        guard let memberships else { throw MembershipAPIError.notConfigured }
        var request = Boji_V1_CreateMembershipRequest()
        request.parent = "users/me"
        request.membership.nickname = nickname
        request.membership.termsVersion = Self.termsVersion
        do {
            let membership = try Self.output(of: await memberships.createMembership(
                request: request,
                headers: Self.authorization(token)
            ))
            return try ClubMember(rpc: membership)
        } catch let error as MembershipAPIError where error.serverCode == "MEMBERSHIP_ALREADY_EXISTS" {
            guard let existing = try await currentMembership(token: token) else {
                throw MembershipAPIError.invalidResponse
            }
            return existing
        }
    }

    /// 取得会员卡的已签名 `.pkpass` 文件。
    func membershipPass(membershipID: String, token: String) async throws -> Data {
        guard let wallet else { throw MembershipAPIError.notConfigured }
        guard !membershipID.isEmpty, !membershipID.contains("/") else { throw MembershipAPIError.invalidResponse }
        var request = Boji_V1_GetMembershipPassRequest()
        request.name = "users/me/memberships/\(membershipID)/pass"
        let pass = try Self.output(of: await wallet.getMembershipPass(
            request: request,
            headers: Self.authorization(token)
        ))
        guard pass.mimeType.lowercased() == "application/vnd.apple.pkpass",
              !pass.content.isEmpty,
              pass.content.count <= Self.maxPassBytes
        else {
            throw MembershipAPIError.invalidResponse
        }
        return pass.content
    }

    /// 取得会员卡的会员码：静态码和动态码的 TOTP 参数。
    func membershipCode(membershipID: String, token: String) async throws -> MembershipCode {
        guard let codes else { throw MembershipAPIError.notConfigured }
        guard !membershipID.isEmpty, !membershipID.contains("/") else { throw MembershipAPIError.invalidResponse }
        var request = Boji_V1_GetMembershipCodeRequest()
        request.name = "users/me/memberships/\(membershipID)/code"
        let code = try Self.output(of: await codes.getMembershipCode(
            request: request,
            headers: Self.authorization(token)
        ))
        return try MembershipCode(rpc: code, membershipID: membershipID)
    }

    /// 工作人员校验扫描到的会员码，返回会员码指向的会员卡。
    ///
    /// 需要有 `membership.read` 权限、12 小时内登录的会话。
    func verifyMembershipCode(_ value: String, token: String) async throws -> MembershipVerification {
        guard let staffCodes else { throw MembershipAPIError.notConfigured }
        var request = Boji_Admin_V1_VerifyMembershipCodeRequest()
        request.code = value
        let response = try Self.output(of: await staffCodes.verifyMembershipCode(
            request: request,
            headers: Self.authorization(token)
        ))
        let kind: MembershipVerification.Kind
        switch response.codeKind {
        case .static: kind = .walletPass
        case .dynamic: kind = .app
        case .unspecified, .UNRECOGNIZED: throw MembershipAPIError.invalidResponse
        }
        guard response.hasMembership else { throw MembershipAPIError.invalidResponse }
        return MembershipVerification(member: try ClubMember(rpc: response.membership), kind: kind)
    }

    private static func authorization(_ token: String) -> Headers {
        ["authorization": ["Bearer \(token)"]]
    }

    private static func output<Output>(of response: ResponseMessage<Output>) throws -> Output {
        switch response.result {
        case .success(let output):
            return output
        case .failure(let error):
            throw MembershipAPIError(connectError: error)
        }
    }
}

extension MembershipAPIError {
    /// Better Auth 错误的 `code`，或 Connect 错误的 `ErrorInfo.reason`。
    var serverCode: String? {
        if case .server(_, let code) = self { return code }
        return nil
    }

    /// 把 Connect 错误转换为会员服务错误。
    ///
    /// `statusCode` 是 Connect 协议为该错误码规定的 HTTP 状态，`code` 是 bizserver 的 `ErrorInfo.reason`。
    /// 这样，Better Auth 错误和 Connect 错误可以用同一套规则处理。
    init(connectError error: ConnectError) {
        if let failure = error.exception as? MembershipConnectTransportFailure {
            self = failure.error
            return
        }
        if error.exception != nil {
            // Connect 无法解码响应。
            self = .invalidResponse
            return
        }
        let details: [Google_Rpc_ErrorInfo] = error.unpackedDetails()
        let reason = details.first { $0.domain == MembershipRPCClient.errorDomain }?.reason
        // 没有 ErrorInfo 的不可用或超时响应来自网关或网络，不来自 bizserver。
        if reason == nil, [.unavailable, .deadlineExceeded, .canceled].contains(error.code) {
            self = .network
            return
        }
        self = .server(statusCode: Self.httpStatus(for: error.code), code: reason)
    }

    /// Connect 协议规定的错误码与 HTTP 状态对照。
    private static func httpStatus(for code: Code) -> Int {
        switch code {
        case .ok: return 200
        case .canceled: return 499
        case .invalidArgument, .failedPrecondition, .outOfRange: return 400
        case .unauthenticated: return 401
        case .permissionDenied: return 403
        case .notFound: return 404
        case .alreadyExists, .aborted: return 409
        case .resourceExhausted: return 429
        case .unimplemented: return 501
        case .unavailable: return 503
        case .deadlineExceeded: return 504
        case .unknown, .internalError, .dataLoss: return 500
        }
    }
}

/// 传输层失败。`MembershipConnectHTTPClient` 把它放在 `ConnectError.exception` 中。
struct MembershipConnectTransportFailure: Error, Sendable {
    let error: MembershipAPIError
}

/// 让 connect-swift 通过 `MembershipTransport` 发送一元请求。
struct MembershipConnectHTTPClient: HTTPClientInterface, Sendable {
    let transport: any MembershipTransport

    func unary(
        request: HTTPRequest<Data?>,
        onMetrics: @escaping @Sendable (HTTPMetrics) -> Void,
        onResponse: @escaping @Sendable (HTTPResponse) -> Void
    ) -> Cancelable {
        var urlRequest = URLRequest(url: request.url)
        urlRequest.httpMethod = request.method.rawValue
        urlRequest.httpBody = request.message
        urlRequest.timeoutInterval = 20
        for (name, values) in request.headers where !values.isEmpty {
            urlRequest.setValue(values.joined(separator: ","), forHTTPHeaderField: name)
        }
        let transport = transport
        let task = Task {
            let response: HTTPResponse
            do {
                let httpResponse = try await transport.send(urlRequest)
                response = HTTPResponse(
                    code: Code.fromHTTPStatus(httpResponse.statusCode),
                    headers: Self.connectHeaders(httpResponse.headers),
                    message: httpResponse.data,
                    trailers: [:],
                    error: nil,
                    tracingInfo: HTTPResponse.TracingInfo(httpStatus: httpResponse.statusCode)
                )
            } catch {
                let failure = MembershipConnectTransportFailure(
                    error: error as? MembershipAPIError ?? .network
                )
                response = HTTPResponse(
                    code: .unavailable,
                    headers: [:],
                    message: nil,
                    trailers: [:],
                    error: ConnectError(code: .unavailable, message: "transport failure", exception: failure),
                    tracingInfo: nil
                )
            }
            onResponse(response)
            onMetrics(HTTPMetrics(taskMetrics: nil))
        }
        return Cancelable { task.cancel() }
    }

    /// 会员服务只使用一元调用。
    func stream(
        request: HTTPRequest<Data?>,
        responseCallbacks: ResponseCallbacks
    ) -> RequestCallbacks<Data> {
        responseCallbacks.receiveClose(
            .unimplemented,
            [:],
            ConnectError(code: .unimplemented, message: "streaming is not supported")
        )
        return RequestCallbacks(cancel: {}, sendData: { _ in }, sendClose: {})
    }

    /// URLSession 已经解码 Content-Encoding，所以去掉这个头，避免 Connect 再解压一次。
    private static func connectHeaders(_ headers: [String: String]) -> Headers {
        var result = Headers()
        for (name, value) in headers {
            let key = name.lowercased()
            guard key != HeaderConstants.contentEncoding else { continue }
            result[key, default: []].append(value)
        }
        return result
    }
}

extension ClubMember {
    /// 把 bizserver 的 `Membership` 转换为 App 的会员卡。
    ///
    /// 未知等级不会被当成社区卡。未知状态按暂停处理，与契约注释一致。
    init(rpc membership: Boji_V1_Membership) throws {
        let segments = membership.name.split(separator: "/", omittingEmptySubsequences: false)
        guard segments.count == 4,
              segments[0] == "users",
              segments[2] == "memberships",
              !segments[1].isEmpty,
              segments[1] != "me",
              !segments[3].isEmpty,
              !membership.memberNumber.isEmpty,
              membership.hasCreateTime
        else {
            throw MembershipAPIError.invalidResponse
        }

        let entitlements = try membership.entitlements.map { entitlement in
            guard !entitlement.code.isEmpty, entitlement.hasGrantTime else {
                throw MembershipAPIError.invalidResponse
            }
            return MembershipEntitlement(
                id: nil,
                code: entitlement.code,
                name: entitlement.displayName,
                description: entitlement.description_p,
                grantedAt: entitlement.grantTime.date,
                expiresAt: entitlement.hasExpireTime ? entitlement.expireTime.date : nil
            )
        }

        let tier: String
        switch membership.tier {
        case .community: tier = "community"
        case .unspecified, .UNRECOGNIZED: tier = "unknown"
        }

        let status: String
        switch membership.state {
        case .active: status = "active"
        case .suspended, .unspecified, .UNRECOGNIZED: status = "suspended"
        }

        self.init(
            id: String(segments[3]),
            userId: String(segments[1]),
            memberNumber: membership.memberNumber,
            displayName: membership.nickname,
            joinedAt: membership.createTime.date,
            tier: tier,
            status: status,
            grantedEntitlements: entitlements,
            expiresAt: membership.hasExpireTime ? membership.expireTime.date : nil
        )
    }
}

extension MembershipCode {
    /// 把 bizserver 的 `MembershipCode` 转换为 App 的会员码，并校验 TOTP 参数。
    ///
    /// 资源名必须属于请求的会员卡，以免把另一张卡的码显示在这张卡上。
    init(rpc code: Boji_V1_MembershipCode, membershipID: String) throws {
        let segments = code.name.split(separator: "/", omittingEmptySubsequences: false)
        let period = code.totp.period
        guard segments.count == 5,
              segments[0] == "users",
              segments[2] == "memberships",
              segments[3] == membershipID,
              segments[4] == "code",
              !code.staticValue.isEmpty,
              !code.dynamicValuePrefix.isEmpty,
              code.hasTotp,
              code.totp.secret.count >= Self.minimumSecretBytes,
              Self.allowedDigits.contains(Int(code.totp.digits)),
              code.totp.hasPeriod,
              period.seconds > 0,
              period.seconds <= 300,
              period.nanos == 0
        else {
            throw MembershipAPIError.invalidResponse
        }
        self.init(
            membershipID: membershipID,
            staticValue: code.staticValue,
            dynamicValuePrefix: code.dynamicValuePrefix,
            secret: code.totp.secret,
            digits: Int(code.totp.digits),
            period: Int(period.seconds)
        )
    }
}
