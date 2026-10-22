import SwiftUI

struct ExercisePreviewView: View {
    let exercise: Exercise
    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase
    @State private var playing = true
    @State private var still = false
    @State private var speed = 1.0
    @State private var entry: ExerciseAnimationDescriptor?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    ExerciseAnimationView(exercise: exercise, isPlaying: playing, showsPoster: still, speed: speed)
                        .frame(maxWidth: 420).frame(maxWidth: .infinity)
                        .background(BojiTheme.card, in: .rect(cornerRadius: BojiTheme.cardRadius))
                    if reduceMotion || ExerciseAnimationTestSettings.reduceMotion {
                        Label("已开启减少动态效果，显示代表姿势。", systemImage: "figure.stand")
                            .font(.footnote).foregroundStyle(.secondary)
                    } else {
                        HStack {
                            Button(playing ? "暂停演示" : "播放演示", systemImage: playing ? "pause.fill" : "play.fill") {
                                if still { still = false; playing = true } else { playing.toggle() }
                            }
                            .buttonStyle(.bordered).frame(minHeight: 44)
                            .accessibilityIdentifier("exercise-playback-toggle")
                            Spacer()
                            Button("代表姿势", systemImage: "figure.stand") { still = true; playing = false }
                                .buttonStyle(.bordered).frame(minHeight: 44)
                                .accessibilityIdentifier("exercise-show-poster")
                        }
                        Picker("演示速度", selection: $speed) {
                            Text("慢速 0.5×").tag(0.5)
                            Text("正常 1×").tag(1.0)
                        }.pickerStyle(.segmented).accessibilityIdentifier("exercise-speed")
                        Text("演示速度仅供观察，不作为训练节拍。").font(.footnote).foregroundStyle(.secondary)
                    }
                    Surface {
                        VStack(alignment: .leading, spacing: 12) {
                            Text(.Shared.detailExerciseSets(sets: exercise.sets, reps: exercise.reps.text)).font(.headline)
                            Text(exercise.tip)
                            if let entry {
                                Text("主要肌群：\(entry.muscles.map(\.name), format: .list(type: .and))")
                                    .font(.subheadline).foregroundStyle(.secondary)
                            }
                        }
                    }
                    Text("动画为通用示意，未经过专业动作审核。不要只照动画训练；如有疼痛或不适，请停止。")
                        .font(.footnote).foregroundStyle(.secondary)
                }.padding(20).frame(maxWidth: 620).frame(maxWidth: .infinity)
            }
            .pageBackground()
            .navigationTitle(exercise.name).navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("关闭", systemImage: "xmark", role: .close) { dismiss() } }
            }
        }
        .onChange(of: scenePhase) { _, phase in if phase != .active { playing = false } }
        .task(id: exercise.id) { entry = await ExerciseAnimationLoader.shared.descriptor(for: exercise.id) }
    }
}
