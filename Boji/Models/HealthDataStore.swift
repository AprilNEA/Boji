import Foundation
import Observation

#if os(iOS) && canImport(HealthKit)
import HealthKit
#endif

/// The platform-neutral boundary for HealthKit reads.
///
/// Production uses `HealthKitDataProvider`. Tests can inject a provider without
/// importing HealthKit or touching a user's health database.
protocol HealthDataProvider: Sendable {
    var isAvailable: Bool { get }

    /// Requests only the read permission required by this data layer.
    func requestReadAuthorization() async throws

    func measurements(
        for metric: HealthMetric,
        since: Date,
        until: Date
    ) async throws -> [HealthMeasurement]

    func sleepSamples(since: Date, until: Date) async throws -> [HealthSleepSample]
}

protocol HealthDataStorePreferences: AnyObject {
    func bool(forKey defaultName: String) -> Bool
    func set(_ value: Bool, forKey defaultName: String)
    func removeObject(forKey defaultName: String)
}

extension UserDefaults: HealthDataStorePreferences {}

@MainActor
@Observable
final class HealthDataStore {
    private static let enabledDefaultsKey = "Boji.HealthDataStore.isEnabled"

    @ObservationIgnored private let provider: any HealthDataProvider
    @ObservationIgnored private let preferences: any HealthDataStorePreferences
    @ObservationIgnored private let calendar: Calendar
    @ObservationIgnored private let now: () -> Date
    @ObservationIgnored private var activeRefreshID: UUID?
    @ObservationIgnored private var operationGeneration = 0
    @ObservationIgnored private var isConnecting = false

    private(set) var isAvailable: Bool
    private(set) var isEnabled: Bool
    private(set) var isLoading = false
    private(set) var snapshot = HealthSnapshot()
    private(set) var lastSyncedAt: Date?
    private(set) var errorMessage: String?

    init(
        provider: any HealthDataProvider,
        preferences: any HealthDataStorePreferences = UserDefaults.standard,
        calendar: Calendar = .current,
        now: @escaping () -> Date = Date.init
    ) {
        self.provider = provider
        self.preferences = preferences
        self.calendar = calendar
        self.now = now
        self.isAvailable = provider.isAvailable
        self.isEnabled = preferences.bool(forKey: Self.enabledDefaultsKey)
    }

    /// Creates the app's read-only store. Every live store shares one HKHealthStore.
    static func live() -> HealthDataStore {
        #if os(iOS) && canImport(HealthKit)
        return HealthDataStore(provider: HealthKitDataProvider(healthStore: liveHealthStore))
        #else
        return HealthDataStore(provider: UnavailableHealthDataProvider())
        #endif
    }

    #if DEBUG
    /// UI-test-only store. It has in-memory preferences and never opens HealthKit.
    static func uiTesting() -> HealthDataStore {
        HealthDataStore(
            provider: EmptyHealthDataProvider(isAvailable: true),
            preferences: InMemoryHealthDataStorePreferences()
        )
    }
    #endif

    /// Call only from the user-initiated "Connect Apple Health" button.
    ///
    /// An authorization request completing does not prove read access. HealthKit
    /// can still return no samples, so a successful request only enables queries.
    func connect() async {
        guard isAvailable else {
            errorMessage = "此设备不支持 Apple 健康。"
            return
        }
        guard !isConnecting, !isLoading else { return }

        let generation = operationGeneration
        isConnecting = true
        defer {
            if operationGeneration == generation {
                isConnecting = false
            }
        }

        do {
            try await provider.requestReadAuthorization()
            guard isCurrent(generation) else { return }

            isEnabled = true
            preferences.set(true, forKey: Self.enabledDefaultsKey)
            errorMessage = nil
            await refresh()
        } catch {
            guard isCurrent(generation) else { return }
            clearSamples()
            errorMessage = "无法连接 Apple 健康：\(error.localizedDescription)"
        }
    }

    /// Replaces all in-memory samples from three concurrent read-only queries.
    /// This method never requests authorization.
    func refresh() async {
        guard isEnabled, !isLoading else { return }

        let refreshID = UUID()
        let generation = operationGeneration
        activeRefreshID = refreshID
        isLoading = true
        errorMessage = nil

        defer {
            if activeRefreshID == refreshID, isCurrent(generation) {
                isLoading = false
                activeRefreshID = nil
            }
        }

        let end = now()
        let start = calendar.date(byAdding: .day, value: -30, to: end)
            ?? end.addingTimeInterval(-30 * 24 * 60 * 60)

        do {
            async let weights = provider.measurements(for: .weight, since: start, until: end)
            async let waists = provider.measurements(for: .waist, since: start, until: end)
            async let sleep = provider.sleepSamples(since: start, until: end)
            let (weightResults, waistResults, sleepResults) = try await (weights, waists, sleep)

            guard activeRefreshID == refreshID, isCurrent(generation), isEnabled else { return }

            // HealthSnapshot removes invalid or duplicate UUIDs before this single
            // assignment publishes the complete replacement atomically.
            snapshot = HealthSnapshot(
                measurements: weightResults + waistResults,
                sleepSamples: sleepResults
            )
            lastSyncedAt = now()
            errorMessage = nil
        } catch {
            guard activeRefreshID == refreshID, isCurrent(generation) else { return }
            clearSamples()
            errorMessage = "无法读取 Apple 健康数据：\(error.localizedDescription)"
        }
    }

    /// Clears this app's query preference and in-memory copies only.
    /// It never changes system HealthKit authorization.
    func disconnect() {
        operationGeneration &+= 1
        activeRefreshID = nil
        isConnecting = false
        isLoading = false
        isEnabled = false
        preferences.removeObject(forKey: Self.enabledDefaultsKey)
        clearSamples()
        errorMessage = nil
    }

    private func isCurrent(_ generation: Int) -> Bool {
        operationGeneration == generation
    }

    private func clearSamples() {
        snapshot = HealthSnapshot()
        lastSyncedAt = nil
    }

    #if os(iOS) && canImport(HealthKit)
    private static let liveHealthStore = HKHealthStore()
    #endif
}

private final class InMemoryHealthDataStorePreferences: HealthDataStorePreferences {
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

private final class EmptyHealthDataProvider: HealthDataProvider, @unchecked Sendable {
    let isAvailable: Bool

    init(isAvailable: Bool) {
        self.isAvailable = isAvailable
    }

    func requestReadAuthorization() async throws {}

    func measurements(
        for metric: HealthMetric,
        since: Date,
        until: Date
    ) async throws -> [HealthMeasurement] {
        []
    }

    func sleepSamples(since: Date, until: Date) async throws -> [HealthSleepSample] {
        []
    }
}

private final class UnavailableHealthDataProvider: HealthDataProvider, @unchecked Sendable {
    let isAvailable = false

    func requestReadAuthorization() async throws {}

    func measurements(
        for metric: HealthMetric,
        since: Date,
        until: Date
    ) async throws -> [HealthMeasurement] {
        []
    }

    func sleepSamples(since: Date, until: Date) async throws -> [HealthSleepSample] {
        []
    }
}

#if os(iOS) && canImport(HealthKit)
private final class HealthKitDataProvider: HealthDataProvider, @unchecked Sendable {
    private let healthStore: HKHealthStore
    private let bodyMassType = HKQuantityType.quantityType(forIdentifier: .bodyMass)!
    private let waistType = HKQuantityType.quantityType(forIdentifier: .waistCircumference)!
    private let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!

    var isAvailable: Bool {
        HKHealthStore.isHealthDataAvailable()
    }

    init(healthStore: HKHealthStore) {
        self.healthStore = healthStore
    }

    func requestReadAuthorization() async throws {
        let typesToRead: Set<HKObjectType> = [bodyMassType, waistType, sleepType]
        let typesToShare = Set<HKSampleType>()
        try await healthStore.requestAuthorization(toShare: typesToShare, read: typesToRead)
    }

    func measurements(
        for metric: HealthMetric,
        since: Date,
        until: Date
    ) async throws -> [HealthMeasurement] {
        let type: HKQuantityType
        let unit: HKUnit

        switch metric {
        case .weight:
            type = bodyMassType
            unit = .gramUnit(with: .kilo)
        case .waist:
            type = waistType
            unit = .meterUnit(with: .centi)
        }

        let samples = try await samples(for: type, since: since, until: until)
        return samples.compactMap { sample in
            guard let quantitySample = sample as? HKQuantitySample else { return nil }
            return HealthMeasurement(
                id: quantitySample.uuid,
                metric: metric,
                value: quantitySample.quantity.doubleValue(for: unit),
                date: quantitySample.startDate,
                sourceName: quantitySample.sourceRevision.source.name,
                sourceBundleIdentifier: quantitySample.sourceRevision.source.bundleIdentifier
            )
        }
    }

    func sleepSamples(since: Date, until: Date) async throws -> [HealthSleepSample] {
        let samples = try await samples(for: sleepType, since: since, until: until)
        return samples.compactMap { sample in
            guard let categorySample = sample as? HKCategorySample,
                  let stage = sleepStage(for: categorySample.value)
            else {
                return nil
            }

            return HealthSleepSample(
                id: categorySample.uuid,
                start: categorySample.startDate,
                end: categorySample.endDate,
                stage: stage,
                sourceName: categorySample.sourceRevision.source.name,
                sourceBundleIdentifier: categorySample.sourceRevision.source.bundleIdentifier
            )
        }
    }

    private func samples(
        for type: HKSampleType,
        since: Date,
        until: Date
    ) async throws -> [HKSample] {
        let predicate = HKQuery.predicateForSamples(
            withStart: since,
            end: until,
            options: .strictStartDate
        )
        let sortDescriptors = [
            NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        ]

        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: type,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: sortDescriptors
            ) { _, results, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: results ?? [])
                }
            }
            healthStore.execute(query)
        }
    }

    private func sleepStage(for value: Int) -> HealthSleepStage? {
        switch HKCategoryValueSleepAnalysis(rawValue: value) {
        case .inBed:
            return .inBed
        case .awake:
            return .awake
        case .asleepUnspecified, .asleepCore, .asleepDeep, .asleepREM:
            return .asleep
        default:
            return nil
        }
    }
}
#endif
