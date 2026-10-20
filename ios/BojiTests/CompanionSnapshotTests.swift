import Foundation
import XCTest
@testable import Boji

final class CompanionSnapshotTests: XCTestCase {
    func testDisabledSnapshotContainsNoProgress() throws {
        let progress = CompanionProgress(dayKey: "2026-10-20", trainingCompleted: true, waterLogged: true, sleepLogged: true, planTitle: "居家训练")
        let value = CompanionSnapshot(progress: progress, isSharingEnabled: false)
        XCTAssertEqual(value.completedCount, 0)
        XCTAssertEqual(value.planTitle, "")
        XCTAssertFalse(value.isCurrent())
    }

    func testRoundTripContainsOnlyMinimalFields() throws {
        let now = Date()
        let value = CompanionSnapshot(progress: CompanionProgress(dayKey: CompanionSnapshot.dayKey(for: now), trainingCompleted: true, waterLogged: true, sleepLogged: false, planTitle: "居家训练"), generatedAt: now)
        let data = try value.encoded()
        let decoded = try XCTUnwrap(CompanionSnapshot.decode(data))
        XCTAssertTrue(decoded.isCurrent(at: now))
        XCTAssertEqual(decoded.completedCount, 2)
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        XCTAssertEqual(Set(json.keys), Set(["schemaVersion", "generatedAt", "isSharingEnabled", "dayKey", "trainingCompleted", "waterLogged", "sleepLogged", "planTitle"]))
    }

    func testYesterdayAndFutureSnapshotsAreNotCurrent() {
        let now = Date()
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: now)!
        let old = CompanionSnapshot(progress: CompanionProgress(dayKey: CompanionSnapshot.dayKey(for: yesterday), trainingCompleted: true, waterLogged: true, sleepLogged: true, planTitle: "计划"), generatedAt: yesterday)
        XCTAssertFalse(old.isCurrent(at: now))
        let future = CompanionSnapshot(progress: CompanionProgress(dayKey: CompanionSnapshot.dayKey(for: now), trainingCompleted: true, waterLogged: true, sleepLogged: true, planTitle: "计划"), generatedAt: now.addingTimeInterval(3600))
        XCTAssertFalse(future.isCurrent(at: now))
    }

    func testRejectsUnsupportedOrOversizedData() throws {
        let value = CompanionSnapshot.disabled()
        var json = try XCTUnwrap(JSONSerialization.jsonObject(with: value.encoded()) as? [String: Any])
        json["schemaVersion"] = 99
        XCTAssertNil(CompanionSnapshot.decode(try JSONSerialization.data(withJSONObject: json)))
        XCTAssertNil(CompanionSnapshot.decode(Data(repeating: 65, count: 16_385)))
    }

    func testSubsecondUpdatesKeepTheirOrder() throws {
        let first = try XCTUnwrap(CompanionSnapshot.decode(CompanionSnapshot.disabled(at: Date(timeIntervalSince1970: 1_792_483_200.123)).encoded()))
        let second = try XCTUnwrap(CompanionSnapshot.decode(CompanionSnapshot.disabled(at: Date(timeIntervalSince1970: 1_792_483_200.124)).encoded()))
        XCTAssertGreaterThan(second.generatedAt, first.generatedAt)
    }

    func testAtomicStoreCanReplaceProgressWithDisabledSnapshot() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: directory) }
        let store = CompanionSnapshotStore(directory: directory)
        let now = Date()
        try store.save(CompanionSnapshot(progress: CompanionProgress(dayKey: CompanionSnapshot.dayKey(for: now), trainingCompleted: true, waterLogged: false, sleepLogged: false, planTitle: "居家训练"), generatedAt: now))
        XCTAssertEqual(store.load()?.completedCount, 1)
        try store.save(.disabled(at: now))
        XCTAssertEqual(store.load()?.isSharingEnabled, false)
        XCTAssertEqual(store.load()?.completedCount, 0)
    }

    func testDeepLinksOnlyAcceptKnownLocalDestinations() {
        for route in CompanionRoute.allCases { XCTAssertEqual(CompanionRoute(url: route.url), route) }
        for raw in ["https://example.com/training", "boji://unknown", "boji://training?token=secret", "boji://user@training", "boji://training/extra", "boji://training#fragment"] {
            XCTAssertNil(CompanionRoute(url: URL(string: raw)!))
        }
    }
}
