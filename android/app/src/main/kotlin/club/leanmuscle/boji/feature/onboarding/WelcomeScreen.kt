package club.leanmuscle.boji.feature.onboarding

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.model.PlanKind
import club.leanmuscle.boji.ui.components.BojiCard
import club.leanmuscle.boji.ui.components.CardShape
import club.leanmuscle.boji.ui.components.FootNote
import club.leanmuscle.boji.ui.components.OrbitArtwork
import club.leanmuscle.boji.ui.components.PageColumn
import club.leanmuscle.boji.ui.components.PageHeading
import club.leanmuscle.boji.ui.components.PrimaryButton
import club.leanmuscle.boji.ui.components.SymbolTile
import club.leanmuscle.boji.ui.components.iconRes
import club.leanmuscle.boji.ui.components.subtitleRes
import club.leanmuscle.boji.ui.components.titleRes

/** First-run screen. It has no back or dismiss path until a plan is chosen, as on iOS. */
@Composable
fun WelcomeScreen(onStart: (PlanKind) -> Unit, modifier: Modifier = Modifier) {
    var selected by rememberSaveable { mutableStateOf(PlanKind.Home) }
    Column(modifier = modifier.fillMaxSize().testTag("screen_Welcome")) {
        PageColumn(
            modifier = Modifier.weight(1f).windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Top)),
            contentPadding = PaddingValues(24.dp),
            maxWidth = 640.dp,
            spacing = 26.dp,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = stringResource(R.string.welcome_brand),
                    fontSize = 44.sp,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.weight(1f),
                )
                Text(stringResource(R.string.app_title), style = MaterialTheme.typography.titleSmall)
            }
            OrbitArtwork(
                icon = R.drawable.ic_self_improvement,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.align(Alignment.CenterHorizontally),
            )
            PageHeading(
                eyebrow = stringResource(R.string.welcome_eyebrow),
                title = stringResource(R.string.welcome_title),
                subtitle = stringResource(R.string.welcome_subtitle),
            )
            Column(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.selectableGroup()) {
                Text(stringResource(R.string.welcome_question), style = MaterialTheme.typography.titleMedium)
                PlanKind.entries.forEach { plan ->
                    PlanOption(plan = plan, selected = plan == selected, onSelect = { selected = plan })
                }
            }
            FootNote(text = stringResource(R.string.welcome_privacy), icon = R.drawable.ic_lock)
        }
        Surface(color = MaterialTheme.colorScheme.background) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .padding(horizontal = 24.dp, vertical = 12.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                PrimaryButton(
                    text = stringResource(R.string.welcome_start),
                    icon = R.drawable.ic_arrow_outward,
                    onClick = { onStart(selected) },
                    modifier = Modifier.widthIn(max = 592.dp).testTag("welcome_start"),
                )
                Text(
                    text = stringResource(R.string.welcome_disclaimer),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}

@Composable
private fun PlanOption(plan: PlanKind, selected: Boolean, onSelect: () -> Unit) {
    BojiCard(
        modifier = Modifier
            .clip(CardShape)
            .selectable(selected = selected, role = Role.RadioButton, onClick = onSelect)
            .testTag("plan_${plan.name}"),
        contentPadding = PaddingValues(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            SymbolTile(icon = plan.iconRes, color = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.size(14.dp))
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(stringResource(plan.titleRes), style = MaterialTheme.typography.titleMedium)
                Text(
                    stringResource(plan.subtitleRes),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Icon(
                painter = painterResource(if (selected) R.drawable.ic_check_circle else R.drawable.ic_radio_unchecked),
                contentDescription = null,
                tint = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
