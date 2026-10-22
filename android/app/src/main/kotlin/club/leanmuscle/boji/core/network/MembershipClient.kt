package club.leanmuscle.boji.core.network

import club.leanmuscle.boji.admin.v1.MembershipCodeKind
import club.leanmuscle.boji.admin.v1.VerifyMembershipCodeResponse
import club.leanmuscle.boji.admin.v1.verifyMembershipCodeRequest
import club.leanmuscle.boji.core.membership.MembershipCode
import club.leanmuscle.boji.core.membership.MembershipVerification
import club.leanmuscle.boji.core.membership.toCard
import club.leanmuscle.boji.v1.Membership
import club.leanmuscle.boji.v1.MembershipCodeServiceClientInterface
import club.leanmuscle.boji.v1.MembershipServiceClientInterface
import club.leanmuscle.boji.v1.createMembershipRequest
import club.leanmuscle.boji.v1.getMembershipCodeRequest
import club.leanmuscle.boji.v1.listMembershipsRequest
import club.leanmuscle.boji.v1.membership
import com.connectrpc.Code
import com.connectrpc.ConnectException
import com.connectrpc.Headers
import com.connectrpc.ResponseMessage
import com.google.rpc.ErrorInfo
import java.io.IOException
import club.leanmuscle.boji.admin.v1.MembershipCodeServiceClientInterface as StaffCodeServiceClientInterface
import club.leanmuscle.boji.v1.MembershipCode as RpcMembershipCode

/**
 * `boji.v1` calls for the signed-in user: `MembershipService` and `MembershipCodeService`. [verify]
 * calls `boji.admin.v1.MembershipCodeService` for staff.
 * Every failure is a [MemberApiError].
 * See bizserver/docs/connectrpc-api.md for the resource names and the error model.
 */
class MembershipClient(
    private val service: MembershipServiceClientInterface,
    private val codes: MembershipCodeServiceClientInterface,
    private val staffCodes: StaffCodeServiceClientInterface,
) {

    /** Returns the card of the user, or null before the user claims one. */
    suspend fun current(token: String): Membership? {
        val request = listMembershipsRequest { parent = CURRENT_USER }
        return rpc { service.listMemberships(request, authorization(token)) }.membershipsList.firstOrNull()
    }

    /** Claims the free community card. The server assigns the number, the dates and the state. */
    suspend fun create(token: String, cardNickname: String, acceptedTermsVersion: String): Membership {
        val card = membership {
            nickname = cardNickname
            termsVersion = acceptedTermsVersion
        }
        val request = createMembershipRequest {
            parent = CURRENT_USER
            membership = card
        }
        return rpc { service.createMembership(request, authorization(token)) }
    }

    /**
     * Returns the member code of the card [membershipId]: the static value and the TOTP parameters.
     * @throws MemberApiError.InvalidResponse when the response belongs to another card or has
     *   parameters outside the limits of [MembershipCode].
     */
    suspend fun code(token: String, membershipId: String): MembershipCode {
        if (membershipId.isEmpty() || '/' in membershipId) throw MemberApiError.InvalidResponse
        val request = getMembershipCodeRequest { name = "$CURRENT_USER/memberships/$membershipId/code" }
        return rpc { codes.getMembershipCode(request, authorization(token)) }.toMembershipCode(membershipId)
    }

    /**
     * Verifies a scanned or typed member code for staff. bizserver checks the operator role on every call.
     * @throws MemberApiError.InvalidResponse when the response has no card or an unknown code kind.
     */
    suspend fun verify(token: String, code: String): MembershipVerification {
        val request = verifyMembershipCodeRequest { this.code = code }
        return rpc { staffCodes.verifyMembershipCode(request, authorization(token)) }.toVerification()
    }

    private suspend fun <T> rpc(call: suspend () -> ResponseMessage<T>): T = connectCall(call)

    private fun authorization(token: String): Headers =
        mapOf("authorization" to listOf("Bearer $token"))

    companion object {
        /** The parent of the caller's own resources. */
        const val CURRENT_USER = "users/me"

        /** `ErrorInfo.domain` of every bizserver error. */
        const val ERROR_DOMAIN = "boji.leanmuscle.club"
    }
}

/** Runs one unary Connect call. Every failure is a [MemberApiError]. */
internal suspend fun <T> connectCall(call: suspend () -> ResponseMessage<T>): T {
    val response = try {
        call()
    } catch (e: IOException) {
        throw MemberApiError.Network(e)
    }
    return when (response) {
        is ResponseMessage.Success -> response.message
        is ResponseMessage.Failure -> throw response.cause.toMemberApiError()
    }
}

/**
 * Converts the bizserver `MembershipCode` and checks the TOTP parameters, as `MembershipCode(rpc:)` on iOS.
 * The name must belong to the requested card, so that the app never shows the code of another card.
 */
internal fun RpcMembershipCode.toMembershipCode(membershipId: String): MembershipCode {
    val segments = name.split('/')
    val period = totp.period
    val valid = segments.size == 5 &&
        segments[0] == "users" &&
        segments[2] == "memberships" &&
        segments[3] == membershipId &&
        segments[4] == "code" &&
        staticValue.isNotEmpty() &&
        dynamicValuePrefix.isNotEmpty() &&
        hasTotp() &&
        totp.secret.size() >= MembershipCode.MINIMUM_SECRET_BYTES &&
        totp.digits in MembershipCode.ALLOWED_DIGITS &&
        totp.hasPeriod() &&
        period.seconds in 1..MembershipCode.MAXIMUM_PERIOD_SECONDS.toLong() &&
        period.nanos == 0
    if (!valid) throw MemberApiError.InvalidResponse
    return MembershipCode(
        membershipId = membershipId,
        staticValue = staticValue,
        dynamicValuePrefix = dynamicValuePrefix,
        secret = totp.secret.toByteArray(),
        digits = totp.digits,
        period = period.seconds.toInt(),
    )
}

/** Converts the staff verification, as `verifyMembershipCode(_:token:)` on iOS. */
internal fun VerifyMembershipCodeResponse.toVerification(): MembershipVerification {
    val kind = when (codeKind) {
        MembershipCodeKind.MEMBERSHIP_CODE_KIND_STATIC -> MembershipVerification.Kind.WALLET_PASS
        MembershipCodeKind.MEMBERSHIP_CODE_KIND_DYNAMIC -> MembershipVerification.Kind.APP
        else -> throw MemberApiError.InvalidResponse
    }
    if (!hasMembership() || membership.name.isEmpty() || membership.memberNumber.isEmpty()) {
        throw MemberApiError.InvalidResponse
    }
    return MembershipVerification(card = membership.toCard(), kind = kind)
}

/**
 * Reads the single `ErrorInfo` detail. A failure without that detail and with a transport code
 * (`unavailable`, `deadline_exceeded`) or an I/O cause is a network failure.
 */
internal fun ConnectException.toMemberApiError(): MemberApiError {
    val info = runCatching { unpackedDetails(ErrorInfo::class) }
        .getOrDefault(emptyList())
        .firstOrNull { it.domain == MembershipClient.ERROR_DOMAIN }
    val transportFailure = exception is IOException || code == Code.UNAVAILABLE || code == Code.DEADLINE_EXCEEDED
    if (info == null && transportFailure) return MemberApiError.Network(this)
    return MemberApiError.Rpc(code, info?.reason?.takeIf { it.isNotEmpty() })
}
