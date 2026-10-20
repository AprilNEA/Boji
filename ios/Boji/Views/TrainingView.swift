import SwiftUI

struct TrainingView: View {
    @Environment(BojiStore.self) private var store
    var body: some View {
        @Bindable var store = store
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    PageHeading(eyebrow: "BUILD YOUR OWN RHYTHM", title: "慢慢练，刚刚好。", subtitle: "把开始变简单，把坚持交给时间。")
                    Picker("训练场景", selection: $store.selectedPlan) {
                        ForEach(PlanKind.allCases) { Text($0.title).tag($0) }
                    }.pickerStyle(.segmented)
                    NavigationLink { WorkoutDetailView(workout: WorkoutLibrary.recommended(for: store.selectedPlan)) } label: {
                        WorkoutCard(workout: WorkoutLibrary.recommended(for: store.selectedPlan))
                    }.buttonStyle(.plain)
                    Surface {
                        VStack(alignment: .leading, spacing: 18) {
                            SectionHeading(title: "先建立节奏", detail: "新手起步")
                            Label("每周安排 2–3 次，训练日之间留出休息。", systemImage: "calendar").font(.subheadline)
                            Divider()
                            Label("从轻负荷开始，先熟悉动作，再逐步增加。", systemImage: "figure.mind.and.body").font(.subheadline)
                        }
                    }
                    SectionHeading(title: "给身体一点余地")
                    NavigationLink { WorkoutDetailView(workout: WorkoutLibrary.mobility) } label: {
                        Surface {
                            HStack(spacing: 16) {
                                SymbolTile(symbol: "figure.flexibility", color: BojiTheme.green)
                                VStack(alignment: .leading, spacing: 6) { Text(WorkoutLibrary.mobility.title).font(.headline); Text("\(WorkoutLibrary.mobility.minutes) 分钟 · 温和活动").font(.caption).foregroundStyle(.secondary) }
                                Spacer(); Image(systemName: "chevron.right").font(.caption.bold()).foregroundStyle(.secondary)
                            }
                        }
                    }.buttonStyle(.plain)
                    Text("课程是通用入门参考，不是个性化处方。有伤病或运动限制时，先咨询专业人员。出现疼痛、头晕或不适时立即停止。")
                        .font(.footnote).foregroundStyle(.secondary).padding(.bottom, 20)
                }.padding(20).frame(maxWidth: 680).frame(maxWidth: .infinity)
            }.pageBackground().navigationTitle("训练").navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct WorkoutDetailView: View {
    let workout: Workout
    @Environment(BojiStore.self) private var store
    @State private var training = false
    private var completed: Bool { store.today.completedWorkoutIDs.contains(workout.id) }
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                WorkoutCard(workout: workout).accessibilityHidden(true)
                HStack(spacing: 0) {
                    metric("\(workout.minutes)", "计划分钟")
                    Divider().frame(height: 34)
                    metric("\(workout.exercises.count)", "个动作")
                    Divider().frame(height: 34)
                    metric(workout.level, "训练强度")
                }.padding(.vertical, 8)
                Text(workout.subtitle).font(.body).foregroundStyle(.secondary)
                SectionHeading(title: "今天这样练", detail: "组间休息 30 秒")
                ForEach(Array(workout.exercises.enumerated()), id: \.element.id) { index, exercise in
                    Surface {
                        HStack(alignment: .top, spacing: 14) {
                            Text(String(format: "%02d", index + 1)).font(.system(.title2, design: .rounded, weight: .medium)).foregroundStyle(BojiTheme.accent)
                            VStack(alignment: .leading, spacing: 8) {
                                Text(exercise.name).font(.headline)
                                Text("\(exercise.sets) 组 × \(exercise.reps)").font(.subheadline).foregroundStyle(BojiTheme.accent)
                                Text(exercise.tip).font(.footnote).foregroundStyle(.secondary)
                            }
                            Spacer(minLength: 0)
                        }
                    }
                }
                Label("先热身，再开始。动作以舒适、可控为准。", systemImage: "heart.text.clipboard")
                    .font(.footnote).foregroundStyle(.secondary).padding(.bottom, 20)
            }.padding(20).frame(maxWidth: 680).frame(maxWidth: .infinity)
        }.pageBackground().navigationTitle(workout.title).navigationBarTitleDisplayMode(.inline)
            .safeAreaInset(edge: .bottom) {
                PrimaryButton(title: completed ? "再次练习" : "开始训练", symbol: "play.fill") { training = true }
                    .padding(.horizontal, 20).padding(.vertical, 12).background(BojiTheme.background.opacity(0.96))
            }
            .fullScreenCover(isPresented: $training) { WorkoutSessionView(workout: workout) }
    }
    private func metric(_ value: String, _ label: String) -> some View {
        VStack(spacing: 5) { Text(value).font(.title2.bold()); Text(label).font(.caption).foregroundStyle(.secondary) }.frame(maxWidth: .infinity)
    }
}

struct WorkoutSessionView: View {
    let workout: Workout
    @Environment(BojiStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var scenePhase
    @State private var index = 0
    @State private var currentSet = 1
    @State private var elapsed = 0
    @State private var restRemaining = 0
    @State private var running = true
    @State private var finished = false
    @State private var confirmExit = false
    private var exercise: Exercise { workout.exercises[index] }
    private var totalSets: Int { workout.exercises.reduce(0) { $0 + $1.sets } }
    private var completedSets: Int { workout.exercises.prefix(index).reduce(0) { $0 + $1.sets } + currentSet - 1 }
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 25) {
                    if finished {
                        Image(systemName: "checkmark.seal.fill").font(.system(size: 74)).foregroundStyle(BojiTheme.green).padding(.top, 48)
                        Text("又向自己靠近了一步。").font(.title.bold()).multilineTextAlignment(.center)
                        Text("\(workout.title)已记录\n用时 \(elapsed / 60) 分 \(elapsed % 60) 秒")
                            .font(.body).foregroundStyle(.secondary).multilineTextAlignment(.center)
                        Text("好好休息，比多练一组更重要。").font(.subheadline).padding(.vertical)
                        PrimaryButton(title: "完成", symbol: "checkmark") { dismiss() }
                    } else {
                        HStack { Text("动作 \(index + 1) / \(workout.exercises.count)"); Spacer(); Text(String(format: "%02d:%02d", elapsed / 60, elapsed % 60)).monospacedDigit() }
                            .font(.subheadline.weight(.medium)).foregroundStyle(.secondary)
                        SwiftUI.ProgressView(value: Double(completedSets), total: Double(totalSets)).tint(BojiTheme.accent)
                        OrbitArtwork(color: restRemaining > 0 ? BojiTheme.green : BojiTheme.accent,
                                     symbol: restRemaining > 0 ? "figure.cooldown" : exercise.symbol)
                            .padding(.vertical, 12)
                        Text(restRemaining > 0 ? "休息一下" : exercise.name).font(.largeTitle.bold())
                        if restRemaining > 0 {
                            Text("\(restRemaining)").font(.system(size: 62, weight: .light, design: .rounded)).monospacedDigit()
                            Text("调整呼吸，准备下一组。").foregroundStyle(.secondary)
                        } else {
                            Text("第 \(currentSet) / \(exercise.sets) 组 · \(exercise.reps)").font(.title3).foregroundStyle(BojiTheme.accent)
                            Surface { Text(exercise.tip).font(.body).frame(maxWidth: .infinity).multilineTextAlignment(.center) }
                        }
                        if !running { Label("已暂停", systemImage: "pause.circle").font(.headline).foregroundStyle(.secondary) }
                        PrimaryButton(title: restRemaining > 0 ? "跳过休息" : "完成这一组", symbol: "checkmark") {
                            if restRemaining > 0 { restRemaining = 0 } else { nextSet() }
                        }.disabled(!running)
                        Button(running ? "暂停训练" : "继续训练", systemImage: running ? "pause" : "play") { running.toggle() }
                            .buttonStyle(.glass).controlSize(.large).frame(minHeight: 44)
                        Text("按自己的速度完成动作，准备好再继续。\n如有疼痛或不适，请停止训练。")
                            .font(.footnote).foregroundStyle(.secondary).multilineTextAlignment(.center)
                    }
                }.padding(24).frame(maxWidth: 620).frame(maxWidth: .infinity)
            }.pageBackground().navigationTitle(finished ? "训练完成" : "专注当下").navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    if !finished { ToolbarItem(placement: .cancellationAction) { Button("结束", systemImage: "xmark") { running = false; confirmExit = true } } }
                }
                .confirmationDialog("结束本次训练？未完成的训练不会记录。", isPresented: $confirmExit, titleVisibility: .visible) {
                    Button("结束训练", role: .destructive) { dismiss() }
                    Button("继续训练", role: .cancel) { running = true }
                }
        }.interactiveDismissDisabled()
            .task(id: running) {
                guard running, !finished else { return }
                while !Task.isCancelled {
                    do { try await Task.sleep(for: .seconds(1)) } catch { return }
                    guard running, !finished else { return }
                    elapsed += 1
                    if restRemaining > 0 { restRemaining -= 1 }
                }
            }
            .onChange(of: scenePhase) { _, phase in if phase != .active { running = false } }
    }
    private func nextSet() {
        if currentSet < exercise.sets { currentSet += 1; restRemaining = 30 }
        else if index < workout.exercises.count - 1 { index += 1; currentSet = 1; restRemaining = 30 }
        else { store.completeWorkout(workout); finished = true; running = false }
    }
}
