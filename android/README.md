# Boji Android

Boji 的原生 Android 客户端，使用 Kotlin 和 Jetpack Compose。Android 版已移植 iOS 版的全部本地功能，以及邮箱账号和免费会员卡，界面遵循 Material 3。健康数据接入、Wallet、小组件和手表尚未移植，详见[尚未移植的功能](#尚未移植的功能)。

## 已实现

- 首次引导：选择居家或健身房训练。
- 今日看板：训练、饮水、睡眠的记录状态和今日推荐课程。
- 日常记录：饮水增减、睡眠时长、体重和腰围，均有输入校验。
- 训练：4 套课程（3 套入门、1 套进阶）、动作说明和逐组训练。
- 动作动画：训练过程中，当前动作卡片循环播放 Lottie 动画，浅色和深色各一套。
- 训练计时：暂停、继续、30 秒休息倒计时和完成记录。离开前台时自动暂停，旋转屏幕或切换深浅色时不暂停。
- 足迹：累计训练次数、活跃天数、最近 7 天、身体数据趋势图和文字分享。
- 俱乐部：本地每周挑战和 3 篇入门文章。
- 账号：邮箱注册、登录、重发验证邮件、密码重置邮件、修改密码和退出其他会话。登录后可以用 Credential Manager 保存密码。
- 会员卡：昵称、三条共识和核对三步领取免费会员卡；显示服务端返回的会员状态、加入日期和权益；离线时显示上次同步的副本。
- 会员卡分享：选择三种配色之一生成图片，默认隐藏卡号，通过系统分享面板发送。
- 设置：昵称、训练场景、外观、俱乐部账号入口、JSON 导出和本地数据删除。

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

会员服务的地址在构建时设置。Debug 构建默认使用 `http://10.0.2.2:3000`，即模拟器访问本机的地址。Release 构建默认不设置地址，会员中心显示离线说明，应用不发出会员请求。

```sh
./gradlew :app:assembleRelease -Pboji.apiBaseUrl=https://<会员服务主机>
```

Baseline Profile 需要在连接的模拟器或设备（API 28 及以上）上生成。生成结果位于 `app/src/release/generated/baselineProfiles/`，需要提交：

```sh
./gradlew :app:generateBaselineProfile
```

使用 Android Studio 时，打开 `android/` 目录，不要打开仓库根目录。仓库根目录不是 Gradle 工程，iOS 工程位于 `ios/`。

## 技术选型

| 项目 | 选择 | 说明 |
| --- | --- | --- |
| 构建 | AGP 9.4.1、Gradle 9.8.2 | 依赖版本集中在 `gradle/libs.versions.toml` |
| 语言 | Kotlin 2.4.21 | 使用 AGP 内置 Kotlin，不应用 `org.jetbrains.kotlin.android` 插件 |
| 界面 | Compose BOM 2026.09.00 | Material 3 1.4.0、Compose UI 1.12.1 |
| 导航 | Navigation 3 1.2.0 | 每个标签各有一个返回栈。`NavigationSuiteScaffold` 在窄屏显示底部导航栏，在中等及以上宽度显示导航轨 |
| 状态 | Lifecycle 2.11.0 | 每个页面一个 ViewModel，作用域为导航条目。界面通过 `collectAsStateWithLifecycle` 读取状态 |
| 依赖注入 | Hilt 2.60.1、KSP 2.3.12 | 模块位于 `core/di/`。不使用 kapt |
| 存储 | DataStore 1.2.1、kotlinx.serialization 1.12.0 | 记录保存为 JSON DataStore（`state.json`），外观偏好保存在 Preferences DataStore |
| 并发 | kotlinx.coroutines 1.11.0 | 写入在应用级协程作用域中执行，关闭页面不会取消保存 |
| 网络 | OkHttp 5.5.0、Retrofit 3.0.0 | 全应用共用一个 `OkHttpClient`。Better Auth 的 JSON 接口通过 Retrofit 和 kotlinx.serialization 转换器调用 |
| RPC | connect-kotlin 0.9.0、Protobuf 4.36.2（lite） | `:rpc` 模块由 `buf generate` 从 `../bizserver/proto/` 生成客户端 |
| 凭据 | Credential Manager 1.6.0、Android Keystore | 会话令牌和会员卡缓存用 Keystore 中的 AES-256-GCM 密钥加密，再存入 DataStore |
| 性能 | Baseline Profile（Benchmark 1.5.0）、ProfileInstaller 1.4.1 | `:baselineprofile` 模块生成配置文件并运行启动基准测试 |
| 动画 | Lottie 6.7.1（`lottie-compose`） | 直接读取 `../animations/lottie/` 中的 JSON，不复制文件 |
| SDK | `minSdk` 26，`compileSdk` 和 `targetSdk` 37 | Google Play 自 2026-08-31 起要求新应用和更新的 target 不低于 36 |
| 应用 ID | `club.leanmuscle.boji` | 与 iOS Bundle ID 相同，首次上架后不能修改 |

以上版本于 2026-10-20 至 2026-10-21 对照 Google Maven、Maven Central 和 Gradle 官方发布信息确认。

AGP 9.4.1 的内置 Kotlin 默认依赖 KGP 2.2.10。根目录的 `build.gradle.kts` 在 `buildscript` 中声明 KGP 2.4.21。Compose 编译器插件和序列化插件必须使用相同版本。升级 Kotlin 时，只修改版本目录中的 `kotlin`。

依赖由 Hilt 提供。每个页面有两个重载：无状态重载接收状态和回调；有状态重载用 `hiltViewModel()` 取得 ViewModel。可组合函数不直接接收 `BojiStore` 或仓库对象。

`boji.v1` 的 RPC 使用 connect-kotlin 生成的客户端，消息格式为二进制 Protobuf。connect-kotlin 自称 beta，但它直接使用 `bizserver/proto/` 的契约，不需要手写请求和响应类型。Better Auth 的 `/api/auth/` 接口不在 proto 契约中，因此使用 Retrofit。

## 代码结构

源码位于 `app/src/main/kotlin/club/leanmuscle/boji/`。

| 目录 | 内容 |
| --- | --- |
| `core/model/` | 数据模型、课程库、文章内容和 `BojiSnapshot`。`BojiSnapshot` 集中计算今日记录、累计次数和最近一周 |
| `core/data/` | `BojiStore`、`state.json` 的序列化器和外观偏好。所有记录的校验规则都在 `BojiStore` 中 |
| `core/di/` | Hilt 模块：协程作用域、数据文件、账户文件、网络和系统服务 |
| `core/network/` | 服务地址校验 `ServerEndpoint`、Better Auth 客户端、会员 RPC 客户端和错误类型 |
| `core/auth/` | Keystore 加密器、加密的 JSON 序列化器和会话存储 |
| `core/membership/` | 会员卡模型、领卡规则、会员卡缓存和 `MembershipRepository`。账户规则与 iOS 的 `MembershipStore` 一致 |
| `feature/` | 各页面：`onboarding`、`today`、`entry`（记录弹层）、`training`（含 `session`）、`progress`、`club`、`membership`、`settings` |
| `ui/` | 应用外壳 `BojiApp`、共享组件、导航键和主题 |

另有两个 Gradle 模块：`rpc/` 是生成的 API 客户端，`baselineprofile/` 生成 Baseline Profile。

`BojiStore` 对外提供 `StateFlow<BojiSnapshot?>`。读取 `state.json` 完成前，值为 `null`。写入通过 DataStore 的 `updateData` 依次执行。保存失败时，所有页面顶部显示错误提示，与 iOS 版一致。

单元测试位于 `app/src/test/`，覆盖 `BojiStore`、训练状态机、导航目的地、动作动画资源、服务地址校验、领卡规则、会员卡模型、加密序列化器和 `MembershipRepository`。`MembershipRepository` 的测试用 MockWebServer 模拟 Better Auth 和 Connect 接口。界面测试位于 `app/src/androidTest/`，覆盖引导、标签切换、记录、训练、动作动画、挑战、数据删除、会员中心和 Keystore 加密。界面测试用 Hilt 替换数据和账户文件的位置，每个测试使用新目录。

## 动作动画

动画文件由 `animations/` 生成，Android 工程不保存副本。`app/build.gradle.kts` 把 `../animations/lottie` 加为 `main` 的 assets 目录，安装包中的路径为 `light/<动作 ID>.json` 和 `dark/<动作 ID>.json`。该目录只包含课程用到的动作。尚未编入课程的动作在 `animations/lottie-library/`，不会打包。文件格式和目录约定见 [animations 的 README](../animations/README.md)。

播放规则如下：

- 只在训练过程的当前动作卡片中播放。课程详情等列表仍显示图标，同一屏最多播放一个动画。
- 深浅色跟随应用实际使用的模式，包括设置中的浅色和深色选项。切换后加载另一套文件。
- 训练暂停时，动画停在当前帧。休息倒计时期间显示原有插画。
- 系统关闭动画（动画时长缩放为 0）时，显示代表帧，不播放。代表帧是 `index.json` 中的 `posterFrame`，例如深蹲的最低点。如果索引中没有该动作，就显示第一帧。
- 文件缺失或加载失败时，显示原有图标，应用不会崩溃。

动画文件使用 JSON，没有转换为 `.lottie`。原因是 lottie-android 读取 `.lottie` 时有已知问题，而且安装包本身会压缩 assets。

`ExerciseAnimationIndex` 在第一次使用时读取 `index.json` 并缓存结果。它只读取 `id`、`frames` 和 `posterFrame`，并忽略其他字段。因此 `animations/` 新增字段时，应用不需要修改。

`ExerciseAnimationAssetsTest` 检查以下内容：`index.json` 的条目与课程动作一一对应；每个条目的 `course` 是包含该动作的课程 ID；`posterFrame` 在 `[0, frames)` 内；浅色和深色文件都存在。界面测试 `ExerciseAnimationTest` 还会从安装包中读取 `index.json`，确认每个课程动作都有有效的代表帧。

下面的体积按 16 个课程动作计算，共 32 个动画文件和 1 个 `index.json`。Release 安装包从 1,846,795 字节增至 2,622,007 字节，增加 775,212 字节。其中动画文件压缩后占 459,232 字节，原始大小为 3,174,813 字节；`index.json` 压缩后占 1,087 字节。其余增量来自 Lottie 及其依赖的 `appcompat`。Debug 安装包从 13,379,094 字节增至 15,278,222 字节。

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
| `ShareLink` | 系统分享面板（`ACTION_SEND`）。足迹页分享文字，会员卡分享 PNG 图片，图片经 `FileProvider` 提供 |
| `fileExporter` | 系统文件选择器（`CreateDocument`），默认文件名为 `boji-records.json` |
| Keychain 保存会话令牌 | Android Keystore 中的 AES-256-GCM 密钥加密后存入 DataStore。不使用已弃用的 EncryptedSharedPreferences |
| `URLSession` 调用接口 | OkHttp。Better Auth 用 Retrofit，`boji.v1` 用 connect-kotlin |
| 密码自动填充 | 输入框声明自动填充类型，并用 Credential Manager 读取和保存密码 |
| SF Symbols | Material Symbols 矢量图标，选中时使用填充样式 |
| 强调色 `#C7401F` | 以 `#C7401F` 为种子生成 Material 3 配色。浅色 `primary` 为 `#A52806`，`primaryContainer` 为 `#C7401F` |
| 应用内外观设置 | 跟随系统、浅色、深色三种模式。系统栏图标颜色跟随应用的模式 |
| Icon Composer 图标 | 相同的叉腰人物与瓷白／灰绿配色，使用自适应矢量图标，支持 Android 13 的主题图标 |

配色值位于 `ui/theme/Color.kt`，由 `@material/material-color-utilities` 0.4.0 的 `SchemeContent` 生成。修改品牌色时，重新生成整套配色，不要单独修改某个角色。饮水、睡眠等语义色位于 `ui/theme/BojiColors.kt`，浅色和深色各有一组，对比度按 WCAG AA 选取。

启动图标的轮廓源自 `../ios/Boji/Resources/AppIcon.icon/Assets/mark.svg`，Android 矢量资源位于 `app/src/main/res/drawable/ic_launcher_foreground.xml`。图形按启动器安全区缩放，背景与前景分层，外轮廓由启动器裁切。主题图标复用同一前景的透明度轮廓。

### 有意保留的差异

- **每周起始日**：最近一周和每周挑战按系统区域设置计算每周第一天。iOS 版的行为相同。
- **RPC 编码**：iOS 版用 `URLSession` 发送 JSON 编码的 Connect 请求。Android 版用 connect-kotlin 发送二进制 Protobuf（`application/proto`）。两者调用相同的服务和方法。[bizserver 的 RPC 说明](../bizserver/docs/connectrpc-api.md)写明服务端同时接受两种编码。
- **系统登录**：iOS 版有 Apple 登录。Android 版只有邮箱和密码，因为服务端是否支持 Google 登录尚未确认。
- **密码与网站关联**：应用尚未声明 Digital Asset Links，所以 Credential Manager 保存的密码不会与网站共享。原因记录在 `AndroidManifest.xml` 中。

## 数据与隐私

记录保存在应用私有目录的 `files/state.json`。JSON 结构与 iOS 版相同：键名排序、时间为精确到秒的 ISO 8601、记录 ID 为大写 UUID。`BojiStoreTest` 用 iOS 格式的样例验证了双向解码。两端都没有导入功能，跨平台迁移尚未实现。

`state.json` 读取失败时，应用不会覆盖原文件，而是阻止写入并显示错误。用户可以在设置中删除全部数据来恢复。

登录时，邮箱和密码发送到会员服务。领卡时，发送昵称和守则版本。训练、饮水、睡眠和身体记录不会上传。会话令牌和会员卡缓存分别保存在 `files/` 下的两个加密文件中，密钥在 Android Keystore 中，不能导出。文件无法解密时（例如密钥丢失），应用按未登录处理。数据导出不包含这两个文件。

退出登录会清除这两个文件。在设置中删除全部数据时，也会清除它们，但不会删除服务端的账号和会员资格。

系统备份和设备迁移都排除了这些文件。配置位于 `AndroidManifest.xml` 和 `res/xml/data_extraction_rules.xml`。因此卸载应用会删除记录，设置页的隐私说明写明了这一点。

`network_security_config.xml` 禁止明文 HTTP。只有 Debug 构建允许访问 `10.0.2.2`、`localhost` 和 `127.0.0.1` 的 HTTP 地址。

构建时设置了 Sentry DSN，应用才会上报崩溃和 ANR。默认构建不设置 DSN，不上报任何内容。上报内容不含训练和身体记录。启用方式和上报字段见 [Sentry 错误上报](../docs/sentry.md)。

```sh
./gradlew :app:assembleRelease -Pboji.sentryDsn='https://<公钥>@<主机>/<项目编号>'
```

## 设计决定

- **固定品牌色**：未启用 Android 12 的动态取色，以保持与 iOS 版一致。
- **不锁定竖屏**：iOS 版在 iPhone 上只支持竖屏。Android 16 起，target 36 及以上的应用在最小宽度不小于 600dp 的屏幕上，方向和尺寸限制不再生效。target 37 时无法再退出该行为，因此界面适配横屏和大屏。内容区最大宽度为 680dp，在宽屏上居中。
- **申请网络权限**：会员服务和 Sentry 崩溃上报需要 `INTERNET` 权限。没有会员服务地址时，应用不发出会员请求；没有 DSN 时，Sentry 不发出网络请求。
- **界面文字只有中文**：应用字符串只放在 `res/values/`。Material 组件自带的无障碍文字（例如底部弹层的「Close sheet」）跟随系统语言。

## 尚未移植的功能

以下 iOS 功能在 Android 版中尚不存在：

- HealthKit 只读查询。Android 对应 Health Connect，但它没有腰围类型，只能读取体重和睡眠。
- Apple 登录。Android 对应 Credential Manager 中的 Google 登录，需要服务端先支持。
- Wallet 会员卡。Android 对应 Google Wallet，但服务端的 `GetMembershipPass` 目前只生成 `.pkpass`。
- 小组件和 Apple Watch 的当天打卡状态共享。Android 对应 Jetpack Glance 和 Wear OS，Wear OS 需要新建 Gradle 模块。

会员接口契约见[会员卡开发说明](../docs/membership.md)。模拟器访问本机后端时，地址使用 `http://10.0.2.2:3000`，不能使用 `localhost`。

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
- 2026-10-20 21:41（UTC+08:00）接入动作动画后，复跑了 `assembleDebug testDebugUnitTest lintDebug connectedDebugAndroidTest assembleRelease`：31 项单元测试和 12 项界面测试通过，Lint 未发现问题。模拟器为工作区中新建的 API 36 Pixel 7 配置。
- 同一时间在模拟器上手动检查了动作动画。浅色和深色都循环播放，暂停时画面不动，系统关闭动画时显示第一帧。训练中切换系统深色后，动画换成深色，训练继续计时。
- 2026-10-20 22:09（UTC+08:00）接入代表帧，并改为只打包课程动作后，复跑了 `assembleDebug testDebugUnitTest lintDebug compileDebugAndroidTestKotlin assembleRelease connectedDebugAndroidTest`：36 项单元测试和 13 项界面测试通过，Lint 未发现问题。安装包中有 33 个动画相关文件，没有动作库文件。
- 同一时间在模拟器上关闭系统动画，检查了深蹲：浅色和深色都停在最低点，即代表帧 106/210，两次截图的动画区域完全相同。深色模式下，地面阴影为 `#0F0F0E`，卡片为 `#222220`。
- 2026-10-21 01:29（UTC+08:00）在模拟器上运行 `:app:generateBaselineProfile`，生成 22,380 行 Baseline Profile 和 18,986 行启动配置文件。Release 包中包含 `assets/dexopt/baseline.prof`。生成时尚未加入会员功能，用户旅程不包含会员页面。
- 2026-10-21 02:50 至 03:02（UTC+08:00）完成 DataStore、Hilt、ViewModel、网络和会员功能的重构后，复跑了 `testDebugUnitTest assembleDebug lintDebug connectedDebugAndroidTest assembleRelease`：83 项单元测试通过；20 项界面测试中 19 项通过；Lint 有 0 个错误和 9 个警告。Debug 包为 20,839,324 字节，R8 压缩后的未签名 Release 包为 4,147,834 字节。
- 未通过的界面测试是 `waterSheetSavesTheDefaultAmount`，原因是 `ComposeNotIdleException`。该用例在此前两次运行中通过，之后单独运行 3 次也都通过，判断为偶发失败，根因未验证。
- 2026-10-21 03:12（UTC+08:00）在 `rpc/consumer-rules.pro` 中加入 Protobuf lite 的字段保留规则后，重新构建 Release 包。`mapping.txt` 中 `club.leanmuscle.boji.v1` 的消息字段没有被重命名。加规则前，`Membership.nickname_` 被重命名为 `e`。按 Protobuf 文档，这会让 Release 包解码会员响应时失败；这个失败没有实际复现。

未验证：

- 导出文件的实际写入。检查时只打开了文件选择器，没有保存文件。
- TalkBack 全流程、200% 字体缩放、平板和折叠屏的导航轨。
- API 26 至 35 的设备和真机。
- 动作动画在真机上的帧率和内存占用。模拟器使用软件渲染，不能代表真机。
- R8 压缩后的 Release 包中的动作动画。界面测试和手动检查都使用 Debug 包。
- 动画文件损坏时的回退。界面测试只验证了文件缺失的情况。
- Release 包对真实会员服务的请求和 Protobuf 解码。会员界面测试使用 Debug 包和 MockWebServer。
- 连接真实 bizserver 的登录、领卡、修改密码和退出其他会话。
- Credential Manager 保存和读取密码。界面测试没有覆盖这一步。
- 加入会员功能后的启动基准测试结果。

已知警告：

- Lint 的 7 个 `PluralsCandidate` 警告来自英文 `strings.xml` 和生成的 `strings_shared.xml`。2 个 `UnusedResources` 警告是 `club_membership_title` 和 `club_membership_text`，俱乐部页改为会员卡入口后不再使用。
- AGP 或 Kotlin 插件在配置阶段调用了已弃用的 `Configuration.setVisible`。Gradle 计划在 11 版移除该方法。工程脚本没有调用该方法，具体来源未验证。
- 构建提示无法 strip `libandroidx.graphics.path.so` 和 `libdatastore_shared_counter.so`，这两个库按原样打包。可能原因是本机未安装 AGP 默认的 NDK 28.2.13676358（未验证）。
