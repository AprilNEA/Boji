import Foundation
import XCTest
@testable import Boji

final class ExerciseAnimationCatalogTests: XCTestCase {
    func testCatalogAcceptsOptionalAndUnknownCourse() throws {
        var withoutCourse = entry(id: "without-course")
        withoutCourse.removeValue(forKey: "course")
        var futureCourse = entry(id: "future-course", course: "future-program")
        futureCourse["futureMetadata"] = ["version": 2]

        let catalog = try ExerciseAnimationCatalog(
            data: try data(for: [withoutCourse, futureCourse])
        )

        XCTAssertNil(catalog.entry(for: "without-course")?.course)
        XCTAssertEqual(catalog.entry(for: "future-course")?.course, "future-program")
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
        XCTAssertThrowsError(
            try ExerciseAnimationCatalog(
                data: try data(for: [entry(), entry()])
            )
        ) { error in
            XCTAssertEqual(error as? ExerciseAnimationCatalogError, .duplicateID("valid-id"))
        }
    }

    func testCatalogRejectsInvalidID() throws {
        XCTAssertThrowsError(try ExerciseAnimationCatalog(data: try data(for: [entry(id: "Invalid_ID")]))) {
            error in
            XCTAssertEqual(error as? ExerciseAnimationCatalogError, .invalidID("Invalid_ID"))
        }
    }

    func testCatalogRejectsInvalidTimingAndFrameValues() throws {
        var invalidSeconds = entry()
        invalidSeconds["seconds"] = 0
        assertCatalogError(
            for: invalidSeconds,
            expected: .invalidSeconds(id: "valid-id")
        )

        var invalidFrames = entry()
        invalidFrames["frames"] = 0
        assertCatalogError(
            for: invalidFrames,
            expected: .invalidFrameCount(id: "valid-id")
        )

        var invalidFPS = entry()
        invalidFPS["fps"] = 0
        assertCatalogError(
            for: invalidFPS,
            expected: .invalidFramesPerSecond(id: "valid-id")
        )
    }

    func testCatalogRejectsNonFiniteTimingValues() throws {
        let invalidSeconds = """
        [{
          "id": "valid-id", "name": "Test", "seconds": 1e400,
          "frames": 60, "posterFrame": 30, "fps": 60,
          "muscles": [],
          "files": { "light": "light/valid-id.json", "dark": "dark/valid-id.json" }
        }]
        """.data(using: .utf8)!
        let invalidFPS = """
        [{
          "id": "valid-id", "name": "Test", "seconds": 1,
          "frames": 60, "posterFrame": 30, "fps": 1e400,
          "muscles": [],
          "files": { "light": "light/valid-id.json", "dark": "dark/valid-id.json" }
        }]
        """.data(using: .utf8)!

        XCTAssertThrowsError(try ExerciseAnimationCatalog(data: invalidSeconds))
        XCTAssertThrowsError(try ExerciseAnimationCatalog(data: invalidFPS))
    }

    func testCatalogRejectsPosterFrameOutsideAnimationRange() throws {
        var negativePoster = entry()
        negativePoster["posterFrame"] = -1
        assertCatalogError(
            for: negativePoster,
            expected: .invalidPosterFrame(id: "valid-id")
        )

        var terminalPoster = entry()
        terminalPoster["posterFrame"] = 60
        assertCatalogError(
            for: terminalPoster,
            expected: .invalidPosterFrame(id: "valid-id")
        )
    }

    func testCatalogRequiresPosterFrame() throws {
        var missingPoster = entry()
        missingPoster.removeValue(forKey: "posterFrame")

        XCTAssertThrowsError(try ExerciseAnimationCatalog(data: try data(for: [missingPoster])))
    }

    func testCatalogRejectsTraversalAndExternalResourcePaths() throws {
        var traversalPath = entry()
        traversalPath["files"] = [
            "light": "light/../valid-id.json",
            "dark": "dark/valid-id.json"
        ]
        assertCatalogError(
            for: traversalPath,
            expected: .invalidResourcePath(id: "valid-id", theme: .light)
        )

        var externalPath = entry()
        externalPath["files"] = [
            "light": "light/valid-id.json",
            "dark": "https://example.com/valid-id.json"
        ]
        assertCatalogError(
            for: externalPath,
            expected: .invalidResourcePath(id: "valid-id", theme: .dark)
        )
    }

    func testPlaybackModeHonorsAllPrecedenceRules() {
        for reduceMotion in [false, true] {
            for showsPoster in [false, true] {
                for isVisible in [false, true] {
                    for isSceneActive in [false, true] {
                        for wantsToPlay in [false, true] {
                            let expected: ExercisePlaybackMode
                            if reduceMotion || showsPoster {
                                expected = .poster
                            } else if isVisible && isSceneActive && wantsToPlay {
                                expected = .play
                            } else {
                                expected = .hold
                            }

                            XCTAssertEqual(
                                ExercisePlaybackMode.resolve(
                                    reduceMotion: reduceMotion,
                                    isVisible: isVisible,
                                    isSceneActive: isSceneActive,
                                    wantsToPlay: wantsToPlay,
                                    showsPoster: showsPoster
                                ),
                                expected
                            )
                        }
                    }
                }
            }
        }
    }

    private func assertCatalogError(
        for entry: [String: Any],
        expected: ExerciseAnimationCatalogError,
        file: StaticString = #filePath,
        line: UInt = #line
    ) {
        XCTAssertThrowsError(
            try ExerciseAnimationCatalog(data: try data(for: [entry])),
            file: file,
            line: line
        ) { error in
            XCTAssertEqual(error as? ExerciseAnimationCatalogError, expected, file: file, line: line)
        }
    }

    private func entry(
        id: String = "valid-id",
        course: String? = "home-beginner"
    ) -> [String: Any] {
        var value: [String: Any] = [
            "id": id,
            "name": "\(id) name",
            "seconds": 1.0,
            "frames": 60,
            "posterFrame": 30,
            "fps": 60.0,
            "muscles": [["key": "quads", "name": "股四头肌"]],
            "files": [
                "light": "light/\(id).json",
                "dark": "dark/\(id).json"
            ]
        ]
        if let course {
            value["course"] = course
        }
        return value
    }

    private func data(for entries: [[String: Any]]) throws -> Data {
        try JSONSerialization.data(withJSONObject: entries)
    }
}
