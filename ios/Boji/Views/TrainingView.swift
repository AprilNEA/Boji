import SwiftUI

struct TrainingView: View {
    @Environment(BojiStore.self) private var store
    @Namespace private var transition

    var body: some View {
        @Bindable var store = store
        let recommended = WorkoutLibrary.recommended(for: store.selectedPlan)
        NavigationStack {
            PageScroll {
                VStack(alignment: .leading, spacing: 12) {
                    Picker(.Shared.trainingPlanLabel, selection: $store.selectedPlan.animation(.snappy)) {
                        ForEach(PlanKind.allCases) { Text($0.title).tag($0) }
                    }
                    .pickerStyle(.segmented)
                    courseLink(recommended) { WorkoutCard(workout: recommended) }
                        .buttonStyle(PressableCardStyle())
                }
                VStack(alignment: .leading, spacing: 12) {
                    SectionHeading(title: String(localized: .Shared.trainingRhythmTitle), detail: String(localized: .Shared.trainingRhythmDetail))
                    GroupedRows {
                        InfoRow(text: "每周安排 2～3 次，训练日之间留出休息。", symbol: "calendar")
                        InfoRow(text: String(localized: .Shared.trainingTipLoad), symbol: "figure.mind.and.body")
                    }
                }
                VStack(alignment: .leading, spacing: 12) {
                    SectionHeading(title: "更多课程")
                    GroupedRows {
                        courseLink(WorkoutLibrary.homeIntermediate) {
                            NavigationRowLabel(title: WorkoutLibrary.homeIntermediate.title,
                                               detail: "准备好了，再进一步 · \(WorkoutLibrary.homeIntermediate.minutes) 分钟",
                                               symbol: "figure.strengthtraining.traditional")
                        }
                        .buttonStyle(RowButtonStyle())
                        courseLink(WorkoutLibrary.mobility) {
                            NavigationRowLabel(title: WorkoutLibrary.mobility.title,
                                               detail: "给身体一点余地 · \(WorkoutLibrary.mobility.minutes) 分钟",
                                               symbol: "figure.flexibility", color: BojiTheme.green)
                        }
                        .buttonStyle(RowButtonStyle())
                    }
                }
            }
            .navigationTitle(.Shared.tabTraining)
            .navigationSubtitle(.Shared.trainingTitle)
            .profileToolbar()
        }
    }

    private func courseLink(_ workout: Workout, @ViewBuilder label: () -> some View) -> some View {
        NavigationLink {
            WorkoutDetailView(workout: workout)
                .navigationTransition(.zoom(sourceID: workout.id, in: transition))
        } label: {
            label()
        }
        .matchedTransitionSource(id: workout.id, in: transition)
    }
}

struct WorkoutDetailView: View {
    let workout: Workout
    @Environment(BojiStore.self) private var store
    @State private var training = false
    @State private var preview: Exercise?
    private var completed: Bool { store.today.completedWorkoutIDs.contains(workout.id) }

    var body: some View {
        PageScroll {
            WorkoutCard(workout: workout).accessibilityHidden(true)
            Surface(padding: 16) {
                AdaptiveStack(spacing: 8) {
                    metric("\(workout.minutes)", String(localized: .Shared.detailMinutes))
                    metric("\(workout.exercises.count)", String(localized: .Shared.detailExercises))
                    metric(workout.level, String(localized: .Shared.detailLevel))
                }
            }
            VStack(alignment: .leading, spacing: 12) {
                SectionHeading(title: String(localized: .Shared.detailPlanTitle), detail: String(localized: .Shared.detailPlanDetail))
                GroupedRows {
                    ForEach(Array(workout.exercises.enumerated()), id: \.element.id) { index, exercise in
                        Button { preview = exercise } label: { exerciseRow(index: index, exercise: exercise) }
                            .buttonStyle(RowButtonStyle())
                            .accessibilityIdentifier("exercise-preview-\(exercise.id)")
                            .accessibilityHint("查看动作演示")
                    }
                }
            }
            Label("先热身，再开始。课程是通用入门参考，不是个性化处方。有伤病时先咨询专业人员；出现疼痛、头晕或不适时立即停止。",
                  systemImage: "heart.text.clipboard")
                .font(.footnote).foregroundStyle(.secondary)
        }
        .navigationTitle(workout.title).navigationBarTitleDisplayMode(.inline)
        .safeAreaBar(edge: .bottom) {
            PrimaryButton(title: String(localized: completed ? .Shared.detailAgain : .Shared.detailStart), symbol: "play.fill") { training = true }
                .padding(.horizontal, 16).padding(.bottom, 8)
                .frame(maxWidth: 680)
        }
        .fullScreenCover(isPresented: $training) { WorkoutSessionView(workout: workout) }
        .sheet(item: $preview) { ExercisePreviewView(exercise: $0) }
    }

    private func exerciseRow(index: Int, exercise: Exercise) -> some View {
        HStack(alignment: .top, spacing: 14) {
            Text("\(index + 1)").font(.system(.headline, design: .rounded)).monospacedDigit()
                .foregroundStyle(BojiTheme.accent)
                .frame(minWidth: 28, minHeight: 28)
                .background(BojiTheme.accent.opacity(0.12), in: .circle)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 4) {
                Text(exercise.name).font(.body.weight(.semibold)).foregroundStyle(.primary)
                Text(.Shared.detailExerciseSets(sets: exercise.sets, reps: exercise.reps)).font(.subheadline).foregroundStyle(BojiTheme.accent)
                Text(exercise.tip).font(.footnote).foregroundStyle(.secondary)
            }
            Spacer(minLength: 8)
            Image(systemName: "play.circle").font(.title3).foregroundStyle(BojiTheme.accent).accessibilityHidden(true)
        }
    }

    private func metric(_ value: String, _ label: String) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.system(.title2, design: .rounded, weight: .bold))
            Text(label).font(.footnote).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
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
    @Namespace private var controls
    @ScaledMetric(relativeTo: .largeTitle) private var countdownSize: CGFloat = 96
    private static let restSeconds = 30
    private var exercise: Exercise { workout.exercises[index] }
    private var totalSets: Int { workout.exercises.reduce(0) { $0 + $1.sets } }
    private var completedSets: Int { workout.exercises.prefix(index).reduce(0) { $0 + $1.sets } + currentSet - 1 }
    private var resting: Bool { restRemaining > 0 }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    if finished { summary } else { activeContent }
                }
                .padding(.horizontal, 20).padding(.vertical, 12)
                .frame(maxWidth: 620).frame(maxWidth: .infinity)
            }
            .pageBackground()
            .navigationTitle(finished ? String(localized: .Shared.sessionFinishedTitle) : workout.title).navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if !finished {
                    ToolbarItem(placement: .cancellationAction) {
                        Button(.Shared.sessionEnd, systemImage: "xmark") { running = false; confirmExit = true }
                    }
                }
            }
            .safeAreaBar(edge: .bottom) { controlBar }
            .confirmationDialog("结束本次训练？未完成的训练不会记录。", isPresented: $confirmExit, titleVisibility: .visible) {
                Button(.Shared.sessionEndConfirm, role: .destructive) { dismiss() }
                Button(.Shared.sessionResume, role: .cancel) { running = true }
            }
        }
        .interactiveDismissDisabled()
        .sensoryFeedback(.impact(weight: .medium), trigger: completedSets)
        .sensoryFeedback(.success, trigger: finished)
        .task(id: running) {
            guard running, !finished else { return }
            while !Task.isCancelled {
                do { try await Task.sleep(for: .seconds(1)) } catch { return }
                guard running, !finished else { return }
                elapsed += 1
                if restRemaining > 0 { withAnimation(.snappy) { restRemaining -= 1 } }
            }
        }
        .onChange(of: scenePhase) { _, phase in if phase != .active { running = false } }
    }

    @ViewBuilder private var activeContent: some View {
        VStack(spacing: 8) {
            HStack {
                Text(.Shared.sessionProgress(current: index + 1, total: workout.exercises.count))
                Spacer()
                Text(Duration.seconds(elapsed).formatted(.time(pattern: .minuteSecond))).monospacedDigit()
                    .accessibilityLabel("已用时 \(elapsed / 60) 分 \(elapsed % 60) 秒")
            }
            .font(.subheadline.weight(.medium)).foregroundStyle(.secondary)
            SwiftUI.ProgressView(value: Double(completedSets), total: Double(totalSets))
                .tint(BojiTheme.accent)
                .accessibilityLabel("训练进度")
                .accessibilityValue("已完成 \(completedSets) 组，共 \(totalSets) 组")
        }
        if resting {
            restContent.transition(.blurReplace)
        } else {
            exerciseContent.transition(.blurReplace)
        }
        if !running {
            Label(.Shared.sessionPaused, systemImage: "pause.circle.fill").font(.headline).foregroundStyle(.secondary)
        }
    }

    private var exerciseContent: some View {
        VStack(spacing: 16) {
            ExerciseAnimationView(exercise: exercise, isPlaying: running && !finished && !confirmExit)
                .frame(maxWidth: 340)
                .padding(8)
                .background(BojiTheme.card, in: .rect(cornerRadius: BojiTheme.cardRadius))
            VStack(spacing: 6) {
                Text(exercise.name).font(.largeTitle.bold()).multilineTextAlignment(.center)
                Text(.Shared.sessionSet(current: currentSet, total: exercise.sets, reps: exercise.reps))
                    .font(.title3.weight(.semibold)).foregroundStyle(BojiTheme.accent)
                    .contentTransition(.numericText())
            }
            Text(exercise.tip).font(.body).foregroundStyle(.secondary).multilineTextAlignment(.center)
        }
    }

    private var restContent: some View {
        VStack(spacing: 16) {
            Text(.Shared.sessionRest).font(.largeTitle.bold())
            Text("\(restRemaining)")
                .font(.system(size: countdownSize, weight: .light, design: .rounded)).monospacedDigit()
                .contentTransition(.numericText(countsDown: true))
                .accessibilityLabel("剩余 \(restRemaining) 秒")
            Text(.Shared.sessionRestHint).font(.body).foregroundStyle(.secondary)
            Label("接下来：\(exercise.name) · 第 \(currentSet) 组", systemImage: "arrow.forward.circle")
                .font(.subheadline.weight(.medium))
                .padding(.horizontal, 14).padding(.vertical, 10)
                .background(BojiTheme.card, in: .capsule)
        }
        .padding(.vertical, 24)
    }

    private var summary: some View {
        VStack(spacing: 20) {
            Image(systemName: "checkmark.seal.fill").font(.system(size: 72)).foregroundStyle(BojiTheme.green)
                .imageScale(.large)
                .symbolEffect(.bounce, value: finished)
                .padding(.top, 40).accessibilityHidden(true)
            VStack(spacing: 8) {
                Text(.Shared.sessionFinishedHeadline).font(.title.bold()).multilineTextAlignment(.center)
                Text("\(workout.title)已记录").font(.body).foregroundStyle(.secondary)
            }
            Surface(padding: 16) {
                AdaptiveStack(spacing: 8) {
                    summaryMetric(Duration.seconds(elapsed).formatted(.time(pattern: .minuteSecond)), "用时")
                    summaryMetric("\(workout.exercises.count)", String(localized: .Shared.detailExercises))
                    summaryMetric("\(totalSets)", "组")
                }
            }
            Text(.Shared.sessionFinishedRest).font(.subheadline).foregroundStyle(.secondary)
        }
    }

    private func summaryMetric(_ value: String, _ label: String) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.system(.title2, design: .rounded, weight: .bold)).monospacedDigit()
            Text(label).font(.footnote).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
    }

    private var controlBar: some View {
        GlassEffectContainer(spacing: 12) {
            HStack(spacing: 12) {
                if finished {
                    PrimaryButton(title: String(localized: .Shared.actionDone), symbol: "checkmark") { dismiss() }
                        .glassEffectID("primary", in: controls)
                } else {
                    Button(running ? LocalizedStringResource.Shared.sessionPause : .Shared.sessionResume,
                           systemImage: running ? "pause.fill" : "play.fill") {
                        withAnimation(.snappy) { running.toggle() }
                    }
                    .labelStyle(.iconOnly).font(.title3)
                    .buttonStyle(.glass).buttonBorderShape(.circle).controlSize(.extraLarge)
                    .contentTransition(.symbolEffect(.replace))
                    .glassEffectID("pause", in: controls)
                    PrimaryButton(title: String(localized: resting ? .Shared.sessionSkipRest : .Shared.sessionCompleteSet),
                                  symbol: resting ? "forward.fill" : "checkmark") {
                        withAnimation(.snappy) {
                            if resting { restRemaining = 0 } else { nextSet() }
                        }
                    }
                    .disabled(!running)
                    .glassEffectID("primary", in: controls)
                }
            }
        }
        .padding(.horizontal, 16).padding(.bottom, 8)
        .frame(maxWidth: 620)
    }

    private func nextSet() {
        if currentSet < exercise.sets { currentSet += 1; restRemaining = Self.restSeconds }
        else if index < workout.exercises.count - 1 { index += 1; currentSet = 1; restRemaining = Self.restSeconds }
        else { store.completeWorkout(workout); finished = true; running = false }
    }
}
