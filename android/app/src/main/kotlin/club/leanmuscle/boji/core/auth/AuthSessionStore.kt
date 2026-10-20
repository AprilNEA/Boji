package club.leanmuscle.boji.core.auth

import androidx.datastore.core.DataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.serialization.Serializable
import java.io.IOException

/**
 * The signed-in account on this device. [origin] is the member service that issued [token]; a build
 * that points at another server ignores the session.
 */
@Serializable
data class StoredSession(
    val origin: String,
    val token: String,
    val userId: String,
    val email: String,
    val name: String,
    val emailVerified: Boolean,
    val createdAtMillis: Long? = null,
    val expiresAtMillis: Long? = null,
)

/** File content of the session store. */
@Serializable
data class AuthState(val session: StoredSession? = null)

/**
 * The Better Auth session token and account summary, encrypted with a Keystore key
 * ([EncryptedJsonSerializer]). The file is app-private and excluded from backup and device transfer.
 * Data export never includes it.
 */
class AuthSessionStore(private val dataStore: DataStore<AuthState>) {

    /** Emits null when signed out or when the file cannot be read. */
    val session: Flow<StoredSession?> = dataStore.data
        .map { it.session }
        .catch { error -> if (error is IOException) emit(null) else throw error }

    suspend fun current(): StoredSession? = session.first()

    /** @throws IOException or a Keystore exception when the file cannot be written. */
    suspend fun save(session: StoredSession) {
        dataStore.updateData { AuthState(session) }
    }

    /** @throws IOException when the file cannot be written. */
    suspend fun clear() {
        dataStore.updateData { AuthState() }
    }

    companion object {
        const val FILE_NAME = "auth_session.enc"
        const val PURPOSE = "club.leanmuscle.boji/auth-session/v1"
        const val KEY_ALIAS = "boji.local-data.v1"
    }
}
