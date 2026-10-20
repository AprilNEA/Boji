import Foundation
import XCTest
@testable import Boji

@MainActor
final class HealthDataStoreTests: XCTestCase {
    func testConnectRequestsReadAuthorizationAndRefreshesIndependentMetrics() async {
        let weight = measurement(metric: .weight, value: 68.2, date: fixedDate)
        let provider = StubHealthDataProvider(
            measurements: [.weight: [weight], .waist: []],
            sleepSamples: []
        )
        let store = makeStore(provider: provider)

        await store.connect()

        XCTAssertTrue(store.isAvailable)
        XCTAssertTrue(store.isEnabled)
        XCTAssertEqual(provider.authorizationRequestCount, 1)
        XCTAssertEqual(Set(provider.measurementRequestMetrics), Set(["weight", "waist"]))
        XCTAssertEqual(provider.sleepRequestCount, 1)
        XCTAssertEqual(store.snapshot.measurements, [weight])
        XCTAssertNil(store.snapshot.latest(.waist))
        XCTAssertEqual(store.lastSyncedAt, fixedDate)
        XCTAssertNil(store.errorMessage)
    }

    func testAuthorizationErrorDoesNotEnableOrQuery() async {
        let provider = StubHealthDataProvider(
            measurements: [.weight: [], .waist: []],
            sleepSamples: []
        )
        provider.setAuthorizationFailureMessage("authorization denied")
        let store = makeStore(provider: provider)

        await store.connect()

        XCTAssertFalse(store.isEnabled)
        XCTAssertEqual(provider.authorizationRequestCount, 1)
        XCTAssertTrue(provider.measurementRequestMetrics.isEmpty)
        XCTAssertEqual(provider.sleepRequestCount, 0)
        XCTAssertNil(store.lastSyncedAt)
        XCTAssertTrue(store.errorMessage?.contains("authorization denied") == true)
    }

    func testRefreshWithEmptyResultsAtomicallyReplacesExistingSamples() async {
        let weight = measurement(metric: .weight, value: 70, date: fixedDate)
        let sleep = sleep(start: "2025-01-09 22:00", end: "2025-01-10 06:00")
        let provider = StubHealthDataProvider(
            measurements: [.weight: [weight], .waist: []],
            sleepSamples: [sleep]
        )
        let store = makeStore(provider: provider)

        await store.connect()
        XCTAssertEqual(store.snapshot.measurements, [weight])
        XCTAssertEqual(store.snapshot.sleepSamples, [sleep])

        provider.setMeasurements([.weight: [], .waist: []])
        provider.setSleepSamples([])
        await store.refresh()

        XCTAssertTrue(store.snapshot.measurements.isEmpty)
        XCTAssertTrue(store.snapshot.sleepSamples.isEmpty)
        XCTAssertEqual(store.lastSyncedAt, fixedDate)
        XCTAssertNil(store.errorMessage)
    }

    func testQueryErrorClearsStaleSamplesAndLastSync() async {
        let provider = StubHealthDataProvider(
            measurements: [.weight: [measurement(metric: .weight, value: 72, date: fixedDate)], .waist: []],
            sleepSamples: []
        )
        let store = makeStore(provider: provider)
        await store.connect()
        XCTAssertFalse(store.snapshot.measurements.isEmpty)

        provider.setFailureMessage("query failed")
        await store.refresh()

        XCTAssertTrue(store.isEnabled)
        XCTAssertTrue(store.snapshot.measurements.isEmpty)
        XCTAssertTrue(store.snapshot.sleepSamples.isEmpty)
        XCTAssertNil(store.lastSyncedAt)
        XCTAssertTrue(store.errorMessage?.contains("query failed") == true)
    }

    func testDisabledRefreshDoesNotAuthorizeOrQuery() async {
        let provider = StubHealthDataProvider(
            measurements: [.weight: [measurement(metric: .weight, value: 66, date: fixedDate)], .waist: []],
            sleepSamples: []
        )
        let store = makeStore(provider: provider)

        await store.refresh()

        XCTAssertFalse(store.isEnabled)
        XCTAssertEqual(provider.authorizationRequestCount, 0)
        XCTAssertTrue(provider.measurementRequestMetrics.isEmpty)
        XCTAssertEqual(provider.sleepRequestCount, 0)
        XCTAssertTrue(store.snapshot.measurements.isEmpty)
        XCTAssertNil(store.lastSyncedAt)
    }

    func testDisconnectInvalidatesAnInFlightRefresh() async {
        let original = measurement(metric: .weight, value: 72, date: fixedDate)
        let delayed = measurement(metric: .weight, value: 66, date: fixedDate)
        let provider = StubHealthDataProvider(
            measurements: [.weight: [original], .waist: []],
            sleepSamples: []
        )
        let preferences = TestHealthPreferences()
        let store = makeStore(provider: provider, preferences: preferences)
        await store.connect()
        XCTAssertEqual(store.snapshot.measurements, [original])

        provider.setMeasurements([.weight: [delayed], .waist: []])
        provider.setQueryDelay(nanoseconds: 200_000_000)
        let refreshTask = Task { @MainActor in
            await store.refresh()
        }
        await provider.waitForQueryCount(atLeast: 3)
        XCTAssertTrue(store.isLoading)

        store.disconnect()
        await refreshTask.value

        XCTAssertFalse(store.isEnabled)
        XCTAssertFalse(store.isLoading)
        XCTAssertTrue(store.snapshot.measurements.isEmpty)
        XCTAssertTrue(store.snapshot.sleepSamples.isEmpty)
        XCTAssertNil(store.lastSyncedAt)
        XCTAssertNil(store.errorMessage)

        let reloaded = makeStore(provider: provider, preferences: preferences)
        XCTAssertFalse(reloaded.isEnabled)
        XCTAssertTrue(reloaded.snapshot.measurements.isEmpty)
    }

    func testConcurrentRefreshDoesNotStartDuplicateQueries() async {
        let provider = StubHealthDataProvider(
            measurements: [.weight: [], .waist: []],
            sleepSamples: []
        )
        let store = makeStore(provider: provider)
        await store.connect()

        provider.resetRequestCounts()
        provider.setQueryDelay(nanoseconds: 200_000_000)
        let firstRefresh = Task { @MainActor in
            await store.refresh()
        }
        await provider.waitForQueryCount(atLeast: 3)
        await store.refresh()
        await firstRefresh.value

        XCTAssertEqual(provider.measurementRequestMetrics.count, 2)
        XCTAssertEqual(provider.sleepRequestCount, 1)
        XCTAssertFalse(store.isLoading)
    }

    func testOnlyEnabledFlagPersistsAndHealthSamplesDoNotPersist() async {
        let weight = measurement(metric: .weight, value: 64, date: fixedDate)
        let provider = StubHealthDataProvider(
            measurements: [.weight: [weight], .waist: []],
            sleepSamples: []
        )
        let preferences = TestHealthPreferences()
        let connected = makeStore(provider: provider, preferences: preferences)

        await connected.connect()
        XCTAssertTrue(connected.isEnabled)
        XCTAssertEqual(connected.snapshot.measurements, [weight])

        let reloaded = makeStore(provider: provider, preferences: preferences)
        XCTAssertTrue(reloaded.isEnabled)
        XCTAssertTrue(reloaded.snapshot.measurements.isEmpty)
        XCTAssertTrue(reloaded.snapshot.sleepSamples.isEmpty)
        XCTAssertNil(reloaded.lastSyncedAt)

        connected.disconnect()
        let disconnected = makeStore(provider: provider, preferences: preferences)
        XCTAssertFalse(disconnected.isEnabled)
    }

    func testUnavailableStoreDoesNotRequestAuthorization() async {
        let provider = StubHealthDataProvider(
            isAvailable: false,
            measurements: [.weight: [], .waist: []],
            sleepSamples: []
        )
        let store = makeStore(provider: provider)

        await store.connect()

        XCTAssertFalse(store.isAvailable)
        XCTAssertFalse(store.isEnabled)
        XCTAssertEqual(provider.authorizationRequestCount, 0)
        XCTAssertTrue(store.errorMessage?.contains("不支持") == true)
    }

    #if DEBUG
    func testUITestingFactoryUsesFreshInMemoryDependencies() async {
        let first = HealthDataStore.uiTesting()
        await first.connect()
        XCTAssertTrue(first.isAvailable)
        XCTAssertTrue(first.isEnabled)
        XCTAssertTrue(first.snapshot.measurements.isEmpty)

        let second = HealthDataStore.uiTesting()
        XCTAssertFalse(second.isEnabled)
        XCTAssertTrue(second.snapshot.measurements.isEmpty)
    }
    #endif

    private var fixedDate: Date {
        date("2025-01-10 12:00")
    }

    private func makeStore(
        provider: StubHealthDataProvider,
        preferences: TestHealthPreferences = TestHealthPreferences()
    ) -> HealthDataStore {
        HealthDataStore(
            provider: provider,
            preferences: preferences,
            calendar: utcCalendar,
            now: { self.fixedDate }
        )
    }

    private var utcCalendar: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        return calendar
    }

    private func measurement(
        metric: HealthMetric,
        value: Double,
        date: Date
    ) -> HealthMeasurement {
        HealthMeasurement(
            id: UUID(),
            metric: metric,
            value: value,
            date: date,
            sourceName: "Test source",
            sourceBundleIdentifier: "com.example.test"
        )
    }

    private func sleep(start: String, end: String) -> HealthSleepSample {
        HealthSleepSample(
            id: UUID(),
            start: date(start),
            end: date(end),
            stage: .asleep,
            sourceName: "Test source",
            sourceBundleIdentifier: "com.example.test"
        )
    }

    private func date(_ value: String) -> Date {
        let formatter = DateFormatter()
        formatter.calendar = utcCalendar
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = utcCalendar.timeZone
        formatter.dateFormat = "yyyy-MM-dd HH:mm"
        return formatter.date(from: value)!
    }
}

private final class TestHealthPreferences: HealthDataStorePreferences {
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

private final class StubHealthDataProvider: HealthDataProvider, @unchecked Sendable {
    let isAvailable: Bool

    private let lock = NSLock()
    private var storedMeasurements: [HealthMetric: [HealthMeasurement]]
    private var storedSleepSamples: [HealthSleepSample]
    private var failureMessage: String?
    private var authorizationFailureMessage: String?
    private var delayNanoseconds: UInt64 = 0
    private var authorizationRequests = 0
    private var requestedMetrics: [HealthMetric] = []
    private var sleepRequests = 0

    init(
        isAvailable: Bool = true,
        measurements: [HealthMetric: [HealthMeasurement]],
        sleepSamples: [HealthSleepSample]
    ) {
        self.isAvailable = isAvailable
        self.storedMeasurements = measurements
        self.storedSleepSamples = sleepSamples
    }

    var authorizationRequestCount: Int {
        withLock { authorizationRequests }
    }

    var measurementRequestMetrics: [String] {
        withLock { requestedMetrics.map(\.rawValue) }
    }

    var sleepRequestCount: Int {
        withLock { sleepRequests }
    }

    func setMeasurements(_ measurements: [HealthMetric: [HealthMeasurement]]) {
        withLock {
            storedMeasurements = measurements
        }
    }

    func setSleepSamples(_ samples: [HealthSleepSample]) {
        withLock {
            storedSleepSamples = samples
        }
    }

    func setFailureMessage(_ message: String?) {
        withLock {
            failureMessage = message
        }
    }

    func setAuthorizationFailureMessage(_ message: String?) {
        withLock {
            authorizationFailureMessage = message
        }
    }

    func setQueryDelay(nanoseconds: UInt64) {
        withLock {
            delayNanoseconds = nanoseconds
        }
    }

    func resetRequestCounts() {
        withLock {
            requestedMetrics = []
            sleepRequests = 0
        }
    }

    func waitForQueryCount(atLeast minimum: Int) async {
        for _ in 0..<100 {
            let count = withLock { requestedMetrics.count + sleepRequests }
            if count >= minimum { return }
            try? await Task.sleep(nanoseconds: 5_000_000)
        }
    }

    func requestReadAuthorization() async throws {
        let failure = withLock { () -> String? in
            authorizationRequests += 1
            return authorizationFailureMessage
        }
        if let failure {
            throw StubHealthProviderError(message: failure)
        }
    }

    func measurements(
        for metric: HealthMetric,
        since: Date,
        until: Date
    ) async throws -> [HealthMeasurement] {
        let response = withLock { () -> (UInt64, String?, [HealthMeasurement]) in
            requestedMetrics.append(metric)
            return (delayNanoseconds, failureMessage, storedMeasurements[metric] ?? [])
        }
        if response.0 > 0 {
            try? await Task.sleep(nanoseconds: response.0)
        }
        if let failure = response.1 {
            throw StubHealthProviderError(message: failure)
        }
        return response.2
    }

    func sleepSamples(since: Date, until: Date) async throws -> [HealthSleepSample] {
        let response = withLock { () -> (UInt64, String?, [HealthSleepSample]) in
            sleepRequests += 1
            return (delayNanoseconds, failureMessage, storedSleepSamples)
        }
        if response.0 > 0 {
            try? await Task.sleep(nanoseconds: response.0)
        }
        if let failure = response.1 {
            throw StubHealthProviderError(message: failure)
        }
        return response.2
    }

    private func withLock<T>(_ body: () -> T) -> T {
        lock.lock()
        defer { lock.unlock() }
        return body()
    }
}

private struct StubHealthProviderError: LocalizedError {
    let message: String

    var errorDescription: String? {
        message
    }
}
