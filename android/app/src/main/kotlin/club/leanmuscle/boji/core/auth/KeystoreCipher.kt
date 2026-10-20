package club.leanmuscle.boji.core.auth

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.GeneralSecurityException
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/** Authenticated encryption for small files. Tests use an in-memory implementation. */
interface DataCipher {
    /** @param associatedData binds the ciphertext to one purpose, so that files cannot be swapped. */
    fun encrypt(plaintext: ByteArray, associatedData: ByteArray): ByteArray

    /** @throws GeneralSecurityException when the key is gone or the data was changed. */
    fun decrypt(ciphertext: ByteArray, associatedData: ByteArray): ByteArray
}

/**
 * AES-256-GCM with a non-exportable key in the Android Keystore. The key needs no user
 * authentication, so the app can restore the session at launch. The system deletes the key when the
 * app is uninstalled; the data then fails to decrypt and the app starts signed out.
 *
 * Format: version (1 byte), IV length (1 byte), IV, ciphertext with the 128-bit tag.
 */
class KeystoreCipher(private val keyAlias: String) : DataCipher {

    override fun encrypt(plaintext: ByteArray, associatedData: ByteArray): ByteArray {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, existingKey() ?: createKey())
        cipher.updateAAD(associatedData)
        val iv = cipher.iv
        val sealed = cipher.doFinal(plaintext)
        return byteArrayOf(FORMAT_VERSION, iv.size.toByte()) + iv + sealed
    }

    override fun decrypt(ciphertext: ByteArray, associatedData: ByteArray): ByteArray {
        if (ciphertext.size < HEADER_SIZE || ciphertext[0] != FORMAT_VERSION) {
            throw GeneralSecurityException("Unknown ciphertext format")
        }
        val ivSize = ciphertext[1].toInt()
        if (ivSize <= 0 || ciphertext.size < HEADER_SIZE + ivSize + TAG_BYTES) {
            throw GeneralSecurityException("Truncated ciphertext")
        }
        val key = existingKey() ?: throw GeneralSecurityException("The Keystore key is missing")
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(
            Cipher.DECRYPT_MODE,
            key,
            GCMParameterSpec(TAG_BYTES * Byte.SIZE_BITS, ciphertext, HEADER_SIZE, ivSize),
        )
        cipher.updateAAD(associatedData)
        val offset = HEADER_SIZE + ivSize
        return cipher.doFinal(ciphertext, offset, ciphertext.size - offset)
    }

    @Synchronized
    private fun existingKey(): SecretKey? {
        val store = KeyStore.getInstance(KEYSTORE).apply { load(null) }
        return store.getKey(keyAlias, null) as? SecretKey
    }

    @Synchronized
    private fun createKey(): SecretKey {
        existingKey()?.let { return it }
        val spec = KeyGenParameterSpec.Builder(
            keyAlias,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(KEY_BITS)
            .setRandomizedEncryptionRequired(true)
            .build()
        return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE)
            .apply { init(spec) }
            .generateKey()
    }

    private companion object {
        const val KEYSTORE = "AndroidKeyStore"
        const val TRANSFORMATION = "AES/GCM/NoPadding"
        const val KEY_BITS = 256
        const val TAG_BYTES = 16
        const val FORMAT_VERSION: Byte = 1
        const val HEADER_SIZE = 2
    }
}
