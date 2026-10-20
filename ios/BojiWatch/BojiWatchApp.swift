import Combine
import Foundation
import SwiftUI
@preconcurrency import WatchConnectivity

@main
struct BojiWatchApp: App {
    @StateObject private var companionStore = WatchCompanionStore()

    var body: some Scene {
        WindowGroup {
            WatchCompanionView(store: companionStore)
        }
    }
}

private struct WatchCompanionView: View {
    @ObservedObject var store: WatchCompanionStore

    var body: some View {
        TimelineView(.periodic(from: .now, by: 60)) { timeline in
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text("今日进度")
                        .font(.title3.weight(.bold))

                    connectionNotice

                    switch store.presentation(at: timeline.date) {
                    case .current(let snapshot):
                        currentProgress(snapshot)
                    case .sharingDisabled:
                        sharingDisabled
                    case .noData:
                        noData
                    case .stale:
                        staleData
                    }

                    Button {
                        store.requestSnapshot()
                    } label: {
                        Label("刷新", systemImage: "arrow.clockwise")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(!store.canRequestSnapshot)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 2)
            }
        }
    }

    @ViewBuilder
    private var connectionNotice: some View {
        switch store.connectionState {
        case .starting:
            Label("正在连接 iPhone", systemImage: "iphone")
                .font(.footnote)
                .foregroundStyle(.secondary)
        case .requesting:
            Label("正在请求更新", systemImage: "arrow.triangle.2.circlepath")
                .font(.footnote)
                .foregroundStyle(.secondary)
        case .offline:
            VStack(alignment: .leading, spacing: 2) {
                Label("iPhone 当前离线", systemImage: "iphone.slash")
                    .font(.footnote.weight(.semibold))
                Text("已保留快照。仅显示今天的当前数据。")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        case .ready:
            Label("已连接 iPhone", systemImage: "iphone")
                .font(.footnote)
                .foregroundStyle(.secondary)
        case .unavailable:
            Label("此设备无法使用共享", systemImage: "exclamationmark.triangle")
                .font(.footnote)
                .foregroundStyle(.secondary)
        case .failed:
            Label("无法连接 iPhone", systemImage: "exclamationmark.triangle")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }

    private func currentProgress(_ snapshot: CompanionSnapshot) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            if !snapshot.planTitle.isEmpty {
                VStack(alignment: .leading, spacing: 2) {
                    Text("计划")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(snapshot.planTitle)
                        .font(.headline)
                        .lineLimit(2)
                }
            }

            ProgressRow(title: "手动训练", isRecorded: snapshot.trainingCompleted)
            ProgressRow(title: "饮水", isRecorded: snapshot.waterLogged)
            ProgressRow(title: "睡眠", isRecorded: snapshot.sleepLogged)

            Text("同步于 \(snapshot.generatedAt.formatted(date: .omitted, time: .shortened))")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    private var sharingDisabled: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("共享未开启")
                .font(.headline)
            Text("请在 iPhone 的薄肌设置中开启共享。")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }

    private var noData: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("尚无共享数据")
                .font(.headline)
            Text("请在 iPhone 的薄肌设置中开启共享。")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }

    private var staleData: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("今天没有当前数据")
                .font(.headline)
            Text("已保留旧快照，但不会显示非今日记录。")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }
}

private struct ProgressRow: View {
    let title: String
    let isRecorded: Bool

    var body: some View {
        HStack {
            Text(title)
                .font(.headline)
            Spacer()
            Text(isRecorded ? "已记录" : "未记录")
                .font(.title3.weight(.bold))
                .foregroundStyle(isRecorded ? .green : .secondary)
        }
        .accessibilityElement(children: .combine)
    }
}

@MainActor
final class WatchCompanionStore: NSObject, ObservableObject {
    enum ConnectionState: Equatable {
        case starting
        case requesting
        case offline
        case ready
        case unavailable
        case failed
    }

    enum Presentation {
        case noData
        case sharingDisabled
        case current(CompanionSnapshot)
        case stale
    }

    @Published private(set) var connectionState: ConnectionState = .starting
    @Published private(set) var snapshot: CompanionSnapshot?
    @Published private(set) var isSharingDisabled = false

    private let snapshotStore: CompanionSnapshotStore
    private let session: WCSession
    private var newestGeneratedAt: Date?

    var canRequestSnapshot: Bool {
        connectionState == .ready && session.isReachable
    }

    override convenience init() {
        self.init(snapshotStore: .live(), session: .default)
    }

    init(snapshotStore: CompanionSnapshotStore, session: WCSession) {
        self.snapshotStore = snapshotStore
        self.session = session

        let savedSnapshot = snapshotStore.load()
        newestGeneratedAt = savedSnapshot?.generatedAt
        if let savedSnapshot, savedSnapshot.isSharingEnabled {
            snapshot = savedSnapshot
        } else {
            snapshot = nil
            isSharingDisabled = savedSnapshot != nil
        }

        super.init()

        guard WCSession.isSupported() else {
            connectionState = .unavailable
            return
        }

        session.delegate = self
        session.activate()
    }

    func presentation(at date: Date) -> Presentation {
        if isSharingDisabled {
            return .sharingDisabled
        }
        guard let snapshot else {
            return .noData
        }
        return snapshot.isCurrent(at: date) ? .current(snapshot) : .stale
    }

    func requestSnapshot() {
        guard WCSession.isSupported() else {
            connectionState = .unavailable
            return
        }
        guard session.activationState == .activated, session.isReachable else {
            connectionState = .offline
            return
        }

        connectionState = .requesting
        session.sendMessage(
            ["requestSnapshot": true],
            replyHandler: { [weak self] message in
                guard let data = message[CompanionIdentifiers.snapshotKey] as? Data else {
                    Task { @MainActor [weak self] in
                        self?.requestDidFail()
                    }
                    return
                }
                Task { @MainActor [weak self] in
                    self?.receiveSnapshotData(data)
                }
            },
            errorHandler: { [weak self] _ in
                Task { @MainActor [weak self] in
                    self?.requestDidFail()
                }
            }
        )
    }

    private func activationDidComplete(isActivated: Bool, isReachable: Bool, snapshotData: Data?) {
        guard isActivated else {
            connectionState = .failed
            return
        }

        connectionState = isReachable ? .ready : .offline
        if let snapshotData {
            receiveSnapshotData(snapshotData)
        }
        if isReachable {
            requestSnapshot()
        }
    }

    private func reachabilityDidChange(isReachable: Bool) {
        guard session.activationState == .activated else {
            return
        }
        connectionState = isReachable ? .ready : .offline
    }

    private func requestDidFail() {
        connectionState = session.isReachable ? .failed : .offline
    }

    private func receiveSnapshotData(_ data: Data) {
        guard let incoming = CompanionSnapshot.decode(data) else {
            return
        }
        guard newestGeneratedAt.map({ incoming.generatedAt > $0 }) ?? true else {
            return
        }

        do {
            try snapshotStore.save(incoming)
        } catch {
            // Keep the in-memory snapshot. The next valid update retries local persistence.
        }

        newestGeneratedAt = incoming.generatedAt
        isSharingDisabled = !incoming.isSharingEnabled
        snapshot = incoming.isSharingEnabled ? incoming : nil
        if session.activationState == .activated {
            connectionState = session.isReachable ? .ready : .offline
        }
    }
}

extension WatchCompanionStore: WCSessionDelegate {
    nonisolated func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: (any Error)?
    ) {
        let isActivated = activationState == .activated
        let isReachable = session.isReachable
        let snapshotData = session.receivedApplicationContext[CompanionIdentifiers.snapshotKey] as? Data

        Task { @MainActor [weak self] in
            self?.activationDidComplete(
                isActivated: isActivated,
                isReachable: isReachable,
                snapshotData: snapshotData
            )
        }
    }

    nonisolated func sessionReachabilityDidChange(_ session: WCSession) {
        let isReachable = session.isReachable
        Task { @MainActor [weak self] in
            self?.reachabilityDidChange(isReachable: isReachable)
        }
    }

    nonisolated func session(
        _ session: WCSession,
        didReceiveApplicationContext applicationContext: [String: Any]
    ) {
        guard let data = applicationContext[CompanionIdentifiers.snapshotKey] as? Data else {
            return
        }
        Task { @MainActor [weak self] in
            self?.receiveSnapshotData(data)
        }
    }
}
