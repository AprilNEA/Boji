# Boji · 薄肌俱乐部

Boji 是本地优先的健身记录 App。本仓库包含 iOS 和 Android 两个原生客户端，两端各自独立构建。

## 目录结构

| 目录 | 内容 |
| --- | --- |
| `ios/` | iOS 客户端：SwiftUI 源码、XcodeGen 工程和 iOS 专属文档 |
| `android/` | Android 客户端：Kotlin 和 Jetpack Compose 源码、Gradle 工程 |
| `animations/` | 两端共用的动作 Lottie 动画：TypeScript 生成器和生成的 JSON，见 [动作动画说明](animations/README.md) |
| `docs/` | 两端共享的文档 |

平台专属的命令在对应目录中运行。动作动画的工具链由根目录的 `devenv.nix` 提供。用 Xcode 打开 `ios/Boji.xcodeproj`，用 Android Studio 打开 `android/` 目录。

## 平台状态

| 平台 | 状态 | 说明文档 |
| --- | --- | --- |
| iOS | 首版功能已实现 | [iOS 说明](ios/README.md) |
| Android | 本地功能已移植；账号、会员和设备联动尚未移植 | [Android 说明](android/README.md) |

## 共享文档

[会员卡开发说明](docs/membership.md)记录了用户流程、接口契约和隐私规则。后端位于独立项目 `bojifit/bizserver`，不包含在本仓库中。

## 命名与发布

「薄肌」为开发暂用名称。商标核查尚未完成，两端都尚未上架。

## 提交署名

本项目提交使用以下协作署名：

```text
Co-authored-by: Manus <dev-agent@manus.ai>
```
