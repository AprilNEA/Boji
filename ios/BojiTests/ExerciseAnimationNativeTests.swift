import XCTest
import Lottie
import UIKit
@testable import Boji

@MainActor
final class ExerciseAnimationNativeTests: XCTestCase {
    func testBundledResourcesCoverCoursesWithoutLibraryOrTemporaryFiles() throws {
        let catalog = try ExerciseAnimationCatalog()
        let courses = [WorkoutLibrary.home, WorkoutLibrary.homeIntermediate, WorkoutLibrary.gym, WorkoutLibrary.mobility]
        let exercises = Set(courses.flatMap(\.exercises).map(\.id))
        XCTAssertEqual(Set(catalog.entries.map(\.id)), exercises)
        XCTAssertNil(Bundle.main.url(forResource: "index", withExtension: "json", subdirectory: "lottie-library"))
        let files = FileManager.default.enumerator(atPath: Bundle.main.bundlePath)?.allObjects as? [String] ?? []
        XCTAssertFalse(files.contains { $0.hasSuffix(".tmp") })
    }

    func testAllBundledAnimationsDecodeAndRenderPosterFrames() async throws {
        let loader = ExerciseAnimationLoader()
        let catalog = try XCTUnwrap(loader.catalog)
        for entry in catalog.entries {
            for theme in ExerciseAnimationTheme.allCases {
                let animation = try await loader.load(entry, theme: theme)
                XCTAssertEqual(animation.endFrame, Double(entry.frames))
                XCTAssertEqual(animation.bounds.width, 512)
                XCTAssertEqual(animation.bounds.height, 512)
                let view = LottieAnimationView(animation: animation, configuration: .init(renderingEngine: .mainThread))
                view.frame = CGRect(x: 0, y: 0, width: 256, height: 256)
                view.contentMode = .scaleAspectFit
                view.currentFrame = Double(entry.posterFrame)
                view.layoutIfNeeded()
                view.forceDisplayUpdate()
                XCTAssertEqual(view.currentFrame, Double(entry.posterFrame), accuracy: 0.01)
                XCTAssertFalse(view.isAnimationPlaying)
                let image = UIGraphicsImageRenderer(size: view.bounds.size).image { view.layer.render(in: $0.cgContext) }
                XCTAssertNotNil(image.pngData())
                let attachment = XCTAttachment(image: image)
                attachment.name = "poster-\(theme.rawValue)-\(entry.id)"
                attachment.lifetime = .keepAlways
                add(attachment)
            }
        }
    }

    func testNativePlaybackPauseThemeAndPoster() async throws {
        let loader = ExerciseAnimationLoader()
        let entry = try XCTUnwrap(loader.catalog?.entry(for: "bodyweight-squat"))
        let light = try await loader.load(entry, theme: .light)
        let dark = try await loader.load(entry, theme: .dark)
        let scene = try XCTUnwrap(UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first)
        let previousKeyWindow = scene.windows.first(where: \.isKeyWindow)
        let window = UIWindow(windowScene: scene)
        window.frame = CGRect(x: 0, y: 0, width: 320, height: 500)
        let controller = UIViewController()
        window.rootViewController = controller
        window.makeKeyAndVisible()
        defer { window.isHidden = true; previousKeyWindow?.makeKey() }
        let host = ExerciseAnimationHost()
        host.frame = CGRect(x: 0, y: 0, width: 300, height: 300)
        controller.view.addSubview(host)
        func update(_ animation: LottieAnimation, _ theme: ExerciseAnimationTheme, _ mode: ExercisePlaybackMode) {
            host.update(animation: animation, key: "\(theme.rawValue)/\(entry.id)", exerciseID: entry.id, name: entry.name,
                        posterFrame: entry.posterFrame, mode: mode, speed: 1, theme: theme)
            host.layoutIfNeeded()
        }
        update(light, .light, .play)
        try await Task.sleep(for: .milliseconds(150))
        XCTAssertTrue(host.animationView.isAnimationPlaying)
        let first = host.animationView.realtimeAnimationFrame
        try await Task.sleep(for: .milliseconds(150))
        XCTAssertNotEqual(host.animationView.realtimeAnimationFrame, first)
        update(light, .light, .hold)
        let paused = host.animationView.currentFrame
        try await Task.sleep(for: .milliseconds(100))
        XCTAssertFalse(host.animationView.isAnimationPlaying)
        XCTAssertEqual(host.animationView.currentFrame, paused, accuracy: 0.01)
        update(dark, .dark, .hold)
        XCTAssertEqual(host.animationView.currentFrame, paused, accuracy: 0.1)
        update(dark, .dark, .poster)
        XCTAssertEqual(host.animationView.currentFrame, Double(entry.posterFrame), accuracy: 0.01)
        update(dark, .dark, .play)
        XCTAssertTrue(host.animationView.isAnimationPlaying)
        host.removeFromSuperview()
        XCTAssertFalse(host.animationView.isAnimationPlaying)
    }

    func testLoaderCacheReusesParsedResource() async throws {
        let loader = ExerciseAnimationLoader()
        let entry = try XCTUnwrap(loader.catalog?.entry(for: "bodyweight-squat"))
        let first = try await loader.load(entry, theme: .light)
        let second = try await loader.load(entry, theme: .light)
        XCTAssertTrue(first === second)
    }
}
