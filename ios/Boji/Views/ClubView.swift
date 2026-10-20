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
                        Text("选择两天动一动，其余时间好好恢复。这是你的本地挑战，不排名，也不催促。")
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
    static let all: [ClubArticle] = [
        .init(id: 0, title: "第一次训练，不必用力过猛", subtitle: "训练起步 · 2 分钟阅读", symbol: "figure.strengthtraining.traditional", color: BojiTheme.accent,
              sections: [("从能完成的量开始", "第一次的目标不是练到筋疲力尽，而是熟悉动作。选择轻负荷，保持呼吸。做不完时可以减少次数。"), ("给恢复留出位置", "把力量训练分散到不同的日子。明显疲劳时休息，不用为了打卡补练。"), ("不舒服就停下", "肌肉用力和疼痛并不相同。出现锐痛、头晕或胸部不适时立即停止，并按情况寻求专业帮助。")]),
        .init(id: 1, title: "好好吃饭，比完美食谱重要", subtitle: "饮食日常 · 2 分钟阅读", symbol: "fork.knife", color: BojiTheme.green,
              sections: [("先吃得规律", "从规律吃饭开始，不用靠挨饿换取线条。为自己留出完整的一餐，比追求一份完美食谱更可持续。"), ("让餐盘丰富一点", "主食、蔬菜和蛋白质食物都可以出现在餐盘里。根据口味和条件选择，不必购买特定补剂。"), ("不把食物分成好坏", "偶尔的聚餐不会抹去你的努力。吃完不需要惩罚式运动。有疾病或特殊营养需求时，咨询专业人员。")]),
        .init(id: 2, title: "休息，不是计划之外的事", subtitle: "恢复习惯 · 1 分钟阅读", symbol: "moon.stars", color: BojiTheme.purple,
              sections: [("留一个放松的夜晚", "尝试稳定的作息，睡前给自己一段不被工作打扰的时间。记录睡眠是为了了解自己，而不是完成分数。"), ("今天不练，也可以", "疲劳时可以休息，或选择舒适的轻活动。休息不会让你失去俱乐部的入场券。"), ("持续不适时求助", "如果睡眠或疲劳问题持续影响生活，寻求专业帮助。App 中的记录不是医学诊断。")])
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
