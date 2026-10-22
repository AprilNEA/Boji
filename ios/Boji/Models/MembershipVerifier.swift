import Foundation
import Observation

/// 工作人员扫描到的会员码，以及它指向的会员卡。
struct MembershipVerification: Equatable, Sendable {
    /// 会员码的来源。
    enum Kind: Equatable, Sendable {
        /// 钱包会员卡上的静态二维码。它不变化，可能是截图。
        case walletPass
        /// 会员在 App 中出示的动态码。
        case app
    }

    /// 会员卡在校验时的状态。
    enum Standing: Equatable, Sendable {
        case valid
        case suspended
        case expired
    }

    let member: ClubMember
    let kind: Kind

    /// 有效卡必须是已知等级、活动状态且未到期。活动状态但已到期的卡算作过期，其余算作暂停。
    var standing: Standing {
        if member.isActive { return .valid }
        if member.status == "active", let expiresAt = member.expiresAt, expiresAt <= Date() {
            return .expired
        }
        return .suspended
    }
}

/// 工作人员扫码校验会员码。
///
/// 权限只决定 App 是否显示扫码入口。bizserver 在每次校验时重新授权。
/// 校验结果含会员卡号和昵称，只保存在内存中。关闭结果、退出登录或换账号时清空。
@MainActor
@Observable
final class MembershipVerifier {
    enum Outcome: Equatable {
        case verified(MembershipVerification)
        case failed(String)
    }

    /// 当前账号能否校验会员码。
    private(set) var canVerify = false
    private(set) var isVerifying = false
    /// 最近一次校验的结果。有结果时，`verify(_:)` 忽略新的值。
    private(set) var outcome: Outcome?

    @ObservationIgnored private let api: MembershipAPI
    @ObservationIgnored private let tokenStore: any MembershipTokenStore
    /// `reset()` 每次加一。旧请求返回时，如果代数已经变化，就丢弃结果。
    @ObservationIgnored private var generation = 0

    init(api: MembershipAPI, tokenStore: any MembershipTokenStore) {
        self.api = api
        self.tokenStore = tokenStore
    }

    /// 询问服务端当前账号是否有校验权限。服务端未启用会员码或未登录时，没有权限。
    func refreshPermission(serviceEnabled: Bool) async {
        let generation = generation
        guard serviceEnabled, let token = tokenStore.loadToken() else {
            canVerify = false
            return
        }
        let allowed = (try? await api.canVerifyMembershipCodes(token: token)) ?? false
        guard generation == self.generation else { return }
        canVerify = allowed
    }

    /// 校验扫描或输入的会员码。
    ///
    /// 正在校验或已有结果时忽略新的值，因为相机会连续识别同一个二维码。
    func verify(_ rawValue: String) async {
        let value = rawValue.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !value.isEmpty, !isVerifying, outcome == nil else { return }
        guard let token = tokenStore.loadToken() else {
            canVerify = false
            outcome = .failed(String(localized: .Shared.membershipScanForbidden))
            return
        }
        let generation = generation
        isVerifying = true
        let result: Outcome
        do {
            result = .verified(try await api.verifyMembershipCode(value, token: token))
        } catch {
            result = .failed(message(for: error))
        }
        guard generation == self.generation else { return }
        isVerifying = false
        outcome = result
    }

    /// 关闭结果，继续扫描下一个会员码。
    func clearOutcome() {
        outcome = nil
    }

    /// 清空权限和结果。退出登录或换账号时调用。
    func reset() {
        generation += 1
        canVerify = false
        isVerifying = false
        outcome = nil
    }

    private func message(for error: Error) -> String {
        guard let error = error as? MembershipAPIError else {
            return String(localized: .Shared.membershipScanFailed)
        }
        switch error {
        case .network:
            return String(localized: .Shared.membershipScanNetwork)
        case .notConfigured, .invalidResponse:
            return String(localized: .Shared.membershipScanFailed)
        case .server(let statusCode, let code):
            switch code {
            case "MEMBERSHIP_CODE_INVALID":
                return String(localized: .Shared.membershipScanInvalid)
            case "MEMBERSHIP_CODE_EXPIRED":
                return String(localized: .Shared.membershipScanCodeExpired)
            case "MEMBERSHIP_NOT_FOUND":
                return String(localized: .Shared.membershipScanNotFound)
            case "MEMBERSHIP_CODE_NOT_CONFIGURED":
                return String(localized: .Shared.membershipCodeNotConfigured)
            case "FRESH_SESSION_REQUIRED", "SESSION_REQUIRED":
                return String(localized: .Shared.membershipScanSignInAgain)
            default:
                break
            }
            switch statusCode {
            case 401:
                return String(localized: .Shared.membershipScanSignInAgain)
            case 403:
                // 角色已被收回。隐藏入口，关闭扫码页面后不再显示。
                canVerify = false
                return String(localized: .Shared.membershipScanForbidden)
            default:
                return String(localized: .Shared.membershipScanFailed)
            }
        }
    }
}
