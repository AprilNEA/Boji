package club.leanmuscle.boji.feature.training

import club.leanmuscle.boji.core.model.WorkoutLibrary
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/** Checks the generated bundled catalog and the public remote catalog against Android courses. */
class ExerciseAnimationAssetsTest {
    private val bundledDir = File("../../animations/lottie")
    private val remoteDir = File("../../assets/public/animations/exercises/v1")

    private fun rawIndex(directory: File): Map<String, JsonObject> {
        val file = File(directory, EXERCISE_ANIMATION_INDEX)
        assertTrue("Missing ${file.canonicalPath}", file.isFile)
        return Json.parseToJsonElement(file.readText()).jsonArray
            .map { it.jsonObject }
            .associateBy { it.getValue("id").jsonPrimitive.content }
    }

    private val bundledIndex by lazy { rawIndex(bundledDir) }
    private val remoteIndex by lazy { rawIndex(remoteDir) }
    private val bundledCourses = listOf(WorkoutLibrary.Home, WorkoutLibrary.HomeIntermediate, WorkoutLibrary.Gym, WorkoutLibrary.Mobility)
    private val bundledExerciseIds = bundledCourses.flatMap { it.exercises }.map { it.id }.toSet()
    private val allExerciseIds = WorkoutLibrary.all.flatMap { it.exercises }.map { it.id }.toSet()

    @Test
    fun assetPathUsesThePaletteDirectory() {
        assertEquals("light/plank.json", exerciseAnimationAsset("plank", dark = false))
        assertEquals("dark/plank.json", exerciseAnimationAsset("plank", dark = true))
    }

    @Test
    fun bundledIndexListsOnlyTheFourBundledCourseExercises() {
        assertEquals(bundledExerciseIds, bundledIndex.keys)
    }

    @Test
    fun remoteCatalogListsEveryCourseExercise() {
        assertTrue("Remote catalog lacks ${allExerciseIds - remoteIndex.keys}", remoteIndex.keys.containsAll(allExerciseIds))
    }

    @Test
    fun everyCatalogEntryNamesEveryCourseThatUsesIt() {
        listOf(bundledIndex, remoteIndex).forEach { catalog ->
            for ((id, entry) in catalog) {
                val courseList = entry.getValue("courses").jsonArray.map { it.jsonPrimitive.content }
                val courses = courseList.toSet()
                val users = WorkoutLibrary.all.filter { course -> course.exercises.any { it.id == id } }.map { it.id }.toSet()
                assertTrue("$id: missing course users $users", courses.containsAll(users))
                assertEquals("$id: course must remain the first course", courseList.firstOrNull(), entry.getValue("course").jsonPrimitive.content)
            }
        }
    }

    @Test
    fun bundledFilesExistForEveryBundledExercise() {
        val missing = bundledExerciseIds.flatMap { id -> ExerciseAnimationPalette.entries.map { id to it.directory } }
            .filterNot { (id, palette) -> File(bundledDir, "$palette/$id.json").isFile }
        assertTrue("Missing bundled animation files $missing", missing.isEmpty())
    }

    @Test
    fun parsersReadGeneratedIndexes() {
        assertEquals(bundledIndex.keys, parseExerciseAnimationIndex(File(bundledDir, EXERCISE_ANIMATION_INDEX).readText()).keys)
        assertEquals(remoteIndex.keys, parseRemoteExerciseAnimationIndex(File(remoteDir, EXERCISE_ANIMATION_INDEX).readText()).keys)
    }

    @Test
    fun parserIgnoresUnknownFields() {
        val index = parseExerciseAnimationIndex(
            """[{"id":"squat","seconds":3.5,"frames":210,"posterFrame":106,"fps":60,"files":{"light":"light/squat.json","dark":"dark/squat.json"},"future":[1,2]}]""",
        )
        assertEquals(106 / 210f, index.getValue("squat").posterProgress)
    }
}
