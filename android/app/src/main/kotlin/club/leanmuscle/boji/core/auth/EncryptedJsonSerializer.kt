package club.leanmuscle.boji.core.auth

import androidx.datastore.core.CorruptionException
import androidx.datastore.core.Serializer
import kotlinx.serialization.KSerializer
import kotlinx.serialization.json.Json
import java.io.InputStream
import java.io.OutputStream
import java.security.GeneralSecurityException

/**
 * DataStore serializer that stores a value as encrypted JSON. An empty value writes an empty file,
 * so signing out leaves no ciphertext behind.
 *
 * A file that fails to decrypt or decode raises [CorruptionException]. The DataStore corruption
 * handler then replaces it with [defaultValue], which means "signed out" or "no cache".
 */
class EncryptedJsonSerializer<T>(
    private val serializer: KSerializer<T>,
    override val defaultValue: T,
    private val cipher: DataCipher,
    purpose: String,
    private val isEmpty: (T) -> Boolean,
) : Serializer<T> {

    private val associatedData = purpose.encodeToByteArray()

    override suspend fun readFrom(input: InputStream): T {
        val bytes = input.readBytes()
        if (bytes.isEmpty()) return defaultValue
        return try {
            val plaintext = cipher.decrypt(bytes, associatedData)
            json.decodeFromString(serializer, plaintext.decodeToString())
        } catch (e: GeneralSecurityException) {
            throw CorruptionException("Cannot decrypt the file", e)
        } catch (e: IllegalArgumentException) {
            // Includes SerializationException.
            throw CorruptionException("Cannot decode the file", e)
        }
    }

    override suspend fun writeTo(t: T, output: OutputStream) {
        if (isEmpty(t)) return
        val plaintext = json.encodeToString(serializer, t).encodeToByteArray()
        output.write(cipher.encrypt(plaintext, associatedData))
    }

    private companion object {
        val json = Json { ignoreUnknownKeys = true }
    }
}
