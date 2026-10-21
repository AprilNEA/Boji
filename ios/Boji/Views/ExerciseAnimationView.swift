import SwiftUI
import Lottie
import UIKit

/// Loads only validated, bundled course resources. No remote animation URLs are accepted.
@MainActor
final class ExerciseAnimationLoader {
    static let shared = ExerciseAnimationLoader()
    let catalog: ExerciseAnimationCatalog?
    private let bundle: Bundle
    private let cache = NSCache<NSString, LottieAnimation>()

    init(bundle: Bundle = .main) {
        self.bundle = bundle
        catalog = try? ExerciseAnimationCatalog(bundle: bundle)
        cache.countLimit = 8
    }

    func load(_ entry: ExerciseAnimationDescriptor, theme: ExerciseAnimationTheme) async throws -> LottieAnimation {
        if ExerciseAnimationTestSettings.missingAsset { throw CocoaError(.fileNoSuchFile) }
        let path = entry.resourcePath(for: theme)
        if let value = cache.object(forKey: path as NSString) { return value }
        guard let url = bundle.url(forResource: path, withExtension: nil, subdirectory: "lottie") else {
            throw CocoaError(.fileNoSuchFile)
        }
        let animation = try await Task.detached(priority: .userInitiated) {
            try LottieAnimation.from(data: Data(contentsOf: url))
        }.value
        try Task.checkCancellation()
        guard animation.startFrame == 0, animation.endFrame == Double(entry.frames),
              animation.framerate == entry.fps else { throw CocoaError(.fileReadCorruptFile) }
        cache.setObject(animation, forKey: path as NSString)
        return animation
    }
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
    @State private var loaded: LoadedAnimation?
    @State private var failedKey: String?

    private struct LoadedAnimation {
        let key: String
        let animation: LottieAnimation
    }
    private var theme: ExerciseAnimationTheme { colorScheme == .dark ? .dark : .light }
    private var key: String { "\(theme.rawValue)/\(exercise.id)" }
    private var entry: ExerciseAnimationDescriptor? { ExerciseAnimationLoader.shared.catalog?.entry(for: exercise.id) }
    private var mode: ExercisePlaybackMode {
        .resolve(reduceMotion: reduceMotion || ExerciseAnimationTestSettings.reduceMotion, isVisible: visible, isSceneActive: scenePhase == .active,
                 wantsToPlay: isPlaying, showsPoster: showsPoster)
    }

    var body: some View {
        Group {
            if let entry, let loaded, loaded.key.hasSuffix("/\(exercise.id)"), failedKey != key {
                NativeExerciseAnimation(animation: loaded.animation, key: loaded.key, exercise: exercise,
                                        posterFrame: entry.posterFrame, mode: loaded.key == key ? mode : .hold,
                                        speed: speed, theme: loaded.key.hasPrefix("dark/") ? .dark : .light,
                                        isDecorative: isDecorative)
            } else if entry == nil || failedKey == key {
                VStack(spacing: 12) {
                    Image(systemName: exercise.symbol).font(.system(size: 64)).foregroundStyle(BojiTheme.accent)
                    Text("动作演示暂不可用").font(.footnote).foregroundStyle(.secondary)
                    Text("请参考下方动作提示").font(.caption).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .accessibilityElement(children: .combine)
                .accessibilityIdentifier("exercise-animation-fallback")
            } else {
                ProgressView("正在加载动作…").frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .aspectRatio(1, contentMode: .fit)
        .task(id: key) {
            let requestedKey = key
            guard let entry else { return }
            do {
                let animation = try await ExerciseAnimationLoader.shared.load(entry, theme: theme)
                try Task.checkCancellation()
                loaded = LoadedAnimation(key: requestedKey, animation: animation)
                failedKey = nil
            } catch is CancellationError {
                // A newer exercise or theme owns the next result.
            } catch {
                guard !Task.isCancelled else { return }
                failedKey = requestedKey
            }
        }
        .onAppear { visible = true }
        .onDisappear { visible = false }
        .onScrollVisibilityChange(threshold: 0.1) { visible = $0 }
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
    private static func enabled(_ flag: String) -> Bool {
        #if DEBUG
        return ProcessInfo.processInfo.arguments.contains("--uitesting") && ProcessInfo.processInfo.arguments.contains(flag)
        #else
        return false
        #endif
    }
}
