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

    let id: String
    let name: String
    let course: String?
    let seconds: Double
    let frames: Int
    let fps: Double
    let posterFrame: Int
    let muscles: [Muscle]
    let files: Files

    func resourcePath(for theme: ExerciseAnimationTheme) -> String {
        switch theme {
        case .light:
            files.light
        case .dark:
            files.dark
        }
    }
}

enum ExerciseAnimationTheme: String, CaseIterable, Sendable {
    case light
    case dark
}

enum ExerciseAnimationCatalogError: Error, Equatable, Sendable {
    case indexResourceNotFound
    case duplicateID(String)
    case invalidID(String)
    case invalidSeconds(id: String)
    case invalidFrameCount(id: String)
    case invalidFramesPerSecond(id: String)
    case invalidPosterFrame(id: String)
    case invalidResourcePath(id: String, theme: ExerciseAnimationTheme)
}

struct ExerciseAnimationCatalog: Sendable {
    let entries: [ExerciseAnimationDescriptor]

    init(data: Data) throws {
        let entries = try JSONDecoder().decode([ExerciseAnimationDescriptor].self, from: data)
        try Self.validate(entries)
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
            guard isValidID(entry.id) else {
                throw ExerciseAnimationCatalogError.invalidID(entry.id)
            }
            guard identifiers.insert(entry.id).inserted else {
                throw ExerciseAnimationCatalogError.duplicateID(entry.id)
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
        }
    }

    private static func isValidID(_ id: String) -> Bool {
        guard !id.isEmpty else { return false }

        return id.utf8.allSatisfy { byte in
            (48...57).contains(byte) ||
                (97...122).contains(byte) ||
                byte == 45
        }
    }

    private static func validateResourcePaths(
        for entry: ExerciseAnimationDescriptor
    ) throws {
        let expectedLightPath = "light/\(entry.id).json"
        guard entry.files.light == expectedLightPath else {
            throw ExerciseAnimationCatalogError.invalidResourcePath(
                id: entry.id,
                theme: .light
            )
        }

        let expectedDarkPath = "dark/\(entry.id).json"
        guard entry.files.dark == expectedDarkPath else {
            throw ExerciseAnimationCatalogError.invalidResourcePath(
                id: entry.id,
                theme: .dark
            )
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
