import SwiftUI
import Charts

struct ProgressViewScreen: View {
    @Environment(BojiStore.self) private var store
    @Environment(HealthWriteStore.self) private var healthWrite
    @State private var entry = false
    @State private var metric = BodyMetric.weight
    private var shareText: String {
        String(localized: .Shared.progressShareText(
            workouts: String(localized: .Shared.progressShareWorkouts(count: store.totalWorkouts)),
            activeDays: String(localized: .Shared.progressShareDays(count: store.activeDays))
        ))
    }

    var body: some View {
        NavigationStack {
            PageScroll {
                AdaptiveStack {
                    stat(value: store.totalWorkouts, title: String(localized: .Shared.progressTotalWorkouts), unit: String(localized: .Shared.unitTimes),
                         symbol: "figure.strengthtraining.traditional", color: BojiTheme.accent)
                    stat(value: store.activeDays, title: String(localized: "留下足迹"), unit: String(localized: .Shared.unitDays), symbol: "leaf.fill", color: BojiTheme.green)
                }
                weekCard
                HealthSummaryView()
                bodySection
            }
            .navigationTitle(.Shared.tabProgress)
            .navigationSubtitle(.Shared.progressSubtitle)
            .profileToolbar {
                ShareLink(item: shareText, subject: Text("我的薄肌足迹"), message: Text(.Shared.progressShareSubtitle)) {
                    Label(.Shared.progressShareA11Y, systemImage: "square.and.arrow.up")
                }
            }
            .sheet(isPresented: $entry) { DailyEntrySheet(kind: .body) }
        }
    }

    private var weekCard: some View {
        Surface {
            VStack(alignment: .leading, spacing: 16) {
                SectionHeading(title: String(localized: .Shared.progressWeekTitle), detail: String(localized: "训练、饮水或睡眠"))
                HStack(spacing: 0) {
                    ForEach(store.weekRecords) { record in
                        let active = record.waterML > 0 || record.sleepHours != nil || !record.completedWorkoutIDs.isEmpty
                        let isToday = Calendar.current.isDateInToday(record.date)
                        VStack(spacing: 8) {
                            Text(record.date, format: .dateTime.weekday(.narrow))
                                .font(.caption.weight(isToday ? .bold : .regular))
                                .foregroundStyle(isToday ? BojiTheme.accent : .secondary)
                            ZStack {
                                Circle().fill(active ? BojiTheme.accentFill : Color(uiColor: .tertiarySystemFill))
                                if active {
                                    Image(systemName: "checkmark").font(.footnote.bold()).foregroundStyle(.white)
                                } else {
                                    Text(record.date.formatted(.dateTime.day())).font(.footnote).foregroundStyle(.secondary)
                                }
                            }
                            .frame(width: 34, height: 34)
                            .overlay { if isToday { Circle().strokeBorder(BojiTheme.accent, lineWidth: 2).padding(-4) } }
                        }
                        .frame(maxWidth: .infinity)
                        .accessibilityElement(children: .ignore)
                        .accessibilityLabel(dayLabel(record.date, isToday: isToday, active: active))
                    }
                }
                Text(.Shared.progressWeekNote).font(.footnote).foregroundStyle(.secondary)
            }
        }
    }

    private var bodySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                Text(.Shared.progressBodyTitle).font(.title3.bold()).accessibilityAddTraits(.isHeader)
                Spacer()
                Button(.Shared.progressBodyAdd, systemImage: "plus") { entry = true }
                    .buttonStyle(.bordered).buttonBorderShape(.capsule)
            }
            Surface {
                VStack(alignment: .leading, spacing: 16) {
                    Picker("查看指标", selection: $metric.animation(.snappy)) {
                        ForEach(BodyMetric.allCases) { Text($0.title).tag($0) }
                    }
                    .pickerStyle(.segmented)
                    if let latest = store.bodyEntries.last {
                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text(metric.value(of: latest).formatted(.number.precision(.fractionLength(1))))
                                .font(.system(.largeTitle, design: .rounded, weight: .bold))
                                .contentTransition(.numericText())
                            Text(metric.unit).font(.title3).foregroundStyle(.secondary)
                            Spacer()
                            Text(.Shared.progressLatest).font(.footnote).foregroundStyle(.secondary)
                        }
                        Chart(store.bodyEntries) { item in
                            LineMark(x: .value("日期", item.date), y: .value(metric.title, metric.value(of: item)))
                                .foregroundStyle(BojiTheme.accent).interpolationMethod(.monotone)
                            PointMark(x: .value("日期", item.date), y: .value(metric.title, metric.value(of: item)))
                                .foregroundStyle(BojiTheme.accent)
                        }
                        .chartYScale(domain: .automatic(includesZero: false))
                        .frame(height: 170)
                        .accessibilityLabel("身体记录趋势，共 \(store.bodyEntries.count) 条。下方列出最近的数值。")
                    } else {
                        ContentUnavailableView {
                            Label(.Shared.progressEmptyTitle, systemImage: "chart.xyaxis.line")
                        } description: {
                            Text(.Shared.progressEmptyText)
                        }
                    }
                }
            }
            if !store.bodyEntries.isEmpty {
                GroupedRows {
                    ForEach(store.bodyEntries.suffix(5).reversed()) { item in
                        HStack {
                            Text(item.date.formatted(date: .abbreviated, time: .omitted)).foregroundStyle(.secondary)
                            Spacer()
                            Text("\(metric.value(of: item).formatted(.number.precision(.fractionLength(1)))) \(metric.unit)")
                                .monospacedDigit()
                        }
                        .font(.subheadline)
                        .padding(.horizontal, 16).frame(minHeight: 48)
                        .contentShape(.rect)
                        .contextMenu {
                            Button(.Shared.progressEntryDelete, systemImage: "trash", role: .destructive) { deleteBodyEntry(id: item.id) }
                        }
                        .accessibilityElement(children: .combine)
                        .accessibilityAction(named: .Shared.progressEntryDelete) { deleteBodyEntry(id: item.id) }
                    }
                }
                Text("长按一条记录可以删除。").font(.footnote).foregroundStyle(.secondary)
            }
        }
    }

    /// Deletes the entry here and, when writing is on, the samples that Boji saved for it.
    private func deleteBodyEntry(id: UUID) {
        store.deleteBodyEntry(id: id)
        healthWrite.removeBodyEntry(id: id)
    }

    /// The VoiceOver label of one day in the week card. Each case is one full sentence, so that
    /// translators see the whole text.
    private func dayLabel(_ date: Date, isToday: Bool, active: Bool) -> Text {
        let style = Date.FormatStyle(date: .abbreviated, time: .omitted)
        switch (isToday, active) {
        case (true, true): return Text("\(date, format: style)，今天，有记录")
        case (true, false): return Text("\(date, format: style)，今天，暂无记录")
        case (false, true): return Text("\(date, format: style)，有记录")
        case (false, false): return Text("\(date, format: style)，暂无记录")
        }
    }

    private func stat(value: Int, title: String, unit: String, symbol: String, color: Color) -> some View {
        Surface(padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                SymbolTile(symbol: symbol, color: color)
                VStack(alignment: .leading, spacing: 2) {
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(value)").font(.system(.largeTitle, design: .rounded, weight: .bold))
                        Text(unit).font(.subheadline).foregroundStyle(.secondary)
                    }
                    Text(title).font(.subheadline).foregroundStyle(.secondary)
                }
            }
        }
        .accessibilityElement(children: .combine)
    }
}

private enum BodyMetric: String, CaseIterable, Identifiable {
    case weight, waist
    var id: Self { self }
    var title: String { String(localized: self == .weight ? .Shared.progressMetricWeight : .Shared.progressMetricWaist) }
    var unit: String { String(localized: self == .weight ? .Shared.unitKg : .Shared.unitCm) }
    func value(of entry: BodyEntry) -> Double { self == .weight ? entry.weight : entry.waist }
}
