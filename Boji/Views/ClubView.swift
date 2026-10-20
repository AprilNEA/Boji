import SwiftUI

struct ClubView: View {
    @Environment(BojiStore.self) private var store
    @State private var settings = false
    private var trainingDays: Int {
        guard let week = Calendar.current.dateInterval(of: .weekOfYear, for: Date()) else { return 0 }
        return store.weekRecords.filter { week.contains($0.date) && !$0.completedWorkoutIDs.isEmpty }.count
    }
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    PageHeading(eyebrow: "A CLUB FOR EVERY BODY", title: "不必完美，也能入会。", subtitle: "在这里，照顾自己就是入场券。")
                    MembershipEntryView()
                    Surface {
                        VStack(alignment: .leading, spacing: 18) {
                            HStack { Text("这周，为自己留一点时间").font(.headline); Spacer(); Image(systemName: "flag.checkered").foregroundStyle(BojiTheme.accent) }
                            Text("选择两天动一动，其余时间好好恢复。\n这是你的本地挑战，不排名，也不催促。")
                                .font(.subheadline).foregroundStyle(.secondary)
                            if store.joinedChallenge {
                                HStack(spacing: 12) {
                                    ForEach(0..<2) { i in Image(systemName: trainingDays > i ? "checkmark.circle.fill" : "circle.dashed").font(.title).foregroundStyle(BojiTheme.green) }
                                    Spacer()
                                    Text("\(min(trainingDays, 2)) / 2 天").font(.headline).monospacedDigit()
                                }
                                Text(trainingDays >= 2 ? "本周的小目标完成了，给自己一点掌声。" : "训练记录会自动点亮这个小目标。")
                                    .font(.footnote).foregroundStyle(.secondary)
                                Button("退出本地挑战") { store.joinedChallenge = false }.font(.subheadline).frame(minHeight: 44)
                            } else {
                                PrimaryButton(title: "加入本地挑战", symbol: "plus") { store.joinedChallenge = true }
                            }
                        }
                    }
                    SectionHeading(title: "薄肌入门手册", detail: "少一点焦虑，多一点行动")
                    ForEach(ClubArticle.all) { article in
                        NavigationLink { ArticleView(article: article) } label: {
                            Surface {
                                HStack(spacing: 14) {
                                    SymbolTile(symbol: article.symbol, color: article.color)
                                    VStack(alignment: .leading, spacing: 5) { Text(article.title).font(.headline); Text(article.subtitle).font(.caption).foregroundStyle(.secondary) }
                                    Spacer(minLength: 0)
                                    Image(systemName: "chevron.right").font(.caption).foregroundStyle(.secondary)
                                }
                            }
                        }.buttonStyle(.plain)
                    }
                    Text("会员身份由俱乐部服务保存，日常记录仍留在本机。多人小队和线上社区尚未开放。")
                        .font(.footnote).foregroundStyle(.secondary).padding(.bottom, 20)
                }.padding(20).frame(maxWidth: 680).frame(maxWidth: .infinity)
            }.pageBackground().navigationTitle("俱乐部").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("设置", systemImage: "gearshape") { settings = true } } }
                .sheet(isPresented: $settings) { SettingsView() }
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
            VStack(alignment: .leading, spacing: 26) {
                SymbolTile(symbol: article.symbol, color: article.color)
                Text(article.title).font(.largeTitle.bold())
                Text(article.subtitle).font(.subheadline).foregroundStyle(.secondary)
                ForEach(article.sections.indices, id: \.self) { index in
                    VStack(alignment: .leading, spacing: 12) {
                        Text(article.sections[index].0).font(.title3.bold())
                        Text(article.sections[index].1).font(.body).foregroundStyle(.secondary).lineSpacing(6)
                    }
                }
                Divider()
                Text("Boji 编辑内容 · 一般生活提示，不替代医疗建议。").font(.footnote).foregroundStyle(.secondary)
            }.padding(24).frame(maxWidth: 680).frame(maxWidth: .infinity)
        }.pageBackground().navigationTitle("入门手册").navigationBarTitleDisplayMode(.inline)
    }
}
