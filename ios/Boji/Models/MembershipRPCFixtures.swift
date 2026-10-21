#if DEBUG
import BojiAPI
import Foundation
import SwiftProtobuf

/// Connect 响应和请求的测试夹具。
///
/// 单元测试只导入 `Boji`，不链接 `BojiAPI`。测试通过这些函数构造和读取 bizserver 消息，
/// UI 测试的 `UITestingMembershipTransport` 也使用它们。
enum MembershipRPCFixtures {
    /// Connect 错误码，以及 Connect 协议为它规定的 HTTP 状态。
    enum ErrorCode: String, Sendable {
        case unauthenticated
        case permissionDenied = "permission_denied"
        case notFound = "not_found"
        case alreadyExists = "already_exists"
        case failedPrecondition = "failed_precondition"
        case resourceExhausted = "resource_exhausted"
        case unavailable
        case internalError = "internal"

        var httpStatus: Int {
            switch self {
            case .unauthenticated: return 401
            case .permissionDenied: return 403
            case .notFound: return 404
            case .alreadyExists: return 409
            case .failedPrecondition: return 400
            case .resourceExhausted: return 429
            case .unavailable: return 503
            case .internalError: return 500
            }
        }
    }

    /// `CreateMembership` 请求中客户端填写的字段。
    struct CreateMembershipRequest: Equatable, Sendable {
        let parent: String
        let nickname: String
        let termsVersion: String
    }

    static func serverConfig(appleSignIn: Bool, walletPass: Bool) -> MembershipHTTPResponse {
        var config = Boji_V1_ServerConfig()
        config.name = "serverConfig"
        config.appleLoginEnabled = appleSignIn
        config.walletPassEnabled = walletPass
        return success(config)
    }

    static func memberships(_ cards: [ClubMember]) -> MembershipHTTPResponse {
        var response = Boji_V1_ListMembershipsResponse()
        response.memberships = cards.map(message(for:))
        return success(response)
    }

    static func membership(_ card: ClubMember) -> MembershipHTTPResponse {
        success(message(for: card))
    }

    /// 任意 `Membership` 消息，用于测试客户端拒绝不合契约的响应。
    static func membership(
        name: String,
        memberNumber: String = "sample-member",
        hasCreateTime: Bool = true,
        tier: Int = 1,
        state: Int = 1
    ) -> MembershipHTTPResponse {
        var membership = Boji_V1_Membership()
        membership.name = name
        membership.memberNumber = memberNumber
        membership.nickname = "测试会员"
        membership.tier = Boji_V1_Membership.Tier(rawValue: tier) ?? .UNRECOGNIZED(tier)
        membership.state = Boji_V1_Membership.State(rawValue: state) ?? .UNRECOGNIZED(state)
        if hasCreateTime {
            membership.createTime = Google_Protobuf_Timestamp(date: Date(timeIntervalSince1970: 1_792_483_200))
        }
        return success(membership)
    }

    static func pass(_ content: Data, mimeType: String = "application/vnd.apple.pkpass") -> MembershipHTTPResponse {
        var pass = Boji_V1_MembershipPass()
        pass.name = "users/me/memberships/pass-test/pass"
        pass.content = content
        pass.mimeType = mimeType
        return success(pass)
    }

    /// Connect 错误响应。`reason` 非空时，响应带有 bizserver 域的 `ErrorInfo`。
    static func error(_ code: ErrorCode, reason: String?) -> MembershipHTTPResponse {
        var body: [String: Any] = ["code": code.rawValue, "message": "test error"]
        if let reason {
            var info = Google_Rpc_ErrorInfo()
            info.reason = reason
            info.domain = MembershipRPCClient.errorDomain
            let payload = (try? info.serializedData()) ?? Data()
            body["details"] = [["type": Google_Rpc_ErrorInfo.protoMessageName, "value": payload.base64EncodedString()]]
        }
        let data = (try? JSONSerialization.data(withJSONObject: body)) ?? Data()
        return MembershipHTTPResponse(
            data: data,
            statusCode: code.httpStatus,
            headers: ["Content-Type": "application/json"]
        )
    }

    static func createMembershipRequest(from body: Data?) -> CreateMembershipRequest? {
        guard let body, let request = try? Boji_V1_CreateMembershipRequest(serializedBytes: body) else { return nil }
        return CreateMembershipRequest(
            parent: request.parent,
            nickname: request.membership.nickname,
            termsVersion: request.membership.termsVersion
        )
    }

    static func listMembershipsParent(from body: Data?) -> String? {
        guard let body, let request = try? Boji_V1_ListMembershipsRequest(serializedBytes: body) else { return nil }
        return request.parent
    }

    static func membershipPassName(from body: Data?) -> String? {
        guard let body, let request = try? Boji_V1_GetMembershipPassRequest(serializedBytes: body) else { return nil }
        return request.name
    }

    private static func message(for card: ClubMember) -> Boji_V1_Membership {
        var membership = Boji_V1_Membership()
        membership.name = "users/\(card.userId)/memberships/\(card.id)"
        membership.memberNumber = card.memberNumber
        membership.nickname = card.displayName
        membership.termsVersion = MembershipRPCClient.termsVersion
        membership.tier = card.tier == "community" ? .community : .unspecified
        membership.state = card.status == "active" ? .active : .suspended
        membership.createTime = Google_Protobuf_Timestamp(date: card.joinedAt)
        if let expiresAt = card.expiresAt {
            membership.expireTime = Google_Protobuf_Timestamp(date: expiresAt)
        }
        membership.entitlements = card.entitlements.map { entitlement in
            var effective = Boji_V1_Membership.EffectiveEntitlement()
            effective.code = entitlement.code
            effective.displayName = entitlement.name
            effective.description_p = entitlement.description
            effective.grantTime = Google_Protobuf_Timestamp(date: entitlement.grantedAt ?? card.joinedAt)
            if let expiresAt = entitlement.expiresAt {
                effective.expireTime = Google_Protobuf_Timestamp(date: expiresAt)
            }
            return effective
        }
        return membership
    }

    private static func success(_ message: some SwiftProtobuf.Message) -> MembershipHTTPResponse {
        MembershipHTTPResponse(
            data: (try? message.serializedData()) ?? Data(),
            statusCode: 200,
            headers: ["Content-Type": "application/proto"]
        )
    }
}
#endif
