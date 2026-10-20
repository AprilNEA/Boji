# Boji 界面设计

Boji 使用 SwiftUI 原生组件，最低系统版本为 iOS 26。界面遵循 Apple 的 [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ "Apple Human Interface Guidelines") 和 [Liquid Glass 适配指南](https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass "Apple 开发者文档")。设计组件集中在 `Boji/Views/DesignSystem.swift`。

## 材质与层级

界面分为两层。Liquid Glass 只出现在上层，内容层使用实色。

| 层级 | 元素 | 材质 |
| --- | --- | --- |
| 功能层 | 标签栏、导航栏、工具栏、底部操作栏、表单弹窗 | 系统 Liquid Glass |
| 内容层 | 卡片、列表行、会员卡面、动作动画 | 实色或浅渐变，不使用玻璃 |

Apple [材质规范](https://developer.apple.com/design/human-interface-guidelines/materials "Apple Human Interface Guidelines")要求内容层不使用 Liquid Glass。滑块、开关等控件只在交互时由系统切换为玻璃。

- 导航：底部使用系统 `TabView`，开启 `sidebarAdaptable` 和 `tabBarMinimizeBehavior(.onScrollDown)`。iPad 上标签栏可以切换为侧边栏，iPhone 向下滚动时标签栏收起。
- 标题：标签页使用系统大标题和 `navigationSubtitle`，滚动时标题收进导航栏。品牌标语只用于欢迎页和会员页。
- 页面操作：设置、分享等页面级操作放在导航栏。每个标签页右上角都是同一个账户按钮，点击后打开设置。
- 主要操作：每屏最多一个 `PrimaryButton`（`glassProminent`），放在 `safeAreaBar(edge: .bottom)` 中。底部栏不设背景，由系统提供滚动边缘效果。
- 卡片内操作：使用 `CardButton`（`borderedProminent`）或 `bordered`，不使用玻璃。
- 弹窗按钮：采用 iOS 26 的按钮角色。取消用 `role: .cancel`，只读页面的关闭用 `role: .close`，保存用 `role: .confirm`。系统会把这些按钮显示为玻璃图标按钮。
- 训练进行页：底部的暂停按钮和主按钮放在同一个 `GlassEffectContainer` 中，在训练与休息之间切换时形变过渡。

## 内容层

- 卡片：`Surface` 使用系统 `secondarySystemGroupedBackground`，圆角 24 pt。卡片内的元素用 `ConcentricRectangle` 与卡片保持同心。
- 列表：可点击的列表统一使用 `GroupedRows`，行内有分隔线，按下时显示系统填充色。行高不小于 44 pt。
- 背景：全部页面使用品牌米色背景，包括系统 `Form` 和 `List`，避免页面切换时出现色差。
- 主视觉：今日节奏卡和课程卡使用暖色浅渐变。课程卡展示第一个动作的静态姿势。
- 圆环：界面不使用同心圆环表示进度，以免与 Apple 健身圆环混淆（见 [Activity rings 规范](https://developer.apple.com/design/human-interface-guidelines/activity-rings "Apple Human Interface Guidelines")）。今日状态用图标、文字和颜色同时表达。

## 动效

- 转场：课程卡、课程行、文章行和会员卡进入详情时，使用 `navigationTransition(.zoom)`。
- 数字：计数和倒计时使用 `contentTransition(.numericText())`，状态图标使用 `symbolEffect(.replace)`。
- 触感：完成一组时提供轻触反馈，完成训练时提供成功反馈。
- 动作动画：训练进行页只播放当前动作。休息、暂停和页面隐藏时，动画停止。

## 排版与可访问性

- 字体：全部文字使用系统语义字体，随 Dynamic Type 缩放。辅助功能字号下，并排卡片由 `AdaptiveStack` 改为纵向排列。
- 会员卡面：卡面字号上限为 `xxxLarge`，避免卡号挤占整屏。完整卡号在「身份详情」中按任意字号显示。
- 颜色：品牌色定义了浅色、深色和高对比度三种变体。白色文字和图标下的填充色使用 `accentFill`，与白色的对比度在两种外观下都不低于 4.5:1。状态不只依靠颜色表达，也显示文字和图标。
- 触控：触控目标不小于 44 pt。
- 动效偏好：开启「减弱动态效果」后，动作动画显示静态姿势。
- 图表：数据图表附带文本摘要，列表行提供「删除」辅助操作。

## 首版边界

首版为本地优先产品。用户自行录入训练、饮水、睡眠和围度，所有数据默认留在设备，导出需要主动操作。

「薄肌」是开发暂用名称，不代表完成商标核查。应用不提供医疗诊断，不估算照片体脂，也不提供付费、AI 营养识别或真实多人社区。
