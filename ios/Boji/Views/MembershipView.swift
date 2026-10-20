import SwiftUI
import UIKit

struct MembershipEntryView: View {
    @Environment(MembershipStore.self) private var membership
    @State private var showingCard = false

    var body: some View {
        Button { showingCard = true } label: {
            if let card = membership.card {
                MembershipCardFace(card: card, isTest: membership.isTestEnvironment)
            } else {
                VStack(alignment: .leading, spacing: 24) {
                    HStack {
                        Text("boji").font(.system(size: 40, weight: .heavy, design: .rounded))
                        Spacer()
                        Image(systemName: "person.crop.rectangle").font(.title)
                    }
                    Text("给自己，一个位置。").font(.title2.bold())
                    HStack {
                        Text("免费俱乐部身份卡").font(.subheadline)
                        Spacer()
                        Label("领取会员卡", systemImage: "arrow.up.right").font(.subheadline.bold())
                    }
                }
                .padding(26).foregroundStyle(.white)
                .background(Color(red: 0.17, green: 0.27, blue: 0.22), in: .rect(cornerRadius: 28))
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel(membership.card == nil ? "领取免费会员卡" : "查看我的会员卡")
        .accessibilityIdentifier("membership-entry")
        .sheet(isPresented: $showingCard) { MembershipCenterView() }
    }
}

struct MembershipCardFace: View {
    let card: ClubMember
    var isTest = false

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("boji").font(.system(size: 42, weight: .heavy, design: .rounded))
                    Text("A CLUB FOR EVERY BODY").font(.system(size: 9, weight: .semibold)).tracking(1.6)
                }
                Spacer(minLength: 12)
                Image(systemName: "figure.mind.and.body").font(.system(size: 42, weight: .ultraLight))
                    .accessibilityHidden(true)
            }
            VStack(alignment: .leading, spacing: 8) {
                Text(card.displayName).font(.title2.bold()).lineLimit(2)
                Text(card.memberNumber).font(.system(.subheadline, design: .monospaced)).textSelection(.enabled)
                    .accessibilityLabel("会员卡号，\(card.memberNumber)")
            }
            HStack(alignment: .bottom) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("加入于 \(card.joinedAt.formatted(.dateTime.year().month().day()))").font(.caption)
                    Text("MY BODY. MY PACE.").font(.system(size: 9, weight: .medium)).tracking(1.5)
                }
                Spacer(minLength: 6)
                VStack(alignment: .trailing, spacing: 4) {
                    Text(card.tier == "community" ? "社区会员" : "会员身份").font(.caption.bold())
                    Text(isTest ? "测试卡 · 非真实会员" : card.isActive ? "免费身份卡" : "当前不可用")
                        .font(.caption2)
                }
            }
        }
        .padding(26).foregroundStyle(Color(red: 0.98, green: 0.96, blue: 0.87))
        .background {
            LinearGradient(colors: [Color(red: 0.19, green: 0.30, blue: 0.24), Color(red: 0.10, green: 0.18, blue: 0.15)], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
        .clipShape(.rect(cornerRadius: 28))
        .overlay(RoundedRectangle(cornerRadius: 28).strokeBorder(.white.opacity(0.15), lineWidth: 1))
    }
}

struct MembershipCenterView: View {
    @Environment(MembershipStore.self) private var membership
    @Environment(\.dismiss) private var dismiss
    @State private var showAuthentication = false
    @State private var showEnrollment = false
    @State private var showRules = false
    @State private var confirmSignOut = false
    @State private var shareImage: UIImage?
    @State private var showShare = false
    @State private var shareError: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    if membership.isTestEnvironment {
                        Label("界面测试环境 · 不连接真实账号", systemImage: "testtube.2")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    if let card = membership.card {
                        cardContent(card)
                    } else {
                        unissuedContent
                    }
                    MembershipMessages()
                    if membership.isBusy { ProgressView("正在连接俱乐部…").frame(maxWidth: .infinity) }
                    if let account = membership.account {
                        Surface {
                            VStack(alignment: .leading, spacing: 10) {
                                Label("当前账号", systemImage: "person.crop.circle").font(.headline)
                                Text(account.email).font(.subheadline).textSelection(.enabled)
                                Text("会员卡绑定此账号。退出不会删除本机训练记录，也不会注销账号。")
                                    .font(.footnote).foregroundStyle(.secondary)
                                Button("退出账号", role: .destructive) { confirmSignOut = true }
                                    .frame(minHeight: 44).disabled(membership.isBusy)
                            }
                        }
                    }
                    Button("俱乐部守则与数据说明", systemImage: "text.book.closed") { showRules = true }
                        .font(.subheadline).frame(minHeight: 44)
                    Text("这是免费身份卡，不是付费订阅、支付卡或场馆核销凭证。不自动续费。")
                        .font(.footnote).foregroundStyle(.secondary)
                }.padding(20).frame(maxWidth: 600).frame(maxWidth: .infinity)
            }
            .pageBackground().navigationTitle("我的会员卡").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("完成") { dismiss() } } }
            .task {
                if membership.account != nil { await membership.refresh() }
                else { await membership.restore() }
                await membership.loadCapabilities()
            }
            .refreshable { await membership.refresh() }
            .sheet(isPresented: $showAuthentication) { MembershipAuthenticationView() }
            .sheet(isPresented: $showEnrollment) { MembershipEnrollmentView() }
            .sheet(isPresented: $showRules) { ClubRulesView() }
            .sheet(isPresented: $showShare) {
                if let shareImage { MembershipShareSheet(image: shareImage) }
            }
            .confirmationDialog("退出此账号？", isPresented: $confirmSignOut, titleVisibility: .visible) {
                Button("退出账号", role: .destructive) { Task { await membership.signOut() } }
                Button("取消", role: .cancel) {}
            } message: { Text("本机会员卡缓存会清除。重新登录可恢复服务器上的会员卡，本机训练记录不受影响。") }
            .alert("分享卡生成失败", isPresented: Binding(get: { shareError != nil }, set: { if !$0 { shareError = nil } })) {
                Button("好") { shareError = nil }
            } message: { Text(shareError ?? "") }
        }
    }

    private var unissuedContent: some View {
        VStack(alignment: .leading, spacing: 22) {
            PageHeading(eyebrow: "YOUR PLACE IN THE CLUB", title: "不必达标，\n也能加入。", subtitle: "一张属于你的身份卡，记录一起开始的这一天。")
            Surface {
                VStack(alignment: .leading, spacing: 16) {
                    Label("免费社区会员", systemImage: "person.crop.rectangle.badge.plus").font(.title3.bold())
                    Text("固定卡号 · 入会日期 · 专属分享卡").font(.subheadline).foregroundStyle(.secondary)
                    Text("基础记录和训练始终可以免登录使用。领卡仅需已验证的邮箱账号。")
                        .font(.footnote).foregroundStyle(.secondary)
                    if !membership.isConfigured {
                        Label("会员服务尚未配置", systemImage: "network.slash").foregroundStyle(.secondary)
                    } else if let account = membership.account {
                        if account.emailVerified {
                            PrimaryButton(title: "领取免费身份卡", symbol: "person.crop.rectangle.badge.plus") { showEnrollment = true }
                                .accessibilityIdentifier("membership-enroll-start").disabled(membership.isBusy || membership.isOffline)
                        } else {
                            Text("先验证邮箱，再领取会员卡。").font(.subheadline)
                            Button("重发验证邮件") { Task { await membership.sendVerification(email: account.email) } }
                                .disabled(membership.isBusy)
                        }
                        Button("刷新账号与会员卡", systemImage: "arrow.clockwise") { Task { await membership.refresh() } }
                            .frame(minHeight: 44).disabled(membership.isBusy)
                    } else {
                        PrimaryButton(title: "登录或注册领取", symbol: "person.crop.circle") { showAuthentication = true }
                            .accessibilityIdentifier("membership-auth-start").disabled(membership.isBusy)
                    }
                }
            }
        }
    }

    @ViewBuilder private func cardContent(_ card: ClubMember) -> some View {
        MembershipCardFace(card: card, isTest: membership.isTestEnvironment)
            .accessibilityIdentifier("issued-membership-card")
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: membership.isOffline ? "wifi.slash" : card.isActive ? "checkmark.seal.fill" : "pause.circle")
                .foregroundStyle(card.isActive ? BojiTheme.green : .secondary)
            VStack(alignment: .leading, spacing: 5) {
                Text(membership.isOffline ? "离线副本 · 状态待同步" : card.isActive ? "已加入俱乐部" : "会员卡当前不可用").font(.headline)
                if let date = membership.lastSyncedAt {
                    Text("上次同步 \(date.formatted(date: .abbreviated, time: .shortened))").font(.caption).foregroundStyle(.secondary)
                }
                if !card.isActive { Text("已保留你的卡号。本地记录与基础训练仍可使用。").font(.footnote).foregroundStyle(.secondary) }
            }
            Spacer(minLength: 0)
            Button("刷新", systemImage: "arrow.clockwise") { Task { await membership.refresh() } }
                .labelStyle(.iconOnly).frame(minWidth: 44, minHeight: 44).disabled(membership.isBusy)
        }
        if card.isActive {
            Button { renderShare(card) } label: { Label("制作会员分享卡", systemImage: "square.and.arrow.up").frame(maxWidth: .infinity, minHeight: 44) }
                .buttonStyle(.glass).accessibilityIdentifier("membership-share")
            MembershipWalletView()
        }
        SectionHeading(title: "你的社区权益", detail: "没有订阅费用")
        Surface {
            VStack(alignment: .leading, spacing: 18) {
                entitlement("local_tracking", title: "日常记录", detail: "训练、饮水与睡眠，按自己的节奏。", symbol: "checkmark.circle", card: card)
                Divider()
                entitlement("training_library", title: "基础训练库", detail: "居家与健身房课程，逐组完成。", symbol: "figure.strengthtraining.traditional", card: card)
                Divider()
                entitlement("progress_history", title: "成长足迹", detail: "查看训练历史与身体数据趋势。", symbol: "chart.xyaxis.line", card: card)
            }
        }
        Text("以上基础功能也可免登录使用。付费会员尚未开放，本版不会收取费用。")
            .font(.footnote).foregroundStyle(.secondary)
    }

    private func entitlement(_ code: String, title: String, detail: String, symbol: String, card: ClubMember) -> some View {
        HStack(alignment: .top, spacing: 12) {
            SymbolTile(symbol: symbol, color: BojiTheme.green)
            VStack(alignment: .leading, spacing: 4) {
                Text(title).font(.headline)
                Text(detail).font(.caption).foregroundStyle(.secondary)
                Text(card.isActive && card.entitlements.contains(code) ? "已包含" : "会员权益未授予 · 本地功能不受影响")
                    .font(.caption2).foregroundStyle(.secondary)
            }
        }
    }

    @MainActor private func renderShare(_ card: ClubMember) {
        let content = VStack(spacing: 22) {
            MembershipCardFace(card: card, isTest: membership.isTestEnvironment)
            Text("不必完美，也能入会。").font(.title3.bold()).foregroundStyle(Color.black)
            Text("\(membership.isOffline ? "离线副本" : "会员纪念卡") · \(Date().formatted(.dateTime.year().month().day()))\n会员状态以俱乐部服务为准 · 非支付或核销凭证")
                .font(.caption2).multilineTextAlignment(.center).foregroundStyle(Color.gray)
        }
        .padding(24).frame(width: 380).background(Color(red: 0.97, green: 0.96, blue: 0.94))
        .environment(\.locale, Locale(identifier: "zh_Hans_CN"))
        .environment(\.colorScheme, .light).environment(\.dynamicTypeSize, .medium)
        let renderer = ImageRenderer(content: content)
        renderer.scale = 3
        guard let image = renderer.uiImage else { shareError = "无法生成图片，请稍后重试。"; return }
        shareImage = image
        showShare = true
    }
}

struct MembershipMessages: View {
    @Environment(MembershipStore.self) private var membership
    var body: some View {
        if let message = membership.errorMessage {
            Label(message, systemImage: "exclamationmark.circle").font(.footnote).foregroundStyle(.red)
                .accessibilityIdentifier("membership-error")
        }
        if let message = membership.notice {
            Label(message, systemImage: "info.circle").font(.footnote).foregroundStyle(.secondary)
                .accessibilityIdentifier("membership-notice")
        }
    }
}

private struct MembershipShareSheet: View {
    let image: UIImage
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 22) {
                    Image(uiImage: image).resizable().scaledToFit().clipShape(.rect(cornerRadius: 20))
                    Text("分享内容包含昵称、卡号和入会日期。不会包含邮箱、登录信息或身体记录。")
                        .font(.footnote).foregroundStyle(.secondary)
                    ShareLink(item: Image(uiImage: image), preview: SharePreview("我的 Boji 会员卡", image: Image(uiImage: image))) {
                        Label("分享图片", systemImage: "square.and.arrow.up").frame(maxWidth: .infinity, minHeight: 44)
                    }.buttonStyle(.glassProminent)
                }.padding(24).frame(maxWidth: 520).frame(maxWidth: .infinity)
            }.pageBackground().navigationTitle("分享预览").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .confirmationAction) { Button("完成") { dismiss() } } }
        }
    }
}

struct MembershipEnrollmentView: View {
    @Environment(MembershipStore.self) private var membership
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var accepted = false
    @State private var showRules = false
    private var cleanName: String { name.trimmingCharacters(in: .whitespacesAndNewlines) }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text("免费加入，按自己的节奏来。").font(.headline)
                    Text("服务器会为你生成固定卡号和入会日期。同一个账号重复领取，不会创建新卡。")
                        .font(.subheadline).foregroundStyle(.secondary)
                }
                Section("卡面昵称") {
                    TextField("1 至 24 个字符", text: $name).textContentType(.nickname).submitLabel(.done)
                        .accessibilityIdentifier("membership-card-name")
                    Text("昵称会出现在分享卡上。领卡后本版暂不支持改名。")
                        .font(.caption).foregroundStyle(.secondary)
                }
                Section {
                    Toggle("我已阅读并同意俱乐部守则与数据说明", isOn: $accepted)
                        .accessibilityIdentifier("membership-terms")
                    Button("阅读守则与数据说明") { showRules = true }
                }
                Section {
                    MembershipMessages()
                    Button {
                        Task {
                            await membership.enroll(displayName: cleanName, acceptedTerms: accepted)
                            if membership.card != nil { dismiss() }
                        }
                    } label: {
                        HStack { Text(membership.isBusy ? "正在领取…" : "确认免费领卡"); Spacer(); Image(systemName: "person.crop.rectangle.badge.plus") }
                    }.disabled(!accepted || cleanName.isEmpty || cleanName.count > 24 || membership.isBusy || membership.isOffline)
                        .accessibilityIdentifier("membership-enroll-confirm")
                } footer: { Text("免费身份卡，无支付步骤，不会自动续费。") }
            }.navigationTitle("领取身份卡").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("取消") { dismiss() } } }
                .onAppear { name = membership.account?.name ?? ""; membership.errorMessage = nil; membership.notice = nil }
                .sheet(isPresented: $showRules) { ClubRulesView() }
                .interactiveDismissDisabled(membership.isBusy)
        }
    }
}

struct ClubRulesView: View {
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            List {
                Section("俱乐部守则") {
                    rule("人人都有位置", "不以身材、体重或体脂决定是否可以加入。")
                    rule("尊重自己的节奏", "不排名，不鼓励极端减脂；不舒服时停止训练。")
                    rule("尊重他人与隐私", "不冒用他人身份，不在昵称中包含他人隐私。")
                }
                Section("账号与会员数据") {
                    Text("登录会将邮箱和认证信息发送到俱乐部服务。领卡会提交昵称和守则版本，由服务器保存卡号、入会日期和会员状态。")
                    Text("训练、饮水、睡眠和身体记录仍只保存在此设备，不随领卡上传。")
                    Text("登录令牌存入本机 Keychain。退出会清除本机登录信息和会员缓存，但不注销账号或删除服务器会员。")
                    Text("制作分享卡会包含昵称、卡号和入会日期。确认分享前，你可以查看图片。")
                }
                Section("卡片的边界") {
                    Text("免费会员卡是俱乐部身份记录，不代表付费权益，也不能用于支付或场馆核销。图片只是纪念副本，会员状态以服务器为准。")
                    Text("当前尚无 App 内账号注销入口。公开发布前需补齐账号删除与正式隐私政策。")
                }
                Section { Text("守则版本：community-v1").font(.caption).foregroundStyle(.secondary) }
            }.navigationTitle("守则与数据说明").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .confirmationAction) { Button("完成") { dismiss() } } }
        }
    }
    private func rule(_ title: String, _ text: String) -> some View {
        VStack(alignment: .leading, spacing: 6) { Text(title).font(.headline); Text(text).font(.subheadline).foregroundStyle(.secondary) }.padding(.vertical, 5)
    }
}
