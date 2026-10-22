import AVFoundation
import SwiftUI
import VisionKit

/// 工作人员的扫码校验页面。相机识别出二维码后立即校验，结果显示在取景框下方。
///
/// 相机画面只在本机识别，不上传。只有识别出的文字发给 bizserver。
/// 相机不可用时，例如在模拟器上，页面只提供手动输入。
struct MembershipScannerView: View {
    @Environment(MembershipStore.self) private var membership
    @Environment(\.dismiss) private var dismiss
    @State private var camera = CameraAccess.current()
    @State private var manualCode = ""

    private var verifier: MembershipVerifier { membership.verifier }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    viewfinder
                    if let outcome = verifier.outcome {
                        MembershipScanResult(outcome: outcome) { verifier.clearOutcome() }
                    } else if verifier.isVerifying {
                        ProgressView().frame(minHeight: 80)
                    }
                    manualEntry
                }
                .padding(24)
                .frame(maxWidth: 480)
                .frame(maxWidth: .infinity)
            }
            .navigationTitle(Text(.Shared.membershipScanTitle))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("关闭", systemImage: "xmark", role: .close) { dismiss() }
                }
            }
            .task { camera = await CameraAccess.request() }
            .onDisappear { verifier.clearOutcome() }
            .sensoryFeedback(trigger: verifier.outcome) { _, outcome in
                switch outcome {
                case .verified(let verification):
                    verification.standing == .valid ? .success : .warning
                case .failed:
                    .error
                case nil:
                    nil
                }
            }
        }
    }

    @ViewBuilder
    private var viewfinder: some View {
        VStack(spacing: 12) {
            Group {
                switch camera {
                case .ready:
                    QRCodeScanner { value in Task { await verifier.verify(value) } }
                        .accessibilityLabel(Text(.Shared.membershipScanHint))
                case .pending:
                    ProgressView()
                case .unsupported:
                    cameraMessage(.Shared.membershipScanCameraUnavailable)
                case .denied:
                    cameraMessage(.Shared.membershipScanCameraDenied)
                }
            }
            .frame(maxWidth: .infinity)
            .aspectRatio(1, contentMode: .fit)
            .background(.quaternary, in: .rect(cornerRadius: 20))
            .clipShape(.rect(cornerRadius: 20))
            if camera == .ready {
                Text(.Shared.membershipScanHint)
                    .font(.footnote).foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
        }
    }

    private func cameraMessage(_ text: LocalizedStringResource) -> some View {
        VStack(spacing: 12) {
            Image(systemName: "camera.metering.unknown")
                .font(.largeTitle)
                .foregroundStyle(.secondary)
                .accessibilityHidden(true)
            Text(text)
                .font(.callout)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(24)
    }

    private var manualEntry: some View {
        HStack(spacing: 12) {
            TextField(text: $manualCode) { Text(.Shared.membershipScanManualPlaceholder) }
                .textFieldStyle(.roundedBorder)
                .font(.body.monospaced())
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .submitLabel(.go)
                .onSubmit(submitManualCode)
                .accessibilityIdentifier("membership-scan-manual")
            Button(.Shared.membershipScanManualSubmit, action: submitManualCode)
                .buttonStyle(.bordered)
                .disabled(!canSubmitManualCode)
                .accessibilityIdentifier("membership-scan-submit")
        }
    }

    private var canSubmitManualCode: Bool {
        !manualCode.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !verifier.isVerifying && verifier.outcome == nil
    }

    private func submitManualCode() {
        guard canSubmitManualCode else { return }
        let value = manualCode
        Task {
            await verifier.verify(value)
            // 校验通过后清空输入框。失败时保留，方便工作人员改正输错的字符。
            if case .verified = verifier.outcome { manualCode = "" }
        }
    }
}

/// 一次校验的结果：会员卡状态、会员卡号、昵称和会员码来源。
private struct MembershipScanResult: View {
    let outcome: MembershipVerifier.Outcome
    let onNext: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            switch outcome {
            case .verified(let verification):
                verified(verification)
            case .failed(let message):
                Label {
                    Text(verbatim: message).font(.headline)
                } icon: {
                    Image(systemName: "xmark.octagon.fill").foregroundStyle(.red)
                }
            }
            Button(action: onNext) {
                Text(.Shared.membershipScanNext).frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .accessibilityIdentifier("membership-scan-next")
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.background.secondary, in: .rect(cornerRadius: 20))
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("membership-scan-result")
    }

    private func verified(_ verification: MembershipVerification) -> some View {
        let standing = verification.standing
        return VStack(alignment: .leading, spacing: 12) {
            Label {
                Text(title(for: standing)).font(.title3.bold())
            } icon: {
                Image(systemName: standing == .valid ? "checkmark.seal.fill" : "exclamationmark.triangle.fill")
                    .foregroundStyle(standing == .valid ? .green : .orange)
            }
            LabeledContent {
                Text(verbatim: verification.member.memberNumber)
                    .font(.body.monospaced())
                    .textSelection(.enabled)
            } label: {
                Text(.Shared.membershipCodeCardNumber)
            }
            LabeledContent {
                Text(verbatim: verification.member.displayName)
            } label: {
                Text(.Shared.membershipScanNickname)
            }
            switch verification.kind {
            case .app:
                Text(.Shared.membershipScanKindDynamic)
                    .font(.footnote).foregroundStyle(.secondary)
            case .walletPass:
                Label {
                    Text(.Shared.membershipScanKindStatic)
                        .fixedSize(horizontal: false, vertical: true)
                } icon: {
                    Image(systemName: "wallet.pass")
                }
                .font(.footnote)
                .foregroundStyle(.orange)
            }
        }
    }

    private func title(for standing: MembershipVerification.Standing) -> LocalizedStringResource {
        switch standing {
        case .valid: .Shared.membershipScanValid
        case .suspended: .Shared.membershipScanSuspended
        case .expired: .Shared.membershipScanCardExpired
        }
    }
}

/// 相机权限和设备能力。
private enum CameraAccess: Equatable {
    case ready
    case pending
    case unsupported
    case denied

    @MainActor
    static func current() -> CameraAccess {
        guard DataScannerViewController.isSupported else { return .unsupported }
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            return DataScannerViewController.isAvailable ? .ready : .denied
        case .notDetermined:
            return .pending
        default:
            return .denied
        }
    }

    /// 第一次打开时请求相机权限。已经决定过时，直接返回当前状态。
    @MainActor
    static func request() async -> CameraAccess {
        let state = current()
        guard state == .pending else { return state }
        guard await AVCaptureDevice.requestAccess(for: .video) else { return .denied }
        return current()
    }
}

/// 只识别二维码的 VisionKit 扫码器。每个新出现的二维码只回调一次。
private struct QRCodeScanner: UIViewControllerRepresentable {
    let onCode: @MainActor (String) -> Void

    func makeUIViewController(context: Context) -> DataScannerViewController {
        let scanner = DataScannerViewController(
            recognizedDataTypes: [.barcode(symbologies: [.qr])],
            qualityLevel: .balanced,
            recognizesMultipleItems: false,
            isHighFrameRateTrackingEnabled: false,
            isPinchToZoomEnabled: true,
            isGuidanceEnabled: true,
            isHighlightingEnabled: true
        )
        scanner.delegate = context.coordinator
        return scanner
    }

    func updateUIViewController(_ scanner: DataScannerViewController, context: Context) {
        context.coordinator.onCode = onCode
        if !scanner.isScanning {
            try? scanner.startScanning()
        }
    }

    static func dismantleUIViewController(_ scanner: DataScannerViewController, coordinator: Coordinator) {
        scanner.stopScanning()
    }

    func makeCoordinator() -> Coordinator { Coordinator(onCode: onCode) }

    @MainActor
    final class Coordinator: NSObject, DataScannerViewControllerDelegate {
        var onCode: @MainActor (String) -> Void

        init(onCode: @escaping @MainActor (String) -> Void) {
            self.onCode = onCode
        }

        func dataScanner(
            _ dataScanner: DataScannerViewController,
            didAdd addedItems: [RecognizedItem],
            allItems: [RecognizedItem]
        ) {
            for item in addedItems {
                if case .barcode(let barcode) = item, let value = barcode.payloadStringValue {
                    onCode(value)
                    return
                }
            }
        }
    }
}
