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

/** Placement of a course on the training page. */
enum class WorkoutGroup { Home, Gym, Stretch }

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
    val group: WorkoutGroup,
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
        group = WorkoutGroup.Home,
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
        group = WorkoutGroup.Home,
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
        group = WorkoutGroup.Gym,
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
        group = WorkoutGroup.Stretch,
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

    val HomeStrength = Workout(
        id = "home-strength", title = R.string.course_home_strength_title,
        subtitle = R.string.course_home_strength_subtitle, minutes = 30,
        level = CourseLevel.Intermediate, group = WorkoutGroup.Home,
        exercises = listOf(
            exercise("push-up", R.string.exercise_push_up_name, 3, Reps.CountRange(8, 12), R.string.exercise_push_up_tip, ExerciseIcon.Strength),
            exercise("bodyweight-split-squat", R.string.exercise_bodyweight_split_squat_name, 3, Reps.CountPerSide(8), R.string.exercise_bodyweight_split_squat_tip, ExerciseIcon.Lunge),
            exercise("single-leg-glute-bridge", R.string.exercise_single_leg_glute_bridge_name, 3, Reps.CountPerSide(10), R.string.exercise_single_leg_glute_bridge_tip, ExerciseIcon.Core),
            exercise("bench-dip", R.string.exercise_bench_dip_name, 3, Reps.CountRange(8, 12), R.string.exercise_bench_dip_tip, ExerciseIcon.Strength),
            exercise("superman", R.string.exercise_superman_name, 3, Reps.CountRange(10, 12), R.string.exercise_superman_tip, ExerciseIcon.Core),
            exercise("bodyweight-forearm-side-plank", R.string.exercise_bodyweight_forearm_side_plank_name, 3, Reps.SecondsPerSide(20), R.string.exercise_bodyweight_forearm_side_plank_tip, ExerciseIcon.Core),
        ),
    )

    val HomeCore = Workout(
        id = "home-core", title = R.string.course_home_core_title,
        subtitle = R.string.course_home_core_subtitle, minutes = 15,
        level = CourseLevel.Beginner, group = WorkoutGroup.Home,
        exercises = listOf(
            exercise("crunch", R.string.exercise_crunch_name, 3, Reps.CountRange(12, 15), R.string.exercise_crunch_tip, ExerciseIcon.Core),
            exercise("reverse-crunch", R.string.exercise_reverse_crunch_name, 3, Reps.CountRange(10, 12), R.string.exercise_reverse_crunch_tip, ExerciseIcon.Core),
            exercise("bicycle-crunch", R.string.exercise_bicycle_crunch_name, 3, Reps.CountPerSide(10), R.string.exercise_bicycle_crunch_tip, ExerciseIcon.Core),
            exercise("russian-twist", R.string.exercise_russian_twist_name, 3, Reps.CountPerSide(10), R.string.exercise_russian_twist_tip, ExerciseIcon.Core),
            exercise("flutter-kick", R.string.exercise_flutter_kick_name, 3, Reps.SecondsRange(20, 30), R.string.exercise_flutter_kick_tip, ExerciseIcon.Core),
            exercise("plank", R.string.exercise_plank_name, 3, Reps.SecondsRange(20, 30), R.string.exercise_plank_tip, ExerciseIcon.Core),
        ),
    )

    val HomeCardio = Workout(
        id = "home-cardio", title = R.string.course_home_cardio_title,
        subtitle = R.string.course_home_cardio_subtitle, minutes = 15,
        level = CourseLevel.Intermediate, group = WorkoutGroup.Home,
        exercises = listOf(
            exercise("jumping-jack", R.string.exercise_jumping_jack_name, 3, Reps.Seconds(30), R.string.exercise_jumping_jack_tip, ExerciseIcon.ArmsOpen),
            exercise("wall-high-knees", R.string.exercise_wall_high_knees_name, 3, Reps.Seconds(30), R.string.exercise_wall_high_knees_tip, ExerciseIcon.Walk),
            exercise("mountain-climber", R.string.exercise_mountain_climber_name, 3, Reps.Seconds(30), R.string.exercise_mountain_climber_tip, ExerciseIcon.Core),
            exercise("jump-squat", R.string.exercise_jump_squat_name, 3, Reps.CountRange(8, 10), R.string.exercise_jump_squat_tip, ExerciseIcon.Strength),
            exercise("bear-crawl", R.string.exercise_bear_crawl_name, 3, Reps.Seconds(20), R.string.exercise_bear_crawl_tip, ExerciseIcon.Walk),
            exercise("bodyweight-burpee", R.string.exercise_bodyweight_burpee_name, 3, Reps.CountRange(6, 8), R.string.exercise_bodyweight_burpee_tip, ExerciseIcon.Strength),
        ),
    )

    val HomeDumbbell = Workout(
        id = "home-dumbbell", title = R.string.course_home_dumbbell_title,
        subtitle = R.string.course_home_dumbbell_subtitle, minutes = 25,
        level = CourseLevel.Beginner, group = WorkoutGroup.Home,
        exercises = listOf(
            exercise("dumbbell-goblet-squat", R.string.exercise_dumbbell_goblet_squat_name, 3, Reps.CountRange(8, 10), R.string.exercise_dumbbell_goblet_squat_tip, ExerciseIcon.Strength),
            exercise("dumbbell-floor-press", R.string.exercise_dumbbell_floor_press_name, 3, Reps.CountRange(8, 10), R.string.exercise_dumbbell_floor_press_tip, ExerciseIcon.Dumbbell),
            exercise("dumbbell-bent-over-row", R.string.exercise_dumbbell_bent_over_row_name, 3, Reps.CountRange(8, 10), R.string.exercise_dumbbell_bent_over_row_tip, ExerciseIcon.Row),
            exercise("dumbbell-romanian-deadlift", R.string.exercise_dumbbell_romanian_deadlift_name, 3, Reps.CountRange(8, 10), R.string.exercise_dumbbell_romanian_deadlift_tip, ExerciseIcon.Strength),
            exercise("dumbbell-reverse-lunge", R.string.exercise_dumbbell_reverse_lunge_name, 3, Reps.CountPerSide(8), R.string.exercise_dumbbell_reverse_lunge_tip, ExerciseIcon.Lunge),
            exercise("dumbbell-lateral-raise", R.string.exercise_dumbbell_lateral_raise_name, 3, Reps.CountRange(10, 12), R.string.exercise_dumbbell_lateral_raise_tip, ExerciseIcon.ArmsOpen),
        ),
    )

    val GymFreeWeights = Workout(
        id = "gym-free-weights", title = R.string.course_gym_free_weights_title,
        subtitle = R.string.course_gym_free_weights_subtitle, minutes = 35,
        level = CourseLevel.Beginner, group = WorkoutGroup.Gym,
        exercises = listOf(
            exercise("dumbbell-goblet-squat", R.string.exercise_dumbbell_goblet_squat_name, 3, Reps.CountRange(8, 10), R.string.exercise_dumbbell_goblet_squat_tip, ExerciseIcon.Strength),
            exercise("dumbbell-bench-press", R.string.exercise_dumbbell_bench_press_name, 3, Reps.CountRange(8, 10), R.string.exercise_dumbbell_bench_press_tip, ExerciseIcon.Dumbbell),
            exercise("dumbbell-bent-over-row", R.string.exercise_dumbbell_bent_over_row_name, 3, Reps.CountRange(8, 10), R.string.exercise_dumbbell_bent_over_row_tip, ExerciseIcon.Row),
            exercise("dumbbell-romanian-deadlift", R.string.exercise_dumbbell_romanian_deadlift_name, 3, Reps.CountRange(8, 10), R.string.exercise_dumbbell_romanian_deadlift_tip, ExerciseIcon.Strength),
            exercise("dumbbell-seated-shoulder-press", R.string.exercise_dumbbell_seated_shoulder_press_name, 3, Reps.CountRange(8, 10), R.string.exercise_dumbbell_seated_shoulder_press_tip, ExerciseIcon.Dumbbell),
            exercise("dumbbell-biceps-curl", R.string.exercise_dumbbell_biceps_curl_name, 3, Reps.CountRange(10, 12), R.string.exercise_dumbbell_biceps_curl_tip, ExerciseIcon.Dumbbell),
        ),
    )

    val GymUpper = Workout(
        id = "gym-upper", title = R.string.course_gym_upper_title,
        subtitle = R.string.course_gym_upper_subtitle, minutes = 35,
        level = CourseLevel.Intermediate, group = WorkoutGroup.Gym,
        exercises = listOf(
            exercise("machine-chest-press", R.string.exercise_machine_chest_press_name, 3, Reps.CountRange(8, 10), R.string.exercise_machine_chest_press_tip, ExerciseIcon.Dumbbell),
            exercise("machine-shoulder-press", R.string.exercise_machine_shoulder_press_name, 3, Reps.CountRange(8, 10), R.string.exercise_machine_shoulder_press_tip, ExerciseIcon.Dumbbell),
            exercise("machine-assisted-pull-up", R.string.exercise_machine_assisted_pull_up_name, 3, Reps.CountRange(6, 8), R.string.exercise_machine_assisted_pull_up_tip, ExerciseIcon.PullDown),
            exercise("machine-pec-deck-fly", R.string.exercise_machine_pec_deck_fly_name, 3, Reps.CountRange(10, 12), R.string.exercise_machine_pec_deck_fly_tip, ExerciseIcon.ArmsOpen),
            exercise("cable-face-pull", R.string.exercise_cable_face_pull_name, 3, Reps.CountRange(12, 15), R.string.exercise_cable_face_pull_tip, ExerciseIcon.Row),
            exercise("cable-rope-triceps-pushdown", R.string.exercise_cable_rope_triceps_pushdown_name, 3, Reps.CountRange(10, 12), R.string.exercise_cable_rope_triceps_pushdown_tip, ExerciseIcon.PullDown),
        ),
    )

    val GymLower = Workout(
        id = "gym-lower", title = R.string.course_gym_lower_title,
        subtitle = R.string.course_gym_lower_subtitle, minutes = 35,
        level = CourseLevel.Intermediate, group = WorkoutGroup.Gym,
        exercises = listOf(
            exercise("leg-press", R.string.exercise_leg_press_name, 3, Reps.Count(10), R.string.exercise_leg_press_tip, ExerciseIcon.Strength),
            exercise("machine-leg-extension", R.string.exercise_machine_leg_extension_name, 3, Reps.CountRange(10, 12), R.string.exercise_machine_leg_extension_tip, ExerciseIcon.Strength),
            exercise("machine-seated-leg-curl", R.string.exercise_machine_seated_leg_curl_name, 3, Reps.CountRange(10, 12), R.string.exercise_machine_seated_leg_curl_tip, ExerciseIcon.Strength),
            exercise("machine-seated-hip-abduction", R.string.exercise_machine_seated_hip_abduction_name, 3, Reps.CountRange(12, 15), R.string.exercise_machine_seated_hip_abduction_tip, ExerciseIcon.Strength),
            exercise("machine-seated-hip-adduction", R.string.exercise_machine_seated_hip_adduction_name, 3, Reps.CountRange(12, 15), R.string.exercise_machine_seated_hip_adduction_tip, ExerciseIcon.Strength),
            exercise("back-extension", R.string.exercise_back_extension_name, 3, Reps.CountRange(10, 12), R.string.exercise_back_extension_tip, ExerciseIcon.Core),
        ),
    )

    val StretchLower = Workout(
        id = "stretch-lower", title = R.string.course_stretch_lower_title,
        subtitle = R.string.course_stretch_lower_subtitle, minutes = 10,
        level = CourseLevel.Gentle, group = WorkoutGroup.Stretch,
        exercises = listOf(
            exercise("standing-hamstring-stretch", R.string.exercise_standing_hamstring_stretch_name, 2, Reps.SecondsPerSide(20), R.string.exercise_standing_hamstring_stretch_tip, ExerciseIcon.Flexibility),
            exercise("prone-quadriceps-stretch", R.string.exercise_prone_quadriceps_stretch_name, 2, Reps.SecondsPerSide(20), R.string.exercise_prone_quadriceps_stretch_tip, ExerciseIcon.Flexibility),
            exercise("supine-figure-four-glute-stretch", R.string.exercise_supine_figure_four_glute_stretch_name, 2, Reps.SecondsPerSide(20), R.string.exercise_supine_figure_four_glute_stretch_tip, ExerciseIcon.Flexibility),
            exercise("runners-lunge-stretch", R.string.exercise_runners_lunge_stretch_name, 2, Reps.SecondsPerSide(20), R.string.exercise_runners_lunge_stretch_tip, ExerciseIcon.Lunge),
            exercise("wall-standing-calf-stretch", R.string.exercise_wall_standing_calf_stretch_name, 2, Reps.SecondsPerSide(20), R.string.exercise_wall_standing_calf_stretch_tip, ExerciseIcon.Flexibility),
        ),
    )

    val StretchDesk = Workout(
        id = "stretch-desk", title = R.string.course_stretch_desk_title,
        subtitle = R.string.course_stretch_desk_subtitle, minutes = 8,
        level = CourseLevel.Gentle, group = WorkoutGroup.Stretch,
        exercises = listOf(
            exercise("neck-side-stretch", R.string.exercise_neck_side_stretch_name, 2, Reps.SecondsPerSide(15), R.string.exercise_neck_side_stretch_tip, ExerciseIcon.Cooldown),
            exercise("cross-body-shoulder-stretch", R.string.exercise_cross_body_shoulder_stretch_name, 2, Reps.SecondsPerSide(20), R.string.exercise_cross_body_shoulder_stretch_tip, ExerciseIcon.ArmsOpen),
            exercise("overhead-triceps-stretch", R.string.exercise_overhead_triceps_stretch_name, 2, Reps.SecondsPerSide(20), R.string.exercise_overhead_triceps_stretch_tip, ExerciseIcon.ArmsOpen),
            exercise("chair-seated-chest-and-shoulder-stretch", R.string.exercise_chair_seated_chest_and_shoulder_stretch_name, 2, Reps.Seconds(20), R.string.exercise_chair_seated_chest_and_shoulder_stretch_tip, ExerciseIcon.ArmsOpen),
            exercise("seated-chair-hamstring-stretch", R.string.exercise_seated_chair_hamstring_stretch_name, 2, Reps.SecondsPerSide(20), R.string.exercise_seated_chair_hamstring_stretch_tip, ExerciseIcon.Flexibility),
        ),
    )

    val MorningWakeUp = Workout(
        id = "morning-wake-up", title = R.string.course_morning_wake_up_title,
        subtitle = R.string.course_morning_wake_up_subtitle, minutes = 8,
        level = CourseLevel.Gentle, group = WorkoutGroup.Stretch,
        exercises = listOf(
            exercise("worlds-greatest-stretch", R.string.exercise_worlds_greatest_stretch_name, 2, Reps.CountPerSide(4), R.string.exercise_worlds_greatest_stretch_tip, ExerciseIcon.Lunge),
            exercise("inchworm", R.string.exercise_inchworm_name, 2, Reps.Count(5), R.string.exercise_inchworm_tip, ExerciseIcon.Flexibility),
            exercise("bodyweight-good-morning", R.string.exercise_bodyweight_good_morning_name, 2, Reps.Count(10), R.string.exercise_bodyweight_good_morning_tip, ExerciseIcon.Strength),
            exercise("knees-to-chest-stretch", R.string.exercise_knees_to_chest_stretch_name, 2, Reps.Seconds(20), R.string.exercise_knees_to_chest_stretch_tip, ExerciseIcon.Cooldown),
            exercise("childs-pose", R.string.exercise_childs_pose_name, 2, Reps.Seconds(30), R.string.exercise_childs_pose_tip, ExerciseIcon.Cooldown),
        ),
    )

    private fun exercise(id: String, name: Int, sets: Int, reps: Reps, tip: Int, icon: ExerciseIcon): Exercise =
        Exercise(id, name, sets, reps, tip, icon)

    val all: List<Workout> = listOf(
        Home, HomeIntermediate, HomeStrength, HomeCore, HomeCardio, HomeDumbbell,
        Gym, GymFreeWeights, GymUpper, GymLower,
        Mobility, StretchLower, StretchDesk, MorningWakeUp,
    )

    fun recommended(plan: PlanKind): Workout = when (plan) {
        PlanKind.Home -> Home
        PlanKind.Gym -> Gym
    }

    fun byId(id: String): Workout? = all.firstOrNull { it.id == id }
}
