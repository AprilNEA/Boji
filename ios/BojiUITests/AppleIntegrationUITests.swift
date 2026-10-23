import XCTest

@MainActor
final class AppleIntegrationUITests: XCTestCase {
    func testHealthConnectionIsOptionalAndShowsNoInventedData() {
        let app = openHealthSettings()
        XCTAssertTrue(app.buttons["health-connect"].waitForExistence(timeout: 5))
        app.buttons["health-connect"].tap()
        XCTAssertTrue(app.staticTexts["已开启健康数据查询"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["暂无可读取数据"].firstMatch.exists)
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "health-read-empty-state"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    func testHealthWritingIsOptionalAndAsksBeforeDeletingSavedData() {
        let app = openHealthSettings()
        let toggle = app.switches["health-write-toggle"]
        XCTAssertTrue(toggle.waitForExistence(timeout: 5))
        XCTAssertEqual(toggle.value as? String, "0")

        toggle.switches.firstMatch.tap()
        XCTAssertTrue(app.staticTexts["已允许"].firstMatch.waitForExistence(timeout: 5))
        XCTAssertEqual(toggle.value as? String, "1")
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "health-write-enabled"
        attachment.lifetime = .keepAlways
        add(attachment)

        toggle.switches.firstMatch.tap()
        let keep = app.buttons["停止写入，保留已写入的数据"]
        XCTAssertTrue(keep.waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["停止写入，并删除薄肌写入的数据"].exists)
        keep.tap()
        XCTAssertFalse(app.staticTexts["已允许"].firstMatch.waitForExistence(timeout: 2))
        XCTAssertEqual(toggle.value as? String, "0")
    }

    private func openHealthSettings() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["--uitesting", "-AppleLanguages", "(zh-Hans)", "-AppleLocale", "zh_CN"]
        app.launch()
        XCTAssertTrue(app.buttons["开始我的计划"].waitForExistence(timeout: 10))
        app.buttons["开始我的计划"].tap()
        app.buttons["设置"].tap()
        let health = app.buttons["health-settings"]
        XCTAssertTrue(health.waitForExistence(timeout: 5))
        health.tap()
        return app
    }
}
