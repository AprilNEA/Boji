import Foundation

enum CompanionIdentifiers {
    static let appGroup = "group.club.leanmuscle.boji"
    static let widgetKind = "BojiDailyWidget"
    static let snapshotKey = "dailySnapshot"
}

/// Only manual check-in flags are shared. Never add health samples or account data.
struct CompanionProgress: Equatable, Sendable {
    let dayKey: String
    let trainingCompleted: Bool
    let waterLogged: Bool
    let sleepLogged: Bool
    let planTitle: String
}

struct CompanionSnapshot: Codable, Equatable, Sendable {
    let schemaVersion: Int
    let generatedAt: Date
    let isSharingEnabled: Bool
    let dayKey: String
    let trainingCompleted: Bool
    let waterLogged: Bool
    let sleepLogged: Bool
    let planTitle: String

    init(progress: CompanionProgress, generatedAt: Date = Date(), isSharingEnabled: Bool = true) {
        self.schemaVersion = 1
        self.generatedAt = generatedAt
        self.isSharingEnabled = isSharingEnabled
        self.dayKey = progress.dayKey
        self.trainingCompleted = isSharingEnabled && progress.trainingCompleted
        self.waterLogged = isSharingEnabled && progress.waterLogged
        self.sleepLogged = isSharingEnabled && progress.sleepLogged
        self.planTitle = isSharingEnabled ? String(progress.planTitle.prefix(40)) : ""
    }

    static func dayKey(for date: Date, calendar: Calendar = .current) -> String {
        let components = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", components.year ?? 0, components.month ?? 0, components.day ?? 0)
    }
    static func disabled(at date: Date = Date()) -> CompanionSnapshot {
        CompanionSnapshot(progress: CompanionProgress(dayKey: dayKey(for: date), trainingCompleted: false, waterLogged: false, sleepLogged: false, planTitle: ""), generatedAt: date, isSharingEnabled: false)
    }
    func isCurrent(at date: Date = Date(), calendar: Calendar = .current) -> Bool {
        schemaVersion == 1 && isSharingEnabled && dayKey == Self.dayKey(for: date, calendar: calendar) && generatedAt <= date.addingTimeInterval(300)
    }
    var completedCount: Int { [trainingCompleted, waterLogged, sleepLogged].filter { $0 }.count }
    static func decode(_ data: Data) -> CompanionSnapshot? {
        guard data.count <= 16_384 else { return nil }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let text = try container.decode(String.self)
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = formatter.date(from: text) { return date }
            formatter.formatOptions = [.withInternetDateTime]
            guard let date = formatter.date(from: text) else {
                throw DecodingError.dataCorruptedError(in: container, debugDescription: "Invalid snapshot date")
            }
            return date
        }
        guard let value = try? decoder.decode(Self.self, from: data), value.schemaVersion == 1,
              value.dayKey.count == 10, value.planTitle.count <= 40 else { return nil }
        return value
    }
    func encoded() throws -> Data {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .custom { date, encoder in
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            var container = encoder.singleValueContainer()
            try container.encode(formatter.string(from: date))
        }
        return try encoder.encode(self)
    }
}

struct CompanionSnapshotStore: Sendable {
    let directory: URL?
    var isAvailable: Bool { directory != nil }
    static func live() -> CompanionSnapshotStore {
        CompanionSnapshotStore(directory: FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: CompanionIdentifiers.appGroup))
    }
    private var file: URL? { directory?.appendingPathComponent("daily-progress.json") }
    func load() -> CompanionSnapshot? {
        guard let file, let data = try? Data(contentsOf: file) else { return nil }
        return CompanionSnapshot.decode(data)
    }
    func save(_ snapshot: CompanionSnapshot) throws {
        guard var file, let directory else { throw CocoaError(.fileNoSuchFile) }
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        #if os(iOS) || os(watchOS)
        try snapshot.encoded().write(to: file, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        #else
        try snapshot.encoded().write(to: file, options: .atomic)
        #endif
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        try file.setResourceValues(values)
    }
}

enum CompanionRoute: String, CaseIterable {
    case today, training, progress, club
    var url: URL { URL(string: "boji://\(rawValue)")! }
    var tabIndex: Int {
        switch self { case .today: 0; case .training: 1; case .progress: 2; case .club: 3 }
    }
    init?(url: URL) {
        guard url.scheme?.lowercased() == "boji", url.user == nil, url.password == nil,
              url.port == nil, url.query == nil, url.fragment == nil,
              url.path.isEmpty || url.path == "/", let host = url.host,
              let route = Self(rawValue: host.lowercased()) else { return nil }
        self = route
    }
}
