#if DEBUG
import Foundation

/// Serves only the Debug fixture resources. Release builds contain none of this code or its JSON files.
final class ExerciseAnimationFixtureTransport: ExerciseAnimationTransport, @unchecked Sendable {
    private let mode: String
    private let bundle: Bundle

    init(mode: String, bundle: Bundle = .main) {
        self.mode = mode
        self.bundle = bundle
    }

    func send(_ request: URLRequest) async throws -> ExerciseAnimationHTTPResponse {
        guard mode == "ok" else { throw URLError(.notConnectedToInternet) }
        guard let path = request.url?.path,
              let data = data(for: path) else {
            return ExerciseAnimationHTTPResponse(data: Data(), statusCode: 404, etag: nil)
        }
        return ExerciseAnimationHTTPResponse(data: data, statusCode: 200, etag: "fixture-v1")
    }

    static func makeStore(mode: String) -> ExerciseAnimationRemoteStore {
        let bundledIDs = Set((try? ExerciseAnimationCatalog())?.entries.map(\.id) ?? [])
        return ExerciseAnimationRemoteStore(
            baseURL: URL(string: "https://fixture.leanmuscle.club/animations/exercises/v1/")!,
            transport: ExerciseAnimationFixtureTransport(mode: mode),
            // A fresh directory per launch, so that files cached by an earlier
            // UI test run cannot satisfy the offline fixture.
            cacheDirectory: FileManager.default.temporaryDirectory
                .appendingPathComponent("ExerciseAnimationFixture-\(UUID().uuidString)", isDirectory: true),
            bundledExerciseIDs: bundledIDs
        )
    }

    private func data(for path: String) -> Data? {
        if path.hasSuffix("/index.json") {
            return bundle.url(forResource: "index", withExtension: "json", subdirectory: "RemoteAnimationFixtures")
                .flatMap { try? Data(contentsOf: $0) }
        }
        if path.hasPrefix("/animations/exercises/v1/light/") {
            return bundle.url(forResource: "light", withExtension: "json", subdirectory: "RemoteAnimationFixtures")
                .flatMap { try? Data(contentsOf: $0) }
        }
        if path.hasPrefix("/animations/exercises/v1/dark/") {
            return bundle.url(forResource: "dark", withExtension: "json", subdirectory: "RemoteAnimationFixtures")
                .flatMap { try? Data(contentsOf: $0) }
        }
        return nil
    }
}
#endif
