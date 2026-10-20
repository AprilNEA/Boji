package club.leanmuscle.boji.feature.membership

import android.content.ClipData
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.graphics.layer.drawLayer
import androidx.compose.ui.graphics.rememberGraphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.selection.toggleable
import androidx.compose.ui.semantics.Role
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.membership.MembershipCard
import club.leanmuscle.boji.ui.components.FootNote
import club.leanmuscle.boji.ui.components.PrimaryButton
import kotlinx.coroutines.launch
import java.time.Instant

const val SHARE_SHEET_TAG = "share_sheet"

/**
 * Share preview. Nothing leaves the device until the user picks a target in the system share
 * sheet. The member number is hidden by default.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MembershipShareSheet(
    card: MembershipCard,
    isOffline: Boolean,
    onDismiss: () -> Unit,
    writeImage: suspend (android.graphics.Bitmap) -> Uri?,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var style by rememberSaveable { mutableStateOf(CardStyle.FOREST) }
    var showsNumber by rememberSaveable { mutableStateOf(false) }
    var failed by remember { mutableStateOf(false) }
    val generatedAt = remember { Instant.now() }
    val layer = rememberGraphicsLayer()
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val chooserTitle = stringResource(R.string.share_chooser_title)
    val face = CardFace(card.nickname, card.memberNumber, card.createTime, showsNumber = showsNumber, isOffline = isOffline)

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState, modifier = Modifier.testTag(SHARE_SHEET_TAG)) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
                .navigationBarsPadding(),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                stringResource(R.string.share_title),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.fillMaxWidth().semantics { heading() },
            )
            Text(
                stringResource(R.string.share_intro),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.fillMaxWidth(),
            )
            ShareCardImage(
                face = face,
                style = style,
                generatedAt = generatedAt,
                modifier = Modifier
                    .widthIn(max = 360.dp)
                    .drawWithContent {
                        layer.record { this@drawWithContent.drawContent() }
                        drawLayer(layer)
                    },
            )
            Text(
                stringResource(R.string.share_style),
                style = MaterialTheme.typography.titleSmall,
                modifier = Modifier.fillMaxWidth(),
            )
            SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
                CardStyle.entries.forEachIndexed { index, option ->
                    SegmentedButton(
                        selected = option == style,
                        onClick = { style = option; failed = false },
                        shape = SegmentedButtonDefaults.itemShape(index, CardStyle.entries.size),
                    ) { Text(stringResource(option.labelRes)) }
                }
            }
            FootNote(stringResource(R.string.share_style_note))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .toggleable(value = showsNumber, role = Role.Switch, onValueChange = { showsNumber = it }),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(stringResource(R.string.share_show_number), style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
                Switch(checked = showsNumber, onCheckedChange = null)
            }
            FootNote(stringResource(if (showsNumber) R.string.share_number_shown_note else R.string.share_number_hidden_note))
            if (failed) {
                Text(
                    stringResource(R.string.share_failed),
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
            PrimaryButton(
                text = stringResource(R.string.share_action),
                icon = R.drawable.ic_share,
                onClick = {
                    scope.launch {
                        failed = false
                        val uri = writeImage(layer.toImageBitmap().asAndroidBitmap())
                        if (uri == null) {
                            failed = true
                            return@launch
                        }
                        val send = Intent(Intent.ACTION_SEND).apply {
                            type = "image/png"
                            putExtra(Intent.EXTRA_STREAM, uri)
                            clipData = ClipData.newRawUri(null, uri)
                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        }
                        context.startActivity(Intent.createChooser(send, chooserTitle))
                    }
                },
            )
            FootNote(stringResource(R.string.share_footer), icon = R.drawable.ic_lock)
            Spacer(Modifier.height(12.dp))
        }
    }
}

/** The image that the user shares. It is a keepsake, not proof of the current membership. */
@Composable
private fun ShareCardImage(face: CardFace, style: CardStyle, generatedAt: Instant, modifier: Modifier = Modifier) {
    val number = when {
        face.memberNumber == null -> stringResource(R.string.card_number_placeholder)
        face.showsNumber -> face.memberNumber
        else -> stringResource(R.string.card_number_hidden)
    }
    val description = stringResource(R.string.share_preview_a11y, number)
    Column(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(0.8f)
            .clip(RoundedCornerShape(28.dp))
            .background(Brush.verticalGradient(listOf(style.top, style.bottom)))
            .padding(26.dp)
            .clearAndSetSemantics { contentDescription = description },
        verticalArrangement = Arrangement.SpaceBetween,
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(stringResource(R.string.share_card_kind), style = MaterialTheme.typography.labelMedium, color = style.secondary)
            Text(
                stringResource(R.string.share_card_headline),
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = style.content,
            )
            Text(stringResource(R.string.share_card_motto), style = MaterialTheme.typography.bodyLarge, color = style.secondary)
        }
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(
                face.nickname,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = style.content,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                number,
                style = MaterialTheme.typography.titleMedium,
                fontFamily = if (face.showsNumber) FontFamily.Monospace else null,
                color = style.content,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            face.joinedAt?.let {
                Text(stringResource(R.string.card_joined_on, formatDate(it)), style = MaterialTheme.typography.labelMedium, color = style.secondary)
            }
            Text(
                stringResource(R.string.share_card_generated, formatDate(generatedAt)),
                style = MaterialTheme.typography.labelMedium,
                color = style.secondary,
            )
            Text(stringResource(R.string.share_card_record), style = MaterialTheme.typography.labelMedium, color = style.secondary)
            if (face.isOffline) {
                Text(stringResource(R.string.card_offline), style = MaterialTheme.typography.labelMedium, color = style.secondary)
            }
        }
        Text(stringResource(R.string.share_card_footer), style = MaterialTheme.typography.labelSmall, color = style.secondary)
    }
}
