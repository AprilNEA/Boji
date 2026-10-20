import SwiftUI

struct MembershipEnrollmentView: View {
    @Environment(MembershipStore.self) private var membership
    @Environment(\.dismiss) private var dismiss
    @State private var draft = MembershipEnrollmentDraft()
    @State private var step = 0
    @State private var prepared = false
    @State private var showRules = false
    @FocusState private var nameFocused: Bool

    private let titles = ["写下昵称", "确认守则", "核对并领取"]

    var body: some View {
        NavigationStack {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        Color.clear.frame(height: 1).id("top")
                        if step == 3, let card = membership.card {
                            receipt(card)
                        } else {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("\(step + 1) / 3 · \(titles[min(step, 2)])")
                                    .font(.subheadline.bold()).foregroundStyle(BojiTheme.green)
                                ProgressView(value: Double(step + 1), total: 3).tint(BojiTheme.green)
                                    .accessibilityLabel("领取进度，第 \(step + 1) 步，共 3 步")
                            }
                            if step == 0 { nameStep }
                            else if step == 1 { pledgeStep }
                            else { reviewStep }
                        }
                    }.padding(.horizontal, 20).padding(.bottom, 24)
                        .frame(maxWidth: 560).frame(maxWidth: .infinity)
                        .animation(.snappy, value: step)
                }
                .scrollDismissesKeyboard(.interactively)
                .onChange(of: step) { _, _ in proxy.scrollTo("top", anchor: .top) }
                .safeAreaBar(edge: .bottom) { footer }
            }
            .pageBackground().navigationTitle(step == 3 ? "你的会员卡" : "领取免费身份卡")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    if step == 3 {
                        Button(.Shared.actionDone, systemImage: "checkmark", role: .close) { dismiss() }
                    } else {
                        Button(.Shared.actionCancel, systemImage: "xmark", role: .cancel) { dismiss() }.disabled(membership.isBusy)
                    }
                }
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("收起键盘") { nameFocused = false }
                }
            }
            .onAppear {
                guard !prepared else { return }
                prepared = true
                draft.name = membership.account?.name ?? ""
                membership.errorMessage = nil
                membership.notice = nil
            }
            .onChange(of: membership.card) { _, card in
                if card != nil { nameFocused = false; step = 3 }
            }
            .onChange(of: membership.account?.id) { _, _ in dismiss() }
            .sheet(isPresented: $showRules) { ClubRulesView() }
            .interactiveDismissDisabled(membership.isBusy)
            .sensoryFeedback(.success, trigger: step == 3)
        }
    }

    private var nameStep: some View {
        VStack(alignment: .leading, spacing: 20) {
            PageHeading(eyebrow: "MAKE IT YOURS", title: "给自己，\n一个位置。", subtitle: "不必达到某种身材，今天就可以开始。")
            Surface {
                VStack(alignment: .leading, spacing: 10) {
                    Text("卡面昵称").font(.headline)
                    TextField("1～24 个字符", text: $draft.name)
                        .textContentType(.nickname).submitLabel(.done).focused($nameFocused)
                        .padding(.horizontal, 14).frame(minHeight: 48)
                        .background(Color(uiColor: .tertiarySystemFill), in: ConcentricRectangle())
                        .accessibilityIdentifier("membership-card-name")
                        .onSubmit { nameFocused = false }
                    HStack(alignment: .top) {
                        Text("昵称会出现在卡片上，领卡后本版暂不支持修改。")
                        Spacer(minLength: 8)
                        Text("\(draft.normalizedName.count)/24").monospacedDigit()
                    }.font(.footnote).foregroundStyle(.secondary)
                    if let error = draft.nameError, !draft.name.isEmpty {
                        Text(error).font(.footnote).foregroundStyle(.red)
                    }
                }
            }
            MembershipCardSurface(name: draft.nameError == nil ? draft.normalizedName : "你的昵称",
                                  number: nil, joinedAt: nil, badge: "卡面预览",
                                  annotation: "尚未领取 · 预览不代表已加入",
                                  numberPlaceholder: "领取后显示会员卡号")
                .accessibilityIdentifier("membership-card-preview")
        }
    }

    private var pledgeStep: some View {
        VStack(alignment: .leading, spacing: 20) {
            PageHeading(eyebrow: "OUR COMMON GROUND", title: "三条共识，\n一起开始。", subtitle: "没有身材门槛，也不需要跟别人比较。")
            ForEach(MembershipPledge.all) { pledge in
                Surface {
                    Toggle(isOn: Binding(
                        get: { draft.confirmedPledges.contains(pledge.id) },
                        set: { if $0 { draft.confirmedPledges.insert(pledge.id) } else { draft.confirmedPledges.remove(pledge.id) } }
                    )) {
                        VStack(alignment: .leading, spacing: 8) {
                            Label(pledge.title, systemImage: pledge.symbol).font(.headline)
                            Text(pledge.detail).font(.subheadline).foregroundStyle(.secondary)
                        }.padding(.vertical, 4)
                    }.tint(BojiTheme.green).accessibilityIdentifier("membership-pledge-\(pledge.id)")
                }
            }
            Text("\(draft.confirmedCount) / \(MembershipPledge.all.count) 已确认")
                .font(.subheadline).foregroundStyle(.secondary)
                .accessibilityIdentifier("membership-pledge-progress")
            Button("阅读完整守则与数据说明", systemImage: "text.book.closed") { showRules = true }
                .font(.subheadline).buttonStyle(.borderless).frame(minHeight: 44)
        }
    }

    private var reviewStep: some View {
        VStack(alignment: .leading, spacing: 20) {
            PageHeading(eyebrow: "READY WHEN YOU ARE", title: "以这个名字，\n加入俱乐部。")
            Surface {
                VStack(alignment: .leading, spacing: 14) {
                    Text(verbatim: draft.normalizedName).font(.title2.bold())
                    if let email = membership.account?.email {
                        Label(email, systemImage: "person.crop.circle").font(.subheadline)
                            .foregroundStyle(.secondary).textSelection(.enabled)
                    }
                    Divider()
                    Label("免费社区会员", systemImage: "checkmark.seal").font(.headline)
                    Text("无支付步骤，不会自动续费。卡号与入会日期将在服务确认后显示。")
                        .font(.subheadline).foregroundStyle(.secondary)
                }
            }
            Surface {
                VStack(alignment: .leading, spacing: 16) {
                    Text("本次会提交昵称和守则版本。训练、饮水、睡眠及身体记录不会随领卡上传。")
                        .font(.subheadline).foregroundStyle(.secondary)
                    Toggle("我已阅读并同意守则与数据说明", isOn: $draft.acceptedDataUse)
                        .tint(BojiTheme.green).accessibilityIdentifier("membership-terms")
                    Button("查看守则与数据说明") { showRules = true }
                        .font(.subheadline).buttonStyle(.borderless).frame(minHeight: 44)
                }
            }
        }
    }

    private func receipt(_ card: ClubMember) -> some View {
        VStack(alignment: .leading, spacing: 22) {
            PageHeading(eyebrow: "YOUR PLACE IN THE CLUB",
                        title: card.isActive ? "欢迎加入。\n按你的节奏来。" : "会员卡已同步。",
                        subtitle: card.isActive ? "照顾自己，就是今天的开始。" : "会员信息以当前服务结果为准。")
                .accessibilityIdentifier("membership-enrollment-receipt")
            MembershipCardFace(card: card, isTest: membership.isTestEnvironment, isOffline: membership.isOffline)
            Text("在会员中心可以查看身份详情、制作分享卡和了解免费权益。")
                .font(.subheadline).foregroundStyle(.secondary)
        }
    }

    private var footer: some View {
        VStack(alignment: .leading, spacing: 12) {
            if step == 3 {
                PrimaryButton(title: "查看我的会员卡", symbol: "person.crop.rectangle") { dismiss() }
                    .accessibilityIdentifier("membership-enrollment-done")
            } else {
                MembershipMessages()
                if membership.isOffline {
                    Button("重新连接并确认会员信息", systemImage: "arrow.clockwise") {
                        Task { await membership.refresh() }
                    }.buttonStyle(.glass).disabled(membership.isBusy)
                }
                HStack(spacing: 12) {
                    if step > 0 {
                        Button("上一步", systemImage: "chevron.backward") { nameFocused = false; step -= 1 }
                            .labelStyle(.iconOnly).font(.title3)
                            .buttonStyle(.glass).buttonBorderShape(.circle).controlSize(.extraLarge)
                            .disabled(membership.isBusy)
                            .accessibilityIdentifier("membership-enroll-back")
                    }
                    PrimaryButton(title: membership.isBusy ? "正在确认…" : step == 2 ? "确认免费领卡" : "继续", symbol: step == 2 ? "checkmark" : "arrow.right") {
                        nameFocused = false
                        if step < 2 { step += 1 }
                        else { Task { await membership.enroll(displayName: draft.normalizedName, acceptedTerms: draft.canSubmit) } }
                    }
                    .disabled(membership.isBusy || (step == 0 ? draft.nameError != nil : step == 1 ? !draft.canReview : !draft.canSubmit || membership.isOffline))
                    .accessibilityIdentifier(step == 2 ? "membership-enroll-confirm" : "membership-enroll-next")
                }
            }
        }.padding(.horizontal, 20).padding(.bottom, 8).frame(maxWidth: 560)
    }
}
