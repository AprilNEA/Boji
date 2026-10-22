import CryptoKit
import Foundation
import Lottie

struct ExerciseAnimationHTTPResponse: Sendable {
    let data: Data
    let statusCode: Int
    let etag: String?
}

protocol ExerciseAnimationTransport: Sendable {
    func send(_ request: URLRequest) async throws -> ExerciseAnimationHTTPResponse
}

private final class AnimationRedirectBlocker: NSObject, URLSessionTaskDelegate, @unchecked Sendable {
    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        willPerformHTTPRedirection response: HTTPURLResponse,
        newRequest request: URLRequest,
        completionHandler: @escaping @Sendable (URLRequest?) -> Void
    ) {
        completionHandler(nil)
    }
}

/// This session is separate from membership networking. It has no cookie or URL cache state.
final class URLSessionExerciseAnimationTransport: NSObject, ExerciseAnimationTransport, @unchecked Sendable {
    private let session: URLSession

    override init() {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.httpCookieStorage = nil
        configuration.httpShouldSetCookies = false
        configuration.urlCache = nil
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        configuration.timeoutIntervalForRequest = 15
        configuration.timeoutIntervalForResource = 15
        configuration.httpAdditionalHeaders = [:]
        session = URLSession(configuration: configuration, delegate: AnimationRedirectBlocker(), delegateQueue: nil)
        super.init()
    }

    func send(_ request: URLRequest) async throws -> ExerciseAnimationHTTPResponse {
        let (data, response) = try await session.data(for: request)
        guard let response = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }
        return ExerciseAnimationHTTPResponse(
            data: data,
            statusCode: response.statusCode,
            etag: response.value(forHTTPHeaderField: "ETag")
        )
    }
}

private actor ExerciseAnimationDownloadLimiter {
    private var active = 0
    private var waiters: [CheckedContinuation<Void, Never>] = []

    func acquire() async {
        if active < 3 {
            active += 1
            return
        }
        await withCheckedContinuation { waiters.append($0) }
    }

    func release() {
        if let waiter = waiters.first {
            waiters.removeFirst()
            waiter.resume()
        } else {
            active -= 1
        }
    }
}

enum ExerciseAnimationPrefetchResult: Equatable, Sendable {
    case notRequired
    case available
    case unavailable
}

/// Stores verified remote files only. It never downloads from an exercise player.
actor ExerciseAnimationRemoteStore {
    nonisolated static let productionBaseURL = URL(string: "https://assets.leanmuscle.club/animations/exercises/v1/")!

    private struct StoredIndex: Sendable {
        let catalog: ExerciseAnimationCatalog
        let etag: String?
    }

    private let baseURL: URL
    private let transport: any ExerciseAnimationTransport
    private let cacheDirectory: URL
    private let bundledExerciseIDs: Set<String>
    private let limiter = ExerciseAnimationDownloadLimiter()
    private var catalog: ExerciseAnimationCatalog?
    private var fetchedIndexSuccessfully = false
    private var indexTask: Task<ExerciseAnimationCatalog?, Never>?
    private var fileTasks: [String: Task<Bool, Never>] = [:]

    init(
        baseURL: URL = ExerciseAnimationRemoteStore.productionBaseURL,
        transport: any ExerciseAnimationTransport = URLSessionExerciseAnimationTransport(),
        cacheDirectory: URL? = nil,
        bundledExerciseIDs: Set<String>
    ) {
        self.baseURL = baseURL
        self.transport = transport
        self.bundledExerciseIDs = bundledExerciseIDs
        if let cacheDirectory {
            self.cacheDirectory = cacheDirectory
        } else {
            let root = try? FileManager.default.url(
                for: .applicationSupportDirectory,
                in: .userDomainMask,
                appropriateFor: nil,
                create: true
            )
            self.cacheDirectory = (root ?? FileManager.default.temporaryDirectory)
                .appendingPathComponent("ExerciseAnimations", isDirectory: true)
        }
    }

    func needsPrefetch(_ workout: Workout) -> Bool {
        workout.exercises.contains { !bundledExerciseIDs.contains($0.id) }
    }

    func prefetch(_ workout: Workout) async -> ExerciseAnimationPrefetchResult {
        let remoteIDs = workout.exercises.map(\.id).filter { !bundledExerciseIDs.contains($0) }
        guard !remoteIDs.isEmpty else { return .notRequired }
        guard let catalog = await indexForPrefetch() else { return .unavailable }

        let entries = remoteIDs.compactMap { catalog.entry(for: $0) }
        guard entries.count == remoteIDs.count else { return .unavailable }

        var available = true
        await withTaskGroup(of: Bool.self) { group in
            for entry in entries {
                for theme in ExerciseAnimationTheme.allCases {
                    group.addTask { await self.download(entry, theme: theme) }
                }
            }
            for await result in group where !result {
                available = false
            }
        }
        return available ? .available : .unavailable
    }

    func cachedDescriptor(for id: String) -> ExerciseAnimationDescriptor? {
        guard !bundledExerciseIDs.contains(id) else { return nil }
        if catalog == nil { catalog = Self.readStoredIndex(in: cacheDirectory)?.catalog }
        return catalog?.entry(for: id)
    }

    func cachedURL(
        for entry: ExerciseAnimationDescriptor,
        theme: ExerciseAnimationTheme
    ) -> URL? {
        let url = Self.cacheURL(for: entry, theme: theme, in: cacheDirectory)
        guard let data = try? Data(contentsOf: url),
              Self.sha256(data) == entry.sha256.value(for: theme) else {
            return nil
        }
        return url
    }

    private func indexForPrefetch() async -> ExerciseAnimationCatalog? {
        if fetchedIndexSuccessfully { return catalog }
        if let indexTask { return await indexTask.value ?? catalog }

        let stored = Self.readStoredIndex(in: cacheDirectory)
        if catalog == nil { catalog = stored?.catalog }
        let transport = transport
        let baseURL = baseURL
        let cacheDirectory = cacheDirectory
        let task = Task {
            await Self.fetchIndex(
                transport: transport,
                baseURL: baseURL,
                cacheDirectory: cacheDirectory,
                etag: stored?.etag,
                storedCatalog: stored?.catalog
            )
        }
        indexTask = task
        let downloaded = await task.value
        indexTask = nil
        if let downloaded {
            catalog = downloaded
            fetchedIndexSuccessfully = true
            return downloaded
        }
        return catalog
    }

    private func download(
        _ entry: ExerciseAnimationDescriptor,
        theme: ExerciseAnimationTheme
    ) async -> Bool {
        if cachedURL(for: entry, theme: theme) != nil { return true }
        let key = "\(entry.id)/\(theme.rawValue)/\(entry.sha256.value(for: theme))"
        if let task = fileTasks[key] { return await task.value }

        let transport = transport
        let baseURL = baseURL
        let cacheDirectory = cacheDirectory
        let limiter = limiter
        let task = Task {
            await limiter.acquire()
            defer { Task { await limiter.release() } }
            return await Self.fetchAndCache(
                entry: entry,
                theme: theme,
                transport: transport,
                baseURL: baseURL,
                cacheDirectory: cacheDirectory
            )
        }
        fileTasks[key] = task
        let value = await task.value
        fileTasks.removeValue(forKey: key)
        return value
    }

    private static func fetchIndex(
        transport: any ExerciseAnimationTransport,
        baseURL: URL,
        cacheDirectory: URL,
        etag: String?,
        storedCatalog: ExerciseAnimationCatalog?
    ) async -> ExerciseAnimationCatalog? {
        var request = URLRequest(url: baseURL.appendingPathComponent("index.json"))
        request.httpMethod = "GET"
        request.timeoutInterval = 15
        if let etag { request.setValue(etag, forHTTPHeaderField: "If-None-Match") }

        do {
            let response = try await transport.send(request)
            if response.statusCode == 304 { return storedCatalog }
            guard response.statusCode == 200 else { return nil }
            let catalog = try ExerciseAnimationCatalog(remoteData: response.data)
            try writeIndex(response.data, etag: response.etag, in: cacheDirectory)
            return catalog
        } catch {
            return nil
        }
    }

    private static func fetchAndCache(
        entry: ExerciseAnimationDescriptor,
        theme: ExerciseAnimationTheme,
        transport: any ExerciseAnimationTransport,
        baseURL: URL,
        cacheDirectory: URL
    ) async -> Bool {
        let relativePath = entry.resourcePath(for: theme)
        guard let url = safeAnimationURL(baseURL: baseURL, relativePath: relativePath) else { return false }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 15

        do {
            let response = try await transport.send(request)
            guard response.statusCode == 200,
                  sha256(response.data) == entry.sha256.value(for: theme),
                  await lottieTimingMatches(response.data, entry: entry) else {
                return false
            }
            try write(response.data, for: entry, theme: theme, in: cacheDirectory)
            return true
        } catch {
            return false
        }
    }

    private static func safeAnimationURL(baseURL: URL, relativePath: String) -> URL? {
        guard baseURL.scheme == "https",
              relativePath.range(of: "^[a-z]+/[a-z0-9-]+\\.json$", options: .regularExpression) != nil,
              var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false) else {
            return nil
        }
        components.query = nil
        components.fragment = nil
        return components.url?.appendingPathComponent(relativePath)
    }

    private static func lottieTimingMatches(_ data: Data, entry: ExerciseAnimationDescriptor) async -> Bool {
        await Task.detached(priority: .userInitiated) {
            guard let animation = try? LottieAnimation.from(data: data) else { return false }
            return abs(animation.endFrame - Double(entry.frames)) <= 1
                && abs(animation.framerate - entry.fps) <= 0.01
        }.value
    }

    private static func sha256(_ data: Data) -> String {
        SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
    }

    private static func readStoredIndex(in directory: URL) -> StoredIndex? {
        let indexURL = directory.appendingPathComponent("index.json")
        guard let data = try? Data(contentsOf: indexURL),
              let catalog = try? ExerciseAnimationCatalog(remoteData: data) else {
            return nil
        }
        let etagURL = directory.appendingPathComponent("index.etag")
        let etag = try? String(contentsOf: etagURL, encoding: .utf8)
        return StoredIndex(catalog: catalog, etag: etag?.isEmpty == false ? etag : nil)
    }

    private static func writeIndex(_ data: Data, etag: String?, in directory: URL) throws {
        try prepare(directory)
        try replace(data, at: directory.appendingPathComponent("index.json"))
        let etagURL = directory.appendingPathComponent("index.etag")
        if let etag, !etag.isEmpty {
            try replace(Data(etag.utf8), at: etagURL)
        } else {
            try? FileManager.default.removeItem(at: etagURL)
        }
    }

    private static func write(
        _ data: Data,
        for entry: ExerciseAnimationDescriptor,
        theme: ExerciseAnimationTheme,
        in directory: URL
    ) throws {
        let destination = cacheURL(for: entry, theme: theme, in: directory)
        let exerciseDirectory = destination.deletingLastPathComponent()
        try prepare(exerciseDirectory)
        try replace(data, at: destination)

        let prefix = "\(theme.rawValue)-"
        for file in try FileManager.default.contentsOfDirectory(
            at: exerciseDirectory,
            includingPropertiesForKeys: nil
        ) where file != destination && file.lastPathComponent.hasPrefix(prefix) && file.pathExtension == "json" {
            try? FileManager.default.removeItem(at: file)
        }
    }

    private static func cacheURL(
        for entry: ExerciseAnimationDescriptor,
        theme: ExerciseAnimationTheme,
        in directory: URL
    ) -> URL {
        directory
            .appendingPathComponent(entry.id, isDirectory: true)
            .appendingPathComponent("\(theme.rawValue)-\(entry.sha256.value(for: theme)).json")
    }

    private static func prepare(_ directory: URL) throws {
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        var directory = directory
        try directory.setResourceValues(values)
    }

    private static func replace(_ data: Data, at destination: URL) throws {
        let temporary = destination.deletingLastPathComponent()
            .appendingPathComponent(".\(UUID().uuidString).tmp")
        try data.write(to: temporary, options: .atomic)
        try? FileManager.default.removeItem(at: destination)
        try FileManager.default.moveItem(at: temporary, to: destination)
    }
}
