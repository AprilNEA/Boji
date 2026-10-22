package club.leanmuscle.boji.core.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class WorkoutLibraryTest {
    @Test
    fun hasTheFourteenSpecifiedCoursesInTrainingOrder() {
        assertEquals(
            listOf(
                "home-beginner", "home-intermediate", "home-strength", "home-core", "home-cardio", "home-dumbbell",
                "gym-beginner", "gym-free-weights", "gym-upper", "gym-lower",
                "mobility", "stretch-lower", "stretch-desk", "morning-wake-up",
            ),
            WorkoutLibrary.all.map { it.id },
        )
        assertEquals(WorkoutLibrary.all.size, WorkoutLibrary.all.map { it.id }.toSet().size)
    }

    @Test
    fun coursesAppearInTheirSpecifiedGroups() {
        assertEquals(6, WorkoutLibrary.all.count { it.group == WorkoutGroup.Home })
        assertEquals(4, WorkoutLibrary.all.count { it.group == WorkoutGroup.Gym })
        assertEquals(4, WorkoutLibrary.all.count { it.group == WorkoutGroup.Stretch })
        assertEquals(30, WorkoutLibrary.HomeStrength.minutes)
        assertEquals(CourseLevel.Intermediate, WorkoutLibrary.HomeStrength.level)
        assertEquals(8, WorkoutLibrary.MorningWakeUp.minutes)
        assertEquals(CourseLevel.Gentle, WorkoutLibrary.MorningWakeUp.level)
    }

    @Test
    fun bundledExercisesAreReusedByTheNewRemoteCourses() {
        assertTrue(WorkoutLibrary.HomeCore.exercises.any { it.id == "plank" })
        assertTrue(WorkoutLibrary.GymLower.exercises.any { it.id == "leg-press" })
        assertEquals(WorkoutLibrary.Home, WorkoutLibrary.recommended(PlanKind.Home))
        assertEquals(WorkoutLibrary.Gym, WorkoutLibrary.recommended(PlanKind.Gym))
    }
}
