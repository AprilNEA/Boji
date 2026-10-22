import XCTest

@MainActor
final class ExerciseAnimationUITests: XCTestCase {
    override func setUpWithError() throws { continueAfterFailure = false }

    private func openCourse(flags: [String] = [], dark: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["--uitesting", "-AppleLanguages", "(zh-Hans)", "-AppleLocale", "zh_CN", "-appearance", dark ? "dark" : "light"] + flags
        app.launch()
        let start = app.buttons["开始我的计划"]
        XCTAssertTrue(start.waitForExistence(timeout: 10)); start.tap()
        app.tabBars.buttons["训练"].tap()
        let course = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "居家基础训练")).firstMatch
        tap(course, app)
        return app
    }
    private func openRemoteCourse(fixture: String) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["--uitesting", "--animation-remote-fixture=\(fixture)", "-AppleLanguages", "(zh-Hans)", "-AppleLocale", "zh_CN"]
        app.launch()
        XCTAssertTrue(app.buttons["开始我的计划"].waitForExistence(timeout: 10))
        app.buttons["开始我的计划"].tap()
        app.tabBars.buttons["训练"].tap()
        tap(app.buttons["course-home-strength"], app)
        return app
    }
    private func tap(_ target: XCUIElement, _ app: XCUIApplication) {
        XCTAssertTrue(target.waitForExistence(timeout: 8))
        for _ in 0..<8 where !target.isHittable { app.swipeUp() }
        target.tap()
    }
    private func assertAnimation(_ state: String, _ app: XCUIApplication) {
        let animation = app.images["exercise-animation"]
        XCTAssertTrue(animation.waitForExistence(timeout: 10))
        for _ in 0..<8 {
            if animation.frame.minY >= 90 && animation.frame.maxY < app.frame.maxY - 80 { break }
            app.swipeDown()
        }
        let predicate = NSPredicate(format: "value CONTAINS %@", state)
        expectation(for: predicate, evaluatedWith: animation)
        waitForExpectations(timeout: 5)
    }
    private func capture(_ name: String, _ app: XCUIApplication) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name; attachment.lifetime = .keepAlways; add(attachment)
    }

    func testPreviewPlaybackPausePosterAndSlowSpeed() {
        let app = openCourse()
        tap(app.buttons["exercise-preview-bodyweight-squat"], app)
        assertAnimation("正在播放", app)
        capture("exercise-light-playing", app)
        tap(app.buttons["exercise-playback-toggle"], app)
        assertAnimation("已暂停", app)
        tap(app.buttons["exercise-show-poster"], app)
        assertAnimation("静态姿势", app)
        tap(app.segmentedControls["exercise-speed"].buttons["慢速 0.5×"], app)
        tap(app.buttons["exercise-playback-toggle"], app)
        assertAnimation("正在播放", app)
    }
    func testReducedMotionDarkPoster() {
        let app = openCourse(flags: ["--animation-reduce-motion"], dark: true)
        tap(app.buttons["exercise-preview-bodyweight-squat"], app)
        assertAnimation("静态姿势，深色", app)
        XCTAssertFalse(app.buttons["exercise-playback-toggle"].exists)
        capture("exercise-dark-poster", app)
    }
    func testMissingAnimationFallback() {
        let app = openCourse(flags: ["--animation-missing-asset"])
        tap(app.buttons["exercise-preview-bodyweight-squat"], app)
        XCTAssertTrue(app.otherElements["exercise-animation-fallback"].waitForExistence(timeout: 10)
                      || app.staticTexts["动作演示暂不可用"].exists)
        capture("exercise-missing-fallback", app)
    }
    func testSessionPauseAndRestRemovePlayback() {
        let app = openCourse()
        tap(app.buttons["开始训练"], app)
        assertAnimation("正在播放", app)
        tap(app.buttons["暂停训练"], app)
        assertAnimation("已暂停", app)
        tap(app.buttons["继续训练"], app)
        tap(app.buttons["完成这一组"], app)
        XCTAssertTrue(app.staticTexts["休息一下"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.images["exercise-animation"].exists)
        tap(app.buttons["跳过休息"], app)
        XCTAssertTrue(app.images["exercise-animation"].waitForExistence(timeout: 5))
    }
    func testRemoteCourseOfflineShowsStatusAndStillStartsSession() {
        let app = openRemoteCourse(fixture: "offline")
        XCTAssertTrue(app.staticTexts["联网后可查看动作动画"].waitForExistence(timeout: 10))
        tap(app.buttons["开始训练"], app)
        XCTAssertTrue(app.buttons["完成这一组"].waitForExistence(timeout: 10))
    }
    func testRemoteFixtureLoadsAnimation() {
        let app = openRemoteCourse(fixture: "ok")
        tap(app.buttons["exercise-preview-push-up"], app)
        assertAnimation("正在播放", app)
    }
}
