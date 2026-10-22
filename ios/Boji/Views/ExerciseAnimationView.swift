import SwiftUI
import Lottie
import UIKit

/// Loads validated bundled resources first. Remote resources can only come from the verified disk cache.
@MainActor
final class ExerciseAnimationLoader {
    static let shared = ExerciseAnimationLoader()
    private static var configuredRemoteStore: ExerciseAnimationRemoteStore?

    let catalog: ExerciseAnimationCatalog?
    private let bundle: Bundle
    private let remoteStore: ExerciseAnimationRemoteStore
    private let cache = NSCache<NSString, LottieAnimation>()

    init(bundle: Bundle = .main, remoteStore: ExerciseAnimationRemoteStore? = nil) {
        self.bundle = bundle
        catalog = try? ExerciseAnimationCatalog(bundle: bundle)
        let bundledIDs = Set(catalog?.entries.map(\.id) ?? [])
        self.remoteStore = remoteStore ?? Self.configuredRemoteStore
            ?? ExerciseAnimationRemoteStore(bundledExerciseIDs: bundledIDs)
        cache.countLimit = 8
    }

    static func configureRemoteStore(_ store: ExerciseAnimationRemoteStore) {
        configuredRemoteStore = store
    }

    func needsPrefetch(_ workout: Workout) async -> Bool {
        await remoteStore.needsPrefetch(workout)
    }

    func prefetch(_ workout: Workout) async -> ExerciseAnimationPrefetchResult {
        await remoteStore.prefetch(workout)
    }

    func descriptor(for exerciseID: String) async -> ExerciseAnimationDescriptor? {
        if let bundled = catalog?.entry(for: exerciseID) { return bundled }
        return await remoteStore.cachedDescriptor(for: exerciseID)
    }

    /// Keeps the bundled loading API stable for native asset tests.
    func load(_ entry: ExerciseAnimationDescriptor, theme: ExerciseAnimationTheme) async throws -> LottieAnimation {
        if ExerciseAnimationTestSettings.missingAsset { throw CocoaError(.fileNoSuchFile) }
        let path = entry.resourcePath(for: theme)
        let key = "bundle/\(path)"
        if let value = cache.object(forKey: key as NSString) { return value }
        guard let url = bundle.url(forResource: path, withExtension: nil, subdirectory: "lottie") else {
            throw CocoaError(.fileNoSuchFile)
        }
        let animation = try await animation(from: url, entry: entry, allowsRoundedTiming: false)
        cache.setObject(animation, forKey: key as NSString)
        return animation
    }

    func load(exerciseID: String, theme: ExerciseAnimationTheme) async throws -> LoadedExerciseAnimation {
        if let bundled = catalog?.entry(for: exerciseID) {
            return LoadedExerciseAnimation(
                key: "bundle/\(bundled.resourcePath(for: theme))",
                descriptor: bundled,
                animation: try await load(bundled, theme: theme),
                theme: theme
            )
        }

        guard !ExerciseAnimationTestSettings.missingAsset,
              let remote = await remoteStore.cachedDescriptor(for: exerciseID),
              let url = await remoteStore.cachedURL(for: remote, theme: theme) else {
            throw CocoaError(.fileNoSuchFile)
        }
        let key = "remote/\(theme.rawValue)/\(remote.id)/\(remote.sha256.value(for: theme))"
        if let animation = cache.object(forKey: key as NSString) {
            return LoadedExerciseAnimation(key: key, descriptor: remote, animation: animation, theme: theme)
        }
        let animation = try await animation(from: url, entry: remote, allowsRoundedTiming: true)
        cache.setObject(animation, forKey: key as NSString)
        return LoadedExerciseAnimation(key: key, descriptor: remote, animation: animation, theme: theme)
    }

    private func animation(
        from url: URL,
        entry: ExerciseAnimationDescriptor,
        allowsRoundedTiming: Bool
    ) async throws -> LottieAnimation {
        let animation = try await Task.detached(priority: .userInitiated) {
            try LottieAnimation.from(data: Data(contentsOf: url))
        }.value
        try Task.checkCancellation()
        let timingMatches: Bool
        if allowsRoundedTiming {
            timingMatches = abs(animation.endFrame - Double(entry.frames)) <= 1
                && abs(animation.framerate - entry.fps) <= 0.01
        } else {
            timingMatches = animation.startFrame == 0
                && animation.endFrame == Double(entry.frames)
                && animation.framerate == entry.fps
        }
        guard timingMatches else { throw CocoaError(.fileReadCorruptFile) }
        return animation
    }
}

struct LoadedExerciseAnimation {
    let key: String
    let descriptor: ExerciseAnimationDescriptor
    let animation: LottieAnimation
    let theme: ExerciseAnimationTheme
}

struct ExerciseAnimationView: View {
    let exercise: Exercise
    var isPlaying = true
    var showsPoster = false
    var speed: Double = 1
    /// Decorative posters stay out of the accessibility tree, so only the active player is exposed.
    var isDecorative = false
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase
    @State private var visible = false
    @State private var loaded: LoadedExerciseAnimation?
    @State private var failedKey: String?

    private var theme: ExerciseAnimationTheme { colorScheme == .dark ? .dark : .light }
    private var key: String { "\(theme.rawValue)/\(exercise.id)" }
    private var mode: ExercisePlaybackMode {
        .resolve(reduceMotion: reduceMotion || ExerciseAnimationTestSettings.reduceMotion, isVisible: visible,
                 isSceneActive: scenePhase == .active, wantsToPlay: isPlaying, showsPoster: showsPoster)
    }

    var body: some View {
        Group {
            if let loaded, loaded.descriptor.id == exercise.id, failedKey != key {
                NativeExerciseAnimation(animation: loaded.animation, key: loaded.key, exercise: exercise,
                                        posterFrame: loaded.descriptor.posterFrame,
                                        mode: loaded.theme == theme ? mode : .hold,
                                        speed: speed, theme: loaded.theme, isDecorative: isDecorative)
            } else if failedKey == key {
                fallback
            } else {
                ProgressView("正在加载动作…").frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .aspectRatio(1, contentMode: .fit)
        .task(id: key) {
            let requestedKey = key
            do {
                loaded = try await ExerciseAnimationLoader.shared.load(exerciseID: exercise.id, theme: theme)
                failedKey = nil
            } catch is CancellationError {
                // A newer exercise or theme owns the next result.
            } catch {
                // The detail-screen prefetch can finish after the session starts. The player only retries its cache.
                for _ in 0..<20 {
                    guard !Task.isCancelled else { return }
                    try? await Task.sleep(for: .milliseconds(250))
                    if let animation = try? await ExerciseAnimationLoader.shared.load(exerciseID: exercise.id, theme: theme) {
                        guard !Task.isCancelled, requestedKey == key else { return }
                        loaded = animation
                        failedKey = nil
                        return
                    }
                }
                guard !Task.isCancelled, requestedKey == key else { return }
                failedKey = requestedKey
            }
        }
        .onAppear { visible = true }
        .onDisappear { visible = false }
        .onScrollVisibilityChange(threshold: 0.1) { visible = $0 }
    }

    private var fallback: some View {
        VStack(spacing: 12) {
            Image(systemName: exercise.symbol).font(.system(size: 64)).foregroundStyle(BojiTheme.accent)
            Text("动作演示暂不可用").font(.footnote).foregroundStyle(.secondary)
            Text("请参考下方动作提示").font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("exercise-animation-fallback")
    }
}

private struct NativeExerciseAnimation: UIViewRepresentable {
    let animation: LottieAnimation
    let key: String
    let exercise: Exercise
    let posterFrame: Int
    let mode: ExercisePlaybackMode
    let speed: Double
    let theme: ExerciseAnimationTheme
    let isDecorative: Bool

    func makeUIView(context: Context) -> ExerciseAnimationHost { ExerciseAnimationHost() }
    func updateUIView(_ view: ExerciseAnimationHost, context: Context) {
        view.update(animation: animation, key: key, exerciseID: exercise.id, name: exercise.name,
                    posterFrame: posterFrame, mode: mode, speed: speed, theme: theme)
        view.isAccessibilityElement = !isDecorative
    }
    static func dismantleUIView(_ view: ExerciseAnimationHost, coordinator: ()) {
        view.animationView.pause()
        view.animationView.animation = nil
    }
}

/// UIKit owns the animation clock; SwiftUI timer updates must not restart a loop.
@MainActor
final class ExerciseAnimationHost: UIView {
    let animationView = LottieAnimationView(configuration: LottieConfiguration(renderingEngine: .automatic))
    private var resourceKey: String?
    private var exerciseID: String?
    private var mode: ExercisePlaybackMode = .hold
    private var theme: ExerciseAnimationTheme = .light

    init() {
        super.init(frame: .zero)
        animationView.contentMode = .scaleAspectFit
        animationView.backgroundBehavior = .pause
        animationView.loopMode = .loop
        animationView.isAccessibilityElement = false
        addSubview(animationView)
        isAccessibilityElement = true
        accessibilityTraits = .image
        accessibilityIdentifier = "exercise-animation"
        clipsToBounds = true
    }
    required init?(coder: NSCoder) { fatalError("init(coder:) is not supported") }
    override func layoutSubviews() { super.layoutSubviews(); animationView.frame = bounds }
    override func didMoveToWindow() {
        super.didMoveToWindow()
        if window == nil { animationView.pause() }
        else { applyMode() }
    }
    override var accessibilityValue: String? {
        get {
            let state = mode == .poster ? String(localized: "静态姿势") : animationView.isAnimationPlaying ? String(localized: "正在播放") : String(localized: "已暂停")
            let themeName = theme == .dark ? String(localized: "深色") : String(localized: "浅色")
            return String(localized: "\(state)，\(themeName)")
        }
        set { }
    }

    func update(animation: LottieAnimation, key: String, exerciseID: String, name: String,
                posterFrame: Int, mode: ExercisePlaybackMode, speed: Double, theme: ExerciseAnimationTheme) {
        if resourceKey != key {
            let progress = self.exerciseID == exerciseID ? animationView.realtimeAnimationProgress : nil
            animationView.pause()
            animationView.animation = animation
            if let progress { animationView.currentProgress = progress }
            else { animationView.currentFrame = Double(posterFrame) }
            resourceKey = key
            self.exerciseID = exerciseID
        }
        self.mode = mode
        self.theme = theme
        accessibilityLabel = String(localized: "\(name)动作演示")
        if animationView.animationSpeed != CGFloat(speed) {
            animationView.animationSpeed = CGFloat(speed)
        }
        if mode == .poster { animationView.currentFrame = Double(posterFrame) }
        applyMode()
    }

    private func applyMode() {
        if mode == .play, window != nil {
            if !animationView.isAnimationPlaying && !animationView.isAnimationQueued {
                // play() resumes at the current frame but keeps the complete loop range.
                animationView.play()
            }
        } else { animationView.pause() }
    }
}

enum ExerciseAnimationTestSettings {
    static var reduceMotion: Bool { enabled("--animation-reduce-motion") }
    static var missingAsset: Bool { enabled("--animation-missing-asset") }
    static var remoteFixture: String? {
        #if DEBUG
        guard ProcessInfo.processInfo.arguments.contains("--uitesting"),
              let argument = ProcessInfo.processInfo.arguments.first(where: {
                  $0.hasPrefix("--animation-remote-fixture=")
              }) else { return nil }
        let value = String(argument.dropFirst("--animation-remote-fixture=".count))
        return ["ok", "offline"].contains(value) ? value : nil
        #else
        return nil
        #endif
    }

    private static func enabled(_ flag: String) -> Bool {
        #if DEBUG
        return ProcessInfo.processInfo.arguments.contains("--uitesting") && ProcessInfo.processInfo.arguments.contains(flag)
        #else
        return false
        #endif
    }
}
