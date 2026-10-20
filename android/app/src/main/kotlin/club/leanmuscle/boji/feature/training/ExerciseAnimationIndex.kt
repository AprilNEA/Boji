package club.leanmuscle.boji.feature.training

import android.content.res.AssetManager
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.io.IOException

/** Asset path of the index that `animations/` generates next to the animation files. */
const val EXERCISE_ANIMATION_INDEX = "index.json"

/**
 * The fields of one `index.json` entry that the app uses. The parser ignores the other fields,
 * so `animations/` can add fields without an app change.
 */
@Serializable
data class ExerciseAnimationEntry(
    val id: String,
    /** Frame count of one loop. */
    val frames: Int,
    /** Representative frame for a still image, from 0 to [frames] - 1. */
    val posterFrame: Int,
) {
    /** Lottie progress of [posterFrame]. Falls back to the first frame when the values are invalid. */
    val posterProgress: Float
        get() = if (frames > 0 && posterFrame in 0 until frames) posterFrame / frames.toFloat() else 0f
}

private val indexJson = Json { ignoreUnknownKeys = true }

/**
 * Parses `index.json`. Throws [IllegalArgumentException] on bad input. `SerializationException`
 * is a subclass of it.
 */
fun parseExerciseAnimationIndex(text: String): Map<String, ExerciseAnimationEntry> =
    indexJson.decodeFromString<List<ExerciseAnimationEntry>>(text).associateBy { it.id }

/**
 * Reads the packaged index once per process. The index is part of the APK, so it cannot change
 * while the process runs. A missing or invalid index gives an empty map, and the animation then
 * uses its first frame as the still image.
 */
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
        } catch (e: IOException) {
            Log.w(TAG, "Cannot read $EXERCISE_ANIMATION_INDEX", e)
            emptyMap()
        } catch (e: IllegalArgumentException) {
            Log.w(TAG, "Invalid $EXERCISE_ANIMATION_INDEX", e)
            emptyMap()
        }

    private const val TAG = "ExerciseAnimation"
}
