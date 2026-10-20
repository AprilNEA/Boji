# 接入说明

本文给出 iOS 和 Android 播放动作动画的示例代码。两端都直接引用 `animations/lottie/`，不复制文件。目录和文件格式的约定见 [README 中的应用接入契约](../README.md#应用接入契约)。

下面的代码没有在 Boji 中编译或运行。接入时以各端的构建结果为准。

## 播放位置

建议在动作详情或当前动作卡片中播放动画。列表行继续使用现有图标，这样一屏不会同时播放多个动画。

## iOS

1. 用 Swift Package Manager 添加 `https://github.com/airbnb/lottie-spm`，版本选 4.6.1 或更高。
2. 以 folder reference 方式把 `animations/lottie` 加入 Boji target。folder reference 会保留 `light/` 和 `dark/` 子目录，bundle 中的路径为 `lottie/<主题>/<动作 ID>.json`。
3. 用下面的视图按动作 ID 播放动画。

如果你在打包时改了目录名，必须同步修改 `subdirectory` 参数。

```swift
import Lottie
import SwiftUI

struct ExerciseAnimationView: View {
    let exerciseID: String
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        let theme = colorScheme == .dark ? "dark" : "light"
        LottieView(animation: .named(exerciseID, subdirectory: "lottie/\(theme)"))
            .playing(loopMode: .loop)
            .resizable()
            .aspectRatio(1, contentMode: .fit)
            .id(theme) // 切换主题时重新加载
    }
}
```

## Android

1. 在 `android/gradle/libs.versions.toml` 中添加 `com.airbnb.android:lottie-compose:6.7.1`，并在 `app` 模块中引用。
2. 在 `app/build.gradle.kts` 中把 `animations/lottie` 加为 assets 目录。assets 中的路径为 `<主题>/<动作 ID>.json`。
3. 用下面的组件按动作 ID 播放动画。

```kotlin
android {
    sourceSets {
        getByName("main") {
            assets.srcDir(rootProject.file("../animations/lottie"))
        }
    }
}
```

```kotlin
@Composable
fun ExerciseAnimation(exerciseId: String, modifier: Modifier = Modifier) {
    val theme = if (isSystemInDarkTheme()) "dark" else "light"
    val composition by rememberLottieComposition(
        LottieCompositionSpec.Asset("$theme/$exerciseId.json"),
    )
    LottieAnimation(
        composition = composition,
        iterations = LottieConstants.IterateForever,
        modifier = modifier.aspectRatio(1f),
    )
}
```
