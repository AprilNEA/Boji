package club.leanmuscle.boji.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf

// Brand colors stay fixed. Dynamic color is off so Android matches the iOS accent.
private val LightColors: ColorScheme = lightColorScheme(
    primary = PrimaryLight,
    onPrimary = OnPrimaryLight,
    primaryContainer = PrimaryContainerLight,
    onPrimaryContainer = OnPrimaryContainerLight,
    inversePrimary = InversePrimaryLight,
    secondary = SecondaryLight,
    onSecondary = OnSecondaryLight,
    secondaryContainer = SecondaryContainerLight,
    onSecondaryContainer = OnSecondaryContainerLight,
    tertiary = TertiaryLight,
    onTertiary = OnTertiaryLight,
    tertiaryContainer = TertiaryContainerLight,
    onTertiaryContainer = OnTertiaryContainerLight,
    background = BackgroundLight,
    onBackground = OnBackgroundLight,
    surface = SurfaceLight,
    onSurface = OnSurfaceLight,
    surfaceVariant = SurfaceVariantLight,
    onSurfaceVariant = OnSurfaceVariantLight,
    surfaceTint = SurfaceTintLight,
    inverseSurface = InverseSurfaceLight,
    inverseOnSurface = InverseOnSurfaceLight,
    error = ErrorLight,
    onError = OnErrorLight,
    errorContainer = ErrorContainerLight,
    onErrorContainer = OnErrorContainerLight,
    outline = OutlineLight,
    outlineVariant = OutlineVariantLight,
    scrim = ScrimLight,
    surfaceBright = SurfaceBrightLight,
    surfaceContainer = SurfaceContainerLight,
    surfaceContainerHigh = SurfaceContainerHighLight,
    surfaceContainerHighest = SurfaceContainerHighestLight,
    surfaceContainerLow = SurfaceContainerLowLight,
    surfaceContainerLowest = SurfaceContainerLowestLight,
    surfaceDim = SurfaceDimLight,
    primaryFixed = PrimaryFixedLight,
    primaryFixedDim = PrimaryFixedDimLight,
    onPrimaryFixed = OnPrimaryFixedLight,
    onPrimaryFixedVariant = OnPrimaryFixedVariantLight,
    secondaryFixed = SecondaryFixedLight,
    secondaryFixedDim = SecondaryFixedDimLight,
    onSecondaryFixed = OnSecondaryFixedLight,
    onSecondaryFixedVariant = OnSecondaryFixedVariantLight,
    tertiaryFixed = TertiaryFixedLight,
    tertiaryFixedDim = TertiaryFixedDimLight,
    onTertiaryFixed = OnTertiaryFixedLight,
    onTertiaryFixedVariant = OnTertiaryFixedVariantLight,
)

private val DarkColors: ColorScheme = darkColorScheme(
    primary = PrimaryDark,
    onPrimary = OnPrimaryDark,
    primaryContainer = PrimaryContainerDark,
    onPrimaryContainer = OnPrimaryContainerDark,
    inversePrimary = InversePrimaryDark,
    secondary = SecondaryDark,
    onSecondary = OnSecondaryDark,
    secondaryContainer = SecondaryContainerDark,
    onSecondaryContainer = OnSecondaryContainerDark,
    tertiary = TertiaryDark,
    onTertiary = OnTertiaryDark,
    tertiaryContainer = TertiaryContainerDark,
    onTertiaryContainer = OnTertiaryContainerDark,
    background = BackgroundDark,
    onBackground = OnBackgroundDark,
    surface = SurfaceDark,
    onSurface = OnSurfaceDark,
    surfaceVariant = SurfaceVariantDark,
    onSurfaceVariant = OnSurfaceVariantDark,
    surfaceTint = SurfaceTintDark,
    inverseSurface = InverseSurfaceDark,
    inverseOnSurface = InverseOnSurfaceDark,
    error = ErrorDark,
    onError = OnErrorDark,
    errorContainer = ErrorContainerDark,
    onErrorContainer = OnErrorContainerDark,
    outline = OutlineDark,
    outlineVariant = OutlineVariantDark,
    scrim = ScrimDark,
    surfaceBright = SurfaceBrightDark,
    surfaceContainer = SurfaceContainerDark,
    surfaceContainerHigh = SurfaceContainerHighDark,
    surfaceContainerHighest = SurfaceContainerHighestDark,
    surfaceContainerLow = SurfaceContainerLowDark,
    surfaceContainerLowest = SurfaceContainerLowestDark,
    surfaceDim = SurfaceDimDark,
    primaryFixed = PrimaryFixedDark,
    primaryFixedDim = PrimaryFixedDimDark,
    onPrimaryFixed = OnPrimaryFixedDark,
    onPrimaryFixedVariant = OnPrimaryFixedVariantDark,
    secondaryFixed = SecondaryFixedDark,
    secondaryFixedDim = SecondaryFixedDimDark,
    onSecondaryFixed = OnSecondaryFixedDark,
    onSecondaryFixedVariant = OnSecondaryFixedVariantDark,
    tertiaryFixed = TertiaryFixedDark,
    tertiaryFixedDim = TertiaryFixedDimDark,
    onTertiaryFixed = OnTertiaryFixedDark,
    onTertiaryFixedVariant = OnTertiaryFixedVariantDark,
)

@Composable
fun BojiTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val boji = if (darkTheme) DarkBojiColors else LightBojiColors
    val neutral = if (darkTheme) DarkNeutralSurfaces else LightNeutralSurfaces
    // The generated scheme tints every surface with the seed. Pages and bars use warm grays
    // instead, like iOS. Accent roles stay generated.
    val scheme = (if (darkTheme) DarkColors else LightColors).copy(
        background = boji.page,
        surface = boji.page,
        surfaceBright = boji.card,
        surfaceContainerLowest = boji.card,
        surfaceContainerLow = neutral.low,
        surfaceContainer = neutral.container,
        surfaceContainerHigh = neutral.high,
        surfaceContainerHighest = neutral.highest,
    )
    CompositionLocalProvider(LocalBojiColors provides boji, LocalBojiDarkTheme provides darkTheme) {
        MaterialTheme(colorScheme = scheme, content = content)
    }
}

private val LocalBojiDarkTheme = staticCompositionLocalOf { false }

/** Access to [BojiColors], in the style of `MaterialTheme.colorScheme`. */
object BojiThemeColors {
    val current: BojiColors
        @Composable
        @ReadOnlyComposable
        get() = LocalBojiColors.current

    /**
     * True when [BojiTheme] uses the dark palette. This follows the in-app appearance setting,
     * so it can differ from `isSystemInDarkTheme()`.
     */
    val isDark: Boolean
        @Composable
        @ReadOnlyComposable
        get() = LocalBojiDarkTheme.current
}
