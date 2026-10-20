import Foundation
import Observation

enum PlanKind: String, Codable, CaseIterable, Identifiable {
    case home
    case gym

    var id: String { rawValue }

    var title: String {
        switch self {
        case .home:
            return "居家训练"
        case .gym:
            return "健身房训练"
        }
    }

    var subtitle: String {
        switch self {
        case .home:
            return "徒手开始，循序渐进"
        case .gym:
            return "器械入门，专注动作"
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

struct Exercise: Identifiable, Codable, Equatable {
    let id: String
    let name: String
    let sets: Int
    let reps: String
    let tip: String
    let symbol: String
}

struct Workout: Identifiable, Codable, Equatable {
    let id: String
    let title: String
    let subtitle: String
    let minutes: Int
    let level: String
    let exercises: [Exercise]
}

enum WorkoutLibrary {
    static let home = Workout(
        id: "home-beginner",
        title: "居家基础训练",
        subtitle: "无需器械的全身入门",
        minutes: 20,
        level: "新手",
        exercises: [
            Exercise(
                id: "bodyweight-squat",
                name: "徒手深蹲",
                sets: 3,
                reps: "8–10 次",
                tip: "膝盖朝脚尖方向，缓慢起身。",
                symbol: "figure.strengthtraining.traditional"
            ),
            Exercise(
                id: "wall-push-up",
                name: "墙壁俯卧撑",
                sets: 3,
                reps: "8–10 次",
                tip: "身体保持直线，双手稳稳撑墙。",
                symbol: "figure.walk"
            ),
            Exercise(
                id: "glute-bridge",
                name: "臀桥",
                sets: 3,
                reps: "10–12 次",
                tip: "脚掌踩稳，抬起时不要耸肩。",
                symbol: "figure.core.training"
            ),
            Exercise(
                id: "bird-dog",
                name: "鸟狗式",
                sets: 2,
                reps: "每侧 8 次",
                tip: "动作放慢，保持躯干稳定。",
                symbol: "figure.cooldown"
            )
        ]
    )

    static let gym = Workout(
        id: "gym-beginner",
        title: "器械基础训练",
        subtitle: "轻重量熟悉常用器械",
        minutes: 30,
        level: "新手",
        exercises: [
            Exercise(
                id: "chest-press",
                name: "坐姿推胸",
                sets: 3,
                reps: "8–10 次",
                tip: "选择轻重量，背部贴稳靠垫。",
                symbol: "dumbbell.fill"
            ),
            Exercise(
                id: "seated-row",
                name: "坐姿划船",
                sets: 3,
                reps: "8–10 次",
                tip: "拉向身体时保持肩部放松。",
                symbol: "arrow.left.and.right"
            ),
            Exercise(
                id: "leg-press",
                name: "坐姿腿举",
                sets: 3,
                reps: "10 次",
                tip: "使用可控重量，膝盖不要锁死。",
                symbol: "figure.strengthtraining.traditional"
            ),
            Exercise(
                id: "lat-pulldown",
                name: "高位下拉",
                sets: 3,
                reps: "8–10 次",
                tip: "轻拉横杆，避免身体后仰。",
                symbol: "arrow.down"
            )
        ]
    )

    static let mobility = Workout(
        id: "mobility",
        title: "舒缓拉伸",
        subtitle: "训练前后都可进行",
        minutes: 10,
        level: "轻松",
        exercises: [
            Exercise(
                id: "cat-cow",
                name: "猫牛式",
                sets: 2,
                reps: "8 次",
                tip: "配合呼吸，动作保持柔和。",
                symbol: "figure.flexibility"
            ),
            Exercise(
                id: "hip-flexor-stretch",
                name: "髋屈肌拉伸",
                sets: 2,
                reps: "每侧 20 秒",
                tip: "骨盆保持平稳，不要弹震。",
                symbol: "figure.lunge"
            ),
            Exercise(
                id: "chest-stretch",
                name: "开胸拉伸",
                sets: 2,
                reps: "20 秒",
                tip: "轻轻打开胸部，肩膀自然下沉。",
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

@MainActor
@Observable
final class BojiStore {
    private struct StoredState: Codable {
        var selectedPlan: PlanKind
        var hasOnboarded: Bool
        var displayName: String
        var joinedChallenge: Bool
        var records: [DailyRecord]
        var bodyEntries: [BodyEntry]
    }

    private static let defaultDisplayName = "薄肌同学"
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

    private let storageURL: URL?
    private let inMemory: Bool
    @ObservationIgnored private var isLoading = false
    @ObservationIgnored private var writesBlockedByCorruptFile = false

    init(storageURL: URL? = nil, inMemory: Bool = false) {
        self.inMemory = inMemory

        if inMemory {
            self.storageURL = nil
        } else if let storageURL {
            self.storageURL = storageURL
        } else {
            do {
                let applicationSupport = try FileManager.default.url(
                    for: .applicationSupportDirectory,
                    in: .userDomainMask,
                    appropriateFor: nil,
                    create: true
                )
                self.storageURL = applicationSupport
                    .appendingPathComponent("Boji", isDirectory: true)
                    .appendingPathComponent("state.json", isDirectory: false)
            } catch {
                self.storageURL = nil
                self.storageError = "无法确定本地存储位置：\(error.localizedDescription)"
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

        bodyEntries.append(BodyEntry(weight: weight, waist: waist))
        persistIfNeeded()
    }

    func deleteBodyEntry(id: UUID) {
        let countBeforeDeletion = bodyEntries.count
        bodyEntries.removeAll { $0.id == id }
        guard bodyEntries.count != countBeforeDeletion else { return }
        persistIfNeeded()
    }

    func resetAll() {
        if !inMemory, let storageURL, FileManager.default.fileExists(atPath: storageURL.path) {
            do {
                try FileManager.default.removeItem(at: storageURL)
            } catch {
                storageError = "无法删除本地数据：\(error.localizedDescription)"
                return
            }
        }
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
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        return try encoder.encode(currentState)
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
        guard !inMemory, let storageURL else { return }
        guard FileManager.default.fileExists(atPath: storageURL.path) else { return }

        do {
            let data = try Data(contentsOf: storageURL)
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let state = try decoder.decode(StoredState.self, from: data)

            isLoading = true
            selectedPlan = state.selectedPlan
            hasOnboarded = state.hasOnboarded
            displayName = state.displayName
            joinedChallenge = state.joinedChallenge
            records = state.records
            bodyEntries = state.bodyEntries
            isLoading = false
            storageError = nil
        } catch {
            writesBlockedByCorruptFile = true
            storageError = "无法读取本地数据，原文件未被覆盖：\(error.localizedDescription)"
        }
    }

    private func persistIfNeeded() {
        guard !inMemory, !isLoading, !writesBlockedByCorruptFile else { return }
        guard let storageURL else {
            if storageError == nil {
                storageError = "本地存储位置不可用。"
            }
            return
        }

        do {
            let directory = storageURL.deletingLastPathComponent()
            try FileManager.default.createDirectory(
                at: directory,
                withIntermediateDirectories: true,
                attributes: nil
            )
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(currentState)
            try data.write(to: storageURL, options: .atomic)
            storageError = nil
        } catch {
            storageError = "无法保存本地数据：\(error.localizedDescription)"
        }
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
