package club.leanmuscle.boji.feature.membership

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import androidx.credentials.CreatePasswordRequest
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetPasswordOption
import androidx.credentials.PasswordCredential
import androidx.credentials.exceptions.CreateCredentialException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException

/**
 * Email and password credentials through Credential Manager. The server supports only email and
 * password for now, so there is no passkey or Google option. Failures and cancellation are silent:
 * the user can always type the password.
 *
 * [context] must be an Activity context, because Credential Manager shows system UI.
 */
class PasswordCredentials(private val context: Context) {
    private val manager = CredentialManager.create(context)

    /** Lets the user pick a saved password. Returns null when there is none or the user cancels. */
    suspend fun pick(): PasswordCredential? = try {
        val response = manager.getCredential(context, GetCredentialRequest(listOf(GetPasswordOption())))
        response.credential as? PasswordCredential
    } catch (e: NoCredentialException) {
        // No saved password for this app. The screen stays as it is, without a message.
        null
    } catch (e: GetCredentialException) {
        null
    }

    /** Offers to save the password. The system decides whether to show a prompt. */
    suspend fun save(email: String, password: String) {
        try {
            manager.createCredential(context, CreatePasswordRequest(id = email.trim(), password = password))
        } catch (e: CreateCredentialException) {
            // Cancelled, or no provider. Nothing to do.
        }
    }
}

@Composable
fun rememberPasswordCredentials(): PasswordCredentials {
    val context = LocalContext.current
    return remember(context) { PasswordCredentials(context) }
}
