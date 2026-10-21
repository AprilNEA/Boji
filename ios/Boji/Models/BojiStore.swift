import Foundation
import Observation

enum PlanKind: String, Codable, CaseIterable, Identifiable {
    case home
    case gym

    var id: String { rawValue }

    var title: String {
        switch self {
        case .home:
            return String(localized: .Shared.planHomeTitle)
        case .gym:
            return String(localized: .Shared.planGymTitle)
        }
    }

    var subtitle: String {
        switch self {
        case .home:
            return String(localized: .Shared.planHomeSubtitle)
        case .gym:
            return String(localized: .Shared.planGymSubtitle)
        }
    }

    var symbol: String {
        switch self {
        case .home:
            return "house.fill"
        case .gym:
            return "dumbbell.fill"
        }
    }
}

/// The amount of one set: repetitions or seconds, once or on each side.
/// Matches `Reps` in the Android `Workout.kt`. The text is in the `exercise` group of `locales/`.
enum Reps: Hashable, Codable {
    case count(Int)
    case countRange(Int, Int)
    case countPerSide(Int)
    case seconds(Int)
    case secondsRange(Int, Int)
    case secondsPerSide(Int)

    /// The amount in the display language, such as 8～10 次 or 每侧 20 秒.
    var text: String {
        switch self {
        case .count(let count): String(localized: .Shared.exerciseRepsCount(count: count))
        case .countRange(let min, let max): String(localized: .Shared.exerciseRepsCountRange(min: min, max: max))
        case .countPerSide(let count): String(localized: .Shared.exerciseRepsCountPerSide(count: count))
        case .seconds(let seconds): String(localized: .Shared.exerciseRepsSeconds(seconds: seconds))
        case .secondsRange(let min, let max): String(localized: .Shared.exerciseRepsSecondsRange(min: min, max: max))
        case .secondsPerSide(let seconds): String(localized: .Shared.exerciseRepsSecondsPerSide(seconds: seconds))
        }
    }
}

struct Exercise: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let sets: Int
    let reps: Reps
    let tip: String
    let symbol: String
}

struct Workout: Identifiable, Codable, Hashable {
    let id: String
    let title: String
    let subtitle: String
    let minutes: Int
    let level: String
    let exercises: [Exercise]
}

/// Built-in courses. Structure and IDs match `WorkoutLibrary` in the Android `Workout.kt`.
/// The text is in the `course` and `exercise` groups of `locales/`. iOS restarts the app when
/// the user changes its language, so resolving the strings once is safe.
enum WorkoutLibrary {
    static let home = Workout(
        id: "home-beginner",
        title: String(localized: .Shared.courseHomeBeginnerTitle),
        subtitle: String(localized: .Shared.courseHomeBeginnerSubtitle),
        minutes: 20,
        level: String(localized: .Shared.courseLevelBeginner),
        exercises: [
            Exercise(
                id: "bodyweight-squat",
                name: String(localized: .Shared.exerciseBodyweightSquatName),
                sets: 3,
                reps: .countRange(8, 10),
                tip: String(localized: .Shared.exerciseBodyweightSquatTip),
                symbol: "figure.strengthtraining.traditional"
            ),
            Exercise(
                id: "wall-push-up",
                name: String(localized: .Shared.exerciseWallPushUpName),
                sets: 3,
                reps: .countRange(8, 10),
                tip: String(localized: .Shared.exerciseWallPushUpTip),
                symbol: "figure.walk"
            ),
            Exercise(
                id: "glute-bridge",
                name: String(localized: .Shared.exerciseGluteBridgeName),
                sets: 3,
                reps: .countRange(10, 12),
                tip: String(localized: .Shared.exerciseGluteBridgeTip),
                symbol: "figure.core.training"
            ),
            Exercise(
                id: "bird-dog",
                name: String(localized: .Shared.exerciseBirdDogName),
                sets: 2,
                reps: .countPerSide(8),
                tip: String(localized: .Shared.exerciseBirdDogTip),
                symbol: "figure.cooldown"
            )
        ]
    )

    static let homeIntermediate = Workout(
        id: "home-intermediate",
        title: String(localized: .Shared.courseHomeIntermediateTitle),
        subtitle: String(localized: .Shared.courseHomeIntermediateSubtitle),
        minutes: 25,
        level: String(localized: .Shared.courseLevelIntermediate),
        exercises: [
            Exercise(
                id: "reverse-lunge",
                name: String(localized: .Shared.exerciseReverseLungeName),
                sets: 3,
                reps: .countPerSide(8),
                tip: String(localized: .Shared.exerciseReverseLungeTip),
                symbol: "figure.lunge"
            ),
            Exercise(
                id: "knee-push-up",
                name: String(localized: .Shared.exerciseKneePushUpName),
                sets: 3,
                reps: .countRange(8, 10),
                tip: String(localized: .Shared.exerciseKneePushUpTip),
                symbol: "figure.strengthtraining.traditional"
            ),
            Exercise(
                id: "dead-bug",
                name: String(localized: .Shared.exerciseDeadBugName),
                sets: 3,
                reps: .countPerSide(6),
                tip: String(localized: .Shared.exerciseDeadBugTip),
                symbol: "figure.core.training"
            ),
            Exercise(
                id: "wall-sit",
                name: String(localized: .Shared.exerciseWallSitName),
                sets: 3,
                reps: .secondsRange(20, 30),
                tip: String(localized: .Shared.exerciseWallSitTip),
                symbol: "figure.strengthtraining.traditional"
            ),
            Exercise(
                id: "plank",
                name: String(localized: .Shared.exercisePlankName),
                sets: 3,
                reps: .secondsRange(20, 30),
                tip: String(localized: .Shared.exercisePlankTip),
                symbol: "figure.core.training"
            )
        ]
    )

    static let gym = Workout(
        id: "gym-beginner",
        title: String(localized: .Shared.courseGymBeginnerTitle),
        subtitle: String(localized: .Shared.courseGymBeginnerSubtitle),
        minutes: 30,
        level: String(localized: .Shared.courseLevelBeginner),
        exercises: [
            Exercise(
                id: "chest-press",
                name: String(localized: .Shared.exerciseChestPressName),
                sets: 3,
                reps: .countRange(8, 10),
                tip: String(localized: .Shared.exerciseChestPressTip),
                symbol: "dumbbell.fill"
            ),
            Exercise(
                id: "seated-row",
                name: String(localized: .Shared.exerciseSeatedRowName),
                sets: 3,
                reps: .countRange(8, 10),
                tip: String(localized: .Shared.exerciseSeatedRowTip),
                symbol: "arrow.left.and.right"
            ),
            Exercise(
                id: "leg-press",
                name: String(localized: .Shared.exerciseLegPressName),
                sets: 3,
                reps: .count(10),
                tip: String(localized: .Shared.exerciseLegPressTip),
                symbol: "figure.strengthtraining.traditional"
            ),
            Exercise(
                id: "lat-pulldown",
                name: String(localized: .Shared.exerciseLatPulldownName),
                sets: 3,
                reps: .countRange(8, 10),
                tip: String(localized: .Shared.exerciseLatPulldownTip),
                symbol: "arrow.down"
            )
        ]
    )

    static let mobility = Workout(
        id: "mobility",
        title: String(localized: .Shared.courseMobilityTitle),
        subtitle: String(localized: .Shared.courseMobilitySubtitle),
        minutes: 10,
        level: String(localized: .Shared.courseLevelGentle),
        exercises: [
            Exercise(
                id: "cat-cow",
                name: String(localized: .Shared.exerciseCatCowName),
                sets: 2,
                reps: .count(8),
                tip: String(localized: .Shared.exerciseCatCowTip),
                symbol: "figure.flexibility"
            ),
            Exercise(
                id: "hip-flexor-stretch",
                name: String(localized: .Shared.exerciseHipFlexorStretchName),
                sets: 2,
                reps: .secondsPerSide(20),
                tip: String(localized: .Shared.exerciseHipFlexorStretchTip),
                symbol: "figure.lunge"
            ),
            Exercise(
                id: "chest-stretch",
                name: String(localized: .Shared.exerciseChestStretchName),
                sets: 2,
                reps: .seconds(20),
                tip: String(localized: .Shared.exerciseChestStretchTip),
                symbol: "figure.arms.open"
            )
        ]
    )

    static func recommended(for plan: PlanKind) -> Workout {
        switch plan {
        case .home:
            return home
        case .gym:
            return gym
        }
    }
}

struct DailyRecord: Codable, Identifiable, Equatable {
    let id: String
    var date: Date
    var waterML: Int
    var sleepHours: Double?
    var completedWorkoutIDs: [String]
    var minutes: Int

    init(
        id: String? = nil,
        date: Date = Date(),
        waterML: Int = 0,
        sleepHours: Double? = nil,
        completedWorkoutIDs: [String] = [],
        minutes: Int = 0
    ) {
        self.id = id ?? Self.dateKey(for: date)
        self.date = date
        self.waterML = waterML
        self.sleepHours = sleepHours
        self.completedWorkoutIDs = completedWorkoutIDs
        self.minutes = minutes
    }

    static func dateKey(for date: Date, calendar: Calendar = .current) -> String {
        let components = calendar.dateComponents([.year, .month, .day], from: date)
        let year = components.year ?? 0
        let month = components.month ?? 0
        let day = components.day ?? 0
        return String(format: "%04d-%02d-%02d", year, month, day)
    }
}

struct BodyEntry: Codable, Identifiable, Equatable {
    let id: UUID
    var date: Date
    var weight: Double
    var waist: Double

    init(id: UUID = UUID(), date: Date = Date(), weight: Double, waist: Double) {
        self.id = id
        self.date = date
        self.weight = weight
        self.waist = waist
    }
}

private struct StoredState: Codable, Sendable {
    var selectedPlan: PlanKind
    var hasOnboarded: Bool
    var displayName: String
    var joinedChallenge: Bool
    var records: [DailyRecord]
    var bodyEntries: [BodyEntry]

    static func makeEncoder() -> JSONEncoder {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }
}

/// Encodes and writes the state file off the main actor.
private actor StateFile {
    nonisolated let url: URL
    private let encoder = StoredState.makeEncoder()

    init(url: URL) { self.url = url }

    func write(_ state: StoredState) throws {
        let data = try encoder.encode(state)
        try FileManager.default.createDirectory(
            at: url.deletingLastPathComponent(),
            withIntermediateDirectories: true,
            attributes: nil
        )
        try data.write(to: url, options: .atomic)
    }
}

@MainActor
@Observable
final class BojiStore {
    /// The nickname of a new or reset state, in the display language of that moment.
    private static var defaultDisplayName: String { String(localized: .Shared.defaultDisplayName) }
    private static let maximumWaterChangeML = 10_000
    private static let maximumDailyWaterML = 20_000

    var selectedPlan: PlanKind = .home {
        didSet { persistIfNeeded() }
    }
    var hasOnboarded = false {
        didSet { persistIfNeeded() }
    }
    var displayName = BojiStore.defaultDisplayName {
        didSet { persistIfNeeded() }
    }
    var joinedChallenge = false {
        didSet { persistIfNeeded() }
    }
    private(set) var records: [DailyRecord] = []
    /// Sorted by date, oldest first.
    private(set) var bodyEntries: [BodyEntry] = []
    private(set) var storageError: String?
    private var currentDate = Date()

    var today: DailyRecord {
        let calendar = Calendar.current
        let start = calendar.startOfDay(for: currentDate)
        return record(on: start, calendar: calendar)
            ?? DailyRecord(date: start)
    }

    var totalWorkouts: Int {
        records.reduce(0) { $0 + $1.completedWorkoutIDs.count }
    }

    var activeDays: Int {
        records.filter { !$0.completedWorkoutIDs.isEmpty || $0.waterML > 0 || $0.sleepHours != nil }.count
    }

    var weekRecords: [DailyRecord] {
        let calendar = Calendar.current
        let todayStart = calendar.startOfDay(for: currentDate)
        return (-6...0).compactMap { offset in
            guard let day = calendar.date(byAdding: .day, value: offset, to: todayStart) else {
                return nil
            }
            return record(on: day, calendar: calendar) ?? DailyRecord(date: day)
        }
    }

    private let stateFile: StateFile?
    private let inMemory: Bool
    @ObservationIgnored private var pendingWrite: Task<Void, Never>?
    @ObservationIgnored private var writeGeneration = 0
    @ObservationIgnored private var isLoading = false
    @ObservationIgnored private var writesBlockedByCorruptFile = false

    init(storageURL: URL? = nil, inMemory: Bool = false) {
        self.inMemory = inMemory

        if inMemory {
            stateFile = nil
        } else if let storageURL {
            stateFile = StateFile(url: storageURL)
        } else {
            do {
                let applicationSupport = try FileManager.default.url(
                    for: .applicationSupportDirectory,
                    in: .userDomainMask,
                    appropriateFor: nil,
                    create: true
                )
                stateFile = StateFile(url: applicationSupport
                    .appendingPathComponent("Boji", isDirectory: true)
                    .appendingPathComponent("state.json", isDirectory: false))
            } catch {
                stateFile = nil
                self.storageError = String(localized: "无法确定本地存储位置：\(error.localizedDescription)")
            }
        }

        loadFromDiskIfAvailable()
    }

    func addWater(_ ml: Int) {
        guard ml != 0, absWithinWaterLimit(ml) else { return }

        let calendar = Calendar.current
        let day = calendar.startOfDay(for: Date())
        var record = record(on: day, calendar: calendar) ?? DailyRecord(date: day)
        let previousWater = record.waterML
        let safePreviousWater = min(max(0, previousWater), Self.maximumDailyWaterML)

        if ml > 0 {
            guard safePreviousWater < Self.maximumDailyWaterML else { return }
            record.waterML = min(Self.maximumDailyWaterML, safePreviousWater + ml)
        } else {
            guard safePreviousWater > 0 else { return }
            record.waterML = max(0, safePreviousWater + ml)
        }

        guard record.waterML != previousWater else { return }
        upsert(record, calendar: calendar)
    }

    func setSleep(_ hours: Double) {
        guard hours.isFinite, (0...16).contains(hours) else { return }

        let calendar = Calendar.current
        let day = calendar.startOfDay(for: Date())
        var record = record(on: day, calendar: calendar) ?? DailyRecord(date: day)
        guard record.sleepHours != hours else { return }
        record.sleepHours = hours
        upsert(record, calendar: calendar)
    }

    func completeWorkout(_ workout: Workout) {
        let calendar = Calendar.current
        let day = calendar.startOfDay(for: Date())
        var record = record(on: day, calendar: calendar) ?? DailyRecord(date: day)
        guard !record.completedWorkoutIDs.contains(workout.id) else { return }

        record.completedWorkoutIDs.append(workout.id)
        let safeMinutes = max(0, workout.minutes)
        record.minutes = record.minutes.addingReportingOverflow(safeMinutes).overflow
            ? Int.max
            : record.minutes + safeMinutes
        upsert(record, calendar: calendar)
    }

    func addBodyEntry(weight: Double, waist: Double) {
        guard weight.isFinite, waist.isFinite else { return }
        guard (30...300).contains(weight), (30...250).contains(waist) else { return }

        let entry = BodyEntry(weight: weight, waist: waist)
        // The clock can move back, so a new entry is not always the latest one.
        let index = bodyEntries.lastIndex { $0.date <= entry.date }.map { $0 + 1 } ?? 0
        bodyEntries.insert(entry, at: index)
        persistIfNeeded()
    }

    func deleteBodyEntry(id: UUID) {
        let countBeforeDeletion = bodyEntries.count
        bodyEntries.removeAll { $0.id == id }
        guard bodyEntries.count != countBeforeDeletion else { return }
        persistIfNeeded()
    }

    func resetAll() {
        // The atomic write of the default state below replaces the old file, including a corrupt one.
        writesBlockedByCorruptFile = false
        storageError = nil
        isLoading = true
        selectedPlan = .home
        hasOnboarded = false
        displayName = Self.defaultDisplayName
        joinedChallenge = false
        records = []
        bodyEntries = []
        isLoading = false
        persistIfNeeded()
    }

    func exportJSON() throws -> Data {
        try StoredState.makeEncoder().encode(currentState)
    }

    func refreshDay() {
        currentDate = Date()
    }

    private var currentState: StoredState {
        StoredState(
            selectedPlan: selectedPlan,
            hasOnboarded: hasOnboarded,
            displayName: displayName,
            joinedChallenge: joinedChallenge,
            records: records,
            bodyEntries: bodyEntries
        )
    }

    private func loadFromDiskIfAvailable() {
        guard let url = stateFile?.url, FileManager.default.fileExists(atPath: url.path) else { return }

        do {
            let data = try Data(contentsOf: url)
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let state = try decoder.decode(StoredState.self, from: data)

            isLoading = true
            selectedPlan = state.selectedPlan
            hasOnboarded = state.hasOnboarded
            displayName = state.displayName
            joinedChallenge = state.joinedChallenge
            records = state.records
            bodyEntries = state.bodyEntries.sorted { $0.date < $1.date }
            isLoading = false
            storageError = nil
        } catch {
            writesBlockedByCorruptFile = true
            storageError = String(localized: .Shared.storageReadFailed(detail: error.localizedDescription))
        }
    }

    private func persistIfNeeded() {
        guard !inMemory, !isLoading, !writesBlockedByCorruptFile else { return }
        guard let stateFile else {
            if storageError == nil {
                storageError = String(localized: "本地存储位置不可用。")
            }
            return
        }

        writeGeneration += 1
        let generation = writeGeneration
        let state = currentState
        let previousWrite = pendingWrite
        // Each write waits for the previous one, so the file always ends with the latest state.
        pendingWrite = Task {
            await previousWrite?.value
            // A newer state is queued behind this one, so only that state needs to reach the disk.
            guard generation == writeGeneration else { return }
            do {
                try await stateFile.write(state)
                storageError = nil
            } catch {
                storageError = String(localized: .Shared.storageWriteFailed(detail: error.localizedDescription))
            }
        }
    }

    /// Waits until every scheduled write has finished.
    func flush() async {
        await pendingWrite?.value
    }

    private func record(on day: Date, calendar: Calendar) -> DailyRecord? {
        records.first { calendar.isDate($0.date, inSameDayAs: day) }
    }

    private func upsert(_ record: DailyRecord, calendar: Calendar) {
        if let index = records.firstIndex(where: { calendar.isDate($0.date, inSameDayAs: record.date) }) {
            records[index] = record
        } else {
            records.append(record)
        }
        persistIfNeeded()
    }

    private func absWithinWaterLimit(_ value: Int) -> Bool {
        if value == Int.min { return false }
        return abs(value) <= Self.maximumWaterChangeML
    }
}
