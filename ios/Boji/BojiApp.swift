import SwiftUI

@main
struct BojiApp: App {
    @State private var store: BojiStore
    @State private var membership: MembershipStore
    @State private var health: HealthDataStore
    @State private var companion: CompanionSharingStore
    @AppStorage("appearance") private var appearance = "system"
    init() {
        CrashReporting.start()
        #if DEBUG
        if let fixture = ExerciseAnimationTestSettings.remoteFixture {
            ExerciseAnimationLoader.configureRemoteStore(
                ExerciseAnimationFixtureTransport.makeStore(mode: fixture)
            )
        }
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
                .environment(\.locale, .bojiDisplay)
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
            Tab(.Shared.tabToday, systemImage: "sun.max", value: 0) { TodayView() }
            Tab(.Shared.tabTraining, systemImage: "figure.strengthtraining.traditional", value: 1) { TrainingView() }
            Tab(.Shared.tabProgress, systemImage: "chart.xyaxis.line", value: 2) { ProgressViewScreen() }
            Tab(.Shared.tabClub, systemImage: "person.2", value: 3) { ClubView() }
        }
        .tabViewStyle(.sidebarAdaptable)
        .tabBarMinimizeBehavior(.onScrollDown)
        .onAppear { onboarding = !store.hasOnboarded; companion.update(companionProgress) }
        .onChange(of: companionProgress) { _, value in companion.update(value) }
        .onOpenURL { url in if let route = CompanionRoute(url: url) { tab = route.tabIndex } }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active {
                store.refreshDay()
                companion.update(companionProgress, force: true)
                if membership.account != nil { Task { await membership.refresh() } }
                Task { await health.refresh() }
            } else if phase == .background {
                // Ask for background time, so iOS does not suspend the app before the last write finishes.
                let task = UIApplication.shared.beginBackgroundTask(withName: "Save local data")
                Task {
                    await store.flush()
                    UIApplication.shared.endBackgroundTask(task)
                }
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
                Label(error, systemImage: "exclamationmark.triangle.fill")
                    .font(.footnote).foregroundStyle(.primary)
                    .padding(.horizontal, 16).padding(.vertical, 10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(uiColor: .systemRed).opacity(0.15))
                    .accessibilityLabel(.Shared.storageErrorA11Y(message: error))
            }
        }
    }
}

extension Locale {
    /// The locale of the localization that the app bundle shows, for example `zh-Hans`.
    /// SwiftUI looks up strings and formats values with the environment locale. A fixed locale
    /// would keep every `Text` in one language, so the app uses the language that the bundle selects.
    static let bojiDisplay = Locale(identifier: Bundle.main.preferredLocalizations.first ?? "zh-Hans")
}

/// Every tab reaches settings through the same account button at the trailing edge.
/// Page actions sit in their own glass group before it.
private struct ProfileToolbar<Actions: View>: ViewModifier {
    let actions: Actions
    @State private var showSettings = false
    func body(content: Content) -> some View {
        content
            .toolbar {
                if Actions.self != EmptyView.self {
                    ToolbarItemGroup(placement: .topBarTrailing) { actions }
                    ToolbarSpacer(.fixed, placement: .topBarTrailing)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(.Shared.actionSettings, systemImage: "person.crop.circle") { showSettings = true }
                }
            }
            .sheet(isPresented: $showSettings) { SettingsView() }
    }
}

extension View {
    func profileToolbar() -> some View { modifier(ProfileToolbar(actions: EmptyView())) }
    func profileToolbar(@ViewBuilder actions: () -> some View) -> some View { modifier(ProfileToolbar(actions: actions())) }
}
