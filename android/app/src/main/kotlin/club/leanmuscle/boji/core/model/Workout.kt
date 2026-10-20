package club.leanmuscle.boji.core.model

import androidx.annotation.StringRes
import club.leanmuscle.boji.R
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Training context chosen during onboarding. Serial names match the iOS raw values. */
@Serializable
enum class PlanKind {
    @SerialName("home")
    Home,

    @SerialName("gym")
    Gym,
}

/** Platform-neutral icon role. The UI layer maps each role to a drawable. */
enum class ExerciseIcon {
    Strength,
    Walk,
    Core,
    Cooldown,
    Dumbbell,
    Row,
    PullDown,
    Flexibility,
    Lunge,
    ArmsOpen,
}

/** Difficulty of a course. The UI layer maps each level to a `course_level_*` string. */
enum class CourseLevel { Beginner, Intermediate, Gentle }

/**
 * The amount of one set: repetitions or seconds, once or on each side.
 * The UI layer formats it with the `exercise_reps_*` strings. Matches `Reps` in iOS `BojiStore.swift`.
 */
sealed interface Reps {
    data class Count(val count: Int) : Reps

    data class CountRange(val min: Int, val max: Int) : Reps

    data class CountPerSide(val count: Int) : Reps

    data class Seconds(val seconds: Int) : Reps

    data class SecondsRange(val min: Int, val max: Int) : Reps

    data class SecondsPerSide(val seconds: Int) : Reps
}

/** A course exercise. [name] and [tip] are the `exercise_<id>_name` and `exercise_<id>_tip` strings. */
data class Exercise(
    val id: String,
    @StringRes val name: Int,
    val sets: Int,
    val reps: Reps,
    @StringRes val tip: Int,
    val icon: ExerciseIcon,
)

/** A built-in course. [title] and [subtitle] are the `course_<id>_title` and `course_<id>_subtitle` strings. */
data class Workout(
    val id: String,
    @StringRes val title: Int,
    @StringRes val subtitle: Int,
    val minutes: Int,
    val level: CourseLevel,
    val exercises: List<Exercise>,
) {
    val totalSets: Int get() = exercises.sumOf { it.sets }
}

/**
 * Built-in courses. Structure and IDs match `WorkoutLibrary` in ios/Boji/Models/BojiStore.swift.
 * The text is in `locales/` (groups `course` and `exercise`); both apps read the same keys.
 */
object WorkoutLibrary {
    val Home = Workout(
        id = "home-beginner",
        title = R.string.course_home_beginner_title,
        subtitle = R.string.course_home_beginner_subtitle,
        minutes = 20,
        level = CourseLevel.Beginner,
        exercises = listOf(
            Exercise(
                "bodyweight-squat",
                R.string.exercise_bodyweight_squat_name,
                3,
                Reps.CountRange(8, 10),
                R.string.exercise_bodyweight_squat_tip,
                ExerciseIcon.Strength,
            ),
            Exercise(
                "wall-push-up",
                R.string.exercise_wall_push_up_name,
                3,
                Reps.CountRange(8, 10),
                R.string.exercise_wall_push_up_tip,
                ExerciseIcon.Walk,
            ),
            Exercise(
                "glute-bridge",
                R.string.exercise_glute_bridge_name,
                3,
                Reps.CountRange(10, 12),
                R.string.exercise_glute_bridge_tip,
                ExerciseIcon.Core,
            ),
            Exercise(
                "bird-dog",
                R.string.exercise_bird_dog_name,
                2,
                Reps.CountPerSide(8),
                R.string.exercise_bird_dog_tip,
                ExerciseIcon.Cooldown,
            ),
        ),
    )

    val HomeIntermediate = Workout(
        id = "home-intermediate",
        title = R.string.course_home_intermediate_title,
        subtitle = R.string.course_home_intermediate_subtitle,
        minutes = 25,
        level = CourseLevel.Intermediate,
        exercises = listOf(
            Exercise(
                "reverse-lunge",
                R.string.exercise_reverse_lunge_name,
                3,
                Reps.CountPerSide(8),
                R.string.exercise_reverse_lunge_tip,
                ExerciseIcon.Lunge,
            ),
            Exercise(
                "knee-push-up",
                R.string.exercise_knee_push_up_name,
                3,
                Reps.CountRange(8, 10),
                R.string.exercise_knee_push_up_tip,
                ExerciseIcon.Strength,
            ),
            Exercise(
                "dead-bug",
                R.string.exercise_dead_bug_name,
                3,
                Reps.CountPerSide(6),
                R.string.exercise_dead_bug_tip,
                ExerciseIcon.Core,
            ),
            Exercise(
                "wall-sit",
                R.string.exercise_wall_sit_name,
                3,
                Reps.SecondsRange(20, 30),
                R.string.exercise_wall_sit_tip,
                ExerciseIcon.Strength,
            ),
            Exercise(
                "plank",
                R.string.exercise_plank_name,
                3,
                Reps.SecondsRange(20, 30),
                R.string.exercise_plank_tip,
                ExerciseIcon.Core,
            ),
        ),
    )

    val Gym = Workout(
        id = "gym-beginner",
        title = R.string.course_gym_beginner_title,
        subtitle = R.string.course_gym_beginner_subtitle,
        minutes = 30,
        level = CourseLevel.Beginner,
        exercises = listOf(
            Exercise(
                "chest-press",
                R.string.exercise_chest_press_name,
                3,
                Reps.CountRange(8, 10),
                R.string.exercise_chest_press_tip,
                ExerciseIcon.Dumbbell,
            ),
            Exercise(
                "seated-row",
                R.string.exercise_seated_row_name,
                3,
                Reps.CountRange(8, 10),
                R.string.exercise_seated_row_tip,
                ExerciseIcon.Row,
            ),
            Exercise(
                "leg-press",
                R.string.exercise_leg_press_name,
                3,
                Reps.Count(10),
                R.string.exercise_leg_press_tip,
                ExerciseIcon.Strength,
            ),
            Exercise(
                "lat-pulldown",
                R.string.exercise_lat_pulldown_name,
                3,
                Reps.CountRange(8, 10),
                R.string.exercise_lat_pulldown_tip,
                ExerciseIcon.PullDown,
            ),
        ),
    )

    val Mobility = Workout(
        id = "mobility",
        title = R.string.course_mobility_title,
        subtitle = R.string.course_mobility_subtitle,
        minutes = 10,
        level = CourseLevel.Gentle,
        exercises = listOf(
            Exercise(
                "cat-cow",
                R.string.exercise_cat_cow_name,
                2,
                Reps.Count(8),
                R.string.exercise_cat_cow_tip,
                ExerciseIcon.Flexibility,
            ),
            Exercise(
                "hip-flexor-stretch",
                R.string.exercise_hip_flexor_stretch_name,
                2,
                Reps.SecondsPerSide(20),
                R.string.exercise_hip_flexor_stretch_tip,
                ExerciseIcon.Lunge,
            ),
            Exercise(
                "chest-stretch",
                R.string.exercise_chest_stretch_name,
                2,
                Reps.Seconds(20),
                R.string.exercise_chest_stretch_tip,
                ExerciseIcon.ArmsOpen,
            ),
        ),
    )

    val all: List<Workout> = listOf(Home, HomeIntermediate, Gym, Mobility)

    fun recommended(plan: PlanKind): Workout = when (plan) {
        PlanKind.Home -> Home
        PlanKind.Gym -> Gym
    }

    fun byId(id: String): Workout? = all.firstOrNull { it.id == id }
}
