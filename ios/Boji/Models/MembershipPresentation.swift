import Foundation

struct MembershipPledge: Identifiable, Sendable {
    let id: String
    let title: String
    let detail: String
    let symbol: String

    static let all: [MembershipPledge] = [
        MembershipPledge(
            id: "belonging",
            title: String(localized: "人人都有位置"),
            detail: String(localized: "不以身材、体重或体脂决定是否可以加入。"),
            symbol: "person.2"
        ),
        MembershipPledge(
            id: "pace",
            title: String(localized: "尊重自己的节奏"),
            detail: String(localized: "不排名，不鼓励极端减脂；不舒服时停止训练。"),
            symbol: "figure.walk"
        ),
        MembershipPledge(
            id: "privacy",
            title: String(localized: "尊重他人与隐私"),
            detail: String(localized: "不冒用他人身份，不在昵称中包含他人隐私。"),
            symbol: "hand.raised"
        )
    ]
}

struct MembershipEnrollmentDraft: Equatable {
    var name = ""
    var confirmedPledges: Set<String> = []
    var acceptedDataUse = false

    var normalizedName: String {
        name.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var nameError: String? {
        if normalizedName.isEmpty {
            return String(localized: "请输入昵称。")
        }
        if normalizedName.count > 24 {
            return String(localized: "昵称不能超过 24 个字符。")
        }
        if name.unicodeScalars.contains(where: { $0.properties.generalCategory == .control || CharacterSet.newlines.contains($0) }) {
            return String(localized: "昵称不能包含控制字符或换行。")
        }
        return nil
    }

    var confirmedCount: Int {
        let validIDs = Set(MembershipPledge.all.map(\.id))
        return confirmedPledges.intersection(validIDs).count
    }

    var canReview: Bool {
        nameError == nil && confirmedCount == MembershipPledge.all.count
    }

    var canSubmit: Bool {
        canReview && acceptedDataUse
    }
}

enum MembershipCardAppearance: String, CaseIterable, Identifiable, Codable, Sendable {
    case forest
    case chalk
    case ink

    var id: String {
        rawValue
    }

    var title: String {
        switch self {
        case .forest:
            String(localized: "松林")
        case .chalk:
            String(localized: "月白")
        case .ink:
            String(localized: "曜石")
        }
    }
}

struct MembershipShareOptions: Equatable, Hashable {
    var appearance: MembershipCardAppearance = .forest
    var showsMemberNumber = false
}

enum MembershipCardCondition: String, Equatable, Sendable {
    case active
    case offline
    case suspended
    case expired
    case unavailable

    static func resolve(
        card: ClubMember,
        isOffline: Bool,
        at date: Date = Date()
    ) -> Self {
        if card.status == "suspended" {
            return .suspended
        }
        if let expiresAt = card.expiresAt, expiresAt <= date {
            return .expired
        }
        guard card.tier == "community", card.status == "active" else {
            return .unavailable
        }
        return isOffline ? .offline : .active
    }

    var title: String {
        switch self {
        case .active:
            String(localized: "已加入俱乐部")
        case .offline:
            String(localized: "离线副本")
        case .suspended:
            String(localized: "会员卡已暂停")
        case .expired:
            String(localized: "会员卡已到期")
        case .unavailable:
            String(localized: "会员卡当前不可用")
        }
    }

    var detail: String {
        switch self {
        case .active:
            String(localized: "会员状态已确认。本地功能不受影响。")
        case .offline:
            String(localized: "离线时不能确认会员状态。本地功能不受影响。")
        case .suspended:
            String(localized: "会员卡当前已暂停。本地功能不受影响。")
        case .expired:
            String(localized: "会员卡已到期。本地功能不受影响。")
        case .unavailable:
            String(localized: "会员状态暂不可用。本地功能不受影响。")
        }
    }

    var symbol: String {
        switch self {
        case .active:
            "checkmark.seal.fill"
        case .offline:
            "wifi.slash"
        case .suspended:
            "pause.circle"
        case .expired:
            "clock.badge.exclamationmark"
        case .unavailable:
            "questionmark.circle"
        }
    }
}

struct MembershipShareSnapshot: Encodable, Equatable, Sendable {
    let displayName: String
    let memberNumber: String?
    let joinedAt: Date
    let generatedAt: Date
    let isOffline: Bool
    let isTest: Bool

    private enum CodingKeys: String, CodingKey {
        case displayName
        case memberNumber
        case joinedAt
        case generatedAt
        case isOffline
        case isTest
    }

    init(
        card: ClubMember,
        options: MembershipShareOptions,
        isOffline: Bool,
        isTest: Bool,
        generatedAt: Date = Date()
    ) {
        displayName = card.displayName
        memberNumber = options.showsMemberNumber ? card.memberNumber : nil
        joinedAt = card.joinedAt
        self.generatedAt = generatedAt
        self.isOffline = isOffline
        self.isTest = isTest
    }
}
