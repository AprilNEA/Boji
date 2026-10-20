import SwiftUI
import UIKit

struct MembershipEntryView: View {
    @Environment(MembershipStore.self) private var membership
    @State private var showingCard = false
    @Namespace private var transition

    var body: some View {
        Button { showingCard = true } label: {
            if let card = membership.card {
                MembershipCardFace(card: card, isTest: membership.isTestEnvironment, isOffline: membership.isOffline)
            } else {
                MembershipCardSurface(name: "给自己，一个位置。", number: nil, joinedAt: nil, badge: "免费领取",
                                      annotation: "没有身材门槛，按自己的节奏来。",
                                      numberPlaceholder: "领取后显示会员卡号")
            }
        }
        .buttonStyle(PressableCardStyle())
        .matchedTransitionSource(id: "membership", in: transition)
        .accessibilityLabel(membership.card == nil ? "领取免费会员卡" : "查看我的会员卡")
        .accessibilityIdentifier("membership-entry")
        .sheet(isPresented: $showingCard) {
            MembershipCenterView().navigationTransition(.zoom(sourceID: "membership", in: transition))
        }
    }
}

struct MembershipCenterView: View {
    @Environment(MembershipStore.self) private var membership
    @Environment(\.dismiss) private var dismiss
    @State private var showAuthentication = false
    @State private var showEnrollment = false
    @State private var showRules = false
    @State private var showSecurity = false
    @State private var confirmSignOut = false
    @State private var showShare = false
    @State private var copiedNumber = false

    var body: some View {
        NavigationStack {
            PageScroll {
                if membership.isTestEnvironment {
                    Label("界面测试环境 · 不连接真实账号", systemImage: "testtube.2")
                        .font(.footnote).foregroundStyle(.secondary)
                }
                if let card = membership.card {
                    TimelineView(.periodic(from: .now, by: 30)) { context in
                        cardContent(card, at: context.date)
                    }
                } else {
                    unissuedContent
                }
                MembershipMessages()
                if membership.isBusy { ProgressView("正在连接俱乐部…").frame(maxWidth: .infinity) }
                if let account = membership.account { accountSection(account) }
                VStack(alignment: .leading, spacing: 8) {
                    Button("俱乐部守则与数据说明", systemImage: "text.book.closed") { showRules = true }
                        .font(.subheadline).buttonStyle(.borderless).frame(minHeight: 44)
                    Text("这是免费身份卡，不是付费订阅、支付卡或场馆核销凭证。不自动续费。")
                        .font(.footnote).foregroundStyle(.secondary)
                }
            }
            .navigationTitle("我的会员卡").navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("关闭", systemImage: "xmark", role: .close) { dismiss() } }
            }
            .task {
                if membership.account != nil { await membership.refresh() }
                else { await membership.restore() }
                await membership.loadCapabilities()
            }
            .refreshable {
                if membership.account != nil { await membership.refresh() }
                else { await membership.restore() }
                await membership.loadCapabilities()
            }
            .sheet(isPresented: $showAuthentication) { MembershipAuthenticationView() }
            .sheet(isPresented: $showEnrollment) { MembershipEnrollmentView() }
            .sheet(isPresented: $showRules) { ClubRulesView() }
            .sheet(isPresented: $showSecurity) { AccountSecurityView() }
            .sheet(isPresented: $showShare) {
                if let card = membership.card { MembershipSharingView(cardID: card.id) }
            }
            .onChange(of: membership.account?.id) { _, _ in copiedNumber = false; showShare = false }
            .onChange(of: membership.card?.memberNumber) { _, _ in copiedNumber = false }
            .confirmationDialog("退出此账号？", isPresented: $confirmSignOut, titleVisibility: .visible) {
                Button("退出账号", role: .destructive) { Task { await membership.signOut() } }
                Button(.Shared.actionCancel, role: .cancel) {}
            } message: { Text("本机登录信息和会员卡缓存会清除。本机训练记录不受影响，此操作不会注销账号。") }
        }
    }

    private var unissuedContent: some View {
        VStack(alignment: .leading, spacing: 24) {
            PageHeading(eyebrow: "YOUR PLACE IN THE CLUB", title: "不必达标，\n也能加入。", subtitle: "一张属于你的身份卡，记录一起开始的这一天。")
            Surface {
                VStack(alignment: .leading, spacing: 16) {
                    HStack(spacing: 12) {
                        SymbolTile(symbol: "person.crop.rectangle.badge.plus", color: BojiTheme.green)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("免费社区会员").font(.headline)
                            Text("写下昵称 · 确认共识 · 领取身份卡").font(.subheadline).foregroundStyle(.secondary)
                        }
                    }
                    Text("基础记录和训练始终可以免登录使用。领卡需要已验证的邮箱账号。")
                        .font(.footnote).foregroundStyle(.secondary)
                    if !membership.isConfigured {
                        Label("暂时无法在线领卡", systemImage: "network.slash").font(.headline)
                        Text("当前版本尚未连接会员服务。基础训练和记录仍可使用。")
                            .font(.footnote).foregroundStyle(.secondary)
                    } else if let account = membership.account {
                        if account.emailVerified {
                            Label("邮箱已验证，可以领取", systemImage: "checkmark.circle.fill")
                                .font(.subheadline).foregroundStyle(BojiTheme.green)
                            CardButton(title: "领取免费身份卡", symbol: "person.crop.rectangle.badge.plus") { showEnrollment = true }
                                .accessibilityIdentifier("membership-enroll-start")
                                .disabled(membership.isBusy || membership.isOffline)
                        } else {
                            Text("先验证邮箱，再领取会员卡。").font(.headline)
                            Button("重发验证邮件") { Task { await membership.sendVerification(email: account.email) } }
                                .buttonStyle(.bordered).disabled(membership.isBusy)
                        }
                        Button(membership.isOffline ? "重新连接并确认会员信息" : "刷新账号与会员卡", systemImage: "arrow.clockwise") {
                            Task { await membership.refresh() }
                        }
                        .font(.subheadline).buttonStyle(.borderless).frame(minHeight: 44).disabled(membership.isBusy)
                    } else {
                        CardButton(title: "登录或注册领取", symbol: "person.crop.circle") { showAuthentication = true }
                            .accessibilityIdentifier("membership-auth-start").disabled(membership.isBusy)
                    }
                }
            }
            GroupedRows {
                InfoRow(text: "不需要提供身体照片或体脂数据", symbol: "hand.raised")
                InfoRow(text: "分享前可以隐藏会员卡号", symbol: "eye.slash")
                InfoRow(text: "训练和身体记录不会随领卡上传", symbol: "iphone")
            }
        }
    }

    @ViewBuilder private func cardContent(_ card: ClubMember, at date: Date) -> some View {
        let condition = MembershipCardCondition.resolve(card: card, isOffline: membership.isOffline, at: date)
        VStack(alignment: .leading, spacing: 24) {
            MembershipCardFace(card: card, isTest: membership.isTestEnvironment, isOffline: membership.isOffline)
                .accessibilityIdentifier("issued-membership-card")
            Surface(padding: 16) {
                AdaptiveStack {
                    Image(systemName: membership.isBusy ? "arrow.triangle.2.circlepath" : condition.symbol)
                        .font(.title2).foregroundStyle(condition == .active ? BojiTheme.green : .secondary)
                        .symbolEffect(.rotate, isActive: membership.isBusy)
                        .accessibilityHidden(true)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(membership.isBusy ? "正在核对会员状态" : condition.title).font(.headline)
                            .accessibilityIdentifier("membership-status")
                        Text(condition.detail).font(.footnote).foregroundStyle(.secondary)
                        if let date = membership.lastSyncedAt {
                            Text("上次同步 \(date.formatted(date: .abbreviated, time: .shortened))")
                                .font(.footnote).foregroundStyle(.secondary)
                        }
                    }
                    Spacer(minLength: 0)
                    Button("刷新", systemImage: "arrow.clockwise") { Task { await membership.refresh() } }
                        .labelStyle(.iconOnly).buttonStyle(.bordered).buttonBorderShape(.circle)
                        .disabled(membership.isBusy)
                        .accessibilityIdentifier("membership-refresh")
                }
            }
            if condition == .active || condition == .offline {
                VStack(alignment: .leading, spacing: 12) {
                    CardButton(title: "制作会员分享卡", symbol: "square.and.arrow.up") { showShare = true }
                        .accessibilityIdentifier("membership-share").disabled(membership.isBusy)
                    MembershipWalletView()
                }
            }
            Surface(padding: 16) {
                DisclosureGroup("身份详情") {
                    VStack(alignment: .leading, spacing: 14) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("完整会员卡号").font(.footnote).foregroundStyle(.secondary)
                            Text(verbatim: card.memberNumber).font(.system(.body, design: .monospaced))
                                .textSelection(.enabled).fixedSize(horizontal: false, vertical: true)
                        }
                        Button(copiedNumber ? "卡号已复制" : "复制完整卡号", systemImage: copiedNumber ? "checkmark" : "doc.on.doc") {
                            UIPasteboard.general.string = card.memberNumber
                            copiedNumber = true
                        }
                        .buttonStyle(.bordered).contentTransition(.symbolEffect(.replace))
                        .accessibilityIdentifier("membership-copy-number")
                        LabeledContent("加入于", value: card.joinedAt.formatted(date: .abbreviated, time: .omitted))
                        if let expiresAt = card.expiresAt {
                            LabeledContent("有效至", value: expiresAt.formatted(date: .abbreviated, time: .shortened))
                        }
                        Text("卡片信息由会员服务确认，分享图片仅作纪念。")
                            .font(.footnote).foregroundStyle(.secondary)
                    }
                    .font(.body)
                    .frame(maxWidth: .infinity, alignment: .leading).padding(.top, 12)
                }
                .font(.headline).tint(.primary).accessibilityIdentifier("membership-details")
            }
            VStack(alignment: .leading, spacing: 12) {
                SectionHeading(title: "你的社区权益", detail: "没有订阅费用")
                GroupedRows {
                    entitlement("local_tracking", title: "日常记录", detail: "训练、饮水与睡眠，按自己的节奏。", symbol: "checkmark.circle", card: card, date: date)
                    entitlement("training_library", title: "基础训练库", detail: "居家与健身房课程，逐组完成。", symbol: "figure.strengthtraining.traditional", card: card, date: date)
                    entitlement("progress_history", title: "成长足迹", detail: "查看训练历史与身体数据趋势。", symbol: "chart.xyaxis.line", card: card, date: date)
                }
                Text("以上基础功能也可免登录使用。付费会员尚未开放，本版不会收取费用。")
                    .font(.footnote).foregroundStyle(.secondary)
            }
        }
    }

    private func accountSection(_ account: MembershipAccount) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeading(title: "当前账号")
            GroupedRows {
                Label { Text(verbatim: account.email).textSelection(.enabled) } icon: {
                    Image(systemName: "person.crop.circle").foregroundStyle(BojiTheme.accent)
                }
                .padding(.horizontal, 16).padding(.vertical, 14)
                .frame(maxWidth: .infinity, alignment: .leading)
                Button { showSecurity = true } label: {
                    NavigationRowLabel(title: "账号安全", symbol: "lock.shield")
                }
                .buttonStyle(RowButtonStyle())
                Button("退出账号", role: .destructive) { confirmSignOut = true }
                    .buttonStyle(RowButtonStyle()).foregroundStyle(.red)
                    .disabled(membership.isBusy)
            }
            Text("会员卡绑定此账号。退出不会删除本机训练记录，也不会注销账号。")
                .font(.footnote).foregroundStyle(.secondary)
        }
    }

    private func entitlement(_ code: String, title: String, detail: String, symbol: String, card: ClubMember, date: Date) -> some View {
        let grant = card.activeEntitlement(for: code, at: date)
        return HStack(alignment: .top, spacing: 12) {
            SymbolTile(symbol: symbol, color: BojiTheme.green)
            VStack(alignment: .leading, spacing: 3) {
                Text(grant?.name.isEmpty == false ? grant!.name : title).font(.body.weight(.medium))
                Text(grant?.description.isEmpty == false ? grant!.description : detail).font(.subheadline).foregroundStyle(.secondary)
                Text(membership.isOffline || membership.isBusy ? "权益状态待同步 · 本地功能不受影响" : grant != nil ? "已包含" : card.hasLegacyEntitlements ? "权益信息待刷新 · 本地功能不受影响" : "会员权益未授予 · 本地功能不受影响")
                    .font(.footnote).foregroundStyle(grant != nil && !membership.isOffline && !membership.isBusy ? BojiTheme.green : .secondary)
                if let date = grant?.grantedAt {
                    Text("授权于 \(date.formatted(.dateTime.year().month().day()))").font(.footnote).foregroundStyle(.secondary)
                }
                if let date = grant?.expiresAt {
                    Text("有效至 \(date.formatted(date: .abbreviated, time: .shortened))").font(.footnote).foregroundStyle(.secondary)
                }
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }
}

struct MembershipMessages: View {
    @Environment(MembershipStore.self) private var membership
    var body: some View {
        if let message = membership.errorMessage {
            Label(message, systemImage: "exclamationmark.circle.fill").font(.footnote).foregroundStyle(.red)
                .accessibilityIdentifier("membership-error")
        }
        if let message = membership.notice {
            Label(message, systemImage: "info.circle").font(.footnote).foregroundStyle(.secondary)
                .accessibilityIdentifier("membership-notice")
        }
    }
}

struct ClubRulesView: View {
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            List {
                Section("俱乐部守则") {
                    ForEach(MembershipPledge.all) { pledge in
                        Label {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(pledge.title).font(.headline)
                                Text(pledge.detail).font(.subheadline).foregroundStyle(.secondary)
                            }
                        } icon: { Image(systemName: pledge.symbol).foregroundStyle(BojiTheme.accent) }
                        .padding(.vertical, 4)
                    }
                }
                Section("账号与会员数据") {
                    Text("登录会将邮箱和认证信息发送到俱乐部服务。领卡会提交昵称和守则版本，由服务器保存卡号、入会日期和会员状态。")
                    Text("训练、饮水、睡眠和身体记录仍只保存在此设备，不随领卡上传。")
                    Text("登录令牌存入本机 Keychain。退出会清除本机登录信息和会员缓存，但不注销账号或删除服务器会员。")
                    Text("分享图片包含昵称和入会日期。卡号默认隐藏，可以在预览中主动开启。确认前，图片不会自动上传或分享。")
                }
                Section {
                    Text("免费会员卡是俱乐部身份记录，不代表付费权益，也不能用于支付或场馆核销。图片只是纪念副本，会员状态以服务器为准。")
                    Text("当前尚无 App 内账号注销入口。公开发布前需补齐账号删除与正式隐私政策。")
                } header: {
                    Text("卡片的边界")
                } footer: {
                    Text("守则版本：community-v1")
                }
            }
            .pageBackground()
            .navigationTitle("守则与数据说明").navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("关闭", systemImage: "xmark", role: .close) { dismiss() } }
            }
        }
    }
}
