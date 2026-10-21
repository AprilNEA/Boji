import XCTest

@MainActor
final class StoreScreenshotTests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testEnglishStoreScreenshots() { captureStore(locale: "en-US") }
    func testChineseStoreScreenshots() { captureStore(locale: "zh-Hans") }

    private func captureStore(locale: String) {
        let english = locale == "en-US"
        let app = XCUIApplication()
        app.launchArguments = ["--uitesting", "--animation-reduce-motion", "-AppleLanguages",
                               english ? "(en)" : "(zh-Hans)", "-AppleLocale",
                               english ? "en_US" : "zh_CN", "-appearance", "light"]
        let start = english ? "Start My Plan" : "开始我的计划"
        let training = english ? "Training" : "训练"
        let today = english ? "Today" : "今天"
        let journey = english ? "Journey" : "足迹"
        let settings = english ? "Settings" : "设置"
        let save = english ? "Save" : "保存"

        app.launch()
        tap(app.buttons[start], in: app)
        selectTab(training, in: app)
        capture("store-\(locale)-01-training", app)
        let course = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", english ? "Home Basics" : "居家基础训练")).firstMatch
        tap(course, in: app)
        tap(app.buttons["exercise-preview-bodyweight-squat"], in: app)
        XCTAssertTrue(app.images["exercise-animation"].waitForExistence(timeout: 10))
        capture("store-\(locale)-02-exercise", app)
        tap(app.buttons[english ? "Close" : "关闭"], in: app)
        tap(app.buttons[english ? "Start Workout" : "开始训练"], in: app)
        XCTAssertTrue(app.images["exercise-animation"].waitForExistence(timeout: 10))
        capture("store-\(locale)-03-session", app)

        // Relaunching the isolated store avoids saving an unfinished workout.
        app.terminate()
        app.launch()
        tap(app.buttons[start], in: app)
        selectTab(today, in: app)
        tap(app.buttons.matching(NSPredicate(format: "label CONTAINS %@", english ? "Drink Water" : "好好喝水")).firstMatch, in: app)
        tap(app.buttons[save], in: app)
        tap(app.buttons.matching(NSPredicate(format: "label CONTAINS %@", english ? "Sleep Well" : "好好睡觉")).firstMatch, in: app)
        tap(app.buttons[save], in: app)
        capture("store-\(locale)-04-today", app)

        selectTab(journey, in: app)
        tap(app.buttons[english ? "Add" : "添加"], in: app)
        tap(app.textFields["30–300"], in: app)
        app.textFields["30–300"].typeText("70")
        tap(app.textFields["30–250"], in: app)
        app.textFields["30–250"].typeText("80")
        tap(app.buttons[save], in: app)
        XCTAssertTrue(app.staticTexts["70.0"].waitForExistence(timeout: 5))
        capture("store-\(locale)-05-progress", app)

        tap(app.buttons[settings], in: app)
        capture("store-\(locale)-06-settings", app)
        app.terminate()
    }

    private func selectTab(_ label: String, in app: XCUIApplication) {
        let tab = app.tabBars.buttons[label]
        if tab.waitForExistence(timeout: 2), tab.isHittable {
            tab.tap()
        } else {
            tap(app.buttons.matching(identifier: label).firstMatch, in: app)
        }
    }

    private func tap(_ target: XCUIElement, in app: XCUIApplication) {
        XCTAssertTrue(target.waitForExistence(timeout: 10), "Missing control: \(target)")
        for _ in 0..<6 where !target.isHittable {
            let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.68))
            let end = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.38))
            start.press(forDuration: 0.05, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.5)
        }
        XCTAssertTrue(target.isHittable)
        target.tap()
    }

    private func capture(_ name: String, _ app: XCUIApplication) {
        // Wait for the SwiftUI presentation transition before taking the actual screen.
        let predicate = NSPredicate { _, _ in app.exists && app.frame.width > 0 }
        let ready = XCTNSPredicateExpectation(predicate: predicate, object: nil)
        XCTAssertEqual(XCTWaiter.wait(for: [ready], timeout: 5), .completed)
        Thread.sleep(forTimeInterval: 0.8)
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
