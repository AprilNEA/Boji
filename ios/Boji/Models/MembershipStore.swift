import Foundation
import Observation

@MainActor
@Observable
final class MembershipStore {
    private enum Action: Equatable {
        case refresh
        case signIn
        case register
        case verification
        case passwordReset
        case enroll
        case appleSignIn
        case wallet
        case security
        case changePassword
        case revokeOtherSessions
    }

    private let configuration: MembershipServiceConfiguration?
    @ObservationIgnored private let api: MembershipAPI
    @ObservationIgnored private let tokenStore: any MembershipTokenStore
    @ObservationIgnored private let cacheStore: any MembershipCacheStore
    @ObservationIgnored private var activeOperation: UUID?
    @ObservationIgnored private var hasRestored = false

    private(set) var account: MembershipAccount?
    private(set) var card: ClubMember?
    private(set) var isBusy = false
    private(set) var isOffline = false
    private(set) var lastSyncedAt: Date?
    var errorMessage: String?
    var notice: String?
    private(set) var capabilities: MembershipCapabilities?
    private(set) var isLoadingCapabilities = false
    private(set) var capabilitiesError: String?
    private(set) var requiresEmailVerification = false
    private(set) var authSession: BetterAuthSession?
    let isConfigured: Bool
    let serviceURL: String
    let isTestEnvironment: Bool

    private init(
        configuration: MembershipServiceConfiguration?,
        transport: any MembershipTransport,
        tokenStore: any MembershipTokenStore,
        cacheStore: any MembershipCacheStore,
        isTestEnvironment: Bool
    ) {
        self.configuration = configuration
        self.api = MembershipAPI(configuration: configuration, transport: transport)
        self.tokenStore = tokenStore
        self.cacheStore = cacheStore
        self.isConfigured = configuration != nil
        self.serviceURL = configuration?.baseURL.absoluteString ?? ""
        self.isTestEnvironment = isTestEnvironment
    }

    static func live() -> MembershipStore {
        let configuration = MembershipServiceConfiguration.live()
        return MembershipStore(
            configuration: configuration,
            transport: URLSessionMembershipTransport(),
            tokenStore: KeychainMembershipTokenStore(service: "\(Bundle.main.bundleIdentifier ?? "club.leanmuscle.boji").membership.\(configuration?.origin ?? "unconfigured")"),
            cacheStore: FileMembershipCacheStore(),
            isTestEnvironment: false
        )
    }

    #if DEBUG
    /// UI 测试专用 Store。它不使用真实 Keychain、文件或网络。
    static func uiTesting() -> MembershipStore {
        let scenario = ProcessInfo.processInfo.arguments.first { $0.hasPrefix("--membership-fixture=") }?
            .replacingOccurrences(of: "--membership-fixture=", with: "") ?? "standard"
        let configuration = MembershipServiceConfiguration(
            validating: "http://localhost:3000",
            allowLoopbackHTTP: true
        )
        return MembershipStore(
            configuration: configuration,
            transport: UITestingMembershipTransport(scenario: scenario),
            tokenStore: InMemoryMembershipTokenStore(),
            cacheStore: InMemoryMembershipCacheStore(),
            isTestEnvironment: true
        )
    }

    /// 单元测试专用依赖注入入口。它不会出现在 Release 构建中。
    static func testing(
        serviceURL: URL?,
        transport: any MembershipTransport,
        tokenStore: any MembershipTokenStore = InMemoryMembershipTokenStore(),
        cacheStore: any MembershipCacheStore = InMemoryMembershipCacheStore()
    ) -> MembershipStore {
        let configuration = serviceURL.flatMap {
            MembershipServiceConfiguration(validating: $0.absoluteString, allowLoopbackHTTP: true)
        }
        return MembershipStore(
            configuration: configuration,
            transport: transport,
            tokenStore: tokenStore,
            cacheStore: cacheStore,
            isTestEnvironment: true
        )
    }
    #endif

    /// 恢复已保存会话。没有令牌时绝不显示缓存账户。
    func restore() async {
        let token = tokenStore.loadToken()
        guard !hasRestored || token != nil else { return }
        hasRestored = true

        guard let operation = beginOperation() else { return }
        defer { finishOperation(operation) }

        guard isConfigured else {
            errorMessage = String(localized: "会员服务尚未配置。")
            return
        }
        guard let token else {
            removeCachedIdentity()
            return
        }

        loadCachedIdentity()
        _ = await synchronize(token: token, operation: operation, action: .refresh)
    }

    /// 立即从服务器重新读取账户和会员卡。
    func refresh() async {
        guard isConfigured else {
            errorMessage = String(localized: "会员服务尚未配置。")
            return
        }
        guard let token = tokenStore.loadToken() else {
            removeCachedIdentity()
            errorMessage = String(localized: "请先登录后再刷新会员信息。")
            return
        }
        guard let operation = beginOperation() else { return }
        defer { finishOperation(operation) }
        _ = await synchronize(token: token, operation: operation, action: .refresh)
    }

    func signIn(email: String, password: String) async {
        let email = normalized(email)
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = String(localized: "请输入邮箱和密码。")
            return
        }
        guard isConfigured else {
            errorMessage = String(localized: "会员服务尚未配置。")
            return
        }
        guard let operation = beginOperation() else { return }
        defer { finishOperation(operation) }

        do {
            let token = try await api.signIn(email: email, password: password)
            await completeAuthentication(token: token, operation: operation, action: .signIn)
        } catch {
            if case MembershipAPIError.server(let status, _) = error, status == 401 {
                if isCurrent(operation) { errorMessage = String(localized: "邮箱或密码不正确，请检查后重试。") }
                return
            }
            handle(error, action: .signIn, operation: operation)
        }
    }

    func loadCapabilities() async {
        guard isConfigured, !isLoadingCapabilities else { return }
        isLoadingCapabilities = true
        capabilitiesError = nil
        defer { isLoadingCapabilities = false }
        do { capabilities = try await api.capabilities() }
        catch { capabilities = nil; capabilitiesError = String(localized: "暂时无法确认 Apple 服务能力。") }
    }

    func signInWithApple(_ identity: AppleIdentity) async {
        guard capabilities?.appleSignIn == true, isConfigured else {
            errorMessage = String(localized: "Apple 登录尚未配置或暂不可用。")
            return
        }
        guard !identity.token.isEmpty, !identity.nonce.isEmpty else {
            errorMessage = String(localized: "Apple 登录凭据不完整，请重试。")
            return
        }
        guard let operation = beginOperation() else { return }
        defer { finishOperation(operation) }
        do {
            let token = try await api.signInWithApple(identity)
            await completeAuthentication(token: token, operation: operation, action: .appleSignIn)
        } catch {
            if isCurrent(operation), let message = appleSignInMessage(for: error) {
                errorMessage = message
                return
            }
            handle(error, action: .appleSignIn, operation: operation)
        }
    }

    /// Better Auth 拒绝 Apple 身份令牌时的提示。此时还没有本机会话，所以 401 不清除登录状态。
    private func appleSignInMessage(for error: Error) -> String? {
        guard case MembershipAPIError.server(let statusCode, let code) = error else { return nil }
        switch code {
        case "LINKING_NOT_ALLOWED", "LINKING_DIFFERENT_EMAILS_NOT_ALLOWED":
            return String(localized: "这个邮箱已有俱乐部账号。请用邮箱和密码登录。")
        case "USER_EMAIL_NOT_FOUND":
            return String(localized: "Apple 没有提供邮箱，无法创建账号。请在 iPhone 设置中停止此 App 使用 Apple 登录，然后重试。")
        default:
            return statusCode == 401 ? String(localized: "Apple 登录校验失败，请重新尝试。") : nil
        }
    }

    func walletPassData() async -> Data? {
        guard capabilities?.walletPass == true else {
            errorMessage = String(localized: "Wallet 签发服务尚未配置。")
            return nil
        }
        guard let token = tokenStore.loadToken(), let card, card.isActive, !isOffline else {
            errorMessage = String(localized: "请先刷新有效会员卡，再添加到钱包。")
            return nil
        }
        guard let operation = beginOperation() else { return nil }
        defer { finishOperation(operation) }
        do {
            let data = try await api.walletPass(membershipID: card.id, token: token)
            guard isCurrent(operation), self.card?.id == card.id, self.card?.isActive == true else { return nil }
            return data
        } catch { handle(error, action: .wallet, operation: operation); return nil }
    }

    private func completeAuthentication(token: String, operation: UUID, action: Action) async {
        guard isCurrent(operation) else { return }
        do { try tokenStore.saveToken(token) }
        catch { errorMessage = String(localized: "无法安全保存登录状态，请稍后重试。"); return }
        do { try cacheStore.delete() }
        catch {
            try? tokenStore.deleteToken()
            clearPublishedIdentity()
            errorMessage = String(localized: "无法安全切换登录账户，请稍后重试。")
            return
        }
        clearPublishedIdentity()
        if await synchronize(token: token, operation: operation, action: action), isCurrent(operation) {
            notice = String(localized: "登录成功。")
        }
    }

    /// 注册成功后只提示验证邮箱。此方法绝不创建本地登录会话。
    func register(name: String, email: String, password: String) async {
        let name = normalized(name)
        let email = normalized(email)
        guard !name.isEmpty, !email.isEmpty, !password.isEmpty else {
            errorMessage = String(localized: "请完整填写姓名、邮箱和密码。")
            return
        }
        guard isConfigured else {
            errorMessage = String(localized: "会员服务尚未配置。")
            return
        }
        guard let operation = beginOperation() else { return }
        defer { finishOperation(operation) }

        do {
            try await api.register(name: name, email: email, password: password)
            guard isCurrent(operation) else { return }
            requiresEmailVerification = true
            isOffline = false
            notice = String(localized: "注册成功，请在邮箱完成验证后登录。")
        } catch {
            handle(error, action: .register, operation: operation)
        }
    }

    func sendVerification(email: String) async {
        let email = normalized(email)
        guard !email.isEmpty else {
            errorMessage = String(localized: "请输入需要验证的邮箱。")
            return
        }
        guard isConfigured else {
            errorMessage = String(localized: "会员服务尚未配置。")
            return
        }
        guard let operation = beginOperation() else { return }
        defer { finishOperation(operation) }

        do {
            try await api.sendVerification(email: email)
            guard isCurrent(operation) else { return }
            requiresEmailVerification = true
            isOffline = false
            notice = String(localized: "已提交验证邮件请求，请检查收件箱。")
        } catch {
            handle(error, action: .verification, operation: operation)
        }
    }

    func requestPasswordReset(email: String) async {
        let email = normalized(email)
        guard !email.isEmpty else {
            errorMessage = String(localized: "请输入需要重置密码的邮箱。")
            return
        }
        guard isConfigured else {
            errorMessage = String(localized: "会员服务尚未配置。")
            return
        }
        guard let operation = beginOperation() else { return }
        defer { finishOperation(operation) }

        do {
            try await api.requestPasswordReset(email: email)
            guard isCurrent(operation) else { return }
            isOffline = false
            notice = String(localized: "已提交重置请求。若邮箱可用，请检查收件箱。")
        } catch {
            handle(error, action: .passwordReset, operation: operation)
        }
    }

    func refreshAuthSession() async {
        guard let token = tokenStore.loadToken(), isConfigured else {
            authSession = nil
            errorMessage = String(localized: "请先登录后再查看账号安全。")
            return
        }
        guard let operation = beginOperation() else { return }
        defer { finishOperation(operation) }
        authSession = nil
        do {
            guard let session = try await api.getSession(token: token) else {
                handle(MembershipAPIError.server(statusCode: 401, code: "UNAUTHORIZED"), action: .security, operation: operation)
                return
            }
            guard isCurrent(operation) else { return }
            guard account?.id == nil || account?.id == session.user.id else {
                _ = clearLocalSessionStorage()
                clearPublishedIdentity()
                errorMessage = String(localized: "账号状态不一致，请重新登录。")
                return
            }
            authSession = session
            account = session.user
            requiresEmailVerification = !session.user.emailVerified
        } catch { handle(error, action: .security, operation: operation) }
    }

    func changePassword(currentPassword: String, newPassword: String) async -> Bool {
        guard !currentPassword.isEmpty, (8...128).contains(newPassword.count) else {
            errorMessage = String(localized: "请输入当前密码，新密码需为 8 至 128 个字符。")
            return false
        }
        guard currentPassword != newPassword else {
            errorMessage = String(localized: "新密码不能与当前密码相同。")
            return false
        }
        guard isConfigured, let token = tokenStore.loadToken(), let account else {
            errorMessage = String(localized: "请先登录后再修改密码。")
            return false
        }
        guard let operation = beginOperation() else { return false }
        defer { finishOperation(operation) }
        do {
            let newToken = try await api.changePassword(currentPassword: currentPassword, newPassword: newPassword, token: token)
            guard isCurrent(operation) else { return false }
            authSession = nil
            guard let newToken else {
                _ = clearLocalSessionStorage()
                clearPublishedIdentity()
                notice = String(localized: "密码已修改，请使用新密码重新登录。")
                return true
            }
            do { try tokenStore.saveToken(newToken) }
            catch {
                _ = clearLocalSessionStorage()
                clearPublishedIdentity()
                errorMessage = String(localized: "密码已修改，但登录状态无法安全保存。请重新登录。")
                return true
            }
            do {
                let session = try await api.getSession(token: newToken)
                guard isCurrent(operation) else { return true }
                guard let session, session.user.id == account.id else {
                    _ = clearLocalSessionStorage()
                    clearPublishedIdentity()
                    notice = String(localized: "密码已修改，请重新登录以确认会话。")
                    return true
                }
                authSession = session
                self.account = session.user
                notice = String(localized: "密码已修改，其他会话已退出。")
            } catch {
                handle(error, action: .security, operation: operation)
                if isCurrent(operation) { notice = String(localized: "密码已修改。请刷新确认当前登录状态。") }
            }
            return true
        } catch {
            handle(error, action: .changePassword, operation: operation)
            return false
        }
    }

    func revokeOtherSessions() async -> Bool {
        guard isConfigured, let token = tokenStore.loadToken(), account != nil else {
            errorMessage = String(localized: "请先登录后再管理会话。")
            return false
        }
        guard let operation = beginOperation() else { return false }
        defer { finishOperation(operation) }
        do {
            try await api.revokeOtherSessions(token: token)
            guard isCurrent(operation) else { return false }
            notice = String(localized: "其他登录会话已退出，当前会话保留。")
            return true
        } catch {
            handle(error, action: .revokeOtherSessions, operation: operation)
            return false
        }
    }

    func enroll(displayName: String, acceptedTerms: Bool) async {
        let displayName = normalized(displayName)
        guard acceptedTerms else {
            errorMessage = String(localized: "请先同意社区会员条款。")
            return
        }
        var draft = MembershipEnrollmentDraft()
        draft.name = displayName
        if let error = draft.nameError {
            errorMessage = error
            return
        }
        guard isConfigured else {
            errorMessage = String(localized: "会员服务尚未配置。")
            return
        }
        guard let token = tokenStore.loadToken(), let account else {
            errorMessage = String(localized: "请先登录后再领取会员卡。")
            return
        }
        guard account.emailVerified else {
            requiresEmailVerification = true
            errorMessage = String(localized: "邮箱尚未验证，请先完成验证。")
            return
        }
        guard let operation = beginOperation() else { return }
        defer { finishOperation(operation) }

        do {
            let enrolledCard = try await api.enroll(displayName: displayName, token: token)
            guard isCurrent(operation) else { return }
            guard enrolledCard.userId == account.id else {
                card = nil
                lastSyncedAt = nil
                try? cacheStore.delete()
                errorMessage = String(localized: "会员数据校验失败，请重新登录后重试。")
                return
            }

            card = enrolledCard
            lastSyncedAt = Date()
            isOffline = false
            saveCacheIfPossible()
            notice = String(localized: "会员卡已更新。")
        } catch {
            handle(error, action: .enroll, operation: operation)
        }
    }

    /// 尽力通知服务器退出，然后始终清除本机令牌和会员缓存。
    func signOut() async {
        let operation = UUID()
        activeOperation = operation
        isBusy = true
        errorMessage = nil
        notice = nil
        let token = tokenStore.loadToken()
        var serverConfirmed = false

        if isConfigured, let token {
            do {
                try await api.signOut(token: token)
                serverConfirmed = true
            } catch {
                serverConfirmed = false
            }
        }

        guard activeOperation == operation else { return }
        let cleared = clearLocalSessionStorage()
        clearPublishedIdentity()
        hasRestored = true
        isBusy = false
        activeOperation = nil

        if !cleared {
            errorMessage = String(localized: "无法完全清除本机登录状态。")
        }
        if serverConfirmed {
            notice = String(localized: "已退出登录。")
        } else if isConfigured, token != nil {
            notice = String(localized: "已清除本机登录状态；服务器退出未确认。")
        } else {
            notice = String(localized: "已清除本机登录状态。")
        }
    }

    /// 只清除本机令牌和会员缓存。此方法绝不删除服务器会员或本地身体数据。
    func clearLocalSession() {
        activeOperation = nil
        isBusy = false
        let cleared = clearLocalSessionStorage()
        clearPublishedIdentity()
        hasRestored = true
        notice = nil
        errorMessage = cleared ? nil : String(localized: "无法完全清除本机登录状态。")
    }

    private func synchronize(token: String, operation: UUID, action: Action) async -> Bool {
        do {
            let serverAccount = try await api.me(token: token)
            guard isCurrent(operation) else { return false }

            if account?.id != serverAccount.id {
                card = nil
                lastSyncedAt = nil
                try? cacheStore.delete()
            }
            account = serverAccount
            requiresEmailVerification = !serverAccount.emailVerified

            guard serverAccount.emailVerified else {
                card = nil
                lastSyncedAt = nil
                try? cacheStore.delete()
                errorMessage = String(localized: "邮箱尚未验证，请先完成验证。")
                return false
            }

            let serverCard = try await api.membership(token: token)
            guard isCurrent(operation) else { return false }
            guard serverCard?.userId == nil || serverCard?.userId == serverAccount.id else {
                card = nil
                lastSyncedAt = nil
                try? cacheStore.delete()
                errorMessage = String(localized: "会员数据校验失败，请重新登录后重试。")
                return false
            }

            card = serverCard
            lastSyncedAt = Date()
            requiresEmailVerification = false
            isOffline = false
            saveCacheIfPossible()
            return true
        } catch {
            handle(error, action: action, operation: operation)
            return false
        }
    }

    private func loadCachedIdentity() {
        guard let configuration else { return }
        do {
            guard let cached = try cacheStore.load() else { return }
            guard cached.serviceOrigin == configuration.origin,
                  cached.account.emailVerified,
                  cached.card?.userId == nil || cached.card?.userId == cached.account.id
            else {
                try? cacheStore.delete()
                return
            }
            account = cached.account
            card = cached.card
            lastSyncedAt = cached.lastSyncedAt
            requiresEmailVerification = false
            isOffline = true
        } catch {
            try? cacheStore.delete()
        }
    }

    private func saveCacheIfPossible() {
        guard let configuration,
              let account,
              account.emailVerified,
              card?.userId == nil || card?.userId == account.id,
              let lastSyncedAt
        else {
            return
        }
        do {
            try cacheStore.save(
                MembershipCacheRecord(
                    serviceOrigin: configuration.origin,
                    account: account,
                    card: card,
                    lastSyncedAt: lastSyncedAt
                )
            )
        } catch {
            if errorMessage == nil {
                errorMessage = String(localized: "无法保存会员缓存。")
            }
        }
    }

    private func handle(_ error: Error, action: Action, operation: UUID) {
        guard isCurrent(operation) else { return }
        guard let apiError = error as? MembershipAPIError else {
            errorMessage = failureMessage(for: action)
            return
        }

        if case .server(let statusCode, let code) = apiError {
            if statusCode == 429 {
                errorMessage = String(localized: "操作过于频繁，请稍后再试。")
                return
            }
            if action == .changePassword, code == "INVALID_PASSWORD" || code == "INVALID_CURRENT_PASSWORD" {
                errorMessage = String(localized: "当前密码不正确，请重新输入。")
                return
            }
            if action == .changePassword, code == "PASSWORD_NOT_FOUND" || code == "CREDENTIAL_ACCOUNT_NOT_FOUND" {
                errorMessage = String(localized: "此账号尚未设置邮箱密码，请使用原登录方式。")
                return
            }
            if code == "SESSION_NOT_FRESH" {
                errorMessage = String(localized: "此操作需要重新登录后再试。")
                return
            }
            if code == "WALLET_NOT_CONFIGURED" {
                capabilities = MembershipCapabilities(appleSignIn: capabilities?.appleSignIn ?? false, walletPass: false)
                errorMessage = String(localized: "Wallet 签发服务尚未配置。")
                return
            }
        }

        if case .server(let statusCode, _) = apiError, statusCode == 401 {
            _ = clearLocalSessionStorage()
            clearPublishedIdentity()
            hasRestored = true
            errorMessage = String(localized: "登录已失效，请重新登录。")
            return
        }

        if case .server(let statusCode, let code) = apiError,
           statusCode == 403,
           code == "EMAIL_NOT_VERIFIED" {
            requiresEmailVerification = true
            card = nil
            lastSyncedAt = nil
            try? cacheStore.delete()
            errorMessage = String(localized: "邮箱尚未验证，请先完成验证。")
            return
        }

        if case .network = apiError {
            isOffline = true
            if action == .refresh, card != nil {
                errorMessage = String(localized: "网络不可用，正在显示本地会员卡。")
            } else {
                errorMessage = networkMessage(for: action)
            }
            return
        }

        if case .notConfigured = apiError {
            errorMessage = String(localized: "会员服务尚未配置。")
            return
        }

        if case .server(let statusCode, _) = apiError, statusCode == 403 {
            card = nil
            lastSyncedAt = nil
            try? cacheStore.delete()
            errorMessage = String(localized: "当前账户没有执行此操作的权限。")
            return
        }

        if action == .refresh { isOffline = true }
        errorMessage = failureMessage(for: action)
    }

    private func beginOperation() -> UUID? {
        guard !isBusy else { return nil }
        let operation = UUID()
        activeOperation = operation
        isBusy = true
        errorMessage = nil
        notice = nil
        return operation
    }

    private func finishOperation(_ operation: UUID) {
        guard activeOperation == operation else { return }
        activeOperation = nil
        isBusy = false
    }

    private func isCurrent(_ operation: UUID) -> Bool {
        activeOperation == operation
    }

    private func removeCachedIdentity() {
        try? cacheStore.delete()
        clearPublishedIdentity()
    }

    private func clearPublishedIdentity() {
        account = nil
        card = nil
        authSession = nil
        lastSyncedAt = nil
        requiresEmailVerification = false
        isOffline = false
    }

    /// 令牌一定先删除，再删除含个人资料的缓存。
    private func clearLocalSessionStorage() -> Bool {
        var succeeded = true
        do {
            try tokenStore.deleteToken()
        } catch {
            succeeded = false
        }
        do {
            try cacheStore.delete()
        } catch {
            succeeded = false
        }
        return succeeded
    }

    private func normalized(_ value: String) -> String {
        value.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func networkMessage(for action: Action) -> String {
        switch action {
        case .refresh:
            return String(localized: "无法连接会员服务，请稍后重试。")
        case .signIn:
            return String(localized: "无法连接会员服务，暂时无法登录。")
        case .register:
            return String(localized: "无法连接会员服务，暂时无法注册。")
        case .verification:
            return String(localized: "无法连接会员服务，暂时无法发送验证邮件。")
        case .passwordReset:
            return String(localized: "无法连接会员服务，暂时无法发送重置邮件。")
        case .enroll:
            return String(localized: "无法连接会员服务，暂时无法领取会员卡。")
        case .appleSignIn:
            return String(localized: "无法连接会员服务，Apple 登录未完成。")
        case .wallet:
            return String(localized: "无法连接会员服务，暂时无法取得钱包凭证。")
        case .security:
            return String(localized: "无法连接认证服务，暂时无法确认会话。")
        case .changePassword:
            return String(localized: "密码修改结果未确认。请检查网络，必要时使用密码找回。")
        case .revokeOtherSessions:
            return String(localized: "其他会话的退出结果未确认，请稍后重试。")
        }
    }

    private func failureMessage(for action: Action) -> String {
        switch action {
        case .refresh:
            return String(localized: "无法更新会员信息，请稍后重试。")
        case .signIn:
            return String(localized: "登录失败，请检查邮箱和密码。")
        case .register:
            return String(localized: "注册失败，请检查信息后重试。")
        case .verification:
            return String(localized: "验证邮件发送失败，请稍后重试。")
        case .passwordReset:
            return String(localized: "密码重置邮件发送失败，请稍后重试。")
        case .enroll:
            return String(localized: "领卡失败，请稍后重试。")
        case .appleSignIn:
            return String(localized: "Apple 登录失败。若已有邮箱账号，请先使用原方式登录。")
        case .wallet:
            return String(localized: "钱包凭证获取失败，签发服务可能尚未配置。")
        case .security:
            return String(localized: "无法确认当前登录会话，请刷新后重试。")
        case .changePassword:
            return String(localized: "密码修改未确认，请检查当前密码或使用密码找回。")
        case .revokeOtherSessions:
            return String(localized: "暂时无法退出其他登录会话。")
        }
    }
}
