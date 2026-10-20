import Foundation

/// 后端会员日期的统一编解码器。
enum MembershipDateCoding {
    static func decodeDate(from container: SingleValueDecodingContainer) throws -> Date {
        let value = try container.decode(String.self)
        guard let date = parse(value) else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "会员日期必须是 ISO 8601 字符串。"
            )
        }
        return date
    }

    static func encodeDate(_ date: Date, to container: SingleValueEncodingContainer) throws {
        var output = container
        try output.encode(string(from: date))
    }

    static func parse(_ value: String) -> Date? {
        let fractionalFormatter = ISO8601DateFormatter()
        fractionalFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = fractionalFormatter.date(from: value) {
            return date
        }

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: value)
    }

    static func string(from date: Date) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.string(from: date)
    }

    static func decoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            return try decodeDate(from: container)
        }
        return decoder
    }

    static func encoder() -> JSONEncoder {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .custom { date, encoder in
            let container = encoder.singleValueContainer()
            try encodeDate(date, to: container)
        }
        return encoder
    }
}

/// 服务端确认的免费会员卡。
struct ClubMember: Codable, Equatable, Sendable {
    let id: String
    let userId: String
    let memberNumber: String
    let displayName: String
    let joinedAt: Date
    let tier: String
    let status: String
    let entitlements: [String]
    let expiresAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case userId
        case memberNumber
        case displayName
        case joinedAt
        case tier
        case status
        case entitlements
        case expiresAt
    }

    init(
        id: String,
        userId: String,
        memberNumber: String,
        displayName: String,
        joinedAt: Date,
        tier: String,
        status: String,
        entitlements: [String],
        expiresAt: Date?
    ) {
        self.id = id
        self.userId = userId
        self.memberNumber = memberNumber
        self.displayName = displayName
        self.joinedAt = joinedAt
        self.tier = tier
        self.status = status
        self.entitlements = entitlements
        self.expiresAt = expiresAt
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        userId = try container.decode(String.self, forKey: .userId)
        memberNumber = try container.decode(String.self, forKey: .memberNumber)
        displayName = try container.decode(String.self, forKey: .displayName)
        tier = try container.decode(String.self, forKey: .tier)
        status = try container.decode(String.self, forKey: .status)
        entitlements = try container.decode([String].self, forKey: .entitlements)

        let joinedAtDecoder = try container.superDecoder(forKey: .joinedAt)
        let joinedAtContainer = try joinedAtDecoder.singleValueContainer()
        joinedAt = try MembershipDateCoding.decodeDate(from: joinedAtContainer)

        if container.contains(.expiresAt), try !container.decodeNil(forKey: .expiresAt) {
            let expiresAtDecoder = try container.superDecoder(forKey: .expiresAt)
            let expiresAtContainer = try expiresAtDecoder.singleValueContainer()
            expiresAt = try MembershipDateCoding.decodeDate(from: expiresAtContainer)
        } else {
            expiresAt = nil
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(userId, forKey: .userId)
        try container.encode(memberNumber, forKey: .memberNumber)
        try container.encode(displayName, forKey: .displayName)
        try container.encode(tier, forKey: .tier)
        try container.encode(status, forKey: .status)
        try container.encode(entitlements, forKey: .entitlements)

        let joinedAtEncoder = container.superEncoder(forKey: .joinedAt)
        let joinedAtContainer = joinedAtEncoder.singleValueContainer()
        try MembershipDateCoding.encodeDate(joinedAt, to: joinedAtContainer)

        if let expiresAt {
            let expiresAtEncoder = container.superEncoder(forKey: .expiresAt)
            let expiresAtContainer = expiresAtEncoder.singleValueContainer()
            try MembershipDateCoding.encodeDate(expiresAt, to: expiresAtContainer)
        } else {
            try container.encodeNil(forKey: .expiresAt)
        }
    }

    /// 只有已知社区等级、活动状态且未到期的卡才是有效卡。
    var isActive: Bool {
        guard tier == "community", status == "active" else { return false }
        guard let expiresAt else { return true }
        return expiresAt > Date()
    }
}

/// 已登录账户的最小展示信息。
struct MembershipAccount: Codable, Equatable, Sendable {
    let id: String
    let name: String
    let email: String
    let emailVerified: Bool

    init(id: String, name: String, email: String, emailVerified: Bool) {
        self.id = id
        self.name = name
        self.email = email
        self.emailVerified = emailVerified
    }
}
