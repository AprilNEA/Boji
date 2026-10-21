import SwiftUI
import PassKit

struct MembershipWalletView: View {
    @Environment(MembershipStore.self) private var membership
    @State private var presentation: WalletPresentation?
    @State private var errorMessage: String?
    private var passType: String { AppleIntegrationSettings.walletPassTypeIdentifier }
    private var available: Bool {
        !passType.isEmpty && membership.capabilities?.walletPass == true && PKAddPassesViewController.canAddPasses() && !membership.isTestEnvironment
    }
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if available {
                WalletAddButton(enabled: !membership.isBusy && !membership.isOffline) {
                    Task { await preparePass() }
                }.frame(height: 48).accessibilityLabel("添加到 Apple 钱包")
                    .accessibilityIdentifier("wallet-add")
                Text("在系统窗口确认添加。钱包卡仅展示身份，不是支付或核销凭证。")
                    .font(.caption).foregroundStyle(.secondary)
            } else {
                Label("Apple 钱包暂不可用", systemImage: "wallet.pass").font(.subheadline).foregroundStyle(.secondary)
                Text(membership.capabilitiesError ?? (passType.isEmpty ? String(localized: "此版本尚未配置钱包凭证类型。") : membership.capabilities?.walletPass != true ? String(localized: "服务尚未启用正式凭证签发。") : String(localized: "此设备暂不支持添加钱包凭证。")))
                    .font(.caption).foregroundStyle(.secondary)
            }
            if let errorMessage { Text(errorMessage).font(.footnote).foregroundStyle(.red) }
        }
        .sheet(item: $presentation) { item in
            WalletAddSheet(controller: item.controller) { presentation = nil }
        }
        .onChange(of: membership.account?.id) { _, _ in presentation = nil }
    }

    @MainActor private func preparePass() async {
        errorMessage = nil
        guard let expectedCard = membership.card, expectedCard.isActive else { return }
        guard let data = await membership.walletPassData() else { return }
        guard membership.card?.id == expectedCard.id else { return }
        do {
            let pass = try PKPass(data: data)
            guard pass.passTypeIdentifier == passType, pass.serialNumber == expectedCard.id else {
                errorMessage = String(localized: "钱包凭证与当前会员卡不匹配，请重新获取。")
                return
            }
            guard let controller = PKAddPassesViewController(pass: pass) else {
                errorMessage = String(localized: "系统无法展示此钱包凭证。")
                return
            }
            presentation = WalletPresentation(controller: controller)
        } catch { errorMessage = String(localized: "钱包凭证无效或签名不可用，请稍后重试。") }
    }
}

private struct WalletPresentation: Identifiable {
    let id = UUID()
    let controller: PKAddPassesViewController
}

private struct WalletAddButton: UIViewRepresentable {
    let enabled: Bool
    let action: () -> Void
    func makeCoordinator() -> Coordinator { Coordinator(action: action) }
    func makeUIView(context: Context) -> PKAddPassButton {
        let button = PKAddPassButton(addPassButtonStyle: .black)
        button.addTarget(context.coordinator, action: #selector(Coordinator.add), for: .touchUpInside)
        return button
    }
    func updateUIView(_ uiView: PKAddPassButton, context: Context) {
        uiView.isEnabled = enabled
        uiView.alpha = enabled ? 1 : 0.5
        context.coordinator.action = action
    }
    final class Coordinator: NSObject {
        var action: () -> Void
        init(action: @escaping () -> Void) { self.action = action }
        @objc func add() { action() }
    }
}

private struct WalletAddSheet: UIViewControllerRepresentable {
    let controller: PKAddPassesViewController
    let finished: () -> Void
    func makeCoordinator() -> Coordinator { Coordinator(finished: finished) }
    func makeUIViewController(context: Context) -> PKAddPassesViewController {
        controller.delegate = context.coordinator
        return controller
    }
    func updateUIViewController(_ uiViewController: PKAddPassesViewController, context: Context) {}
    final class Coordinator: NSObject, PKAddPassesViewControllerDelegate {
        let finished: () -> Void
        init(finished: @escaping () -> Void) { self.finished = finished }
        func addPassesViewControllerDidFinish(_ controller: PKAddPassesViewController) { finished() }
    }
}
