import XCTest

@MainActor
final class AppleIntegrationUITests: XCTestCase {
    func testHealthConnectionIsOptionalAndShowsNoInventedData() {
        let app = XCUIApplication()
        app.launchArguments = ["--uitesting", "-AppleLanguages", "(zh-Hans)", "-AppleLocale", "zh_CN"]
        app.launch()
        XCTAssertTrue(app.buttons["开始我的计划"].waitForExistence(timeout: 10))
        app.buttons["开始我的计划"].tap()
        app.buttons["设置"].tap()
        let health = app.buttons["health-settings"]
        XCTAssertTrue(health.waitForExistence(timeout: 5))
        health.tap()
        XCTAssertTrue(app.buttons["health-connect"].waitForExistence(timeout: 5))
        app.buttons["health-connect"].tap()
        XCTAssertTrue(app.staticTexts["已开启健康数据查询"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["暂无可读取数据"].firstMatch.exists)
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "health-read-only-empty-state"
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
