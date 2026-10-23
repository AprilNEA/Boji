import Foundation
import XCTest
@testable import Boji

@MainActor
final class HealthWriteStoreTests: XCTestCase {
    func testEnableRequestsWriteAuthorizationAndPersistsTheSwitch() async {
        let writer = StubHealthDataWriter()
        let preferences = TestWritePreferences()
        let store = HealthWriteStore(writer: writer, preferences: preferences)
        XCTAssertFalse(store.isEnabled)

        await store.enable().value

        XCTAssertTrue(store.isEnabled)
        XCTAssertEqual(writer.authorizationRequestCount, 1)
        XCTAssertEqual(store.status, .allAuthorized)
        XCTAssertNil(store.errorMessage)
        XCTAssertTrue(HealthWriteStore(writer: writer, preferences: preferences).isEnabled)
    }

    func testEnableStaysOffWhenEveryTypeIsDenied() async {
        let writer = StubHealthDataWriter()
        writer.statusAfterRequest = HealthWriteStatus(workout: .denied, weight: .denied, waist: .denied)
        let preferences = TestWritePreferences()
        let store = HealthWriteStore(writer: writer, preferences: preferences)

        await store.enable().value

        XCTAssertFalse(store.isEnabled)
        XCTAssertNotNil(store.errorMessage)
        XCTAssertFalse(HealthWriteStore(writer: writer, preferences: preferences).isEnabled)
    }

    func testUnavailableWriterDoesNotRequestAuthorization() async {
        let writer = StubHealthDataWriter(isAvailable: false)
        let store = HealthWriteStore(writer: writer, preferences: TestWritePreferences())

        await store.enable().value

        XCTAssertFalse(store.isEnabled)
        XCTAssertEqual(writer.authorizationRequestCount, 0)
        XCTAssertNotNil(store.errorMessage)
    }

    func testRecordsAreIgnoredWhileWritingIsOff() async {
        let writer = StubHealthDataWriter()
        let storage = TestQueueStorage()
        let store = HealthWriteStore(writer: writer, preferences: TestWritePreferences(), queueStorage: storage)

        await store.record(bodyEntry()).value
        await store.record(workout()).value
        await store.removeBodyEntry(id: UUID()).value

        XCTAssertTrue(writer.calls.isEmpty)
        XCTAssertTrue(storage.items.isEmpty)
    }

    func testWritesRunInCallOrder() async {
        let writer = StubHealthDataWriter()
        writer.delayNanoseconds = 50_000_000
        let store = await enabledStore(writer: writer)
        let entry = bodyEntry()
        let session = workout()

        store.record(entry)
        store.record(session)
        await store.removeBodyEntry(id: entry.id).value

        XCTAssertEqual(writer.calls, [.saveBody(entry.id, version: 1), .saveWorkout(session.id, version: 1), .deleteBody(entry.id)])
    }

    func testWriteIsStoredBeforeItRunsAndRemovedAfterItSucceeds() async {
        let writer = StubHealthDataWriter()
        let storage = TestQueueStorage()
        let store = await enabledStore(writer: writer, storage: storage)
        let entry = bodyEntry()
        let observed = StoredQueueObservation()
        writer.onWrite = { @MainActor in observed.items = storage.items }

        await store.record(entry).value

        XCTAssertEqual(observed.items.map(\.write), [.body(entry)])
        XCTAssertEqual(observed.items.map(\.attempts), [1])
        XCTAssertTrue(storage.items.isEmpty)
        XCTAssertTrue(store.pending.isEmpty)
    }

    func testFailedWriteWaitsForRetryWithAHigherSyncVersion() async {
        let writer = StubHealthDataWriter()
        let storage = TestQueueStorage()
        let store = await enabledStore(writer: writer, storage: storage)
        let entry = bodyEntry()

        writer.failureMessage = "health data unavailable"
        await store.record(entry).value
        XCTAssertEqual(store.pending.map(\.write), [.body(entry)])
        XCTAssertEqual(store.pendingCount, 1)
        XCTAssertEqual(storage.items.map(\.attempts), [1])
        XCTAssertTrue(store.errorMessage?.contains("health data unavailable") == true)

        writer.failureMessage = nil
        await store.retryPending().value

        XCTAssertTrue(store.pending.isEmpty)
        XCTAssertTrue(storage.items.isEmpty)
        XCTAssertNil(store.errorMessage)
        XCTAssertEqual(writer.calls, [.saveBody(entry.id, version: 1), .saveBody(entry.id, version: 2)])
    }

    func testQueuedWriteRunsAgainAfterTheAppQuits() async {
        let preferences = TestWritePreferences()
        let storage = TestQueueStorage()
        let firstWriter = StubHealthDataWriter()
        let first = await enabledStore(writer: firstWriter, preferences: preferences, storage: storage)
        let session = workout()
        // The app quits during the write: the attempt is on disk, and the write never reports back.
        firstWriter.failureMessage = "app quit"
        await first.record(session).value

        let secondWriter = StubHealthDataWriter()
        let second = HealthWriteStore(writer: secondWriter, preferences: preferences, queueStorage: storage)
        XCTAssertTrue(second.isEnabled)
        XCTAssertEqual(second.pendingCount, 1)

        await second.retryPending().value

        XCTAssertEqual(secondWriter.calls, [.saveWorkout(session.id, version: 2)])
        XCTAssertTrue(storage.items.isEmpty)
    }

    func testUnreadableQueueIsKeptUntilTheAppCanReadIt() async {
        let preferences = TestWritePreferences()
        preferences.set(true, forKey: "Boji.HealthWriteStore.isEnabled")
        let storedEntry = bodyEntry()
        let storage = TestQueueStorage()
        storage.items = [QueuedHealthWrite(write: .body(storedEntry), attempts: 1)]
        storage.isReadable = false
        let writer = StubHealthDataWriter()
        let store = HealthWriteStore(writer: writer, preferences: preferences, queueStorage: storage)
        XCTAssertTrue(store.pending.isEmpty)

        let newEntry = bodyEntry()
        await store.record(newEntry).value

        XCTAssertEqual(writer.calls, [.saveBody(newEntry.id, version: 1)])
        XCTAssertEqual(storage.saveCount, 0)
        XCTAssertEqual(storage.items.map(\.write), [.body(storedEntry)])

        storage.isReadable = true
        await store.retryPending().value

        XCTAssertEqual(writer.calls, [.saveBody(newEntry.id, version: 1), .saveBody(storedEntry.id, version: 2)])
        XCTAssertTrue(storage.items.isEmpty)
    }

    func testDeletingAnEntryDropsItsQueuedSave() async {
        let writer = StubHealthDataWriter()
        let storage = TestQueueStorage()
        let store = await enabledStore(writer: writer, storage: storage)
        let entry = bodyEntry()

        writer.failureMessage = "health data unavailable"
        await store.record(entry).value
        writer.failureMessage = nil
        await store.removeBodyEntry(id: entry.id).value
        await store.retryPending().value

        XCTAssertTrue(store.pending.isEmpty)
        XCTAssertTrue(storage.items.isEmpty)
        XCTAssertEqual(writer.calls, [.saveBody(entry.id, version: 1), .deleteBody(entry.id)])
    }

    func testPendingQueueIsBounded() async {
        let writer = StubHealthDataWriter()
        let storage = TestQueueStorage()
        let store = await enabledStore(writer: writer, storage: storage)
        writer.failureMessage = "health data unavailable"

        for _ in 0..<(HealthWriteStore.pendingLimit + 5) {
            store.record(bodyEntry())
        }
        await store.retryPending().value

        XCTAssertEqual(store.pendingCount, HealthWriteStore.pendingLimit)
        XCTAssertEqual(storage.items.count, HealthWriteStore.pendingLimit)
    }

    func testWriteLeavesTheQueueAfterTheAttemptLimit() async {
        let writer = StubHealthDataWriter()
        let storage = TestQueueStorage()
        let store = await enabledStore(writer: writer, storage: storage)
        let entry = bodyEntry()
        writer.failureMessage = "invalid argument"

        await store.record(entry).value
        for _ in 1..<HealthWriteStore.attemptLimit {
            XCTAssertEqual(store.pendingCount, 1)
            await store.retryPending().value
        }

        XCTAssertTrue(store.pending.isEmpty)
        XCTAssertTrue(storage.items.isEmpty)
        XCTAssertEqual(writer.calls.count, HealthWriteStore.attemptLimit)
        XCTAssertEqual(writer.calls.last, .saveBody(entry.id, version: HealthWriteStore.attemptLimit))
        XCTAssertNotNil(store.errorMessage)
    }

    func testDisableKeepsSavedDataWhenTheUserChoosesToKeepIt() async {
        let writer = StubHealthDataWriter()
        let preferences = TestWritePreferences()
        let store = await enabledStore(writer: writer, preferences: preferences)

        await store.disable(deletingSavedData: false).value

        XCTAssertFalse(store.isEnabled)
        XCTAssertFalse(writer.calls.contains(.deleteAll))
        XCTAssertFalse(HealthWriteStore(writer: writer, preferences: preferences).isEnabled)
    }

    func testDisableDeletesSavedDataWhenTheUserChoosesToDeleteIt() async {
        let writer = StubHealthDataWriter()
        let store = await enabledStore(writer: writer)

        await store.disable(deletingSavedData: true).value

        XCTAssertFalse(store.isEnabled)
        XCTAssertEqual(writer.calls, [.deleteAll])
    }

    func testDisableSkipsQueuedWritesAndClearsTheQueue() async {
        let writer = StubHealthDataWriter()
        let storage = TestQueueStorage()
        let store = await enabledStore(writer: writer, storage: storage)
        writer.failureMessage = "health data unavailable"
        await store.record(bodyEntry()).value
        XCTAssertEqual(store.pendingCount, 1)
        writer.failureMessage = nil

        let queued = workout()
        store.record(queued)
        await store.disable(deletingSavedData: false).value

        XCTAssertTrue(store.pending.isEmpty)
        XCTAssertTrue(storage.items.isEmpty)
        XCTAssertFalse(writer.calls.contains(.saveWorkout(queued.id, version: 1)))
    }

    func testStoredQueueIsClearedWhenWritingIsOff() async {
        let storage = TestQueueStorage()
        storage.items = [QueuedHealthWrite(write: .workout(workout()), attempts: 1)]
        let writer = StubHealthDataWriter()
        let store = HealthWriteStore(writer: writer, preferences: TestWritePreferences(), queueStorage: storage)

        await store.retryPending().value

        XCTAssertTrue(store.pending.isEmpty)
        XCTAssertTrue(storage.items.isEmpty)
        XCTAssertTrue(writer.calls.isEmpty)
    }

    func testFileStorageKeepsTheQueueOutOfBackupsAndRemovesAnEmptyQueue() throws {
        let url = try temporaryQueueURL()
        let storage = FileHealthWriteQueueStorage(url: url)
        XCTAssertEqual(try storage.load(), [])

        let queue = [
            QueuedHealthWrite(write: .body(bodyEntry()), attempts: 2),
            QueuedHealthWrite(write: .workout(workout()), attempts: 1),
            QueuedHealthWrite(write: .deleteBody(UUID())),
        ]
        try storage.save(queue)

        XCTAssertEqual(try storage.load(), queue)
        XCTAssertEqual(try url.resourceValues(forKeys: [.isExcludedFromBackupKey]).isExcludedFromBackup, true)

        try storage.save([])

        XCTAssertFalse(FileManager.default.fileExists(atPath: url.path(percentEncoded: false)))
        XCTAssertEqual(try storage.load(), [])
    }

    func testFileStorageDropsADamagedFile() throws {
        let url = try temporaryQueueURL()
        try Data("not a queue".utf8).write(to: url)

        XCTAssertEqual(try FileHealthWriteQueueStorage(url: url).load(), [])
        XCTAssertFalse(FileManager.default.fileExists(atPath: url.path(percentEncoded: false)))
    }

    func testTimelineRecordsPausesAndClosesAnOpenPause() {
        let start = Date(timeIntervalSince1970: 1_000)
        var timeline = WorkoutSessionTimeline(start: start)
        timeline.pause(at: start.addingTimeInterval(60))
        timeline.pause(at: start.addingTimeInterval(70))
        timeline.resume(at: start.addingTimeInterval(90))
        timeline.resume(at: start.addingTimeInterval(95))
        timeline.pause(at: start.addingTimeInterval(300))

        let id = UUID()
        let record = timeline.record(group: .gym, end: start.addingTimeInterval(320), id: id)

        XCTAssertEqual(record, HealthWorkoutRecord(
            id: id,
            group: .gym,
            start: start,
            end: start.addingTimeInterval(320),
            pauses: [
                DateInterval(start: start.addingTimeInterval(60), end: start.addingTimeInterval(90)),
                DateInterval(start: start.addingTimeInterval(300), end: start.addingTimeInterval(320)),
            ]
        ))
    }

    func testTimelineEndIsNeverBeforeTheStart() {
        let start = Date(timeIntervalSince1970: 1_000)
        let record = WorkoutSessionTimeline(start: start).record(group: .home, end: start.addingTimeInterval(-5))

        XCTAssertEqual(record.end, start)
        XCTAssertTrue(record.pauses.isEmpty)
    }

    func testSyncIdentifiersAreStableAndDistinct() throws {
        let id = try XCTUnwrap(UUID(uuidString: "6A3D2E1F-0B4C-4D5E-8F70-112233445566"))

        XCTAssertEqual(HealthSyncIdentifier.workout(id), "club.leanmuscle.boji/workout/6A3D2E1F-0B4C-4D5E-8F70-112233445566")
        XCTAssertEqual(HealthSyncIdentifier.weight(id), "club.leanmuscle.boji/body/6A3D2E1F-0B4C-4D5E-8F70-112233445566/weight")
        XCTAssertEqual(HealthSyncIdentifier.waist(id), "club.leanmuscle.boji/body/6A3D2E1F-0B4C-4D5E-8F70-112233445566/waist")
    }

    #if DEBUG
    func testUITestingFactoryStartsOffAndAllowsEveryType() async {
        let first = HealthWriteStore.uiTesting()
        XCTAssertFalse(first.isEnabled)
        await first.enable().value
        XCTAssertTrue(first.isEnabled)
        XCTAssertEqual(first.status, .allAuthorized)

        XCTAssertFalse(HealthWriteStore.uiTesting().isEnabled)
    }
    #endif

    private func enabledStore(
        writer: StubHealthDataWriter,
        preferences: TestWritePreferences = TestWritePreferences(),
        storage: TestQueueStorage = TestQueueStorage()
    ) async -> HealthWriteStore {
        let store = HealthWriteStore(writer: writer, preferences: preferences, queueStorage: storage)
        await store.enable().value
        writer.clearCalls()
        return store
    }

    private func temporaryQueueURL() throws -> URL {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        addTeardownBlock { try? FileManager.default.removeItem(at: directory) }
        return directory.appendingPathComponent("health-write-queue.json", isDirectory: false)
    }

    private func bodyEntry() -> BodyEntry {
        BodyEntry(date: Date(timeIntervalSince1970: 2_000), weight: 62.5, waist: 74)
    }

    private func workout() -> HealthWorkoutRecord {
        HealthWorkoutRecord(
            id: UUID(),
            group: .home,
            start: Date(timeIntervalSince1970: 3_000),
            end: Date(timeIntervalSince1970: 4_200),
            pauses: [DateInterval(start: Date(timeIntervalSince1970: 3_600), end: Date(timeIntervalSince1970: 3_660))]
        )
    }
}

private extension HealthWriteStatus {
    static let allAuthorized = HealthWriteStatus(workout: .authorized, weight: .authorized, waist: .authorized)
}

private final class TestWritePreferences: HealthDataStorePreferences {
    private var values: [String: Bool] = [:]

    func bool(forKey defaultName: String) -> Bool {
        values[defaultName] ?? false
    }

    func set(_ value: Bool, forKey defaultName: String) {
        values[defaultName] = value
    }

    func removeObject(forKey defaultName: String) {
        values.removeValue(forKey: defaultName)
    }
}

/// A queue storage that the tests can read, and that can act like a locked device.
@MainActor
private final class TestQueueStorage: HealthWriteQueueStorage {
    var items: [QueuedHealthWrite] = []
    /// False acts like a device that is locked: the file exists, but the app cannot read or write it.
    var isReadable = true
    private(set) var saveCount = 0

    func load() throws -> [QueuedHealthWrite] {
        guard isReadable else { throw CocoaError(.fileReadNoPermission) }
        return items
    }

    func save(_ queue: [QueuedHealthWrite]) throws {
        guard isReadable else { throw CocoaError(.fileWriteNoPermission) }
        saveCount += 1
        items = queue
    }
}

@MainActor
private final class StoredQueueObservation {
    var items: [QueuedHealthWrite] = []
}

private final class StubHealthDataWriter: HealthDataWriter, @unchecked Sendable {
    enum Call: Equatable {
        case saveWorkout(UUID, version: Int)
        case saveBody(UUID, version: Int)
        case deleteBody(UUID)
        case deleteAll
    }

    let isAvailable: Bool

    private let lock = NSLock()
    private var requested = false
    private var authorizationRequests = 0
    private var recordedCalls: [Call] = []
    private var storedFailureMessage: String?
    private var storedDelay: UInt64 = 0
    private var storedStatusAfterRequest = HealthWriteStatus.allAuthorized
    private var storedOnWrite: (@MainActor @Sendable () -> Void)?

    init(isAvailable: Bool = true) {
        self.isAvailable = isAvailable
    }

    var authorizationRequestCount: Int { lock.withLock { authorizationRequests } }
    var calls: [Call] { lock.withLock { recordedCalls } }

    var failureMessage: String? {
        get { lock.withLock { storedFailureMessage } }
        set { lock.withLock { storedFailureMessage = newValue } }
    }

    var delayNanoseconds: UInt64 {
        get { lock.withLock { storedDelay } }
        set { lock.withLock { storedDelay = newValue } }
    }

    var statusAfterRequest: HealthWriteStatus {
        get { lock.withLock { storedStatusAfterRequest } }
        set { lock.withLock { storedStatusAfterRequest = newValue } }
    }

    /// Runs on the main actor at the start of every write.
    var onWrite: (@MainActor @Sendable () -> Void)? {
        get { lock.withLock { storedOnWrite } }
        set { lock.withLock { storedOnWrite = newValue } }
    }

    func clearCalls() {
        lock.withLock { recordedCalls = [] }
    }

    func requestWriteAuthorization() async throws {
        lock.withLock {
            authorizationRequests += 1
            requested = true
        }
    }

    func status() -> HealthWriteStatus {
        lock.withLock { requested ? storedStatusAfterRequest : HealthWriteStatus() }
    }

    func save(_ workout: HealthWorkoutRecord, syncVersion: Int) async throws {
        try await perform(.saveWorkout(workout.id, version: syncVersion))
    }

    func save(_ entry: BodyEntry, syncVersion: Int) async throws {
        try await perform(.saveBody(entry.id, version: syncVersion))
    }

    func deleteBodyEntry(id: UUID) async throws {
        try await perform(.deleteBody(id))
    }

    func deleteAllSavedData() async throws {
        try await perform(.deleteAll)
    }

    private func perform(_ call: Call) async throws {
        let (delay, failure, onWrite) = lock.withLock { () -> (UInt64, String?, (@MainActor @Sendable () -> Void)?) in
            recordedCalls.append(call)
            return (storedDelay, storedFailureMessage, storedOnWrite)
        }
        if let onWrite { await onWrite() }
        if delay > 0 { try? await Task.sleep(nanoseconds: delay) }
        if let failure { throw StubWriterError(message: failure) }
    }
}

private struct StubWriterError: LocalizedError {
    let message: String

    var errorDescription: String? { message }
}
