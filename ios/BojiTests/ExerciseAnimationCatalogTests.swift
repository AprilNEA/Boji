import CryptoKit
import Foundation
import XCTest
@testable import Boji

final class ExerciseAnimationCatalogTests: XCTestCase {
    func testCatalogAcceptsOptionalAndUnknownCourse() throws {
        var withoutCourse = entry(id: "without-course")
        withoutCourse.removeValue(forKey: "course")
        var futureCourse = entry(id: "future-course", course: "future-program")
        futureCourse["futureMetadata"] = ["version": 2]

        let catalog = try ExerciseAnimationCatalog(data: try data(for: [withoutCourse, futureCourse]))

        XCTAssertNil(catalog.entry(for: "without-course")?.course)
        XCTAssertEqual(catalog.entry(for: "future-course")?.course, "future-program")
    }

    func testRemoteCatalogDiscardsBadHashesAndIgnoresUnknownFields() throws {
        let valid = entry(id: "valid-remote")
        var missingHash = entry(id: "missing-hash")
        missingHash.removeValue(forKey: "sha256")
        var uppercaseHash = entry(id: "uppercase-hash")
        uppercaseHash["sha256"] = ["light": String(repeating: "A", count: 64), "dark": String(repeating: "b", count: 64)]
        var unknownFields = entry(id: "unknown-fields")
        unknownFields["futureMetadata"] = ["revision": 2]

        let catalog = try ExerciseAnimationCatalog(
            remoteData: try data(for: [valid, missingHash, uppercaseHash, unknownFields])
        )

        XCTAssertEqual(catalog.entries.map(\.id), ["valid-remote", "unknown-fields"])
    }

    func testResourcePathSelectsThemeSpecificFile() throws {
        let catalog = try ExerciseAnimationCatalog(data: try data(for: [entry()]))
        let descriptor = try XCTUnwrap(catalog.entry(for: "valid-id"))

        XCTAssertEqual(descriptor.resourcePath(for: .light), "light/valid-id.json")
        XCTAssertEqual(descriptor.resourcePath(for: .dark), "dark/valid-id.json")
    }

    func testEntryLookupUsesIDInsteadOfEntryOrder() throws {
        let catalog = try ExerciseAnimationCatalog(
            data: try data(for: [entry(id: "second-id"), entry(id: "first-id")])
        )

        XCTAssertEqual(catalog.entry(for: "first-id")?.name, "first-id name")
        XCTAssertEqual(catalog.entry(for: "second-id")?.name, "second-id name")
        XCTAssertNil(catalog.entry(for: "missing-id"))
    }

    func testCatalogRejectsDuplicateIDs() throws {
        XCTAssertThrowsError(try ExerciseAnimationCatalog(data: try data(for: [entry(), entry()]))) { error in
            XCTAssertEqual(error as? ExerciseAnimationCatalogError, .duplicateID("valid-id"))
        }
    }

    func testCatalogRejectsInvalidIDAndCourses() throws {
        XCTAssertThrowsError(try ExerciseAnimationCatalog(data: try data(for: [entry(id: "Invalid_ID")]))) { error in
            XCTAssertEqual(error as? ExerciseAnimationCatalogError, .invalidID("Invalid_ID"))
        }
        var noCourses = entry()
        noCourses["courses"] = []
        assertCatalogError(for: noCourses, expected: .invalidCourses(id: "valid-id"))
    }

    func testCatalogRejectsInvalidTimingAndFrameValues() throws {
        var invalidSeconds = entry(); invalidSeconds["seconds"] = 0
        assertCatalogError(for: invalidSeconds, expected: .invalidSeconds(id: "valid-id"))
        var invalidFrames = entry(); invalidFrames["frames"] = 0
        assertCatalogError(for: invalidFrames, expected: .invalidFrameCount(id: "valid-id"))
        var invalidFPS = entry(); invalidFPS["fps"] = 0
        assertCatalogError(for: invalidFPS, expected: .invalidFramesPerSecond(id: "valid-id"))
    }

    func testCatalogRejectsNonFiniteTimingValues() throws {
        let invalidSeconds = """
        [{"id":"valid-id","name":"Test","course":"home-beginner","courses":["home-beginner"],"seconds":1e400,"frames":60,"posterFrame":30,"fps":60,"muscles":[],"files":{"light":"light/valid-id.json","dark":"dark/valid-id.json"},"sha256":{"light":"\(String(repeating: "a", count: 64))","dark":"\(String(repeating: "b", count: 64))"}}]
        """.data(using: .utf8)!
        let invalidFPS = """
        [{"id":"valid-id","name":"Test","course":"home-beginner","courses":["home-beginner"],"seconds":1,"frames":60,"posterFrame":30,"fps":1e400,"muscles":[],"files":{"light":"light/valid-id.json","dark":"dark/valid-id.json"},"sha256":{"light":"\(String(repeating: "a", count: 64))","dark":"\(String(repeating: "b", count: 64))"}}]
        """.data(using: .utf8)!

        XCTAssertThrowsError(try ExerciseAnimationCatalog(data: invalidSeconds))
        XCTAssertThrowsError(try ExerciseAnimationCatalog(data: invalidFPS))
    }

    func testCatalogRejectsPosterPathsAndHashes() throws {
        var negativePoster = entry(); negativePoster["posterFrame"] = -1
        assertCatalogError(for: negativePoster, expected: .invalidPosterFrame(id: "valid-id"))
        var terminalPoster = entry(); terminalPoster["posterFrame"] = 60
        assertCatalogError(for: terminalPoster, expected: .invalidPosterFrame(id: "valid-id"))
        var traversalPath = entry(); traversalPath["files"] = ["light": "light/../valid-id.json", "dark": "dark/valid-id.json"]
        assertCatalogError(for: traversalPath, expected: .invalidResourcePath(id: "valid-id", theme: .light))
        var shortHash = entry(); shortHash["sha256"] = ["light": "abc", "dark": String(repeating: "b", count: 64)]
        assertCatalogError(for: shortHash, expected: .invalidSHA256(id: "valid-id", theme: .light))
    }

    func testPlaybackModeHonorsAllPrecedenceRules() {
        for reduceMotion in [false, true] {
            for showsPoster in [false, true] {
                for isVisible in [false, true] {
                    for isSceneActive in [false, true] {
                        for wantsToPlay in [false, true] {
                            let expected: ExercisePlaybackMode
                            if reduceMotion || showsPoster { expected = .poster }
                            else if isVisible && isSceneActive && wantsToPlay { expected = .play }
                            else { expected = .hold }
                            XCTAssertEqual(ExercisePlaybackMode.resolve(
                                reduceMotion: reduceMotion, isVisible: isVisible,
                                isSceneActive: isSceneActive, wantsToPlay: wantsToPlay,
                                showsPoster: showsPoster
                            ), expected)
                        }
                    }
                }
            }
        }
    }

    func testBundledCourseNeverHitsRemoteTransport() async throws {
        let transport = RecordingTransport(indexResponses: [])
        let store = ExerciseAnimationRemoteStore(
            transport: transport,
            cacheDirectory: try temporaryDirectory(),
            bundledExerciseIDs: Set(WorkoutLibrary.home.exercises.map(\.id))
        )

        let result = await store.prefetch(WorkoutLibrary.home)
        let requestCount = await transport.requestCount()
        XCTAssertEqual(result, .notRequired)
        XCTAssertEqual(requestCount, 0)
    }

    func testHashMismatchIsDiscarded() async throws {
        let directory = try temporaryDirectory()
        let light = try fixtureData(named: "light")
        let dark = try fixtureData(named: "dark")
        let index = try fixtureIndex(light: light, dark: dark, lightHash: String(repeating: "0", count: 64))
        let transport = RecordingTransport(indexResponses: [.success(index, "v1")], light: light, dark: dark)
        let store = ExerciseAnimationRemoteStore(transport: transport, cacheDirectory: directory, bundledExerciseIDs: [])

        let result = await store.prefetch(fixtureWorkout())
        XCTAssertEqual(result, .unavailable)
        XCTAssertTrue((try FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil)).contains {
            $0.lastPathComponent == "index.json"
        })
        // Each file is checked on its own. The light file fails, and the valid dark file stays in the cache.
        let cached = (try? FileManager.default.contentsOfDirectory(
            atPath: directory.appendingPathComponent("remote-exercise").path
        )) ?? []
        XCTAssertFalse(cached.contains { $0.hasPrefix("light-") })
        XCTAssertTrue(cached.contains { $0.hasPrefix("dark-") })
    }

    func testETag304AndOfflineReuseStoredIndexAndCache() async throws {
        let directory = try temporaryDirectory()
        let light = try fixtureData(named: "light")
        let dark = try fixtureData(named: "dark")
        let index = try fixtureIndex(light: light, dark: dark)
        let firstTransport = RecordingTransport(indexResponses: [.success(index, "v1")], light: light, dark: dark)
        let first = ExerciseAnimationRemoteStore(transport: firstTransport, cacheDirectory: directory, bundledExerciseIDs: [])
        let firstResult = await first.prefetch(fixtureWorkout())
        XCTAssertEqual(firstResult, .available)

        let revalidate = RecordingTransport(indexResponses: [.notModified], light: light, dark: dark)
        let second = ExerciseAnimationRemoteStore(transport: revalidate, cacheDirectory: directory, bundledExerciseIDs: [])
        let revalidateResult = await second.prefetch(fixtureWorkout())
        let etags = await revalidate.indexETags()
        XCTAssertEqual(revalidateResult, .available)
        XCTAssertEqual(etags, ["v1"])

        let offline = RecordingTransport(indexResponses: [.offline], light: light, dark: dark)
        let third = ExerciseAnimationRemoteStore(transport: offline, cacheDirectory: directory, bundledExerciseIDs: [])
        let offlineResult = await third.prefetch(fixtureWorkout())
        let offlineRequests = await offline.requestCount()
        XCTAssertEqual(offlineResult, .available)
        XCTAssertEqual(offlineRequests, 1)
    }

    func testCacheReplacesOldHashAfterNewIndex() async throws {
        let directory = try temporaryDirectory()
        let light = try fixtureData(named: "light")
        let dark = try fixtureData(named: "dark")
        let oldIndex = try fixtureIndex(light: light, dark: dark)
        let firstTransport = RecordingTransport(indexResponses: [.success(oldIndex, "v1")], light: light, dark: dark)
        let first = ExerciseAnimationRemoteStore(transport: firstTransport, cacheDirectory: directory, bundledExerciseIDs: [])
        let firstResult = await first.prefetch(fixtureWorkout())
        XCTAssertEqual(firstResult, .available)

        let replacementData = dark
        let newIndex = try fixtureIndex(light: replacementData, dark: replacementData)
        let secondTransport = RecordingTransport(indexResponses: [.success(newIndex, "v2")], light: replacementData, dark: replacementData)
        let second = ExerciseAnimationRemoteStore(transport: secondTransport, cacheDirectory: directory, bundledExerciseIDs: [])
        let secondResult = await second.prefetch(fixtureWorkout())
        XCTAssertEqual(secondResult, .available)

        let exerciseDirectory = directory.appendingPathComponent("remote-exercise")
        let files = try FileManager.default.contentsOfDirectory(at: exerciseDirectory, includingPropertiesForKeys: nil)
        XCTAssertEqual(files.filter { $0.lastPathComponent.hasPrefix("light-") }.count, 1)
        XCTAssertEqual(files.filter { $0.lastPathComponent.hasPrefix("dark-") }.count, 1)
    }

    private func assertCatalogError(
        for entry: [String: Any], expected: ExerciseAnimationCatalogError,
        file: StaticString = #filePath, line: UInt = #line
    ) {
        XCTAssertThrowsError(try ExerciseAnimationCatalog(data: try data(for: [entry])), file: file, line: line) {
            XCTAssertEqual($0 as? ExerciseAnimationCatalogError, expected, file: file, line: line)
        }
    }

    private func entry(id: String = "valid-id", course: String? = "home-beginner") -> [String: Any] {
        var value: [String: Any] = [
            "id": id, "name": "\(id) name", "courses": [course ?? "home-beginner"],
            "seconds": 1.0, "frames": 60, "posterFrame": 30, "fps": 60.0,
            "muscles": [["key": "quads", "name": "股四头肌"]],
            "files": ["light": "light/\(id).json", "dark": "dark/\(id).json"],
            "sha256": ["light": String(repeating: "a", count: 64), "dark": String(repeating: "b", count: 64)]
        ]
        if let course { value["course"] = course }
        return value
    }

    private func data(for entries: [[String: Any]]) throws -> Data {
        try JSONSerialization.data(withJSONObject: entries)
    }

    private func temporaryDirectory() throws -> URL {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        addTeardownBlock { try? FileManager.default.removeItem(at: directory) }
        return directory
    }

    private func fixtureData(named name: String) throws -> Data {
        let ios = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
        return try Data(contentsOf: ios.appendingPathComponent("Boji/DebugSupport/Fixtures/\(name).json"))
    }

    private func fixtureIndex(light: Data, dark: Data, lightHash: String? = nil) throws -> Data {
        let ios = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent()
        let source = try Data(contentsOf: ios.appendingPathComponent("Boji/DebugSupport/Fixtures/index.json"))
        var value = try XCTUnwrap(JSONSerialization.jsonObject(with: source) as? [[String: Any]]).first!
        value["id"] = "remote-exercise"
        value["course"] = "remote-course"
        value["courses"] = ["remote-course"]
        value["files"] = ["light": "light/remote-exercise.json", "dark": "dark/remote-exercise.json"]
        value["sha256"] = ["light": lightHash ?? hash(light), "dark": hash(dark)]
        return try data(for: [value])
    }

    private func fixtureWorkout() -> Workout {
        Workout(id: "remote-course", title: "Remote", subtitle: "", minutes: 1, level: "", group: .home,
                exercises: [Exercise(id: "remote-exercise", name: "Remote", sets: 1, reps: .count(1), tip: "", symbol: "figure.walk")])
    }

    private func hash(_ data: Data) -> String {
        SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
    }
}

private actor RecordingTransport: ExerciseAnimationTransport {
    enum IndexResponse: Sendable {
        case success(Data, String)
        case notModified
        case offline
    }

    private var responses: [IndexResponse]
    private let light: Data
    private let dark: Data
    private var requests: [URLRequest] = []

    init(indexResponses: [IndexResponse], light: Data = Data(), dark: Data = Data()) {
        responses = indexResponses
        self.light = light
        self.dark = dark
    }

    func send(_ request: URLRequest) async throws -> ExerciseAnimationHTTPResponse {
        requests.append(request)
        guard let path = request.url?.path else { throw URLError(.badURL) }
        if path.hasSuffix("/index.json") {
            guard !responses.isEmpty else { throw URLError(.notConnectedToInternet) }
            switch responses.removeFirst() {
            case .success(let data, let etag):
                return ExerciseAnimationHTTPResponse(data: data, statusCode: 200, etag: etag)
            case .notModified:
                return ExerciseAnimationHTTPResponse(data: Data(), statusCode: 304, etag: nil)
            case .offline:
                throw URLError(.notConnectedToInternet)
            }
        }
        return ExerciseAnimationHTTPResponse(data: path.contains("/light/") ? light : dark, statusCode: 200, etag: nil)
    }

    func requestCount() -> Int { requests.count }
    func indexETags() -> [String?] {
        requests.filter { $0.url?.path.hasSuffix("/index.json") == true }
            .map { $0.value(forHTTPHeaderField: "If-None-Match") }
    }
}
