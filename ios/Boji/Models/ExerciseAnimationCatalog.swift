import Foundation

struct ExerciseAnimationDescriptor: Decodable, Equatable, Sendable {
    struct Muscle: Decodable, Equatable, Sendable {
        let key: String
        let name: String
    }

    struct Files: Decodable, Equatable, Sendable {
        let light: String
        let dark: String
    }

    struct Hashes: Decodable, Equatable, Sendable {
        let light: String
        let dark: String

        func value(for theme: ExerciseAnimationTheme) -> String {
            switch theme {
            case .light: light
            case .dark: dark
            }
        }
    }

    let id: String
    let name: String
    let course: String?
    let courses: [String]
    let seconds: Double
    let frames: Int
    let fps: Double
    let posterFrame: Int
    let muscles: [Muscle]
    let files: Files
    let sha256: Hashes

    func resourcePath(for theme: ExerciseAnimationTheme) -> String {
        switch theme {
        case .light: files.light
        case .dark: files.dark
        }
    }
}

enum ExerciseAnimationTheme: String, CaseIterable, Sendable {
    case light
    case dark
}

enum ExerciseAnimationCatalogError: Error, Equatable, Sendable {
    case indexResourceNotFound
    case invalidIndex
    case duplicateID(String)
    case invalidID(String)
    case invalidCourses(id: String)
    case invalidSeconds(id: String)
    case invalidFrameCount(id: String)
    case invalidFramesPerSecond(id: String)
    case invalidPosterFrame(id: String)
    case invalidResourcePath(id: String, theme: ExerciseAnimationTheme)
    case invalidSHA256(id: String, theme: ExerciseAnimationTheme)
}

/// Validated bundled entries. The remote initializer discards only malformed entries.
struct ExerciseAnimationCatalog: Sendable {
    let entries: [ExerciseAnimationDescriptor]

    init(data: Data) throws {
        let entries = try JSONDecoder().decode([ExerciseAnimationDescriptor].self, from: data)
        try Self.validate(entries)
        self.entries = entries
    }

    /// Decodes a remote index without allowing one malformed entry to discard known-good entries.
    init(remoteData: Data) throws {
        guard let values = try JSONSerialization.jsonObject(with: remoteData) as? [Any] else {
            throw ExerciseAnimationCatalogError.invalidIndex
        }

        var entries: [ExerciseAnimationDescriptor] = []
        var identifiers = Set<String>()
        for value in values {
            guard JSONSerialization.isValidJSONObject(value),
                  let data = try? JSONSerialization.data(withJSONObject: value),
                  let entry = try? JSONDecoder().decode(ExerciseAnimationDescriptor.self, from: data),
                  (try? Self.validate(entry)) != nil,
                  identifiers.insert(entry.id).inserted else {
                continue
            }
            entries.append(entry)
        }
        self.entries = entries
    }

    init(bundle: Bundle = .main) throws {
        guard let url = bundle.url(
            forResource: "index",
            withExtension: "json",
            subdirectory: "lottie"
        ) else {
            throw ExerciseAnimationCatalogError.indexResourceNotFound
        }

        try self.init(data: Data(contentsOf: url))
    }

    func entry(for id: String) -> ExerciseAnimationDescriptor? {
        entries.first { $0.id == id }
    }

    private static func validate(_ entries: [ExerciseAnimationDescriptor]) throws {
        var identifiers = Set<String>()
        for entry in entries {
            guard identifiers.insert(entry.id).inserted else {
                throw ExerciseAnimationCatalogError.duplicateID(entry.id)
            }
            try validate(entry)
        }
    }

    private static func validate(_ entry: ExerciseAnimationDescriptor) throws {
        guard isValidID(entry.id) else {
            throw ExerciseAnimationCatalogError.invalidID(entry.id)
        }
        guard !entry.courses.isEmpty,
              entry.courses.allSatisfy(isValidID),
              entry.course.map({ $0 == entry.courses.first }) ?? true else {
            throw ExerciseAnimationCatalogError.invalidCourses(id: entry.id)
        }
        guard entry.seconds.isFinite, entry.seconds > 0 else {
            throw ExerciseAnimationCatalogError.invalidSeconds(id: entry.id)
        }
        guard entry.frames > 0 else {
            throw ExerciseAnimationCatalogError.invalidFrameCount(id: entry.id)
        }
        guard entry.fps.isFinite, entry.fps > 0 else {
            throw ExerciseAnimationCatalogError.invalidFramesPerSecond(id: entry.id)
        }
        guard (0..<entry.frames).contains(entry.posterFrame) else {
            throw ExerciseAnimationCatalogError.invalidPosterFrame(id: entry.id)
        }

        try validateResourcePaths(for: entry)
        try validateHashes(for: entry)
    }

    private static func isValidID(_ id: String) -> Bool {
        guard !id.isEmpty else { return false }
        return id.utf8.allSatisfy { byte in
            (48...57).contains(byte) || (97...122).contains(byte) || byte == 45
        }
    }

    private static func validateResourcePaths(for entry: ExerciseAnimationDescriptor) throws {
        for theme in ExerciseAnimationTheme.allCases {
            let expectedPath = "\(theme.rawValue)/\(entry.id).json"
            guard entry.resourcePath(for: theme) == expectedPath else {
                throw ExerciseAnimationCatalogError.invalidResourcePath(id: entry.id, theme: theme)
            }
        }
    }

    private static func validateHashes(for entry: ExerciseAnimationDescriptor) throws {
        for theme in ExerciseAnimationTheme.allCases {
            let value = entry.sha256.value(for: theme)
            let valid = value.utf8.count == 64 && value.utf8.allSatisfy {
                (48...57).contains($0) || (97...102).contains($0)
            }
            guard valid else {
                throw ExerciseAnimationCatalogError.invalidSHA256(id: entry.id, theme: theme)
            }
        }
    }
}

enum ExercisePlaybackMode: Equatable, Sendable {
    case play
    case hold
    case poster

    static func resolve(
        reduceMotion: Bool,
        isVisible: Bool,
        isSceneActive: Bool,
        wantsToPlay: Bool,
        showsPoster: Bool = false
    ) -> Self {
        if reduceMotion || showsPoster {
            return .poster
        }
        if isVisible && isSceneActive && wantsToPlay {
            return .play
        }
        return .hold
    }
}
