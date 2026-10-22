package club.leanmuscle.boji.feature.training

import java.io.File
import java.nio.file.Files
import java.security.MessageDigest
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class RemoteExerciseAnimationStoreTest {
    private val baseUrl = "https://fixture.invalid/animations/"
    private val validator = ExerciseAnimationValidator { _, _ -> true }

    @Test
    fun remoteIndexRejectsBadHashesAndIgnoresUnknownFields() {
        val bytes = "valid-animation".encodeToByteArray()
        val valid = index(bytes, future = ",\"future\":true")
        assertEquals(setOf("push-up"), parseRemoteExerciseAnimationIndex(valid).keys)
        assertTrue(parseRemoteExerciseAnimationIndex(valid.replace(hash(bytes), "not-a-hash")).isEmpty())
        assertTrue(parseRemoteExerciseAnimationIndex(valid.replace("\"sha256\"", "\"missing\"")).isEmpty())
    }

    @Test
    fun hashMismatchIsDiscarded() = runBlocking {
        val root = temporaryRoot()
        try {
            val expected = "expected".encodeToByteArray()
            val transport = FakeTransport().apply {
                replies[baseUrl + EXERCISE_ANIMATION_INDEX] = ExerciseAnimationHttpResponse(200, index(expected).encodeToByteArray(), "v1")
                replies[baseUrl + "light/push-up.json"] = ExerciseAnimationHttpResponse(200, "wrong".encodeToByteArray())
                replies[baseUrl + "dark/push-up.json"] = ExerciseAnimationHttpResponse(200, expected)
            }
            val store = RemoteExerciseAnimationStore(root, baseUrl, transport, validator)
            assertEquals(RemoteAnimationPrefetchResult.Unavailable, store.prefetch(listOf("push-up"), emptySet()))
            assertNull(store.cachedAnimation("push-up", ExerciseAnimationPalette.Light))
        } finally {
            root.deleteRecursively()
        }
    }

    @Test
    fun etag304ReusesTheStoredIndex() = runBlocking {
        val root = temporaryRoot()
        try {
            val bytes = "same".encodeToByteArray()
            val first = FakeTransport().apply {
                replies[baseUrl + EXERCISE_ANIMATION_INDEX] = ExerciseAnimationHttpResponse(200, index(bytes).encodeToByteArray(), "cache-v1")
                paletteReplies(bytes)
            }
            assertEquals(RemoteAnimationPrefetchResult.Complete, RemoteExerciseAnimationStore(root, baseUrl, first, validator).prefetch(listOf("push-up"), emptySet()))
            val second = FakeTransport().apply {
                replies[baseUrl + EXERCISE_ANIMATION_INDEX] = ExerciseAnimationHttpResponse(304)
            }
            assertEquals(RemoteAnimationPrefetchResult.Complete, RemoteExerciseAnimationStore(root, baseUrl, second, validator).prefetch(listOf("push-up"), emptySet()))
            assertEquals("cache-v1", second.requests.single().ifNoneMatch)
        } finally {
            root.deleteRecursively()
        }
    }

    @Test
    fun offlineUsesStoredIndexAndVerifiedCachedFiles() = runBlocking {
        val root = temporaryRoot()
        try {
            val bytes = "offline".encodeToByteArray()
            val online = FakeTransport().apply {
                replies[baseUrl + EXERCISE_ANIMATION_INDEX] = ExerciseAnimationHttpResponse(200, index(bytes).encodeToByteArray(), "v1")
                paletteReplies(bytes)
            }
            RemoteExerciseAnimationStore(root, baseUrl, online, validator).prefetch(listOf("push-up"), emptySet())
            val offline = FakeTransport().apply { throwOnGet = true }
            val store = RemoteExerciseAnimationStore(root, baseUrl, offline, validator)
            assertEquals(RemoteAnimationPrefetchResult.Complete, store.prefetch(listOf("push-up"), emptySet()))
            assertTrue(store.cachedAnimation("push-up", ExerciseAnimationPalette.Dark)?.file?.isFile == true)
        } finally {
            root.deleteRecursively()
        }
    }

    @Test
    fun bundledExercisesNeverHitTheNetwork() = runBlocking {
        val root = temporaryRoot()
        try {
            val transport = FakeTransport()
            val store = RemoteExerciseAnimationStore(root, baseUrl, transport, validator)
            assertEquals(RemoteAnimationPrefetchResult.Complete, store.prefetch(listOf("plank"), setOf("plank")))
            assertTrue(transport.requests.isEmpty())
        } finally {
            root.deleteRecursively()
        }
    }

    @Test
    fun newHashReplacesTheOldPaletteCache() = runBlocking {
        val root = temporaryRoot()
        try {
            val old = "old-animation".encodeToByteArray()
            val first = FakeTransport().apply {
                replies[baseUrl + EXERCISE_ANIMATION_INDEX] = ExerciseAnimationHttpResponse(200, index(old).encodeToByteArray(), "v1")
                paletteReplies(old)
            }
            RemoteExerciseAnimationStore(root, baseUrl, first, validator).prefetch(listOf("push-up"), emptySet())
            val newer = "new-animation".encodeToByteArray()
            val second = FakeTransport().apply {
                replies[baseUrl + EXERCISE_ANIMATION_INDEX] = ExerciseAnimationHttpResponse(200, index(newer).encodeToByteArray(), "v2")
                paletteReplies(newer)
            }
            val store = RemoteExerciseAnimationStore(root, baseUrl, second, validator)
            assertEquals(RemoteAnimationPrefetchResult.Complete, store.prefetch(listOf("push-up"), emptySet()))
            val files = File(root, "push-up").listFiles()?.map(File::getName).orEmpty()
            assertEquals(setOf("light-${hash(newer)}.json", "dark-${hash(newer)}.json"), files.toSet())
        } finally {
            root.deleteRecursively()
        }
    }

    private fun FakeTransport.paletteReplies(bytes: ByteArray) {
        replies[baseUrl + "light/push-up.json"] = ExerciseAnimationHttpResponse(200, bytes)
        replies[baseUrl + "dark/push-up.json"] = ExerciseAnimationHttpResponse(200, bytes)
    }

    private fun index(bytes: ByteArray, future: String = ""): String {
        val hash = hash(bytes)
        return """[{"id":"push-up","seconds":3.0,"frames":30,"posterFrame":5,"fps":30.0,"files":{"light":"light/push-up.json","dark":"dark/push-up.json"},"sha256":{"light":"$hash","dark":"$hash"}$future}]"""
    }

    private fun hash(bytes: ByteArray): String = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }

    private fun temporaryRoot(): File = Files.createTempDirectory("boji-animations-").toFile()

    private class FakeTransport : ExerciseAnimationTransport {
        data class Request(val url: String, val ifNoneMatch: String?)
        val replies = mutableMapOf<String, ExerciseAnimationHttpResponse>()
        val requests = mutableListOf<Request>()
        var throwOnGet = false

        override suspend fun get(url: String, ifNoneMatch: String?): ExerciseAnimationHttpResponse {
            requests += Request(url, ifNoneMatch)
            if (throwOnGet) error("offline")
            return replies[url] ?: ExerciseAnimationHttpResponse(404)
        }
    }
}
