import SwiftUI

struct AccountDeletionView: View {
    @Environment(MembershipStore.self) private var membership
    @Environment(\.dismiss) private var dismiss
    @State private var confirmationCode = ""
    @State private var confirmDeletion = false
    @FocusState private var codeFocused: Bool

    private var canConfirm: Bool {
        membership.hasPendingAccountDeletion
            && !confirmationCode.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !membership.isBusy && !membership.isOffline
    }

    var body: some View {
        NavigationStack {
            Form {
                if let account = membership.account {
                    Section("要删除的账号") {
                        Text(verbatim: account.email)
                    }
                }
                Section("删除后会发生什么") {
                    Text("服务器上的账号、会员卡和相关记录将被删除。此操作无法撤销。")
                    Text("本机训练、饮水、睡眠和身体记录仍会保留。")
                        .accessibilityIdentifier("account-delete-local-records")
                    Text("已添加到 Apple 钱包的卡片不会自动从设备移除，请自行移除。")
                }
                if membership.hasPendingAccountDeletion {
                    confirmationSection
                } else {
                    Section {
                        Button("发送注销确认邮件", systemImage: "envelope") {
                            requestCode()
                        }
                        .accessibilityIdentifier("account-delete-send-code")
                        .disabled(membership.isBusy || membership.isOffline || membership.account == nil)
                    } footer: {
                        Text("发送邮件不会删除账号。输入邮件中的确认码后，仍需再次确认删除。")
                    }
                }
                Section {
                    MembershipMessages()
                    if membership.isBusy { ProgressView("正在连接认证服务…") }
                }
            }
            .pageBackground()
            .navigationTitle("删除账号")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(.Shared.actionCancel, systemImage: "xmark", role: .cancel) {
                        dismiss()
                    }
                    .accessibilityIdentifier("account-delete-cancel")
                    .disabled(membership.isBusy)
                }
            }
            .interactiveDismissDisabled(membership.isBusy)
            .onAppear {
                membership.cancelAccountDeletion()
                membership.errorMessage = nil
                membership.notice = nil
            }
            .onDisappear {
                confirmationCode = ""
                membership.cancelAccountDeletion()
            }
            .onChange(of: membership.account?.id) { _, _ in
                confirmationCode = ""
                confirmDeletion = false
                dismiss()
            }
            .confirmationDialog("永久删除账号？", isPresented: $confirmDeletion, titleVisibility: .visible) {
                Button("永久删除账号", role: .destructive) {
                    let code = confirmationCode
                    confirmationCode = ""
                    Task {
                        if await membership.confirmAccountDeletion(code: code) {
                            dismiss()
                        }
                    }
                }
                .accessibilityIdentifier("account-delete-confirm")
                Button(.Shared.actionCancel, role: .cancel) {}
            } message: {
                Text("服务器上的账号、会员卡和相关记录将被删除。此操作无法撤销。")
            }
        }
    }

    private var confirmationSection: some View {
        Section {
            SecureField("邮件中的确认码", text: $confirmationCode)
                .textContentType(.oneTimeCode)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .submitLabel(.done)
                .focused($codeFocused)
                .onSubmit { codeFocused = false }
                .accessibilityIdentifier("account-delete-code")
            Button("重新发送确认邮件", systemImage: "envelope.arrow.triangle.branch") {
                requestCode()
            }
            .accessibilityIdentifier("account-delete-resend-code")
            .disabled(membership.isBusy || membership.isOffline)
            Button("删除账号", systemImage: "trash", role: .destructive) {
                codeFocused = false
                confirmDeletion = true
            }
            .accessibilityIdentifier("account-delete-submit")
            .disabled(!canConfirm)
        } header: {
            Text("确认账号邮箱")
        } footer: {
            Text("输入确认邮件中的完整确认码。确认码在 15 分钟后失效。")
        }
    }

    private func requestCode() {
        confirmationCode = ""
        codeFocused = false
        Task {
            if await membership.requestAccountDeletion() {
                codeFocused = true
            }
        }
    }
}
