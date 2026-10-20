import SwiftUI

enum DailySheet: String, Identifiable {
    case water, sleep, body
    var id: String { rawValue }
    var title: String { switch self { case .water: "记录饮水"; case .sleep: "记录睡眠"; case .body: "记录身体数据" } }
}

struct DailyEntrySheet: View {
    let kind: DailySheet
    @Environment(BojiStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var water = 250
    @State private var sleep = 8.0
    @State private var weight = ""
    @State private var waist = ""
    @FocusState private var inputFocused: Bool
    private var valid: Bool {
        if kind != .body { return true }
        guard let w = Double(weight), let c = Double(waist) else { return false }
        return w.isFinite && c.isFinite && (30...300).contains(w) && (30...250).contains(c)
    }
    var body: some View {
        NavigationStack {
            Form {
                if kind == .water {
                    Section {
                        HStack { Spacer(); Image(systemName: "drop.fill").font(.system(size: 48)).foregroundStyle(BojiTheme.blue); Spacer() }.listRowBackground(Color.clear)
                        Picker("本次饮水量", selection: $water) {
                            Text("150 mL").tag(150); Text("250 mL").tag(250); Text("500 mL").tag(500)
                        }.pickerStyle(.segmented)
                        Stepper("\(water) mL", value: $water, in: 50...1000, step: 50)
                    } footer: { Text("按实际饮水量记录，少量多次。没有必须完成的饮水指标。") }
                    if store.today.waterML > 0 {
                        Section { Button("撤回 250 mL", role: .destructive) { store.addWater(-250); dismiss() } }
                    }
                } else if kind == .sleep {
                    Section {
                        HStack { Spacer(); Image(systemName: "moon.stars.fill").font(.system(size: 48)).foregroundStyle(BojiTheme.purple); Spacer() }.listRowBackground(Color.clear)
                        HStack { Text("昨晚睡了"); Spacer(); Text("\(sleep, specifier: "%.1f") 小时").font(.title2.bold()).monospacedDigit() }
                        Slider(value: $sleep, in: 0...16, step: 0.5).accessibilityLabel("睡眠小时数")
                        Stepper("调整时长", value: $sleep, in: 0...16, step: 0.5)
                    } footer: { Text("这是你的主观记录，不是设备测量。记录真实的自己，不为数字焦虑。") }
                } else {
                    Section("今天的记录") {
                        HStack { Text("体重"); TextField("30–300", text: $weight).multilineTextAlignment(.trailing).keyboardType(.decimalPad).focused($inputFocused); Text("kg").foregroundStyle(.secondary) }
                        HStack { Text("腰围"); TextField("30–250", text: $waist).multilineTextAlignment(.trailing).keyboardType(.decimalPad).focused($inputFocused); Text("cm").foregroundStyle(.secondary) }
                    }
                    Section { Text("数据仅保存在此设备。建议在相近时间和条件下测量，关注长期变化。这里不设理想体重，也不评判身材。").font(.footnote).foregroundStyle(.secondary) }
                }
            }.scrollContentBackground(.hidden).pageBackground()
                .navigationTitle(kind.title).navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button("取消") { dismiss() } }
                    ToolbarItem(placement: .confirmationAction) { Button("保存", systemImage: "checkmark") { save() }.disabled(!valid) }
                    ToolbarItemGroup(placement: .keyboard) { Spacer(); Button("完成输入") { inputFocused = false } }
                }
        }.presentationDetents(kind == .body ? [.large] : [.medium, .large])
            .presentationDragIndicator(.visible)
            .onAppear {
                sleep = store.today.sleepHours ?? 8
                if let entry = store.bodyEntries.last { weight = String(entry.weight); waist = String(entry.waist) }
            }
    }
    private func save() {
        switch kind {
        case .water: store.addWater(water)
        case .sleep: store.setSleep(sleep)
        case .body:
            guard let w = Double(weight), let c = Double(waist), valid else { return }
            store.addBodyEntry(weight: w, waist: c)
        }
        dismiss()
    }
}

struct WelcomeView: View {
    @Environment(BojiStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @State private var selected: PlanKind = .home
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 26) {
                    HStack { Text("boji").font(.system(size: 44, weight: .heavy, design: .rounded)).foregroundStyle(BojiTheme.accent); Spacer(); Text("薄肌俱乐部").font(.subheadline.weight(.medium)) }
                    OrbitArtwork().frame(maxWidth: .infinity).padding(.vertical, 4)
                    PageHeading(eyebrow: "LESS PRESSURE. MORE YOU.", title: "练一点。\n好好生活。", subtitle: "不追赶别人的身材，只找到自己的节奏。")
                    VStack(alignment: .leading, spacing: 12) {
                        Text("你想在哪里开始？").font(.headline)
                        ForEach(PlanKind.allCases) { plan in
                            Button { selected = plan } label: {
                                HStack(spacing: 14) {
                                    SymbolTile(symbol: plan.symbol)
                                    VStack(alignment: .leading, spacing: 4) { Text(plan.title).font(.headline); Text(plan.subtitle).font(.caption).foregroundStyle(.secondary) }
                                    Spacer()
                                    Image(systemName: selected == plan ? "checkmark.circle.fill" : "circle").foregroundStyle(selected == plan ? BojiTheme.accent : .secondary)
                                }.padding(14).background(BojiTheme.card, in: .rect(cornerRadius: 22))
                            }.buttonStyle(.plain).accessibilityAddTraits(selected == plan ? .isSelected : [])
                        }
                    }
                    Label("无需账号，记录默认留在你的设备。", systemImage: "lock.shield").font(.footnote).foregroundStyle(.secondary)
                }.padding(24).frame(maxWidth: 640).frame(maxWidth: .infinity)
            }.pageBackground()
                .safeAreaInset(edge: .bottom) {
                    VStack(spacing: 12) {
                        PrimaryButton(title: "开始我的计划") { store.selectedPlan = selected; store.hasOnboarded = true; dismiss() }
                        Text("适合成年人的日常运动记录，不替代专业医疗建议。")
                            .font(.caption2).foregroundStyle(.secondary).multilineTextAlignment(.center)
                    }.padding(.horizontal, 24).padding(.vertical, 12).background(BojiTheme.background)
                }
        }.interactiveDismissDisabled()
    }
}
