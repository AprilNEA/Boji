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
    @Environment(\.dismiss) private var dismiss
    @AppStorage("appearance") private var appearance = "system"
    @State private var confirmDelete = false
    @State private var exporting = false
    @State private var document = BojiExportDocument(data: Data())
    @State private var exportError: String?
    @State private var showMembership = false
    var body: some View {
        @Bindable var store = store
        NavigationStack {
            Form {
                Section("我的信息") {
                    TextField("昵称", text: $store.displayName).submitLabel(.done)
                    Picker("训练场景", selection: $store.selectedPlan) { ForEach(PlanKind.allCases) { Text($0.title).tag($0) } }
                }
                Section("俱乐部账号") {
                    Button("会员卡与账号", systemImage: "person.crop.rectangle") { showMembership = true }
                    Text(membership.account == nil ? "基础记录无需登录。领取身份卡时才需要账号。" : "已登录：\(membership.account?.email ?? "")")
                        .font(.footnote).foregroundStyle(.secondary)
                }
                Section("Apple 健康") {
                    NavigationLink { HealthConnectionView() } label: {
                        Label("健康数据与授权", systemImage: "heart.text.clipboard")
                    }.accessibilityIdentifier("health-settings")
                    Text("可选的只读连接。不上传健康样本，不替代手动记录。")
                        .font(.footnote).foregroundStyle(.secondary)
                }
                Section("外观") {
                    Picker("显示模式", selection: $appearance) { Text("跟随系统").tag("system"); Text("浅色").tag("light"); Text("深色").tag("dark") }
                }
                Section {
                    Label("训练和身体记录只保存在此设备", systemImage: "lock.shield")
                    Text("账号和会员身份由俱乐部服务保存；训练和身体记录不会上传。卸载可能丢失本机记录。导出含身体数据，但不含登录令牌和会员缓存，请妥善保管。")
                        .font(.footnote).foregroundStyle(.secondary)
                    Button("导出我的数据", systemImage: "square.and.arrow.up") {
                        do { document = BojiExportDocument(data: try store.exportJSON()); exporting = true }
                        catch { exportError = error.localizedDescription }
                    }
                    Button("删除全部本地数据", systemImage: "trash", role: .destructive) { confirmDelete = true }
                } header: { Text("隐私与数据") }
                Section("关于") {
                    LabeledContent("Boji", value: "0.3.0 (3)")
                    Text("薄肌俱乐部 · 开发预览版\n支持免费会员身份，不提供医疗诊断、AI 识餐或付费服务。名称为开发暂用，未完成商标审查。")
                        .font(.footnote).foregroundStyle(.secondary)
                }
            }.navigationTitle("设置").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .confirmationAction) { Button("完成") { dismiss() } } }
                .sheet(isPresented: $showMembership) { MembershipCenterView() }
                .confirmationDialog("删除全部本地数据？此操作无法撤销。", isPresented: $confirmDelete, titleVisibility: .visible) {
                    Button("删除全部数据", role: .destructive) { health.disconnect(); membership.clearLocalSession(); store.resetAll(); dismiss() }
                    Button("取消", role: .cancel) {}
                } message: { Text("删除本机记录及会员缓存，并断开健康数据查询。不会注销账号、删除服务器会员身份或健康 App 中的数据。") }
                .fileExporter(isPresented: $exporting, document: document, contentType: .json, defaultFilename: "boji-records") { result in
                    if case .failure(let error) = result { exportError = error.localizedDescription }
                }
                .alert("导出失败", isPresented: Binding(get: { exportError != nil }, set: { if !$0 { exportError = nil } })) {
                    Button("好") { exportError = nil }
                } message: { Text(exportError ?? "") }
        }
    }
}
