import SwiftUI

struct TodayView: View {
    @Environment(BojiStore.self) private var store
    @Environment(\.locale) private var locale
    @State private var sheet: DailySheet?
    @Namespace private var transition
    private var workout: Workout { WorkoutLibrary.recommended(for: store.selectedPlan) }
    private var trained: Bool { !store.today.completedWorkoutIDs.isEmpty }
    private var watered: Bool { store.today.waterML > 0 }
    private var slept: Bool { store.today.sleepHours != nil }
    private var taskCount: Int { [trained, watered, slept].filter { $0 }.count }

    var body: some View {
        NavigationStack {
            PageScroll {
                rhythmCard
                HealthSummaryView()
                VStack(alignment: .leading, spacing: 12) {
                    SectionHeading(title: String(localized: .Shared.todayHabitsTitle), detail: String(localized: .Shared.todayHabitsDetail))
                    AdaptiveStack {
                        habitCard(title: String(localized: .Shared.habitWaterTitle), symbol: "drop.fill", color: BojiTheme.blue,
                                  value: "\(store.today.waterML)", unit: String(localized: .Shared.unitMl), action: .water)
                        habitCard(title: String(localized: .Shared.habitSleepTitle), symbol: "moon.stars.fill", color: BojiTheme.purple,
                                  value: store.today.sleepHours.map { $0.formatted(.number.precision(.fractionLength(1))) } ?? "—",
                                  unit: String(localized: .Shared.unitHours), action: .sleep)
                    }
                }
                VStack(alignment: .leading, spacing: 12) {
                    SectionHeading(title: String(localized: .Shared.todayRecommendTitle), detail: String(localized: .Shared.todayRecommendDetail))
                    NavigationLink {
                        WorkoutDetailView(workout: workout)
                            .navigationTransition(.zoom(sourceID: workout.id, in: transition))
                    } label: {
                        WorkoutCard(workout: workout)
                    }
                    .buttonStyle(PressableCardStyle())
                    .matchedTransitionSource(id: workout.id, in: transition)
                }
                Label(.Shared.todayRestNote, systemImage: "leaf")
                    .font(.footnote).foregroundStyle(.secondary)
            }
            .navigationTitle(.Shared.tabToday)
                        // The navigation bar renders outside the SwiftUI locale environment, so format the date first.
            .navigationSubtitle(Date.now.formatted(.dateTime.month().day().weekday(.wide).locale(locale)))
            .profileToolbar()
            .sheet(item: $sheet) { DailyEntrySheet(kind: $0) }
        }
    }

    private var rhythmCard: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(.Shared.todayTitle).font(.title2.bold())
                    Text(taskCount == 0 ? LocalizedStringResource.Shared.todayRhythmNone : taskCount == 3 ? .Shared.todayRhythmAll : .Shared.todayRhythmSome)
                        .font(.subheadline).foregroundStyle(.secondary)
                }
                Spacer(minLength: 8)
                HStack(alignment: .firstTextBaseline, spacing: 2) {
                    Text("\(taskCount)").font(.system(.largeTitle, design: .rounded, weight: .bold))
                        .contentTransition(.numericText(value: Double(taskCount)))
                    Text(.Shared.todayRhythmTotal(total: 3)).font(.title3.weight(.semibold)).foregroundStyle(.secondary)
                }
                .accessibilityElement(children: .ignore)
                .accessibilityLabel("已完成 \(taskCount) 项，共 3 项")
            }
            AdaptiveStack(spacing: 8) {
                StatusTile(title: "训练", symbol: "figure.strengthtraining.traditional", color: BojiTheme.accent, done: trained)
                StatusTile(title: "饮水", symbol: "drop.fill", color: BojiTheme.blue, done: watered)
                StatusTile(title: "睡眠", symbol: "moon.stars.fill", color: BojiTheme.purple, done: slept)
            }
        }
        .padding(20)
        .background(LinearGradient(colors: [BojiTheme.wash, BojiTheme.card], startPoint: .topLeading, endPoint: .bottomTrailing),
                    in: .rect(cornerRadius: BojiTheme.cardRadius))
        .containerShape(.rect(cornerRadius: BojiTheme.cardRadius))
        .animation(.snappy, value: taskCount)
        .accessibilityElement(children: .contain)
        .accessibilityLabel(.Shared.todayRhythm)
    }

    private func habitCard(title: String, symbol: String, color: Color, value: String, unit: String, action: DailySheet) -> some View {
        Button { sheet = action } label: {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    SymbolTile(symbol: symbol, color: color)
                    Spacer()
                    Image(systemName: "plus").font(.body.weight(.bold)).foregroundStyle(color)
                }
                VStack(alignment: .leading, spacing: 2) {
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(value).font(.system(.title, design: .rounded, weight: .bold)).foregroundStyle(.primary)
                            .contentTransition(.numericText())
                        Text(unit).font(.subheadline).foregroundStyle(.secondary)
                    }
                    Text(title).font(.subheadline).foregroundStyle(.secondary)
                }
            }
            .padding(16).frame(maxWidth: .infinity, alignment: .leading)
            .background(BojiTheme.card, in: .rect(cornerRadius: BojiTheme.cardRadius))
        }
        .buttonStyle(PressableCardStyle())
        .accessibilityLabel(.Shared.habitCardA11Y(title: title, value: value, unit: unit))
    }
}

/// One daily check-in. The symbol and the text carry the state, not only the color.
private struct StatusTile: View {
    let title: String
    let symbol: String
    let color: Color
    let done: Bool
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: done ? "checkmark.circle.fill" : symbol)
                .font(.body.weight(.semibold)).foregroundStyle(done ? color : .secondary)
                .contentTransition(.symbolEffect(.replace))
            VStack(alignment: .leading, spacing: 0) {
                Text(title).font(.subheadline.weight(.medium))
                Text(done ? LocalizedStringResource.Shared.habitRecorded : "待记录").font(.caption).foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(done ? color.opacity(0.14) : Color(uiColor: .tertiarySystemFill), in: ConcentricRectangle())
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(title)：\(String(localized: done ? .Shared.habitRecorded : .Shared.habitNotRecorded))")
    }
}

/// A course cover. The still pose comes from the first exercise; only the active exercise view plays.
struct WorkoutCard: View {
    let workout: Workout
    @Environment(\.dynamicTypeSize) private var dynamicType
    var body: some View {
        HStack(alignment: .center, spacing: 8) {
            VStack(alignment: .leading, spacing: 8) {
                Text(workout.level).font(.caption.weight(.semibold)).foregroundStyle(BojiTheme.accent)
                    .padding(.horizontal, 10).padding(.vertical, 4)
                    .background(BojiTheme.accent.opacity(0.12), in: .capsule)
                Text(workout.title).font(.title2.bold()).foregroundStyle(.primary)
                Text(workout.subtitle).font(.subheadline).foregroundStyle(.secondary)
                Label(.Shared.trainingProgressionMeta(minutes: workout.minutes, exercises: workout.exercises.count), systemImage: "clock")
                    .font(.footnote.weight(.medium)).foregroundStyle(.secondary).padding(.top, 6)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            if !dynamicType.isAccessibilitySize, let exercise = workout.exercises.first {
                ExerciseAnimationView(exercise: exercise, isPlaying: false, showsPoster: true, isDecorative: true)
                    .frame(width: 136)
            }
        }
        .padding(20)
        .frame(minHeight: 180)
        .background(LinearGradient(colors: [BojiTheme.card, BojiTheme.wash], startPoint: .topLeading, endPoint: .bottomTrailing),
                    in: .rect(cornerRadius: BojiTheme.cardRadius))
        .accessibilityElement(children: .combine)
    }
}
