import Foundation
import Observation

#if os(iOS) && canImport(HealthKit)
import HealthKit
#endif

/// One finished training session, as Boji writes it to HealthKit.
///
/// The record exists only in the write queue until HealthKit saves it. `BojiStore` keeps the
/// daily check-in, which counts a course once per day. HealthKit gets every session.
struct HealthWorkoutRecord: Equatable, Sendable, Codable {
    let id: UUID
    let group: WorkoutGroup
    let start: Date
    let end: Date
    /// The paused periods inside `start...end`, in order. They become pause and resume events.
    let pauses: [DateInterval]
}

/// The wall-clock times of one training session in `WorkoutSessionView`: the start and the
/// paused periods. The session pauses when the user taps pause, opens the end dialog or leaves
/// the app.
struct WorkoutSessionTimeline: Equatable {
    let start: Date
    private(set) var pauses: [DateInterval] = []
    private var pausedAt: Date?

    init(start: Date) {
        self.start = start
    }

    mutating func pause(at date: Date) {
        if pausedAt == nil { pausedAt = date }
    }

    mutating func resume(at date: Date) {
        guard let pausedAt else { return }
        if date > pausedAt { pauses.append(DateInterval(start: pausedAt, end: date)) }
        self.pausedAt = nil
    }

    /// The finished session. A pause that is still open ends at `end`.
    func record(group: WorkoutGroup, end: Date, id: UUID = UUID()) -> HealthWorkoutRecord {
        let end = max(end, start)
        var pauses = pauses
        if let pausedAt, end > pausedAt { pauses.append(DateInterval(start: pausedAt, end: end)) }
        return HealthWorkoutRecord(id: id, group: group, start: start, end: end, pauses: pauses)
    }
}

/// The write permission of one HealthKit type. HealthKit reports it, unlike the read permission.
enum HealthWritePermission: Equatable, Sendable {
    case notDetermined
    case denied
    case authorized
}

/// The write permissions of the three types that Boji saves.
struct HealthWriteStatus: Equatable, Sendable {
    var workout: HealthWritePermission = .notDetermined
    var weight: HealthWritePermission = .notDetermined
    var waist: HealthWritePermission = .notDetermined

    var allowsAny: Bool {
        workout == .authorized || weight == .authorized || waist == .authorized
    }
}

/// A write that `HealthWriteStore` runs, and runs again after a failure.
enum PendingHealthWrite: Equatable, Sendable, Codable {
    case workout(HealthWorkoutRecord)
    case body(BodyEntry)
    case deleteBody(UUID)
}

/// One write in the queue of `HealthWriteStore`.
struct QueuedHealthWrite: Equatable, Sendable, Codable, Identifiable {
    let id: UUID
    let write: PendingHealthWrite
    /// The attempts that have started. Each attempt saves with this number as its
    /// `HKMetadataKeySyncVersion`. A replay after the app quits therefore has a higher version
    /// than an attempt that HealthKit saved before, and replaces that object.
    var attempts: Int

    init(id: UUID = UUID(), write: PendingHealthWrite, attempts: Int = 0) {
        self.id = id
        self.write = write
        self.attempts = attempts
    }
}

/// The sync identifiers of the HealthKit objects that Boji saves.
///
/// A save with the same identifier and a higher `HKMetadataKeySyncVersion` replaces the old
/// object. HealthKit does not document a save with the same version, so every attempt uses a
/// higher version, and a retry does not add a duplicate. The prefix keeps the identifiers apart
/// from those of other apps.
enum HealthSyncIdentifier {
    static func workout(_ id: UUID) -> String {
        "club.leanmuscle.boji/workout/\(id.uuidString)"
    }

    static func weight(_ id: UUID) -> String {
        "club.leanmuscle.boji/body/\(id.uuidString)/weight"
    }

    static func waist(_ id: UUID) -> String {
        "club.leanmuscle.boji/body/\(id.uuidString)/waist"
    }
}

/// The platform-neutral boundary for HealthKit writes.
///
/// Every method skips a type without write permission and does not throw for it. Tests inject
/// a writer that does not touch a user's health database.
protocol HealthDataWriter: Sendable {
    var isAvailable: Bool { get }

    /// Requests write permission for workouts, weight and waist. It requests no read types.
    func requestWriteAuthorization() async throws

    func status() -> HealthWriteStatus

    func save(_ workout: HealthWorkoutRecord, syncVersion: Int) async throws

    /// Saves the weight and the waist of one entry as two samples.
    func save(_ entry: BodyEntry, syncVersion: Int) async throws

    /// Deletes the two samples of one entry. It succeeds when HealthKit has no such samples.
    func deleteBodyEntry(id: UUID) async throws

    /// Deletes every workout, weight and waist sample that Boji saved.
    func deleteAllSavedData() async throws
}

/// Keeps the write queue of `HealthWriteStore` on the device, so that a write that has not
/// finished survives the app quitting.
@MainActor
protocol HealthWriteQueueStorage {
    /// Returns the stored queue, or an empty queue when there is no file. It throws when a file
    /// exists but the app cannot read it now, for example while the device is locked.
    func load() throws -> [QueuedHealthWrite]

    /// Replaces the stored queue. An empty queue removes the file.
    func save(_ queue: [QueuedHealthWrite]) throws
}

/// Stores the queue in `Application Support/Boji/health-write-queue.json`.
///
/// The file holds workout times and body measurements, so it has complete data protection: the
/// app can read it only while the device is unlocked. The app uses the queue only while the user
/// uses the app. The file is excluded from backups, because the queue belongs to the HealthKit
/// permissions of this device.
struct FileHealthWriteQueueStorage: HealthWriteQueueStorage {
    private struct StoredQueue: Codable {
        static let currentVersion = 1

        var version = currentVersion
        var items: [QueuedHealthWrite]
    }

    let url: URL

    static func live() -> FileHealthWriteQueueStorage? {
        guard let applicationSupport = try? FileManager.default.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        ) else {
            return nil
        }
        return FileHealthWriteQueueStorage(url: applicationSupport
            .appendingPathComponent("Boji", isDirectory: true)
            .appendingPathComponent("health-write-queue.json", isDirectory: false))
    }

    func load() throws -> [QueuedHealthWrite] {
        guard FileManager.default.fileExists(atPath: url.path(percentEncoded: false)) else { return [] }
        let data = try Data(contentsOf: url)
        guard let stored = try? JSONDecoder().decode(StoredQueue.self, from: data),
              stored.version == StoredQueue.currentVersion else {
            // The app cannot replay a damaged file or a file of a newer app version. The local
            // records do not change.
            try? FileManager.default.removeItem(at: url)
            return []
        }
        return stored.items
    }

    func save(_ queue: [QueuedHealthWrite]) throws {
        guard !queue.isEmpty else {
            if FileManager.default.fileExists(atPath: url.path(percentEncoded: false)) {
                try FileManager.default.removeItem(at: url)
            }
            return
        }
        try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        let data = try JSONEncoder().encode(StoredQueue(items: queue))
        try data.write(to: url, options: [.atomic, .completeFileProtection])
        // An atomic write replaces the file, which can reset its resource values. Set the value
        // after every save.
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        var url = url
        try url.setResourceValues(values)
    }
}

/// Keeps the queue in memory only. Tests and UI tests use it, and the app uses it when it
/// cannot find Application Support.
@MainActor
final class MemoryHealthWriteQueueStorage: HealthWriteQueueStorage {
    private var items: [QueuedHealthWrite] = []

    func load() throws -> [QueuedHealthWrite] {
        items
    }

    func save(_ queue: [QueuedHealthWrite]) throws {
        items = queue
    }
}

/// Writes the local records of `BojiStore` to Apple Health, when the user turns writing on.
///
/// The local records stay the source of truth. Writes run one at a time, in the order of the
/// calls. Each write enters the queue on the device before it starts, and leaves the queue when
/// HealthKit saves it. A write that fails, or that stops because the app quits, runs again in
/// `retryPending()`.
@MainActor
@Observable
final class HealthWriteStore {
    private static let enabledDefaultsKey = "Boji.HealthWriteStore.isEnabled"
    /// The most writes in the queue. When the queue is full, a new write runs once and does not
    /// wait for a retry.
    static let pendingLimit = 50
    /// The most attempts for one write. A write that still fails then leaves the queue, so that a
    /// write that can never succeed does not stay in the queue.
    static let attemptLimit = 5

    @ObservationIgnored private let writer: any HealthDataWriter
    @ObservationIgnored private let preferences: any HealthDataStorePreferences
    @ObservationIgnored private let queueStorage: any HealthWriteQueueStorage
    /// False until the stored queue is read. Until then, no save may replace the file.
    @ObservationIgnored private var isQueueLoaded = false
    @ObservationIgnored private var lastOperation: Task<Void, Never>?

    let isAvailable: Bool
    private(set) var isEnabled: Bool
    private(set) var isWorking = false
    private(set) var status: HealthWriteStatus
    private(set) var pending: [QueuedHealthWrite] = []
    private(set) var errorMessage: String?

    init(
        writer: any HealthDataWriter,
        preferences: any HealthDataStorePreferences = UserDefaults.standard,
        queueStorage: (any HealthWriteQueueStorage)? = nil
    ) {
        self.writer = writer
        self.preferences = preferences
        self.queueStorage = queueStorage ?? MemoryHealthWriteQueueStorage()
        self.isAvailable = writer.isAvailable
        self.isEnabled = writer.isAvailable && preferences.bool(forKey: Self.enabledDefaultsKey)
        self.status = writer.isAvailable ? writer.status() : HealthWriteStatus()
        loadQueueIfNeeded()
    }

    /// Creates the app's write store. It shares the HKHealthStore of `HealthDataStore` and keeps
    /// its queue in Application Support.
    static func live() -> HealthWriteStore {
        #if os(iOS) && canImport(HealthKit)
        return HealthWriteStore(
            writer: HealthKitDataWriter(healthStore: HealthDataStore.liveHealthStore),
            queueStorage: FileHealthWriteQueueStorage.live()
        )
        #else
        return HealthWriteStore(writer: UnavailableHealthDataWriter())
        #endif
    }

    #if DEBUG
    /// UI-test-only store. It has in-memory preferences and an in-memory queue, and never opens
    /// HealthKit.
    static func uiTesting() -> HealthWriteStore {
        HealthWriteStore(writer: InMemoryHealthDataWriter(), preferences: InMemoryHealthWritePreferences())
    }
    #endif

    /// The number of writes that wait for a retry. The running write does not count.
    var pendingCount: Int { pending.filter { $0.id != runningWriteID }.count }

    /// The queued write that runs now.
    private var runningWriteID: UUID?

    /// Call only from the user-initiated switch. Writing turns on only when HealthKit allows at
    /// least one of the three types.
    @discardableResult
    func enable() -> Task<Void, Never> {
        perform { [self] in
            guard isAvailable else {
                errorMessage = String(localized: "此设备不支持 Apple 健康。")
                return
            }
            isWorking = true
            defer { isWorking = false }
            do {
                try await writer.requestWriteAuthorization()
                status = writer.status()
                guard status.allowsAny else {
                    errorMessage = String(localized: "未获得写入权限。你可以在健康 App 中允许薄肌写入数据。")
                    return
                }
                isEnabled = true
                preferences.set(true, forKey: Self.enabledDefaultsKey)
                errorMessage = nil
            } catch {
                errorMessage = String(localized: "无法请求写入权限：\(error.localizedDescription)")
            }
        }
    }

    /// Turns writing off. The user decides whether the data that Boji saved stays in Apple Health.
    ///
    /// Writing stops at once: queued writes that have not started are skipped.
    @discardableResult
    func disable(deletingSavedData: Bool) -> Task<Void, Never> {
        isEnabled = false
        preferences.removeObject(forKey: Self.enabledDefaultsKey)
        clearQueue()
        errorMessage = nil
        return perform { [self] in
            guard deletingSavedData, isAvailable else { return }
            isWorking = true
            defer { isWorking = false }
            do {
                try await writer.deleteAllSavedData()
            } catch {
                errorMessage = String(localized: "无法删除薄肌写入 Apple 健康的数据：\(error.localizedDescription)")
            }
        }
    }

    @discardableResult
    func record(_ workout: HealthWorkoutRecord) -> Task<Void, Never> {
        submit(.workout(workout))
    }

    @discardableResult
    func record(_ entry: BodyEntry) -> Task<Void, Never> {
        submit(.body(entry))
    }

    /// Deletes the samples of a body entry that the user deleted in Boji.
    @discardableResult
    func removeBodyEntry(id: UUID) -> Task<Void, Never> {
        // A queued save of the same entry must not run again after the delete. This includes a
        // save that runs now: if it fails, it does not return to the queue.
        loadQueueIfNeeded()
        pending.removeAll { $0.write.bodyEntryID == id }
        persistQueue()
        return submit(.deleteBody(id))
    }

    /// Runs the queued writes again and reads the permissions again.
    /// Call when the app becomes active, because the user can change permissions in Health, and
    /// because the queue can hold writes from before the app quit.
    @discardableResult
    func retryPending() -> Task<Void, Never> {
        perform { [self] in
            guard isAvailable else { return }
            status = writer.status()
            loadQueueIfNeeded()
            guard isEnabled else { return }
            for id in pending.map(\.id) {
                await runQueued(id)
            }
        }
    }

    private func submit(_ write: PendingHealthWrite) -> Task<Void, Never> {
        perform { [self] in
            guard isEnabled else { return }
            loadQueueIfNeeded()
            guard pending.count < Self.pendingLimit else {
                // The queue is full, so this write runs once and does not wait for a retry.
                _ = await execute(write, syncVersion: 1)
                return
            }
            let item = QueuedHealthWrite(write: write)
            pending.append(item)
            await runQueued(item.id)
        }
    }

    /// Runs one queued write. The new attempt count reaches the disk before the write starts. If
    /// the app quits during the write, the replay therefore uses a higher sync version.
    private func runQueued(_ id: UUID) async {
        guard let index = pending.firstIndex(where: { $0.id == id }) else { return }
        pending[index].attempts += 1
        let item = pending[index]
        persistQueue()

        runningWriteID = id
        let succeeded = await execute(item.write, syncVersion: item.attempts)
        runningWriteID = nil

        if succeeded || item.attempts >= Self.attemptLimit {
            pending.removeAll { $0.id == id }
            persistQueue()
        }
        if succeeded && pending.isEmpty { errorMessage = nil }
    }

    /// Runs one write and returns whether HealthKit accepted it. A failure sets `errorMessage`.
    private func execute(_ write: PendingHealthWrite, syncVersion: Int) async -> Bool {
        do {
            switch write {
            case .workout(let workout):
                try await writer.save(workout, syncVersion: syncVersion)
            case .body(let entry):
                try await writer.save(entry, syncVersion: syncVersion)
            case .deleteBody(let id):
                try await writer.deleteBodyEntry(id: id)
            }
            return true
        } catch {
            // The user can turn writing off while a write runs. The failure then does not matter.
            if isEnabled {
                errorMessage = String(localized: "部分记录未能写入 Apple 健康：\(error.localizedDescription)")
            }
            return false
        }
    }

    /// Reads the stored queue once. The read fails while the device is locked, because the file
    /// has complete data protection. The next operation then reads it again.
    private func loadQueueIfNeeded() {
        guard !isQueueLoaded else { return }
        let stored: [QueuedHealthWrite]
        do {
            stored = try queueStorage.load()
        } catch {
            // Keep the file. Until a read succeeds, `persistQueue()` does not replace it.
            return
        }
        isQueueLoaded = true
        guard isEnabled else {
            // Writing is off, so the stored writes must not run.
            pending.removeAll()
            persistQueue()
            return
        }
        // Writes that entered the queue before the read run after the stored writes.
        let storedIDs = Set(stored.map(\.id))
        pending = stored + pending.filter { !storedIDs.contains($0.id) }
        if pending.count != stored.count { persistQueue() }
    }

    /// Saves the queue. A failed save keeps the queue in memory; the next change saves it again.
    private func persistQueue() {
        guard isQueueLoaded else { return }
        try? queueStorage.save(pending)
    }

    private func clearQueue() {
        pending.removeAll()
        if (try? queueStorage.save([])) != nil { isQueueLoaded = true }
    }

    /// Chains the work after the previous operation, so that writes and deletes keep their order.
    private func perform(_ work: @escaping @MainActor () async -> Void) -> Task<Void, Never> {
        let previous = lastOperation
        let task = Task { @MainActor in
            await previous?.value
            await work()
        }
        lastOperation = task
        return task
    }
}

private extension PendingHealthWrite {
    var bodyEntryID: UUID? {
        if case .body(let entry) = self { return entry.id }
        return nil
    }
}

#if DEBUG
private final class InMemoryHealthWritePreferences: HealthDataStorePreferences {
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

/// Allows every type after the request and saves nothing.
private final class InMemoryHealthDataWriter: HealthDataWriter, @unchecked Sendable {
    private let lock = NSLock()
    private var requested = false

    let isAvailable = true

    func requestWriteAuthorization() async throws {
        lock.withLock { requested = true }
    }

    func status() -> HealthWriteStatus {
        lock.withLock {
            requested ? HealthWriteStatus(workout: .authorized, weight: .authorized, waist: .authorized) : HealthWriteStatus()
        }
    }

    func save(_ workout: HealthWorkoutRecord, syncVersion: Int) async throws {}
    func save(_ entry: BodyEntry, syncVersion: Int) async throws {}
    func deleteBodyEntry(id: UUID) async throws {}
    func deleteAllSavedData() async throws {}
}
#endif

private final class UnavailableHealthDataWriter: HealthDataWriter, @unchecked Sendable {
    let isAvailable = false

    func requestWriteAuthorization() async throws {}
    func status() -> HealthWriteStatus { HealthWriteStatus() }
    func save(_ workout: HealthWorkoutRecord, syncVersion: Int) async throws {}
    func save(_ entry: BodyEntry, syncVersion: Int) async throws {}
    func deleteBodyEntry(id: UUID) async throws {}
    func deleteAllSavedData() async throws {}
}

#if os(iOS) && canImport(HealthKit)
private final class HealthKitDataWriter: HealthDataWriter, @unchecked Sendable {
    private let healthStore: HKHealthStore
    private let workoutType = HKObjectType.workoutType()
    private let bodyMassType = HKQuantityType(.bodyMass)
    private let waistType = HKQuantityType(.waistCircumference)

    var isAvailable: Bool {
        HKHealthStore.isHealthDataAvailable()
    }

    init(healthStore: HKHealthStore) {
        self.healthStore = healthStore
    }

    func requestWriteAuthorization() async throws {
        let typesToShare: Set<HKSampleType> = [workoutType, bodyMassType, waistType]
        try await healthStore.requestAuthorization(toShare: typesToShare, read: [])
    }

    func status() -> HealthWriteStatus {
        HealthWriteStatus(
            workout: permission(for: workoutType),
            weight: permission(for: bodyMassType),
            waist: permission(for: waistType)
        )
    }

    func save(_ record: HealthWorkoutRecord, syncVersion: Int) async throws {
        guard isAuthorized(workoutType) else { return }

        let configuration = HKWorkoutConfiguration()
        configuration.activityType = Self.activityType(for: record.group)
        configuration.locationType = .indoor
        // The builder saves the workout with its duration, so that the Fitness app counts it.
        let builder = HKWorkoutBuilder(healthStore: healthStore, configuration: configuration, device: .local())
        try await builder.beginCollection(at: record.start)
        let events = record.pauses.flatMap { pause in
            [
                HKWorkoutEvent(type: .pause, dateInterval: DateInterval(start: pause.start, duration: 0), metadata: nil),
                HKWorkoutEvent(type: .resume, dateInterval: DateInterval(start: pause.end, duration: 0), metadata: nil),
            ]
        }
        if !events.isEmpty {
            try await builder.addWorkoutEvents(events)
        }
        try await builder.addMetadata([
            HKMetadataKeySyncIdentifier: HealthSyncIdentifier.workout(record.id),
            HKMetadataKeySyncVersion: syncVersion,
            HKMetadataKeyIndoorWorkout: true,
        ])
        try await builder.endCollection(at: record.end)
        _ = try await builder.finishWorkout()
    }

    func save(_ entry: BodyEntry, syncVersion: Int) async throws {
        var samples: [HKObject] = []
        if isAuthorized(bodyMassType) {
            samples.append(sample(
                type: bodyMassType,
                quantity: HKQuantity(unit: .gramUnit(with: .kilo), doubleValue: entry.weight),
                date: entry.date,
                syncIdentifier: HealthSyncIdentifier.weight(entry.id),
                syncVersion: syncVersion
            ))
        }
        if isAuthorized(waistType) {
            samples.append(sample(
                type: waistType,
                quantity: HKQuantity(unit: .meterUnit(with: .centi), doubleValue: entry.waist),
                date: entry.date,
                syncIdentifier: HealthSyncIdentifier.waist(entry.id),
                syncVersion: syncVersion
            ))
        }
        guard !samples.isEmpty else { return }
        try await healthStore.save(samples)
    }

    func deleteBodyEntry(id: UUID) async throws {
        let targets: [(HKQuantityType, String)] = [
            (bodyMassType, HealthSyncIdentifier.weight(id)),
            (waistType, HealthSyncIdentifier.waist(id)),
        ]
        for (type, syncIdentifier) in targets where isAuthorized(type) {
            let predicate = NSCompoundPredicate(andPredicateWithSubpredicates: [
                HKQuery.predicateForObjects(from: HKSource.default()),
                HKQuery.predicateForObjects(withMetadataKey: HKMetadataKeySyncIdentifier, allowedValues: [syncIdentifier]),
            ])
            try await deleteObjects(of: type, predicate: predicate)
        }
    }

    func deleteAllSavedData() async throws {
        let types: [HKObjectType] = [workoutType, bodyMassType, waistType]
        for type in types where isAuthorized(type) {
            try await deleteObjects(of: type, predicate: HKQuery.predicateForObjects(from: HKSource.default()))
        }
    }

    /// Deletes the matching objects. No matching object is not an error.
    private func deleteObjects(of type: HKObjectType, predicate: NSPredicate) async throws {
        do {
            _ = try await healthStore.deleteObjects(of: type, predicate: predicate)
        } catch let error as HKError where error.code == .errorNoData {
            return
        }
    }

    private func sample(
        type: HKQuantityType,
        quantity: HKQuantity,
        date: Date,
        syncIdentifier: String,
        syncVersion: Int
    ) -> HKQuantitySample {
        HKQuantitySample(type: type, quantity: quantity, start: date, end: date, metadata: [
            HKMetadataKeySyncIdentifier: syncIdentifier,
            HKMetadataKeySyncVersion: syncVersion,
            HKMetadataKeyWasUserEntered: true,
        ])
    }

    private func isAuthorized(_ type: HKObjectType) -> Bool {
        healthStore.authorizationStatus(for: type) == .sharingAuthorized
    }

    private func permission(for type: HKObjectType) -> HealthWritePermission {
        switch healthStore.authorizationStatus(for: type) {
        case .sharingAuthorized:
            return .authorized
        case .sharingDenied:
            return .denied
        case .notDetermined:
            return .notDetermined
        @unknown default:
            return .notDetermined
        }
    }

    /// Home courses use body weight, gym courses use weights and machines, and stretch courses
    /// are mobility work.
    private static func activityType(for group: WorkoutGroup) -> HKWorkoutActivityType {
        switch group {
        case .home:
            return .functionalStrengthTraining
        case .gym:
            return .traditionalStrengthTraining
        case .stretch:
            return .flexibility
        }
    }
}
#endif
