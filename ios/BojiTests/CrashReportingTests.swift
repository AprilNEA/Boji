import XCTest
@testable import Boji

final class CrashReportingTests: XCTestCase {
    func testEmptyOrMissingDSNKeepsReportingOff() {
        XCTAssertNil(CrashReporting.configuredDSN(nil))
        XCTAssertNil(CrashReporting.configuredDSN(""))
        XCTAssertNil(CrashReporting.configuredDSN("  \n"))
    }

    func testDSNMustBeHTTPSWithPublicKeyAndHost() {
        XCTAssertNil(CrashReporting.configuredDSN("http://public@o1.ingest.sentry.io/2"))
        XCTAssertNil(CrashReporting.configuredDSN("https://o1.ingest.sentry.io/2"))
        XCTAssertNil(CrashReporting.configuredDSN("not a dsn"))
        XCTAssertEqual(
            CrashReporting.configuredDSN(" https://public@o1.ingest.sentry.io/2 "),
            "https://public@o1.ingest.sentry.io/2"
        )
    }
}
