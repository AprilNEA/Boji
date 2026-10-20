package club.leanmuscle.boji.core.model

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

data class Exercise(
    val id: String,
    val name: String,
    val sets: Int,
    val reps: String,
    val tip: String,
    val icon: ExerciseIcon,
)

data class Workout(
    val id: String,
    val title: String,
    val subtitle: String,
    val minutes: Int,
    val level: String,
    val exercises: List<Exercise>,
) {
    val totalSets: Int get() = exercises.sumOf { it.sets }
}

/** Built-in courses. Content and IDs match `WorkoutLibrary` in ios/Boji/Models/BojiStore.swift. */
object WorkoutLibrary {
    val Home = Workout(
        id = "home-beginner",
        title = "居家基础训练",
        subtitle = "无需器械的全身入门",
        minutes = 20,
        level = "新手",
        exercises = listOf(
            Exercise("bodyweight-squat", "徒手深蹲", 3, "8–10 次", "膝盖朝脚尖方向，缓慢起身。", ExerciseIcon.Strength),
            Exercise("wall-push-up", "墙壁俯卧撑", 3, "8–10 次", "身体保持直线，双手稳稳撑墙。", ExerciseIcon.Walk),
            Exercise("glute-bridge", "臀桥", 3, "10–12 次", "脚掌踩稳，抬起时不要耸肩。", ExerciseIcon.Core),
            Exercise("bird-dog", "鸟狗式", 2, "每侧 8 次", "动作放慢，保持躯干稳定。", ExerciseIcon.Cooldown),
        ),
    )

    val HomeIntermediate = Workout(
        id = "home-intermediate",
        title = "居家进阶训练",
        subtitle = "基础训练之后的下一步",
        minutes = 25,
        level = "进阶",
        exercises = listOf(
            Exercise("reverse-lunge", "后撤步弓步蹲", 3, "每侧 8 次", "后撤一步再下蹲，前膝对准脚尖。", ExerciseIcon.Lunge),
            Exercise("knee-push-up", "跪姿俯卧撑", 3, "8–10 次", "膝盖到头保持一条直线，胸口慢慢下放。", ExerciseIcon.Strength),
            Exercise("dead-bug", "死虫式", 3, "每侧 6 次", "腰背贴住地面，对侧手脚慢慢伸出。", ExerciseIcon.Core),
            Exercise("wall-sit", "靠墙静蹲", 3, "20–30 秒", "背部贴墙，大腿与地面平行。", ExerciseIcon.Strength),
            Exercise("plank", "平板支撑", 3, "20–30 秒", "肘在肩正下方，身体保持一条直线。", ExerciseIcon.Core),
        ),
    )

    val Gym = Workout(
        id = "gym-beginner",
        title = "器械基础训练",
        subtitle = "轻重量熟悉常用器械",
        minutes = 30,
        level = "新手",
        exercises = listOf(
            Exercise("chest-press", "坐姿推胸", 3, "8–10 次", "选择轻重量，背部贴稳靠垫。", ExerciseIcon.Dumbbell),
            Exercise("seated-row", "坐姿划船", 3, "8–10 次", "拉向身体时保持肩部放松。", ExerciseIcon.Row),
            Exercise("leg-press", "坐姿腿举", 3, "10 次", "使用可控重量，膝盖不要锁死。", ExerciseIcon.Strength),
            Exercise("lat-pulldown", "高位下拉", 3, "8–10 次", "轻拉横杆，避免身体后仰。", ExerciseIcon.PullDown),
        ),
    )

    val Mobility = Workout(
        id = "mobility",
        title = "舒缓拉伸",
        subtitle = "训练前后都可进行",
        minutes = 10,
        level = "轻松",
        exercises = listOf(
            Exercise("cat-cow", "猫牛式", 2, "8 次", "配合呼吸，动作保持柔和。", ExerciseIcon.Flexibility),
            Exercise("hip-flexor-stretch", "髋屈肌拉伸", 2, "每侧 20 秒", "骨盆保持平稳，不要弹震。", ExerciseIcon.Lunge),
            Exercise("chest-stretch", "开胸拉伸", 2, "20 秒", "轻轻打开胸部，肩膀自然下沉。", ExerciseIcon.ArmsOpen),
        ),
    )

    val all: List<Workout> = listOf(Home, HomeIntermediate, Gym, Mobility)

    fun recommended(plan: PlanKind): Workout = when (plan) {
        PlanKind.Home -> Home
        PlanKind.Gym -> Gym
    }

    fun byId(id: String): Workout? = all.firstOrNull { it.id == id }
}
