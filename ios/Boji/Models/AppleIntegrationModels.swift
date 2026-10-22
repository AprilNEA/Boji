import Foundation
import CryptoKit
import Security

struct MembershipCapabilities: Equatable, Sendable {
    let appleSignIn: Bool
    let walletPass: Bool
    /// 服务端能否签发会员码。为 false 时，钱包会员卡没有二维码，App 也不显示动态码。
    var membershipCode = false
}

struct AppleIdentity: Encodable, Sendable {
    let token: String
    let nonce: String
    let user: User?
    struct User: Encodable, Sendable { let name: Name }
    struct Name: Encodable, Sendable { let firstName: String?; let lastName: String? }

    init(token: String, nonce: String, firstName: String?, lastName: String?) {
        self.token = token
        self.nonce = nonce
        self.user = firstName == nil && lastName == nil ? nil : User(name: Name(firstName: firstName, lastName: lastName))
    }
}

struct AppleSignInNonce: Sendable {
    let rawValue: String
    var sha256: String { SHA256.hash(data: Data(rawValue.utf8)).map { String(format: "%02x", $0) }.joined() }
    init() throws {
        var bytes = [UInt8](repeating: 0, count: 32)
        guard SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes) == errSecSuccess else {
            throw MembershipAPIError.invalidResponse
        }
        rawValue = bytes.map { String(format: "%02x", $0) }.joined()
    }
}

enum AppleIntegrationSettings {
    static var appleSignInEnabled: Bool {
        let value = Bundle.main.object(forInfoDictionaryKey: "BojiAppleSignInEnabled")
        if let number = value as? NSNumber { return number.boolValue }
        return ["yes", "true", "1"].contains((value as? String ?? "").lowercased())
    }
    static var walletPassTypeIdentifier: String {
        (Bundle.main.object(forInfoDictionaryKey: "BojiWalletPassTypeIdentifier") as? String ?? "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
