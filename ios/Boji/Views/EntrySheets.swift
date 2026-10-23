import SwiftUI

enum DailySheet: String, Identifiable {
    case water, sleep, body
    var id: String { rawValue }
    var title: String {
        switch self {
        case .water: String(localized: .Shared.sheetWaterTitle)
        case .sleep: String(localized: .Shared.sheetSleepTitle)
        case .body: String(localized: .Shared.sheetBodyTitle)
        }
    }
}

struct DailyEntrySheet: View {
    let kind: DailySheet
    @Environment(BojiStore.self) private var store
    @Environment(HealthWriteStore.self) private var healthWrite
    @Environment(\.dismiss) private var dismiss
    @State private var water = 250
    @State private var sleep = 8.0
    @State private var weight = ""
    @State private var waist = ""
    @FocusState private var inputFocused: Bool
    private static let waterPresets = [150, 250, 500]
    private var valid: Bool {
        if kind != .body { return true }
        guard let w = Double(weight), let c = Double(waist) else { return false }
        return w.isFinite && c.isFinite && (30...300).contains(w) && (30...250).contains(c)
    }

    var body: some View {
        NavigationStack {
            Form {
                switch kind {
                case .water: waterForm
                case .sleep: sleepForm
                case .body: bodyForm
                }
            }
            .navigationTitle(kind.title).navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(.Shared.actionCancel, systemImage: "xmark", role: .cancel) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(.Shared.actionSave, systemImage: "checkmark", role: .confirm) { save() }.disabled(!valid)
                }
                ToolbarItemGroup(placement: .keyboard) { Spacer(); Button("完成输入") { inputFocused = false } }
            }
        }
        .presentationDetents(kind == .body ? [.large] : [.medium, .large])
        .onAppear {
            sleep = store.today.sleepHours ?? 8
            if let entry = store.bodyEntries.last { weight = String(entry.weight); waist = String(entry.waist) }
        }
    }

    @ViewBuilder private var waterForm: some View {
        Section {
            valueHeader(symbol: "drop.fill", color: BojiTheme.blue, value: "\(water)", unit: String(localized: .Shared.unitMl))
            Stepper("调整饮水量", value: $water, in: 50...1000, step: 50)
                .accessibilityValue(.Shared.waterAmount(milliliters: water))
            HStack(spacing: 8) {
                ForEach(Self.waterPresets, id: \.self) { amount in
                    Button(.Shared.waterAmount(milliliters: amount)) { withAnimation(.snappy) { water = amount } }
                        .buttonStyle(.bordered).buttonBorderShape(.capsule)
                        .tint(water == amount ? BojiTheme.blue : .secondary)
                        .frame(maxWidth: .infinity)
                }
            }
        } footer: {
            Text(.Shared.waterFooter)
        }
        if store.today.waterML > 0 {
            Section {
                Button("从今天减去 \(water) mL", role: .destructive) { store.addWater(-water); dismiss() }
            } footer: {
                Text("今天已记录 \(store.today.waterML) mL。")
            }
        }
    }

    private var sleepForm: some View {
        Section {
            valueHeader(symbol: "moon.stars.fill", color: BojiTheme.purple,
                        value: sleep.formatted(.number.precision(.fractionLength(1))), unit: String(localized: .Shared.unitHours))
            Slider(value: $sleep, in: 0...16, step: 0.5) {
                Text("睡眠时长")
            } minimumValueLabel: {
                Text("0")
            } maximumValueLabel: {
                Text("16")
            }
            .tint(BojiTheme.purple)
            .accessibilityValue("\(sleep.formatted(.number.precision(.fractionLength(1)))) \(String(localized: .Shared.unitHours))")
        } footer: {
            Text(.Shared.sleepFooter)
        }
    }

    private var bodyForm: some View {
        Section {
            LabeledContent(.Shared.bodyWeight) {
                HStack {
                    TextField(.Shared.bodyWeightHint, text: $weight).multilineTextAlignment(.trailing)
                        .keyboardType(.decimalPad).focused($inputFocused)
                    Text(.Shared.unitKg).foregroundStyle(.secondary)
                }
            }
            LabeledContent(.Shared.bodyWaist) {
                HStack {
                    TextField(.Shared.bodyWaistHint, text: $waist).multilineTextAlignment(.trailing)
                        .keyboardType(.decimalPad).focused($inputFocused)
                    Text(.Shared.unitCm).foregroundStyle(.secondary)
                }
            }
        } header: {
            Text(.Shared.bodySection)
        } footer: {
            Text(.Shared.bodyNote)
        }
    }

    private func valueHeader(symbol: String, color: Color, value: String, unit: String) -> some View {
        VStack(spacing: 6) {
            Image(systemName: symbol).font(.largeTitle).foregroundStyle(color)
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(value).font(.system(.largeTitle, design: .rounded, weight: .bold)).monospacedDigit()
                    .contentTransition(.numericText())
                Text(unit).font(.title3).foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity).padding(.vertical, 8)
        .accessibilityElement(children: .combine)
    }

    private func save() {
        switch kind {
        case .water: store.addWater(water)
        case .sleep: store.setSleep(sleep)
        case .body:
            guard let w = Double(weight), let c = Double(waist), valid else { return }
            if let entry = store.addBodyEntry(weight: w, waist: c) { healthWrite.record(entry) }
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
                VStack(alignment: .leading, spacing: 28) {
                    HStack(alignment: .firstTextBaseline) {
                        Text("boji").font(.system(.largeTitle, design: .rounded, weight: .heavy)).foregroundStyle(BojiTheme.accent)
                        Spacer()
                        Text(.Shared.appTitle).font(.subheadline.weight(.medium)).foregroundStyle(.secondary)
                    }
                    .accessibilityElement(children: .combine)
                    if let first = WorkoutLibrary.home.exercises.first {
                        ExerciseAnimationView(exercise: first, isDecorative: true)
                            .frame(maxWidth: 260).frame(maxWidth: .infinity)
                            .background(BojiTheme.wash.opacity(0.6), in: .circle)
                    }
                    PageHeading(eyebrow: String(localized: .Shared.welcomeEyebrow), title: String(localized: .Shared.welcomeTitle),
                                subtitle: String(localized: .Shared.welcomeSubtitle))
                    VStack(alignment: .leading, spacing: 12) {
                        Text(.Shared.welcomeQuestion).font(.headline).accessibilityAddTraits(.isHeader)
                        GroupedRows {
                            ForEach(PlanKind.allCases) { plan in
                                Button { withAnimation(.snappy) { selected = plan } } label: {
                                    HStack(spacing: 14) {
                                        SymbolTile(symbol: plan.symbol)
                                        VStack(alignment: .leading, spacing: 3) {
                                            Text(plan.title).font(.body.weight(.medium)).foregroundStyle(.primary)
                                            Text(plan.subtitle).font(.subheadline).foregroundStyle(.secondary)
                                        }
                                        Spacer()
                                        Image(systemName: selected == plan ? "checkmark.circle.fill" : "circle")
                                            .font(.title3)
                                            .foregroundStyle(selected == plan ? BojiTheme.accent : Color.secondary)
                                            .contentTransition(.symbolEffect(.replace))
                                    }
                                }
                                .buttonStyle(RowButtonStyle())
                                .accessibilityAddTraits(selected == plan ? .isSelected : [])
                            }
                        }
                    }
                    VStack(alignment: .leading, spacing: 6) {
                        Label(.Shared.welcomePrivacy, systemImage: "lock.shield")
                        Label(.Shared.welcomeDisclaimer, systemImage: "heart.text.clipboard")
                    }
                    .font(.footnote).foregroundStyle(.secondary)
                }
                .padding(.horizontal, 20).padding(.vertical, 16)
                .frame(maxWidth: 640).frame(maxWidth: .infinity)
            }
            .pageBackground()
            .safeAreaBar(edge: .bottom) {
                PrimaryButton(title: String(localized: .Shared.welcomeStart)) { store.selectedPlan = selected; store.hasOnboarded = true; dismiss() }
                    .padding(.horizontal, 20).padding(.bottom, 8)
                    .frame(maxWidth: 640)
            }
        }
        .interactiveDismissDisabled()
    }
}
