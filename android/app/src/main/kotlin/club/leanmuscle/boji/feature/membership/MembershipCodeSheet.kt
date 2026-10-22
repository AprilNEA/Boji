package club.leanmuscle.boji.feature.membership

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.FilterQuality
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.membership.AccountMessage
import club.leanmuscle.boji.core.membership.MembershipCode
import club.leanmuscle.boji.ui.components.FootNote
import com.google.zxing.BarcodeFormat
import com.google.zxing.EncodeHintType
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel
import kotlinx.coroutines.delay
import java.time.Instant

const val MEMBERSHIP_CODE_SHEET_TAG = "membership_code_sheet"
const val MEMBERSHIP_CODE_IMAGE_TAG = "membership_code_image"
const val MEMBERSHIP_CODE_NUMBER_TAG = "membership_code_number"

/**
 * The dynamic member code, as on iOS. The QR code holds a TOTP value that changes every period, so
 * staff with the verify permission can tell a live code from a screenshot. The member number shows
 * as the server sent it.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MembershipCodeSheet(
    code: MembershipCode?,
    memberNumber: String,
    busy: Boolean,
    message: AccountMessage?,
    onRetry: () -> Unit,
    onDismiss: () -> Unit,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState, modifier = Modifier.testTag(MEMBERSHIP_CODE_SHEET_TAG)) {
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
                stringResource(R.string.membership_code_title),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.fillMaxWidth().semantics { heading() },
            )
            when {
                code != null -> CodeContent(code, memberNumber)
                busy -> CircularProgressIndicator(Modifier.padding(vertical = 48.dp))
                else -> {
                    Text(
                        message?.let { accountMessageText(it) } ?: stringResource(R.string.membership_code_unavailable),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    OutlinedButton(onClick = onRetry) { Text(stringResource(R.string.action_retry)) }
                }
            }
            Spacer(Modifier.height(8.dp))
        }
    }
}

@Composable
private fun CodeContent(code: MembershipCode, memberNumber: String) {
    var now by remember { mutableStateOf(Instant.now()) }
    LaunchedEffect(code) {
        while (true) {
            now = Instant.now()
            // Wake at the next full second, so that the countdown and the step change on time.
            delay(MILLIS_PER_SECOND - System.currentTimeMillis() % MILLIS_PER_SECOND)
        }
    }
    val step = code.step(now)
    // Encode once per time step, not once per second.
    val image = remember(code, step) { qrImage(code.dynamicValue(now)) }
    val title = stringResource(R.string.membership_code_title)
    Image(
        bitmap = image,
        contentDescription = title,
        filterQuality = FilterQuality.None,
        modifier = Modifier
            .widthIn(max = 300.dp)
            .fillMaxWidth()
            .aspectRatio(1f)
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .testTag(MEMBERSHIP_CODE_IMAGE_TAG),
    )
    val seconds = code.secondsRemaining(now)
    Text(
        pluralStringResource(R.plurals.membership_code_refresh, seconds, seconds),
        style = MaterialTheme.typography.labelLarge,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(
            stringResource(R.string.membership_code_card_number),
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        // Opaque: shown exactly as the server sent it.
        Text(
            memberNumber,
            style = MaterialTheme.typography.titleMedium,
            fontFamily = FontFamily.Monospace,
            modifier = Modifier.testTag(MEMBERSHIP_CODE_NUMBER_TAG),
        )
    }
    FootNote(stringResource(R.string.membership_code_hint))
}

/**
 * Encodes [content] as a QR code with error correction level M, as on iOS. One pixel per module,
 * with the quiet zone of the QR specification. The caller scales it up without filtering.
 */
private fun qrImage(content: String): ImageBitmap {
    val hints = mapOf(
        EncodeHintType.ERROR_CORRECTION to ErrorCorrectionLevel.M,
        EncodeHintType.CHARACTER_SET to Charsets.UTF_8.name(),
    )
    val matrix = QRCodeWriter().encode(content, BarcodeFormat.QR_CODE, 0, 0, hints)
    val pixels = IntArray(matrix.width * matrix.height) { index ->
        if (matrix.get(index % matrix.width, index / matrix.width)) BLACK else WHITE
    }
    return Bitmap.createBitmap(pixels, matrix.width, matrix.height, Bitmap.Config.ARGB_8888).asImageBitmap()
}

private const val MILLIS_PER_SECOND = 1_000L
private const val BLACK = 0xFF000000.toInt()
private const val WHITE = 0xFFFFFFFF.toInt()
