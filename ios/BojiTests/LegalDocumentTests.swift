#if DEBUG
import Foundation
import XCTest
@testable import Boji

final class LegalDocumentTests: XCTestCase {
    func testChineseLocalesOpenTheChinesePages() {
        for identifier in ["zh-Hans", "zh_CN", "zh-Hant-TW"] {
            let locale = Locale(identifier: identifier)
            XCTAssertEqual(LegalDocument.privacyPolicy.url(for: locale).absoluteString, "https://leanmuscle.club/privacy/")
            XCTAssertEqual(LegalDocument.termsOfUse.url(for: locale).absoluteString, "https://leanmuscle.club/terms/")
        }
    }

    func testOtherLocalesOpenTheEnglishPages() {
        for identifier in ["en", "en_US", "ja_JP", "de"] {
            let locale = Locale(identifier: identifier)
            XCTAssertEqual(LegalDocument.privacyPolicy.url(for: locale).absoluteString, "https://leanmuscle.club/en/privacy/")
            XCTAssertEqual(LegalDocument.termsOfUse.url(for: locale).absoluteString, "https://leanmuscle.club/en/terms/")
        }
    }
}
#endif
