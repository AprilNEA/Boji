import SwiftUI

struct AccountSecurityView: View {
    @Environment(MembershipStore.self) private var membership
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var scenePhase
    @State private var presentedSheet: AccountSheet?
    @State private var confirmRevoke = false

    private enum AccountSheet: String, Identifiable {
        case password
        case email
        case deletion
        var id: String { rawValue }
    }

    var body: some View {
        NavigationStack {
            Form {
                if let account = membership.account {
                    Section {
                        LabeledContent("邮箱", value: account.email)
                        Label(account.emailVerified ? "邮箱已验证" : "邮箱尚未验证", systemImage: account.emailVerified ? "checkmark.seal" : "envelope.badge")
                        if let pendingEmail = membership.pendingEmailChange {
                            LabeledContent("待生效的新邮箱", value: pendingEmail)
                                .accessibilityIdentifier("account-pending-email")
                        }
                        Button("更换登录邮箱", systemImage: "envelope") { presentedSheet = .email }
                            .accessibilityIdentifier("account-change-email")
                            .disabled(membership.isBusy || membership.isOffline || membership.authSession == nil || !account.emailVerified)
                    } header: { Text("当前账号") }
                    footer: {
                        if membership.pendingEmailChange != nil {
                            Text("先在当前邮箱中确认，再打开新邮箱收到的验证链接。完成后刷新会话，这里会显示新邮箱。")
                        } else if !account.emailVerified {
                            Text("验证当前邮箱后，才能更换登录邮箱。")
                        }
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
                        Button("修改邮箱登录密码", systemImage: "key") { presentedSheet = .password }
                            .accessibilityIdentifier("account-change-password")
                        Button("退出其他登录会话", systemImage: "rectangle.portrait.and.arrow.right", role: .destructive) { confirmRevoke = true }
                            .accessibilityIdentifier("account-revoke-others")
                    } header: { Text("登录安全") }
                    footer: { Text("修改密码会退出其他会话。仅适用于已设置邮箱密码的账号；Apple 登录账号可继续使用 Apple 登录。") }
                    .disabled(membership.isBusy || membership.isOffline || membership.authSession == nil)
                    Section {
                        Button("删除账号", systemImage: "person.crop.circle.badge.minus", role: .destructive) {
                            presentedSheet = .deletion
                        }
                        .accessibilityIdentifier("account-delete-start")
                        .disabled(membership.isBusy || membership.isOffline || membership.authSession == nil)
                    } footer: {
                        Text("通过账号邮箱确认后，永久删除服务器上的账号和会员资料。本机记录不受影响。")
                    }
                } else {
                    Section { Text("请先登录，再管理账号安全。") }
                }
                Section {
                    MembershipMessages()
                    if membership.isBusy { ProgressView("正在连接认证服务…") }
                    Text("退出其他会话和修改密码不会删除账号。删除账号需要单独确认。")
                        .font(.footnote).foregroundStyle(.secondary)
                }
            }
            .pageBackground()
            .navigationTitle("账号与安全").navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("关闭", systemImage: "xmark", role: .close) { dismiss() } }
            }
            .task {
                membership.errorMessage = nil
                membership.notice = nil
                if membership.account != nil { await membership.refreshAuthSession() }
            }
            .onChange(of: scenePhase) { _, phase in
                // The user opens both links in Mail, so check the session again on return.
                guard phase == .active, membership.pendingEmailChange != nil, !membership.isBusy else { return }
                Task { await membership.refreshAuthSession() }
            }
            .sheet(item: $presentedSheet) { sheet in
                switch sheet {
                case .password: ChangePasswordView()
                case .email: ChangeEmailView()
                case .deletion: AccountDeletionView()
                }
            }
            .confirmationDialog("退出其他登录会话？", isPresented: $confirmRevoke, titleVisibility: .visible) {
                Button("退出其他会话", role: .destructive) { Task { _ = await membership.revokeOtherSessions() } }
                Button(.Shared.actionCancel, role: .cancel) {}
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
            .pageBackground()
            .navigationTitle("修改密码").navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(.Shared.actionCancel, systemImage: "xmark", role: .cancel) { dismiss() }.disabled(membership.isBusy)
                }
            }
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
                Button(.Shared.actionCancel, role: .cancel) {}
            } message: { Text("其他设备需要重新登录。如当前会话无法恢复，你也需要使用新密码登录。") }
        }
    }
}

private struct ChangeEmailView: View {
    @Environment(MembershipStore.self) private var membership
    @Environment(\.dismiss) private var dismiss
    @State private var newEmail = ""
    private var trimmedEmail: String { newEmail.trimmingCharacters(in: .whitespacesAndNewlines) }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    if let account = membership.account {
                        LabeledContent("当前邮箱", value: account.email)
                    }
                    TextField("新邮箱", text: $newEmail)
                        .textContentType(.emailAddress).keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never).autocorrectionDisabled()
                        .accessibilityIdentifier("account-new-email")
                } footer: {
                    Text("提交后，当前邮箱会收到确认链接。确认后，新邮箱会收到验证链接。验证完成前，继续用当前邮箱登录。")
                }
                Section {
                    MembershipMessages()
                    Button(membership.isBusy ? "正在提交…" : "发送确认邮件") {
                        Task {
                            if await membership.changeEmail(to: newEmail) {
                                newEmail = ""
                                dismiss()
                            }
                        }
                    }
                    .disabled(trimmedEmail.isEmpty || membership.isBusy)
                    .accessibilityIdentifier("account-save-email")
                }
            }
            .pageBackground()
            .navigationTitle("更换邮箱").navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(.Shared.actionCancel, systemImage: "xmark", role: .cancel) { dismiss() }.disabled(membership.isBusy)
                }
            }
            .interactiveDismissDisabled(membership.isBusy)
            .onAppear { membership.errorMessage = nil; membership.notice = nil }
        }
    }
}
