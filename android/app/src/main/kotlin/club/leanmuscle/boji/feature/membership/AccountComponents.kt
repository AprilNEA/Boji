package club.leanmuscle.boji.feature.membership

import androidx.annotation.DrawableRes
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.autofill.ContentType
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentType
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import club.leanmuscle.boji.R
import club.leanmuscle.boji.core.membership.AccountMessage

const val ACCOUNT_MESSAGE_TAG = "account_message"

/** The result of the last operation. Screen readers announce it when it appears. */
@Composable
fun AccountMessageCard(message: AccountMessage?, modifier: Modifier = Modifier) {
    if (message == null) return
    val colors = MaterialTheme.colorScheme
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .testTag(ACCOUNT_MESSAGE_TAG)
            .semantics { liveRegion = LiveRegionMode.Polite },
        shape = RoundedCornerShape(18.dp),
        color = if (message.isError) colors.errorContainer else colors.secondaryContainer,
        contentColor = if (message.isError) colors.onErrorContainer else colors.onSecondaryContainer,
    ) {
        Row(Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Icon(
                painterResource(if (message.isError) R.drawable.ic_health_and_safety else R.drawable.ic_check_circle),
                contentDescription = null,
                modifier = Modifier.size(20.dp),
            )
            Text(accountMessageText(message), style = MaterialTheme.typography.bodyMedium)
        }
    }
}

enum class FieldKind(val contentType: ContentType?, val keyboardType: KeyboardType) {
    NAME(ContentType.PersonFullName, KeyboardType.Text),
    EMAIL(ContentType.EmailAddress + ContentType.Username, KeyboardType.Email),
    PASSWORD(ContentType.Password, KeyboardType.Password),
    NEW_PASSWORD(ContentType.NewPassword, KeyboardType.Password),
    NICKNAME(null, KeyboardType.Text),

    /** A confirmation code pasted from an email. */
    CODE(null, KeyboardType.Ascii),
}

/** Text field with the autofill type, so password managers can fill and save it. */
@Composable
fun AccountField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    kind: FieldKind,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    supportingText: String? = null,
    isError: Boolean = false,
    imeAction: ImeAction = ImeAction.Next,
    onDone: () -> Unit = {},
) {
    val secret = kind == FieldKind.PASSWORD || kind == FieldKind.NEW_PASSWORD
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        modifier = modifier
            .fillMaxWidth()
            .semantics { kind.contentType?.let { contentType = it } },
        enabled = enabled,
        singleLine = true,
        isError = isError,
        supportingText = supportingText?.let { { Text(it) } },
        visualTransformation = if (secret) PasswordVisualTransformation() else VisualTransformation.None,
        keyboardOptions = KeyboardOptions(
            keyboardType = kind.keyboardType,
            imeAction = imeAction,
            autoCorrectEnabled = !secret && kind != FieldKind.EMAIL && kind != FieldKind.CODE,
        ),
        keyboardActions = KeyboardActions(onDone = { onDone() }),
    )
}

/** Filled button that shows a spinner and [busyText] while an operation runs. */
@Composable
fun ProgressButton(
    text: String,
    busyText: String,
    busy: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    Button(
        onClick = onClick,
        enabled = enabled && !busy,
        modifier = modifier.fillMaxWidth().heightIn(min = 56.dp),
    ) {
        if (busy) {
            CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
            Text(busyText, modifier = Modifier.padding(start = 12.dp))
        } else {
            Text(text, style = MaterialTheme.typography.titleMedium)
        }
    }
}

/** Label and value on one line, as in a grouped iOS list. */
@Composable
fun InfoRow(label: String, value: String, modifier: Modifier = Modifier, trailing: @Composable () -> Unit = {}) {
    Row(modifier = modifier.fillMaxWidth().heightIn(min = 44.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value, style = MaterialTheme.typography.bodyLarge)
        }
        trailing()
    }
}

/** Short point with an icon, for the benefits under the hero. */
@Composable
fun PointRow(@DrawableRes icon: Int, text: String, modifier: Modifier = Modifier) {
    Row(modifier = modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(painterResource(icon), contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
        Text(text, style = MaterialTheme.typography.bodyMedium)
    }
}
