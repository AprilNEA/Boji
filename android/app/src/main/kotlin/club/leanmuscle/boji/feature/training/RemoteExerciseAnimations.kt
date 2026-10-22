package club.leanmuscle.boji.feature.training

import android.content.Context
import androidx.annotation.VisibleForTesting
import club.leanmuscle.boji.core.di.AssetAnimationClient
import club.leanmuscle.boji.core.di.ExerciseAnimationBaseUrl
import com.airbnb.lottie.LottieCompositionFactory
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.File
import java.io.IOException
import java.nio.file.Files
import java.nio.file.StandardCopyOption
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import okhttp3.Request
import okhttp3.OkHttpClient

/** Production asset host. Release builds use this HTTPS endpoint only. */
const val EXERCISE_ANIMATION_BASE_URL = "https://assets.leanmuscle.club/animations/exercises/v1/"

/** A response that contains only the data needed by the private animation protocol. */
data class ExerciseAnimationHttpResponse(val code: Int, val body: ByteArray = ByteArray(0), val eTag: String? = null)

/** Injected transport. It sends no identity, auth, cookies, query string, or custom headers. */
interface ExerciseAnimationTransport {
    suspend fun get(url: String, ifNoneMatch: String? = null): ExerciseAnimationHttpResponse
}

/** OkHttp transport for the public asset host. [AssetAnimationClient] has redirects and cookies off. */
class OkHttpExerciseAnimationTransport @Inject constructor(
    @AssetAnimationClient private val client: OkHttpClient,
) : ExerciseAnimationTransport {
    override suspend fun get(url: String, ifNoneMatch: String?): ExerciseAnimationHttpResponse = withContext(Dispatchers.IO) {
        val request = Request.Builder().url(url).get().apply {
            if (ifNoneMatch != null) header("If-None-Match", ifNoneMatch)
        }.build()
        client.newCall(request).execute().use { response ->
            ExerciseAnimationHttpResponse(response.code, response.body.bytes(), response.header("ETag"))
        }
    }
}

/** Checks the Lottie document before an untrusted remote file enters the cache. */
fun interface ExerciseAnimationValidator {
    fun isValid(bytes: ByteArray, entry: ExerciseAnimationEntry): Boolean
}

/** Uses the Lottie parser and accepts only the index frame count and frame rate within rounding tolerance. */
object LottieExerciseAnimationValidator : ExerciseAnimationValidator {
    override fun isValid(bytes: ByteArray, entry: ExerciseAnimationEntry): Boolean = try {
        val composition = LottieCompositionFactory.fromJsonStringSync(bytes.decodeToString(), null).value ?: return false
        kotlin.math.abs(composition.durationFrames - entry.frames) <= 1f &&
            kotlin.math.abs(composition.frameRate - entry.fps) <= 0.01
    } catch (_: Exception) {
        false
    }
}

/** Availability result for a course detail prefetch. */
enum class RemoteAnimationPrefetchResult { Complete, Unavailable }

/** A local remote animation and the index poster frame that verified it. */
data class CachedRemoteAnimation(val file: File, val posterProgress: Float)

/**
 * Disk-backed remote animation cache. It has no Android dependencies, so its ETag, hash, cache and
 * offline behavior are unit-tested with a fake transport. Every operation runs on [Dispatchers.IO].
 */
@VisibleForTesting
class RemoteExerciseAnimationStore(
    private val cacheRoot: File,
    private val baseUrl: String,
    private val transport: ExerciseAnimationTransport,
    private val validator: ExerciseAnimationValidator,
) {
    private val lock = Mutex()
    @Volatile
    private var index: Map<String, ExerciseAnimationEntry>? = null
    private var indexRequestSucceeded = false
    private var indexRequest: CompletableDeferred<Map<String, ExerciseAnimationEntry>?>? = null
    private val inFlight = mutableMapOf<String, CompletableDeferred<Boolean>>()
    private val cachedFiles = ConcurrentHashMap<String, File>()

    suspend fun prefetch(exerciseIds: Collection<String>, bundledIds: Set<String>): RemoteAnimationPrefetchResult = withContext(Dispatchers.IO) {
        val remoteIds = exerciseIds.distinct().filterNot { it in bundledIds }
        if (remoteIds.isEmpty()) return@withContext RemoteAnimationPrefetchResult.Complete
        val currentIndex = loadIndex() ?: return@withContext RemoteAnimationPrefetchResult.Unavailable
        val entries = remoteIds.mapNotNull(currentIndex::get)
        if (entries.size != remoteIds.size) return@withContext RemoteAnimationPrefetchResult.Unavailable
        entries.forEach { entry ->
            ExerciseAnimationPalette.entries.forEach { palette -> downloadIfNeeded(entry, palette) }
        }
        val allCached = entries.all { entry -> ExerciseAnimationPalette.entries.all { cachedFile(entry, it) != null } }
        if (allCached) RemoteAnimationPrefetchResult.Complete else RemoteAnimationPrefetchResult.Unavailable
    }

    /** Finds a file only when it belongs to the current verified remote index. */
    fun cachedAnimation(exerciseId: String, palette: ExerciseAnimationPalette): CachedRemoteAnimation? {
        val entry = index?.get(exerciseId) ?: return null
        val file = cachedFiles[cacheKey(entry, palette)] ?: return null
        return CachedRemoteAnimation(file, entry.posterProgress)
    }

    private suspend fun loadIndex(): Map<String, ExerciseAnimationEntry>? {
        val request = lock.withLock {
            if (indexRequestSucceeded && index != null) return index
            indexRequest?.let { return@withLock false to it }
            CompletableDeferred<Map<String, ExerciseAnimationEntry>?>().also { indexRequest = it }.let { true to it }
        }
        if (!request.first) return request.second.await()
        val result = try {
            val response = transport.get(baseUrl + EXERCISE_ANIMATION_INDEX, readETag())
            when (response.code) {
                200 -> parseRemoteExerciseAnimationIndex(response.body.decodeToString()).also { parsed ->
                    if (parsed.isEmpty()) throw IllegalArgumentException("Remote animation index has no valid entries")
                    writeIndex(response.body, response.eTag)
                    lock.withLock {
                        index = parsed
                        indexRequestSucceeded = true
                    }
                }
                304 -> readStoredIndex()?.also { parsed ->
                    lock.withLock {
                        index = parsed
                        indexRequestSucceeded = true
                    }
                } ?: throw IOException("Remote index returned 304 without a cache")
                else -> throw IOException("Remote index request failed")
            }
        } catch (_: Exception) {
            readStoredIndex()?.also { parsed -> lock.withLock { index = parsed } }
        }
        lock.withLock {
            request.second.complete(result)
            indexRequest = null
        }
        return result
    }

    private suspend fun downloadIfNeeded(entry: ExerciseAnimationEntry, palette: ExerciseAnimationPalette): Boolean {
        if (cachedFile(entry, palette) != null) return true
        val expectedHash = entry.sha256?.forPalette(palette) ?: return false
        val key = "${entry.id}/${palette.directory}/$expectedHash"
        val (owner, deferred) = lock.withLock {
            inFlight[key]?.let { false to it } ?: CompletableDeferred<Boolean>().let { created ->
                inFlight[key] = created
                true to created
            }
        }
        if (!owner) return deferred.await()
        val result = try {
            val response = transport.get(baseUrl + entry.files.forPalette(palette))
            if (response.code == 200 && sha256(response.body) == expectedHash && validator.isValid(response.body, entry)) {
                writeAnimation(entry, palette, response.body)
                true
            } else {
                false
            }
        } catch (_: Exception) {
            false
        }
        lock.withLock {
            deferred.complete(result)
            inFlight.remove(key)
        }
        return result
    }

    private fun cachedFile(entry: ExerciseAnimationEntry, palette: ExerciseAnimationPalette): File? {
        val hash = entry.sha256?.forPalette(palette) ?: return null
        val key = cacheKey(entry, palette)
        cachedFiles[key]?.let { return it }
        return File(File(cacheRoot, entry.id), "${palette.directory}-$hash.json").takeIf(File::isFile)?.also { cachedFiles[key] = it }
    }

    private fun cacheKey(entry: ExerciseAnimationEntry, palette: ExerciseAnimationPalette): String =
        "${entry.id}/${palette.directory}/${entry.sha256!!.forPalette(palette)}"

    private fun indexFile(): File = File(cacheRoot, EXERCISE_ANIMATION_INDEX)
    private fun eTagFile(): File = File(cacheRoot, "index.etag")

    private fun readETag(): String? = eTagFile().takeIf(File::isFile)?.readText()?.takeIf(String::isNotBlank)

    private fun readStoredIndex(): Map<String, ExerciseAnimationEntry>? = try {
        indexFile().takeIf(File::isFile)?.readText()?.let(::parseRemoteExerciseAnimationIndex)?.takeIf { it.isNotEmpty() }
    } catch (_: Exception) {
        null
    }

    private fun writeIndex(body: ByteArray, eTag: String?) {
        cacheRoot.mkdirs()
        writeAtomically(indexFile(), body)
        writeAtomically(eTagFile(), (eTag ?: "").encodeToByteArray())
    }

    private fun writeAnimation(entry: ExerciseAnimationEntry, palette: ExerciseAnimationPalette, bytes: ByteArray) {
        val directory = File(cacheRoot, entry.id).apply { mkdirs() }
        val hash = entry.sha256!!.forPalette(palette)
        val destination = File(directory, "${palette.directory}-$hash.json")
        writeAtomically(destination, bytes)
        cachedFiles[cacheKey(entry, palette)] = destination
        directory.listFiles()?.filter { file ->
            file.name.startsWith("${palette.directory}-") && file.name != destination.name
        }?.forEach(File::delete)
    }

    private fun writeAtomically(destination: File, bytes: ByteArray) {
        destination.parentFile?.mkdirs()
        val temp = File.createTempFile(".download-", ".tmp", destination.parentFile)
        try {
            temp.writeBytes(bytes)
            try {
                Files.move(temp.toPath(), destination.toPath(), StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING)
            } catch (_: Exception) {
                Files.move(temp.toPath(), destination.toPath(), StandardCopyOption.REPLACE_EXISTING)
            }
        } finally {
            temp.delete()
        }
    }

    private fun sha256(bytes: ByteArray): String = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
}

/** What the training session reads from the remote animation cache. Unit tests pass a fake. */
interface CachedExerciseAnimations {
    /** Increases after each prefetch, so the session reads the cache again. */
    val cacheVersion: StateFlow<Int>

    fun cachedAnimation(exerciseId: String, dark: Boolean): CachedRemoteAnimation?
}

/** Android-facing repository. It keeps cache files out of backups and exposes session refresh state. */
@Singleton
class ExerciseAnimationRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    @ExerciseAnimationBaseUrl baseUrl: String,
    private val transport: ExerciseAnimationTransport,
) : CachedExerciseAnimations {
    private val store = RemoteExerciseAnimationStore(
        cacheRoot = File(context.noBackupFilesDir, "exercise-animations"),
        baseUrl = baseUrl,
        transport = transport,
        validator = LottieExerciseAnimationValidator,
    )
    private val _cacheVersion = MutableStateFlow(0)
    override val cacheVersion: StateFlow<Int> = _cacheVersion

    suspend fun prefetch(workoutExerciseIds: Collection<String>): RemoteAnimationPrefetchResult {
        val bundledIds = ExerciseAnimationIndex.load(context.assets).keys
        val result = store.prefetch(workoutExerciseIds, bundledIds)
        _cacheVersion.value += 1
        return result
    }

    suspend fun hasRemoteExercise(workoutExerciseIds: Collection<String>): Boolean {
        val bundledIds = ExerciseAnimationIndex.load(context.assets).keys
        return workoutExerciseIds.any { it !in bundledIds }
    }

    override fun cachedAnimation(exerciseId: String, dark: Boolean): CachedRemoteAnimation? =
        store.cachedAnimation(exerciseId, if (dark) ExerciseAnimationPalette.Dark else ExerciseAnimationPalette.Light)
}
