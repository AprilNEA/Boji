# 手表布局验证记录

手表「今日进度」页的正文原来几乎贴着屏幕边缘。加上 `scenePadding(.horizontal)` 后，正文与系统状态栏对齐。默认字号和两档辅助功能字号下，每一行都没有截断。49mm 第一屏底部的「同步于」一行原来被屏幕圆角遮住开头，改为居中后完整显示。

验证时间：2026 年 10 月 21 日 18:47–19:31 和 21:31–21:47，UTC+08:00。环境为 Xcode 27.1（27A9275）和新建的模拟器。iPhone 都是 iPhone 17（iOS 26.5），手表分别是 Apple Watch Series 11 46mm、Apple Watch Series 11 42mm 和 Apple Watch Ultra 3 49mm（均为 watchOS 26.5）。构建为 `1ba79b3` 加本次改动的 Debug 构建 0.7.0 (7)，未签名。

## 改动

| 位置 | 旧 → 新 |
| --- | --- |
| `BojiWatch/BojiWatchApp.swift` 中 `ScrollView` 内容的左右边距 | 无边距 → `.scenePadding(.horizontal)` |
| 同一文件中「同步于」一行的对齐 | 左对齐 → 居中 |

依据是 Apple 的 [Supporting multiple watch sizes](https://developer.apple.com/documentation/watchos-apps/supporting-multiple-watch-sizes)：正文应与导航标题的前缘、状态栏文字的后缘对齐，scene padding 提供这组边距，并避开屏幕的弧形边缘。

「同步于」是滚动内容的最后一行。在 49mm 上，第一屏的底边正好落在这一行，左对齐时开头的「同」字在圆角外。圆角只遮住底边两侧，所以居中的短文字不受影响。其他内容仍然左对齐。

## 已验证

| 检查 | 结果 |
| --- | --- |
| 构建 | `xcodebuild` 模拟器构建通过，包含 `Watch/BojiWatch.app` |
| 46mm 默认字号的边距 | 正文左边距 2.5–4.5 pt → 15.5–17.5 pt；右边距 3 pt → 16 pt。系统状态栏时间的右边距为 15 pt |
| 49mm 默认字号的边距 | 修复后正文左边距 17–19 pt，右边距 17.5 pt。系统状态栏时间的右边距为 16.5 pt |
| 49mm「同步于」一行 | 左对齐时开头被圆角遮住 → 居中后横向位于 65.5–145 pt（屏幕宽 211 pt）。与 Apple 边框合成后，这一行 1116 个亮像素中被边框遮住的为 0 |
| 真实共享 | iPhone 记录饮水和睡眠并开启共享后，手表显示「已连接 iPhone」、计划「居家训练」、饮水和睡眠已记录、手动训练未记录 |
| 46mm AccessibilityL 字号 | 每一行仍在一行内，没有截断 |
| 46mm AccessibilityXXXL 字号 | 每一行仍在一行内，没有截断 |
| 42mm 默认字号 | 第一屏到「睡眠」一行为止，最后一行文字离底边 13 pt。「同步于」在第一屏之外 |
| 46mm 第一屏底边 | 屏幕底边截掉「同步于」一行的下半部分。这是滚动内容的正常截断，没有为此改布局 |
| 46mm 数码表冠滚动 | 转动 0.05 圈后内容上移 5 pt，「同步于」完整显示，离底边 2.5 pt，顶部「已连接 iPhone」仍然清楚。转动 0.02 圈及以下时内容不动 |
| 46mm 滚到底 | `swipeUp()` 使内容上移 40.5 pt。导航栏下的滚动边缘效果模糊了「已连接 iPhone」和「计划」两行。转动 0.06 圈时，「已连接 iPhone」已开始变模糊 |

边距按 2 倍图测量：从截图两侧找到第一列非黑色像素，再除以 2。`xcrun simctl ui content_size` 不支持 watchOS 运行时。辅助功能字号改用手表模拟器的 `com.apple.UIKit` 偏好 `UIPreferredContentSizeCategoryName` 设置，截图后已删除该偏好。

AppSim 在手表模拟器上读不到屏幕方向，不能发送手势。滚动改用 `.work/` 中的临时 watchOS 界面测试工程：用 `XCUIApplication(bundleIdentifier: "club.leanmuscle.boji.watchkitapp")` 驱动已安装的薄肌，用 `XCUIDevice.shared.rotateDigitalCrown(delta:velocity: .slow)` 转动数码表冠，再用 `XCUIScreen.main.screenshot()` 截图。

同一台 iPhone 模拟器同时配对两只手表时，iPhone 端显示「请先在 Apple Watch 安装薄肌」，不发送快照。解除其中一只的配对后恢复同步。真机上是否相同未验证。

## 未验证

- 真机上的显示效果。
- 英文界面。英文文字更长，大字号下可能换行或截断。
- 40mm、41mm、44mm 和 45mm 等其他尺寸，以及 42mm 和 49mm 的辅助功能字号。
- 共享未开启、尚无数据和非今日快照三种状态。它们在同一个容器里，也有这组边距，但没有截图检查。
- 没有运行仓库中的单元测试和界面测试。现有测试目标不包含手表 App 的界面，上面的滚动测试只在 `.work/` 中。

## 本地证据

以下路径相对于仓库根目录：

- `.work/boji-watch-shot/build-padding.log`、`.work/boji-watch-shot/build-footer.log`
- `.work/boji-watch-shot/watch-1.png`：修复前
- `.work/boji-watch-shot/watch-padding.png`：修复后，默认字号
- `.work/boji-watch-shot/watch-padding-axl.png`、`.work/boji-watch-shot/watch-padding-axxxl.png`：修复后，辅助功能字号
- `.work/boji-watch-shot/compare.png`：修复前后对比
- `.work/boji-watch-shot/watch-ultra-1.png`：加边距后，49mm，「同步于」左对齐
- `.work/boji-watch-shot/watch-ultra-footer.png`：49mm，「同步于」居中
- `.work/boji-watch-shot/watch-u3-final.png`、`.work/boji-watch-shot/watch-s11-42-final.png`：49mm 和 42mm 第一屏
- `.work/boji-watch-shot/watch-s11-46-top.png`、`.work/boji-watch-shot/crown2/`、`.work/boji-watch-shot/watch-s11-46-scrolled.png`：46mm 未滚动、按表冠转动量滚动和滚到底
- `.work/watch-scroll/`：临时 watchOS 界面测试工程和测试日志
