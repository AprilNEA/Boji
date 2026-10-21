package club.leanmuscle.boji.feature.membership

import android.text.format.DateFormat
import androidx.annotation.StringRes
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import club.leanmuscle.boji.R
import club.leanmuscle.boji.ui.components.formatMediumDate
import club.leanmuscle.boji.ui.components.textLocale
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

/** Card colors. They change only the look, never the membership. */
enum class CardStyle(
    @param:StringRes val labelRes: Int,
    val top: Color,
    val bottom: Color,
    val content: Color,
    val secondary: Color,
) {
    FOREST(R.string.card_style_forest, Color(0xFF2F4A3A), Color(0xFF1C2E24), Color(0xFFF4F1E8), Color(0xFFC9D6C4)),
    CHALK(R.string.card_style_chalk, Color(0xFFF7F4EC), Color(0xFFE8E2D3), Color(0xFF22221F), Color(0xFF66625A)),
    INK(R.string.card_style_ink, Color(0xFF2A2A2D), Color(0xFF111113), Color(0xFFF2F0EA), Color(0xFFB4B1A8)),
}

/** What the card face shows. Values come from the server, except in the enrollment preview. */
data class CardFace(
    val nickname: String,
    /** The member number as the server sent it, or null before the card exists. */
    val memberNumber: String?,
    val joinedAt: Instant?,
    val showsNumber: Boolean = true,
    val isOffline: Boolean = false,
)

/**
 * The member card. The member number is shown exactly as the server sent it: no formatting, no
 * parsing (docs/developers/membership.mdx).
 */
@Composable
fun MembershipCardFace(face: CardFace, style: CardStyle, modifier: Modifier = Modifier) {
    val number = when {
        face.memberNumber == null -> stringResource(R.string.card_number_placeholder)
        face.showsNumber -> face.memberNumber
        else -> stringResource(R.string.card_number_hidden)
    }
    val joined = face.joinedAt?.let { stringResource(R.string.card_joined_on, formatMediumDate(it.atZone(ZoneId.systemDefault()).toLocalDate())) }
        ?: stringResource(R.string.card_joined_pending)
    val description = listOfNotNull(
        stringResource(R.string.card_club_name),
        face.nickname,
        stringResource(R.string.card_number_a11y, number),
        joined,
        if (face.isOffline) stringResource(R.string.card_offline) else null,
    ).joinToString("，")

    Column(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(1.586f)
            .clip(RoundedCornerShape(24.dp))
            .background(Brush.linearGradient(listOf(style.top, style.bottom)))
            .padding(22.dp)
            .clearAndSetSemantics { contentDescription = description },
        verticalArrangement = Arrangement.SpaceBetween,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(
                    stringResource(R.string.card_club_name),
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = style.content,
                )
                Text(stringResource(R.string.card_kind), style = MaterialTheme.typography.labelSmall, color = style.secondary)
            }
            Icon(
                painterResource(R.drawable.ic_card_membership),
                contentDescription = null,
                tint = style.secondary,
                modifier = Modifier.size(24.dp),
            )
        }
        Text(
            text = face.nickname,
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = style.content,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(stringResource(R.string.card_number_label), style = MaterialTheme.typography.labelSmall, color = style.secondary)
            Text(
                text = number,
                style = MaterialTheme.typography.titleMedium,
                fontFamily = if (face.memberNumber != null && face.showsNumber) FontFamily.Monospace else null,
                color = style.content,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Spacer(Modifier.size(4.dp))
            Text(joined, style = MaterialTheme.typography.labelMedium, color = style.secondary)
            if (face.isOffline) {
                Text(stringResource(R.string.card_offline), style = MaterialTheme.typography.labelSmall, color = style.secondary)
            }
        }
    }
}

/** Date and time in the text language, such as 2026年10月21日 上午9:30. */
@Composable
@ReadOnlyComposable
fun formatDateTime(instant: Instant): String {
    val locale = textLocale
    val pattern = DateFormat.getBestDateTimePattern(locale, "yMMMdjmm")
    return DateTimeFormatter.ofPattern(pattern, locale).format(instant.atZone(ZoneId.systemDefault()))
}

@Composable
@ReadOnlyComposable
fun formatDate(instant: Instant): String = formatMediumDate(instant.atZone(ZoneId.systemDefault()).toLocalDate())
