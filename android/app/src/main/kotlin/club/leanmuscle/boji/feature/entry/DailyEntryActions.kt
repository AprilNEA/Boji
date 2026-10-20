package club.leanmuscle.boji.feature.entry

/** Saves the values of [DailyEntrySheet]. The view models of 今天 and 足迹 implement it. */
interface DailyEntryActions {
    /** Adds water for today. A negative value removes water. */
    fun addWater(ml: Int)

    fun setSleep(hours: Double)

    fun addBodyEntry(weight: Double, waist: Double)
}
