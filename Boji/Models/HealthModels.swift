import Foundation

enum HealthMetric: String, Codable, Sendable {
    case weight
    case waist
}

struct HealthMeasurement: Identifiable, Equatable, Sendable {
    let id: UUID
    let metric: HealthMetric
    /// Kilograms for `.weight`, centimetres for `.waist`.
    let value: Double
    let date: Date
    let sourceName: String
    let sourceBundleIdentifier: String
}

enum HealthSleepStage: String, Codable, Sendable {
    case asleep
    case awake
    case inBed
}

struct HealthSleepSample: Identifiable, Equatable, Sendable {
    let id: UUID
    let start: Date
    let end: Date
    let stage: HealthSleepStage
    let sourceName: String
    let sourceBundleIdentifier: String
}

struct HealthSnapshot: Equatable, Sendable {
    var measurements: [HealthMeasurement] = []
    var sleepSamples: [HealthSleepSample] = []

    init(
        measurements: [HealthMeasurement] = [],
        sleepSamples: [HealthSleepSample] = []
    ) {
        let now = Date()
        self.measurements = Self.validMeasurements(measurements, now: now)
        self.sleepSamples = Self.validSleepSamples(sleepSamples)
    }

    /// Returns the newest valid measurement for one metric.
    ///
    /// Measurements in the future, non-finite values, zero or negative values,
    /// and duplicate UUIDs are ignored. The first UUID received is retained.
    func latest(_ metric: HealthMetric) -> HealthMeasurement? {
        let candidates = Self.validMeasurements(measurements, now: Date())
            .filter { $0.metric == metric }

        return candidates.sorted {
            if $0.date != $1.date {
                return $0.date > $1.date
            }
            return $0.id.uuidString < $1.id.uuidString
        }.first
    }

    /// Returns asleep hours in the sleep day ending at 18:00 local time.
    ///
    /// The sleep day starts at 18:00 on the preceding calendar day. Calendar
    /// arithmetic preserves correct boundaries across daylight-saving changes.
    /// Awake and in-bed samples do not reduce or add sleep time.
    func sleepHours(endingOn date: Date, calendar: Calendar = .current) -> Double? {
        guard let dayEnd = calendar.date(
            bySettingHour: 18,
            minute: 0,
            second: 0,
            of: date
        ), let dayStart = calendar.date(byAdding: .day, value: -1, to: dayEnd) else {
            return nil
        }

        let intervals = Self.validSleepSamples(sleepSamples)
            .lazy
            .filter { $0.stage == .asleep }
            .compactMap { sample -> (start: Date, end: Date)? in
                let clippedStart = max(sample.start, dayStart)
                let clippedEnd = min(sample.end, dayEnd)
                guard clippedStart < clippedEnd else { return nil }
                return (clippedStart, clippedEnd)
            }
            .sorted {
                if $0.start != $1.start {
                    return $0.start < $1.start
                }
                return $0.end < $1.end
            }

        guard var current = intervals.first else { return nil }

        var total = 0.0
        for interval in intervals.dropFirst() {
            if interval.start <= current.end {
                current.end = max(current.end, interval.end)
            } else {
                total += current.end.timeIntervalSince(current.start)
                current = interval
            }
        }
        total += current.end.timeIntervalSince(current.start)

        return total / 3_600
    }

    private static func validMeasurements(
        _ values: [HealthMeasurement],
        now: Date
    ) -> [HealthMeasurement] {
        var identifiers = Set<UUID>()

        return values.filter { measurement in
            guard identifiers.insert(measurement.id).inserted else { return false }
            guard measurement.value.isFinite, measurement.value > 0 else { return false }
            guard measurement.date.timeIntervalSinceReferenceDate.isFinite else { return false }
            return measurement.date <= now
        }
    }

    private static func validSleepSamples(_ values: [HealthSleepSample]) -> [HealthSleepSample] {
        var identifiers = Set<UUID>()

        return values.filter { sample in
            guard identifiers.insert(sample.id).inserted else { return false }
            guard sample.start.timeIntervalSinceReferenceDate.isFinite else { return false }
            guard sample.end.timeIntervalSinceReferenceDate.isFinite else { return false }
            return sample.start < sample.end
        }
    }
}
