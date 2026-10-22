package club.leanmuscle.boji.core.network

import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive
import retrofit2.Response
import java.io.IOException
import java.time.Clock
import java.time.Instant
import java.time.format.DateTimeParseException

/** A Better Auth session that [BetterAuthClient.getSession] has checked. */
data class AuthSession(
    val userId: String,
    val email: String,
    val name: String,
    val emailVerified: Boolean,
    val createdAt: Instant?,
    val expiresAt: Instant,
)

/**
 * Better Auth calls with the error handling of `BojiHTTPClient` on iOS. Every failure is a
 * [MemberApiError]. Cancellation still propagates.
 */
class BetterAuthClient(
    private val api: BetterAuthApi,
    private val json: Json,
    private val clock: Clock,
) {

    /** Returns the session token from the `set-auth-token` header. */
    suspend fun signIn(email: String, password: String): String {
        val response = call { api.signInEmail(SignInRequest(email, password)) }
        return response.authToken() ?: throw MemberApiError.InvalidResponse
    }

    /** Signs in with a provider ID token. Returns the session token from the `set-auth-token` header. */
    suspend fun signInWithIdToken(provider: String, idToken: String, nonce: String): String {
        val response = call { api.signInSocial(SocialSignInRequest(provider, IdTokenBody(idToken, nonce))) }
        return response.authToken() ?: throw MemberApiError.InvalidResponse
    }

    suspend fun register(name: String, email: String, password: String) {
        call { api.signUpEmail(SignUpRequest(name, email, password)) }
    }

    suspend fun sendVerification(email: String) {
        call { api.sendVerificationEmail(EmailRequest(email)) }
    }

    suspend fun requestPasswordReset(email: String) {
        call { api.requestPasswordReset(EmailRequest(email)) }
    }

    suspend fun signOut(token: String) {
        call { api.signOut(bearer(token), EmptyRequest) }
    }

    /** Returns null when the token has no session or the session has expired. */
    suspend fun getSession(token: String): AuthSession? {
        val body = call { api.getSession(bearer(token)) }.body() ?: throw MemberApiError.InvalidResponse
        if (body is JsonNull) return null
        val decoded = try {
            json.decodeFromJsonElement(SessionResponse.serializer(), body)
        } catch (e: SerializationException) {
            throw MemberApiError.InvalidResponse
        } catch (e: IllegalArgumentException) {
            throw MemberApiError.InvalidResponse
        }
        if (decoded.user.id != decoded.session.userId) throw MemberApiError.InvalidResponse
        val expiresAt = parseInstant(decoded.session.expiresAt) ?: throw MemberApiError.InvalidResponse
        if (!expiresAt.isAfter(clock.instant())) return null
        return AuthSession(
            userId = decoded.user.id,
            email = decoded.user.email,
            name = decoded.user.name,
            emailVerified = decoded.user.emailVerified,
            createdAt = decoded.session.createdAt?.let(::parseInstant),
            expiresAt = expiresAt,
        )
    }

    /** Returns the new session token, or null when the server did not send one. */
    suspend fun changePassword(currentPassword: String, newPassword: String, token: String): String? {
        val request = ChangePasswordRequest(currentPassword, newPassword, revokeOtherSessions = true)
        return call { api.changePassword(bearer(token), request) }.authToken()
    }

    suspend fun revokeOtherSessions(token: String) {
        val status = call { api.revokeOtherSessions(bearer(token), EmptyRequest) }.body()?.status
        if (status != true) throw MemberApiError.InvalidResponse
    }

    /** Emails a confirmation code for deleting the account of [token]. */
    suspend fun requestAccountDeletion(token: String) {
        val success = call { api.requestAccountDeletion(bearer(token), EmptyRequest) }.body()?.success
        if (success != true) throw MemberApiError.InvalidResponse
    }

    /** Deletes the account of [token]. The server ends every session of the account. */
    suspend fun deleteAccount(code: String, token: String) {
        val success = call { api.deleteAccount(bearer(token), DeleteAccountRequest(code)) }.body()?.success
        if (success != true) throw MemberApiError.InvalidResponse
    }

    private suspend fun <T> call(request: suspend () -> Response<T>): Response<T> {
        val response = try {
            request()
        } catch (e: IOException) {
            throw MemberApiError.Network(e)
        } catch (e: SerializationException) {
            throw MemberApiError.InvalidResponse
        }
        if (!response.isSuccessful) throw MemberApiError.Http(response.code(), response.errorCode())
        return response
    }

    /** Reads `code` from a Better Auth error body such as `{"code":"EMAIL_NOT_VERIFIED","message":"..."}`. */
    private fun Response<*>.errorCode(): String? = try {
        val text = errorBody()?.string().orEmpty()
        (json.parseToJsonElement(text) as? JsonObject)?.get("code")?.jsonPrimitive?.contentOrNull
    } catch (e: IOException) {
        null
    } catch (e: IllegalArgumentException) {
        // Includes SerializationException for a body that is not JSON.
        null
    }

    private fun Response<*>.authToken(): String? = headers()[AUTH_TOKEN_HEADER]?.takeIf { it.isNotBlank() }

    private fun parseInstant(value: String): Instant? = try {
        Instant.parse(value)
    } catch (e: DateTimeParseException) {
        null
    }

    companion object {
        /** The Better Auth bearer plugin returns the session token in this header. */
        const val AUTH_TOKEN_HEADER = "set-auth-token"

        fun bearer(token: String): String = "Bearer $token"
    }
}
