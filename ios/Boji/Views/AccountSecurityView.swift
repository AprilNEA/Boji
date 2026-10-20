import SwiftUI

struct AccountSecurityView: View {
    @Environment(MembershipStore.self) private var membership
    @Environment(\.dismiss) private var dismiss
    @State private var showPassword = false
    @State private var confirmRevoke = false

    var body: some View {
        NavigationStack {
            Form {
                if let account = membership.account {
                    Section("当前账号") {
                        LabeledContent("邮箱", value: account.email)
                        Label(account.emailVerified ? "邮箱已验证" : "邮箱尚未验证", systemImage: account.emailVerified ? "checkmark.seal" : "envelope.badge")
                    }
                    Section("当前会话") {
                        if let session = membership.authSession?.session {
                            LabeledContent("登录时间", value: session.createdAt.formatted(date: .abbreviated, time: .shortened))
                            LabeledContent("到期时间", value: session.expiresAt.formatted(date: .abbreviated, time: .shortened))
                        } else {
                            Text("当前会话尚未确认，请刷新。").foregroundStyle(.secondary)
                        }
                        Button("刷新会话", systemImage: "arrow.clockwise") {
                            Task { await membership.refreshAuthSession() }
                        }.disabled(membership.isBusy)
                    }
                    Section {
                        Button("修改邮箱登录密码", systemImage: "key") { showPassword = true }
                            .accessibilityIdentifier("account-change-password")
                        Button("退出其他登录会话", systemImage: "rectangle.portrait.and.arrow.right", role: .destructive) { confirmRevoke = true }
                            .accessibilityIdentifier("account-revoke-others")
                    } header: { Text("登录安全") }
                    footer: { Text("修改密码会退出其他会话。仅适用于已设置邮箱密码的账号；Apple 登录账号可继续使用 Apple 登录。") }
                    .disabled(membership.isBusy || membership.isOffline || membership.authSession == nil)
                } else {
                    Section { Text("请先登录，再管理账号安全。") }
                }
                Section {
                    MembershipMessages()
                    if membership.isBusy { ProgressView("正在连接认证服务…") }
                    Text("认证由 Better Auth 管理。本页不会删除账号、会员卡或本地记录。")
                        .font(.footnote).foregroundStyle(.secondary)
                }
            }
            .navigationTitle("账号与安全").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("完成") { dismiss() } } }
            .task {
                membership.errorMessage = nil
                membership.notice = nil
                if membership.account != nil { await membership.refreshAuthSession() }
            }
            .sheet(isPresented: $showPassword) { ChangePasswordView() }
            .confirmationDialog("退出其他登录会话？", isPresented: $confirmRevoke, titleVisibility: .visible) {
                Button("退出其他会话", role: .destructive) { Task { _ = await membership.revokeOtherSessions() } }
                Button("取消", role: .cancel) {}
            } message: { Text("其他登录会话将失效，需要重新登录。当前会话与本地记录保留。") }
        }
    }
}

private struct ChangePasswordView: View {
    @Environment(MembershipStore.self) private var membership
    @Environment(\.dismiss) private var dismiss
    @State private var currentPassword = ""
    @State private var newPassword = ""
    @State private var confirmation = ""
    @State private var confirmChange = false
    private var canSubmit: Bool {
        !currentPassword.isEmpty && (8...128).contains(newPassword.count)
            && newPassword == confirmation && currentPassword != newPassword && !membership.isBusy
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("邮箱登录密码") {
                    SecureField("当前密码", text: $currentPassword).textContentType(.password)
                        .accessibilityIdentifier("account-current-password")
                    SecureField("新密码（8 至 128 个字符）", text: $newPassword).textContentType(.newPassword)
                        .accessibilityIdentifier("account-new-password")
                    SecureField("再次输入新密码", text: $confirmation).textContentType(.newPassword)
                        .accessibilityIdentifier("account-confirm-password")
                }.textInputAutocapitalization(.never).autocorrectionDisabled()
                Section {
                    MembershipMessages()
                    Button(membership.isBusy ? "正在更新…" : "更新密码") { confirmChange = true }
                        .disabled(!canSubmit).accessibilityIdentifier("account-save-password")
                } footer: { Text("更新后，其他会话会退出。请妥善保存新密码。") }
            }
            .navigationTitle("修改密码").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("取消") { dismiss() }.disabled(membership.isBusy) } }
            .interactiveDismissDisabled(membership.isBusy)
            .onAppear { membership.errorMessage = nil; membership.notice = nil }
            .onDisappear { currentPassword = ""; newPassword = ""; confirmation = "" }
            .confirmationDialog("更新密码并退出其他会话？", isPresented: $confirmChange, titleVisibility: .visible) {
                Button("确认更新") {
                    Task {
                        if await membership.changePassword(currentPassword: currentPassword, newPassword: newPassword) {
                            currentPassword = ""; newPassword = ""; confirmation = ""
                            dismiss()
                        }
                    }
                }
                Button("取消", role: .cancel) {}
            } message: { Text("其他设备需要重新登录。如当前会话无法恢复，你也需要使用新密码登录。") }
        }
    }
}
