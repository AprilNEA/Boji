# Boji Android

Boji 的原生 Android 客户端，使用 Kotlin 和 Jetpack Compose。Android 版已移植 iOS 版的全部本地功能，界面遵循 Material 3。账号、会员、健康数据接入和设备联动尚未移植，详见[尚未移植的功能](#尚未移植的功能)。

## 已实现

- 首次引导：选择居家或健身房训练。
- 今日看板：训练、饮水、睡眠的记录状态和今日推荐课程。
- 日常记录：饮水增减、睡眠时长、体重和腰围，均有输入校验。
- 训练：4 套课程（3 套入门、1 套进阶）、动作说明和逐组训练。
- 训练计时：暂停、继续、30 秒休息倒计时和完成记录。离开前台时自动暂停。
- 足迹：累计训练次数、活跃天数、最近 7 天、身体数据趋势图和文字分享。
- 俱乐部：本地每周挑战和 3 篇入门文章。
- 设置：昵称、训练场景、外观、JSON 导出和本地数据删除。

数据规则与 iOS 版一致。同一天重复完成同一课程不会重复计数。课程页的分钟数是计划时长，完成页另行显示本次计时。

## 环境要求

- JDK 17。AGP 9.4 要求 JDK 17 或更高版本。
- Android SDK Platform 37 和 Build Tools 36.0.0 或更高版本。
- 不需要单独安装 Gradle。工程自带 Gradle 9.8.2 Wrapper，下载时校验发行包的 SHA-256。

## 构建与测试

1. 在 `android/` 下创建 `local.properties`，写入 Android SDK 路径。该文件不纳入版本控制。下例为 Homebrew `android-commandlinetools` 的路径：

    ```properties
    sdk.dir=/opt/homebrew/share/android-commandlinetools
    ```

2. 在仓库根目录进入 devenv（`devenv shell`，或用 direnv 加载 `.envrc`）。devenv 提供 JDK 17，并设置 `JAVA_HOME`。如果不用 devenv，就手动将 `JAVA_HOME` 指向 JDK 17。下例为 Homebrew `openjdk@17` 的路径：

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
| 导航 | Navigation 3 1.2.0 | 每个标签各有一个返回栈。`NavigationSuiteScaffold` 在窄屏显示底部导航栏，在中等及以上宽度显示导航轨 |
| 状态 | Lifecycle 2.11.0 | 界面通过 `collectAsStateWithLifecycle` 读取状态。训练过程使用 ViewModel，作用域为导航条目 |
| 存储 | kotlinx.serialization 1.12.0、DataStore 1.2.1 | 记录保存为 JSON 文件，外观偏好保存在 DataStore |
| 并发 | kotlinx.coroutines 1.11.0 | 文件读写在 IO 线程，由单一协程顺序执行 |
| SDK | `minSdk` 26，`compileSdk` 和 `targetSdk` 37 | Google Play 自 2026-08-31 起要求新应用和更新的 target 不低于 36 |
| 应用 ID | `club.leanmuscle.boji` | 与 iOS Bundle ID 相同，首次上架后不能修改 |

以上版本于 2026-10-20 对照 Google Maven、Maven Central 和 Gradle 官方发布信息确认。

AGP 9.4.1 的内置 Kotlin 默认依赖 KGP 2.2.10。根目录的 `build.gradle.kts` 在 `buildscript` 中声明 KGP 2.4.21。Compose 编译器插件和序列化插件必须使用相同版本。升级 Kotlin 时，只修改版本目录中的 `kotlin`。

工程没有使用依赖注入框架。`BojiApplication` 创建 `AppContainer`，其中只有 `BojiStore` 和外观偏好两个对象。对象数量明显增加后，再评估 Hilt 或 Koin。

## 代码结构

源码位于 `app/src/main/kotlin/club/leanmuscle/boji/`。

| 目录 | 内容 |
| --- | --- |
| `core/model/` | 数据模型、课程库、文章内容和 `BojiSnapshot`。`BojiSnapshot` 集中计算今日记录、累计次数和最近一周 |
| `core/data/` | `BojiStore`、`state.json` 的读写和外观偏好。所有校验规则都在 `BojiStore` 中 |
| `feature/` | 各页面：`onboarding`、`today`、`entry`（记录弹层）、`training`（含 `session`）、`progress`、`club`、`settings` |
| `ui/` | 应用外壳 `BojiApp`、共享组件、导航键和主题 |

`BojiStore` 对外提供 `StateFlow<BojiSnapshot?>`。读取 `state.json` 完成前，值为 `null`。修改操作先更新内存状态，再由写入协程合并保存。保存失败时，所有页面顶部显示错误提示，与 iOS 版一致。

单元测试位于 `app/src/test/`，覆盖 `BojiStore`、训练状态机和导航目的地。界面测试位于 `app/src/androidTest/`，覆盖引导、标签切换、记录、训练、挑战和数据删除。

## 与 iOS 版的对应

iOS 版采用 Liquid Glass 和 Apple 人机界面指南。Android 版遵循 Material 3，不模仿玻璃材质。

| iOS | Android |
| --- | --- |
| `TabView`：今天、训练、足迹、俱乐部 | `BojiDestination` 定义相同的四个目的地和顺序 |
| 每个标签内的 `NavigationStack` | 每个标签一个 Navigation 3 返回栈。切换标签时保留各自的页面和滚动位置。再次点击当前标签时返回该标签首页 |
| 训练过程的 `fullScreenCover` | 应用级返回栈中的一个条目，覆盖标签栏。系统返回手势先弹出结束确认 |
| `sheet` 记录弹层 | `ModalBottomSheet` |
| `confirmationDialog` | `AlertDialog` |
| Swift Charts 趋势图 | Compose `Canvas` 绘制折线和数据点 |
| `ShareLink` | 系统分享面板（`ACTION_SEND`），只分享文字 |
| `fileExporter` | 系统文件选择器（`CreateDocument`），默认文件名为 `boji-records.json` |
| SF Symbols | Material Symbols 矢量图标，选中时使用填充样式 |
| 强调色 `#C7401F` | 以 `#C7401F` 为种子生成 Material 3 配色。浅色 `primary` 为 `#A52806`，`primaryContainer` 为 `#C7401F` |
| 应用内外观设置 | 跟随系统、浅色、深色三种模式。系统栏图标颜色跟随应用的模式 |
| 浅色和深色图标 | 自适应图标，支持 Android 13 的主题图标 |

配色值位于 `ui/theme/Color.kt`，由 `@material/material-color-utilities` 0.4.0 的 `SchemeContent` 生成。修改品牌色时，重新生成整套配色，不要单独修改某个角色。饮水、睡眠等语义色位于 `ui/theme/BojiColors.kt`，浅色和深色各有一组，对比度按 WCAG AA 选取。

启动图标中的「b」由几何路径绘制，没有使用 SF Rounded 字形。原因是 SF 字体的许可只覆盖 Apple 平台。

### 有意保留的差异

- **每周起始日**：最近一周和每周挑战按系统区域设置计算每周第一天。iOS 版的行为相同。
- **俱乐部会员卡**：Android 版在会员卡位置显示说明卡片，说明账号和会员卡尚未开放。
- **分享**：iOS 版可以分享会员卡图片。Android 版只有足迹页的文字分享。

## 数据与隐私

记录保存在应用私有目录的 `files/state.json`。JSON 结构与 iOS 版相同：键名排序、时间为精确到秒的 ISO 8601、记录 ID 为大写 UUID。`BojiStoreTest` 用 iOS 格式的样例验证了双向解码。两端都没有导入功能，跨平台迁移尚未实现。

`state.json` 读取失败时，应用不会覆盖原文件，而是阻止写入并显示错误。用户可以在设置中删除全部数据来恢复。

系统备份和设备迁移都排除了这些记录。配置位于 `AndroidManifest.xml` 和 `res/xml/data_extraction_rules.xml`。因此卸载应用会删除记录，设置页的隐私说明写明了这一点。

## 设计决定

- **固定品牌色**：未启用 Android 12 的动态取色，以保持与 iOS 版一致。
- **不锁定竖屏**：iOS 版在 iPhone 上只支持竖屏。Android 16 起，target 36 及以上的应用在最小宽度不小于 600dp 的屏幕上，方向和尺寸限制不再生效。target 37 时无法再退出该行为，因此界面适配横屏和大屏。内容区最大宽度为 680dp，在宽屏上居中。
- **暂不申请网络权限**：当前没有联网功能。接入会员服务时，再添加 `INTERNET` 权限。
- **界面文字只有中文**：应用字符串只放在 `res/values/`。Material 组件自带的无障碍文字（例如底部弹层的「Close sheet」）跟随系统语言。

## 尚未移植的功能

以下 iOS 功能在 Android 版中尚不存在：

- 邮箱登录、账号与安全、服务端领卡、会员状态同步和会员卡图片分享
- HealthKit 只读查询、Apple 登录和 Wallet
- 小组件和 Apple Watch 的当天打卡状态共享

账号和会员功能需要先确定认证令牌的安全存储方式。HealthKit、Apple 登录、Wallet、小组件和 Watch 在 Android 上没有直接对应。可评估的替代方案包括 Health Connect、Credential Manager、Google Wallet、Glance 小组件和 Wear OS，尚未评估。

会员接口契约见[会员卡开发说明](../docs/membership.md)。模拟器访问本机后端时，地址使用 `http://10.0.2.2:3000`，不能使用 `localhost`。Debug 构建使用明文 HTTP 时，还需要添加网络安全配置。

## 验证记录

验证时间为 2026-10-20 18:30（UTC+08:00）。环境为 macOS、JDK 17.0.20.1、Gradle 9.8.2，模拟器为 API 36 的 Pixel 7 配置（arm64，Google APIs）。

已验证：

- `testDebugUnitTest`：27 项通过，0 项失败。
- `connectedDebugAndroidTest`：9 项界面测试在模拟器上通过，0 项失败。
- `lintDebug`：未发现问题。
- `assembleDebug` 成功，调试安装包为 13.9 MB。
- `assembleRelease` 成功，R8 压缩后的未签名安装包为 1.8 MB。用调试密钥签名后在模拟器上完成引导、训练、标签切换、文章和设置，没有崩溃。旋转屏幕后，当前页面和返回栈正确恢复。
- 在模拟器上手动检查了浅色和深色模式、横屏布局、强制停止后的数据保留，以及导出时系统文件选择器的打开。
- 2026-10-20 20:56（UTC+08:00）包名改为 `club.leanmuscle.boji` 并加入进阶课程后，复跑了 `assembleDebug testDebugUnitTest lintDebug compileDebugAndroidTestKotlin`：27 项单元测试通过，Lint 未发现问题。

未验证：

- 导出文件的实际写入。检查时只打开了文件选择器，没有保存文件。
- TalkBack 全流程、200% 字体缩放、平板和折叠屏的导航轨。
- API 26 至 35 的设备和真机。
- 包名修改和进阶课程加入之后，界面测试尚未在设备上重新运行。

已知警告：

- AGP 或 Kotlin 插件在配置阶段调用了已弃用的 `Configuration.setVisible`。Gradle 计划在 11 版移除该方法。工程脚本没有调用该方法，具体来源未验证。
- 构建提示无法 strip `libandroidx.graphics.path.so` 和 `libdatastore_shared_counter.so`，这两个库按原样打包。可能原因是本机未安装 AGP 默认的 NDK 28.2.13676358（未验证）。
