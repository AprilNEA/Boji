package club.leanmuscle.boji.core.membership

import java.nio.ByteBuffer
import java.time.Instant
import java.util.Objects
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

/**
 * The member code of one card: the static value of the Wallet pass, and the dynamic code that the app
 * shows and changes every [period] seconds. Mirrors `MembershipCode` on iOS.
 *
 * The dynamic code is RFC 6238 TOTP with HMAC-SHA1, computed on the device. The digits and the period
 * come from the server. The secret is a credential: it stays in memory and never goes to the card
 * cache, logs or share images. [toString] leaves it out.
 */
class MembershipCode(
    /** The card ID that these values belong to: the last segment of [MembershipCard.name]. */
    val membershipId: String,
    /** The content of the Wallet pass QR code. The app does not parse it. */
    val staticValue: String,
    /** The part of the dynamic code before the digits. The app does not parse it. */
    val dynamicValuePrefix: String,
    secret: ByteArray,
    val digits: Int,
    /** The length of one time step in seconds. */
    val period: Int,
) {
    private val secret: ByteArray = secret.copyOf()

    init {
        require(digits in ALLOWED_DIGITS) { "digits out of range" }
        require(period in 1..MAXIMUM_PERIOD_SECONDS) { "period out of range" }
        require(this.secret.size >= MINIMUM_SECRET_BYTES) { "secret too short" }
    }

    /** The time step of [at], counted from the Unix epoch. */
    fun step(at: Instant): Long = Math.floorDiv(at.epochSecond, period.toLong())

    /** The seconds until the current step ends, from 1 to [period]. */
    fun secondsRemaining(at: Instant): Int =
        (period - Math.floorMod(at.epochSecond, period.toLong()).toInt()).coerceAtLeast(1)

    /** The QR code content at [at]: the prefix and the TOTP digits. */
    fun dynamicValue(at: Instant): String = dynamicValuePrefix + totp(step(at))

    /** The RFC 4226 HOTP value of [step], padded with zeros on the left to [digits] digits. */
    fun totp(step: Long): String {
        val mac = Mac.getInstance(ALGORITHM)
        mac.init(SecretKeySpec(secret, ALGORITHM))
        val hash = mac.doFinal(ByteBuffer.allocate(Long.SIZE_BYTES).putLong(step).array())
        val offset = hash.last().toInt() and 0x0f
        val binary = ((hash[offset].toInt() and 0x7f) shl 24) or
            ((hash[offset + 1].toInt() and 0xff) shl 16) or
            ((hash[offset + 2].toInt() and 0xff) shl 8) or
            (hash[offset + 3].toInt() and 0xff)
        var modulus = 1L
        repeat(digits) { modulus *= 10 }
        return (binary.toLong() % modulus).toString().padStart(digits, '0')
    }

    override fun equals(other: Any?): Boolean =
        other is MembershipCode &&
            membershipId == other.membershipId &&
            staticValue == other.staticValue &&
            dynamicValuePrefix == other.dynamicValuePrefix &&
            digits == other.digits &&
            period == other.period &&
            secret.contentEquals(other.secret)

    override fun hashCode(): Int =
        Objects.hash(membershipId, staticValue, dynamicValuePrefix, digits, period, secret.contentHashCode())

    override fun toString(): String = "MembershipCode(membershipId=$membershipId, digits=$digits, period=$period)"

    companion object {
        /** RFC 4226 requires at least 6 digits. The HOTP truncation gives at most 10. */
        val ALLOWED_DIGITS: IntRange = 6..10

        /** RFC 4226 requires a shared secret of at least 128 bits. */
        const val MINIMUM_SECRET_BYTES = 16

        /** The longest step that the app accepts from the server. */
        const val MAXIMUM_PERIOD_SECONDS = 300

        private const val ALGORITHM = "HmacSHA1"
    }
}

/**
 * The card ID: the last segment of `users/{user}/memberships/{membership}`, or null when [MembershipCard.name]
 * has another form.
 */
val MembershipCard.membershipId: String?
    get() {
        val segments = name.split('/')
        if (segments.size != 4 || segments[0] != "users" || segments[2] != "memberships") return null
        return segments[3].takeIf { it.isNotEmpty() }
    }
