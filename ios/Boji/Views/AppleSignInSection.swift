import SwiftUI
import AuthenticationServices

struct AppleSignInSection: View {
    @Environment(MembershipStore.self) private var membership
    @Environment(\.colorScheme) private var colorScheme
    var onSignedIn: () -> Void
    @State private var nonce: AppleSignInNonce?
    @State private var state = UUID().uuidString
    @State private var authorizing = false

    private var configured: Bool {
        AppleIntegrationSettings.appleSignInEnabled && membership.capabilities?.appleSignIn == true && !membership.isTestEnvironment
    }
    var body: some View {
        Section("Apple 账号") {
            if configured {
                SignInWithAppleButton(.continue) { request in
                    guard let nonce else { return }
                    authorizing = true
                    request.requestedScopes = [.fullName, .email]
                    request.nonce = nonce.sha256
                    request.state = state
                } onCompletion: { result in
                    let usedNonce = nonce
                    let expectedState = state
                    authorizing = false
                    prepareNonce()
                    switch result {
                    case .success(let authorization):
                        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                              credential.state == expectedState,
                              let tokenData = credential.identityToken,
                              let token = String(data: tokenData, encoding: .utf8), let usedNonce else {
                            membership.errorMessage = String(localized: "Apple 登录校验失败，请重新尝试。")
                            return
                        }
                        let identity = AppleIdentity(token: token, nonce: usedNonce.rawValue, firstName: credential.fullName?.givenName, lastName: credential.fullName?.familyName)
                        Task {
                            await membership.signInWithApple(identity)
                            if membership.account != nil { onSignedIn() }
                        }
                    case .failure(let error):
                        if (error as? ASAuthorizationError)?.code != .canceled {
                            membership.errorMessage = String(localized: "Apple 登录未完成，请稍后重试。")
                        }
                    }
                }
                .signInWithAppleButtonStyle(colorScheme == .dark ? .white : .black)
                .frame(height: 50).clipShape(.rect(cornerRadius: 12))
                .disabled(nonce == nil || authorizing || membership.isBusy)
                .accessibilityIdentifier("apple-sign-in")
                Text("Apple 将提供你选择分享的账号信息，用于创建或恢复俱乐部身份。已有邮箱账号不会自动合并。")
                    .font(.footnote).foregroundStyle(.secondary)
            } else {
                Label(membership.isLoadingCapabilities ? "正在确认 Apple 登录能力…" : "Apple 登录尚未开放", systemImage: "apple.logo")
                    .foregroundStyle(.secondary)
                Text(membership.capabilitiesError ?? String(localized: "需要完成 App 签名能力和服务端 Apple 配置。你仍可使用邮箱登录。"))
                    .font(.caption).foregroundStyle(.secondary)
                Button("重新检查") { Task { await membership.loadCapabilities() } }
                    .disabled(membership.isLoadingCapabilities)
            }
        }
        .onAppear { prepareNonce() }
        .onDisappear { nonce = nil; state = UUID().uuidString }
    }

    private func prepareNonce() {
        state = UUID().uuidString
        do { nonce = try AppleSignInNonce() }
        catch { nonce = nil; membership.errorMessage = String(localized: "无法创建安全登录请求，请稍后重试。") }
    }
}
