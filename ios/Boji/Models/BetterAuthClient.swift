import Foundation

struct BetterAuthClient: Sendable {
    private struct SignUpRequest: Encodable {
        let name: String
        let email: String
        let password: String
    }

    private struct SignInRequest: Encodable {
        let email: String
        let password: String
    }

    private struct EmailRequest: Encodable {
        let email: String
    }

    private struct AppleSignInRequest: Encodable {
        let provider = "apple"
        let idToken: AppleIdentity
    }

    private struct ChangePasswordRequest: Encodable {
        let currentPassword: String
        let newPassword: String
        let revokeOtherSessions = true
    }

    /// Better Auth requires an empty object, not a missing or null request body,
    /// when it sends the account-deletion confirmation code.
    private struct AccountDeletionRequest: Encodable {}

    private struct AccountDeletionConfirmationRequest: Encodable {
        let token: String
    }

    /// `better-auth = 1.0.0-alpha.4` returns this exact native response shape.
    private struct AccountDeletionResponse: Decodable {
        let success: Bool
        let message: String
    }

    private struct RevokeOtherSessionsResponse: Decodable {
        let status: Bool
    }

    private let httpClient: BojiHTTPClient

    init(configuration: MembershipServiceConfiguration?, transport: any MembershipTransport) {
        httpClient = BojiHTTPClient(configuration: configuration, transport: transport)
    }

    init(httpClient: BojiHTTPClient) {
        self.httpClient = httpClient
    }

    func signIn(email: String, password: String) async throws -> String {
        let body = try httpClient.encodedBody(SignInRequest(email: email, password: password))
        let response = try await httpClient.perform(
            path: "api/auth/sign-in/email",
            method: "POST",
            body: body
        )
        return try authenticationToken(from: response)
    }

    func signInWithApple(_ identity: AppleIdentity) async throws -> String {
        let body = try httpClient.encodedBody(AppleSignInRequest(idToken: identity))
        let response = try await httpClient.perform(
            path: "api/auth/sign-in/social",
            method: "POST",
            body: body
        )
        return try authenticationToken(from: response)
    }

    func register(name: String, email: String, password: String) async throws {
        let body = try httpClient.encodedBody(SignUpRequest(name: name, email: email, password: password))
        _ = try await httpClient.perform(path: "api/auth/sign-up/email", method: "POST", body: body)
    }

    func sendVerification(email: String) async throws {
        let body = try httpClient.encodedBody(EmailRequest(email: email))
        _ = try await httpClient.perform(
            path: "api/auth/send-verification-email",
            method: "POST",
            body: body
        )
    }

    func requestPasswordReset(email: String) async throws {
        let body = try httpClient.encodedBody(EmailRequest(email: email))
        _ = try await httpClient.perform(
            path: "api/auth/request-password-reset",
            method: "POST",
            body: body
        )
    }

    func signOut(token: String) async throws {
        _ = try await httpClient.perform(
            path: "api/auth/sign-out",
            method: "POST",
            token: token,
            body: Data("{}".utf8)
        )
    }

    /// Starts native account deletion by asking Better Auth to email a confirmation code.
    func requestAccountDeletion(token: String) async throws {
        let body = try httpClient.encodedBody(AccountDeletionRequest())
        let response = try await httpClient.perform(
            path: "api/auth/delete-user",
            method: "POST",
            token: token,
            body: body
        )
        try validateAccountDeletion(response, expectedMessage: "Verification email sent")
    }

    /// Confirms native account deletion with the opaque code from the account email.
    func confirmAccountDeletion(code: String, token: String) async throws {
        let body = try httpClient.encodedBody(AccountDeletionConfirmationRequest(token: code))
        let response = try await httpClient.perform(
            path: "api/auth/delete-user",
            method: "POST",
            token: token,
            body: body
        )
        try validateAccountDeletion(response, expectedMessage: "User deleted")
    }

    func getSession(token: String) async throws -> BetterAuthSession? {
        let response = try await httpClient.perform(
            path: "api/auth/get-session",
            method: "GET",
            token: token
        )
        let session: BetterAuthSession?
        do {
            session = try MembershipDateCoding.decoder().decode(BetterAuthSession?.self, from: response.data)
        } catch {
            throw MembershipAPIError.invalidResponse
        }
        guard let session else { return nil }
        guard session.user.id == session.session.userId else {
            throw MembershipAPIError.invalidResponse
        }
        guard session.session.expiresAt > Date() else { return nil }
        return session
    }

    func changePassword(
        currentPassword: String,
        newPassword: String,
        token: String
    ) async throws -> String? {
        let body = try httpClient.encodedBody(
            ChangePasswordRequest(
                currentPassword: currentPassword,
                newPassword: newPassword
            )
        )
        let response = try await httpClient.perform(
            path: "api/auth/change-password",
            method: "POST",
            token: token,
            body: body
        )
        guard let token = response.header(named: "set-auth-token"), !token.isEmpty else {
            return nil
        }
        return token
    }

    func revokeOtherSessions(token: String) async throws {
        let response: RevokeOtherSessionsResponse = try await httpClient.request(
            path: "api/auth/revoke-other-sessions",
            method: "POST",
            token: token,
            body: Data("{}".utf8)
        )
        guard response.status else {
            throw MembershipAPIError.invalidResponse
        }
    }

    private func authenticationToken(from response: MembershipHTTPResponse) throws -> String {
        guard let token = response.header(named: "set-auth-token"), !token.isEmpty else {
            throw MembershipAPIError.invalidResponse
        }
        return token
    }

    private func validateAccountDeletion(
        _ response: MembershipHTTPResponse,
        expectedMessage: String
    ) throws {
        let deletionResponse: AccountDeletionResponse
        do {
            deletionResponse = try MembershipDateCoding.decoder().decode(
                AccountDeletionResponse.self,
                from: response.data
            )
        } catch {
            throw MembershipAPIError.invalidResponse
        }
        guard deletionResponse.success, deletionResponse.message == expectedMessage else {
            throw MembershipAPIError.invalidResponse
        }
    }
}
