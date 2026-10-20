import Foundation

struct BetterAuthSession: Decodable, Equatable, Sendable {
    let user: MembershipAccount
    let session: BetterAuthSessionDetails
}

struct BetterAuthSessionDetails: Decodable, Equatable, Sendable {
    let id: String
    let userId: String
    let createdAt: Date
    let expiresAt: Date

    private enum CodingKeys: String, CodingKey {
        case id
        case userId
        case createdAt
        case expiresAt
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        userId = try container.decode(String.self, forKey: .userId)

        let createdAtDecoder = try container.superDecoder(forKey: .createdAt)
        let createdAtContainer = try createdAtDecoder.singleValueContainer()
        createdAt = try MembershipDateCoding.decodeDate(from: createdAtContainer)

        let expiresAtDecoder = try container.superDecoder(forKey: .expiresAt)
        let expiresAtContainer = try expiresAtDecoder.singleValueContainer()
        expiresAt = try MembershipDateCoding.decodeDate(from: expiresAtContainer)
    }
}
