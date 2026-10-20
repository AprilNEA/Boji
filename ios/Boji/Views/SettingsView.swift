import SwiftUI
import UniformTypeIdentifiers

struct BojiExportDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.json] }
    var data: Data
    init(data: Data) { self.data = data }
    init(configuration: ReadConfiguration) throws { data = configuration.file.regularFileContents ?? Data() }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper { FileWrapper(regularFileWithContents: data) }
}

struct SettingsView: View {
    @Environment(BojiStore.self) private var store
    @Environment(MembershipStore.self) private var membership
    @Environment(HealthDataStore.self) private var health
    @Environment(CompanionSharingStore.self) private var companion
    @Environment(\.dismiss) private var dismiss
    @AppStorage("appearance") private var appearance = "system"
    @State private var confirmDelete = false
    @State private var exporting = false
    @State private var document = BojiExportDocument(data: Data())
    @State private var exportError: String?
    @State private var showMembership = false
    @State private var showAccountSecurity = false
    private var appVersion: String {
        // `settings_version` takes an integer build number, the same value as the Android version code.
        guard let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String,
              let build = (Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String).flatMap(Int.init)
        else { return "—" }
        return String(localized: .Shared.settingsVersion(version: version, build: build))
    }
    var body: some View {
        @Bindable var store = store
        NavigationStack {
            Form {
                Section(.Shared.settingsProfile) {
                    LabeledContent(.Shared.settingsNickname) {
                        TextField(.Shared.settingsNickname, text: $store.displayName).multilineTextAlignment(.trailing).submitLabel(.done)
                    }
                    Picker(.Shared.trainingPlanLabel, selection: $store.selectedPlan) { ForEach(PlanKind.allCases) { Text($0.title).tag($0) } }
                }
                Section {
                    Button { showMembership = true } label: { SheetRowLabel(title: "会员卡与账号", symbol: "person.crop.rectangle") }
                    if membership.account != nil {
                        Button { showAccountSecurity = true } label: { SheetRowLabel(title: "账号与安全", symbol: "lock.shield") }
                            .accessibilityIdentifier("account-security")
                    }
                } header: {
                    Text("俱乐部账号")
                } footer: {
                    Text(membership.account == nil ? "基础记录无需登录。领取身份卡时才需要账号。" : "已登录：\(membership.account?.email ?? "")")
                }
                Section {
                    NavigationLink { HealthConnectionView() } label: {
                        Label("健康数据与授权", systemImage: "heart.text.clipboard")
                    }.accessibilityIdentifier("health-settings")
                } header: {
                    Text("Apple 健康")
                } footer: {
                    Text("可选的只读连接。不上传健康样本，不替代手动记录。")
                }
                Section {
                    Toggle(isOn: Binding(get: { companion.isEnabled }, set: { companion.setEnabled($0) })) {
                        Label("共享当天打卡状态", systemImage: "applewatch")
                    }
                    .accessibilityIdentifier("companion-sharing-toggle")
                    if companion.isEnabled {
                        Text(companion.watchStatus).font(.subheadline).foregroundStyle(.secondary)
                        if let error = companion.errorMessage { Text(error).font(.subheadline).foregroundStyle(.red) }
                    }
                } header: {
                    Text("小组件与 Apple Watch")
                } footer: {
                    Text("仅共享训练、饮水、睡眠是否记录，以及训练场景。不共享具体数值、HealthKit 样本或会员信息。关闭后停止共享；离线手表会在下次连接时清除显示，小组件刷新由系统安排。")
                }
                Section(.Shared.settingsAppearance) {
                    Picker(selection: $appearance) {
                        Text(.Shared.appearanceSystem).tag("system"); Text(.Shared.appearanceLight).tag("light"); Text(.Shared.appearanceDark).tag("dark")
                    } label: {
                        Label(.Shared.settingsDisplayMode, systemImage: "circle.lefthalf.filled")
                    }
                }
                Section {
                    Button(.Shared.settingsExport, systemImage: "square.and.arrow.up") {
                        do { document = BojiExportDocument(data: try store.exportJSON()); exporting = true }
                        catch { exportError = error.localizedDescription }
                    }
                    Button(.Shared.settingsDelete, systemImage: "trash", role: .destructive) { confirmDelete = true }
                } header: {
                    Text(.Shared.settingsPrivacy)
                } footer: {
                    Text("训练和身体记录只保存在此设备，不会上传；账号和会员身份由俱乐部服务保存。卸载可能丢失本机记录。导出文件含身体数据，不含登录令牌和会员缓存，请妥善保管。")
                }
                Section {
                    LabeledContent("版本", value: appVersion)
                } header: {
                    Text(.Shared.settingsAbout)
                } footer: {
                    Text("薄肌俱乐部 · 开发预览版。支持免费会员身份，不提供医疗诊断、AI 识餐或付费服务。名称为开发暂用，未完成商标审查。")
                }
            }
            .pageBackground()
            .navigationTitle(.Shared.actionSettings).navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button("关闭", systemImage: "xmark", role: .close) { dismiss() } }
                }
                .sheet(isPresented: $showMembership) { MembershipCenterView() }
                .sheet(isPresented: $showAccountSecurity) { AccountSecurityView() }
                .confirmationDialog("删除全部本地数据？此操作无法撤销。", isPresented: $confirmDelete, titleVisibility: .visible) {
                    Button(.Shared.settingsDeleteConfirm, role: .destructive) { companion.disconnect(); health.disconnect(); membership.clearLocalSession(); store.resetAll(); dismiss() }
                    Button(.Shared.actionCancel, role: .cancel) {}
                } message: { Text("删除本机记录及会员缓存，并断开健康数据查询。不会注销账号、删除服务器会员身份或健康 App 中的数据。") }
                .fileExporter(isPresented: $exporting, document: document, contentType: .json, defaultFilename: "boji-records") { result in
                    if case .failure(let error) = result { exportError = error.localizedDescription }
                }
                .alert(.Shared.settingsExportFailed, isPresented: Binding(get: { exportError != nil }, set: { if !$0 { exportError = nil } })) {
                    Button(.Shared.actionOk) { exportError = nil }
                } message: { Text(exportError ?? "") }
        }
    }
}

/// A form row that opens a sheet. It reads like a navigation row: label-colored text and a trailing chevron.
/// Explicit label colors keep the button tint on the icon only.
private struct SheetRowLabel: View {
    let title: String
    let symbol: String
    var body: some View {
        HStack {
            Label { Text(title).foregroundStyle(Color(uiColor: .label)) } icon: { Image(systemName: symbol) }
            Spacer()
            Image(systemName: "chevron.forward").font(.footnote.weight(.semibold))
                .foregroundStyle(Color(uiColor: .tertiaryLabel))
                .accessibilityHidden(true)
        }
    }
}
