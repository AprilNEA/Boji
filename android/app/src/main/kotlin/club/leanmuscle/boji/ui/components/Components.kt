package club.leanmuscle.boji.ui.components

import androidx.annotation.DrawableRes
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import club.leanmuscle.boji.R
import club.leanmuscle.boji.ui.theme.BojiThemeColors

/** Content width limit on tablets and foldables, same as iOS. */
val ContentMaxWidth: Dp = 680.dp

val CardShape = RoundedCornerShape(26.dp)

/** Scrollable page body. Content is centered and limited to [maxWidth]. */
@Composable
fun PageColumn(
    modifier: Modifier = Modifier,
    contentPadding: PaddingValues = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
    maxWidth: Dp = ContentMaxWidth,
    spacing: Dp = 24.dp,
    content: @Composable ColumnScope.() -> Unit,
) {
    Box(
        modifier = modifier.fillMaxWidth().verticalScroll(rememberScrollState()),
        contentAlignment = Alignment.TopCenter,
    ) {
        Column(
            modifier = Modifier.widthIn(max = maxWidth).fillMaxWidth().padding(contentPadding),
            verticalArrangement = Arrangement.spacedBy(spacing),
            content = content,
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BojiTopBar(
    title: String,
    onBack: (() -> Unit)? = null,
    actions: @Composable () -> Unit = {},
) {
    TopAppBar(
        title = { Text(title, style = MaterialTheme.typography.titleMedium) },
        navigationIcon = {
            if (onBack != null) {
                IconButton(onClick = onBack) {
                    Icon(painterResource(R.drawable.ic_arrow_back), contentDescription = stringResource(R.string.action_back))
                }
            }
        },
        actions = { actions() },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.background,
            scrolledContainerColor = MaterialTheme.colorScheme.surfaceContainer,
        ),
    )
}

@Composable
fun PageHeading(eyebrow: String, title: String, modifier: Modifier = Modifier, subtitle: String? = null) {
    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(9.dp)) {
        Text(
            text = eyebrow,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            letterSpacing = 2.sp,
            color = MaterialTheme.colorScheme.primary,
        )
        Text(
            text = title,
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.semantics { heading() },
        )
        if (subtitle != null) {
            Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
fun SectionHeading(title: String, detail: String?, modifier: Modifier = Modifier, trailing: @Composable () -> Unit = {}) {
    Row(modifier = modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.weight(1f).semantics { heading() },
        )
        if (detail != null) {
            Text(detail, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        trailing()
    }
}

/** Content card. Glass and tonal effects stay on controls, not on content, as on iOS. */
@Composable
fun BojiCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    contentPadding: PaddingValues = PaddingValues(20.dp),
    content: @Composable ColumnScope.() -> Unit,
) {
    val color = BojiThemeColors.current.card
    if (onClick == null) {
        Surface(modifier = modifier.fillMaxWidth(), shape = CardShape, color = color) {
            Column(Modifier.padding(contentPadding), content = content)
        }
    } else {
        Surface(onClick = onClick, modifier = modifier.fillMaxWidth(), shape = CardShape, color = color) {
            Column(Modifier.padding(contentPadding), content = content)
        }
    }
}

@Composable
fun SymbolTile(@DrawableRes icon: Int, color: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier.size(46.dp).background(color.copy(alpha = 0.10f), RoundedCornerShape(15.dp)),
        contentAlignment = Alignment.Center,
    ) {
        Icon(painterResource(icon), contentDescription = null, tint = color, modifier = Modifier.size(24.dp))
    }
}

@Composable
fun PrimaryButton(
    text: String,
    @DrawableRes icon: Int,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.fillMaxWidth().heightIn(min = 56.dp),
        contentPadding = PaddingValues(horizontal = 24.dp, vertical = 12.dp),
    ) {
        Text(text, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
        Icon(painterResource(icon), contentDescription = null, modifier = Modifier.size(20.dp))
    }
}

/** Decorative rings and a large icon. Hidden from accessibility services. */
@Composable
fun OrbitArtwork(@DrawableRes icon: Int, color: Color, modifier: Modifier = Modifier, iconSize: Dp = 96.dp) {
    Box(modifier = modifier.size(width = 200.dp, height = 220.dp).clearAndSetSemantics {}, contentAlignment = Alignment.Center) {
        Canvas(Modifier.matchParentSize()) {
            rotate(degrees = -28f) {
                for (index in 0 until 5) {
                    val ringSize = Size((90 + index * 30).dp.toPx(), (100 + index * 30).dp.toPx())
                    drawOval(
                        color = color.copy(alpha = color.alpha * (0.10f + index * 0.025f)),
                        topLeft = Offset(center.x - ringSize.width / 2, center.y - ringSize.height / 2),
                        size = ringSize,
                        style = Stroke(width = 1.dp.toPx()),
                    )
                }
            }
        }
        Icon(painterResource(icon), contentDescription = null, tint = color, modifier = Modifier.size(iconSize))
    }
}

@Composable
fun EmptyNote(@DrawableRes icon: Int, title: String, text: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier.fillMaxWidth().padding(vertical = 26.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Icon(painterResource(icon), contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(40.dp))
        Text(title, style = MaterialTheme.typography.titleMedium)
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
    }
}

/** Small print with an optional leading icon. */
@Composable
fun FootNote(text: String, modifier: Modifier = Modifier, @DrawableRes icon: Int? = null, iconTint: Color? = null) {
    Row(modifier = modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        if (icon != null) {
            Icon(
                painterResource(icon),
                contentDescription = null,
                tint = iconTint ?: MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(18.dp),
            )
        }
        Text(text, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

/** Value with minus and plus buttons, like a UIKit stepper. */
@Composable
fun NumberStepper(
    label: String,
    onDecrease: () -> Unit,
    onIncrease: () -> Unit,
    decreaseEnabled: Boolean,
    increaseEnabled: Boolean,
    modifier: Modifier = Modifier,
) {
    Row(modifier = modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(label, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
        FilledTonalIconButton(onClick = onDecrease, enabled = decreaseEnabled) {
            Icon(painterResource(R.drawable.ic_remove), contentDescription = stringResource(R.string.stepper_decrease))
        }
        Spacer(Modifier.width(8.dp))
        FilledTonalIconButton(onClick = onIncrease, enabled = increaseEnabled) {
            Icon(painterResource(R.drawable.ic_add), contentDescription = stringResource(R.string.stepper_increase))
        }
    }
}

/** Page frame with the Boji top bar. Content gets the scaffold padding. */
@Composable
fun BojiScaffold(
    title: String,
    modifier: Modifier = Modifier,
    onBack: (() -> Unit)? = null,
    actions: @Composable () -> Unit = {},
    bottomBar: @Composable () -> Unit = {},
    content: @Composable (PaddingValues) -> Unit,
) {
    Scaffold(
        modifier = modifier,
        topBar = { BojiTopBar(title = title, onBack = onBack, actions = actions) },
        bottomBar = bottomBar,
        containerColor = MaterialTheme.colorScheme.background,
        content = content,
    )
}
