import CryptoKit
import Foundation

/// 一张会员卡的会员码：钱包会员卡上的静态码，以及 App 内每 30 秒变化的动态码。
///
/// 动态码按 RFC 6238 在本机计算：HMAC-SHA1，步长和位数来自服务端。
/// `secret` 是凭证，只保存在内存中。它不写入缓存、日志或分享内容。
struct MembershipCode: Equatable, Sendable {
    /// 这组参数所属的会员卡 ID。
    let membershipID: String
    /// 钱包会员卡二维码的内容。客户端不解析它。
    let staticValue: String
    /// 动态码中位于数字之前的部分。客户端不解析它。
    let dynamicValuePrefix: String
    let secret: Data
    let digits: Int
    /// 一个时间步的秒数。
    let period: Int

    /// 服务端可以返回的位数范围。RFC 4226 要求至少 6 位，HOTP 截断后最多 10 位。
    static let allowedDigits = 6...10
    /// 共享密钥的最小字节数，RFC 4226 要求至少 128 位。
    static let minimumSecretBytes = 16

    /// `date` 所在的时间步，从 Unix 纪元开始计数。
    func step(at date: Date) -> Int64 {
        Int64((date.timeIntervalSince1970 / Double(period)).rounded(.down))
    }

    /// 当前时间步结束前的剩余秒数，范围是 1 到 `period`。
    func secondsRemaining(at date: Date) -> Int {
        let elapsed = date.timeIntervalSince1970 - Double(step(at: date)) * Double(period)
        return max(1, period - Int(elapsed.rounded(.down)))
    }

    /// `date` 时二维码的内容：前缀加上补足位数的 TOTP 数字。
    func dynamicValue(at date: Date) -> String {
        dynamicValuePrefix + totp(step: step(at: date))
    }

    /// RFC 4226 的 HOTP 值，左侧补零到 `digits` 位。
    func totp(step: Int64) -> String {
        var counter = UInt64(bitPattern: step).bigEndian
        let message = withUnsafeBytes(of: &counter) { Data($0) }
        let mac = Array(HMAC<Insecure.SHA1>.authenticationCode(for: message, using: SymmetricKey(data: secret)))
        let offset = Int(mac[mac.count - 1] & 0x0f)
        let binary = (UInt64(mac[offset] & 0x7f) << 24)
            | (UInt64(mac[offset + 1]) << 16)
            | (UInt64(mac[offset + 2]) << 8)
            | UInt64(mac[offset + 3])
        var modulus: UInt64 = 1
        for _ in 0..<digits { modulus *= 10 }
        let value = String(binary % modulus)
        return String(repeating: "0", count: max(0, digits - value.count)) + value
    }
}
