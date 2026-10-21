import Foundation
import XCTest
@testable import Boji

@MainActor
final class BojiStoreTests: XCTestCase {
    func testPersistenceReloadsState() async throws {
        let directory = try makeTemporaryDirectory()
        defer { try? FileManager.default.removeItem(at: directory) }
        let url = directory.appendingPathComponent("state.json")

        let firstStore = BojiStore(storageURL: url)
        firstStore.selectedPlan = .gym
        firstStore.hasOnboarded = true
        firstStore.displayName = "小博"
        firstStore.joinedChallenge = true
        firstStore.addWater(600)
        firstStore.setSleep(7.5)
        firstStore.completeWorkout(WorkoutLibrary.gym)
        firstStore.addBodyEntry(weight: 68.2, waist: 78.0)
        await firstStore.flush()

        let reloadedStore = BojiStore(storageURL: url)

        XCTAssertNil(reloadedStore.storageError)
        XCTAssertEqual(reloadedStore.selectedPlan, .gym)
        XCTAssertTrue(reloadedStore.hasOnboarded)
        XCTAssertEqual(reloadedStore.displayName, "小博")
        XCTAssertTrue(reloadedStore.joinedChallenge)
        XCTAssertEqual(reloadedStore.today.waterML, 600)
        XCTAssertEqual(reloadedStore.today.sleepHours, 7.5)
        XCTAssertEqual(reloadedStore.totalWorkouts, 1)
        XCTAssertEqual(reloadedStore.today.minutes, WorkoutLibrary.gym.minutes)
        XCTAssertEqual(reloadedStore.bodyEntries.count, 1)
    }

    func testCompletingSameWorkoutIsIdempotent() {
        let store = BojiStore(inMemory: true)

        store.completeWorkout(WorkoutLibrary.home)
        store.completeWorkout(WorkoutLibrary.home)

        XCTAssertEqual(store.today.completedWorkoutIDs, [WorkoutLibrary.home.id])
        XCTAssertEqual(store.today.minutes, WorkoutLibrary.home.minutes)
        XCTAssertEqual(store.totalWorkouts, 1)
        XCTAssertEqual(store.activeDays, 1)
    }

    func testInputValidationRejectsInvalidValues() {
        let store = BojiStore(inMemory: true)

        store.addWater(500)
        store.addWater(-900)
        XCTAssertEqual(store.today.waterML, 0)

        store.addWater(100_001)
        XCTAssertEqual(store.today.waterML, 0)

        store.setSleep(8)
        store.setSleep(16.1)
        store.setSleep(.nan)
        XCTAssertEqual(store.today.sleepHours, 8)

        store.addBodyEntry(weight: 65, waist: 75)
        store.addBodyEntry(weight: 29.9, waist: 75)
        store.addBodyEntry(weight: 65, waist: 250.1)
        store.addBodyEntry(weight: .infinity, waist: 75)
        XCTAssertEqual(store.bodyEntries.count, 1)
    }

    func testExportJSONContainsState() throws {
        let store = BojiStore(inMemory: true)
        store.displayName = "导出测试"
        store.addWater(300)

        let data = try store.exportJSON()
        let object = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])

        XCTAssertEqual(object["displayName"] as? String, "导出测试")
        XCTAssertEqual(object["selectedPlan"] as? String, PlanKind.home.rawValue)
        XCTAssertEqual((object["records"] as? [[String: Any]])?.count, 1)
    }

    func testResetAllRestoresEmptyDefaults() {
        let store = BojiStore(inMemory: true)
        store.selectedPlan = .gym
        store.hasOnboarded = true
        store.displayName = "需要重置"
        store.joinedChallenge = true
        store.addWater(250)
        store.addBodyEntry(weight: 70, waist: 80)

        store.resetAll()

        XCTAssertEqual(store.selectedPlan, .home)
        XCTAssertFalse(store.hasOnboarded)
        XCTAssertEqual(store.displayName, String(localized: .Shared.defaultDisplayName))
        XCTAssertFalse(store.joinedChallenge)
        XCTAssertTrue(store.records.isEmpty)
        XCTAssertTrue(store.bodyEntries.isEmpty)
        XCTAssertEqual(store.today.waterML, 0)
    }

    func testCorruptFileIsNotOverwritten() async throws {
        let directory = try makeTemporaryDirectory()
        defer { try? FileManager.default.removeItem(at: directory) }
        let url = directory.appendingPathComponent("state.json")
        let corruptData = Data("not valid JSON".utf8)
        try corruptData.write(to: url)

        let store = BojiStore(storageURL: url)
        XCTAssertNotNil(store.storageError)

        store.displayName = "不应写入"
        store.addWater(500)
        await store.flush()

        XCTAssertEqual(try Data(contentsOf: url), corruptData)
        XCTAssertNotNil(store.storageError)
    }

    func testExplicitResetClearsCorruptFile() async throws {
        let directory = try makeTemporaryDirectory()
        defer { try? FileManager.default.removeItem(at: directory) }
        let url = directory.appendingPathComponent("state.json")
        try Data("private corrupted data".utf8).write(to: url)
        let store = BojiStore(storageURL: url)
        store.resetAll()
        await store.flush()
        let reloaded = BojiStore(storageURL: url)
        XCTAssertNil(reloaded.storageError)
        XCTAssertTrue(reloaded.records.isEmpty)
        XCTAssertEqual(reloaded.displayName, String(localized: .Shared.defaultDisplayName))
    }

    func testHabitDaysAndRollingWeek() {
        let store = BojiStore(inMemory: true)
        XCTAssertEqual(store.weekRecords.count, 7)
        XCTAssertEqual(store.activeDays, 0)
        store.addWater(250)
        XCTAssertEqual(store.activeDays, 1)
        store.setSleep(7)
        XCTAssertEqual(store.activeDays, 1)
        XCTAssertEqual(store.weekRecords.last?.waterML, 250)
    }

    func testDeletingBodyEntry() throws {
        let store = BojiStore(inMemory: true)
        store.addBodyEntry(weight: 70, waist: 80)
        let id = try XCTUnwrap(store.bodyEntries.first?.id)
        store.deleteBodyEntry(id: id)
        XCTAssertTrue(store.bodyEntries.isEmpty)
    }

    func testLoadingSortsBodyEntriesByDate() throws {
        let directory = try makeTemporaryDirectory()
        defer { try? FileManager.default.removeItem(at: directory) }
        let url = directory.appendingPathComponent("state.json")
        let json = """
        {
          "selectedPlan": "home", "hasOnboarded": true, "displayName": "排序", "joinedChallenge": false, "records": [],
          "bodyEntries": [
            { "id": "00000000-0000-0000-0000-000000000002", "date": "2026-02-01T00:00:00Z", "weight": 66, "waist": 76 },
            { "id": "00000000-0000-0000-0000-000000000001", "date": "2026-01-01T00:00:00Z", "weight": 67, "waist": 77 }
          ]
        }
        """
        try Data(json.utf8).write(to: url)

        let store = BojiStore(storageURL: url)

        XCTAssertNil(store.storageError)
        XCTAssertEqual(store.bodyEntries.map(\.weight), [67, 66])
    }

    private func makeTemporaryDirectory() throws -> URL {
        let directory = FileManager.default.temporaryDirectory
            .appendingPathComponent("BojiStoreTests-\(UUID().uuidString)", isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory
    }
}
