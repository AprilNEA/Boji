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

enum WorkoutGroup: String, Codable, CaseIterable, Identifiable {
    case home
    case gym
    case stretch

    var id: String { rawValue }

    var title: LocalizedStringResource {
        switch self {
        case .home: .Shared.trainingGroupHome
        case .gym: .Shared.trainingGroupGym
        case .stretch: .Shared.trainingGroupStretch
        }
    }
}

struct Workout: Identifiable, Codable, Hashable {
    let id: String
    let title: String
    let subtitle: String
    let minutes: Int
    let level: String
    let group: WorkoutGroup
    let exercises: [Exercise]
}

/// Built-in courses. Structure and IDs match `WorkoutLibrary` in the Android `Workout.kt`.
/// The text is in the `course` and `exercise` groups of `locales/`. iOS restarts the app when
/// the user changes its language, so resolving the strings once is safe.
enum WorkoutLibrary {
    private static func exercise(
        _ id: String,
        _ name: LocalizedStringResource,
        sets: Int,
        reps: Reps,
        tip: LocalizedStringResource,
        symbol: String
    ) -> Exercise {
        Exercise(id: id, name: String(localized: name), sets: sets, reps: reps,
                 tip: String(localized: tip), symbol: symbol)
    }

    private static func workout(
        id: String,
        title: LocalizedStringResource,
        subtitle: LocalizedStringResource,
        minutes: Int,
        level: LocalizedStringResource,
        group: WorkoutGroup,
        exercises: [Exercise]
    ) -> Workout {
        Workout(id: id, title: String(localized: title), subtitle: String(localized: subtitle),
                minutes: minutes, level: String(localized: level), group: group, exercises: exercises)
    }

    static let home = workout(
        id: "home-beginner", title: .Shared.courseHomeBeginnerTitle,
        subtitle: .Shared.courseHomeBeginnerSubtitle, minutes: 20,
        level: .Shared.courseLevelBeginner, group: .home,
        exercises: [
            exercise("bodyweight-squat", .Shared.exerciseBodyweightSquatName, sets: 3, reps: .countRange(8, 10), tip: .Shared.exerciseBodyweightSquatTip, symbol: "figure.strengthtraining.traditional"),
            exercise("wall-push-up", .Shared.exerciseWallPushUpName, sets: 3, reps: .countRange(8, 10), tip: .Shared.exerciseWallPushUpTip, symbol: "figure.walk"),
            exercise("glute-bridge", .Shared.exerciseGluteBridgeName, sets: 3, reps: .countRange(10, 12), tip: .Shared.exerciseGluteBridgeTip, symbol: "figure.core.training"),
            exercise("bird-dog", .Shared.exerciseBirdDogName, sets: 2, reps: .countPerSide(8), tip: .Shared.exerciseBirdDogTip, symbol: "figure.cooldown")
        ]
    )

    static let homeIntermediate = workout(
        id: "home-intermediate", title: .Shared.courseHomeIntermediateTitle,
        subtitle: .Shared.courseHomeIntermediateSubtitle, minutes: 25,
        level: .Shared.courseLevelIntermediate, group: .home,
        exercises: [
            exercise("reverse-lunge", .Shared.exerciseReverseLungeName, sets: 3, reps: .countPerSide(8), tip: .Shared.exerciseReverseLungeTip, symbol: "figure.lunge"),
            exercise("knee-push-up", .Shared.exerciseKneePushUpName, sets: 3, reps: .countRange(8, 10), tip: .Shared.exerciseKneePushUpTip, symbol: "figure.strengthtraining.traditional"),
            exercise("dead-bug", .Shared.exerciseDeadBugName, sets: 3, reps: .countPerSide(6), tip: .Shared.exerciseDeadBugTip, symbol: "figure.core.training"),
            exercise("wall-sit", .Shared.exerciseWallSitName, sets: 3, reps: .secondsRange(20, 30), tip: .Shared.exerciseWallSitTip, symbol: "figure.strengthtraining.traditional"),
            exercise("plank", .Shared.exercisePlankName, sets: 3, reps: .secondsRange(20, 30), tip: .Shared.exercisePlankTip, symbol: "figure.core.training")
        ]
    )

    static let gym = workout(
        id: "gym-beginner", title: .Shared.courseGymBeginnerTitle,
        subtitle: .Shared.courseGymBeginnerSubtitle, minutes: 30,
        level: .Shared.courseLevelBeginner, group: .gym,
        exercises: [
            exercise("chest-press", .Shared.exerciseChestPressName, sets: 3, reps: .countRange(8, 10), tip: .Shared.exerciseChestPressTip, symbol: "dumbbell.fill"),
            exercise("seated-row", .Shared.exerciseSeatedRowName, sets: 3, reps: .countRange(8, 10), tip: .Shared.exerciseSeatedRowTip, symbol: "arrow.left.and.right"),
            exercise("leg-press", .Shared.exerciseLegPressName, sets: 3, reps: .count(10), tip: .Shared.exerciseLegPressTip, symbol: "figure.strengthtraining.traditional"),
            exercise("lat-pulldown", .Shared.exerciseLatPulldownName, sets: 3, reps: .countRange(8, 10), tip: .Shared.exerciseLatPulldownTip, symbol: "arrow.down")
        ]
    )

    static let mobility = workout(
        id: "mobility", title: .Shared.courseMobilityTitle,
        subtitle: .Shared.courseMobilitySubtitle, minutes: 10,
        level: .Shared.courseLevelGentle, group: .stretch,
        exercises: [
            exercise("cat-cow", .Shared.exerciseCatCowName, sets: 2, reps: .count(8), tip: .Shared.exerciseCatCowTip, symbol: "figure.flexibility"),
            exercise("hip-flexor-stretch", .Shared.exerciseHipFlexorStretchName, sets: 2, reps: .secondsPerSide(20), tip: .Shared.exerciseHipFlexorStretchTip, symbol: "figure.lunge"),
            exercise("chest-stretch", .Shared.exerciseChestStretchName, sets: 2, reps: .seconds(20), tip: .Shared.exerciseChestStretchTip, symbol: "figure.arms.open")
        ]
    )

    static let homeStrength = workout(
        id: "home-strength", title: .Shared.courseHomeStrengthTitle,
        subtitle: .Shared.courseHomeStrengthSubtitle, minutes: 30,
        level: .Shared.courseLevelIntermediate, group: .home,
        exercises: [
            exercise("push-up", .Shared.exercisePushUpName, sets: 3, reps: .countRange(8, 12), tip: .Shared.exercisePushUpTip, symbol: "figure.strengthtraining.traditional"),
            exercise("bodyweight-split-squat", .Shared.exerciseBodyweightSplitSquatName, sets: 3, reps: .countPerSide(8), tip: .Shared.exerciseBodyweightSplitSquatTip, symbol: "figure.lunge"),
            exercise("single-leg-glute-bridge", .Shared.exerciseSingleLegGluteBridgeName, sets: 3, reps: .countPerSide(10), tip: .Shared.exerciseSingleLegGluteBridgeTip, symbol: "figure.core.training"),
            exercise("bench-dip", .Shared.exerciseBenchDipName, sets: 3, reps: .countRange(8, 12), tip: .Shared.exerciseBenchDipTip, symbol: "figure.strengthtraining.traditional"),
            exercise("superman", .Shared.exerciseSupermanName, sets: 3, reps: .countRange(10, 12), tip: .Shared.exerciseSupermanTip, symbol: "figure.core.training"),
            exercise("bodyweight-forearm-side-plank", .Shared.exerciseBodyweightForearmSidePlankName, sets: 3, reps: .secondsPerSide(20), tip: .Shared.exerciseBodyweightForearmSidePlankTip, symbol: "figure.core.training")
        ]
    )

    static let homeCore = workout(
        id: "home-core", title: .Shared.courseHomeCoreTitle,
        subtitle: .Shared.courseHomeCoreSubtitle, minutes: 15,
        level: .Shared.courseLevelBeginner, group: .home,
        exercises: [
            exercise("crunch", .Shared.exerciseCrunchName, sets: 3, reps: .countRange(12, 15), tip: .Shared.exerciseCrunchTip, symbol: "figure.core.training"),
            exercise("reverse-crunch", .Shared.exerciseReverseCrunchName, sets: 3, reps: .countRange(10, 12), tip: .Shared.exerciseReverseCrunchTip, symbol: "figure.core.training"),
            exercise("bicycle-crunch", .Shared.exerciseBicycleCrunchName, sets: 3, reps: .countPerSide(10), tip: .Shared.exerciseBicycleCrunchTip, symbol: "figure.core.training"),
            exercise("russian-twist", .Shared.exerciseRussianTwistName, sets: 3, reps: .countPerSide(10), tip: .Shared.exerciseRussianTwistTip, symbol: "figure.core.training"),
            exercise("flutter-kick", .Shared.exerciseFlutterKickName, sets: 3, reps: .secondsRange(20, 30), tip: .Shared.exerciseFlutterKickTip, symbol: "figure.core.training"),
            exercise("plank", .Shared.exercisePlankName, sets: 3, reps: .secondsRange(20, 30), tip: .Shared.exercisePlankTip, symbol: "figure.core.training")
        ]
    )

    static let homeCardio = workout(
        id: "home-cardio", title: .Shared.courseHomeCardioTitle,
        subtitle: .Shared.courseHomeCardioSubtitle, minutes: 15,
        level: .Shared.courseLevelIntermediate, group: .home,
        exercises: [
            exercise("jumping-jack", .Shared.exerciseJumpingJackName, sets: 3, reps: .seconds(30), tip: .Shared.exerciseJumpingJackTip, symbol: "figure.arms.open"),
            exercise("wall-high-knees", .Shared.exerciseWallHighKneesName, sets: 3, reps: .seconds(30), tip: .Shared.exerciseWallHighKneesTip, symbol: "figure.walk"),
            exercise("mountain-climber", .Shared.exerciseMountainClimberName, sets: 3, reps: .seconds(30), tip: .Shared.exerciseMountainClimberTip, symbol: "figure.core.training"),
            exercise("jump-squat", .Shared.exerciseJumpSquatName, sets: 3, reps: .countRange(8, 10), tip: .Shared.exerciseJumpSquatTip, symbol: "figure.strengthtraining.traditional"),
            exercise("bear-crawl", .Shared.exerciseBearCrawlName, sets: 3, reps: .seconds(20), tip: .Shared.exerciseBearCrawlTip, symbol: "figure.walk"),
            exercise("bodyweight-burpee", .Shared.exerciseBodyweightBurpeeName, sets: 3, reps: .countRange(6, 8), tip: .Shared.exerciseBodyweightBurpeeTip, symbol: "figure.strengthtraining.traditional")
        ]
    )

    static let homeDumbbell = workout(
        id: "home-dumbbell", title: .Shared.courseHomeDumbbellTitle,
        subtitle: .Shared.courseHomeDumbbellSubtitle, minutes: 25,
        level: .Shared.courseLevelBeginner, group: .home,
        exercises: [
            exercise("dumbbell-goblet-squat", .Shared.exerciseDumbbellGobletSquatName, sets: 3, reps: .countRange(8, 10), tip: .Shared.exerciseDumbbellGobletSquatTip, symbol: "figure.strengthtraining.traditional"),
            exercise("dumbbell-floor-press", .Shared.exerciseDumbbellFloorPressName, sets: 3, reps: .countRange(8, 10), tip: .Shared.exerciseDumbbellFloorPressTip, symbol: "dumbbell.fill"),
            exercise("dumbbell-bent-over-row", .Shared.exerciseDumbbellBentOverRowName, sets: 3, reps: .countRange(8, 10), tip: .Shared.exerciseDumbbellBentOverRowTip, symbol: "arrow.left.and.right"),
            exercise("dumbbell-romanian-deadlift", .Shared.exerciseDumbbellRomanianDeadliftName, sets: 3, reps: .countRange(8, 10), tip: .Shared.exerciseDumbbellRomanianDeadliftTip, symbol: "figure.strengthtraining.traditional"),
            exercise("dumbbell-reverse-lunge", .Shared.exerciseDumbbellReverseLungeName, sets: 3, reps: .countPerSide(8), tip: .Shared.exerciseDumbbellReverseLungeTip, symbol: "figure.lunge"),
            exercise("dumbbell-lateral-raise", .Shared.exerciseDumbbellLateralRaiseName, sets: 3, reps: .countRange(10, 12), tip: .Shared.exerciseDumbbellLateralRaiseTip, symbol: "figure.arms.open")
        ]
    )

    static let gymFreeWeights = workout(
        id: "gym-free-weights", title: .Shared.courseGymFreeWeightsTitle,
        subtitle: .Shared.courseGymFreeWeightsSubtitle, minutes: 35,
        level: .Shared.courseLevelBeginner, group: .gym,
        exercises: [
            exercise("dumbbell-goblet-squat", .Shared.exerciseDumbbellGobletSquatName, sets: 3, reps: .countRange(8, 10), tip: .Shared.exerciseDumbbellGobletSquatTip, symbol: "figure.strengthtraining.traditional"),
            exercise("dumbbell-bench-press", .Shared.exerciseDumbbellBenchPressName, sets: 3, reps: .countRange(8, 10), tip: .Shared.exerciseDumbbellBenchPressTip, symbol: "dumbbell.fill"),
            exercise("dumbbell-bent-over-row", .Shared.exerciseDumbbellBentOverRowName, sets: 3, reps: .countRange(8, 10), tip: .Shared.exerciseDumbbellBentOverRowTip, symbol: "arrow.left.and.right"),
            exercise("dumbbell-romanian-deadlift", .Shared.exerciseDumbbellRomanianDeadliftName, sets: 3, reps: .countRange(8, 10), tip: .Shared.exerciseDumbbellRomanianDeadliftTip, symbol: "figure.strengthtraining.traditional"),
            exercise("dumbbell-seated-shoulder-press", .Shared.exerciseDumbbellSeatedShoulderPressName, sets: 3, reps: .countRange(8, 10), tip: .Shared.exerciseDumbbellSeatedShoulderPressTip, symbol: "dumbbell.fill"),
            exercise("dumbbell-biceps-curl", .Shared.exerciseDumbbellBicepsCurlName, sets: 3, reps: .countRange(10, 12), tip: .Shared.exerciseDumbbellBicepsCurlTip, symbol: "dumbbell.fill")
        ]
    )

    static let gymUpper = workout(
        id: "gym-upper", title: .Shared.courseGymUpperTitle,
        subtitle: .Shared.courseGymUpperSubtitle, minutes: 35,
        level: .Shared.courseLevelIntermediate, group: .gym,
        exercises: [
            exercise("machine-chest-press", .Shared.exerciseMachineChestPressName, sets: 3, reps: .countRange(8, 10), tip: .Shared.exerciseMachineChestPressTip, symbol: "dumbbell.fill"),
            exercise("machine-shoulder-press", .Shared.exerciseMachineShoulderPressName, sets: 3, reps: .countRange(8, 10), tip: .Shared.exerciseMachineShoulderPressTip, symbol: "dumbbell.fill"),
            exercise("machine-assisted-pull-up", .Shared.exerciseMachineAssistedPullUpName, sets: 3, reps: .countRange(6, 8), tip: .Shared.exerciseMachineAssistedPullUpTip, symbol: "arrow.down"),
            exercise("machine-pec-deck-fly", .Shared.exerciseMachinePecDeckFlyName, sets: 3, reps: .countRange(10, 12), tip: .Shared.exerciseMachinePecDeckFlyTip, symbol: "figure.arms.open"),
            exercise("cable-face-pull", .Shared.exerciseCableFacePullName, sets: 3, reps: .countRange(12, 15), tip: .Shared.exerciseCableFacePullTip, symbol: "arrow.left.and.right"),
            exercise("cable-rope-triceps-pushdown", .Shared.exerciseCableRopeTricepsPushdownName, sets: 3, reps: .countRange(10, 12), tip: .Shared.exerciseCableRopeTricepsPushdownTip, symbol: "arrow.down")
        ]
    )

    static let gymLower = workout(
        id: "gym-lower", title: .Shared.courseGymLowerTitle,
        subtitle: .Shared.courseGymLowerSubtitle, minutes: 35,
        level: .Shared.courseLevelIntermediate, group: .gym,
        exercises: [
            exercise("leg-press", .Shared.exerciseLegPressName, sets: 3, reps: .count(10), tip: .Shared.exerciseLegPressTip, symbol: "figure.strengthtraining.traditional"),
            exercise("machine-leg-extension", .Shared.exerciseMachineLegExtensionName, sets: 3, reps: .countRange(10, 12), tip: .Shared.exerciseMachineLegExtensionTip, symbol: "figure.strengthtraining.traditional"),
            exercise("machine-seated-leg-curl", .Shared.exerciseMachineSeatedLegCurlName, sets: 3, reps: .countRange(10, 12), tip: .Shared.exerciseMachineSeatedLegCurlTip, symbol: "figure.strengthtraining.traditional"),
            exercise("machine-seated-hip-abduction", .Shared.exerciseMachineSeatedHipAbductionName, sets: 3, reps: .countRange(12, 15), tip: .Shared.exerciseMachineSeatedHipAbductionTip, symbol: "figure.strengthtraining.traditional"),
            exercise("machine-seated-hip-adduction", .Shared.exerciseMachineSeatedHipAdductionName, sets: 3, reps: .countRange(12, 15), tip: .Shared.exerciseMachineSeatedHipAdductionTip, symbol: "figure.strengthtraining.traditional"),
            exercise("back-extension", .Shared.exerciseBackExtensionName, sets: 3, reps: .countRange(10, 12), tip: .Shared.exerciseBackExtensionTip, symbol: "figure.core.training")
        ]
    )

    static let stretchLower = workout(
        id: "stretch-lower", title: .Shared.courseStretchLowerTitle,
        subtitle: .Shared.courseStretchLowerSubtitle, minutes: 10,
        level: .Shared.courseLevelGentle, group: .stretch,
        exercises: [
            exercise("standing-hamstring-stretch", .Shared.exerciseStandingHamstringStretchName, sets: 2, reps: .secondsPerSide(20), tip: .Shared.exerciseStandingHamstringStretchTip, symbol: "figure.flexibility"),
            exercise("prone-quadriceps-stretch", .Shared.exerciseProneQuadricepsStretchName, sets: 2, reps: .secondsPerSide(20), tip: .Shared.exerciseProneQuadricepsStretchTip, symbol: "figure.flexibility"),
            exercise("supine-figure-four-glute-stretch", .Shared.exerciseSupineFigureFourGluteStretchName, sets: 2, reps: .secondsPerSide(20), tip: .Shared.exerciseSupineFigureFourGluteStretchTip, symbol: "figure.flexibility"),
            exercise("runners-lunge-stretch", .Shared.exerciseRunnersLungeStretchName, sets: 2, reps: .secondsPerSide(20), tip: .Shared.exerciseRunnersLungeStretchTip, symbol: "figure.lunge"),
            exercise("wall-standing-calf-stretch", .Shared.exerciseWallStandingCalfStretchName, sets: 2, reps: .secondsPerSide(20), tip: .Shared.exerciseWallStandingCalfStretchTip, symbol: "figure.flexibility")
        ]
    )

    static let stretchDesk = workout(
        id: "stretch-desk", title: .Shared.courseStretchDeskTitle,
        subtitle: .Shared.courseStretchDeskSubtitle, minutes: 8,
        level: .Shared.courseLevelGentle, group: .stretch,
        exercises: [
            exercise("neck-side-stretch", .Shared.exerciseNeckSideStretchName, sets: 2, reps: .secondsPerSide(15), tip: .Shared.exerciseNeckSideStretchTip, symbol: "figure.cooldown"),
            exercise("cross-body-shoulder-stretch", .Shared.exerciseCrossBodyShoulderStretchName, sets: 2, reps: .secondsPerSide(20), tip: .Shared.exerciseCrossBodyShoulderStretchTip, symbol: "figure.arms.open"),
            exercise("overhead-triceps-stretch", .Shared.exerciseOverheadTricepsStretchName, sets: 2, reps: .secondsPerSide(20), tip: .Shared.exerciseOverheadTricepsStretchTip, symbol: "figure.arms.open"),
            exercise("chair-seated-chest-and-shoulder-stretch", .Shared.exerciseChairSeatedChestAndShoulderStretchName, sets: 2, reps: .seconds(20), tip: .Shared.exerciseChairSeatedChestAndShoulderStretchTip, symbol: "figure.arms.open"),
            exercise("seated-chair-hamstring-stretch", .Shared.exerciseSeatedChairHamstringStretchName, sets: 2, reps: .secondsPerSide(20), tip: .Shared.exerciseSeatedChairHamstringStretchTip, symbol: "figure.flexibility")
        ]
    )

    static let morningWakeUp = workout(
        id: "morning-wake-up", title: .Shared.courseMorningWakeUpTitle,
        subtitle: .Shared.courseMorningWakeUpSubtitle, minutes: 8,
        level: .Shared.courseLevelGentle, group: .stretch,
        exercises: [
            exercise("worlds-greatest-stretch", .Shared.exerciseWorldsGreatestStretchName, sets: 2, reps: .countPerSide(4), tip: .Shared.exerciseWorldsGreatestStretchTip, symbol: "figure.lunge"),
            exercise("inchworm", .Shared.exerciseInchwormName, sets: 2, reps: .count(5), tip: .Shared.exerciseInchwormTip, symbol: "figure.flexibility"),
            exercise("bodyweight-good-morning", .Shared.exerciseBodyweightGoodMorningName, sets: 2, reps: .count(10), tip: .Shared.exerciseBodyweightGoodMorningTip, symbol: "figure.strengthtraining.traditional"),
            exercise("knees-to-chest-stretch", .Shared.exerciseKneesToChestStretchName, sets: 2, reps: .seconds(20), tip: .Shared.exerciseKneesToChestStretchTip, symbol: "figure.cooldown"),
            exercise("childs-pose", .Shared.exerciseChildsPoseName, sets: 2, reps: .seconds(30), tip: .Shared.exerciseChildsPoseTip, symbol: "figure.cooldown")
        ]
    )

    static let all = [
        home, homeIntermediate, homeStrength, homeCore, homeCardio, homeDumbbell,
        gym, gymFreeWeights, gymUpper, gymLower,
        mobility, stretchLower, stretchDesk, morningWakeUp
    ]

    static func courses(in group: WorkoutGroup) -> [Workout] {
        all.filter { $0.group == group }
    }

    static func recommended(for plan: PlanKind) -> Workout {
        switch plan {
        case .home: home
        case .gym: gym
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

    /// Returns the new entry, or `nil` when a value is out of range. The caller sends the entry
    /// to `HealthWriteStore`, so that Apple Health gets the same ID and date.
    @discardableResult
    func addBodyEntry(weight: Double, waist: Double) -> BodyEntry? {
        guard weight.isFinite, waist.isFinite else { return nil }
        guard (30...300).contains(weight), (30...250).contains(waist) else { return nil }

        let entry = BodyEntry(weight: weight, waist: waist)
        // The clock can move back, so a new entry is not always the latest one.
        let index = bodyEntries.lastIndex { $0.date <= entry.date }.map { $0 + 1 } ?? 0
        bodyEntries.insert(entry, at: index)
        persistIfNeeded()
        return entry
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
