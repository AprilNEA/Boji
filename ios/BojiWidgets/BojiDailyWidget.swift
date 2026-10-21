import SwiftUI
import WidgetKit

private enum BojiDailyState {
    case disabled
    case stale
    case current(training: Bool, water: Bool, sleep: Bool)

    static func load(at date: Date) -> Self {
        guard let snapshot = CompanionSnapshotStore.live().load() else {
            return .disabled
        }
        guard snapshot.isSharingEnabled else {
            return .disabled
        }
        guard snapshot.isCurrent(at: date) else {
            return .stale
        }
        return .current(
            training: snapshot.trainingCompleted,
            water: snapshot.waterLogged,
            sleep: snapshot.sleepLogged
        )
    }

    var title: String {
        switch self {
        case .disabled:
            return String(localized: "未开启记录共享")
        case .stale:
            return String(localized: "记录待同步")
        case .current:
            return String(localized: "今日记录")
        }
    }

    var detail: String {
        switch self {
        case .disabled:
            return String(localized: "请到 App 设置开启")
        case .stale:
            return String(localized: "请打开 App 同步")
        case .current:
            return String(localized: "手动记录状态")
        }
    }

    var symbolName: String {
        switch self {
        case .disabled:
            return "gearshape"
        case .stale:
            return "arrow.triangle.2.circlepath"
        case let .current(training, water, sleep):
            return training && water && sleep ? "checkmark" : "list.bullet"
        }
    }

    var accessibilityLabel: String {
        switch self {
        case .disabled:
            return String(localized: "未开启记录共享。请到 App 设置开启。")
        case .stale:
            return String(localized: "记录待同步。请打开 App 同步。")
        case let .current(training, water, sleep):
            let trainingText = training ? String(localized: "已记录") : String(localized: "待记录")
            let waterText = water ? String(localized: "已记录") : String(localized: "待记录")
            let sleepText = sleep ? String(localized: "已记录") : String(localized: "待记录")
            return String(localized: "今日记录。训练\(trainingText)。饮水\(waterText)。睡眠\(sleepText)。")
        }
    }
}

private struct BojiDailyEntry: TimelineEntry {
    let date: Date
    let state: BojiDailyState
}

private struct BojiDailyProvider: TimelineProvider {
    func placeholder(in context: Context) -> BojiDailyEntry {
        BojiDailyEntry(date: .now, state: .disabled)
    }

    func getSnapshot(in context: Context, completion: @escaping (BojiDailyEntry) -> Void) {
        let now = Date()
        completion(BojiDailyEntry(date: now, state: context.isPreview ? .disabled : BojiDailyState.load(at: now)))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<BojiDailyEntry>) -> Void) {
        let now = Date()
        let state = BojiDailyState.load(at: now)
        let midnightState: BojiDailyState
        if case .disabled = state { midnightState = .disabled } else { midnightState = .stale }
        let entries = [
            BojiDailyEntry(date: now, state: state),
            BojiDailyEntry(date: nextLocalMidnight(after: now), state: midnightState)
        ]
        completion(Timeline(entries: entries, policy: .after(now.addingTimeInterval(30 * 60))))
    }

    private func nextLocalMidnight(after date: Date) -> Date {
        let calendar = Calendar.autoupdatingCurrent
        let startOfToday = calendar.startOfDay(for: date)
        return calendar.date(byAdding: .day, value: 1, to: startOfToday) ?? date.addingTimeInterval(24 * 60 * 60)
    }
}

struct BojiDailyWidget: Widget {
    let kind = CompanionIdentifiers.widgetKind

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: BojiDailyProvider()) { entry in
            BojiDailyWidgetView(entry: entry)
                .containerBackground(for: .widget) {
                    BojiWidgetPalette.background
                }
        }
        .configurationDisplayName("薄肌今日记录")
        .description("查看今天的训练、饮水和睡眠记录状态。")
        .supportedFamilies([
            .systemSmall,
            .systemMedium,
            .accessoryRectangular,
            .accessoryCircular
        ])
    }
}

private struct BojiDailyWidgetView: View {
    @Environment(\.widgetFamily) private var family

    let entry: BojiDailyEntry

    var body: some View {
        Group {
            switch family {
            case .systemSmall:
                smallView
            case .systemMedium:
                mediumView
            case .accessoryRectangular:
                rectangularAccessoryView
            case .accessoryCircular:
                circularAccessoryView
            default:
                smallView
            }
        }
        .widgetURL(CompanionRoute.today.url)
        .privacySensitive()
        .accessibilityElement(children: .combine)
        .accessibilityLabel(entry.state.accessibilityLabel)
    }

    private var smallView: some View {
        VStack(alignment: .leading, spacing: 10) {
            header
            switch entry.state {
            case let .current(training, water, sleep):
                VStack(alignment: .leading, spacing: 7) {
                    BojiRecordRow(title: String(localized: "训练"), symbol: "dumbbell.fill", isLogged: training)
                    BojiRecordRow(title: String(localized: "饮水"), symbol: "drop.fill", isLogged: water)
                    BojiRecordRow(title: String(localized: "睡眠"), symbol: "bed.double.fill", isLogged: sleep)
                }
            case .disabled, .stale:
                unavailableMessage
            }
            Spacer(minLength: 0)
        }
    }

    private var mediumView: some View {
        HStack(alignment: .top, spacing: 16) {
            VStack(alignment: .leading, spacing: 6) {
                header
                Text(entry.state.detail)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            switch entry.state {
            case let .current(training, water, sleep):
                HStack(spacing: 9) {
                    Link(destination: CompanionRoute.training.url) {
                        BojiRecordTile(title: String(localized: "训练"), symbol: "dumbbell.fill", isLogged: training)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(training ? Text("训练已记录。打开训练。") : Text("训练待记录。打开训练。"))

                    BojiRecordTile(title: String(localized: "饮水"), symbol: "drop.fill", isLogged: water)
                    BojiRecordTile(title: String(localized: "睡眠"), symbol: "bed.double.fill", isLogged: sleep)
                }
            case .disabled, .stale:
                unavailableMessage
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }
        }
    }

    private var rectangularAccessoryView: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(entry.state.title)
                .font(.headline)
                .lineLimit(1)

            switch entry.state {
            case let .current(training, water, sleep):
                HStack(spacing: 7) {
                    BojiCompactStatus(title: String(localized: "训"), name: String(localized: "训练"), isLogged: training)
                    BojiCompactStatus(title: String(localized: "饮"), name: String(localized: "饮水"), isLogged: water)
                    BojiCompactStatus(title: String(localized: "眠"), name: String(localized: "睡眠"), isLogged: sleep)
                }
            case .disabled, .stale:
                Text(entry.state.detail)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
    }

    private var circularAccessoryView: some View {
        ZStack {
            Circle()
                .stroke(BojiWidgetPalette.green.opacity(0.35), lineWidth: 2)
            switch entry.state {
            case let .current(training, water, sleep):
                HStack(spacing: 1) {
                    BojiCircularStatus(title: String(localized: "训"), name: String(localized: "训练"), isLogged: training)
                    BojiCircularStatus(title: String(localized: "饮"), name: String(localized: "饮水"), isLogged: water)
                    BojiCircularStatus(title: String(localized: "眠"), name: String(localized: "睡眠"), isLogged: sleep)
                }
            case .disabled, .stale:
                Image(systemName: entry.state.symbolName)
                    .font(.system(size: 19, weight: .semibold))
                    .foregroundStyle(.secondary)
            }
        }
        .padding(5)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(entry.state.title)
                .font(.headline.weight(.semibold))
                .lineLimit(1)
            if entry.state.isCurrent {
                Text("训练・饮水・睡眠")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var unavailableMessage: some View {
        Label(entry.state.detail, systemImage: entry.state.symbolName)
            .font(.caption)
            .foregroundStyle(.secondary)
            .lineLimit(2)
    }
}

private struct BojiRecordRow: View {
    let title: String
    let symbol: String
    let isLogged: Bool

    var body: some View {
        HStack(spacing: 7) {
            Image(systemName: symbol)
                .font(.caption.weight(.semibold))
                .frame(width: 14)
            Text(title)
            Spacer(minLength: 4)
            Text(isLogged ? "已记" : "待记")
                .foregroundStyle(isLogged ? BojiWidgetPalette.green : .secondary)
                .widgetAccentable(isLogged)
        }
        .font(.caption)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(isLogged ? Text("\(title)已记录") : Text("\(title)待记录"))
    }
}

private struct BojiRecordTile: View {
    let title: String
    let symbol: String
    let isLogged: Bool

    var body: some View {
        VStack(spacing: 5) {
            Image(systemName: symbol)
                .font(.body.weight(.semibold))
                .foregroundStyle(isLogged ? BojiWidgetPalette.green : .secondary)
                .widgetAccentable(isLogged)
            Text(title)
                .font(.caption2)
            Text(isLogged ? "已记" : "待记")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(minWidth: 34)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(isLogged ? Text("\(title)已记录") : Text("\(title)待记录"))
    }
}

private struct BojiCompactStatus: View {
    /// One character that fits the accessory widget.
    let title: String
    /// The full habit name that VoiceOver reads.
    let name: String
    let isLogged: Bool

    var body: some View {
        HStack(spacing: 2) {
            Text(title)
            Image(systemName: isLogged ? "checkmark.circle.fill" : "circle")
        }
        .font(.caption2)
        .foregroundStyle(isLogged ? BojiWidgetPalette.green : .secondary)
        .accessibilityLabel(isLogged ? Text("\(name)已记录") : Text("\(name)待记录"))
    }
}

private struct BojiCircularStatus: View {
    /// One character that fits the accessory widget.
    let title: String
    /// The full habit name that VoiceOver reads.
    let name: String
    let isLogged: Bool

    var body: some View {
        Text(title)
            .font(.caption2.weight(.bold))
            .foregroundStyle(isLogged ? BojiWidgetPalette.green : .secondary)
            .accessibilityLabel(isLogged ? Text("\(name)已记录") : Text("\(name)待记录"))
    }
}

private enum BojiWidgetPalette {
    static let green = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? .systemMint
            : UIColor(red: 0.15, green: 0.40, blue: 0.32, alpha: 1)
    })

    static let background = Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 0.075, green: 0.075, blue: 0.07, alpha: 1)
            : UIColor(red: 0.97, green: 0.96, blue: 0.94, alpha: 1)
    })
}

private extension BojiDailyState {
    var isCurrent: Bool {
        if case .current = self {
            return true
        }
        return false
    }
}

@main
struct BojiWidgets: WidgetBundle {
    var body: some Widget {
        BojiDailyWidget()
    }
}
