import CoreImage
import CoreImage.CIFilterBuiltins
import SwiftUI

/// 会员码页面。二维码的内容是动态码，每个时间步变化一次，供工作人员扫码确认会员身份。
struct MembershipCodeView: View {
    @Environment(MembershipStore.self) private var membership
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                Group {
                    if let code = membership.activeMembershipCode, let card = membership.card {
                        TimelineView(.periodic(from: .now, by: 1)) { context in
                            content(code: code, memberNumber: card.memberNumber, at: context.date)
                        }
                    } else if membership.isBusy {
                        ProgressView().frame(maxWidth: .infinity, minHeight: 320)
                    } else {
                        unavailable
                    }
                }
                .padding(24)
                .frame(maxWidth: 480)
                .frame(maxWidth: .infinity)
            }
            .navigationTitle(Text(.Shared.membershipCodeTitle))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("关闭", systemImage: "xmark", role: .close) { dismiss() }
                }
            }
            .task { await membership.prepareMembershipCode() }
        }
    }

    private func content(code: MembershipCode, memberNumber: String, at date: Date) -> some View {
        VStack(spacing: 20) {
            MembershipQRCode(value: code.dynamicValue(at: date))
                .equatable()
                .frame(maxWidth: 300)
                .accessibilityIdentifier("membership-code-qr")
            Text(.Shared.membershipCodeRefresh(seconds: code.secondsRemaining(at: date)))
                .font(.subheadline.monospacedDigit())
                .foregroundStyle(.secondary)
                .contentTransition(.numericText(countsDown: true))
                .accessibilityIdentifier("membership-code-countdown")
            VStack(spacing: 4) {
                Text(.Shared.membershipCodeCardNumber)
                    .font(.footnote).foregroundStyle(.secondary)
                Text(verbatim: memberNumber)
                    .font(.system(.title3, design: .monospaced))
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
                    .accessibilityIdentifier("membership-code-number")
            }
            Text(.Shared.membershipCodeHint)
                .font(.footnote).foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var unavailable: some View {
        ContentUnavailableView {
            Label { Text(.Shared.membershipCodeTitle) } icon: { Image(systemName: "qrcode") }
        } description: {
            Text(membership.errorMessage ?? String(localized: .Shared.membershipCodeUnavailable))
        } actions: {
            Button(.Shared.actionRetry) { Task { await membership.prepareMembershipCode() } }
                .buttonStyle(.bordered)
                .accessibilityIdentifier("membership-code-retry")
        }
    }
}

/// 黑白二维码。只有内容变化时才重新生成图像。
private struct MembershipQRCode: View, Equatable {
    let value: String

    var body: some View {
        Group {
            if let image = Self.image(for: value) {
                Image(decorative: image, scale: 1)
                    .interpolation(.none)
                    .resizable()
                    .scaledToFit()
            } else {
                Image(systemName: "qrcode").resizable().scaledToFit().foregroundStyle(.secondary)
            }
        }
        .padding(16)
        // 扫码器需要深色模块和浅色背景，所以深色模式下也使用白底。
        .background(.white, in: .rect(cornerRadius: 16))
        .accessibilityElement()
        .accessibilityLabel(Text(.Shared.membershipCodeTitle))
        .accessibilityAddTraits(.isImage)
    }

    private static let context = CIContext(options: [.useSoftwareRenderer: false])

    private static func image(for value: String) -> CGImage? {
        let filter = CIFilter.qrCodeGenerator()
        filter.message = Data(value.utf8)
        filter.correctionLevel = "M"
        guard let output = filter.outputImage else { return nil }
        return context.createCGImage(output, from: output.extent)
    }
}
