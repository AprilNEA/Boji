import XCTest

@MainActor
final class BojiUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["--uitesting", "-AppleLanguages", "(zh-Hans)", "-AppleLocale", "zh_CN"]
        app.launch()
    }

    private func onboard() {
        let start = app.buttons["开始我的计划"]
        XCTAssertTrue(start.waitForExistence(timeout: 10))
        start.tap()
        XCTAssertTrue(app.tabBars.buttons["今天"].waitForExistence(timeout: 5))
    }

    private func button(containing text: String) -> XCUIElement {
        app.buttons.matching(NSPredicate(format: "label CONTAINS %@", text)).firstMatch
    }

    private func tapVisible(_ element: XCUIElement) {
        XCTAssertTrue(element.waitForExistence(timeout: 5))
        for _ in 0..<5 where !element.isHittable { app.swipeUp() }
        XCTAssertTrue(element.isHittable)
        element.tap()
    }

    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    func testOnboardingAndHabits() {
        onboard()
        tapVisible(button(containing: "好好喝水"))
        tapVisible(app.buttons["保存"])
        XCTAssertTrue(button(containing: "250mL").waitForExistence(timeout: 5))
        tapVisible(button(containing: "好好睡觉"))
        tapVisible(app.buttons["保存"])
        XCTAssertTrue(button(containing: "8.0小时").waitForExistence(timeout: 5))
        capture("today-habits")
    }

    func testBodyEntryAndClubChallenge() {
        onboard()
        app.tabBars.buttons["足迹"].tap()
        tapVisible(app.buttons["添加"])
        let weight = app.textFields["30–300"]
        XCTAssertTrue(weight.waitForExistence(timeout: 5))
        weight.tap(); weight.typeText("70")
        let waist = app.textFields["30–250"]
        waist.tap(); waist.typeText("80")
        app.buttons["保存"].tap()
        XCTAssertTrue(app.staticTexts["70.0"].waitForExistence(timeout: 5))
        capture("progress-record")
        app.tabBars.buttons["俱乐部"].tap()
        tapVisible(app.buttons["加入本地挑战"])
        XCTAssertTrue(app.buttons["退出本地挑战"].waitForExistence(timeout: 5))
        capture("club-challenge")
    }

    func testCompleteWorkout() {
        onboard()
        app.tabBars.buttons["训练"].tap()
        capture("training-tab")
        tapVisible(button(containing: "舒缓拉伸"))
        XCTAssertTrue(app.buttons["开始训练"].waitForExistence(timeout: 5))
        capture("workout-detail")
        tapVisible(app.buttons["开始训练"])
        XCTAssertTrue(app.buttons["完成这一组"].waitForExistence(timeout: 5))
        capture("workout-session")
        for set in 0..<6 {
            tapVisible(app.buttons["完成这一组"])
            if set == 0 { capture("workout-rest") }
            if set < 5 { tapVisible(app.buttons["跳过休息"]) }
        }
        XCTAssertTrue(app.staticTexts["又向自己靠近了一步。"].waitForExistence(timeout: 5))
        capture("workout-complete")
        tapVisible(app.buttons["完成"])
    }

    /// App Review requires an easily accessible privacy policy link inside the app.
    func testSettingsLinkToLegalPages() {
        onboard()
        tapVisible(app.buttons["设置"])
        for identifier in ["privacy-policy", "terms-of-use"] {
            let link = app.buttons[identifier]
            for _ in 0..<8 where !link.isHittable { app.swipeUp() }
            XCTAssertTrue(link.isHittable, identifier)
        }
        capture("settings-legal-links")
    }

    func testDarkAppearance() {
        onboard()
        tapVisible(app.buttons["设置"])
        capture("settings")
        tapVisible(button(containing: "显示模式"))
        tapVisible(app.buttons["深色"])
        tapVisible(app.buttons["关闭"])
        capture("today-dark")
        app.tabBars.buttons["训练"].tap()
        capture("training-dark")
        app.tabBars.buttons["今天"].tap()
        tapVisible(app.buttons["设置"])
        tapVisible(button(containing: "显示模式"))
        tapVisible(app.buttons["跟随系统"])
        tapVisible(app.buttons["关闭"])
    }
}
