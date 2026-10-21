import Foundation

/// Public legal pages on the website. App Store Connect uses the same privacy policy page.
/// The Chinese pages are at the root. The English pages are under `/en/`, and the English version controls.
enum LegalDocument: CaseIterable {
    case privacyPolicy
    case termsOfUse

    private static let site = URL(string: "https://leanmuscle.club")!

    /// The page in the language that the app shows. Languages without their own page use the English page.
    func url(for locale: Locale) -> URL {
        let path = switch self {
        case .privacyPolicy: "privacy/"
        case .termsOfUse: "terms/"
        }
        let prefix = locale.language.languageCode == .chinese ? "" : "en/"
        return Self.site.appending(path: prefix + path)
    }
}
