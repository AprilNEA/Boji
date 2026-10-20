package club.leanmuscle.boji.core.auth

import java.security.GeneralSecurityException

/**
 * A [DataCipher] for JVM tests, where the Android Keystore does not exist. It is not secure.
 *
 * Like AES-GCM, it rejects data that was changed and data of another purpose (associated data).
 * It also changes every byte, so that a test can check that the file holds no plaintext.
 */
class TestCipher : DataCipher {

    override fun encrypt(plaintext: ByteArray, associatedData: ByteArray): ByteArray =
        byteArrayOf(MAGIC, associatedData.size.toByte()) + associatedData + plaintext.masked() + checksum(plaintext)

    override fun decrypt(ciphertext: ByteArray, associatedData: ByteArray): ByteArray {
        if (ciphertext.size < 2 || ciphertext[0] != MAGIC) throw GeneralSecurityException("Unknown format")
        val aadSize = ciphertext[1].toInt() and 0xFF
        val bodyStart = 2 + aadSize
        if (ciphertext.size < bodyStart + 1) throw GeneralSecurityException("Truncated")
        val storedAad = ciphertext.copyOfRange(2, bodyStart)
        if (!storedAad.contentEquals(associatedData)) throw GeneralSecurityException("Associated data does not match")
        val plaintext = ciphertext.copyOfRange(bodyStart, ciphertext.size - 1).masked()
        if (checksum(plaintext) != ciphertext.last()) throw GeneralSecurityException("Tag does not match")
        return plaintext
    }

    private fun ByteArray.masked(): ByteArray = ByteArray(size) { (this[it].toInt() xor MASK).toByte() }

    private fun checksum(bytes: ByteArray): Byte = bytes.fold(0) { sum, byte -> (sum * 31 + byte) and 0xFF }.toByte()

    private companion object {
        const val MAGIC: Byte = 0x7A
        const val MASK = 0x5A
    }
}
