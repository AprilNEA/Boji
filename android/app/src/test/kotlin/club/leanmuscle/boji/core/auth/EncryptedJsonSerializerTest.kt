package club.leanmuscle.boji.core.auth

import androidx.datastore.core.CorruptionException
import androidx.datastore.core.DataStoreFactory
import androidx.datastore.core.handlers.ReplaceFileCorruptionHandler
import club.leanmuscle.boji.core.membership.MembershipCacheStore
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.nio.file.Files
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.job
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test

class EncryptedJsonSerializerTest {

    private lateinit var dir: File
    private val cipher = TestCipher()

    private val session = StoredSession(
        origin = "https://boji.example",
        token = "secret-token-value",
        userId = "user-1",
        email = "member@example.com",
        name = "小林",
        emailVerified = true,
        createdAtMillis = 1_760_000_000_000,
        expiresAtMillis = 1_770_000_000_000,
    )

    @Before
    fun setUp() {
        dir = Files.createTempDirectory("boji-auth").toFile()
    }

    @After
    fun tearDown() {
        dir.deleteRecursively()
    }

    private fun serializer(purpose: String = AuthSessionStore.PURPOSE) = EncryptedJsonSerializer(
        serializer = AuthState.serializer(),
        defaultValue = AuthState(),
        cipher = cipher,
        purpose = purpose,
        isEmpty = { it.session == null },
    )

    private suspend fun encode(state: AuthState, purpose: String = AuthSessionStore.PURPOSE): ByteArray =
        ByteArrayOutputStream().also { serializer(purpose).writeTo(state, it) }.toByteArray()

    private suspend fun decode(bytes: ByteArray, purpose: String = AuthSessionStore.PURPOSE): AuthState =
        serializer(purpose).readFrom(ByteArrayInputStream(bytes))

    @Test
    fun roundTripKeepsEveryField() = runTest {
        val bytes = encode(AuthState(session))
        assertEquals(AuthState(session), decode(bytes))
    }

    @Test
    fun fileDoesNotContainThePlaintext() = runTest {
        val text = encode(AuthState(session)).decodeToString()
        assertFalse(text.contains(session.token))
        assertFalse(text.contains(session.email))
    }

    @Test
    fun emptyValueWritesNoBytesAndReadsBack() = runTest {
        val bytes = encode(AuthState())
        assertEquals(0, bytes.size)
        assertEquals(AuthState(), decode(bytes))
    }

    @Test
    fun fileOfAnotherPurposeIsRejected() = runTest {
        // A card cache file moved to the session path must not decrypt as a session.
        val bytes = encode(AuthState(session), purpose = MembershipCacheStore.PURPOSE)
        assertCorrupt { decode(bytes, purpose = AuthSessionStore.PURPOSE) }
    }

    @Test
    fun changedOrUnknownBytesAreRejected() = runTest {
        val bytes = encode(AuthState(session))
        val changed = bytes.copyOf().also { it[it.size / 2] = (it[it.size / 2] + 1).toByte() }
        assertCorrupt { decode(changed) }
        assertCorrupt { decode(byteArrayOf(1, 2, 3)) }
    }

    @Test
    fun ciphertextOfInvalidJsonIsRejected() = runTest {
        val bytes = cipher.encrypt("{not json".encodeToByteArray(), AuthSessionStore.PURPOSE.encodeToByteArray())
        assertCorrupt { decode(bytes) }
    }

    @Test
    fun dataStoreReplacesAnUnreadableFileWithSignedOut() = runTest {
        val file = File(dir, AuthSessionStore.FILE_NAME)
        file.writeBytes(byteArrayOf(9, 9, 9, 9))
        val job = SupervisorJob(backgroundScope.coroutineContext.job)
        val store = AuthSessionStore(
            DataStoreFactory.create(
                serializer = serializer(),
                corruptionHandler = ReplaceFileCorruptionHandler { AuthState() },
                scope = CoroutineScope(Dispatchers.IO + job),
                produceFile = { file },
            ),
        )

        assertNull(store.current())
        // The handler wrote the empty value: no ciphertext is left behind.
        assertEquals(0L, file.length())

        store.save(session)
        assertTrue(file.length() > 0)
        assertEquals(session, store.current())

        store.clear()
        assertNull(store.current())
        assertArrayEquals(ByteArray(0), file.readBytes())
        job.cancelAndJoin()
    }

    private suspend fun assertCorrupt(block: suspend () -> Unit) {
        try {
            block()
            fail("Expected CorruptionException")
        } catch (expected: CorruptionException) {
            // The DataStore corruption handler turns this into the default value.
        }
    }
}
