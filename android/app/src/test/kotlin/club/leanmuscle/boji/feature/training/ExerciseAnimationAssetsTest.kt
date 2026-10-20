package club.leanmuscle.boji.feature.training

import club.leanmuscle.boji.core.model.WorkoutLibrary
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/**
 * Checks the contract with `animations/lottie`, which `app/build.gradle.kts` packages as assets.
 * That directory holds only course exercises. Exercises that no course uses yet are in
 * `animations/lottie-library`, which the app does not package.
 */
class ExerciseAnimationAssetsTest {
    // Gradle runs unit tests in the module directory, android/app.
    private val lottieDir = File("../../animations/lottie")

    private val indexText: String by lazy {
        val file = File(lottieDir, EXERCISE_ANIMATION_INDEX)
        assertTrue("Missing ${file.canonicalPath}", file.isFile)
        file.readText()
    }

    private val rawIndex: Map<String, JsonObject> by lazy {
        Json.parseToJsonElement(indexText).jsonArray
            .map { it.jsonObject }
            .associateBy { it.getValue("id").jsonPrimitive.content }
    }

    private val exerciseIds = WorkoutLibrary.all.flatMap { workout -> workout.exercises.map { it.id } }.distinct()

    @Test
    fun assetPathUsesThePaletteDirectory() {
        assertEquals("light/plank.json", exerciseAnimationAsset("plank", dark = false))
        assertEquals("dark/plank.json", exerciseAnimationAsset("plank", dark = true))
    }

    @Test
    fun indexListsExactlyTheCourseExercises() {
        val missing = exerciseIds.filterNot { it in rawIndex }
        val extra = rawIndex.keys.filterNot { it in exerciseIds }
        assertTrue("No index entry for $missing", missing.isEmpty())
        assertTrue("Index entries that no course uses: $extra", extra.isEmpty())
    }

    @Test
    fun courseOfEachEntryContainsTheExercise() {
        for ((id, entry) in rawIndex) {
            val course = (entry["course"] as? JsonPrimitive)?.takeIf { it.isString }?.content
            val workout = checkNotNull(WorkoutLibrary.all.firstOrNull { it.id == course }) { "$id: unknown course $course" }
            assertTrue("$id: course $course does not contain it", workout.exercises.any { it.id == id })
        }
    }

    @Test
    fun assetPathsMatchTheIndex() {
        for (id in exerciseIds) {
            val files = rawIndex.getValue(id).getValue("files").jsonObject
            assertEquals(id, files.getValue("light").jsonPrimitive.content, exerciseAnimationAsset(id, dark = false))
            assertEquals(id, files.getValue("dark").jsonPrimitive.content, exerciseAnimationAsset(id, dark = true))
        }
    }

    @Test
    fun bothPaletteFilesExist() {
        val missing = exerciseIds.flatMap { id ->
            listOf(false, true).map { dark -> exerciseAnimationAsset(id, dark) }
        }.filterNot { File(lottieDir, it).isFile }
        assertTrue("Missing animation files $missing", missing.isEmpty())
    }

    @Test
    fun appParserReadsTheIndex() {
        val index = parseExerciseAnimationIndex(indexText)
        assertEquals(rawIndex.keys, index.keys)
    }

    @Test
    fun posterFrameIsInsideTheLoop() {
        for (entry in parseExerciseAnimationIndex(indexText).values) {
            assertTrue("${entry.id}: posterFrame ${entry.posterFrame} not in [0, ${entry.frames})", entry.posterFrame in 0 until entry.frames)
        }
    }

    @Test
    fun parserIgnoresUnknownFields() {
        val index = parseExerciseAnimationIndex(
            """[{"id":"squat","frames":210,"posterFrame":106,"course":null,"files":{},"future":[1,2]}]""",
        )
        assertEquals(106 / 210f, index.getValue("squat").posterProgress)
    }

    @Test
    fun invalidPosterFrameFallsBackToTheFirstFrame() {
        assertEquals(0f, ExerciseAnimationEntry("a", frames = 210, posterFrame = 210).posterProgress)
        assertEquals(0f, ExerciseAnimationEntry("a", frames = 210, posterFrame = -1).posterProgress)
        assertEquals(0f, ExerciseAnimationEntry("a", frames = 0, posterFrame = 0).posterProgress)
    }
}
