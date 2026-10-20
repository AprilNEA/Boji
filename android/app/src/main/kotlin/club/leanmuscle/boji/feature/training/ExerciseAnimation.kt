package club.leanmuscle.boji.feature.training

import android.animation.ValueAnimator
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.produceState
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.testTag
import androidx.lifecycle.compose.LifecycleResumeEffect
import club.leanmuscle.boji.ui.theme.BojiThemeColors
import com.airbnb.lottie.compose.LottieAnimation
import com.airbnb.lottie.compose.LottieCompositionSpec
import com.airbnb.lottie.compose.LottieConstants
import com.airbnb.lottie.compose.animateLottieCompositionAsState
import com.airbnb.lottie.compose.rememberLottieComposition

/**
 * Asset path of the animation for [exerciseId]. `app/build.gradle.kts` adds `animations/lottie`
 * as an assets directory, so the path matches `files.light` and `files.dark` in its `index.json`.
 */
fun exerciseAnimationAsset(exerciseId: String, dark: Boolean): String =
    "${if (dark) "dark" else "light"}/$exerciseId.json"

/**
 * Loops the Lottie animation of [exerciseId]. The file has no background, so the caller provides
 * the card color.
 *
 * - The palette follows [BojiThemeColors.isDark]. A theme change loads the other file.
 * - When [playing] is false, the animation holds its current frame.
 * - When the system turns animations off, the still frame `posterFrame` from `index.json` shows.
 *   Without an index entry, the first frame shows.
 * - While the file loads, the area stays empty. If the file is missing or fails to load,
 *   [fallback] shows instead.
 */
@Composable
fun ExerciseAnimation(
    exerciseId: String,
    playing: Boolean,
    modifier: Modifier = Modifier,
    fallback: @Composable () -> Unit,
) {
    val dark = BojiThemeColors.isDark
    val spec = remember(exerciseId, dark) { LottieCompositionSpec.Asset(exerciseAnimationAsset(exerciseId, dark)) }
    val result = rememberLottieComposition(spec)
    val composition by result
    val animatorsEnabled = rememberAnimatorsEnabled()
    val posterProgress = rememberPosterProgress(exerciseId)
    val state = animateLottieCompositionAsState(
        composition = composition,
        isPlaying = playing && animatorsEnabled,
        restartOnPlay = false,
        iterations = LottieConstants.IterateForever,
    )
    when {
        composition != null -> LottieAnimation(
            composition = composition,
            // With system animations off, show the still frame even if they were turned off mid-loop.
            progress = { if (animatorsEnabled) state.progress else posterProgress },
            // The exercise name below is the accessible label. The animation is decorative.
            modifier = modifier.clearAndSetSemantics { testTag = "exercise_animation" },
        )
        result.isFailure -> fallback()
        else -> Box(modifier)
    }
}

/** Lottie progress of the still frame of [exerciseId]. 0, the first frame, until the index loads. */
@Composable
private fun rememberPosterProgress(exerciseId: String): Float {
    val assets = LocalContext.current.assets
    val cached = ExerciseAnimationIndex.peek()?.get(exerciseId)?.posterProgress
    val progress by produceState(initialValue = cached ?: 0f, exerciseId, assets) {
        value = ExerciseAnimationIndex.load(assets)[exerciseId]?.posterProgress ?: 0f
    }
    return progress
}

/** False when the system animator duration scale is 0. Read again on every resume. */
@Composable
private fun rememberAnimatorsEnabled(): Boolean {
    var enabled by remember { mutableStateOf(ValueAnimator.areAnimatorsEnabled()) }
    LifecycleResumeEffect(Unit) {
        enabled = ValueAnimator.areAnimatorsEnabled()
        onPauseOrDispose {}
    }
    return enabled
}
