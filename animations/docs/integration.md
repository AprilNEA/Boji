# 接入说明

本文说明 iOS 和 Android 怎样播放动作动画。两端打包 `animations/lottie/`，不复制文件。这个目录只有 4 门内置课程的 16 个动作。其他 10 门课程的动作从资产主机下载，见[远端载入](#远端载入)。目录和文件格式的约定见 [README 中的应用接入契约](../README.md#应用接入契约)。

`animations/lottie-library/` 存放尚未编入课程的动作，只用于预览和评审。禁止把这个目录打包进应用，应用也不下载动作库。资产目录 `assets/public/animations/exercises/v1/` 只发布到资产主机，禁止打包进正式应用。测试目标可以把其中的文件用作 fixture。

两端的接入状态如下，都来自各端任务的回报：

| 平台 | 状态 | 时间（UTC+8） |
| --- | --- | --- |
| Android | 已接入远端载入。`./gradlew assembleDebug testDebugUnitTest lintDebug` 通过，131 项单元测试全部通过。Lint 有 9 条警告，都是 `master` 原有的。`:app:connectedDebugAndroidTest` 的 47 项界面测试在 API 36 模拟器上全部通过。测试用假传输层，没有请求资产主机 | 2026-10-22 00:50 |
| iOS | 已接入远端载入。模拟器构建通过。iPhone 17 Pro（iOS 26.5）模拟器上，132 项单元测试全部通过，22 项界面测试在 00:39 的完整运行中全部通过。测试用进程内的 fixture 传输层，没有请求资产主机 | 2026-10-22 00:50 |
| Android | 已接入，构建、单元测试、界面测试和 Lint 都已通过。本文 Android 一节的 3 段 Kotlin 示例在 Boji 工程中编译通过，没有警告，Lint 没有问题。示例没有在设备上运行 | 2026-10-20 22:20 |
| iOS | 已用 UIKit 的 `LottieAnimationView` 接入，Debug 和 Release 编译通过，13 项测试通过。尚未在屏幕上验收播放。本文 iOS 一节的 SwiftUI 示例没有编译 | 2026-10-20 22:14 |

接入时以各端的构建结果为准。

## 播放规则

应用必须处理以下情况：

| 情况 | 应用的行为 |
| --- | --- |
| 正常 | 在动作详情或当前动作卡片中循环播放。列表行继续使用现有图标，一屏只播放一个动画 |
| 训练暂停 | 停在当前帧。继续训练时从这一帧接着播放，之后每一轮仍然播放完整的循环 |
| 系统关闭动画或开启「减少动态效果」 | 停在 `index.json` 中该动作的 `posterFrame`，不显示第 0 帧 |
| 索引缺失、无法解析，或 `posterFrame` 不在 `[0, frames)` 内 | 不得崩溃。停在第 0 帧或显示原有的插画都可以。生成器保证正常的输出不会出现这种情况 |
| 动画文件缺失或无法解析 | 显示原有的插画或图标 |
| 应用切换深浅色 | 加载另一个主题的文件。主题以应用实际使用的深浅色为准，包括应用内的外观设置 |

第 0 帧通常是起始姿势，例如深蹲的站立姿势。静止时显示第 0 帧，用户看不出是什么动作。`posterFrame` 指向动作最有代表性的一帧，例如深蹲的最低点。

动画只演示动作，不传达动作名称以外的信息。如果旁边已经显示动作名称，应该对辅助技术隐藏动画，避免重复朗读。

解析 `index.json` 时必须忽略未知字段，因为以后可能新增字段。只解码需要的字段即可，例如 `id`、`frames` 和 `posterFrame`。

画布是 512×512 的正方形。显示时应保持 1:1 的宽高比，尺寸由各端决定。

## 远端载入

内置课程以外的动作从资产主机下载，地址和目录见 [README 中的发布到资产主机](../README.md#发布到资产主机)。两端按以下规则实现：

| 环节 | 规则 |
| --- | --- |
| 选择来源 | 动作 ID 在打包的 `index.json` 中时，只用打包的文件，不发网络请求。其他动作从 `https://assets.leanmuscle.club/animations/exercises/v1/` 下载。正式版只用这个地址，只用 HTTPS，不跟随重定向。测试通过注入的地址和传输层使用假实现 |
| 索引 | 请求 `index.json`，按打包索引的规则校验每一项，另外要求 `sha256.light` 和 `sha256.dark` 都是 64 个小写十六进制字符。不合格的条目丢弃，其余保留。保存最后一份有效的索引和它的 `ETag`，之后的请求带 `If-None-Match`，收到 304 时使用保存的索引。一个进程中请求成功一次后不再请求；失败后，下一次预取时重试 |
| 动画文件 | 请求 `files` 中对应主题的路径。先比对 SHA-256，再用 Lottie 解析，并核对帧数和帧率与索引一致，允许 ±1 帧和 ±0.01 fps 的取整误差。任何一项不符就丢弃 |
| 磁盘缓存 | iOS 存在 `Application Support/ExerciseAnimations/`，并排除备份。Android 存在 `noBackupFilesDir/exercise-animations/`。路径为 `<动作 ID>/<主题>-<sha256>.json`。先写临时文件再改名，写入成功后删除同一动作、同一主题的旧哈希文件。只有哈希与当前索引一致的文件有效。离线时使用保存的索引，所以上次校验过的文件仍然可用 |
| 预取 | 用户打开含远端动作的课程详情页时，下载这门课程中尚未缓存的动作，两个主题都下载。最多同时 3 个请求，进行中的请求不重复发出，每个请求的超时约 15 秒。不在后台下载，不预取其他课程，不下载 14 门课程以外的动作 |
| 播放 | 播放器从应用包或缓存取文件，自己不下载。文件缺失时显示原有的插画或图标。训练中下载完成时，可以切换为动画。关闭动画时使用提供该文件的索引中的 `posterFrame`。其他行为与[播放规则](#播放规则)相同 |
| 详情页提示 | 预取进行中显示 `detail_animation_downloading`（正在下载动作动画）。预取结束后仍有动作不可用时，显示 `detail_animation_unavailable`（联网后可查看动作动画）。动画全部可用时不显示提示。训练不依赖动画 |
| 隐私 | 请求不带 Cookie、令牌、账号、会员或设备标识，不带查询参数。除 `If-None-Match` 外不加自定义请求头。iOS 使用专用的 ephemeral `URLSession`，不存 Cookie，不用 `URLCache`。Android 只在 `NetworkModule` 中创建 `OkHttpClient`，下载用 `newBuilder()` 派生的客户端。不向 Sentry 发送动画数据、地址或带查询参数的错误 |

资产主机由 Cloudflare 提供。下载动画时，Cloudflare 会处理设备的 IP 地址和请求信息。隐私政策和《第三方信息共享清单》还没有写明这一用途。发布包含远端载入的应用版本之前，必须更新这两份文件。以后改变请求的内容时，例如加入标识或改用其他服务商，也必须在同一变更中更新这两份文件。

Boji 的实现见 iOS 的 `ios/Boji/Models/ExerciseAnimationRemoteStore.swift` 和 Android 的 `feature/training/RemoteExerciseAnimations.kt`。下文 iOS 和 Android 两节的示例只覆盖打包的动作。

推送到 `master` 后，资产主机自动发布资产目录。发布前，远端课程的动作显示原有的插画或图标，详情页显示 `detail_animation_unavailable`。两端的远端载入都只用假传输层测试过，还没有请求过真实的资产主机。

## iOS

1. 用 Swift Package Manager 添加 `https://github.com/airbnb/lottie-spm`，版本选 4.6.1 或更高。
2. 以 folder reference 方式把 `animations/lottie` 加入 Boji target。folder reference 会保留 `light/` 和 `dark/` 子目录，bundle 中的路径为 `lottie/<主题>/<动作 ID>.json`，索引为 `lottie/index.json`。
3. 用下面的视图按动作 ID 播放动画。`posterFrame` 和 `frames` 从 `index.json` 读取。

如果你在打包时改了目录名，必须同步修改 `subdirectory` 参数。`JSONDecoder` 默认忽略未知字段，不需要额外设置。

```swift
import Lottie
import SwiftUI

struct ExerciseAnimationView<Fallback: View>: View {
    let exerciseID: String
    let posterFrame: Int?
    let frames: Int?
    let isDark: Bool // 应用实际使用的深浅色
    let isPlaying: Bool // 训练暂停时为 false
    @ViewBuilder let fallback: () -> Fallback
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        let theme = isDark ? "dark" : "light"
        if let animation = LottieAnimation.named(exerciseID, subdirectory: "lottie/\(theme)") {
            LottieView(animation: animation)
                .playbackMode(playbackMode)
                .resizable()
                .aspectRatio(1, contentMode: .fit)
                .accessibilityHidden(true) // 旁边已显示动作名称
                .id(theme) // 切换主题时重新加载
        } else {
            fallback()
        }
    }

    private var playbackMode: LottiePlaybackMode {
        if reduceMotion { return .paused(at: .frame(AnimationFrameTime(validPosterFrame))) }
        if !isPlaying { return .paused(at: .currentFrame) }
        // 起点必须是 0，不能是 nil。见下文。
        return .playing(.fromProgress(0, toProgress: 1, loopMode: .loop))
    }

    /// posterFrame 缺失或越界时回退到第 0 帧。
    private var validPosterFrame: Int {
        guard let posterFrame, let frames, (0..<frames).contains(posterFrame) else { return 0 }
        return posterFrame
    }
}
```

lottie-ios 4.6.1 有三点需要注意。下面的结论来自它的源码 `LottieAnimationLayer.swift`：

- 不要用 `.fromProgress(nil, …)` 继续播放。`nil` 会把当前进度设为之后每一轮的起点，暂停一次后，循环就只剩后半段。
- `.fromProgress(0, toProgress: 1, loopMode: .loop)` 会从当前帧接着播放。循环模式下，如果当前帧在播放范围内，lottie-ios 会给第一轮加上时间偏移。之后每一轮仍然是完整范围。
- 系统开启「减少动态效果」时，lottie-ios 默认会接管 `play()`。它会改为播放名为 `reduced motion` 的标记。本项目的动画没有这个标记，所以 `play()` 不会有任何效果。应用必须自己停在 `posterFrame`。

用 UIKit 的 `LottieAnimationView` 也可以满足同样的规则，Boji 的 iOS 端就是这样接入的：

- 设置 `loopMode = .loop`，开始和继续都调用无参数的 `play()`。它使用完整范围，并从当前帧接着播放。
- 训练暂停时调用 `pause()`。
- 开启「减少动态效果」时，先 `pause()`，再把 `currentFrame` 设为 `posterFrame`。

## Android

1. 在 `android/gradle/libs.versions.toml` 中添加依赖，并在 `app` 模块中引用：

   | 依赖 | 用途 |
   | --- | --- |
   | `com.airbnb.android:lottie-compose:6.7.1` | 播放动画。它依赖 appcompat 1.6.1，会把 appcompat 带进应用 |
   | `org.jetbrains.kotlinx:kotlinx-serialization-json` 和 kotlinx.serialization 编译插件 | 解析 `index.json` |
   | `androidx.lifecycle:lifecycle-runtime-compose` | 提供 `LifecycleResumeEffect` |

   缺少 kotlinx.serialization 编译插件时，代码仍然能编译。但运行时会抛出 `Serializer for class ... is not found`。下面的 `readAnimationIndex` 会捕获这个异常并返回空表，代表帧就会一直是第 0 帧。建议用单元测试读取真实的 `index.json`，确认结果不为空。这一条依据 kotlinx.serialization 的机制，没有在 Boji 中验证。

2. 在 `app/build.gradle.kts` 中把 `animations/lottie` 加为 assets 目录。assets 中的路径为 `<主题>/<动作 ID>.json`，索引 `index.json` 位于 assets 根目录。AGP 9.4.1 已弃用 `assets.srcDir(...)`，必须使用 `assets.directories`：

   ```kotlin
   android {
       sourceSets {
           getByName("main") {
               assets.directories.add(rootProject.file("../animations/lottie").path)
           }
       }
   }
   ```

3. 读取 `index.json`。kotlinx.serialization 默认遇到未知字段会抛出异常，所以必须设置 `ignoreUnknownKeys = true`。索引缺失或无法解析时返回空表，不要让应用崩溃。

   ```kotlin
   @Serializable
   data class AnimationEntry(val id: String, val frames: Int, val posterFrame: Int)

   private val indexJson = Json { ignoreUnknownKeys = true }

   /** 同步读取磁盘，必须在 Dispatchers.IO 中调用。 */
   fun readAnimationIndex(context: Context): Map<String, AnimationEntry> =
       try {
           context.assets.open("index.json").use { input ->
               indexJson.decodeFromString<List<AnimationEntry>>(input.readBytes().decodeToString())
           }.associateBy { it.id }
       } catch (e: IOException) {
           emptyMap() // 文件缺失
       } catch (e: IllegalArgumentException) {
           emptyMap() // JSON 无效。SerializationException 是 IllegalArgumentException 的子类
       }
   ```

   不要在组合过程中直接调用 `readAnimationIndex`。可以用 `produceState` 在后台读取，索引很小，按进程缓存一次即可：

   ```kotlin
   val context = LocalContext.current
   val index by produceState(emptyMap<String, AnimationEntry>()) {
       value = withContext(Dispatchers.IO) { readAnimationIndex(context) }
   }
   ```

4. 用下面的组件按动作 ID 播放动画。组件只调用一次 `LottieAnimation`，用 `progress` 在播放进度和代表帧之间切换。系统重新开启动画后，动画会从暂停的位置接着播放。

```kotlin
@Composable
fun ExerciseAnimation(
    exerciseId: String,
    entry: AnimationEntry?, // 索引中没有该动作时为 null
    isDark: Boolean, // 应用实际使用的深浅色，不要用 isSystemInDarkTheme()
    isPlaying: Boolean, // 训练暂停时为 false
    modifier: Modifier = Modifier, // 尺寸由调用方决定
    fallback: @Composable () -> Unit,
) {
    val theme = if (isDark) "dark" else "light"
    val spec = remember(theme, exerciseId) { LottieCompositionSpec.Asset("$theme/$exerciseId.json") }
    val result = rememberLottieComposition(spec)
    if (result.isFailure) {
        fallback()
        return
    }

    // 系统可能在应用处于后台时关闭动画，所以每次 onResume 都重新读取。
    var animatorsEnabled by remember { mutableStateOf(ValueAnimator.areAnimatorsEnabled()) }
    LifecycleResumeEffect(Unit) {
        animatorsEnabled = ValueAnimator.areAnimatorsEnabled()
        onPauseOrDispose {}
    }

    // restartOnPlay = false：暂停后继续时从当前帧接着播放。
    val playing by animateLottieCompositionAsState(
        composition = result.value,
        iterations = LottieConstants.IterateForever,
        isPlaying = isPlaying && animatorsEnabled,
        restartOnPlay = false,
    )
    val poster = posterProgress(entry)
    LottieAnimation(
        composition = result.value,
        progress = { if (animatorsEnabled) playing else poster },
        modifier = modifier.clearAndSetSemantics {}, // 旁边已显示动作名称
    )
}

/** posterFrame 缺失或越界时回退到第 0 帧，也避免 frames 为 0 时得到 NaN。 */
private fun posterProgress(entry: AnimationEntry?): Float {
    if (entry == null || entry.frames <= 0 || entry.posterFrame !in 0 until entry.frames) return 0f
    return entry.posterFrame / entry.frames.toFloat()
}
```

`ValueAnimator.areAnimatorsEnabled()` 从 API 26 起可用。无限循环通过 `withInfiniteAnimationFrameNanos` 驱动，所以 Compose 界面测试不会因为动画而无法进入空闲状态。

切换深浅色会重建 Activity。如果应用在 `ON_PAUSE` 时暂停训练，必须先检查 `isChangingConfigurations`。否则切换主题时，训练会被意外暂停。
