package club.leanmuscle.boji.core.network

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

/**
 * Better Auth endpoints of bizserver, under `/api/auth/`. They are JSON endpoints outside the proto
 * contract, so this interface is hand-written. The paths and bodies match `BetterAuthClient` on iOS.
 *
 * Every method returns [Response], so that [BetterAuthClient] can read the status, the error body and
 * the `set-auth-token` header. The `authorization` argument is `Bearer <token>`.
 */
interface BetterAuthApi {

    @POST("api/auth/sign-in/email")
    suspend fun signInEmail(@Body body: SignInRequest): Response<Unit>

    @POST("api/auth/sign-up/email")
    suspend fun signUpEmail(@Body body: SignUpRequest): Response<Unit>

    @POST("api/auth/send-verification-email")
    suspend fun sendVerificationEmail(@Body body: EmailRequest): Response<Unit>

    @POST("api/auth/request-password-reset")
    suspend fun requestPasswordReset(@Body body: EmailRequest): Response<Unit>

    @POST("api/auth/sign-out")
    suspend fun signOut(@Header("Authorization") authorization: String, @Body body: EmptyRequest): Response<Unit>

    /** The body is `null` when the token has no session. */
    @GET("api/auth/get-session")
    suspend fun getSession(@Header("Authorization") authorization: String): Response<JsonElement>

    @POST("api/auth/change-password")
    suspend fun changePassword(
        @Header("Authorization") authorization: String,
        @Body body: ChangePasswordRequest,
    ): Response<Unit>

    @POST("api/auth/revoke-other-sessions")
    suspend fun revokeOtherSessions(
        @Header("Authorization") authorization: String,
        @Body body: EmptyRequest,
    ): Response<StatusResponse>

    /**
     * Account deletion has two steps with the same session. `{}` emails a confirmation code to the
     * account; `{"token":"<code>"}` deletes the account. See bizserver/docs/migration-auth.md.
     */
    @POST("api/auth/delete-user")
    suspend fun requestAccountDeletion(
        @Header("Authorization") authorization: String,
        @Body body: EmptyRequest,
    ): Response<SuccessResponse>

    @POST("api/auth/delete-user")
    suspend fun deleteAccount(
        @Header("Authorization") authorization: String,
        @Body body: DeleteAccountRequest,
    ): Response<SuccessResponse>
}

@Serializable
data class SignInRequest(val email: String, val password: String)

@Serializable
data class SignUpRequest(val name: String, val email: String, val password: String)

@Serializable
data class EmailRequest(val email: String)

/** Changing the password always signs out the other sessions, as on iOS. */
@Serializable
data class ChangePasswordRequest(
    val currentPassword: String,
    val newPassword: String,
    val revokeOtherSessions: Boolean,
)

/** Encodes as `{}`. */
@Serializable
data object EmptyRequest

@Serializable
data class StatusResponse(val status: Boolean)

/** [token] is the confirmation code from the deletion email. */
@Serializable
data class DeleteAccountRequest(val token: String)

@Serializable
data class SuccessResponse(val success: Boolean)

@Serializable
data class SessionResponse(val session: SessionBody, val user: UserBody)

@Serializable
data class SessionBody(val userId: String, val expiresAt: String, val createdAt: String? = null)

@Serializable
data class UserBody(
    val id: String,
    val email: String,
    val name: String = "",
    val emailVerified: Boolean = false,
)
