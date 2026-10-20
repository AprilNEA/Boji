package club.leanmuscle.boji.core.membership

import club.leanmuscle.boji.core.membership.MembershipRules.NicknameProblem
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class MembershipRulesTest {

    @Test
    fun trimsWhiteSpaceAsTheServerDoes() {
        assertEquals("小林", MembershipRules.normalizeNickname("  小林\n"))
        assertNull(MembershipRules.nicknameProblem("  小林  "))
    }

    @Test
    fun emptyNicknameIsRejected() {
        assertEquals(NicknameProblem.EMPTY, MembershipRules.nicknameProblem(""))
        assertEquals(NicknameProblem.EMPTY, MembershipRules.nicknameProblem(" \t "))
    }

    @Test
    fun lengthCountsUnicodeScalarValues() {
        val max = MembershipRules.NICKNAME_MAX_LENGTH
        assertNull(MembershipRules.nicknameProblem("练".repeat(max)))
        assertEquals(NicknameProblem.TOO_LONG, MembershipRules.nicknameProblem("练".repeat(max + 1)))
        // An emoji outside the BMP is two UTF-16 units but one scalar value.
        assertNull(MembershipRules.nicknameProblem("💪".repeat(max)))
        assertEquals(NicknameProblem.TOO_LONG, MembershipRules.nicknameProblem("💪".repeat(max + 1)))
    }

    @Test
    fun invisibleAndControlCharactersAreRejected() {
        for (raw in listOf("小\u200B林", "小\u200D林", "小\u0007林", "小\n林", "小\u2028林", "小\u2029林", "\uFEFF小林")) {
            assertEquals(raw, NicknameProblem.INVISIBLE_OR_CONTROL, MembershipRules.nicknameProblem(raw))
        }
    }

    @Test
    fun pledgeIdsMatchIos() {
        assertEquals(listOf("belonging", "pace", "privacy"), MembershipRules.PLEDGES.map { it.id })
        assertEquals("community-v1", MembershipRules.TERMS_VERSION)
    }
}
