package club.leanmuscle.boji.feature.membership

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.DrawableRes
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.view.CameraController
import androidx.camera.view.LifecycleCameraController
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.membership.MembershipVerification
import club.leanmuscle.boji.core.membership.ScanOutcome
import club.leanmuscle.boji.ui.theme.LocalBojiColors
import com.google.zxing.BinaryBitmap
import com.google.zxing.DecodeHintType
import com.google.zxing.PlanarYUVLuminanceSource
import com.google.zxing.ReaderException
import com.google.zxing.common.HybridBinarizer
import com.google.zxing.qrcode.QRCodeReader
import java.util.concurrent.Executor
import java.util.concurrent.Executors

const val MEMBERSHIP_SCAN_SHEET_TAG = "membership_scan_sheet"
const val MEMBERSHIP_SCAN_MANUAL_TAG = "membership_scan_manual"
const val MEMBERSHIP_SCAN_SUBMIT_TAG = "membership_scan_submit"
const val MEMBERSHIP_SCAN_RESULT_TAG = "membership_scan_result"
const val MEMBERSHIP_SCAN_NEXT_TAG = "membership_scan_next"

/**
 * The staff scanner, as on iOS. The camera frames go to ZXing on the device, and only the decoded
 * text goes to bizserver, which checks the code and the operator role. The sheet keeps no frames and
 * no results; [ScanOutcome] lives in memory in `MembershipVerifier`.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MembershipScanSheet(
    outcome: ScanOutcome?,
    verifying: Boolean,
    onVerify: (String) -> Unit,
    onNext: () -> Unit,
    onDismiss: () -> Unit,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val haptics = LocalHapticFeedback.current
    LaunchedEffect(outcome) {
        val type = when (outcome) {
            null -> return@LaunchedEffect
            is ScanOutcome.Verified ->
                if (outcome.standing == MembershipVerification.Standing.VALID) HapticFeedbackType.Confirm else HapticFeedbackType.Reject
            is ScanOutcome.Failed -> HapticFeedbackType.Reject
        }
        haptics.performHapticFeedback(type)
    }
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState, modifier = Modifier.testTag(MEMBERSHIP_SCAN_SHEET_TAG)) {
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
                stringResource(R.string.membership_scan_title),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.fillMaxWidth().semantics { heading() },
            )
            Viewfinder(paused = outcome != null || verifying, onValue = onVerify)
            when {
                outcome != null -> ScanResult(outcome, onNext)
                verifying -> CircularProgressIndicator(Modifier.padding(vertical = 16.dp))
            }
            ManualEntry(outcome = outcome, verifying = verifying, onVerify = onVerify)
            Spacer(Modifier.height(8.dp))
        }
    }
}

private enum class CameraAccess { PENDING, READY, DENIED, UNAVAILABLE }

@Composable
private fun Viewfinder(paused: Boolean, onValue: (String) -> Unit) {
    val context = LocalContext.current
    var access by remember { mutableStateOf(initialAccess(context)) }
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        access = if (granted) CameraAccess.READY else CameraAccess.DENIED
    }
    // Ask only when the scanner opens, not at app start.
    LaunchedEffect(Unit) {
        if (access == CameraAccess.PENDING) launcher.launch(Manifest.permission.CAMERA)
    }
    val hint = stringResource(R.string.membership_scan_hint)
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Box(
            modifier = Modifier
                .widthIn(max = 360.dp)
                .fillMaxWidth()
                .aspectRatio(1f)
                .clip(RoundedCornerShape(20.dp))
                .background(MaterialTheme.colorScheme.surfaceContainerHighest),
            contentAlignment = Alignment.Center,
        ) {
            when (access) {
                CameraAccess.READY -> CameraPreview(
                    paused = paused,
                    onValue = onValue,
                    onUnavailable = { access = CameraAccess.UNAVAILABLE },
                    modifier = Modifier.fillMaxSize().semantics { contentDescription = hint },
                )
                CameraAccess.PENDING -> CircularProgressIndicator()
                CameraAccess.DENIED -> CameraMessage(stringResource(R.string.membership_scan_camera_denied))
                CameraAccess.UNAVAILABLE -> CameraMessage(stringResource(R.string.membership_scan_camera_unavailable))
            }
        }
        if (access == CameraAccess.READY) {
            Text(
                hint,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )
        }
    }
}

private fun initialAccess(context: Context): CameraAccess = when {
    !context.packageManager.hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY) -> CameraAccess.UNAVAILABLE
    ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED -> CameraAccess.READY
    else -> CameraAccess.PENDING
}

@Composable
private fun CameraMessage(text: String) {
    Column(
        modifier = Modifier.padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Icon(
            painterResource(R.drawable.ic_qr_code),
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.size(40.dp),
        )
        Text(text, style = MaterialTheme.typography.bodyMedium, textAlign = TextAlign.Center)
    }
}

/** The back camera, or the front camera on a device without one. Frames go to [QrAnalyzer] only. */
@Composable
private fun CameraPreview(paused: Boolean, onValue: (String) -> Unit, onUnavailable: () -> Unit, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val currentOnValue by rememberUpdatedState(onValue)
    val currentOnUnavailable by rememberUpdatedState(onUnavailable)
    val analyzer = remember { QrAnalyzer(ContextCompat.getMainExecutor(context)) { currentOnValue(it) } }
    analyzer.paused = paused
    val controller = remember { LifecycleCameraController(context) }
    DisposableEffect(lifecycleOwner, controller) {
        val executor = Executors.newSingleThreadExecutor()
        // Preview and analysis only. The scanner never takes a photo.
        controller.setEnabledUseCases(CameraController.IMAGE_ANALYSIS)
        controller.imageAnalysisBackpressureStrategy = ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST
        controller.setImageAnalysisAnalyzer(executor, analyzer)
        controller.initializationFuture.addListener(
            {
                val ready = runCatching { controller.initializationFuture.get() }.isSuccess
                when {
                    !ready -> currentOnUnavailable()
                    controller.hasCamera(CameraSelector.DEFAULT_BACK_CAMERA) -> Unit
                    controller.hasCamera(CameraSelector.DEFAULT_FRONT_CAMERA) ->
                        controller.cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA
                    else -> currentOnUnavailable()
                }
            },
            ContextCompat.getMainExecutor(context),
        )
        controller.bindToLifecycle(lifecycleOwner)
        onDispose {
            controller.unbind()
            controller.clearImageAnalysisAnalyzer()
            executor.shutdown()
        }
    }
    AndroidView(
        factory = { viewContext ->
            PreviewView(viewContext).apply {
                // TextureView, so that the preview follows the rounded clip of the sheet.
                implementationMode = PreviewView.ImplementationMode.COMPATIBLE
                scaleType = PreviewView.ScaleType.FILL_CENTER
                this.controller = controller
            }
        },
        modifier = modifier,
    )
}

/**
 * Decodes QR codes from the luminance plane of each frame. The camera sees the same code in many
 * frames, so a value is sent again only after it was out of view for [REPEAT_MILLIS]. While [paused],
 * frames still update that record but send nothing.
 */
private class QrAnalyzer(private val main: Executor, private val onValue: (String) -> Unit) : ImageAnalysis.Analyzer {
    @Volatile var paused = false

    private val reader = QRCodeReader()
    private val hints = mapOf(DecodeHintType.CHARACTER_SET to Charsets.UTF_8.name())
    private var luminance = ByteArray(0)
    private var lastValue: String? = null
    private var lastSeen = 0L

    override fun analyze(image: ImageProxy) {
        val value = try {
            decode(image)
        } finally {
            image.close()
        }
        if (value.isNullOrBlank()) return
        val now = System.currentTimeMillis()
        val repeat = value == lastValue && now - lastSeen < REPEAT_MILLIS
        lastValue = value
        lastSeen = now
        if (!repeat && !paused) main.execute { onValue(value) }
    }

    private fun decode(image: ImageProxy): String? {
        val plane = image.planes.firstOrNull() ?: return null
        val rowStride = plane.rowStride
        val size = rowStride * image.height
        if (luminance.size != size) luminance = ByteArray(size)
        val buffer = plane.buffer
        buffer.rewind()
        buffer.get(luminance, 0, minOf(buffer.remaining(), size))
        val source = PlanarYUVLuminanceSource(luminance, rowStride, image.height, 0, 0, image.width, image.height, false)
        return try {
            reader.decode(BinaryBitmap(HybridBinarizer(source)), hints).text
        } catch (_: ReaderException) {
            null
        } finally {
            reader.reset()
        }
    }

    private companion object {
        const val REPEAT_MILLIS = 1_500L
    }
}

@Composable
private fun ManualEntry(outcome: ScanOutcome?, verifying: Boolean, onVerify: (String) -> Unit) {
    var code by rememberSaveable { mutableStateOf("") }
    val keyboard = LocalSoftwareKeyboardController.current
    // Clear the field after a card is found. On a failure keep it, so that staff can fix a typo.
    LaunchedEffect(outcome) {
        if (outcome is ScanOutcome.Verified) code = ""
    }
    val canSubmit = code.isNotBlank() && !verifying && outcome == null
    val submit = {
        if (canSubmit) {
            keyboard?.hide()
            onVerify(code)
        }
    }
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        OutlinedTextField(
            value = code,
            onValueChange = { code = it },
            label = { Text(stringResource(R.string.membership_scan_manual_placeholder)) },
            singleLine = true,
            textStyle = MaterialTheme.typography.bodyLarge.copy(fontFamily = FontFamily.Monospace),
            keyboardOptions = KeyboardOptions(
                capitalization = KeyboardCapitalization.None,
                autoCorrectEnabled = false,
                keyboardType = KeyboardType.Ascii,
                imeAction = ImeAction.Go,
            ),
            keyboardActions = KeyboardActions(onGo = { submit() }),
            modifier = Modifier.weight(1f).testTag(MEMBERSHIP_SCAN_MANUAL_TAG),
        )
        OutlinedButton(onClick = submit, enabled = canSubmit, modifier = Modifier.testTag(MEMBERSHIP_SCAN_SUBMIT_TAG)) {
            Text(stringResource(R.string.membership_scan_manual_submit))
        }
    }
}

/** One result: the card state, the member number, the nickname and where the code came from. */
@Composable
private fun ScanResult(outcome: ScanOutcome, onNext: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .testTag(MEMBERSHIP_SCAN_RESULT_TAG)
            .semantics { liveRegion = LiveRegionMode.Polite },
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surfaceContainerHigh,
    ) {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            when (outcome) {
                is ScanOutcome.Verified -> VerifiedContent(outcome)
                is ScanOutcome.Failed -> StatusRow(
                    icon = R.drawable.ic_close,
                    tint = LocalBojiColors.current.error,
                    text = stringResource(outcome.problem.messageRes()),
                )
            }
            Button(onClick = onNext, modifier = Modifier.fillMaxWidth().testTag(MEMBERSHIP_SCAN_NEXT_TAG)) {
                Text(stringResource(R.string.membership_scan_next))
            }
        }
    }
}

@Composable
private fun VerifiedContent(outcome: ScanOutcome.Verified) {
    val card = outcome.verification.card
    val valid = outcome.standing == MembershipVerification.Standing.VALID
    StatusRow(
        icon = if (valid) R.drawable.ic_verified else R.drawable.ic_pause_circle,
        tint = if (valid) LocalBojiColors.current.calm else MaterialTheme.colorScheme.tertiary,
        text = stringResource(outcome.standing.titleRes()),
    )
    ResultField(stringResource(R.string.membership_code_card_number)) {
        // Opaque: shown exactly as the server sent it.
        SelectionContainer {
            Text(card.memberNumber, style = MaterialTheme.typography.titleMedium, fontFamily = FontFamily.Monospace)
        }
    }
    ResultField(stringResource(R.string.membership_scan_nickname)) {
        Text(card.nickname, style = MaterialTheme.typography.titleMedium)
    }
    when (outcome.verification.kind) {
        MembershipVerification.Kind.APP -> Text(
            stringResource(R.string.membership_scan_kind_dynamic),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        // A static code can be a screenshot, so staff compare the person as well.
        MembershipVerification.Kind.WALLET_PASS -> Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Icon(
                painterResource(R.drawable.ic_card_membership),
                contentDescription = null,
                tint = MaterialTheme.colorScheme.tertiary,
                modifier = Modifier.size(18.dp),
            )
            Text(
                stringResource(R.string.membership_scan_kind_static),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.tertiary,
            )
        }
    }
}

@Composable
private fun StatusRow(@DrawableRes icon: Int, tint: Color, text: String) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(painterResource(icon), contentDescription = null, tint = tint, modifier = Modifier.size(28.dp))
        Text(text, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun ResultField(label: String, value: @Composable () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        value()
    }
}
