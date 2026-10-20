import SwiftUI

struct TodayView: View {
    @Environment(BojiStore.self) private var store
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicType
    @State private var sheet: DailySheet?
    @State private var settings = false
    private var workout: Workout { WorkoutLibrary.recommended(for: store.selectedPlan) }
    private var taskCount: Int {
        (store.today.completedWorkoutIDs.isEmpty ? 0 : 1) + (store.today.waterML > 0 ? 1 : 0) + (store.today.sleepHours == nil ? 0 : 1)
    }
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    PageHeading(eyebrow: Date.now.formatted(.dateTime.month().day().weekday(.wide).locale(Locale(identifier: "zh_CN"))), title: "今天，轻一点。", subtitle: "不必一步到位，每一步都算数。")
                    rhythmCard
                    HealthSummaryView()
                    VStack(spacing: 12) {
                        SectionHeading(title: "照顾自己的小事", detail: "记录，不比较")
                        adaptiveLayout {
                            habitCard(title: "好好喝水", symbol: "drop.fill", color: BojiTheme.blue,
                                      value: "\(store.today.waterML)", unit: "mL", action: .water)
                            habitCard(title: "好好睡觉", symbol: "moon.stars.fill", color: BojiTheme.purple,
                                      value: store.today.sleepHours.map { $0.formatted(.number.precision(.fractionLength(1))) } ?? "—", unit: "小时", action: .sleep)
                        }
                    }
                    VStack(spacing: 12) {
                        SectionHeading(title: "今日推荐", detail: "跟自己的节奏走")
                        NavigationLink { WorkoutDetailView(workout: workout) } label: { WorkoutCard(workout: workout) }
                            .buttonStyle(.plain)
                    }
                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: "leaf").foregroundStyle(BojiTheme.green)
                        Text("休息也是计划的一部分。累的时候，给自己留一点空间。")
                            .font(.footnote).foregroundStyle(.secondary)
                    }.padding(.horizontal, 5).padding(.bottom, 16)
                }.padding(.horizontal, 20).padding(.top, 12).frame(maxWidth: 680)
                    .frame(maxWidth: .infinity)
            }
            .pageBackground()
            .navigationTitle("薄肌俱乐部").navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("设置", systemImage: "person.crop.circle") { settings = true }
                }
            }
            .sheet(item: $sheet) { choice in DailyEntrySheet(kind: choice) }
            .sheet(isPresented: $settings) { SettingsView() }
        }
    }
    private var adaptiveLayout: AnyLayout {
        dynamicType.isAccessibilitySize ? AnyLayout(VStackLayout(alignment: .leading, spacing: 16)) : AnyLayout(HStackLayout(spacing: 12))
    }
    private var rhythmCard: some View {
        Surface {
            adaptiveLayout {
                VStack(alignment: .leading, spacing: 10) {
                    Label("我的日常节奏", systemImage: "sparkle").font(.subheadline.weight(.medium))
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(taskCount)").font(.system(.largeTitle, design: .rounded, weight: .bold))
                        Text("/ 3").font(.title3).foregroundStyle(.secondary)
                    }
                    Text(taskCount == 0 ? "从一件小事开始" : taskCount == 3 ? "今天的自己，照顾到了" : "已经在好好照顾自己")
                        .font(.footnote).foregroundStyle(.secondary)
                    HStack(spacing: 9) {
                        statusDot("动", color: BojiTheme.accent, done: !store.today.completedWorkoutIDs.isEmpty)
                        statusDot("水", color: BojiTheme.blue, done: store.today.waterML > 0)
                        statusDot("眠", color: BojiTheme.purple, done: store.today.sleepHours != nil)
                    }
                }
                Spacer(minLength: 0)
                ZStack {
                    ring(progress: store.today.completedWorkoutIDs.isEmpty ? 0 : 1, color: BojiTheme.accent, size: 128)
                    ring(progress: store.today.waterML > 0 ? 1 : 0, color: BojiTheme.blue, size: 100)
                    ring(progress: store.today.sleepHours == nil ? 0 : 1, color: BojiTheme.purple, size: 72)
                    Image(systemName: taskCount == 3 ? "checkmark" : "leaf.fill").font(.title3).foregroundStyle(BojiTheme.green)
                }.frame(width: 130, height: 135).accessibilityHidden(true)
            }.accessibilityElement(children: .combine)
        }
    }
    private func ring(progress: Double, color: Color, size: CGFloat) -> some View {
        ZStack {
            Circle().stroke(color.opacity(0.12), lineWidth: 9)
            Circle().trim(from: 0, to: progress).stroke(color, style: StrokeStyle(lineWidth: 9, lineCap: .round))
                .rotationEffect(.degrees(-90)).animation(reduceMotion ? nil : .easeInOut(duration: 0.5), value: progress)
        }.frame(width: size, height: size)
    }
    private func statusDot(_ title: String, color: Color, done: Bool) -> some View {
        HStack(spacing: 3) { Image(systemName: done ? "checkmark.circle.fill" : "circle"); Text(title) }
            .font(.caption.weight(.medium)).foregroundStyle(color)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("\(title)：\(done ? "已记录" : "未记录")")
    }
    private func habitCard(title: String, symbol: String, color: Color, value: String, unit: String, action: DailySheet) -> some View {
        Button { sheet = action } label: {
            VStack(alignment: .leading, spacing: 13) {
                HStack {
                    Image(systemName: symbol).foregroundStyle(color)
                    Text(title).font(.subheadline.weight(.medium)).foregroundStyle(.primary)
                    Spacer(minLength: 0)
                }
                HStack(alignment: .firstTextBaseline, spacing: 4) {
                    Text(value).font(.system(.title, design: .rounded, weight: .bold)).foregroundStyle(.primary).minimumScaleFactor(0.7)
                    Text(unit).font(.caption).foregroundStyle(.secondary)
                }
                HStack { Text("记录一下").font(.caption.weight(.medium)); Spacer(); Image(systemName: "plus.circle.fill").font(.title3) }
                    .foregroundStyle(color)
            }.padding(17).frame(maxWidth: .infinity, alignment: .leading)
                .background(BojiTheme.card, in: .rect(cornerRadius: 24))
        }.buttonStyle(.plain).accessibilityLabel("\(title)，\(value)\(unit)，记录一下")
    }
}

struct WorkoutCard: View {
    let workout: Workout
    var body: some View {
        ZStack(alignment: .trailing) {
            Color(uiColor: UIColor { $0.userInterfaceStyle == .dark ? UIColor(red: 0.28, green: 0.15, blue: 0.1, alpha: 1) : UIColor(red: 0.95, green: 0.86, blue: 0.77, alpha: 1) })
            OrbitArtwork(color: BojiTheme.accent.opacity(0.7), symbol: "figure.strengthtraining.traditional")
                .offset(x: 46, y: 10)
            VStack(alignment: .leading, spacing: 13) {
                Text("MOVE AT YOUR PACE").font(.system(size: 10, weight: .bold)).tracking(1.5)
                    .foregroundStyle(BojiTheme.accent)
                Text(workout.title).font(.title2.bold()).frame(maxWidth: 210, alignment: .leading)
                Text("\(workout.minutes) 分钟 · \(workout.level)").font(.subheadline).foregroundStyle(.secondary)
                HStack(spacing: 7) { Image(systemName: "play.fill"); Text("查看训练") }
                    .font(.subheadline.bold()).padding(.top, 6)
            }.frame(maxWidth: .infinity, alignment: .leading).padding(22)
        }.frame(minHeight: 202).clipShape(.rect(cornerRadius: 26))
            .accessibilityElement(children: .combine)
    }
}
