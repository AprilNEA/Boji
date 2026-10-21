# 开发指南

本文介绍仓库的目录结构、工具链和各组件的本地运行方式。各组件完整的环境要求、构建和测试命令，见其目录中的说明文档。文中的路径均相对于仓库根目录。

## 仓库结构

本仓库包含两个原生客户端、一个后端、两端共用的动作动画和文案，以及薄肌俱乐部宣传网站。每个目录各自独立构建。

| 目录 | 内容 | 状态 | 说明文档 |
| --- | --- | --- | --- |
| `ios/` | iOS App、watchOS App 和小组件：SwiftUI 和 XcodeGen 工程 | 首版功能已实现 | [iOS 说明](../ios/README.md) |
| `android/` | Android App：Kotlin、Jetpack Compose 和 Gradle 工程 | 训练和记录功能已移植；账号、会员和设备联动尚未移植 | [Android 说明](../android/README.md) |
| `bizserver/` | 后端：Rust、Axum、ConnectRPC、SeaORM 和 PostgreSQL | 开发中，尚未部署 | [后端说明](../bizserver/README.md) |
| `animations/` | 动作 Lottie 动画：TypeScript 生成器和生成的 JSON | 16 个课程动作已接入两端；动作库的 1567 个动作已生成，尚未接入 | [动作动画说明](../animations/README.md) |
| `websites/` | 薄肌俱乐部宣传网站和 `/docs` 文档站：Next.js 静态导出、Tailwind CSS、Motion 和 Fumadocs | 网站已从 `bojiclub` 导入；文档站只有占位页面 | [网站说明](../websites/README.md) |
| `locales/` | 两端共用的文案：YAML 格式的 ICU MessageFormat，每种语言一个目录 | 已接入 iOS 和 Android | [文案说明](../locales/README.md) |
| `crates/` | 仓库工具的 Rust 工作区。`crates/locales/` 从 `locales/` 生成两端的字符串资源 | 不适用 | [文案说明](../locales/README.md) |
| `docs/` | 两端共享的文档。其中的 `.mdx` 和 `meta.json` 是文档站页面，`docs/sites/` 存放支持页、隐私政策等独立页面 | 不适用 | [会员卡开发说明](membership.md) |
| `assets/public/` | 部署到 `https://assets.leanmuscle.club` 的通用静态文件，目前有浅色和深色应用图标、iPhone 和 Apple Watch 截图，以及动作预览图。根目录 README 使用这些文件 | 应用图标已上线；截图和动作预览图尚未部署 | 不适用 |

每个目录还有一份 `AGENTS.md`，记录面向编码代理的目录规则。

## 工具链

根目录的 `devenv.nix` 提供命令行工具链，使用前必须先安装 [devenv](https://devenv.sh "前往 devenv 官网")。

| 目录 | devenv 提供的工具 |
| --- | --- |
| `animations/`、`websites/` | Node.js 26 和 pnpm 12 |
| `bizserver/`、`crates/` | Rust（版本由 `bizserver/rust-toolchain.toml` 决定）、`buf`、OpenSSL 和 `pkg-config` |
| `android/` | JDK 17，并设置 `JAVA_HOME` |
| `websites/scripts/` | Python 3，带 Pillow 和 rembg |

Xcode、XcodeGen、Android SDK、ArcBox 和 PostgreSQL 不由 devenv 提供，需要另行安装。

在仓库根目录运行 `devenv test`，会检查 `animations/` 和 `websites/` 的类型，并确认 `animations/lottie/` 与源码一致。

## 本地运行

按组件选择入口：

- **iOS**：用 Xcode 打开 `ios/Boji.xcodeproj`，选择 `Boji` scheme 和 iOS 模拟器后运行。修改 `ios/project.yml` 后，在 `ios/` 目录运行 `xcodegen generate` 重新生成工程。
- **Android**：用 Android Studio 打开 `android/` 目录，不要打开仓库根目录。命令行构建需要 `local.properties` 中的 SDK 路径。在 devenv 环境中进入 `android/` 目录，运行 `./gradlew assembleDebug testDebugUnitTest lintDebug`。
- **后端**：PostgreSQL 由 ArcBox 中的 `compose.yml` 提供。准备 `.env` 后，在 devenv 环境中进入 `bizserver/` 目录，依次运行 `docker compose up -d postgres`、`cargo run --locked -- migrate` 和 `cargo run --locked -- serve`。
- **动作动画**：在 devenv 环境中进入 `animations/` 目录，运行 `pnpm build` 重新生成 `lottie/`。
- **网站**：在 devenv 环境中进入 `websites/` 目录，运行 `pnpm dev` 启动开发服务器，运行 `pnpm build` 生成静态站点。

iOS 的 Debug 构建默认连接 `http://localhost:3000`。这个地址就是用 `cargo run` 启动的本机后端地址。网站开发服务器的默认端口也是 3000。
