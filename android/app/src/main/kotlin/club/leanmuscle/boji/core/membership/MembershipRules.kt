package club.leanmuscle.boji.core.membership

/** Rules for claiming the free community card. */
object MembershipRules {

    /** The terms version that the app shows and sends. bizserver accepts `community-v1`. */
    const val TERMS_VERSION = "community-v1"

    /**
     * The limit of the iOS form. iOS counts characters; Android counts Unicode scalar values, which
     * the server also counts (1 to 40). A nickname that passes here always passes on the server.
     */
    const val NICKNAME_MAX_LENGTH = 24

    /** The three pledges. Every pledge must be confirmed. IDs match `MembershipPledge.all` on iOS. */
    val PLEDGES: List<Pledge> = listOf(Pledge.BELONGING, Pledge.PACE, Pledge.PRIVACY)

    /** Removes leading and trailing white space, as the server does. */
    fun normalizeNickname(raw: String): String = raw.trim()

    /** Returns null when the nickname is valid. */
    fun nicknameProblem(raw: String): NicknameProblem? {
        val nickname = normalizeNickname(raw)
        if (nickname.isEmpty()) return NicknameProblem.EMPTY
        if (nickname.codePointCount(0, nickname.length) > NICKNAME_MAX_LENGTH) return NicknameProblem.TOO_LONG
        if (nickname.codePoints().anyMatch(::isForbidden)) return NicknameProblem.INVISIBLE_OR_CONTROL
        return null
    }

    /** Control, format (for example zero-width joiners) and line or paragraph separators. */
    private fun isForbidden(codePoint: Int): Boolean = when (Character.getType(codePoint)) {
        Character.CONTROL.toInt(),
        Character.FORMAT.toInt(),
        Character.LINE_SEPARATOR.toInt(),
        Character.PARAGRAPH_SEPARATOR.toInt(),
        -> true
        else -> false
    }

    enum class Pledge(val id: String) { BELONGING("belonging"), PACE("pace"), PRIVACY("privacy") }

    enum class NicknameProblem { EMPTY, TOO_LONG, INVISIBLE_OR_CONTROL }
}
