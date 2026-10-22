package club.leanmuscle.boji.core.network

import club.leanmuscle.boji.v1.Membership
import club.leanmuscle.boji.v1.MembershipServiceClientInterface
import club.leanmuscle.boji.v1.createMembershipRequest
import club.leanmuscle.boji.v1.listMembershipsRequest
import club.leanmuscle.boji.v1.membership
import com.connectrpc.Code
import com.connectrpc.ConnectException
import com.connectrpc.Headers
import com.connectrpc.ResponseMessage
import com.google.rpc.ErrorInfo
import java.io.IOException

/**
 * `boji.v1.MembershipService` calls for the signed-in user. Every failure is a [MemberApiError].
 * See bizserver/docs/connectrpc-api.md for the resource names and the error model.
 */
class MembershipClient(private val service: MembershipServiceClientInterface) {

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
