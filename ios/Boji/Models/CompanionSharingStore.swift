import Foundation
import Observation
import WidgetKit
@preconcurrency import WatchConnectivity

@MainActor
@Observable
final class CompanionSharingStore: NSObject {
    private static let enabledKey = "companionSharingEnabled"
    private let preferences: UserDefaults
    private let storage: CompanionSnapshotStore
    private let isTesting: Bool
    private var progress: CompanionProgress?
    private var currentSnapshot = CompanionSnapshot.disabled()
    private var session: WCSession?
    private(set) var isEnabled: Bool
    private(set) var errorMessage: String?
    private(set) var watchStatus = "尚未连接手表"

    init(isTesting: Bool = false) {
        self.isTesting = isTesting
        self.preferences = .standard
        self.storage = isTesting ? CompanionSnapshotStore(directory: nil) : .live()
        self.isEnabled = !isTesting && UserDefaults.standard.bool(forKey: Self.enabledKey)
        super.init()
        guard !isTesting, WCSession.isSupported() else { return }
        session = WCSession.default
        session?.delegate = self
        session?.activate()
    }

    func setEnabled(_ enabled: Bool) {
        isEnabled = enabled
        if !isTesting { preferences.set(enabled, forKey: Self.enabledKey) }
        publish()
    }

    func update(_ value: CompanionProgress, force: Bool = false) {
        guard value != progress || force else { return }
        progress = value
        publish()
    }

    func disconnect() {
        isEnabled = false
        if !isTesting { preferences.removeObject(forKey: Self.enabledKey) }
        progress = nil
        publish()
    }

    private func publish() {
        let generatedAt = max(Date(), currentSnapshot.generatedAt.addingTimeInterval(0.001))
        if isEnabled, let progress {
            currentSnapshot = CompanionSnapshot(progress: progress, generatedAt: generatedAt)
        } else {
            currentSnapshot = .disabled(at: generatedAt)
        }
        errorMessage = nil
        if !isTesting {
            do { try storage.save(currentSnapshot) }
            catch { errorMessage = "共享容器暂不可用，请检查 App Group 签名配置。" }
            WidgetCenter.shared.reloadTimelines(ofKind: CompanionIdentifiers.widgetKind)
        }
        sendSnapshot()
    }

    private func sendSnapshot() {
        guard let session, session.activationState == .activated else { return }
        guard session.isPaired else { watchStatus = "尚未配对 Apple Watch"; return }
        guard session.isWatchAppInstalled else { watchStatus = "请先在 Apple Watch 安装薄肌"; return }
        do {
            try session.updateApplicationContext([CompanionIdentifiers.snapshotKey: try currentSnapshot.encoded()])
            watchStatus = session.isReachable ? "已连接手表" : "等待手表连接后同步"
        } catch { watchStatus = "暂时无法同步手表，请稍后重试" }
    }
}

extension CompanionSharingStore: WCSessionDelegate {
    nonisolated func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        let failed = error != nil
        Task { @MainActor [weak self] in
            guard let self else { return }
            if failed { watchStatus = "手表连接未完成" }
            else { sendSnapshot() }
        }
    }
    nonisolated func sessionDidBecomeInactive(_ session: WCSession) {}
    nonisolated func sessionDidDeactivate(_ session: WCSession) {
        Task { @MainActor [weak self] in self?.session?.activate() }
    }
    nonisolated func sessionReachabilityDidChange(_ session: WCSession) {
        Task { @MainActor [weak self] in self?.sendSnapshot() }
    }
    nonisolated func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        guard message["requestSnapshot"] as? Bool == true else { replyHandler([:]); return }
        let reply = CompanionReply(replyHandler)
        Task { @MainActor [weak self] in
            guard let self, let data = try? currentSnapshot.encoded() else { reply.send([:]); return }
            reply.send([CompanionIdentifiers.snapshotKey: data])
        }
    }
}

private final class CompanionReply: @unchecked Sendable {
    private let handler: ([String: Any]) -> Void
    init(_ handler: @escaping ([String: Any]) -> Void) { self.handler = handler }
    func send(_ value: [String: Any]) { handler(value) }
}
