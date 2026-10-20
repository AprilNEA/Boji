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

/// 服务端授予的会员权益，或旧缓存中的权益代码。
public struct MembershipEntitlement: Codable, Equatable, Sendable {
    public let id: String?
    public let code: String
    public let name: String
    public let description: String
    public let grantedAt: Date?
    public let expiresAt: Date?
    public let isLegacy: Bool

    private enum CodingKeys: String, CodingKey {
        case id
        case code
        case name
        case description
        case grantedAt
        case expiresAt
    }

    /// 创建服务端格式的权益。
    public init(
        id: String,
        code: String,
        name: String,
        description: String,
        grantedAt: Date,
        expiresAt: Date?
    ) {
        self.id = id
        self.code = code
        self.name = name
        self.description = description
        self.grantedAt = grantedAt
        self.expiresAt = expiresAt
        isLegacy = false
    }

    /// 创建不含服务端元数据的旧缓存权益。
    init(legacyCode: String) {
        id = nil
        code = legacyCode
        name = ""
        description = ""
        grantedAt = nil
        expiresAt = nil
        isLegacy = true
    }

    public init(from decoder: Decoder) throws {
        let singleValueContainer = try decoder.singleValueContainer()
        if let legacyCode = try? singleValueContainer.decode(String.self) {
            self.init(legacyCode: legacyCode)
            return
        }

        let container = try decoder.container(keyedBy: CodingKeys.self)
        let id = try container.decode(String.self, forKey: .id)
        guard UUID(uuidString: id) != nil else {
            throw DecodingError.dataCorruptedError(
                forKey: .id,
                in: container,
                debugDescription: "会员权益 ID 必须是 UUID 字符串。"
            )
        }

        let code = try container.decode(String.self, forKey: .code)
        let name = try container.decode(String.self, forKey: .name)
        let description = try container.decode(String.self, forKey: .description)

        let grantedAtDecoder = try container.superDecoder(forKey: .grantedAt)
        let grantedAtContainer = try grantedAtDecoder.singleValueContainer()
        let grantedAt = try MembershipDateCoding.decodeDate(from: grantedAtContainer)

        let expiresAt: Date?
        if try container.decodeNil(forKey: .expiresAt) {
            expiresAt = nil
        } else {
            let expiresAtDecoder = try container.superDecoder(forKey: .expiresAt)
            let expiresAtContainer = try expiresAtDecoder.singleValueContainer()
            expiresAt = try MembershipDateCoding.decodeDate(from: expiresAtContainer)
        }

        self.init(id: id, code: code, name: name, description: description,
                  grantedAt: grantedAt, expiresAt: expiresAt)
    }

    public func encode(to encoder: Encoder) throws {
        if isLegacy {
            var container = encoder.singleValueContainer()
            try container.encode(code)
            return
        }

        guard let id, UUID(uuidString: id) != nil, let grantedAt else {
            throw EncodingError.invalidValue(
                self,
                EncodingError.Context(
                    codingPath: encoder.codingPath,
                    debugDescription: "服务端权益必须包含有效 UUID 和授予时间。"
                )
            )
        }

        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(code, forKey: .code)
        try container.encode(name, forKey: .name)
        try container.encode(description, forKey: .description)

        let grantedAtEncoder = container.superEncoder(forKey: .grantedAt)
        let grantedAtContainer = grantedAtEncoder.singleValueContainer()
        try MembershipDateCoding.encodeDate(grantedAt, to: grantedAtContainer)

        if let expiresAt {
            let expiresAtEncoder = container.superEncoder(forKey: .expiresAt)
            let expiresAtContainer = expiresAtEncoder.singleValueContainer()
            try MembershipDateCoding.encodeDate(expiresAt, to: expiresAtContainer)
        } else {
            try container.encodeNil(forKey: .expiresAt)
        }
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
    let entitlements: [MembershipEntitlement]
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
        self.entitlements = entitlements.map(MembershipEntitlement.init(legacyCode:))
        self.expiresAt = expiresAt
    }

    init(
        id: String,
        userId: String,
        memberNumber: String,
        displayName: String,
        joinedAt: Date,
        tier: String,
        status: String,
        grantedEntitlements: [MembershipEntitlement],
        expiresAt: Date?
    ) {
        self.id = id
        self.userId = userId
        self.memberNumber = memberNumber
        self.displayName = displayName
        self.joinedAt = joinedAt
        self.tier = tier
        self.status = status
        entitlements = grantedEntitlements
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
        entitlements = try container.decode([MembershipEntitlement].self, forKey: .entitlements)

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

    /// 旧字符串缓存不会为受限能力授予权益。
    var hasLegacyEntitlements: Bool {
        entitlements.contains { $0.isLegacy }
    }

    /// 返回指定时刻可用的受限权益。
    func activeEntitlement(
        for code: String,
        at date: Date = Date()
    ) -> MembershipEntitlement? {
        let supportedCodes: Set<String> = [
            "local_tracking",
            "training_library",
            "progress_history"
        ]
        guard supportedCodes.contains(code) else { return nil }
        guard tier == "community", status == "active" else { return nil }
        if let expiresAt, expiresAt <= date { return nil }

        return entitlements.first { entitlement in
            guard !entitlement.isLegacy, entitlement.code == code else { return false }
            guard let grantedAt = entitlement.grantedAt, grantedAt <= date else { return false }
            guard let expiresAt = entitlement.expiresAt else { return true }
            return expiresAt > date
        }
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
