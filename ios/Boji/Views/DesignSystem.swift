import SwiftUI
import UIKit

/// Liquid Glass belongs to bars and controls that float above content. Content uses the solid colors here.
/// Each brand color defines light, dark and increased-contrast variants.
enum BojiTheme {
    static let accent = Color(light: 0xC7401F, dark: 0xFF7A4D, lightHighContrast: 0x9E2E16, darkHighContrast: 0xFF9A75)
    /// Fill behind white text and symbols. It keeps at least 4.5:1 contrast with white in both appearances,
    /// which the brighter dark `accent` (2.6:1) does not.
    static let accentFill = Color(light: 0xC7401F, dark: 0xC7401F, lightHighContrast: 0x9E2E16, darkHighContrast: 0x9E2E16)
    static let green = Color(light: UIColor(hex: 0x266652), dark: .systemMint, lightHighContrast: UIColor(hex: 0x1C5242))
    static let blue = Color(uiColor: .systemBlue)
    static let purple = Color(uiColor: .systemPurple)
    static let background = Color(light: 0xF7F5F0, dark: 0x131312)
    static let card = Color(uiColor: .secondarySystemGroupedBackground)
    /// Warm tint that fades into `card` on hero cards.
    static let wash = Color(light: 0xF6E2D5, dark: 0x3A2219)

    static let cardRadius: CGFloat = 24
    static let tileRadius: CGFloat = 12
}

/// The scroll container of a dashboard page: readable width, standard margins and the brand background.
struct PageScroll<Content: View>: View {
    @ViewBuilder var content: Content
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 28) { content }
                .padding(.horizontal, 16).padding(.top, 8).padding(.bottom, 24)
                .frame(maxWidth: 680).frame(maxWidth: .infinity)
        }
        .pageBackground()
    }
}

struct PageHeading: View {
    let eyebrow: String
    let title: String
    var subtitle: String? = nil
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(eyebrow).font(.caption.weight(.bold)).tracking(2).foregroundStyle(BojiTheme.accent)
            Text(title).font(.largeTitle.weight(.bold))
            if let subtitle { Text(subtitle).font(.subheadline).foregroundStyle(.secondary) }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isHeader)
    }
}

struct SectionHeading: View {
    let title: String
    var detail: String? = nil
    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title).font(.title3.bold()).accessibilityAddTraits(.isHeader)
            Spacer()
            if let detail { Text(detail).font(.footnote).foregroundStyle(.secondary) }
        }
    }
}

/// A solid content card. Children can use `ConcentricRectangle` to match its corners.
struct Surface<Content: View>: View {
    var padding: CGFloat = 20
    @ViewBuilder var content: Content
    var body: some View {
        content.padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(BojiTheme.card, in: .rect(cornerRadius: BojiTheme.cardRadius))
            .containerShape(.rect(cornerRadius: BojiTheme.cardRadius))
    }
}

struct SymbolTile: View {
    let symbol: String
    let color: Color
    @ScaledMetric(relativeTo: .title3) private var size: CGFloat = 40

    init(symbol: String, color: Color = BojiTheme.accent) {
        self.symbol = symbol
        self.color = color
    }

    var body: some View {
        Image(systemName: symbol).font(.body.weight(.semibold))
            .foregroundStyle(color).frame(width: size, height: size)
            .background(color.opacity(0.12), in: .rect(cornerRadius: BojiTheme.tileRadius))
            .accessibilityHidden(true)
    }
}

/// The main action of a screen. Place it in a bottom `safeAreaBar`, where controls float above content.
/// The label stops growing at `accessibility2` so the floating bar never covers most of the screen.
struct PrimaryButton: View {
    let title: String
    var symbol: String? = nil
    var action: () -> Void
    var body: some View {
        Button(action: action) { ActionLabel(title: title, symbol: symbol) }
            .buttonStyle(.glassProminent).controlSize(.extraLarge)
            .tint(BojiTheme.accentFill)
            .dynamicTypeSize(...DynamicTypeSize.accessibility2)
    }
}

/// The main action inside a content card. Content uses the standard bordered style, not glass.
/// The label stops growing at `accessibility2` for the same reason as `PrimaryButton`.
struct CardButton: View {
    let title: String
    var symbol: String? = nil
    var action: () -> Void
    var body: some View {
        Button(action: action) { ActionLabel(title: title, symbol: symbol) }
            .buttonStyle(.borderedProminent).controlSize(.large)
            .tint(BojiTheme.accentFill)
            .dynamicTypeSize(...DynamicTypeSize.accessibility2)
    }
}

/// Rows in one card with inset separators, like an inset grouped list.
struct GroupedRows<Content: View>: View {
    @ViewBuilder var content: Content
    var body: some View {
        VStack(spacing: 0) {
            Group(subviews: content) { rows in
                ForEach(rows) { row in
                    if row.id != rows.first?.id { Divider().padding(.leading, 16) }
                    row
                }
            }
        }
        .background(BojiTheme.card)
        .clipShape(.rect(cornerRadius: BojiTheme.cardRadius))
    }
}

/// Row highlight for buttons and navigation links inside `GroupedRows`.
struct RowButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, 16).padding(.vertical, 12)
            .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
            .contentShape(.rect)
            .background(configuration.isPressed ? Color(uiColor: .systemFill) : .clear)
    }
}

/// Press feedback for tappable content cards.
struct PressableCardStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.snappy(duration: 0.2), value: configuration.isPressed)
    }
}

struct NavigationRowLabel: View {
    let title: String
    var detail: String? = nil
    let symbol: String
    var color: Color = BojiTheme.accent
    var body: some View {
        HStack(spacing: 14) {
            SymbolTile(symbol: symbol, color: color)
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(.body.weight(.medium)).foregroundStyle(.primary)
                if let detail { Text(detail).font(.subheadline).foregroundStyle(.secondary) }
            }
            Spacer(minLength: 8)
            Image(systemName: "chevron.forward").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
                .accessibilityHidden(true)
        }
    }
}

/// A non-interactive row in `GroupedRows`.
struct InfoRow: View {
    let text: String
    let symbol: String
    var body: some View {
        Label { Text(text).foregroundStyle(.primary) } icon: { Image(systemName: symbol).foregroundStyle(BojiTheme.accent) }
            .font(.subheadline)
            .padding(.horizontal, 16).padding(.vertical, 14)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// Switches a row of cards to a column at accessibility text sizes.
struct AdaptiveStack<Content: View>: View {
    var spacing: CGFloat = 12
    @ViewBuilder var content: Content
    @Environment(\.dynamicTypeSize) private var dynamicType
    var body: some View {
        let layout = dynamicType.isAccessibilitySize
            ? AnyLayout(VStackLayout(alignment: .leading, spacing: spacing))
            : AnyLayout(HStackLayout(alignment: .top, spacing: spacing))
        layout { content }
    }
}

private struct ActionLabel: View {
    let title: String
    let symbol: String?
    var body: some View {
        Group {
            if let symbol { Label(title, systemImage: symbol) } else { Text(title) }
        }
        .font(.headline).frame(maxWidth: .infinity)
    }
}

extension View {
    /// Applies the brand page color to scroll views, lists and forms.
    func pageBackground() -> some View {
        scrollContentBackground(.hidden).background(BojiTheme.background.ignoresSafeArea())
    }
}

private extension Color {
    init(light: UInt32, dark: UInt32, lightHighContrast: UInt32? = nil, darkHighContrast: UInt32? = nil) {
        self.init(light: UIColor(hex: light), dark: UIColor(hex: dark),
                  lightHighContrast: lightHighContrast.map(UIColor.init(hex:)),
                  darkHighContrast: darkHighContrast.map(UIColor.init(hex:)))
    }

    init(light: UIColor, dark: UIColor, lightHighContrast: UIColor? = nil, darkHighContrast: UIColor? = nil) {
        self.init(uiColor: UIColor { traits in
            let highContrast = traits.accessibilityContrast == .high
            let color = traits.userInterfaceStyle == .dark
                ? (highContrast ? darkHighContrast : nil) ?? dark
                : (highContrast ? lightHighContrast : nil) ?? light
            return color.resolvedColor(with: traits)
        })
    }
}

private extension UIColor {
    convenience init(hex: UInt32) {
        self.init(red: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255,
                  blue: CGFloat(hex & 0xFF) / 255, alpha: 1)
    }
}
