import XCTest

@MainActor
final class MembershipUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func launchApp(scenario: String = "standard", largeDark: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["--uitesting", "--membership-fixture=\(scenario)", "-AppleLanguages", "(zh-Hans)", "-AppleLocale", "zh_CN", "-appearance", largeDark ? "dark" : "light"]
        if largeDark {
            app.launchArguments += ["-UIPreferredContentSizeCategoryName", "UICTContentSizeCategoryAccessibilityXXXL"]
        }
        app.launch()
        let start = app.buttons["开始我的计划"]
        XCTAssertTrue(start.waitForExistence(timeout: 10))
        start.tap()
        app.tabBars.buttons["俱乐部"].tap()
        tap(app.buttons["membership-entry"], in: app)
        return app
    }

    private func tap(_ element: XCUIElement, in app: XCUIApplication) {
        XCTAssertTrue(element.waitForExistence(timeout: 8))
        for _ in 0..<20 where !element.isHittable { scrollUp(app) }
        XCTAssertTrue(element.isHittable)
        element.tap()
    }

    private func type(_ text: String, into field: XCUIElement, in app: XCUIApplication) {
        for _ in 0..<20 {
            if field.waitForExistence(timeout: 1) { break }
            scrollUp(app)
        }
        XCTAssertTrue(field.exists)
        // XCTest scrolls a realized input above the keyboard when tapping it.
        field.tap()
        field.typeText(text)
    }

    /// Scrolls the content up by about a fifth of the screen.
    ///
    /// Do not use `swipeUp()` here. A swipe flings the view: in the large text layout it can move a
    /// `Form` row past the screen, and the `Form` then removes the row from the hierarchy. A tap
    /// during the fling only stops the scrolling, so the button does not run its action. This drag
    /// starts above the keyboard and ends with a hold, so the view stops where the drag ends.
    private func scrollUp(_ app: XCUIApplication) {
        let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.25, dy: 0.45))
        let end = app.coordinate(withNormalizedOffset: CGVector(dx: 0.25, dy: 0.25))
        start.press(forDuration: 0.05, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.2)
    }

    private func signIn(_ app: XCUIApplication, existingCard: Bool = false) {
        tap(app.buttons["membership-auth-start"], in: app)
        let email = app.textFields["auth-email"]
        type("member@example.test", into: email, in: app)
        let password = app.secureTextFields["auth-password"]
        type("test-password-123", into: password, in: app)
        tap(app.buttons["auth-submit"], in: app)
        let target = existingCard ? app.staticTexts["membership-status"] : app.buttons["membership-enroll-start"]
        XCTAssertTrue(target.waitForExistence(timeout: 8))
    }

    private func confirmPledges(_ app: XCUIApplication) {
        for id in ["belonging", "pace", "privacy"] {
            tap(app.switches["membership-pledge-\(id)"], in: app)
        }
    }

    private func enroll(_ app: XCUIApplication) {
        tap(app.buttons["membership-enroll-start"], in: app)
        tap(app.buttons["membership-enroll-next"], in: app)
        confirmPledges(app)
        tap(app.buttons["membership-enroll-next"], in: app)
        tap(app.switches["membership-terms"], in: app)
        tap(app.buttons["membership-enroll-confirm"], in: app)
        XCTAssertTrue(app.buttons["membership-enrollment-done"].waitForExistence(timeout: 8))
        capture("membership-welcome", app)
        tap(app.buttons["membership-enrollment-done"], in: app)
    }

    private func capture(_ name: String, _ app: XCUIApplication) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    func testGuestDoesNotReceiveAnAutomaticCard() {
        let app = launchApp()
        XCTAssertTrue(app.buttons["membership-auth-start"].exists)
        XCTAssertFalse(app.staticTexts["PREVIEW-MEMBER"].exists)
        XCTAssertTrue(app.staticTexts["免费社区会员"].exists)
        capture("membership-guest", app)
    }

    func testEnrollmentRequiresEveryPledgeAndExplicitConsent() {
        let app = launchApp()
        signIn(app)
        tap(app.buttons["membership-enroll-start"], in: app)
        capture("membership-name-preview", app)
        tap(app.buttons["membership-enroll-next"], in: app)
        XCTAssertFalse(app.buttons["membership-enroll-next"].isEnabled)
        confirmPledges(app)
        XCTAssertTrue(app.buttons["membership-enroll-next"].isEnabled)
        tap(app.switches["membership-pledge-privacy"], in: app)
        XCTAssertFalse(app.buttons["membership-enroll-next"].isEnabled)
        tap(app.switches["membership-pledge-privacy"], in: app)
        capture("membership-pledges", app)
        tap(app.buttons["membership-enroll-next"], in: app)
        let confirm = app.buttons["membership-enroll-confirm"]
        XCTAssertFalse(confirm.isEnabled)
        tap(app.switches["membership-terms"], in: app)
        XCTAssertTrue(confirm.isEnabled)
        tap(confirm, in: app)
        XCTAssertTrue(app.buttons["membership-enrollment-done"].waitForExistence(timeout: 8))
        tap(app.buttons["membership-enrollment-done"], in: app)
        tap(app.buttons["membership-share"], in: app)
        XCTAssertTrue(app.navigationBars["分享预览"].waitForExistence(timeout: 5))
        let privacy = app.switches["membership-share-number"]
        XCTAssertEqual(privacy.value as? String, "0")
        XCTAssertTrue(app.images["membership-share-image"].label.contains("卡号已隐藏"))
        capture("membership-share-private", app)
        tap(privacy, in: app)
        XCTAssertEqual(privacy.value as? String, "1")
        XCTAssertTrue(app.images["membership-share-image"].label.contains("包含完整卡号"))
        XCTAssertTrue(app.buttons["membership-share-export"].exists)
        capture("membership-share-number", app)
    }

    func testCancelEnrollmentDoesNotCreateCardAndClearsConsent() {
        let app = launchApp()
        signIn(app)
        tap(app.buttons["membership-enroll-start"], in: app)
        tap(app.buttons["membership-enroll-next"], in: app)
        tap(app.switches["membership-pledge-belonging"], in: app)
        tap(app.buttons["取消"], in: app)
        XCTAssertFalse(app.buttons["membership-share"].exists)
        tap(app.buttons["membership-enroll-start"], in: app)
        tap(app.buttons["membership-enroll-next"], in: app)
        XCTAssertEqual(app.switches["membership-pledge-belonging"].value as? String, "0")
        XCTAssertFalse(app.buttons["membership-enroll-next"].isEnabled)
    }

    func testSignOutRemovesCardButKeepsGuestAccess() {
        let app = launchApp()
        signIn(app)
        enroll(app)
        tap(app.buttons["退出账号"], in: app)
        let sheetButton = app.sheets.buttons["退出账号"]
        XCTAssertTrue(sheetButton.waitForExistence(timeout: 5))
        sheetButton.tap()
        XCTAssertTrue(app.buttons["membership-auth-start"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["membership-share"].exists)
    }

    func testSuspendedCardDoesNotOfferShareOrWallet() {
        let app = launchApp(scenario: "suspended")
        signIn(app, existingCard: true)
        XCTAssertEqual(app.staticTexts["membership-status"].label, "会员卡已暂停")
        XCTAssertFalse(app.buttons["membership-share"].exists)
        XCTAssertFalse(app.buttons["wallet-add"].exists)
        capture("membership-suspended", app)
    }

    func testOfflineCardIsClearlyMarked() {
        let app = launchApp(scenario: "offline")
        signIn(app, existingCard: true)
        tap(app.buttons["membership-refresh"], in: app)
        let offline = NSPredicate(format: "label == %@", "离线副本")
        expectation(for: offline, evaluatedWith: app.staticTexts["membership-status"])
        waitForExpectations(timeout: 8)
        tap(app.buttons["membership-share"], in: app)
        XCTAssertTrue(app.images["membership-share-image"].waitForExistence(timeout: 8))
        capture("membership-offline-share", app)
    }

    func testLongCardNumberInLargeDarkLayout() {
        let app = launchApp(scenario: "long-number", largeDark: true)
        signIn(app, existingCard: true)
        let number = app.staticTexts["membership-card-number"]
        XCTAssertTrue(number.exists)
        XCTAssertTrue(number.label.contains("00-PREVIEW-ALPHA-BETA-GAMMA-DELTA-EPSILON-1234567890-EXAMPLE"))
        capture("membership-dark-large-number", app)
        tap(app.buttons["membership-share"], in: app)
        XCTAssertTrue(app.navigationBars["分享预览"].waitForExistence(timeout: 8))
        capture("membership-dark-large-share", app)
    }
}
