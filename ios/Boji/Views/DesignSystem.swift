import SwiftUI

// Glass belongs to navigation and controls, not content cards.
enum BojiTheme {
    static let accent = Color(uiColor: UIColor { $0.userInterfaceStyle == .dark ? UIColor(red: 1, green: 0.48, blue: 0.30, alpha: 1) : UIColor(red: 0.78, green: 0.25, blue: 0.12, alpha: 1) })
    static let background = Color(uiColor: UIColor { $0.userInterfaceStyle == .dark ? UIColor(red: 0.075, green: 0.075, blue: 0.07, alpha: 1) : UIColor(red: 0.97, green: 0.96, blue: 0.94, alpha: 1) })
    static let card = Color(uiColor: .secondarySystemGroupedBackground)
    static let green = Color(uiColor: UIColor { $0.userInterfaceStyle == .dark ? .systemMint : UIColor(red: 0.15, green: 0.40, blue: 0.32, alpha: 1) })
    static let blue = Color(uiColor: .systemBlue)
    static let purple = Color(uiColor: .systemPurple)
}

struct PageHeading: View {
    let eyebrow: String
    let title: String
    var subtitle: String? = nil
    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            Text(eyebrow).font(.caption.weight(.bold)).tracking(2).foregroundStyle(BojiTheme.accent)
            Text(title).font(.largeTitle.weight(.bold)).tracking(-1)
            if let subtitle { Text(subtitle).font(.subheadline).foregroundStyle(.secondary) }
        }.frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct SectionHeading: View {
    let title: String
    var detail: String? = nil
    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title).font(.title3.bold())
            Spacer()
            if let detail { Text(detail).font(.caption).foregroundStyle(.secondary) }
        }
    }
}

struct Surface<Content: View>: View {
    @ViewBuilder var content: Content
    var body: some View { content.padding(20).background(BojiTheme.card, in: .rect(cornerRadius: 26)) }
}

struct SymbolTile: View {
    let symbol: String
    var color: Color = BojiTheme.accent
    var body: some View {
        Image(systemName: symbol).font(.title3.weight(.semibold))
            .foregroundStyle(color).frame(width: 46, height: 46)
            .background(color.opacity(0.10), in: .rect(cornerRadius: 15))
            .accessibilityHidden(true)
    }
}

struct PrimaryButton: View {
    let title: String
    var symbol: String = "arrow.right"
    var action: () -> Void
    var body: some View {
        Button(action: action) {
            HStack { Text(title).font(.headline); Spacer(); Image(systemName: symbol) }
                .padding(.horizontal, 9).frame(minHeight: 42)
        }
        .buttonStyle(.glassProminent).controlSize(.large)
        .tint(BojiTheme.accent)
    }
}

struct OrbitArtwork: View {
    var color: Color = BojiTheme.accent
    var symbol: String = "figure.cooldown"
    var body: some View {
        ZStack {
            ForEach(0..<5) { i in
                Ellipse().stroke(color.opacity(0.10 + Double(i) * 0.025), lineWidth: 1)
                    .frame(width: CGFloat(90 + i * 30), height: CGFloat(100 + i * 30))
                    .rotationEffect(.degrees(-28))
            }
            Image(systemName: symbol).font(.system(size: 102, weight: .ultraLight)).foregroundStyle(color)
        }.frame(width: 200, height: 220).accessibilityHidden(true)
    }
}

struct EmptyNote: View {
    let symbol: String
    let title: String
    let text: String
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: symbol).font(.largeTitle.weight(.light)).foregroundStyle(BojiTheme.accent)
            Text(title).font(.headline)
            Text(text).font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center)
        }.frame(maxWidth: .infinity).padding(.vertical, 26)
    }
}

extension View {
    func pageBackground() -> some View { background(BojiTheme.background.ignoresSafeArea()) }
}
