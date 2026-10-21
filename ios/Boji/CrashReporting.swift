import Foundation
import Sentry

/// Starts Sentry crash reporting when the build sets `BOJI_SENTRY_DSN`.
///
/// A report holds the crash stack trace, device and OS context, app lifecycle and touch
/// breadcrumbs, and a random installation ID. It never holds training, body or HealthKit records,
/// account data, screenshots or the view hierarchy. Network breadcrumbs and failed-request events
/// stay off, because they carry URL query strings. Performance tracing and Session Replay stay off.
enum CrashReporting {
    /// The Info.plist key that `project.yml` fills from the `BOJI_SENTRY_DSN` build setting.
    static let dsnInfoKey = "BojiSentryDSN"

    /// Starts the SDK. Call it once, from `BojiApp.init()`.
    ///
    /// Tests never start the SDK, so that a configured DSN does not receive test crashes.
    static func start(bundle: Bundle = .main, process: ProcessInfo = .processInfo) {
        if process.environment["XCTestConfigurationFilePath"] != nil
            || process.arguments.contains("--uitesting") {
            return
        }
        guard let dsn = configuredDSN(bundle.object(forInfoDictionaryKey: dsnInfoKey) as? String) else {
            return
        }
        SentrySDK.start { options in
            options.dsn = dsn
            #if DEBUG
            options.environment = "development"
            #else
            options.environment = "production"
            #endif
            options.sendDefaultPii = false
            options.attachScreenshot = false
            options.attachViewHierarchy = false
            options.enableNetworkBreadcrumbs = false
            options.enableCaptureFailedRequests = false
            options.enableNetworkTracking = false
            options.enableAutoPerformanceTracing = false
        }
    }

    /// Returns the DSN when it is an HTTPS URL with a public key and a host.
    /// Returns `nil` for an empty or invalid value, which keeps the SDK stopped.
    static func configuredDSN(_ value: String?) -> String? {
        guard let value = value?.trimmingCharacters(in: .whitespacesAndNewlines),
              !value.isEmpty,
              let components = URLComponents(string: value),
              components.scheme == "https",
              components.host?.isEmpty == false,
              components.user?.isEmpty == false
        else {
            return nil
        }
        return value
    }
}
