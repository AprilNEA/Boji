# Boji Android

Boji 的原生 Android 客户端，使用 Kotlin 和 Jetpack Compose。目前只完成了工程初始化：四个顶层页面的导航外壳、Material 3 品牌主题和自适应启动图标。iOS 版的业务功能尚未移植，每个页面目前显示「此页面尚未实现」。

## 环境要求

- JDK 17。AGP 9.4 要求 JDK 17 或更高版本。
- Android SDK Platform 37 和 Build Tools 36.0.0 或更高版本。
- 不需要单独安装 Gradle。工程自带 Gradle 9.8.2 Wrapper，下载时校验发行包的 SHA-256。

## 构建与测试

1. 在 `android/` 下创建 `local.properties`，写入 Android SDK 路径。该文件不纳入版本控制。下例为 Homebrew `android-commandlinetools` 的路径：

    ```properties
    sdk.dir=/opt/homebrew/share/android-commandlinetools
    ```

2. 将 `JAVA_HOME` 指向 JDK 17。下例为 Homebrew `openjdk@17` 的路径：

    ```sh
    export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
    ```

3. 在 `android/` 目录中运行构建、单元测试和 Lint：

    ```sh
    ./gradlew assembleDebug testDebugUnitTest lintDebug
    ```

    成功后，调试安装包位于 `app/build/outputs/apk/debug/app-debug.apk`。

界面测试需要先连接设备或启动模拟器，再运行 `./gradlew connectedDebugAndroidTest`。

使用 Android Studio 时，打开 `android/` 目录，不要打开仓库根目录。仓库根目录不是 Gradle 工程，iOS 工程位于 `ios/`。

## 技术选型

| 项目 | 选择 | 说明 |
| --- | --- | --- |
| 构建 | AGP 9.4.1、Gradle 9.8.2 | 依赖版本集中在 `gradle/libs.versions.toml` |
| 语言 | Kotlin 2.4.21 | 使用 AGP 内置 Kotlin，不应用 `org.jetbrains.kotlin.android` 插件 |
| 界面 | Compose BOM 2026.09.00 | Material 3 1.4.0、Compose UI 1.12.1 |
| 导航 | `NavigationSuiteScaffold` | 窄屏显示底部导航栏，中等及以上宽度显示导航轨 |
| SDK | `minSdk` 26，`compileSdk` 和 `targetSdk` 37 | Google Play 自 2026-08-31 起要求新应用和更新的 target 不低于 36 |
| 应用 ID | `com.aprilnea.boji` | 与 iOS Bundle ID 相同，首次上架后不能修改 |

以上版本于 2026-10-20 对照 Google Maven、Maven Central 和 Gradle 官方发布信息确认。

AGP 9.4.1 的内置 Kotlin 默认依赖 KGP 2.2.10。根目录的 `build.gradle.kts` 在 `buildscript` 中声明 KGP 2.4.21，Compose 编译器插件必须使用相同版本。升级 Kotlin 时，只修改版本目录中的 `kotlin`。

## 与 iOS 版的对应

iOS 版采用 Liquid Glass 和 Apple 人机界面指南。Android 版遵循 Material 3，不模仿玻璃材质。

| iOS | Android |
| --- | --- |
| `TabView`：今天、训练、足迹、俱乐部 | `BojiDestination` 定义相同的四个目的地和顺序 |
| SF Symbols | Material Symbols 矢量图标，选中时使用填充样式 |
| 强调色 `#C7401F` | 以 `#C7401F` 为种子生成 Material 3 配色。浅色 `primary` 为 `#A52806`，`primaryContainer` 为 `#C7401F` |
| 浅色和深色外观 | 跟随系统设置。应用内外观设置尚未实现 |
| 浅色和深色图标 | 自适应图标，支持 Android 13 的主题图标 |

配色值位于 `ui/theme/Color.kt`，由 `@material/material-color-utilities` 0.4.0 的 `SchemeContent` 生成。修改品牌色时，重新生成整套配色，不要单独修改某个角色。

启动图标中的「b」由几何路径绘制，没有使用 SF Rounded 字形。原因是 SF 字体的许可只覆盖 Apple 平台。

## 设计决定

- **固定品牌色**：未启用 Android 12 的动态取色，以保持与 iOS 版一致。
- **关闭备份和设备迁移**：身体数据属于敏感个人信息。iOS 版允许系统备份；Android 版在数据层确定哪些内容可以离开设备之前，先关闭这两项。届时再修改 `AndroidManifest.xml` 和 `res/xml/data_extraction_rules.xml`。
- **不锁定竖屏**：iOS 版在 iPhone 上只支持竖屏。Android 16 起，target 36 及以上的应用在最小宽度不小于 600dp 的屏幕上，方向和尺寸限制不再生效。target 37 时无法再退出该行为，因此界面必须适配横屏和大屏。
- **暂不申请网络权限**：当前没有联网功能。接入会员服务时，再添加 `INTERNET` 权限。

## 尚未移植的功能

以下 iOS 功能在 Android 版中尚不存在：

- 首次引导、今日看板、饮水和睡眠记录
- 训练课程、逐组训练和训练计时
- 足迹趋势图和身体数据
- 俱乐部挑战、会员身份卡和入门文章
- 邮箱登录、服务端领卡、状态同步和图片分享
- 设置、JSON 导出和本地数据删除

开始移植前，需要先确定数据层：本地存储方式、导出 JSON 是否与 iOS 版的 `state.json` 结构兼容，以及认证令牌的安全存储方式。iOS 版的 HealthKit、Apple 登录和 Wallet 在 Android 上没有直接对应，需要另行评估 Health Connect 等替代方案。

会员接口契约见[会员卡开发说明](../docs/membership.md)。模拟器访问本机后端时，地址使用 `http://10.0.2.2:3000`，不能使用 `localhost`。Debug 构建使用明文 HTTP 时，还需要添加网络安全配置。

## 验证记录

验证时间为 2026-10-20 17:06（UTC+08:00）。环境为 macOS、JDK 17.0.20.1、Gradle 9.8.2。

已验证：

- `assembleDebug` 成功，生成 11.7 MB 的调试安装包。
- `assembleRelease` 成功，R8 压缩后的未签名安装包为 1.0 MB。
- `testDebugUnitTest`：3 项通过，0 项失败。
- `lintDebug`：未发现问题。
- `compileDebugAndroidTestKotlin` 成功，无弃用警告。

未验证：

- 2 项 Compose 界面测试（`BojiAppTest`）尚未在设备上运行。
- 模拟器和真机启动、深色模式、平板导航轨和 TalkBack 均未检查。

已知警告：

- AGP 或 Kotlin 插件在配置阶段调用了已弃用的 `Configuration.setVisible`。Gradle 计划在 11 版移除该方法。工程脚本没有调用该方法，具体来源未验证。
- 构建提示无法 strip `libandroidx.graphics.path.so`，该库按原样打包。可能原因是本机未安装 AGP 默认的 NDK 28.2.13676358（未验证）。
