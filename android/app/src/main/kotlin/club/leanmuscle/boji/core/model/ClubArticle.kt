package club.leanmuscle.boji.core.model

/** Color role of an article. The UI layer maps it to a theme color. */
enum class ArticleTone { Workout, Calm, Sleep }

/** Icon role of an article. The UI layer maps it to a drawable. */
enum class ArticleIcon { Strength, Meal, Rest }

data class ArticleSection(val title: String, val body: String)

data class ClubArticle(
    val id: Int,
    val title: String,
    val subtitle: String,
    val icon: ArticleIcon,
    val tone: ArticleTone,
    val sections: List<ArticleSection>,
)

/** Starter guide. Content and IDs match `ClubArticle.all` in ios/Boji/Views/ClubView.swift. */
object ClubArticles {
    val all: List<ClubArticle> = listOf(
        ClubArticle(
            id = 0,
            title = "第一次训练，不必用力过猛",
            subtitle = "训练起步 · 2 分钟阅读",
            icon = ArticleIcon.Strength,
            tone = ArticleTone.Workout,
            sections = listOf(
                ArticleSection("从能完成的量开始", "第一次的目标不是练到筋疲力尽，而是熟悉动作。选择轻负荷，保持呼吸。做不完时可以减少次数。"),
                ArticleSection("给恢复留出位置", "把力量训练分散到不同的日子。明显疲劳时休息，不用为了打卡补练。"),
                ArticleSection("不舒服就停下", "肌肉用力和疼痛并不相同。出现锐痛、头晕或胸部不适时立即停止，并按情况寻求专业帮助。"),
            ),
        ),
        ClubArticle(
            id = 1,
            title = "好好吃饭，比完美食谱重要",
            subtitle = "饮食日常 · 2 分钟阅读",
            icon = ArticleIcon.Meal,
            tone = ArticleTone.Calm,
            sections = listOf(
                ArticleSection("先吃得规律", "从规律吃饭开始，不用靠挨饿换取线条。为自己留出完整的一餐，比追求一份完美食谱更可持续。"),
                ArticleSection("让餐盘丰富一点", "主食、蔬菜和蛋白质食物都可以出现在餐盘里。根据口味和条件选择，不必购买特定补剂。"),
                ArticleSection("不把食物分成好坏", "偶尔的聚餐不会抹去你的努力。吃完不需要惩罚式运动。有疾病或特殊营养需求时，咨询专业人员。"),
            ),
        ),
        ClubArticle(
            id = 2,
            title = "休息，不是计划之外的事",
            subtitle = "恢复习惯 · 1 分钟阅读",
            icon = ArticleIcon.Rest,
            tone = ArticleTone.Sleep,
            sections = listOf(
                ArticleSection("留一个放松的夜晚", "尝试稳定的作息，睡前给自己一段不被工作打扰的时间。记录睡眠是为了了解自己，而不是完成分数。"),
                ArticleSection("今天不练，也可以", "疲劳时可以休息，或选择舒适的轻活动。休息不会让你失去俱乐部的入场券。"),
                ArticleSection("持续不适时求助", "如果睡眠或疲劳问题持续影响生活，寻求专业帮助。App 中的记录不是医学诊断。"),
            ),
        ),
    )

    fun byId(id: Int): ClubArticle? = all.firstOrNull { it.id == id }
}
