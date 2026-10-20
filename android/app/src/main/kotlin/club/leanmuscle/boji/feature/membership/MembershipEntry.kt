package club.leanmuscle.boji.feature.membership

import androidx.compose.foundation.clickable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.membership.AccountState

const val MEMBERSHIP_ENTRY_TAG = "membership_entry"

/** The card at the top of 俱乐部. It opens the member center, like MembershipEntryView on iOS. */
@Composable
fun MembershipEntry(state: AccountState, onOpen: () -> Unit, modifier: Modifier = Modifier) {
    val signedIn = state as? AccountState.SignedIn
    val card = signedIn?.card
    val face = if (card != null) {
        CardFace(card.nickname, card.memberNumber, card.createTime, isOffline = signedIn.isOffline)
    } else {
        CardFace(stringResource(R.string.club_entry_title), memberNumber = null, joinedAt = null)
    }
    MembershipCardFace(
        face = face,
        style = CardStyle.FOREST,
        modifier = modifier
            .testTag(MEMBERSHIP_ENTRY_TAG)
            .clip(RoundedCornerShape(24.dp))
            .clickable(
                onClickLabel = stringResource(if (card == null) R.string.club_entry_claim else R.string.club_entry_view),
                role = Role.Button,
                onClick = onOpen,
            ),
    )
}
