package club.leanmuscle.boji.feature.training

import android.content.res.AssetManager
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject

/** Asset path of the index that `animations/` generates next to the animation files. */
const val EXERCISE_ANIMATION_INDEX = "index.json"

/** One palette of an exercise animation. */
enum class ExerciseAnimationPalette(val directory: String) {
    Light("light"),
    Dark("dark"),
}

/** Exact index paths for the two animation palettes. */
data class ExerciseAnimationFiles(val light: String, val dark: String) {
    fun forPalette(palette: ExerciseAnimationPalette): String = when (palette) {
        ExerciseAnimationPalette.Light -> light
        ExerciseAnimationPalette.Dark -> dark
    }
}

/** SHA-256 values that verify the two animation palettes. */
data class ExerciseAnimationHashes(val light: String, val dark: String) {
    fun forPalette(palette: ExerciseAnimationPalette): String = when (palette) {
        ExerciseAnimationPalette.Light -> light
        ExerciseAnimationPalette.Dark -> dark
    }
}

/** Fields from one bundled or remote animation index entry that the app uses. */
data class ExerciseAnimationEntry(
    val id: String,
    val seconds: Double,
    /** Frame count of one loop. */
    val frames: Int,
    /** Representative frame for a still image, from 0 to [frames] - 1. */
    val posterFrame: Int,
    val fps: Double,
    val files: ExerciseAnimationFiles,
    val sha256: ExerciseAnimationHashes? = null,
) {
    /** Lottie progress of [posterFrame]. Invalid values retain the existing first-frame fallback. */
    val posterProgress: Float
        get() = if (frames > 0 && posterFrame in 0 until frames) posterFrame / frames.toFloat() else 0f
}

private val indexJson = Json { ignoreUnknownKeys = true }
private val animationIdPattern = Regex("[a-z0-9]+(?:-[a-z0-9]+)*")
private val sha256Pattern = Regex("[0-9a-f]{64}")

/**
 * Parses the bundled index. The caller gets a precise failure for malformed or duplicate entries.
 * Unknown fields remain forward-compatible.
 */
fun parseExerciseAnimationIndex(text: String): Map<String, ExerciseAnimationEntry> {
    val entries = indexJson.parseToJsonElement(text).requireArray().map { entry -> parseEntry(entry, requireHashes = false) }
    require(entries.map { it.id }.toSet().size == entries.size) { "Animation index contains duplicate IDs" }
    return entries.associateBy { it.id }
}

/**
 * Parses the remote index. A bad entry is discarded without discarding valid entries. Duplicate IDs
 * are all discarded because neither copy can be trusted. Remote entries must carry both SHA-256s.
 */
fun parseRemoteExerciseAnimationIndex(text: String): Map<String, ExerciseAnimationEntry> {
    val parsed = indexJson.parseToJsonElement(text).requireArray().mapNotNull { entry ->
        runCatching { parseEntry(entry, requireHashes = true) }.getOrNull()
    }
    val duplicateIds = parsed.groupingBy { it.id }.eachCount().filterValues { it > 1 }.keys
    return parsed.filterNot { it.id in duplicateIds }.associateBy { it.id }
}

private fun parseEntry(element: kotlinx.serialization.json.JsonElement, requireHashes: Boolean): ExerciseAnimationEntry {
    val objectValue = element as? JsonObject ?: throw IllegalArgumentException("Animation entry is not an object")
    val id = objectValue.string("id")
    require(animationIdPattern.matches(id)) { "Invalid animation ID" }
    val seconds = objectValue.positiveDouble("seconds")
    val frames = objectValue.positiveInt("frames")
    val posterFrame = objectValue.int("posterFrame")
    require(posterFrame in 0 until frames) { "posterFrame is outside the loop" }
    val fps = objectValue.positiveDouble("fps")
    val filesObject = objectValue.objectValue("files")
    val expectedLight = "light/$id.json"
    val expectedDark = "dark/$id.json"
    val files = ExerciseAnimationFiles(filesObject.string("light"), filesObject.string("dark"))
    require(files.light == expectedLight && files.dark == expectedDark) { "Unexpected animation path" }
    val hashes = objectValue["sha256"]?.let { hashValue ->
        val hashesObject = hashValue as? JsonObject ?: throw IllegalArgumentException("Invalid SHA-256 object")
        ExerciseAnimationHashes(hashesObject.string("light"), hashesObject.string("dark")).also {
            require(sha256Pattern.matches(it.light) && sha256Pattern.matches(it.dark)) { "Invalid SHA-256" }
        }
    }
    require(!requireHashes || hashes != null) { "Remote animation lacks SHA-256" }
    return ExerciseAnimationEntry(id, seconds, frames, posterFrame, fps, files, hashes)
}

private fun kotlinx.serialization.json.JsonElement.requireArray(): JsonArray =
    this as? JsonArray ?: throw IllegalArgumentException("Animation index is not an array")

private fun JsonObject.string(name: String): String =
    (this[name] as? JsonPrimitive)?.takeIf { it.isString }?.content
        ?: throw IllegalArgumentException("Missing string $name")

private fun JsonObject.objectValue(name: String): JsonObject =
    this[name] as? JsonObject ?: throw IllegalArgumentException("Missing object $name")

private fun JsonObject.int(name: String): Int =
    (this[name] as? JsonPrimitive)?.intOrNull ?: throw IllegalArgumentException("Missing integer $name")

private fun JsonObject.positiveInt(name: String): Int = int(name).also { require(it > 0) { "$name is not positive" } }

private fun JsonObject.positiveDouble(name: String): Double =
    ((this[name] as? JsonPrimitive)?.doubleOrNull ?: throw IllegalArgumentException("Missing number $name"))
        .also { require(it.isFinite() && it > 0) { "$name is not positive" } }

/** Reads the packaged index once per process. The packaged files never change while the process runs. */
object ExerciseAnimationIndex {
    @Volatile
    private var entries: Map<String, ExerciseAnimationEntry>? = null

    /** The cached index, or null before the first [load]. */
    fun peek(): Map<String, ExerciseAnimationEntry>? = entries

    suspend fun load(assets: AssetManager): Map<String, ExerciseAnimationEntry> =
        entries ?: withContext(Dispatchers.IO) { read(assets) }.also { entries = it }

    private fun read(assets: AssetManager): Map<String, ExerciseAnimationEntry> =
        try {
            parseExerciseAnimationIndex(assets.open(EXERCISE_ANIMATION_INDEX).bufferedReader().use { it.readText() })
        } catch (error: Exception) {
            Log.w(TAG, "Cannot read animation index", error)
            emptyMap()
        }

    private const val TAG = "ExerciseAnimation"
}
