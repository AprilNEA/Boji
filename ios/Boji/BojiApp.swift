import SwiftUI

@main
struct BojiApp: App {
    @State private var store: BojiStore
    @State private var membership: MembershipStore
    @State private var health: HealthDataStore
    @State private var companion: CompanionSharingStore
    @AppStorage("appearance") private var appearance = "system"
    init() {
        #if DEBUG
        _store = State(initialValue: BojiStore(inMemory: ProcessInfo.processInfo.arguments.contains("--uitesting")))
        _membership = State(initialValue: ProcessInfo.processInfo.arguments.contains("--uitesting") ? MembershipStore.uiTesting() : MembershipStore.live())
        _health = State(initialValue: ProcessInfo.processInfo.arguments.contains("--uitesting") ? HealthDataStore.uiTesting() : HealthDataStore.live())
        _companion = State(initialValue: CompanionSharingStore(isTesting: ProcessInfo.processInfo.arguments.contains("--uitesting")))
        #else
        _store = State(initialValue: BojiStore())
        _membership = State(initialValue: MembershipStore.live())
        _health = State(initialValue: HealthDataStore.live())
        _companion = State(initialValue: CompanionSharingStore())
        #endif
    }
    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(store)
                .environment(membership)
                .environment(health)
                .environment(companion)
                .environment(\.locale, Locale(identifier: "zh_Hans_CN"))
                .tint(BojiTheme.accent)
                .preferredColorScheme(appearance == "dark" ? .dark : appearance == "light" ? .light : nil)
                .task { await membership.restore() }
                .task { await health.refresh() }
        }
    }
}

struct RootView: View {
    @Environment(BojiStore.self) private var store
    @Environment(MembershipStore.self) private var membership
    @Environment(HealthDataStore.self) private var health
    @Environment(CompanionSharingStore.self) private var companion
    @Environment(\.scenePhase) private var scenePhase
    @State private var tab = 0
    @State private var onboarding = false

    private var companionProgress: CompanionProgress {
        let today = store.today
        return CompanionProgress(dayKey: today.id, trainingCompleted: !today.completedWorkoutIDs.isEmpty,
                                 waterLogged: today.waterML > 0, sleepLogged: today.sleepHours != nil,
                                 planTitle: store.selectedPlan.title)
    }

    var body: some View {
        TabView(selection: $tab) {
            Tab("今天", systemImage: "sun.max", value: 0) { TodayView() }
            Tab("训练", systemImage: "figure.strengthtraining.traditional", value: 1) { TrainingView() }
            Tab("足迹", systemImage: "chart.xyaxis.line", value: 2) { ProgressViewScreen() }
            Tab("俱乐部", systemImage: "person.2", value: 3) { ClubView() }
        }
        .onAppear { onboarding = !store.hasOnboarded; companion.update(companionProgress) }
        .onChange(of: companionProgress) { _, value in companion.update(value) }
        .onOpenURL { url in if let route = CompanionRoute(url: url) { tab = route.tabIndex } }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active {
                store.refreshDay()
                companion.update(companionProgress, force: true)
                if membership.account != nil { Task { await membership.refresh() } }
                Task { await health.refresh() }
            }
        }
        .task {
            while !Task.isCancelled {
                do { try await Task.sleep(for: .seconds(60)) } catch { return }
                store.refreshDay()
            }
        }
        .fullScreenCover(isPresented: $onboarding) { WelcomeView() }
        .safeAreaInset(edge: .top, spacing: 0) {
            if let error = store.storageError {
                Text(error).font(.caption).padding(10).frame(maxWidth: .infinity)
                    .background(.red.opacity(0.15)).accessibilityLabel("存储错误：\(error)")
            }
        }
    }
}
