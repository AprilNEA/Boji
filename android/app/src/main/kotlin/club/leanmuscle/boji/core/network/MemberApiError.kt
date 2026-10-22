package club.leanmuscle.boji.core.network

import com.connectrpc.Code
import io.github.betterauth.client.result.BetterAuthError
import io.github.betterauth.client.result.BetterAuthResult

/**
 * Failures of the member service. The cases match `MembershipAPIError` on iOS, plus [Rpc] for the
 * Connect API, which reports a Connect code and an `ErrorReason` name instead of an HTTP status.
 */
sealed class MemberApiError(cause: Throwable? = null) : Exception(cause) {

    /** The build has no member service URL. */
    data object NotConfigured : MemberApiError()

    /** The response did not match the contract, for example a missing token header. */
    data object InvalidResponse : MemberApiError()

    /** The request did not reach the server or the response did not arrive. */
    class Network(cause: Throwable? = null) : MemberApiError(cause)

    /** A Better Auth error (an endpoint under `/api/auth/`): the HTTP status and the `code` of the JSON body. */
    data class Http(val status: Int, val code: String?) : MemberApiError()

    /**
     * A Connect error. [reason] is the `ErrorInfo.reason` of the `boji.leanmuscle.club` domain, or null.
     * Branch on [reason] first. For an unknown reason, branch on [code] only.
     */
    data class Rpc(val code: Code, val reason: String?) : MemberApiError()
}

/** True when the session is missing, invalid, expired or revoked. */
val MemberApiError.isUnauthenticated: Boolean
    get() = (this is MemberApiError.Http && status == 401) ||
        (this is MemberApiError.Rpc && code == Code.UNAUTHENTICATED)

/** True when the account must verify its email address first. */
val MemberApiError.isEmailNotVerified: Boolean
    get() = (this is MemberApiError.Http && status == 403 && code == "EMAIL_NOT_VERIFIED") ||
        (this is MemberApiError.Rpc && code == Code.PERMISSION_DENIED && reason == "EMAIL_NOT_VERIFIED")

/** True for any other denial of the account. */
val MemberApiError.isForbidden: Boolean
    get() = (this is MemberApiError.Http && status == 403) ||
        (this is MemberApiError.Rpc && code == Code.PERMISSION_DENIED)

/** True when the server rate-limits the client. */
val MemberApiError.isRateLimited: Boolean
    get() = (this is MemberApiError.Http && status == 429) ||
        (this is MemberApiError.Rpc && code == Code.RESOURCE_EXHAUSTED)

/** The Better Auth error code, or the Connect error reason. */
val MemberApiError.serverCode: String?
    get() = when (this) {
        is MemberApiError.Http -> code
        is MemberApiError.Rpc -> reason
        else -> null
    }

/**
 * Returns the value of a better-auth-kotlin-client call, or throws its failure as a [MemberApiError],
 * so that Better Auth and Connect errors share one handling. Cancellation still propagates.
 */
fun <T> BetterAuthResult<T>.getOrThrowMemberError(): T = when (this) {
    is BetterAuthResult.Success -> value
    is BetterAuthResult.Failure -> throw when (val error = error) {
        is BetterAuthError.Api -> MemberApiError.Http(error.status, error.code)
        is BetterAuthError.Network -> MemberApiError.Network(error.cause)
        // Includes an authenticated response without the `set-auth-token` header.
        is BetterAuthError.Decoding -> MemberApiError.InvalidResponse
    }
}
