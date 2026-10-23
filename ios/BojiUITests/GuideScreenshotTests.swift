import XCTest

/// Captures the screens that the user guide in `docs/guide/` shows.
///
/// The test uses the in-memory store and the test membership service, so the captures hold
/// isolated sample data only. The root `AGENTS.md` ("Guide screenshots") describes the export.
@MainActor
final class GuideScreenshotTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["--uitesting", "--animation-reduce-motion", "-AppleLanguages", "(zh-Hans)",
                               "-AppleLocale", "zh_CN", "-appearance", "light"]
    }

    func testGuideScreens() {
        app.launch()
        let start = app.buttons["开始我的计划"]
        XCTAssertTrue(start.waitForExistence(timeout: 10))
        capture("welcome")
        start.tap()

        captureDailyLog()
        captureWorkout()
        captureProgress()
        captureClub()
        captureMembership()
    }

    func testHealthScreen() {
        app.launch()
        tap(app.buttons["开始我的计划"])
        tap(app.buttons["设置"])
        tap(app.buttons["health-settings"])
        XCTAssertTrue(app.buttons["health-connect"].waitForExistence(timeout: 5))
        capture("health")
    }

    private func captureDailyLog() {
        tap(button(containing: "好好喝水"))
        XCTAssertTrue(app.buttons["保存"].waitForExistence(timeout: 5))
        capture("water")
        tap(app.buttons["保存"])
        tap(button(containing: "好好睡觉"))
        XCTAssertTrue(app.buttons["保存"].waitForExistence(timeout: 5))
        capture("sleep")
        tap(app.buttons["保存"])
    }

    private func captureWorkout() {
        selectTab("训练")
        tap(app.buttons["course-mobility"])
        XCTAssertTrue(app.buttons["开始训练"].waitForExistence(timeout: 5))
        capture("workout")
        tap(app.buttons["开始训练"])
        // 舒缓拉伸 has 3 exercises with 2 sets each.
        for set in 0..<6 {
            tap(app.buttons["完成这一组"])
            if set == 0 { capture("rest") }
            if set < 5 { tap(app.buttons["跳过休息"]) }
        }
        XCTAssertTrue(app.staticTexts["又向自己靠近了一步。"].waitForExistence(timeout: 5))
        capture("finished")
        tap(app.buttons["完成"])
        app.navigationBars.buttons.element(boundBy: 0).tap()
    }

    private func captureProgress() {
        selectTab("足迹")
        tap(app.buttons["添加"])
        let weight = app.textFields["30–300"]
        tap(weight)
        weight.typeText("70")
        let waist = app.textFields["30–250"]
        tap(waist)
        waist.typeText("80")
        capture("body")
        tap(app.buttons["保存"])
        XCTAssertTrue(app.staticTexts["70.0"].waitForExistence(timeout: 5))
    }

    private func captureClub() {
        selectTab("俱乐部")
        tap(app.buttons["加入本地挑战"])
        XCTAssertTrue(app.buttons["退出本地挑战"].waitForExistence(timeout: 5))
        scrollToTop()
        capture("club")
    }

    private func captureMembership() {
        tap(app.buttons["membership-entry"])
        XCTAssertTrue(app.buttons["membership-auth-start"].waitForExistence(timeout: 8))
        capture("membership-guest")

        tap(app.buttons["membership-auth-start"])
        type("member@example.test", into: app.textFields["auth-email"])
        type("test-password-123", into: app.secureTextFields["auth-password"])
        tap(app.buttons["auth-submit"])

        tap(app.buttons["membership-enroll-start"])
        let name = app.textFields["membership-card-name"]
        tap(name)
        // Return submits the field, which clears the focus and hides the keyboard.
        name.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: 24) + "薄肌同学\n")
        capture("enroll-name")
        tap(app.buttons["membership-enroll-next"])
        for id in ["belonging", "pace", "privacy"] {
            tap(app.switches["membership-pledge-\(id)"])
        }
        capture("enroll-pledges")
        tap(app.buttons["membership-enroll-next"])
        tap(app.switches["membership-terms"])
        capture("enroll-review")
        tap(app.buttons["membership-enroll-confirm"])
        tap(app.buttons["membership-enrollment-done"])

        XCTAssertTrue(app.staticTexts["membership-status"].waitForExistence(timeout: 8))
        capture("membership")

        tap(app.buttons["membership-share"])
        XCTAssertTrue(app.navigationBars["分享预览"].waitForExistence(timeout: 5))
        capture("share-card")
        tap(app.navigationBars["分享预览"].buttons["关闭"])

        tap(app.buttons["membership-code"])
        XCTAssertTrue(app.images["membership-code-qr"].waitForExistence(timeout: 8))
        capture("membership-code")
        tap(app.navigationBars["会员码"].buttons["关闭"])

        tap(app.buttons["membership-account-security"])
        XCTAssertTrue(app.navigationBars["账号与安全"].waitForExistence(timeout: 5))
        capture("account-security")
        tap(app.buttons["account-delete-start"])
        XCTAssertTrue(app.buttons["account-delete-send-code"].waitForExistence(timeout: 5))
        capture("account-deletion")
        tap(app.buttons["account-delete-cancel"])
        tap(app.navigationBars["账号与安全"].buttons["关闭"])
        tap(app.navigationBars["我的会员卡"].buttons["关闭"])
    }

    private func selectTab(_ label: String) {
        let tab = app.tabBars.buttons[label]
        if tab.waitForExistence(timeout: 2), tab.isHittable {
            tab.tap()
        } else {
            tap(app.buttons.matching(identifier: label).firstMatch)
        }
    }

    private func button(containing text: String) -> XCUIElement {
        app.buttons.matching(NSPredicate(format: "label CONTAINS %@", text)).firstMatch
    }

    private func tap(_ element: XCUIElement) {
        for _ in 0..<12 {
            if element.waitForExistence(timeout: 1), element.isHittable { break }
            scrollUp()
        }
        XCTAssertTrue(element.isHittable, "Missing control: \(element)")
        if !element.isEnabled {
            expectation(for: NSPredicate(format: "enabled == true"), evaluatedWith: element)
            waitForExpectations(timeout: 8)
        }
        element.tap()
    }

    private func type(_ text: String, into field: XCUIElement) {
        tap(field)
        field.typeText(text)
    }

    /// Drags a short distance and holds, so that a `Form` stops where the drag ends.
    private func scrollUp() {
        let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.25, dy: 0.45))
        let end = app.coordinate(withNormalizedOffset: CGVector(dx: 0.25, dy: 0.25))
        start.press(forDuration: 0.05, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.2)
    }

    private func scrollToTop() {
        for _ in 0..<4 {
            let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.25, dy: 0.3))
            let end = app.coordinate(withNormalizedOffset: CGVector(dx: 0.25, dy: 0.8))
            start.press(forDuration: 0.05, thenDragTo: end, withVelocity: .fast, thenHoldForDuration: 0.1)
        }
        Thread.sleep(forTimeInterval: 0.6)
    }

    private func capture(_ name: String) {
        // Wait for the sheet and navigation transitions to settle.
        Thread.sleep(forTimeInterval: 1.5)
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "guide-\(name)"
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
