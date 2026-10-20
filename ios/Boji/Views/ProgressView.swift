import SwiftUI
import Charts

struct ProgressViewScreen: View {
    @Environment(BojiStore.self) private var store
    @State private var entry = false
    @State private var metric = "weight"
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    PageHeading(eyebrow: "EVERY LITTLE STEP COUNTS", title: "看见自己的变化。", subtitle: "不和别人比，只记录来时的路。")
                    HealthSummaryView()
                    HStack(spacing: 12) {
                        stat(value: store.totalWorkouts, title: "累计训练", unit: "次", symbol: "figure.strengthtraining.traditional", color: BojiTheme.accent)
                        stat(value: store.activeDays, title: "日常打卡", unit: "天", symbol: "leaf", color: BojiTheme.green)
                    }
                    Surface {
                        VStack(alignment: .leading, spacing: 20) {
                            SectionHeading(title: "最近一周", detail: "运动 / 饮水 / 睡眠")
                            HStack(spacing: 0) {
                                ForEach(store.weekRecords) { record in
                                    let active = record.waterML > 0 || record.sleepHours != nil || !record.completedWorkoutIDs.isEmpty
                                    VStack(spacing: 11) {
                                        Text(record.date, format: .dateTime.weekday(.narrow)).font(.caption).foregroundStyle(.secondary)
                                        ZStack {
                                            Circle().fill(active ? BojiTheme.accent : BojiTheme.accent.opacity(0.07))
                                            if active { Image(systemName: "checkmark").font(.caption.bold()).foregroundStyle(.white) }
                                            else { Text(record.date.formatted(.dateTime.day())).font(.caption).foregroundStyle(.secondary) }
                                        }.frame(width: 32, height: 32)
                                        Circle().fill(Calendar.current.isDateInToday(record.date) ? BojiTheme.accent : .clear).frame(width: 4, height: 4)
                                    }.frame(maxWidth: .infinity)
                                        .accessibilityElement(children: .ignore)
                                        .accessibilityLabel("\(record.date.formatted(date: .abbreviated, time: .omitted))，\(active ? "有记录" : "暂无记录")")
                                }
                            }
                            Text("空白不是退步，随时都可以重新开始。").font(.footnote).foregroundStyle(.secondary)
                        }
                    }
                    VStack(spacing: 12) {
                        HStack {
                            Text("身体记录").font(.title3.bold()); Spacer()
                            Button("添加", systemImage: "plus") { entry = true }.buttonStyle(.glass).controlSize(.regular).frame(minHeight: 44)
                        }
                        Surface {
                            VStack(alignment: .leading, spacing: 18) {
                                Picker("查看指标", selection: $metric) { Text("体重 · kg").tag("weight"); Text("腰围 · cm").tag("waist") }.pickerStyle(.segmented)
                                if store.bodyEntries.isEmpty {
                                    EmptyNote(symbol: "chart.xyaxis.line", title: "变化，从第一次记录开始", text: "数据仅在本机保存。\n每周记录一次就好，不必每天称量。")
                                } else {
                                    if let latest = store.bodyEntries.sorted(by: { $0.date < $1.date }).last {
                                        HStack(alignment: .firstTextBaseline) {
                                            Text((metric == "weight" ? latest.weight : latest.waist).formatted(.number.precision(.fractionLength(1))))
                                                .font(.system(.largeTitle, design: .rounded, weight: .bold))
                                            Text(metric == "weight" ? "kg" : "cm").foregroundStyle(.secondary)
                                            Spacer()
                                            Text("最近一次").font(.caption).foregroundStyle(.secondary)
                                        }
                                    }
                                    Chart(store.bodyEntries.sorted { $0.date < $1.date }) { item in
                                        LineMark(x: .value("日期", item.date), y: .value("数值", metric == "weight" ? item.weight : item.waist))
                                            .foregroundStyle(BojiTheme.accent).interpolationMethod(.linear)
                                        PointMark(x: .value("日期", item.date), y: .value("数值", metric == "weight" ? item.weight : item.waist)).foregroundStyle(BojiTheme.accent)
                                    }.chartYScale(domain: .automatic(includesZero: false)).frame(height: 170)
                                        .accessibilityLabel("身体记录趋势，共 \(store.bodyEntries.count) 条。下方列出具体数值。")
                                    ForEach(store.bodyEntries.sorted { $0.date > $1.date }.prefix(5)) { item in
                                        HStack {
                                            Text(item.date.formatted(date: .abbreviated, time: .omitted)).foregroundStyle(.secondary)
                                            Spacer()
                                            Text("\((metric == "weight" ? item.weight : item.waist).formatted(.number.precision(.fractionLength(1)))) \(metric == "weight" ? "kg" : "cm")")
                                            Menu { Button("删除此记录", role: .destructive) { store.deleteBodyEntry(id: item.id) } } label: {
                                                Image(systemName: "ellipsis").frame(width: 44, height: 44)
                                            }.accessibilityLabel("管理\(item.date.formatted(date: .abbreviated, time: .omitted))的记录")
                                        }.font(.subheadline)
                                    }
                                }
                            }
                        }
                    }
                    Surface {
                        HStack(spacing: 14) {
                            SymbolTile(symbol: "square.and.arrow.up", color: BojiTheme.green)
                            VStack(alignment: .leading, spacing: 5) { Text("分享我的小小坚持").font(.headline); Text("只分享训练次数，不带身体数据。").font(.caption).foregroundStyle(.secondary) }
                            Spacer()
                            ShareLink(item: "在 Boji，我已完成 \(store.totalWorkouts) 次训练，留下 \(store.activeDays) 天生活足迹。不必完美，每一步都算数。") {
                                Image(systemName: "arrow.up.right").frame(width: 44, height: 44)
                            }.buttonStyle(.glass).accessibilityLabel("分享训练进度")
                        }
                    }.padding(.bottom, 16)
                }.padding(20).frame(maxWidth: 680).frame(maxWidth: .infinity)
            }.pageBackground().navigationTitle("足迹").navigationBarTitleDisplayMode(.inline)
                .sheet(isPresented: $entry) { DailyEntrySheet(kind: .body) }
        }
    }
    private func stat(value: Int, title: String, unit: String, symbol: String, color: Color) -> some View {
        Surface {
            VStack(alignment: .leading, spacing: 13) {
                Image(systemName: symbol).foregroundStyle(color).font(.title3)
                HStack(alignment: .firstTextBaseline, spacing: 4) { Text("\(value)").font(.system(.largeTitle, design: .rounded, weight: .bold)); Text(unit).font(.caption).foregroundStyle(.secondary) }
                Text(title).font(.subheadline).foregroundStyle(.secondary)
            }.frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
