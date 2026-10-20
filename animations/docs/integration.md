# 接入说明

本文说明 iOS 和 Android 怎样播放动作动画。两端都直接引用 `animations/lottie/`，不复制文件。目录和文件格式的约定见 [README 中的应用接入契约](../README.md#应用接入契约)。

`animations/lottie-library/` 存放尚未编入课程的动作，只用于预览和评审。禁止把这个目录打包进应用。

Android 端已经按本文接入，构建和测试都已通过（Android 任务回报，2026-10-20 21:41，UTC+8）。本文的代码片段是示例，没有单独编译。接入时以各端的构建结果为准。

## 播放规则

应用必须处理以下 4 种情况：

| 情况 | 应用的行为 |
| --- | --- |
| 正常 | 在动作详情或当前动作卡片中循环播放。列表行继续使用现有图标，一屏只播放一个动画 |
| 系统关闭动画或开启「减少动态效果」 | 停在 `index.json` 中该动作的 `posterFrame`，不显示第 0 帧 |
| 动画文件缺失或无法解析 | 显示原有的插画或图标 |
| 应用切换深浅色 | 加载另一个主题的文件。主题以应用实际使用的深浅色为准，包括应用内的外观设置 |

第 0 帧通常是起始姿势，例如深蹲的站立姿势。静止时显示第 0 帧，用户看不出是什么动作。`posterFrame` 指向动作最有代表性的一帧，例如深蹲的最低点。

## iOS

1. 用 Swift Package Manager 添加 `https://github.com/airbnb/lottie-spm`，版本选 4.6.1 或更高。
2. 以 folder reference 方式把 `animations/lottie` 加入 Boji target。folder reference 会保留 `light/` 和 `dark/` 子目录，bundle 中的路径为 `lottie/<主题>/<动作 ID>.json`。
3. 用下面的视图按动作 ID 播放动画。`posterFrame` 从 `index.json` 读取。

如果你在打包时改了目录名，必须同步修改 `subdirectory` 参数。

```swift
import Lottie
import SwiftUI

struct ExerciseAnimationView<Fallback: View>: View {
    let exerciseID: String
    let posterFrame: Int
    let isDark: Bool // 应用实际使用的深浅色
    @ViewBuilder let fallback: () -> Fallback
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        let theme = isDark ? "dark" : "light"
        if let animation = LottieAnimation.named(exerciseID, subdirectory: "lottie/\(theme)") {
            LottieView(animation: animation)
                .playbackMode(reduceMotion
                    ? .paused(at: .frame(AnimationFrameTime(posterFrame)))
                    : .playing(.fromProgress(0, toProgress: 1, loopMode: .loop)))
                .resizable()
                .aspectRatio(1, contentMode: .fit)
                .id(theme) // 切换主题时重新加载
        } else {
            fallback()
        }
    }
}
```

## Android

1. 在 `android/gradle/libs.versions.toml` 中添加 `com.airbnb.android:lottie-compose:6.7.1`，并在 `app` 模块中引用。lottie 6.7.1 依赖 appcompat 1.6.1，会把 appcompat 带进应用。
2. 在 `app/build.gradle.kts` 中把 `animations/lottie` 加为 assets 目录。assets 中的路径为 `<主题>/<动作 ID>.json`。AGP 9.4.1 已弃用 `assets.srcDir(...)`，必须使用 `assets.directories`：

   ```kotlin
   android {
       sourceSets {
           getByName("main") {
               assets.directories.add(rootProject.file("../animations/lottie").path)
           }
       }
   }
   ```

3. 用下面的组件按动作 ID 播放动画。`posterFrame` 和 `frames` 从 `index.json` 读取。

```kotlin
@Composable
fun ExerciseAnimation(
    exerciseId: String,
    posterFrame: Int,
    frames: Int,
    isDark: Boolean, // 应用实际使用的深浅色，不要用 isSystemInDarkTheme()
    modifier: Modifier = Modifier,
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

    if (animatorsEnabled) {
        LottieAnimation(
            composition = result.value,
            iterations = LottieConstants.IterateForever,
            modifier = modifier.aspectRatio(1f),
        )
    } else {
        LottieAnimation(
            composition = result.value,
            progress = { posterFrame / frames.toFloat() },
            modifier = modifier.aspectRatio(1f),
        )
    }
}
```

`ValueAnimator.areAnimatorsEnabled()` 从 API 26 起可用。无限循环通过 `withInfiniteAnimationFrameNanos` 驱动，所以 Compose 界面测试不会因为动画而无法进入空闲状态。
