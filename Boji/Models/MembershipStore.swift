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
        let configuration = MembershipServiceConfiguration(
            validating: "http://localhost:3000",
            allowLoopbackHTTP: true
        )
        return MembershipStore(
            configuration: configuration,
            transport: UITestingMembershipTransport(),
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
            errorMessage = "会员服务尚未配置。"
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
            errorMessage = "会员服务尚未配置。"
            return
        }
        guard let token = tokenStore.loadToken() else {
            removeCachedIdentity()
            errorMessage = "请先登录后再刷新会员信息。"
            return
        }
        guard let operation = beginOperation() else { return }
        defer { finishOperation(operation) }
        _ = await synchronize(token: token, operation: operation, action: .refresh)
    }

    func signIn(email: String, password: String) async {
        let email = normalized(email)
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "请输入邮箱和密码。"
            return
        }
        guard isConfigured else {
            errorMessage = "会员服务尚未配置。"
            return
        }
        guard let operation = beginOperation() else { return }
        defer { finishOperation(operation) }

        do {
            let token = try await api.signIn(email: email, password: password)
            await completeAuthentication(token: token, operation: operation, action: .signIn)
        } catch {
            handle(error, action: .signIn, operation: operation)
        }
    }

    func loadCapabilities() async {
        guard isConfigured, !isLoadingCapabilities else { return }
        isLoadingCapabilities = true
        capabilitiesError = nil
        defer { isLoadingCapabilities = false }
        do { capabilities = try await api.capabilities() }
        catch { capabilities = nil; capabilitiesError = "暂时无法确认 Apple 服务能力。" }
    }

    func signInWithApple(_ identity: AppleIdentity) async {
        guard capabilities?.appleSignIn == true, isConfigured else {
            errorMessage = "Apple 登录尚未配置或暂不可用。"
            return
        }
        guard !identity.token.isEmpty, !identity.nonce.isEmpty else {
            errorMessage = "Apple 登录凭据不完整，请重试。"
            return
        }
        guard let operation = beginOperation() else { return }
        defer { finishOperation(operation) }
        do {
            let token = try await api.signInWithApple(identity)
            await completeAuthentication(token: token, operation: operation, action: .appleSignIn)
        } catch { handle(error, action: .appleSignIn, operation: operation) }
    }

    func walletPassData() async -> Data? {
        guard capabilities?.walletPass == true else {
            errorMessage = "Wallet 签发服务尚未配置。"
            return nil
        }
        guard let token = tokenStore.loadToken(), let card, card.isActive, !isOffline else {
            errorMessage = "请先刷新有效会员卡，再添加到钱包。"
            return nil
        }
        guard let operation = beginOperation() else { return nil }
        defer { finishOperation(operation) }
        do {
            let data = try await api.walletPass(token: token)
            guard isCurrent(operation), self.card?.id == card.id, self.card?.isActive == true else { return nil }
            return data
        } catch { handle(error, action: .wallet, operation: operation); return nil }
    }

    private func completeAuthentication(token: String, operation: UUID, action: Action) async {
        guard isCurrent(operation) else { return }
        do { try tokenStore.saveToken(token) }
        catch { errorMessage = "无法安全保存登录状态，请稍后重试。"; return }
        do { try cacheStore.delete() }
        catch {
            try? tokenStore.deleteToken()
            clearPublishedIdentity()
            errorMessage = "无法安全切换登录账户，请稍后重试。"
            return
        }
        clearPublishedIdentity()
        if await synchronize(token: token, operation: operation, action: action), isCurrent(operation) {
            notice = "登录成功。"
        }
    }

    /// 注册成功后只提示验证邮箱。此方法绝不创建本地登录会话。
    func register(name: String, email: String, password: String) async {
        let name = normalized(name)
        let email = normalized(email)
        guard !name.isEmpty, !email.isEmpty, !password.isEmpty else {
            errorMessage = "请完整填写姓名、邮箱和密码。"
            return
        }
        guard isConfigured else {
            errorMessage = "会员服务尚未配置。"
            return
        }
        guard let operation = beginOperation() else { return }
        defer { finishOperation(operation) }

        do {
            try await api.register(name: name, email: email, password: password)
            guard isCurrent(operation) else { return }
            requiresEmailVerification = true
            isOffline = false
            notice = "注册成功，请在邮箱完成验证后登录。"
        } catch {
            handle(error, action: .register, operation: operation)
        }
    }

    func sendVerification(email: String) async {
        let email = normalized(email)
        guard !email.isEmpty else {
            errorMessage = "请输入需要验证的邮箱。"
            return
        }
        guard isConfigured else {
            errorMessage = "会员服务尚未配置。"
            return
        }
        guard let operation = beginOperation() else { return }
        defer { finishOperation(operation) }

        do {
            try await api.sendVerification(email: email)
            guard isCurrent(operation) else { return }
            requiresEmailVerification = true
            isOffline = false
            notice = "已提交验证邮件请求，请检查收件箱。"
        } catch {
            handle(error, action: .verification, operation: operation)
        }
    }

    func requestPasswordReset(email: String) async {
        let email = normalized(email)
        guard !email.isEmpty else {
            errorMessage = "请输入需要重置密码的邮箱。"
            return
        }
        guard isConfigured else {
            errorMessage = "会员服务尚未配置。"
            return
        }
        guard let operation = beginOperation() else { return }
        defer { finishOperation(operation) }

        do {
            try await api.requestPasswordReset(email: email)
            guard isCurrent(operation) else { return }
            isOffline = false
            notice = "已提交重置请求。若邮箱可用，请检查收件箱。"
        } catch {
            handle(error, action: .passwordReset, operation: operation)
        }
    }

    func enroll(displayName: String, acceptedTerms: Bool) async {
        let displayName = normalized(displayName)
        guard acceptedTerms else {
            errorMessage = "请先同意社区会员条款。"
            return
        }
        guard !displayName.isEmpty else {
            errorMessage = "请输入会员卡显示名称。"
            return
        }
        guard isConfigured else {
            errorMessage = "会员服务尚未配置。"
            return
        }
        guard let token = tokenStore.loadToken(), let account else {
            errorMessage = "请先登录后再领取会员卡。"
            return
        }
        guard account.emailVerified else {
            requiresEmailVerification = true
            errorMessage = "邮箱尚未验证，请先完成验证。"
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
                errorMessage = "会员数据校验失败，请重新登录后重试。"
                return
            }

            card = enrolledCard
            lastSyncedAt = Date()
            isOffline = false
            saveCacheIfPossible()
            notice = "会员卡已更新。"
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
            errorMessage = "无法完全清除本机登录状态。"
        }
        if serverConfirmed {
            notice = "已退出登录。"
        } else if isConfigured, token != nil {
            notice = "已清除本机登录状态；服务器退出未确认。"
        } else {
            notice = "已清除本机登录状态。"
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
        errorMessage = cleared ? nil : "无法完全清除本机登录状态。"
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
                errorMessage = "邮箱尚未验证，请先完成验证。"
                return false
            }

            let serverCard = try await api.membership(token: token)
            guard isCurrent(operation) else { return false }
            guard serverCard?.userId == nil || serverCard?.userId == serverAccount.id else {
                card = nil
                lastSyncedAt = nil
                try? cacheStore.delete()
                errorMessage = "会员数据校验失败，请重新登录后重试。"
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
                errorMessage = "无法保存会员缓存。"
            }
        }
    }

    private func handle(_ error: Error, action: Action, operation: UUID) {
        guard isCurrent(operation) else { return }
        guard let apiError = error as? MembershipAPIError else {
            errorMessage = failureMessage(for: action)
            return
        }

        if case .server(let statusCode, _) = apiError, statusCode == 401 {
            _ = clearLocalSessionStorage()
            clearPublishedIdentity()
            hasRestored = true
            errorMessage = "登录已失效，请重新登录。"
            return
        }

        if case .server(let statusCode, let code) = apiError,
           statusCode == 403,
           code == "EMAIL_NOT_VERIFIED" {
            requiresEmailVerification = true
            card = nil
            lastSyncedAt = nil
            try? cacheStore.delete()
            errorMessage = "邮箱尚未验证，请先完成验证。"
            return
        }

        if case .network = apiError {
            isOffline = true
            if action == .refresh, card != nil {
                errorMessage = "网络不可用，正在显示本地会员卡。"
            } else {
                errorMessage = networkMessage(for: action)
            }
            return
        }

        if case .notConfigured = apiError {
            errorMessage = "会员服务尚未配置。"
            return
        }

        if case .server(let statusCode, _) = apiError, statusCode == 403 {
            card = nil
            lastSyncedAt = nil
            try? cacheStore.delete()
            errorMessage = "当前账户没有执行此操作的权限。"
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
        isOffline = false
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
            return "无法连接会员服务，请稍后重试。"
        case .signIn:
            return "无法连接会员服务，暂时无法登录。"
        case .register:
            return "无法连接会员服务，暂时无法注册。"
        case .verification:
            return "无法连接会员服务，暂时无法发送验证邮件。"
        case .passwordReset:
            return "无法连接会员服务，暂时无法发送重置邮件。"
        case .enroll:
            return "无法连接会员服务，暂时无法领取会员卡。"
        case .appleSignIn:
            return "无法连接会员服务，Apple 登录未完成。"
        case .wallet:
            return "无法连接会员服务，暂时无法取得钱包凭证。"
        }
    }

    private func failureMessage(for action: Action) -> String {
        switch action {
        case .refresh:
            return "无法更新会员信息，请稍后重试。"
        case .signIn:
            return "登录失败，请检查邮箱和密码。"
        case .register:
            return "注册失败，请检查信息后重试。"
        case .verification:
            return "验证邮件发送失败，请稍后重试。"
        case .passwordReset:
            return "密码重置邮件发送失败，请稍后重试。"
        case .enroll:
            return "领卡失败，请稍后重试。"
        case .appleSignIn:
            return "Apple 登录失败。若已有邮箱账号，请先使用原方式登录。"
        case .wallet:
            return "钱包凭证获取失败，签发服务可能尚未配置。"
        }
    }
}
