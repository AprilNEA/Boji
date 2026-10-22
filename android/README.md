# Boji Android

Boji 的原生 Android 客户端，使用 Kotlin 和 Jetpack Compose。Android 版已移植 iOS 版的全部本地功能、邮箱账号、免费会员卡、健康数据只读查询、主屏幕小组件和 Wear OS 手表应用，界面遵循 Material 3。Wallet 会员卡尚未移植，详见[尚未移植的功能](#尚未移植的功能)。

## 已实现

- 首次引导：选择居家或健身房训练。
- 今日看板：训练、饮水、睡眠的记录状态和今日推荐课程。
- 日常记录：饮水增减、睡眠时长、体重和腰围，均有输入校验。
- 训练：14 套课程，按居家、健身房和拉伸与放松分组，支持动作说明和逐组训练。
- 动作动画：4 套原有课程使用内置 Lottie。其余课程按需下载并校验动画。
- 训练计时：暂停、继续、30 秒休息倒计时和完成记录。离开前台时自动暂停，旋转屏幕或切换深浅色时不暂停。
- 足迹：累计训练次数、活跃天数、最近 7 天、身体数据趋势图和文字分享。
- 俱乐部：本地每周挑战和 3 篇入门文章。
- 账号：邮箱注册、登录、重发验证邮件、密码重置邮件、修改密码和退出其他会话。登录后可以用 Credential Manager 保存密码。
- 会员卡：昵称、三条共识和核对三步领取免费会员卡；显示服务端返回的会员状态、加入日期和权益；离线时显示上次同步的副本。
- 会员卡分享：选择三种配色之一生成图片，默认隐藏卡号，通过系统分享面板发送。
- 健康数据：通过 Health Connect 只读查询近 30 天的体重和睡眠，与手动记录分开显示。连接后，今天页和足迹页显示摘要卡片。
- 主屏幕小组件：开启「共享当天打卡状态」后，显示今天的训练、饮水、睡眠是否已记录。点按小组件打开今天页，宽布局中的训练磁贴打开训练页。
- Wear OS 手表：开启同一开关后，手表显示今天的三项打卡状态、计划名称和同步时间。手机经 Wear OS Data Layer 发送数据，手表不联网。
- 设置：昵称、训练场景、俱乐部账号入口、小组件与手表的共享开关、手表连接状态、外观、健康数据入口、JSON 导出和本地数据删除。

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

界面测试需要先连接设备或启动模拟器。手机应用的测试在手机或手机模拟器上运行，手表应用的测试在 Wear OS 模拟器或手表上运行。`connectedDebugAndroidTest` 会在每台已连接的设备上运行，所以同时连接两类设备时，用 `ANDROID_SERIAL` 指定设备：

```sh
ANDROID_SERIAL=<手机序列号> ./gradlew :app:connectedDebugAndroidTest
ANDROID_SERIAL=<手表序列号> ./gradlew :wear:connectedDebugAndroidTest
```

手表的调试安装包位于 `wear/build/outputs/apk/debug/wear-debug.apk`。手机和手表的 Debug 包用同一台电脑的调试密钥签名时，才能通过 Data Layer 通信。

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
| 网络 | OkHttp 5.5.0、Retrofit 3.0.0 | `NetworkModule` 创建客户端。公开动画使用无 Cookie、无认证、无缓存的派生客户端 |
| RPC | connect-kotlin 0.9.0、Protobuf 4.36.2（lite） | `:rpc` 模块由 `buf generate` 从 `../bizserver/proto/` 生成客户端 |
| 凭据 | Credential Manager 1.6.0、Android Keystore | 会话令牌和会员卡缓存用 Keystore 中的 AES-256-GCM 密钥加密，再存入 DataStore |
| 性能 | Baseline Profile（Benchmark 1.5.0）、ProfileInstaller 1.4.1 | `:baselineprofile` 模块生成配置文件并运行启动基准测试 |
| 动画 | Lottie 6.7.1（`lottie-compose`） | 直接读取 `../animations/lottie/` 中的 JSON，不复制文件 |
| 图表 | Vico 3.3.1（`compose`、`compose-m3`） | 绘制足迹页的身体数据趋势图。颜色取自 Material 3 主题 |
| 健康数据 | Health Connect 1.1.0（`connect-client`） | 只读体重和睡眠。1.1.0 是当前正式版，1.2.0 仍为 alpha |
| 小组件 | Glance 1.2.0（`glance-appwidget`、`glance-material3`） | 主屏幕小组件。1.2.0 是当前正式版，1.3.0 仍为 alpha。界面测试使用同版本的 `glance-appwidget-testing` |
| 手表 | Wear Compose Material 3 1.7.1、Play 服务 Wearable 20.0.1 | `:wear` 模块的界面和两端的 Data Layer。`kotlinx-coroutines-play-services` 把 Play 服务的 `Task` 转为挂起函数 |
| 后台任务 | WorkManager 2.12.0（`work-runtime`） | 只有 Glance 使用。Glance 1.2.0 只要求 2.7.1（2021 年），并带入 Room 2.2.5，因此在版本目录中固定为当前正式版 |
| SDK | `minSdk` 26，`compileSdk` 和 `targetSdk` 37。`:wear` 的 `minSdk` 为 30（Wear OS 3） | Google Play 自 2026-08-31 起要求新应用和更新的 target 不低于 36 |
| 应用 ID | `club.leanmuscle.boji` | 与 iOS Bundle ID 相同，首次上架后不能修改。`:wear` 使用相同的应用 ID，因为 Data Layer 只连接应用 ID 和签名都相同的应用 |

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
| `core/health/` | Health Connect 数据源、样本模型、连接开关和 `HealthRepository`。查询规则与 iOS 的 `HealthDataStore` 一致 |
| `core/companion/` | 共享开关 `CompanionSettings`、今日打卡状态 `DailyStatus`、小组件状态、`boji://` 路由 `CompanionRoute`、手表同步 `WearCompanionSync`、Data Layer 封装 `WatchLink` 和回答手表请求的 `CompanionWearService`。规则与 iOS 的 `CompanionSnapshot.swift` 和 `CompanionSharingStore.swift` 一致 |
| `feature/` | 各页面：`onboarding`、`today`、`entry`（记录弹层）、`training`（含 `session`）、`progress`、`club`、`membership`、`health`、`settings`、`widget`（主屏幕小组件） |
| `ui/` | 应用外壳 `BojiApp`、共享组件、导航键和主题 |

另有四个 Gradle 模块：`rpc/` 是生成的 API 客户端，`baselineprofile/` 生成 Baseline Profile，`shared/` 是手机和手表共用的快照契约 `CompanionSnapshot` 和 Data Layer 路径，`wear/` 是 Wear OS 应用。

`BojiStore` 对外提供 `StateFlow<BojiSnapshot?>`。读取 `state.json` 完成前，值为 `null`。写入通过 DataStore 的 `updateData` 依次执行。保存失败时，所有页面顶部显示错误提示，与 iOS 版一致。

测试分布在以下目录：

| 目录 | 类型 | 覆盖范围 |
| --- | --- | --- |
| `app/src/test/` | 单元测试 | `BojiStore`、训练状态机、导航目的地、动作动画资源、身体趋势图数据、服务地址校验、领卡规则、会员卡模型、加密序列化器、`MembershipRepository`、健康样本规则、`HealthRepository`、小组件状态、路由解析、手表同步 `WearCompanionSync` |
| `app/src/androidTest/` | 界面测试 | 引导、标签切换、记录、训练、动作动画、身体趋势图、挑战、数据删除、会员中心、Keystore 加密、健康数据页面、Health Connect 的清单声明、小组件内容、共享开关、小组件路由、手表连接状态 |
| `shared/src/test/` | 单元测试 | 用 iOS 格式的 JSON 测试快照契约 |
| `wear/src/test/` | 单元测试 | 手表的 `WatchCompanionRepository` |
| `wear/src/androidTest/` | 界面测试 | 手表界面 |

测试替换了以下依赖，不访问真实服务、设备数据或手表：

- `MembershipRepository` 的测试用 MockWebServer 模拟 Better Auth 和 Connect 接口。
- 界面测试用 Hilt 替换数据和账户文件的位置，每个测试使用新目录。
- 界面测试用 Hilt 把 Health Connect 换成假数据源，不读取设备上的健康数据。
- 界面测试把 Data Layer 换成 `TestWatchLinkModule`，不连接真实手表。

## 动作动画

动画文件由 `animations/` 生成。`app/build.gradle.kts` 把 `../animations/lottie` 加为 `main` 的 assets 目录。它只包含 4 套原有课程的 16 个动作。安装包路径为 `light/<动作 ID>.json` 和 `dark/<动作 ID>.json`。尚未编入课程的动作在 `animations/lottie-library/`，不会打包。文件格式和目录约定见 [animations 的 README](../animations/README.md)。

播放规则如下：

- 只在训练过程的当前动作卡片中播放。课程详情等列表仍显示图标，同一屏最多播放一个动画。
- 深浅色跟随应用实际使用的模式，包括设置中的浅色和深色选项。切换后加载另一套文件。
- 训练暂停时，动画停在当前帧。休息倒计时期间显示原有插画。
- 系统关闭动画（动画时长缩放为 0）时，显示代表帧，不播放。代表帧是 `index.json` 中的 `posterFrame`，例如深蹲的最低点。如果索引中没有该动作，就显示第一帧。
- 文件缺失或加载失败时，显示原有图标，应用不会崩溃。

新课程的非内置动作从 `https://assets.leanmuscle.club/animations/exercises/v1/` 按需取得。课程详情打开时，只预取该课程的非内置动作。下载最多三个同时进行。应用先下载索引，并用 ETag 更新。随后验证 SHA-256、Lottie 帧数和帧率。验证通过的文件存于 `noBackupFilesDir/exercise-animations/<动作 ID>/<浅色或深色>-<SHA-256>.json`。新版本会删除同一动作和配色的旧哈希文件。离线时可使用已验证的索引和文件。

公开动画请求不携带 Cookie、认证信息、账号信息、查询参数或设备标识。请求不跟随重定向。每个请求约 15 秒超时。内置动作永不发起网络请求。远程文件未就绪时，训练仍可开始并显示原有图标。

动画文件使用 JSON，没有转换为 `.lottie`。原因是 lottie-android 读取 `.lottie` 时有已知问题，而且安装包本身会压缩 assets。

`ExerciseAnimationIndex` 在第一次使用时读取内置 `index.json` 并缓存结果。远程索引会检查动作 ID、文件路径、时长、帧数、代表帧、帧率和 SHA-256。未知字段会忽略。系统关闭动画时，播放器使用提供该文件的索引代表帧。

`ExerciseAnimationAssetsTest` 检查以下内容：

- 内置索引只包含 4 套内置课程的动作。
- 公开索引包含 14 套课程的全部动作。
- 每个条目的 `courses` 包含使用该动作的课程 ID。
- 内置动作的浅色和深色文件都存在。

`RemoteExerciseAnimationStoreTest` 覆盖索引校验、哈希失败、ETag 304、离线缓存、内置动作不联网和旧哈希替换。界面测试用 Hilt 的 `TestExerciseAnimationModule` 提供离线或本地 fixture 传输层。测试不访问真实动画主机。

安装包仍只包含 16 个内置动作和一个 `index.json`。远程动画不增加安装包体积。缓存大小随用户打开的远程课程增加，并且不参与 Android 备份。

## 身体数据趋势图

足迹页的趋势图使用 Vico 3.3.1 绘制，对应 iOS 版的 Swift Charts。数据计算在 `feature/progress/BodyTrend.kt` 中，不依赖 Compose，由 `BodyTrendTest` 覆盖。`BodyTrendChart.kt` 只负责把数据交给 Vico。

图表规则如下：

- 横轴是日期。每个点的 x 值是记录在 `BojiSnapshot.zone` 中的日期（epoch day），所以点的间距与实际相隔的天数一致。旧版 `Canvas` 实现按序号等距排列。
- 同一天有多条记录时，图表只画当天最后一条。下方列表仍显示每一条记录。
- 纵轴不从 0 开始，与 iOS 版的 `includesZero: false` 一致。范围在数据两端各留出 15% 的余量（至少 0.5），两端取整到刻度步长。步长为 1、2、5、10 等，最多约 4 个间隔。刻度位于右侧，与 Swift Charts 的默认位置相同。
- 横轴最多显示 4 个日期，格式由 `textLocale` 的 CLDR 骨架 `Md` 决定，例如 `10/14`。只有一天的数据时，横轴在前后各加一天，数据点居中。
- 折线为平滑曲线（`Interpolator.cubic`），并画出数据点。线条、刻度和网格线的颜色取自 Material 3 主题，深色模式自动适配。
- 图表宽度固定为卡片宽度，不能滚动或缩放。TalkBack 把整个图表读作一个节点，内容为 `progress_chart_a11y`，即记录条数。

Vico 的 Compose 构件依赖 JetBrains Compose 1.12.0。在 Android 上，这些构件请求 androidx Compose 1.12.0，Compose BOM 2026.09.00 把它们统一解析为 1.12.1。Material 3 的版本不变。

## 健康数据（Health Connect）

Android 版通过 Health Connect 只读查询健康数据，对应 iOS 版的 HealthKit。用户在设置的「健康数据与授权」中连接。连接后，今天页和足迹页显示「来自 Health Connect」摘要卡片，点按后打开同一页面。

读取范围与 iOS 版相同：

| 数据 | Health Connect 记录类型 | 权限 |
| --- | --- | --- |
| 体重 | `WeightRecord` | `android.permission.health.READ_WEIGHT` |
| 睡眠 | `SleepSessionRecord` | `android.permission.health.READ_SLEEP` |

Health Connect 没有腰围记录类型，所以腰围仍只能手动记录。应用不申请写入权限、后台读取权限和 30 天以前的历史读取权限。

查询规则如下，与 iOS 的 `HealthDataStore` 一致：

- 只在用户点按「连接 Health Connect」时请求权限。此后，打开健康页和应用回到前台时各刷新一次。未连接时不读取，也不请求权限。
- 每次读取近 30 天，逐页读到结束。正在刷新时，新的刷新请求被忽略。
- 用户可以只授予一项权限。没有授予的类型不读取，页面写明缺少哪一项，并提供「授予缺少的权限」按钮。一项权限都没有授予时，不会进入已连接状态。
- 读取失败时，清空已显示的样本和上次查询时间，只显示错误。断开时丢弃正在进行的读取结果。
- 体重按时间取最新一条。重复的记录 ID、非正数、非有限值和晚于当前时间的样本被丢弃。
- 睡眠日为前一天 18:00 至当天 18:00（`BojiSnapshot.zone` 的本地时间）。只统计睡眠阶段：`SLEEPING`、`LIGHT`、`DEEP` 和 `REM`。`AWAKE`、`AWAKE_IN_BED`、`OUT_OF_BED` 和未知阶段不计入。没有阶段的睡眠时段整段计为睡眠。不同来源的重叠区间只计一次。时长按实际经过的时间计算，夏令时切换当天也准确。
- 来源显示写入记录的应用名称。应用名称不可见时，显示包名。

数据边界如下：

- 样本只保存在内存中。它们不写入 `state.json`，不进入导出文件，也不发送给会员服务或 Sentry。手动记录与健康数据分开保存，不会被覆盖。
- 只有「已连接」这个开关保存在设置的 Preferences DataStore 中。断开或删除全部本地数据时，开关关闭，显示的样本被清除。这两个操作都不撤销 Health Connect 授权，也不删除 Health Connect 中的记录。页面提供「在 Health Connect 中管理」入口，用户在那里撤销授权。

Health Connect 要求应用提供隐私说明页，否则不显示授权界面。`HealthPermissionsRationaleActivity` 是这个页面，它列出读取的数据、用途和存储方式，并链接到 `https://leanmuscle.club/privacy/`。Android 13 及以下版本通过 `ACTION_SHOW_PERMISSIONS_RATIONALE` 打开它。Android 14 及以上版本通过 `ViewPermissionUsageActivity` 别名打开它，该别名要求调用方持有 `START_VIEW_PERMISSION_USAGE` 权限。

`AndroidManifest.xml` 在 `<queries>` 中声明了 Health Connect 的包名。Android 11 至 13 需要这项声明，`getSdkStatus` 才能检测到已安装的 Health Connect。同一元素还匹配其他健康应用的授权说明页，以便显示来源应用的名称。

Health Connect 的可用状态分三种：

| 状态 | 页面显示 |
| --- | --- |
| 可用 | 连接、刷新、管理和断开 |
| 需要安装或更新 | 打开 Google Play 的 Health Connect 页面。Android 13 及以下版本需要单独安装 Health Connect |
| 不可用 | 说明手动记录仍可使用 |

上架 Google Play 前，需要在 Play Console 的「应用内容」中填写健康应用声明，说明每项权限的用途。这一步需要人工完成，本仓库无法代替。

## 主屏幕小组件

小组件「薄肌今日记录」对应 iOS 的 `BojiDailyWidget`，显示今天的训练、饮水、睡眠是否已记录。它不显示饮水量、睡眠时长、身体数据、Health Connect 数据、训练场景或会员信息。

| 状态 | 条件 | 显示 |
| --- | --- | --- |
| 未开启 | 设置中的「共享当天打卡状态」为关闭。默认关闭 | 「未开启记录共享」和开启方法 |
| 无法读取 | 共享已开启，但 `state.json` 读取失败 | 「暂时无法读取记录」，请用户打开应用 |
| 当前 | 共享已开启，记录可以读取 | 三项各自的「已记」或「待记」 |

布局按小组件的实际尺寸选择（`SizeMode.Exact`）。宽度小于 250dp 时显示三行状态，高度不小于 150dp 时另显示副标题。宽度不小于 250dp 时显示三个磁贴，对应 iOS 的中尺寸小组件。点按小组件打开今天页，点按训练磁贴打开训练页。整个小组件只有一条无障碍描述，TalkBack 一次读出三项状态。

数据和刷新规则如下：

- 小组件运行在应用进程中，通过 Hilt 入口点读取与页面相同的 `BojiStore` 和共享开关，不另存快照文件。
- 应用进程运行时，`DailyWidgetSync` 在记录或共享开关变化后调用 `updateAll`。没有放置小组件时，这一调用不绘制任何内容。
- 本地午夜后，不唤醒设备的 `AlarmManager` 闹钟（`RTC`）触发重绘。系统时间、时区或语言变化后也会重绘。`updatePeriodMillis` 为 0，小组件不定时轮询。
- 小组件跟随系统深浅色，不跟随应用内的外观设置，因为启动器读不到应用设置。颜色复用应用的 Material 3 配色和 `BojiColors`。

小组件用显式 Intent 启动 `MainActivity`。Intent 的 data 为 `boji://today` 或 `boji://training`，并带 `FLAG_ACTIVITY_CLEAR_TOP` 和 `FLAG_ACTIVITY_SINGLE_TOP`，所以已运行的应用在 `onNewIntent` 中收到路由。`CompanionRoute.parse` 只接受与 iOS 相同的格式：协议为 `boji`，主机为四个标签之一，不带用户信息、端口、路径、查询参数和片段。清单没有注册 `boji` 协议，其他应用不能用隐式 Intent 打开这些地址。路由只切换标签，不改变标签内的页面，进行中的训练仍在最上层。

Android 15 及以上版本的小组件选择器显示 Glance 生成的预览，内容为示例数据，不含用户记录。`DailyWidgetSync` 对每个应用版本和语言发布一次预览。系统限制每小时约 2 次，被限流时下次启动再试。工程没有静态预览图，Android 14 及以下版本的选择器显示什么由启动器决定（未验证）。

小组件文案位于 `res/values/strings_widget.xml` 和 `res/values-b+zh+Hans/strings_widget.xml`。iOS 小组件显示相同的文案，按根目录的规则应移到 `../locales/`，目前尚未移动。

## 手表（Wear OS）

`:wear` 对应 iOS 的 `BojiWatch`，显示手机共享的今天打卡状态：训练、饮水、睡眠是否已记录，计划名称和同步时间。手表应用没有训练、记录、账号和网络功能，`standalone` 为 `false`。

| 状态 | 条件 | 显示 |
| --- | --- | --- |
| 尚无数据 | 手表没有收到过快照 | 「尚无共享数据」和开启方法 |
| 未开启共享 | 最新快照的共享为关闭 | 「共享未开启」和开启方法 |
| 当前 | 快照的日期是手表时区的今天 | 计划名称、三项打卡和同步时间 |
| 不是今天 | 快照的日期不是今天，或生成时间晚于当前时间 5 分钟以上 | 「今天没有当前数据」，不显示旧记录 |

列表上方显示连接状态：正在连接、正在请求更新、手机离线、已连接、无法使用或无法连接。刷新按钮是屏幕底部的 `EdgeButton`，列表滚到末尾时完全展开。

快照契约位于 `shared/`，与 iOS 的 `CompanionSnapshot.swift` 相同：字段名相同，时间为带毫秒的 ISO 8601 UTC 时间，`schemaVersion` 为 1，编码后不超过 16 KiB，计划名称不超过 40 个字符。`CompanionSnapshotTest` 用 iOS 格式的 JSON 验证编码和解码。

同步规则如下：

- 手机和手表只用 Data Layer 的 `MessageClient` 发送消息，不使用数据项（`DataClient`），因为数据项会由 Google Play 服务保存并在设备间同步。
- 手机上的 `WearCompanionSync` 在共享开关或今天的打卡变化时、手表连接时发送快照。共享关闭时只发送不含记录的关闭快照。`state.json` 无法读取时，手机不发送新快照。
- 消息不保留。手表离开时发出的消息会丢失，所以手表在打开时和手机重新可达时发送请求（`/boji/companion/request`），手机的 `CompanionWearService` 回复当前快照。
- 手表只保留生成时间最新的有效快照，保存在 `no_backup` 目录，不参与备份。较旧或无效的快照不改变显示。
- 能力名称用于查找对方：手机为 `boji_phone_app`，手表为 `boji_watch_app`。两端的 `res/values/wear.xml` 声明这两个名称，与 `CompanionDataLayer` 一致。

设置页在共享开关下显示手表状态：此手机不支持、未连接手表、手表未安装应用、等待手表连接、已连接或暂时无法同步。手机没有 Google Play 服务的 Wearable API 时，显示「此手机无法与手表同步」。

手表文案位于 `wear/src/main/res/values/strings.xml` 和 `values-b+zh+Hans/strings.xml`。iOS 手表显示相同的文案，按根目录的规则应移到 `../locales/`，但 `../crates/locales/` 目前只为 `:app` 生成文件。

## 与 iOS 版的对应

iOS 版采用 Liquid Glass 和 Apple 人机界面指南。Android 版遵循 Material 3，不模仿玻璃材质。

| iOS | Android |
| --- | --- |
| `TabView`：今天、训练、足迹、俱乐部 | `BojiDestination` 定义相同的四个目的地和顺序 |
| 每个标签内的 `NavigationStack` | 每个标签一个 Navigation 3 返回栈。切换标签时保留各自的页面和滚动位置。再次点击当前标签时返回该标签首页 |
| 训练过程的 `fullScreenCover` | 应用级返回栈中的一个条目，覆盖标签栏。系统返回手势先弹出结束确认 |
| `sheet` 记录弹层 | `ModalBottomSheet` |
| `confirmationDialog` | `AlertDialog` |
| Swift Charts 趋势图 | Vico 折线图：平滑曲线和数据点，纵轴不从 0 开始。见[身体数据趋势图](#身体数据趋势图) |
| HealthKit 只读查询（体重、腰围、睡眠） | Health Connect 只读查询（体重、睡眠）。见[健康数据](#健康数据health-connect) |
| WidgetKit 小组件，读取 App Group 中的快照 | Glance 小组件，在应用进程中直接读取 `BojiStore`。见[主屏幕小组件](#主屏幕小组件) |
| watchOS 应用 `BojiWatch` | Wear OS 应用 `:wear`，使用 Wear Compose Material 3。见[手表](#手表wear-os) |
| WatchConnectivity（`updateApplicationContext` 和 `sendMessage`） | Wear OS Data Layer 的 `MessageClient` |
| `onOpenURL` 处理 `boji://` 路由 | `MainActivity` 在 `onCreate` 和 `onNewIntent` 中解析显式 Intent 的 `boji://` 地址，规则与 iOS 的 `CompanionRoute` 相同 |
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
- **密码与网站关联**：Android 版已在应用一侧声明 Digital Asset Links，iOS 版没有 `webcredentials` 关联域名。网站一侧的文件尚未发布，所以两端目前都不与网站共享密码。见[密码与网站关联](#密码与网站关联)。
- **健康数据的腰围**：iOS 版从 HealthKit 读取腰围。Health Connect 没有腰围类型，Android 版只读取体重和睡眠。
- **睡眠分类**：iOS 版统计 HealthKit 的各类「睡着」值，不统计「卧床」。Android 版统计 Health Connect 的睡眠阶段，不统计清醒和离床阶段。两端都不把在床时间算作睡眠。
- **撤销授权**：iOS 版只能引导用户到「健康」App 的设置。Android 版直接打开 Health Connect 中本应用的数据与权限页面。
- **小组件的数据来源**：iOS 小组件运行在扩展进程中，读取 App Group 中的快照文件，所以有「等待同步」状态。Android 小组件在应用进程中直接读取 `state.json`，没有快照文件，也没有这个状态。
- **小组件尺寸**：iOS 版另有锁定屏幕的 accessory 尺寸。Android 版只提供可调整大小的主屏幕小组件。
- **手表的同步方式**：iOS 用 `updateApplicationContext` 发送快照，系统保留最新一份，手表下次连接时收到。Android 只用不保留的消息，手表在打开时和手机重新可达时主动请求。
- **手表的刷新按钮**：iOS 版只在 iPhone 可达时启用刷新。Android 版在请求失败后也启用刷新，每次重试都重新查找手机。iOS 的刷新按钮在工具栏中，Android 版遵循 Wear OS 的设计，放在屏幕底部。
- **跨平台配对**：Wear OS 手表只与 Android 手机同步，Apple Watch 只与 iPhone 同步。两端的快照格式相同，但不互通。

## 数据与隐私

记录保存在应用私有目录的 `files/state.json`。JSON 结构与 iOS 版相同：键名排序、时间为精确到秒的 ISO 8601、记录 ID 为大写 UUID。`BojiStoreTest` 用 iOS 格式的样例验证了双向解码。两端都没有导入功能，跨平台迁移尚未实现。

`state.json` 读取失败时，应用不会覆盖原文件，而是阻止写入并显示错误。用户可以在设置中删除全部数据来恢复。

登录时，邮箱和密码发送到会员服务。领卡时，发送昵称和守则版本。训练、饮水、睡眠和身体记录不会上传。会话令牌和会员卡缓存分别保存在 `files/` 下的两个加密文件中，密钥在 Android Keystore 中，不能导出。文件无法解密时（例如密钥丢失），应用按未登录处理。数据导出不包含这两个文件。

退出登录会清除这两个文件。在设置中删除全部数据时，也会清除它们，但不会删除服务端的账号和会员资格。

Health Connect 的样本只在应用运行时保存在内存中，见[健康数据](#健康数据health-connect)。

小组件与手表共用一个共享开关，默认关闭，保存在 Preferences DataStore（`settings`）的 `companionSharingEnabled` 中。开启后，启动器只收到三项是否已记录的绘制结果。在设置中删除全部数据时，共享开关也会关闭。

开启共享后，手机经 Data Layer 向已配对的手表发送快照。快照只含日期、三项是否已记录、计划名称和生成时间，不含昵称、饮水量、睡眠时长、身体数据、Health Connect 数据和账号。关闭共享后，手机发送关闭快照，手表删除原有的打卡数据，只保留「共享未开启」状态。

系统备份和设备迁移都排除了这些文件。配置位于 `AndroidManifest.xml` 和 `res/xml/data_extraction_rules.xml`。因此卸载应用会删除记录，设置页的隐私说明写明了这一点。

`network_security_config.xml` 禁止明文 HTTP。只有 Debug 构建允许访问 `10.0.2.2`、`localhost` 和 `127.0.0.1` 的 HTTP 地址。

构建时设置了 Sentry DSN，应用才会上报崩溃和 ANR。默认构建不设置 DSN，不上报任何内容。上报内容不含训练和身体记录。启用方式和上报字段见 [Sentry 错误上报](../docs/developers/sentry.mdx)。

```sh
./gradlew :app:assembleRelease -Pboji.sentryDsn='https://<公钥>@<主机>/<项目编号>'
```

## 密码与网站关联

Credential Manager 保存的密码只有在应用和网站互相声明 Digital Asset Links 后，才会与网站共享。应用一侧已经完成，网站一侧尚未完成。

应用一侧：`res/values/asset_statements.xml` 用 `include` 引用 `https://leanmuscle.club/.well-known/assetlinks.json`，`AndroidManifest.xml` 把它声明为 `asset_statements`。界面测试 `AssetStatementsTest` 从安装包中读取这两项。

网站一侧需要发布 `https://leanmuscle.club/.well-known/assetlinks.json`。2026-10-21 04:27（UTC+08:00）实测该地址返回 404。文件内容如下，其中指纹是 Play 应用签名证书的 SHA-256，在 Play Console 的「应用完整性」→「应用签名」中查看：

```json
[
  {
    "relation": ["delegate_permission/common.get_login_creds"],
    "target": { "namespace": "web", "site": "https://leanmuscle.club" }
  },
  {
    "relation": ["delegate_permission/common.get_login_creds"],
    "target": {
      "namespace": "android_app",
      "package_name": "club.leanmuscle.boji",
      "sha256_cert_fingerprints": ["<Play 应用签名证书的 SHA-256>"]
    }
  }
]
```

第一项声明网站本身。应用通过 `include` 引用这个文件，所以文件中要有指向网站的声明。这一写法来自 Google 旧版 Smart Lock 文档，Credential Manager 文档的示例只列出了 `android_app` 一项，在本项目中尚未验证。

发布要求如下：

- 地址必须直接返回 HTTP 200 和 `Content-Type: application/json`，不能经过 301 或 302 重定向。网站开启了 `trailingSlash`，发布后要用 `curl -I` 确认没有跳转到带斜杠的地址。
- 不要写入调试密钥的指纹。调试密钥只在开发者本机，Debug 包因此不与网站关联。
- 不需要 `delegate_permission/common.handle_all_urls`。它用于 App Links，应用目前不处理网页链接。
- 发布后，可以用 Google 的 Digital Asset Links API 检查：`https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://leanmuscle.club&relation=delegate_permission/common.get_login_creds`。

Credential Manager 对密码只是强烈建议声明 Digital Asset Links，对通行密钥（passkey）则是必须声明。

## 设计决定

- **固定品牌色**：未启用 Android 12 的动态取色，以保持与 iOS 版一致。
- **不锁定竖屏**：iOS 版在 iPhone 上只支持竖屏。Android 16 起，target 36 及以上的应用在最小宽度不小于 600dp 的屏幕上，方向和尺寸限制不再生效。target 37 时无法再退出该行为，因此界面适配横屏和大屏。内容区最大宽度为 680dp，在宽屏上居中。
- **申请网络权限**：会员服务和 Sentry 崩溃上报需要 `INTERNET` 权限。没有会员服务地址时，应用不发出会员请求；没有 DSN 时，Sentry 不发出网络请求。
- **界面语言**：应用有简体中文和英文，英文是回退语言。Material 组件自带的无障碍文字（例如底部弹层的「Close sheet」）跟随系统语言。

## 尚未移植的功能

以下 iOS 功能在 Android 版中尚不存在：

- Apple 登录。Android 对应 Credential Manager 中的 Google 登录，需要服务端先支持。
- Wallet 会员卡。Android 对应 Google Wallet，被服务端契约阻塞，见下文。

### Google Wallet

服务端的 `WalletService.GetMembershipPass` 只返回 Apple Wallet 的 `.pkpass` 文件（`mime_type` 为 `application/vnd.apple.pkpass`）。`ServerConfig.wallet_pass_enabled` 和 `WALLET_NOT_CONFIGURED` 也只描述 Apple 卡券的签名材料。Google Wallet 不能导入 `.pkpass`，所以 Android 版没有调用 `WalletService`，也不显示 Wallet 入口。

接入 Google Wallet 需要以下工作。前三项在服务端，Android 版只做最后一项：

1. 在 Google Pay & Wallet Console 中完成发卡方（issuer）注册，创建服务账号，并申请发布权限。注册完成前，卡券标题带「[TEST ONLY]」。
2. 服务端用 Google Wallet API 创建会员卡的卡券类（class），并为每张会员卡创建卡券对象（object）。服务账号的私钥只存放在服务端。
3. 在 `bizserver/proto/` 中新增返回已签名 JWT 的方法，以及表示 Google 卡券可用的 `ServerConfig` 字段。卡面字段和停用规则与 Apple 卡券一致。
4. Android 版加入 `play-services-pay`。先用 `PayClient.getPayApiAvailabilityStatus` 检查设备是否支持，再显示官方的「Add to Google Wallet」按钮，并用 `savePassesJwt` 保存卡券。

步骤来自 [Google Wallet 的 Android 接入说明](https://developers.google.com/wallet/generic/android)（2026-10-21 查阅）。在本项目中尚未验证。

会员接口契约见[会员卡开发说明](../docs/developers/membership.mdx)。模拟器访问本机后端时，地址使用 `http://10.0.2.2:3000`，不能使用 `localhost`。

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
- 2026-10-21 04:18 至 04:23（UTC+08:00）换用 Vico 趋势图后，复跑了 `assembleDebug testDebugUnitTest lintDebug connectedDebugAndroidTest`：91 项单元测试和 21 项界面测试通过；Lint 有 0 个错误，9 个警告与上一条相同。同一时间在 API 36 模拟器上截图检查了浅色、深色、腰围、只有一天数据和简体中文 5 种情况。
- 2026-10-21 04:41（UTC+08:00）对比了 R8 压缩后的未签名 Release 包：`HEAD` 为 4,147,834 字节，加入 Vico 后为 4,213,878 字节，增加 66,044 字节（1.6%）。未压缩的 dex 增加 122,432 字节。对比时工作区还包含 Digital Asset Links 的改动，这部分只有一个字符串资源。
- 2026-10-21 04:37 至 04:38（UTC+08:00）声明 Digital Asset Links 后，复跑了 `assembleDebug testDebugUnitTest lintDebug connectedDebugAndroidTest`：91 项单元测试和 23 项界面测试通过，其中包括 `AssetStatementsTest` 的 2 项；Lint 有 0 个错误，不再报告 `CredManMissingDal`。这次界面测试运行在 AppSim 的 `appsim-local-android` 模拟器上，因为它占用了 5554 端口。
- 2026-10-21 05:02 至 05:18（UTC+08:00）接入 Health Connect 后，复跑了 `assembleDebug testDebugUnitTest lintDebug connectedDebugAndroidTest assembleRelease`：108 项单元测试和 32 项界面测试通过，新增的是 `HealthSnapshotTest` 8 项、`HealthRepositoryTest` 9 项、`HealthConnectTest` 5 项和 `HealthManifestTest` 4 项；Lint 有 0 个错误，9 个警告与上一条相同。模拟器为工作区的 API 36 Pixel 7 配置（`emulator-5556`）。
- 第一次运行界面测试时，`HealthConnectTest` 发现摘要卡片的无障碍文字缺少数值：每个数值行单独合并了语义，可点按的卡片因此读不到它们。修改后，卡片中的数值行不再单独合并，TalkBack 把整张卡片读作一个按钮，包括数值。
- 同一时间在模拟器上用系统自带的 Health Connect 手动检查：点按「连接 Health Connect」后，系统先显示 Health Connect 的首次引导，再显示授权界面。授权界面只列出睡眠和体重，应用名为 Lean Muscle。界面中的「privacy policy」链接打开了 `ViewPermissionUsageActivity` 别名，即 Boji 的健康数据说明页。点按「Don't allow」后，应用保持未连接，并显示「没有授予任何权限」的错误。浅色和深色截图均正常。
- 同一时间对比了 R8 压缩后的未签名 Release 包：加入 Health Connect 前为 4,213,878 字节（含 Vico 和 Digital Asset Links），加入后为 4,411,236 字节，增加 197,358 字节（4.7%）。Debug 包为 24,864,093 字节。
- 2026-10-21 05:44 至 06:20（UTC+08:00）接入主屏幕小组件后，复跑了 `assembleDebug testDebugUnitTest lintDebug connectedDebugAndroidTest assembleRelease`：116 项单元测试和 43 项界面测试通过，新增的是 `CompanionTest` 8 项、`DailyWidgetContentTest` 6 项、`CompanionSharingTest` 4 项和 `CompanionColdStartTest` 1 项。Lint 有 0 个错误，9 个警告与上一条相同。
- 第一次运行 Lint 时，小组件带来 3 个警告：`system_app_widget_background_radius` 只在 API 31 及以上存在，`targetCellWidth` 和 `targetCellHeight` 只在 API 31 及以上生效。修改后，圆角只在 API 31 及以上设置，提供者 XML 写明旧版本使用 `minWidth` 和 `minHeight`。
- 同一时间在 API 36 模拟器的 Pixel Launcher 上手动检查：从选择器拖出小组件后显示「Sharing Is Off」；在设置中开启共享后变为三项「To do」；记录一次饮水后，Water 变为绿色的「Done」。深色模式、加宽到 4 格后的磁贴布局都正常。点按小组件从足迹页切回今天页，点按 Workout 磁贴打开训练页。
- 同一时间对比了 R8 压缩后的未签名 Release 包：加入小组件前为 4,411,236 字节，加入后为 5,279,204 字节，增加 867,968 字节（19.7%）。增加的主要是 Glance 带入的 WorkManager、Room 和 Glance 自带的 Protobuf 运行时。其中把 WorkManager 从 2.7.1 固定到 2.12.0 增加了 108,616 字节。Debug 包为 25,757,975 字节。
- 2026-10-21 07:00 至 07:14（UTC+08:00）加入 `:shared` 和 `:wear` 后，运行了三个模块的 `assembleDebug testDebugUnitTest lintDebug`：`:shared` 9 项、`:app` 124 项、`:wear` 12 项单元测试通过，新增的是 `CompanionSnapshotTest` 9 项、`WearCompanionSyncTest` 8 项和 `WatchCompanionRepositoryTest` 12 项。`:app` 的 Lint 有 0 个错误，9 个警告与上一条相同；`:shared` 和 `:wear` 的 Lint 未发现问题。
- 同一时间在工作区的 API 36 手机模拟器上运行 `:app:connectedDebugAndroidTest`，44 项界面测试通过，其中 `CompanionSharingTest` 新增 1 项手表状态测试。在 Wear OS 6（API 36，`android-wear-signed` arm64 镜像）模拟器上运行 `:wear:connectedDebugAndroidTest`，`WatchScreenTest` 的 5 项通过。
- 第一次运行 Lint 时，`:wear` 报告启动图标缺少 `monochrome` 层。修改后，手表图标与手机图标一样带单色层。第一次运行手表界面测试时，刷新测试点按了收起的 `EdgeButton`：`ScreenScaffold` 只在列表滚到末尾时展开它。修改后，测试先把列表滚到末尾。
- 同一时间在 Wear OS 模拟器上手动检查：没有快照时显示「手机离线」和「尚无共享数据」；写入当天的示例快照后，显示计划名称、三项打卡和同步时间。列表滚到末尾时，刷新按钮展开，手机离线时为不可用状态。
- 第一次同时运行两个模拟器时，手机模拟器在测试中途离线并关闭，Gradle 仍以 0 退出，只记录了 23 项结果。随后手表模拟器在 netsim 连接关闭后退出。之后每次只运行一个模拟器，上面的结果都来自单独运行。手机模拟器关闭的原因未验证。
- 同一时间对比了 R8 压缩后的未签名 Release 包：手机包从 5,279,204 字节增加到 5,332,414 字节，增加 53,210 字节（1.0%），来自 Play 服务 Wearable 和 `:shared`。手表 Release 包为 2,291,891 字节。手机 Debug 包为 25,975,185 字节。

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
- Vico 趋势图在 TalkBack 下的实际朗读、200% 字体缩放下的坐标轴标签，以及大量记录时的绘制性能。
- Digital Asset Links 的域名验证。`https://leanmuscle.club/.well-known/assetlinks.json` 尚未发布，Play 应用签名证书的 SHA-256 也还没有。
- 在真实 Health Connect 中授予权限后的读取。自动权限审查拒绝了在模拟器上授予健康权限的操作，因为用户没有明确授权。授权后的读取、部分授权和断开只在界面测试中用假数据源验证过。真实读取还需要另一个应用先写入体重和睡眠记录。
- Android 13 及以下版本的 Health Connect：独立应用的安装引导、`ACTION_SHOW_PERMISSIONS_RATIONALE` 入口和 `<queries>` 包可见性。这些只在 API 36 上检查过清单解析。
- Play Console 的健康应用声明。需要人工填写，本仓库无法验证。
- 小组件选择器中的生成预览。系统已保存预览（logcat 中 `setWidgetPreview()` 返回 0，并写入预览文件），但该模拟器的 Pixel Launcher 重启后仍显示应用图标。
- 午夜后的自动重绘。`CompanionTest` 只验证了闹钟时间的计算，没有等到真实的午夜。
- 强制停止后的小组件点按。在模拟器上强制停止应用后，点按小组件没有反应，再次打开应用后恢复。原因可能是 Android 15 起强制停止会取消应用的 PendingIntent（未验证）。
- 小组件在 TalkBack 下的实际朗读、API 26 至 35 的启动器和其他厂商的启动器。
- 手机与手表之间的真实同步。两个模拟器没有配对：配对需要手机模拟器带 Google Play 和 Wear OS 配套应用，工作区的手机镜像是 Google APIs 版本。推送、请求、`CompanionWearService` 的回复和设置页的手表状态只在单元测试和界面测试中用替身验证过。
- 两端 Release 包之间的 Data Layer 通信。两端必须用同一个发布密钥签名，本仓库没有发布密钥。
- 手表界面的简体中文、TalkBack 朗读、方形表盘和 Wear OS 3 至 5 的设备。
- Google Play 对手表包 `versionCode` 的检查。

已知警告：

- Lint 的 7 个 `PluralsCandidate` 警告来自英文 `strings.xml` 和生成的 `strings_shared.xml`。2 个 `UnusedResources` 警告是 `club_membership_title` 和 `club_membership_text`，俱乐部页改为会员卡入口后不再使用。
- AGP 或 Kotlin 插件在配置阶段调用了已弃用的 `Configuration.setVisible`。Gradle 计划在 11 版移除该方法。工程脚本没有调用该方法，具体来源未验证。
- 构建提示无法 strip `libandroidx.graphics.path.so` 和 `libdatastore_shared_counter.so`，这两个库按原样打包。可能原因是本机未安装 AGP 默认的 NDK 28.2.13676358（未验证）。
