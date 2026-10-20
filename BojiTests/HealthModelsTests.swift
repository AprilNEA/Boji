import Foundation
import XCTest
@testable import Boji

final class HealthModelsTests: XCTestCase {
    func testLatestKeepsMetricsIndependentAndSelectsNewest() throws {
        let olderWeight = measurement(metric: .weight, value: 70, date: date("2025-01-02 08:00"))
        let newerWeight = measurement(metric: .weight, value: 69.4, date: date("2025-01-03 08:00"))
        let waist = measurement(metric: .waist, value: 80, date: date("2025-01-04 08:00"))
        let snapshot = HealthSnapshot(measurements: [olderWeight, waist, newerWeight])

        XCTAssertEqual(snapshot.latest(.weight), newerWeight)
        XCTAssertEqual(snapshot.latest(.waist), waist)
    }

    func testSnapshotRejectsInvalidFutureAndDuplicateMeasurements() {
        let id = UUID()
        let valid = measurement(
            id: id,
            metric: .weight,
            value: 68,
            date: date("2025-01-02 08:00")
        )
        let duplicate = measurement(
            id: id,
            metric: .weight,
            value: 66,
            date: date("2025-01-03 08:00")
        )
        let invalidZero = measurement(metric: .waist, value: 0, date: date("2025-01-02 08:00"))
        let invalidNaN = measurement(metric: .waist, value: .nan, date: date("2025-01-02 08:00"))
        let future = measurement(
            metric: .waist,
            value: 75,
            date: Date.distantFuture
        )

        let snapshot = HealthSnapshot(
            measurements: [valid, duplicate, invalidZero, invalidNaN, future]
        )

        XCTAssertEqual(snapshot.measurements, [valid])
        XCTAssertEqual(snapshot.latest(.weight), valid)
        XCTAssertNil(snapshot.latest(.waist))
    }

    func testSleepHoursClipsToSleepDayAndUnionsAllSources() throws {
        let endingOn = date("2025-01-10 09:30")
        let snapshot = HealthSnapshot(sleepSamples: [
            sleep(start: "2025-01-09 17:00", end: "2025-01-09 19:00", stage: .asleep),
            sleep(start: "2025-01-09 18:30", end: "2025-01-09 20:00", stage: .asleep),
            sleep(start: "2025-01-09 19:45", end: "2025-01-09 21:00", stage: .asleep),
            sleep(start: "2025-01-10 17:30", end: "2025-01-10 19:00", stage: .asleep),
            sleep(start: "2025-01-09 18:00", end: "2025-01-10 18:00", stage: .awake),
            sleep(start: "2025-01-09 18:00", end: "2025-01-10 18:00", stage: .inBed)
        ])

        let hours = try XCTUnwrap(snapshot.sleepHours(endingOn: endingOn, calendar: utcCalendar))

        // 18:00–21:00 plus 17:30–18:00 on the ending date.
        XCTAssertEqual(hours, 3.5, accuracy: 0.000_001)
    }

    func testSleepHoursExcludesInvalidIntervalsAndDuplicateUUIDs() throws {
        let duplicateID = UUID()
        let kept = sleep(
            id: duplicateID,
            start: "2025-01-09 22:00",
            end: "2025-01-10 02:00",
            stage: .asleep
        )
        let duplicate = sleep(
            id: duplicateID,
            start: "2025-01-09 22:00",
            end: "2025-01-10 06:00",
            stage: .asleep
        )
        let invalid = sleep(
            start: "2025-01-10 07:00",
            end: "2025-01-10 06:00",
            stage: .asleep
        )
        let snapshot = HealthSnapshot(sleepSamples: [kept, duplicate, invalid])

        XCTAssertEqual(snapshot.sleepSamples, [kept])
        XCTAssertEqual(
            try XCTUnwrap(snapshot.sleepHours(endingOn: date("2025-01-10 12:00"), calendar: utcCalendar)),
            4,
            accuracy: 0.000_001
        )
    }

    func testSleepHoursReturnsNilWithoutAsleepIntervals() {
        let snapshot = HealthSnapshot(sleepSamples: [
            sleep(start: "2025-01-09 22:00", end: "2025-01-10 06:00", stage: .awake),
            sleep(start: "2025-01-09 21:00", end: "2025-01-10 07:00", stage: .inBed)
        ])

        XCTAssertNil(snapshot.sleepHours(endingOn: date("2025-01-10 12:00"), calendar: utcCalendar))
    }

    func testSleepDayUsesCalendarBoundariesAcrossDaylightSavingTime() throws {
        var losAngeles = Calendar(identifier: .gregorian)
        losAngeles.timeZone = try XCTUnwrap(TimeZone(identifier: "America/Los_Angeles"))
        let endingOn = makeDate(
            year: 2025,
            month: 3,
            day: 9,
            hour: 8,
            minute: 0,
            calendar: losAngeles
        )
        let startsAtSleepDayBoundary = makeDate(
            year: 2025,
            month: 3,
            day: 8,
            hour: 18,
            minute: 0,
            calendar: losAngeles
        )
        let endsAtSleepDayBoundary = makeDate(
            year: 2025,
            month: 3,
            day: 9,
            hour: 18,
            minute: 0,
            calendar: losAngeles
        )
        let snapshot = HealthSnapshot(sleepSamples: [
            HealthSleepSample(
                id: UUID(),
                start: startsAtSleepDayBoundary,
                end: endsAtSleepDayBoundary,
                stage: .asleep,
                sourceName: "Watch",
                sourceBundleIdentifier: "com.apple.health"
            )
        ])

        let hours = try XCTUnwrap(snapshot.sleepHours(endingOn: endingOn, calendar: losAngeles))

        // The spring-forward sleep day has 23 elapsed hours, not 24.
        XCTAssertEqual(hours, 23, accuracy: 0.000_001)
    }

    private var utcCalendar: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        return calendar
    }

    private func measurement(
        id: UUID = UUID(),
        metric: HealthMetric,
        value: Double,
        date: Date
    ) -> HealthMeasurement {
        HealthMeasurement(
            id: id,
            metric: metric,
            value: value,
            date: date,
            sourceName: "Apple Watch",
            sourceBundleIdentifier: "com.apple.health"
        )
    }

    private func sleep(
        id: UUID = UUID(),
        start: String,
        end: String,
        stage: HealthSleepStage
    ) -> HealthSleepSample {
        HealthSleepSample(
            id: id,
            start: date(start),
            end: date(end),
            stage: stage,
            sourceName: "Apple Watch",
            sourceBundleIdentifier: "com.apple.health"
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

    private func makeDate(
        year: Int,
        month: Int,
        day: Int,
        hour: Int,
        minute: Int,
        calendar: Calendar
    ) -> Date {
        calendar.date(
            from: DateComponents(
                timeZone: calendar.timeZone,
                year: year,
                month: month,
                day: day,
                hour: hour,
                minute: minute
            )
        )!
    }
}
