package club.leanmuscle.boji.feature.membership

import android.content.Context
import android.util.Base64
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import java.security.SecureRandom

/** The outcome of the Google account picker. */
sealed interface GoogleSignInResult {
    data class Token(val idToken: String) : GoogleSignInResult

    /** The user closed the picker. The screen shows nothing. */
    data object Cancelled : GoogleSignInResult

    /** The device has no Google account that can sign in. */
    data object NoAccount : GoogleSignInResult

    data object Failed : GoogleSignInResult
}

/**
 * Sign in with Google through Credential Manager. The ID token is requested for the Web client ID
 * that bizserver trusts, with a fresh nonce that the server checks against the token.
 *
 * [context] must be an Activity context, because Credential Manager shows system UI.
 */
class GoogleCredentials(private val context: Context) {
    private val manager = CredentialManager.create(context)

    suspend fun signIn(serverClientId: String, nonce: String): GoogleSignInResult {
        // The "Sign in with Google" button flow: it always shows the account picker, including the
        // option to add an account, unlike the bottom sheet of GetGoogleIdOption.
        val option = GetSignInWithGoogleOption.Builder(serverClientId).setNonce(nonce).build()
        return try {
            val credential = manager.getCredential(context, GetCredentialRequest(listOf(option))).credential
            if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                GoogleSignInResult.Token(GoogleIdTokenCredential.createFrom(credential.data).idToken)
            } else {
                GoogleSignInResult.Failed
            }
        } catch (e: GetCredentialCancellationException) {
            GoogleSignInResult.Cancelled
        } catch (e: NoCredentialException) {
            GoogleSignInResult.NoAccount
        } catch (e: GetCredentialException) {
            GoogleSignInResult.Failed
        } catch (e: GoogleIdTokenParsingException) {
            GoogleSignInResult.Failed
        }
    }

    companion object {
        /** 32 random bytes in base64url. Google copies the value into the `nonce` claim. */
        fun newNonce(): String {
            val bytes = ByteArray(32).also(SecureRandom()::nextBytes)
            return Base64.encodeToString(bytes, Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP)
        }
    }
}

@Composable
fun rememberGoogleCredentials(): GoogleCredentials {
    val context = LocalContext.current
    return remember(context) { GoogleCredentials(context) }
}
