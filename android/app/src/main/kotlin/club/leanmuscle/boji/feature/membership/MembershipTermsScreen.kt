package club.leanmuscle.boji.feature.membership

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.membership.MembershipRules
import club.leanmuscle.boji.ui.components.BojiCard
import club.leanmuscle.boji.ui.components.BojiScaffold
import club.leanmuscle.boji.ui.components.FootNote
import club.leanmuscle.boji.ui.components.PageColumn
import club.leanmuscle.boji.ui.components.SectionHeading

const val TERMS_SCREEN_TAG = "membership_terms_screen"

/** The pledges and what the account and the card send to the server. Static text only. */
@Composable
fun MembershipTermsScreen(onBack: () -> Unit, modifier: Modifier = Modifier) {
    BojiScaffold(title = stringResource(R.string.terms_title), onBack = onBack, modifier = modifier.testTag(TERMS_SCREEN_TAG)) { padding ->
        PageColumn(modifier = Modifier.padding(padding), spacing = 18.dp) {
            SectionHeading(stringResource(R.string.terms_pledges), null)
            BojiCard {
                MembershipRules.PLEDGES.forEachIndexed { index, pledge ->
                    if (index > 0) HorizontalDivider(Modifier.padding(vertical = 10.dp))
                    Text(stringResource(pledge.titleRes()), style = MaterialTheme.typography.titleSmall)
                    Text(stringResource(pledge.textRes()), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            SectionHeading(stringResource(R.string.terms_data), null)
            BojiCard {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    listOf(
                        R.string.terms_data_account,
                        R.string.terms_data_local,
                        R.string.terms_data_token,
                        R.string.terms_data_share,
                    ).forEach { Text(stringResource(it), style = MaterialTheme.typography.bodyMedium) }
                }
            }
            SectionHeading(stringResource(R.string.terms_boundary), null)
            BojiCard {
                Text(stringResource(R.string.terms_boundary_text), style = MaterialTheme.typography.bodyMedium)
            }
            FootNote(stringResource(R.string.terms_deletion))
            FootNote(stringResource(R.string.terms_version, MembershipRules.TERMS_VERSION))
        }
    }
}
