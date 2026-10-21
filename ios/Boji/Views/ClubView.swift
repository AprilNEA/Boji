import SwiftUI

struct ClubView: View {
    @Environment(BojiStore.self) private var store
    @Namespace private var transition
    private var trainingDays: Int {
        guard let week = Calendar.current.dateInterval(of: .weekOfYear, for: Date()) else { return 0 }
        return store.weekRecords.filter { week.contains($0.date) && !$0.completedWorkoutIDs.isEmpty }.count
    }

    var body: some View {
        NavigationStack {
            PageScroll {
                MembershipEntryView()
                challengeCard
                VStack(alignment: .leading, spacing: 12) {
                    SectionHeading(title: String(localized: .Shared.clubGuideTitle), detail: String(localized: .Shared.clubGuideDetail))
                    GroupedRows {
                        ForEach(ClubArticle.all) { article in
                            NavigationLink {
                                ArticleView(article: article)
                                    .navigationTransition(.zoom(sourceID: article.id, in: transition))
                            } label: {
                                NavigationRowLabel(title: article.title, detail: article.subtitle, symbol: article.symbol, color: article.color)
                            }
                            .buttonStyle(RowButtonStyle())
                            .matchedTransitionSource(id: article.id, in: transition)
                        }
                    }
                }
                Text("会员身份由俱乐部服务保存，日常记录仍留在本机。多人小队和线上社区尚未开放。")
                    .font(.footnote).foregroundStyle(.secondary)
            }
            .navigationTitle(.Shared.tabClub)
            .navigationSubtitle(.Shared.clubTitle)
            .profileToolbar()
        }
    }

    private var challengeCard: some View {
        Surface {
            VStack(alignment: .leading, spacing: 16) {
                HStack(alignment: .top, spacing: 12) {
                    SymbolTile(symbol: "flag.checkered", color: BojiTheme.accent)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(.Shared.clubChallengeTitle).font(.headline)
                        Text(.Shared.clubChallengeText)
                            .font(.subheadline).foregroundStyle(.secondary)
                    }
                }
                if store.joinedChallenge {
                    HStack(spacing: 10) {
                        ForEach(0..<2, id: \.self) { i in
                            Image(systemName: trainingDays > i ? "checkmark.circle.fill" : "circle.dashed")
                                .font(.title).foregroundStyle(BojiTheme.green)
                                .contentTransition(.symbolEffect(.replace))
                        }
                        Spacer()
                        Text(.Shared.clubChallengeProgress(days: min(trainingDays, 2))).font(.headline).monospacedDigit()
                    }
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel("本周已训练 \(min(trainingDays, 2)) 天，目标 2 天")
                    Text(trainingDays >= 2 ? LocalizedStringResource.Shared.clubChallengeDone : .Shared.clubChallengePending)
                        .font(.footnote).foregroundStyle(.secondary)
                    Button(.Shared.clubChallengeLeave, role: .destructive) { withAnimation(.snappy) { store.joinedChallenge = false } }
                        .font(.subheadline).buttonStyle(.borderless).frame(minHeight: 44)
                } else {
                    CardButton(title: String(localized: .Shared.clubChallengeJoin), symbol: "plus") { withAnimation(.snappy) { store.joinedChallenge = true } }
                }
            }
        }
    }
}

struct ClubArticle: Identifiable {
    let id: Int
    let title: String
    let subtitle: String
    let symbol: String
    let color: Color
    let sections: [(String, String)]

    /// Category and reading time, such as 训练起步 · 2 分钟阅读.
    private static func articleMeta(category: String, minutes: Int) -> String {
        String(localized: .Shared.articleMeta(category: category, minutes: minutes))
    }

    /// Starter guide. Structure and IDs match `ClubArticles` in the Android `ClubArticle.kt`.
    /// The text is in the `article` group of `locales/`.
    static let all: [ClubArticle] = [
        .init(id: 0, title: String(localized: .Shared.articleFirstWorkoutTitle),
              subtitle: articleMeta(category: String(localized: .Shared.articleFirstWorkoutCategory), minutes: 2),
              symbol: "figure.strengthtraining.traditional", color: BojiTheme.accent,
              sections: [
                  (String(localized: .Shared.articleFirstWorkoutS1Title),
                   String(localized: .Shared.articleFirstWorkoutS1Body)),
                  (String(localized: .Shared.articleFirstWorkoutS2Title),
                   String(localized: .Shared.articleFirstWorkoutS2Body)),
                  (String(localized: .Shared.articleFirstWorkoutS3Title),
                   String(localized: .Shared.articleFirstWorkoutS3Body))
              ]),
        .init(id: 1, title: String(localized: .Shared.articleEatWellTitle),
              subtitle: articleMeta(category: String(localized: .Shared.articleEatWellCategory), minutes: 2),
              symbol: "fork.knife", color: BojiTheme.green,
              sections: [
                  (String(localized: .Shared.articleEatWellS1Title),
                   String(localized: .Shared.articleEatWellS1Body)),
                  (String(localized: .Shared.articleEatWellS2Title),
                   String(localized: .Shared.articleEatWellS2Body)),
                  (String(localized: .Shared.articleEatWellS3Title),
                   String(localized: .Shared.articleEatWellS3Body))
              ]),
        .init(id: 2, title: String(localized: .Shared.articleRestWellTitle),
              subtitle: articleMeta(category: String(localized: .Shared.articleRestWellCategory), minutes: 1),
              symbol: "moon.stars", color: BojiTheme.purple,
              sections: [
                  (String(localized: .Shared.articleRestWellS1Title),
                   String(localized: .Shared.articleRestWellS1Body)),
                  (String(localized: .Shared.articleRestWellS2Title),
                   String(localized: .Shared.articleRestWellS2Body)),
                  (String(localized: .Shared.articleRestWellS3Title),
                   String(localized: .Shared.articleRestWellS3Body))
              ])
    ]
}

struct ArticleView: View {
    let article: ClubArticle
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 12) {
                    SymbolTile(symbol: article.symbol, color: article.color)
                    Text(article.title).font(.largeTitle.bold()).accessibilityAddTraits(.isHeader)
                    Text(article.subtitle).font(.subheadline).foregroundStyle(.secondary)
                }
                ForEach(article.sections.indices, id: \.self) { index in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(article.sections[index].0).font(.title3.bold()).accessibilityAddTraits(.isHeader)
                        Text(article.sections[index].1).font(.body).lineSpacing(6)
                    }
                }
                Divider()
                Text(.Shared.articleFooter).font(.footnote).foregroundStyle(.secondary)
            }
            .padding(.horizontal, 20).padding(.vertical, 16)
            .frame(maxWidth: 680, alignment: .leading).frame(maxWidth: .infinity)
        }
        .pageBackground()
        .navigationTitle(.Shared.articleScreenTitle).navigationBarTitleDisplayMode(.inline)
    }
}
