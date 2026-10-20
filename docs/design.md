# Boji 界面设计

Boji 使用 SwiftUI 原生组件。最低系统版本为 iOS 26。

## 材质与层级

Liquid Glass 只用于导航和交互控件。内容卡片使用实色表面，不叠加玻璃。[Apple 材质规范](https://developer.apple.com/design/human-interface-guidelines/materials "Apple Human Interface Guidelines")要求区分这两个层级。

底部使用系统 `TabView`，页面使用 `NavigationStack`。主要按钮采用 `glassProminent`。次要操作采用系统工具栏和 `glass` 按钮。实现参考 [SwiftUI 玻璃效果文档](https://developer.apple.com/documentation/swiftui/applying-liquid-glass-to-custom-views "Apple SwiftUI 文档")。

## 排版与可访问性

正文采用系统语义字体，随 Dynamic Type 缩放。图标采用 SF Symbols。触控目标不小于 44 pt。状态不仅通过颜色表达，也显示文字和数值。

界面支持浅色、深色和跟随系统。系统组件负责玻璃材质的辅助功能适配。自定义动画遵循「减弱动态效果」。数据图表附带文本摘要。

## 首版边界

首版为本地优先产品，不连接服务端。用户自行录入训练、饮水、睡眠和围度。所有数据默认留在设备，导出需主动操作。

「薄肌」是开发暂用名称，不代表完成商标核查。应用不提供医疗诊断，不估算照片体脂。不提供付费、AI 营养识别或真实多人社区。
