package club.leanmuscle.boji.core.membership

import club.leanmuscle.boji.v1.Membership
import com.google.protobuf.Timestamp
import java.time.Instant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class MembershipCardTest {

    private val now = Instant.parse("2026-10-20T08:00:00Z")
    private val day = 86_400_000L

    private fun card(
        tier: String = MembershipCard.TIER_COMMUNITY,
        state: String = MembershipCard.STATE_ACTIVE,
        expireTimeMillis: Long? = null,
        entitlements: List<CardEntitlement> = emptyList(),
    ) = MembershipCard(
        name = "users/u1/memberships/m1",
        memberNumber = "000042",
        nickname = "小林",
        termsVersion = MembershipRules.TERMS_VERSION,
        tier = tier,
        state = state,
        createTimeMillis = now.toEpochMilli() - day,
        expireTimeMillis = expireTimeMillis,
        entitlements = entitlements,
    )

    @Test
    fun activeCardIsActiveOnlineAndOfflineCopyOtherwise() {
        assertEquals(CardCondition.ACTIVE, card().condition(isOffline = false, now = now))
        assertEquals(CardCondition.OFFLINE, card().condition(isOffline = true, now = now))
    }

    @Test
    fun suspendedWinsOverExpired() {
        val suspendedAndExpired = card(state = MembershipCard.STATE_SUSPENDED, expireTimeMillis = now.toEpochMilli() - day)
        assertEquals(CardCondition.SUSPENDED, suspendedAndExpired.condition(isOffline = false, now = now))
    }

    @Test
    fun expiredAtTheExactExpireTime() {
        assertEquals(CardCondition.EXPIRED, card(expireTimeMillis = now.toEpochMilli()).condition(false, now))
        assertEquals(CardCondition.ACTIVE, card(expireTimeMillis = now.toEpochMilli() + 1).condition(false, now))
    }

    @Test
    fun unknownTierOrStateIsUnavailable() {
        assertEquals(CardCondition.UNAVAILABLE, card(tier = "UNRECOGNIZED").condition(false, now))
        assertEquals(CardCondition.UNAVAILABLE, card(state = "STATE_UNSPECIFIED").condition(false, now))
        // Offline does not hide an unknown value.
        assertEquals(CardCondition.UNAVAILABLE, card(tier = "TIER_UNSPECIFIED").condition(true, now))
    }

    @Test
    fun onlyGrantedAndUnexpiredEntitlementsAreEffective() {
        val millis = now.toEpochMilli()
        val entitlements = listOf(
            CardEntitlement("open", "开放", "", grantTimeMillis = millis - day),
            CardEntitlement("bounded", "有期限", "", grantTimeMillis = millis - day, expireTimeMillis = millis + day),
            CardEntitlement("expired", "已到期", "", grantTimeMillis = millis - 2 * day, expireTimeMillis = millis),
            CardEntitlement("future", "未开始", "", grantTimeMillis = millis + 1),
            CardEntitlement("ungranted", "无开始时间", ""),
        )
        val effective = card(entitlements = entitlements).effectiveEntitlements(now).map { it.code }
        assertEquals(listOf("open", "bounded"), effective)
    }

    @Test
    fun protoConversionKeepsTheMemberNumberAsAnOpaqueString() {
        val proto = Membership.newBuilder()
            .setName("users/u1/memberships/m1")
            .setMemberNumber("000042")
            .setNickname("小林")
            .setTermsVersion(MembershipRules.TERMS_VERSION)
            .setTier(Membership.Tier.COMMUNITY)
            .setState(Membership.State.ACTIVE)
            .setCreateTime(Timestamp.newBuilder().setSeconds(1_760_000_000).setNanos(250_000_000))
            .addEntitlements(
                Membership.EffectiveEntitlement.newBuilder()
                    .setCode("community.badge")
                    .setDisplayName("社区徽章")
                    .setDescription("在会员卡上显示")
                    .setGrantTime(Timestamp.newBuilder().setSeconds(1_760_000_000)),
            )
            .build()

        val card = proto.toCard()

        assertEquals("000042", card.memberNumber)
        assertEquals("COMMUNITY", card.tier)
        assertEquals("ACTIVE", card.state)
        assertEquals(1_760_000_000_250L, card.createTimeMillis)
        assertNull(card.expireTimeMillis)
        assertEquals("社区徽章", card.entitlements.single().displayName)
        assertNull(card.entitlements.single().expireTimeMillis)
    }

    @Test
    fun protoValueThatThisVersionDoesNotKnowStaysVisibleAsUnavailable() {
        val proto = Membership.newBuilder()
            .setMemberNumber("A-7")
            .setTierValue(99)
            .setState(Membership.State.ACTIVE)
            .build()

        val card = proto.toCard()

        assertEquals("UNRECOGNIZED", card.tier)
        assertEquals(CardCondition.UNAVAILABLE, card.condition(isOffline = false, now = now))
    }
}
