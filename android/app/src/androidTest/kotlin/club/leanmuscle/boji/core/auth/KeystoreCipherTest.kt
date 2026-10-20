package club.leanmuscle.boji.core.auth

import androidx.test.ext.junit.runners.AndroidJUnit4
import java.security.GeneralSecurityException
import java.security.KeyStore
import org.junit.After
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.fail
import org.junit.Test
import org.junit.runner.RunWith

/** Runs against the real Android Keystore, which JVM tests cannot reach. */
@RunWith(AndroidJUnit4::class)
class KeystoreCipherTest {

    private val alias = "boji.cipher-test.v1"
    private val cipher = KeystoreCipher(alias)
    private val plaintext = """{"session":{"token":"secret-token"}}""".encodeToByteArray()
    private val purpose = AuthSessionStore.PURPOSE.encodeToByteArray()

    @After
    fun deleteKey() {
        KeyStore.getInstance("AndroidKeyStore").apply { load(null) }.deleteEntry(alias)
    }

    @Test
    fun roundTripWithTheVersionedFormat() {
        val sealed = cipher.encrypt(plaintext, purpose)

        assertEquals(1, sealed[0].toInt())
        assertEquals(12, sealed[1].toInt())
        // Version, IV length, 12-byte IV, ciphertext, 16-byte tag.
        assertEquals(2 + 12 + plaintext.size + 16, sealed.size)
        assertFalse(sealed.decodeToString().contains("secret-token"))
        assertArrayEquals(plaintext, cipher.decrypt(sealed, purpose))
    }

    @Test
    fun everyEncryptionUsesANewIv() {
        val first = cipher.encrypt(plaintext, purpose)
        val second = cipher.encrypt(plaintext, purpose)

        assertFalse(first.copyOfRange(2, 14).contentEquals(second.copyOfRange(2, 14)))
        assertArrayEquals(plaintext, cipher.decrypt(second, purpose))
    }

    @Test
    fun anotherPurposeOrChangedByteFailsTheTag() {
        val sealed = cipher.encrypt(plaintext, purpose)
        assertRejected { cipher.decrypt(sealed, MembershipCacheStoreTestPurpose) }

        val changed = sealed.copyOf().also { it[it.size - 1] = (it[it.size - 1] + 1).toByte() }
        assertRejected { cipher.decrypt(changed, purpose) }
        assertRejected { cipher.decrypt(byteArrayOf(2, 12) + sealed.copyOfRange(2, sealed.size), purpose) }
        assertRejected { cipher.decrypt(sealed.copyOfRange(0, 20), purpose) }
    }

    @Test
    fun dataFailsToDecryptAfterTheKeyIsDeleted() {
        // The system deletes the key when the app is uninstalled or its data is cleared.
        val sealed = cipher.encrypt(plaintext, purpose)
        deleteKey()

        assertRejected { cipher.decrypt(sealed, purpose) }
        // A new key is created on the next write.
        assertArrayEquals(plaintext, cipher.decrypt(cipher.encrypt(plaintext, purpose), purpose))
    }

    private fun assertRejected(block: () -> Unit) {
        try {
            block()
            fail("Expected GeneralSecurityException")
        } catch (expected: GeneralSecurityException) {
            // AEADBadTagException is a GeneralSecurityException.
        }
    }

    private companion object {
        val MembershipCacheStoreTestPurpose = "membership-cache".encodeToByteArray()
    }
}
