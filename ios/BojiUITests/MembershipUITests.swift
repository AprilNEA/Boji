import XCTest

@MainActor
final class MembershipUITests: XCTestCase {
    private func launchApp() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["--uitesting", "-AppleLanguages", "(zh-Hans)", "-AppleLocale", "zh_CN"]
        app.launch()
        let start = app.buttons["开始我的计划"]
        XCTAssertTrue(start.waitForExistence(timeout: 10))
        start.tap()
        app.tabBars.buttons["俱乐部"].tap()
        tap(app.buttons["membership-entry"], in: app)
        return app
    }

    private func tap(_ element: XCUIElement, in app: XCUIApplication) {
        XCTAssertTrue(element.waitForExistence(timeout: 5))
        for _ in 0..<6 where !element.isHittable { app.swipeUp() }
        XCTAssertTrue(element.isHittable)
        element.tap()
    }

    private func signIn(_ app: XCUIApplication) {
        tap(app.buttons["membership-auth-start"], in: app)
        let email = app.textFields["auth-email"]
        XCTAssertTrue(email.waitForExistence(timeout: 5))
        email.tap(); email.typeText("member@example.test")
        let password = app.secureTextFields["auth-password"]
        password.tap(); password.typeText("test-password-123")
        tap(app.buttons["auth-submit"], in: app)
        XCTAssertTrue(app.buttons["membership-enroll-start"].waitForExistence(timeout: 5))
    }

    func testGuestDoesNotReceiveAnAutomaticCard() {
        let app = launchApp()
        XCTAssertTrue(app.buttons["membership-auth-start"].exists)
        XCTAssertFalse(app.staticTexts["PREVIEW-MEMBER"].exists)
        XCTAssertTrue(app.staticTexts["免费社区会员"].exists)
    }

    func testEnrollmentNeedsConsentAndProducesShareImage() {
        let app = launchApp()
        signIn(app)
        tap(app.buttons["membership-enroll-start"], in: app)
        let confirm = app.buttons["membership-enroll-confirm"]
        XCTAssertTrue(confirm.waitForExistence(timeout: 5))
        XCTAssertFalse(confirm.isEnabled)
        tap(app.switches["membership-terms"], in: app)
        XCTAssertTrue(confirm.isEnabled)
        tap(confirm, in: app)
        XCTAssertTrue(app.buttons["membership-share"].waitForExistence(timeout: 5))
        tap(app.buttons["membership-share"], in: app)
        XCTAssertTrue(app.navigationBars["分享预览"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["分享图片"].exists)
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "membership-share-preview"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    func testSignOutRemovesCardButKeepsGuestAccess() {
        let app = launchApp()
        signIn(app)
        tap(app.buttons["membership-enroll-start"], in: app)
        tap(app.switches["membership-terms"], in: app)
        tap(app.buttons["membership-enroll-confirm"], in: app)
        XCTAssertTrue(app.buttons["membership-share"].waitForExistence(timeout: 5))
        tap(app.buttons["退出账号"], in: app)
        let sheetButton = app.sheets.buttons["退出账号"]
        XCTAssertTrue(sheetButton.waitForExistence(timeout: 5))
        sheetButton.tap()
        XCTAssertTrue(app.buttons["membership-auth-start"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["membership-share"].exists)
    }
}
