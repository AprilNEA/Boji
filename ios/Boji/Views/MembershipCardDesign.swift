import SwiftUI

extension MembershipCardAppearance {
    var backgroundColors: [Color] {
        switch self {
        case .forest: [Color(red: 0.13, green: 0.26, blue: 0.21), Color(red: 0.07, green: 0.15, blue: 0.13)]
        case .chalk: [Color(red: 0.94, green: 0.92, blue: 0.85), Color(red: 0.85, green: 0.87, blue: 0.80)]
        case .ink: [Color(red: 0.22, green: 0.24, blue: 0.29), Color(red: 0.09, green: 0.10, blue: 0.13)]
        }
    }

    var foreground: Color {
        self == .chalk ? Color(red: 0.12, green: 0.22, blue: 0.18) : Color(red: 0.97, green: 0.95, blue: 0.88)
    }
}

/// The card face is content, so it uses solid colors and no glass.
/// Text scales up to `xxxLarge`; the identity details below the card show the full text at every size.
struct MembershipCardSurface: View {
    let name: String
    let number: String?
    let joinedAt: Date?
    let badge: String
    let annotation: String
    var numberPlaceholder = "卡号已隐藏"
    var appearance: MembershipCardAppearance = .forest

    var body: some View {
        VStack(alignment: .leading, spacing: 26) {
            ViewThatFits(in: .horizontal) {
                HStack(alignment: .top) { brand; Spacer(minLength: 20); badgeLabel }
                VStack(alignment: .leading, spacing: 12) { brand; badgeLabel }
            }
            VStack(alignment: .leading, spacing: 8) {
                Text("薄肌俱乐部").font(.caption.weight(.medium)).tracking(3)
                Text(verbatim: name).font(.title2.bold()).fixedSize(horizontal: false, vertical: true)
                VStack(alignment: .leading, spacing: 5) {
                    Text("会员卡号").font(.caption2)
                    if let number {
                        Text(verbatim: number).font(.system(.subheadline, design: .monospaced))
                            .fixedSize(horizontal: false, vertical: true)
                            .accessibilityLabel("会员卡号，\(number)")
                            .accessibilityIdentifier("membership-card-number")
                    } else {
                        Text(numberPlaceholder).font(.subheadline)
                    }
                }
            }
            Rectangle().fill(appearance.foreground.opacity(0.23)).frame(height: 1).accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 7) {
                if let joinedAt {
                    Text("加入于 \(joinedAt.formatted(.dateTime.year().month().day().locale(Locale(identifier: "zh_Hans_CN"))))")
                        .font(.caption).monospacedDigit()
                } else {
                    Text("入会日期将在领取后显示").font(.caption)
                }
                Text(annotation).font(.caption2).fixedSize(horizontal: false, vertical: true)
                Text("MY BODY. MY PACE.").font(.caption2.weight(.semibold)).tracking(1.8)
                    .padding(.top, 3).accessibilityHidden(true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(24)
        .foregroundStyle(appearance.foreground)
        .background {
            LinearGradient(colors: appearance.backgroundColors, startPoint: .topLeading, endPoint: .bottomTrailing)
                .overlay(alignment: .topTrailing) {
                    Image(systemName: "leaf.circle").font(.system(size: 180, weight: .ultraLight))
                        .foregroundStyle(appearance.foreground.opacity(0.07))
                        .offset(x: 40, y: 65).accessibilityHidden(true)
                }
        }
        .clipShape(.rect(cornerRadius: BojiTheme.cardRadius))
        .overlay(RoundedRectangle(cornerRadius: BojiTheme.cardRadius).strokeBorder(appearance.foreground.opacity(0.15), lineWidth: 1))
        .dynamicTypeSize(...DynamicTypeSize.xxxLarge)
    }

    private var brand: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text("boji").font(.system(.largeTitle, design: .rounded, weight: .heavy))
            Text("A CLUB FOR EVERY BODY").font(.caption2.weight(.semibold)).tracking(1.2)
        }.accessibilityElement(children: .ignore).accessibilityLabel("Boji 薄肌俱乐部")
    }

    private var badgeLabel: some View {
        Text(badge).font(.caption.weight(.semibold)).fixedSize()
            .padding(.horizontal, 11).padding(.vertical, 7)
            .overlay(Capsule().strokeBorder(appearance.foreground.opacity(0.35)))
    }
}

struct MembershipCardFace: View {
    let card: ClubMember
    var isTest = false
    var isOffline = false

    var body: some View {
        let condition = MembershipCardCondition.resolve(card: card, isOffline: isOffline)
        MembershipCardSurface(
            name: card.displayName, number: card.memberNumber, joinedAt: card.joinedAt,
            badge: isTest ? "测试卡" : condition.title,
            annotation: isTest ? (isOffline ? "测试卡 · 离线副本 · 非真实会员" : "测试卡 · 非真实会员") : isOffline ? "离线副本 · 状态待同步" : "免费俱乐部身份卡"
        )
    }
}
