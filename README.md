> [!WARNING]
> Boji 仍在开发中，iOS 和 Android 两端都尚未上架。

<p align="center">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="assets/boji-icon-dark.png">
        <img src="assets/boji-icon.png" width="138" alt="Boji 应用图标"/>
    </picture>
</p>

<h1 align="center">Boji · 薄肌俱乐部</h1>

<p align="center"><strong>本地优先的健身记录 App<br/>训练、饮水、睡眠和身体数据保存在本机，基础记录无需登录</strong></p>

<div align="center">
    <img alt="iOS 26+" src="https://img.shields.io/badge/iOS-26%2B-000000?style=flat&logo=apple&logoColor=white">
    <img alt="watchOS 26+" src="https://img.shields.io/badge/watchOS-26%2B-000000?style=flat&logo=apple&logoColor=white">
    <img alt="Android 8.0+" src="https://img.shields.io/badge/Android-8.0%2B-3DDC84?style=flat&logo=android&logoColor=white">
    <a href="https://twitter.com/AprilNEA" target="_blank">
    <img alt="twitter" src="https://img.shields.io/badge/follow-AprilNEA-green?style=social&logo=Twitter"></a>
    <img alt="Hits" src="https://hits.aprilnea.com/hits?url=https://github.com/aprilnea/boji">
</div>

<p align="center">iOS 和 Android 都是原生客户端。iOS 版附带 Apple Watch App 和小组件。</p>

---

## 功能

两端都提供以下本地功能：

- **训练**：4 套课程（居家基础、居家进阶、器械基础和舒缓拉伸），包含动作说明、逐组计时和休息倒计时。
- **日常记录**：饮水、睡眠和身体数据，带输入校验。
- **今日与足迹**：当天的打卡状态、最近 7 天活动和身体数据趋势图。
- **俱乐部**：本地每周挑战和入门文章。
- **设置**：昵称、外观、JSON 导出和本地数据删除。

iOS 版另外接入了账号与免费会员卡、Apple 健康只读查询、小组件和 Apple Watch。这些功能尚未移植到 Android，详见 [Android 说明](android/README.md#尚未移植的功能)。

课程是通用参考，不提供医疗诊断。

## 仓库结构

本仓库包含两个原生客户端、一个后端、两端共用的动作动画和薄肌俱乐部宣传网站。每个目录各自独立构建。

| 目录 | 内容 | 状态 | 说明文档 |
| --- | --- | --- | --- |
| `ios/` | iOS App、watchOS App 和小组件：SwiftUI 和 XcodeGen 工程 | 首版功能已实现 | [iOS 说明](ios/README.md) |
| `android/` | Android App：Kotlin、Jetpack Compose 和 Gradle 工程 | 本地功能已移植；账号、会员和设备联动尚未移植 | [Android 说明](android/README.md) |
| `bizserver/` | 后端：Rust、Axum、ConnectRPC、SeaORM 和 PostgreSQL | 开发中，尚未部署 | [后端说明](bizserver/README.md) |
| `animations/` | 动作 Lottie 动画：TypeScript 生成器和生成的 JSON | 16 个课程动作已生成 | [动作动画说明](animations/README.md) |
| `web/` | 薄肌俱乐部宣传网站：Next.js 静态导出、Tailwind CSS 和 Motion | 已从 `bojiclub` 导入 | [网站说明](web/README.md) |
| `docs/` | 两端共享的文档 | 不适用 | [会员卡开发说明](docs/membership.md) |
| `assets/` | README 使用的应用图标，浅色和深色各一张 | 不适用 | 不适用 |

每个目录还有一份 `AGENTS.md`，记录面向编码代理的目录规则。

## 本地开发

按组件选择入口。完整的环境要求、构建和测试命令见各目录的说明文档。

- **iOS**：用 Xcode 打开 `ios/Boji.xcodeproj`，选择 `Boji` scheme 和 iOS 模拟器后运行。修改 `ios/project.yml` 后，在 `ios/` 目录运行 `xcodegen generate` 重新生成工程。
- **Android**：用 Android Studio 打开 `android/` 目录，不要打开仓库根目录。命令行构建需要 JDK 17 和 `local.properties` 中的 SDK 路径，然后在 `android/` 目录运行 `./gradlew assembleDebug testDebugUnitTest lintDebug`。
- **后端**：需要 Rust 1.99.0、`protoc`、PostgreSQL 和本机的 better-auth-rs 工作区。准备 `.env` 后，在 `bizserver/` 目录依次运行 `docker compose up -d postgres`、`cargo run --locked -- migrate` 和 `cargo run --locked -- serve`。
- **动作动画**：在 devenv 环境中进入 `animations/` 目录，运行 `pnpm build` 重新生成 `lottie/`。
- **网站**：在 devenv 环境中进入 `web/` 目录，运行 `pnpm dev` 启动开发服务器，运行 `pnpm build` 生成静态站点。

动作动画和网站的工具链由根目录的 `devenv.nix` 提供，使用前必须先安装 [devenv](https://devenv.sh "前往 devenv 官网")。在仓库根目录运行 `devenv test`，会检查 `animations/` 和 `web/` 的类型，并确认 `animations/lottie/` 与源码一致。

iOS 的 Debug 构建默认连接 `http://localhost:3000`。这个地址就是用 `cargo run` 启动的本机后端地址。网站开发服务器的默认端口也是 3000。

## 共享约定

两个客户端和动画目录共用以下约定：

- **动作 ID**：iOS 的 [`Exercise.id`](ios/Boji/Models/BojiStore.swift)、Android 的 [`Workout.kt`](android/app/src/main/kotlin/club/leanmuscle/boji/core/model/Workout.kt) 和动画的 [`COURSES`](animations/src/courses.ts) 使用同一套 ID。重命名或新增课程动作时，必须同时修改这三处，并重新生成 `animations/lottie/`。
- **会员号**：会员号是服务端返回的不透明字符串。客户端原样保存和显示，不做数值转换，也不推断格式。
- **会员接口**：用户流程、接口契约和隐私规则见[会员卡开发说明](docs/membership.md)。

## 数据与隐私

基础记录保存在应用自身的 `state.json` 中，两端使用相同的 JSON 结构。两端目前都没有导入功能，跨平台迁移尚未实现。

领取会员卡需要登录。登录会向后端提交邮箱和认证信息，训练和身体记录不会因领卡上传。各端的存储位置、备份行为和导出范围见 [iOS 说明](ios/README.md#数据与隐私)和 [Android 说明](android/README.md#数据与隐私)。

## 命名与发布

「薄肌」为开发暂用名称，商标核查尚未完成。iOS 的发布签名和 App Store 审核也尚未完成。

## 参与开发

- 默认分支为 `master`。
- 提交信息使用英文，遵循 Conventional Commits。只改动一个顶层目录时，用目录名作为 scope，例如 `feat(ios): add membership cards`。
- 修改某个目录的结构、命令或规则时，在同一次改动中更新该目录的 `AGENTS.md`。
- 本项目的提交附带以下协作署名，署名与提交正文之间空一行：

    ```text
    Co-authored-by: Manus <dev-agent@manus.ai>
    ```
