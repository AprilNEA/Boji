import SwiftUI
import UIKit

struct MembershipSharingView: View {
    @Environment(MembershipStore.self) private var membership
    @Environment(\.dismiss) private var dismiss
    let cardID: String
    @State private var options = MembershipShareOptions()
    @State private var image: UIImage?
    @State private var error: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    Text("把开始的这一天，留作纪念。")
                        .font(.title2.bold()).accessibilityAddTraits(.isHeader)
                    Surface {
                        VStack(alignment: .leading, spacing: 18) {
                            Picker("分享卡配色", selection: $options.appearance) {
                                ForEach(MembershipCardAppearance.allCases) { appearance in
                                    Text(appearance.title).tag(appearance)
                                }
                            }.pickerStyle(.menu)
                                .accessibilityIdentifier("membership-share-appearance")
                            Text("配色只改变分享图片，不改变会员身份或权益。")
                                .font(.footnote).foregroundStyle(.secondary)
                            Divider()
                            Toggle("在图片中显示完整卡号", isOn: $options.showsMemberNumber)
                                .accessibilityIdentifier("membership-share-number")
                            Text(options.showsMemberNumber
                                 ? "分享后，其他人可以看到你的昵称、完整卡号和入会日期。"
                                 : "默认隐藏卡号。图片仍包含昵称和入会日期。")
                                .font(.footnote).foregroundStyle(.secondary)
                        }
                    }
                    if let image {
                        Image(uiImage: image).resizable().scaledToFit()
                            .clipShape(.rect(cornerRadius: BojiTheme.cardRadius))
                            .shadow(color: .black.opacity(0.12), radius: 16, y: 6)
                            .frame(maxHeight: 360).frame(maxWidth: .infinity)
                            .accessibilityLabel("会员分享图片预览，\(options.showsMemberNumber ? "包含完整卡号" : "卡号已隐藏")")
                            .accessibilityIdentifier("membership-share-image")
                    } else if membership.isBusy {
                        ProgressView("正在核对会员状态…").frame(maxWidth: .infinity, minHeight: 120)
                    }
                    if let error { Text(error).font(.footnote).foregroundStyle(.red) }
                    Text("只有你在系统分享窗口确认后，图片才会发出。图片不是支付或核销凭证，也不证明当前会员状态。")
                        .font(.footnote).foregroundStyle(.secondary)
                }.padding(20).frame(maxWidth: 540).frame(maxWidth: .infinity)
            }
            .pageBackground().navigationTitle("分享预览").navigationBarTitleDisplayMode(.inline)
            .safeAreaBar(edge: .bottom) {
                if let image, let card = membership.card, card.id == cardID, card.isActive, !membership.isBusy {
                    ShareLink(item: Image(uiImage: image), preview: SharePreview("我的 Boji 会员纪念卡", image: Image(uiImage: image))) {
                        Label("分享图片", systemImage: "square.and.arrow.up").font(.headline).frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.glassProminent).controlSize(.extraLarge)
                    .tint(BojiTheme.accentFill)
                    .dynamicTypeSize(...DynamicTypeSize.accessibility2)
                    .accessibilityIdentifier("membership-share-export")
                    .padding(.horizontal, 20).padding(.bottom, 8).frame(maxWidth: 540)
                }
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("关闭", systemImage: "xmark", role: .close) { dismiss() } }
            }
            .onAppear { render() }
            .onChange(of: options) { _, _ in render() }
            .onChange(of: membership.card) { _, _ in render() }
            .onChange(of: membership.isOffline) { _, _ in render() }
            .onChange(of: membership.isBusy) { _, _ in render() }
            .onChange(of: membership.account?.id) { _, _ in dismiss() }
        }
    }

    @MainActor private func render() {
        image = nil
        error = nil
        guard let card = membership.card, card.id == cardID, card.isActive else {
            dismiss()
            return
        }
        guard !membership.isBusy else { return }
        let snapshot = MembershipShareSnapshot(card: card, options: options,
                                               isOffline: membership.isOffline,
                                               isTest: membership.isTestEnvironment)
        let renderer = ImageRenderer(content: MembershipSharePoster(snapshot: snapshot, appearance: options.appearance)
            .environment(\.locale, Locale(identifier: "zh_Hans_CN"))
            .environment(\.colorScheme, .light)
            .environment(\.dynamicTypeSize, .medium))
        renderer.scale = 3
        renderer.isOpaque = true
        image = renderer.uiImage
        if image == nil { error = "无法生成分享图片，请更换配色后重试。" }
    }
}

struct MembershipSharePoster: View {
    let snapshot: MembershipShareSnapshot
    let appearance: MembershipCardAppearance

    var body: some View {
        VStack(spacing: 22) {
            VStack(spacing: 5) {
                Text("我在薄肌俱乐部").font(.title2.bold())
                Text("不必完美，也能开始。").font(.subheadline)
            }.foregroundStyle(Color(red: 0.12, green: 0.22, blue: 0.18))
            MembershipCardSurface(name: snapshot.displayName, number: snapshot.memberNumber,
                                  joinedAt: snapshot.joinedAt,
                                  badge: snapshot.isTest ? "测试卡" : "会员纪念卡",
                                  annotation: snapshot.isTest ? (snapshot.isOffline ? "测试卡 · 离线副本 · 非真实会员" : "测试卡 · 非真实会员") : snapshot.isOffline ? "离线副本 · 状态待同步" : "免费俱乐部身份记录",
                                  appearance: appearance)
            VStack(spacing: 5) {
                Text("生成于 \(snapshot.generatedAt.formatted(.dateTime.year().month().day().locale(Locale(identifier: "zh_Hans_CN"))))")
                Text("会员状态以 App 同步结果为准\n非支付或核销凭证")
            }.font(.caption2).foregroundStyle(Color(red: 0.30, green: 0.34, blue: 0.31))
                .multilineTextAlignment(.center)
        }
        .padding(24).frame(width: 380)
        .background(Color(red: 0.97, green: 0.96, blue: 0.93))
    }
}
