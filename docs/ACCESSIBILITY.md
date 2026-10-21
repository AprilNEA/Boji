# 无障碍说明

Boji 的 iOS App、Android App 和网站已经支持读屏标签、大字号、深色模式和减弱动态效果。目前的检查都在模拟器上完成，读屏的完整操作流程还没有验证。本文件按 App Store 的[辅助功能营养标签](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/overview-of-accessibility-nutrition-labels/ "前往 Apple 开发者网站")（Accessibility Nutrition Labels）列出各端状态，并说明怎么反馈问题。

状态核对日期：2026-10-21（UTC+08:00）。iOS 一列只涵盖 iPhone。watchOS App 和小组件还没有单独评估，下表不包含它们。

## 各端状态

状态分为 5 种：

- **已验证**：检查过实际效果，日期、环境和结果记录在该端的验证文档中。
- **已实现，未验证**：代码已经实现，还没有检查实际效果。
- **未实现**：代码里没有对应的支持。
- **未评估**：还没有检查代码或实际效果。
- **不适用**：该端没有相关内容。

| 标签项 | 含义 | iOS | Android | 网站 |
| --- | --- | --- | --- | --- |
| VoiceOver | 读屏软件能读出并操作每个控件。Android 对应 TalkBack | 已实现，未验证 | 已实现，未验证 | 已实现，未验证 |
| Voice Control | 用语音操作界面。Android 对应 Voice Access | 未评估 | 未评估 | 未评估 |
| Larger Text | 调大系统字号后，文字随之放大，布局完整 | 已验证 | 已实现，未验证 | 未评估 |
| Dark Interface | 跟随系统的深色模式 | 已验证 | 已验证 | 未实现 |
| Differentiate Without Color Alone | 不只用颜色表达状态 | 已实现，未验证 | 未评估 | 未评估 |
| Sufficient Contrast | 文字和背景的对比度足够 | 已验证 | 已实现，未验证 | 未评估 |
| Reduced Motion | 开启减弱动态效果后，动画停止 | 已实现，未验证 | 已验证 | 已实现，未验证 |
| Captions | 视频有字幕 | 不适用 | 不适用 | 未实现 |
| Audio Descriptions | 视频有描述画面内容的音轨 | 不适用 | 不适用 | 未实现 |

### iOS

设计规则见[界面设计](../ios/docs/design.md#排版与可访问性)，检查记录见[界面改造验证记录](../ios/docs/ui-refresh-verification.md)。

- **VoiceOver**：部分控件设置了 `accessibilityLabel`，相关元素用 `accessibilityElement` 合并为一个读屏单元。数据图表附带文字摘要，列表行提供「删除」辅助操作。触控目标不小于 44 pt。
- **Larger Text**：全部文字使用系统语义字体，随 Dynamic Type 缩放。辅助功能字号下，并排卡片改为纵向排列。2026-10-20 在 iOS 26.5 模拟器上检查了欢迎页（AccessibilityXL）和会员中心与分享页（AccessibilityXXXL），布局无遮挡。
- **Dark Interface**：今天、训练、足迹、俱乐部、设置和会员等主要页面的浅色和深色截图已人工检查。
- **Differentiate Without Color Alone**：状态同时显示文字和图标。
- **Sufficient Contrast**：白字在 `accentFill` 上的对比度为 5.02:1。深色 `accent` 在页面背景上为 7.21:1，浅色 `accent` 在页面背景上为 4.61:1。品牌色另有高对比度变体。
- **Reduced Motion**：开启「减弱动态效果」后，动作动画显示代表姿势，不自动播放。单元测试覆盖了这条逻辑。
- **Captions 和 Audio Descriptions**：App 里没有视频播放器。

### Android

功能说明和检查记录见 [Android 说明](../android/README.md)。

- **TalkBack**：图标和图片设置了 `contentDescription`，装饰性图片设为 `null`。部分标题用 `heading()` 标记了标题语义。
- **Larger Text**：文字尺寸使用 `sp` 单位，随系统字体大小缩放。
- **Dark Interface**：应用支持跟随系统、浅色和深色三种外观。浅色和深色模式已在模拟器上手动检查。
- **Sufficient Contrast**：饮水、睡眠等语义色按 WCAG AA 选取。仓库里没有对比度的测量记录。
- **Reduced Motion**：系统关闭动画后，动作动画停在代表帧，不播放。2026-10-20 在模拟器上检查了深蹲，浅色和深色都停在第 106 帧（共 210 帧）。
- **Captions 和 Audio Descriptions**：App 里没有视频播放器。

### 网站

功能说明见[网站说明](../websites/README.md)。

- **VoiceOver**：页面语言设为 `zh-CN`，图片都有替代文字，部分交互元素使用 `aria-*` 属性。发布会影片有 `aria-label`。
- **Dark Interface**：网站不读取系统的深色模式设置。
- **Reduced Motion**：全站动画遵循系统的减弱动态效果设置。开启后，首页的发布会影片不自动播放。
- **Captions 和 Audio Descriptions**：发布会影片可以打开声音，但没有字幕，也没有描述画面的音轨。

## 已知障碍

- 所有检查都在模拟器上完成，没有在真机上验证。
- iOS 的 VoiceOver 完整操作流程没有验证。「减弱透明度」和「增强对比度」设置下的效果、iPad 侧边栏和横屏布局也没有验证。
- iOS 只检查了 3 个页面在辅助功能字号下的布局，其他页面没有检查。
- Android 的 TalkBack 全流程、200% 字体缩放，以及平板和折叠屏上的导航轨没有验证。
- 两端的界面文字只有简体中文和英文。系统语言是其他语言时，界面显示英文。Android 的 Material 组件自带无障碍文字，例如底部弹层的「Close sheet」。这些文字跟随系统语言，所以这时 TalkBack 会混读两种语言。iOS 是否会混读，没有验证。
- 网站没有测试键盘操作。除了宣誓页的输入框，网站没有自定义焦点样式。使用浏览器默认样式时，焦点是否清晰可见没有验证。
- watchOS App 和小组件没有评估。

## 反馈问题

在 [GitHub Issues](https://github.com/AprilNEA/Boji/issues "前往 GitHub") 提交问题，标题写明平台和使用的辅助功能。问题中写明以下信息：

- 平台、设备型号和系统版本
- 使用的辅助功能及其设置，例如 VoiceOver，或 200% 字体大小
- 出现问题的页面和操作步骤
- 期望的结果和实际的结果

截图和录屏能帮助定位问题。Issues 是公开的，提交前遮住截图中的健康数据、会员卡号和其他个人信息。

## 维护本文件

- 修改界面、动画或配色时，在同一次改动中更新本文件受影响的状态和核对日期。
- 完成一次检查后，先在该端的验证文档中记录日期、环境和结果，再把状态改为「已验证」。本文件只写结论，不写检查过程。
- 在 App Store Connect 申报辅助功能营养标签时，应该只申报 iOS 一列中「已验证」的项。
- 开发规则写在各端的设计文档中，例如[界面设计](../ios/docs/design.md#排版与可访问性)，不写在本文件。
