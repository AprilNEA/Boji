import SwiftUI

struct HealthConnectionView: View {
    @Environment(HealthDataStore.self) private var health
    @State private var confirmDisconnect = false

    var body: some View {
        Form {
            Section {
                Label("让记录少一点，让生活多一点", systemImage: "heart.text.clipboard")
                    .font(.headline)
                Text("查看近 30 天的睡眠、体重和腰围，也可以把训练和身体记录写入 Apple 健康。健康数据不会上传到俱乐部。")
                    .font(.footnote).foregroundStyle(.secondary)
            }
            Section("查看健康数据") {
                if !health.isAvailable {
                    Label("此设备暂不支持健康数据", systemImage: "exclamationmark.circle")
                    Text("你仍可使用所有手动记录功能。")
                } else {
                    Label(health.isEnabled ? "已开启健康数据查询" : "尚未连接 Apple 健康", systemImage: health.isEnabled ? "heart.fill" : "heart")
                    Button(health.isEnabled ? "管理所需数据授权" : "连接 Apple 健康") {
                        Task { await health.connect() }
                    }.disabled(health.isLoading).accessibilityIdentifier("health-connect")
                    if health.isEnabled {
                        Button("刷新健康数据", systemImage: "arrow.clockwise") { Task { await health.refresh() } }
                            .disabled(health.isLoading).accessibilityIdentifier("health-refresh")
                    }
                    if health.isLoading { ProgressView("正在查询…") }
                    if let date = health.lastSyncedAt {
                        LabeledContent("上次查询", value: date.formatted(date: .abbreviated, time: .shortened))
                    }
                }
                if let error = health.errorMessage { Text(error).foregroundStyle(.red).font(.footnote) }
            }
            if health.isEnabled {
                Section("最近可读取的数据") {
                    HealthValuesView()
                }
                Section("身体样本 · 近 30 天") {
                    if health.snapshot.measurements.isEmpty {
                        Text("暂无可读取数据").foregroundStyle(.secondary)
                    } else {
                        ForEach(health.snapshot.measurements.sorted { $0.date > $1.date }.prefix(20)) { sample in
                            VStack(alignment: .leading, spacing: 5) {
                                HStack {
                                    Text(sample.metric == .weight ? LocalizedStringResource.Shared.bodyWeight : .Shared.bodyWaist)
                                    Spacer()
                                    Text("\(sample.value.formatted(.number.precision(.fractionLength(1)))) \(String(localized: sample.metric == .weight ? .Shared.unitKg : .Shared.unitCm))")
                                }
                                Text("\(sample.date.formatted(date: .abbreviated, time: .shortened)) · \(sample.sourceName)")
                                    .font(.caption).foregroundStyle(.secondary)
                            }.accessibilityElement(children: .combine)
                        }
                    }
                }
                Section("最近睡眠日") {
                    ForEach(0..<7, id: \.self) { offset in
                        if let date = Calendar.current.date(byAdding: .day, value: -offset, to: Date()) {
                            LabeledContent(date.formatted(.dateTime.month().day()), value: health.snapshot.sleepHours(endingOn: date).map { "\($0.formatted(.number.precision(.fractionLength(1)))) \(String(localized: .Shared.unitHours))" } ?? String(localized: "暂无可读取数据"))
                        }
                    }
                    Text("每个睡眠日为前日 18:00 至当日 18:00。只统计睡眠区间，重叠来源不重复相加，不把卧床当作睡眠。")
                        .font(.footnote).foregroundStyle(.secondary)
                    let sources = Set(health.snapshot.sleepSamples.map(\.sourceName)).sorted()
                    if !sources.isEmpty { Text("来源：\(sources, format: .list(type: .and))").font(.caption).foregroundStyle(.secondary) }
                }
                Section {
                    Button("断开健康数据查询", role: .destructive) { confirmDisconnect = true }
                }
            }
            // Writing has its own switch. It follows the read results, so that the read status and its data stay together.
            if health.isAvailable {
                HealthWriteSection()
            }
            Section("你决定分享哪些数据") {
                Text("完成授权窗口不代表每项读取权限都已授予。没有可读取的样本时，这里不会把缺失值当成零。")
                Text("样本只在 App 运行时展示，不写入本地导出文件。手动记录单独保存，不会被健康数据覆盖。")
                Text("你可以在健康 App 中管理薄肌的访问权限。断开查询只清除本 App 的显示，不撤销系统授权，也不删除健康 App 的记录。")
            }.font(.footnote).foregroundStyle(.secondary)
        }
        .pageBackground()
        .navigationTitle("Apple 健康").navigationBarTitleDisplayMode(.inline)
        .task { if health.isEnabled { await health.refresh() } }
        .confirmationDialog("断开 Apple 健康查询？", isPresented: $confirmDisconnect, titleVisibility: .visible) {
            Button("断开并清除当前显示", role: .destructive) { health.disconnect() }
            Button(.Shared.actionCancel, role: .cancel) {}
        } message: { Text("不影响手动记录，也不修改健康 App 中的原始数据。") }
    }
}

struct HealthSummaryView: View {
    @Environment(HealthDataStore.self) private var health
    var body: some View {
        if health.isEnabled {
            NavigationLink { HealthConnectionView() } label: {
                Surface {
                    VStack(alignment: .leading, spacing: 14) {
                        HStack {
                            Label("来自 Apple 健康", systemImage: "heart.fill").font(.headline).foregroundStyle(.primary)
                                .symbolRenderingMode(.multicolor)
                            Spacer()
                            Image(systemName: "chevron.forward").font(.footnote.weight(.semibold)).foregroundStyle(.tertiary)
                                .accessibilityHidden(true)
                        }
                        HealthValuesView().foregroundStyle(.primary)
                        Text("来自其他 App 和设备 · 与手动记录分开").font(.footnote).foregroundStyle(.secondary)
                        if health.errorMessage != nil {
                            Text("本次查询未完成，请到健康连接页重试。").font(.footnote).foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .buttonStyle(PressableCardStyle())
            .accessibilityHint("查看健康数据与来源")
        }
    }
}

/// The switch that writes the records of Boji to Apple Health, and the write permissions.
private struct HealthWriteSection: View {
    @Environment(HealthWriteStore.self) private var healthWrite
    @State private var confirmDisable = false

    var body: some View {
        Section {
            Toggle(isOn: Binding(get: { healthWrite.isEnabled }, set: { isOn in
                if isOn { healthWrite.enable() } else { confirmDisable = true }
            })) {
                Label("写入训练和身体记录", systemImage: "square.and.arrow.down.on.square")
            }
            .disabled(healthWrite.isWorking)
            .accessibilityIdentifier("health-write-toggle")
            if healthWrite.isEnabled {
                permissionRow(Text("训练记录"), healthWrite.status.workout)
                permissionRow(Text(.Shared.bodyWeight), healthWrite.status.weight)
                permissionRow(Text(.Shared.bodyWaist), healthWrite.status.waist)
                if [healthWrite.status.workout, healthWrite.status.weight, healthWrite.status.waist].contains(.denied) {
                    Text("未允许的类型不会写入。你可以在健康 App 中更改薄肌的访问权限。")
                        .font(.footnote).foregroundStyle(.secondary)
                }
            }
            if healthWrite.isWorking { ProgressView() }
            if healthWrite.pendingCount > 0 {
                Text("\(healthWrite.pendingCount) 条记录尚未写入，App 回到前台时会重试。")
                    .font(.footnote).foregroundStyle(.secondary)
            }
            if let error = healthWrite.errorMessage { Text(error).foregroundStyle(.red).font(.footnote) }
        } header: {
            Text("写入 Apple 健康")
        } footer: {
            Text("开启后，完成训练或新增、删除身体记录时，薄肌会同步更新 Apple 健康。只写入开启后产生的记录，不写入饮水和睡眠。查看健康数据时，不显示薄肌写入的数据。")
        }
        .confirmationDialog("停止写入 Apple 健康？", isPresented: $confirmDisable, titleVisibility: .visible) {
            Button("停止写入，保留已写入的数据") { healthWrite.disable(deletingSavedData: false) }
            Button("停止写入，并删除薄肌写入的数据", role: .destructive) { healthWrite.disable(deletingSavedData: true) }
            Button(.Shared.actionCancel, role: .cancel) {}
        } message: { Text("删除只影响薄肌写入的训练、体重和腰围，不影响其他 App 的健康数据。") }
    }

    private func permissionRow(_ title: Text, _ permission: HealthWritePermission) -> some View {
        LabeledContent {
            switch permission {
            case .authorized: Text("已允许")
            case .denied: Text("未允许")
            case .notDetermined: Text("未设置")
            }
        } label: {
            title
        }
    }
}

private struct HealthValuesView: View {
    @Environment(HealthDataStore.self) private var health
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach([HealthMetric.weight, .waist], id: \.rawValue) { metric in
                VStack(alignment: .leading, spacing: 3) {
                    LabeledContent(metric == .weight ? "最近体重" : "最近腰围", value: health.snapshot.latest(metric).map { "\($0.value.formatted(.number.precision(.fractionLength(1)))) \(String(localized: metric == .weight ? .Shared.unitKg : .Shared.unitCm))" } ?? String(localized: "暂无可读取数据"))
                    if let sample = health.snapshot.latest(metric) {
                        Text("\(sample.sourceName) · \(sample.date.formatted(.dateTime.month().day()))").font(.footnote).foregroundStyle(.secondary)
                    }
                }
            }
            LabeledContent("最近睡眠日", value: health.snapshot.sleepHours(endingOn: Date()).map { "\($0.formatted(.number.precision(.fractionLength(1)))) \(String(localized: .Shared.unitHours))" } ?? String(localized: "暂无可读取数据"))
        }.font(.subheadline)
    }
}
