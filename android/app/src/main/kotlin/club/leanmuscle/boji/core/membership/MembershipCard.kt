package club.leanmuscle.boji.core.membership

import club.leanmuscle.boji.v1.Membership
import com.google.protobuf.Timestamp
import kotlinx.serialization.Serializable
import java.time.Instant

/**
 * A member card as the server returned it. The app stores it in the encrypted card cache.
 *
 * [memberNumber] is an opaque string: show it as it is, never convert or parse it
 * (docs/membership.md). [tier] and [state] keep the proto enum names, so that a value that this
 * version does not know stays visible as "unavailable" instead of failing to decode.
 */
@Serializable
data class MembershipCard(
    val name: String,
    val memberNumber: String,
    val nickname: String,
    val termsVersion: String,
    val tier: String,
    val state: String,
    val createTimeMillis: Long? = null,
    val expireTimeMillis: Long? = null,
    val entitlements: List<CardEntitlement> = emptyList(),
) {
    val createTime: Instant? get() = createTimeMillis?.let(Instant::ofEpochMilli)
    val expireTime: Instant? get() = expireTimeMillis?.let(Instant::ofEpochMilli)

    /** The order of the checks matches `MembershipCardCondition.resolve` on iOS. */
    fun condition(isOffline: Boolean, now: Instant): CardCondition {
        if (state == STATE_SUSPENDED) return CardCondition.SUSPENDED
        val expires = expireTime
        if (expires != null && !expires.isAfter(now)) return CardCondition.EXPIRED
        if (tier != TIER_COMMUNITY || state != STATE_ACTIVE) return CardCondition.UNAVAILABLE
        return if (isOffline) CardCondition.OFFLINE else CardCondition.ACTIVE
    }

    /**
     * Entitlements in effect at [now]. Unknown, expired or future entitlements unlock nothing
     * (docs/membership.md). The app shows them only; every current feature is free.
     */
    fun effectiveEntitlements(now: Instant): List<CardEntitlement> = entitlements.filter { it.isEffective(now) }

    companion object {
        const val TIER_COMMUNITY = "COMMUNITY"
        const val STATE_ACTIVE = "ACTIVE"
        const val STATE_SUSPENDED = "SUSPENDED"
    }
}

/** The display name and the description come from the server catalog. */
@Serializable
data class CardEntitlement(
    val code: String,
    val displayName: String,
    val description: String,
    val grantTimeMillis: Long? = null,
    val expireTimeMillis: Long? = null,
) {
    fun isEffective(now: Instant): Boolean {
        val granted = grantTimeMillis ?: return false
        if (Instant.ofEpochMilli(granted).isAfter(now)) return false
        val expires = expireTimeMillis ?: return true
        return Instant.ofEpochMilli(expires).isAfter(now)
    }
}

/** Card status lines. The titles match iOS: 已加入俱乐部, 离线副本, 会员卡已暂停, 会员卡已到期, 会员卡当前不可用. */
enum class CardCondition { ACTIVE, OFFLINE, SUSPENDED, EXPIRED, UNAVAILABLE }

fun Membership.toCard(): MembershipCard = MembershipCard(
    name = name,
    memberNumber = memberNumber,
    nickname = nickname,
    termsVersion = termsVersion,
    tier = tier.name,
    state = state.name,
    createTimeMillis = if (hasCreateTime()) createTime.toEpochMillis() else null,
    expireTimeMillis = if (hasExpireTime()) expireTime.toEpochMillis() else null,
    entitlements = entitlementsList.map { entitlement ->
        CardEntitlement(
            code = entitlement.code,
            displayName = entitlement.displayName,
            description = entitlement.description,
            grantTimeMillis = if (entitlement.hasGrantTime()) entitlement.grantTime.toEpochMillis() else null,
            expireTimeMillis = if (entitlement.hasExpireTime()) entitlement.expireTime.toEpochMillis() else null,
        )
    },
)

private fun Timestamp.toEpochMillis(): Long = Instant.ofEpochSecond(seconds, nanos.toLong()).toEpochMilli()
