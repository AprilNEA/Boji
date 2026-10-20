import SwiftUI

struct MembershipAuthenticationView: View {
    @Environment(MembershipStore.self) private var membership
    @Environment(\.dismiss) private var dismiss
    @State private var registering = false
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var acceptedDataUse = false
    @State private var showRules = false

    private var cleanEmail: String { email.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var validEmail: Bool { cleanEmail.contains("@") && cleanEmail.count <= 254 && !cleanEmail.contains(" ") }
    private var validForm: Bool {
        validEmail && !password.isEmpty && (!registering || (password.count >= 8 && password.count <= 128 && !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && name.count <= 24 && acceptedDataUse))
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Picker("账号操作", selection: $registering) {
                        Text("登录").tag(false)
                        Text("注册").tag(true)
                    }.pickerStyle(.segmented)
                    Text("登录仅用于恢复你的俱乐部身份。训练和身体记录不会上传。")
                        .font(.footnote).foregroundStyle(.secondary)
                }
                AppleSignInSection { password = ""; dismiss() }
                Section(registering ? "创建俱乐部账号" : "欢迎回来") {
                    if registering {
                        TextField("昵称", text: $name).textContentType(.nickname)
                            .accessibilityIdentifier("auth-name")
                    }
                    TextField("邮箱", text: $email).textContentType(.emailAddress).keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never).autocorrectionDisabled()
                        .accessibilityIdentifier("auth-email")
                    SecureField(registering ? "密码（8 至 128 个字符）" : "密码", text: $password)
                        .textContentType(registering ? .newPassword : .password)
                        .textInputAutocapitalization(.never).autocorrectionDisabled()
                        .accessibilityIdentifier("auth-password")
                }
                if registering {
                    Section {
                        Toggle("我同意将邮箱和昵称用于创建账号", isOn: $acceptedDataUse)
                            .accessibilityIdentifier("auth-consent")
                        Text("注册后需要先验证邮箱，再返回 App 登录。")
                            .font(.footnote).foregroundStyle(.secondary)
                        #if DEBUG
                        Text("本地开发服务会把邮件保存到后端目录，不会发送到真实邮箱。")
                            .font(.caption).foregroundStyle(.secondary)
                        #endif
                    }
                }
                Section {
                    MembershipMessages()
                    Button {
                        Task {
                            if registering {
                                await membership.register(name: name.trimmingCharacters(in: .whitespacesAndNewlines), email: cleanEmail, password: password)
                            } else {
                                await membership.signIn(email: cleanEmail, password: password)
                                if membership.account != nil { password = ""; dismiss() }
                            }
                        }
                    } label: {
                        HStack {
                            Text(membership.isBusy ? "请稍候…" : registering ? "注册并验证邮箱" : "登录")
                            Spacer()
                            if membership.isBusy { ProgressView() } else { Image(systemName: "arrow.right") }
                        }
                    }.disabled(!validForm || membership.isBusy || !membership.isConfigured)
                        .accessibilityIdentifier("auth-submit")
                    if registering, membership.notice != nil {
                        Button("已验证邮箱，返回登录") { registering = false; password = "" }
                    }
                }
                Section("邮箱与密码帮助") {
                    Button("重新发送验证邮件") { Task { await membership.sendVerification(email: cleanEmail) } }
                        .disabled(!validEmail || membership.isBusy)
                    Button("发送密码重置邮件") { Task { await membership.requestPasswordReset(email: cleanEmail) } }
                        .disabled(!validEmail || membership.isBusy)
                    Text("先填写邮箱，再选择需要的邮件。验证或重置完成后，返回这里登录。")
                        .font(.footnote).foregroundStyle(.secondary)
                }
                Section {
                    Button("查看账号与会员数据说明") { showRules = true }
                    Text("邮箱和认证信息将提交至俱乐部服务。登录令牌保存在本机 Keychain，不会写入数据导出。")
                        .font(.footnote).foregroundStyle(.secondary)
                    #if DEBUG
                    Text("开发服务：\(membership.serviceURL)").font(.caption2).foregroundStyle(.secondary)
                    #endif
                }
            }
            .navigationTitle(registering ? "加入俱乐部" : "登录俱乐部").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("取消") { password = ""; dismiss() }.disabled(membership.isBusy) } }
            .sheet(isPresented: $showRules) { ClubRulesView() }
            .interactiveDismissDisabled(membership.isBusy)
            .onAppear { membership.errorMessage = nil; membership.notice = nil }
            .task { await membership.loadCapabilities() }
            .onChange(of: registering) { _, _ in membership.errorMessage = nil; membership.notice = nil }
        }
    }
}
