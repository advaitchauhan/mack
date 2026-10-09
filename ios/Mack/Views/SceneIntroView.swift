import SwiftUI

/// Mirrors components/scene-intro.tsx: narrative lines appear one by one, then a 5-second countdown.
struct SceneIntroView: View {
    @Environment(AppModel.self) private var model
    let scenario: Scenario

    @State private var visibleLines = 0
    @State private var phase: Phase = .narrative
    @State private var countdown = 5
    @State private var showingTips = false

    enum Phase { case narrative, countdown }

    var body: some View {
        VStack(spacing: 24) {
            AvatarView(url: scenario.avatarURL(baseURL: model.settings.serverURL), size: 96)
                .padding(.top, 24)

            switch phase {
            case .narrative:
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        ForEach(Array(scenario.sceneNarrative.prefix(visibleLines).enumerated()), id: \.offset) { _, line in
                            Text(line)
                                .font(.title3)
                                .transition(.opacity.combined(with: .move(edge: .bottom)))
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 24)
                }
                Spacer(minLength: 0)
                HStack {
                    Button("Tips") { showingTips = true }
                        .buttonStyle(.bordered)
                    Spacer()
                    Button("I'm ready") { startCountdown() }
                        .buttonStyle(.borderedProminent)
                }
                .padding(24)

            case .countdown:
                Spacer()
                Text("Starting in")
                    .font(.headline)
                    .foregroundStyle(.secondary)
                Text("\(countdown)")
                    .font(.system(size: 96, weight: .bold, design: .rounded))
                    .contentTransition(.numericText(countdown: true))
                Text("You speak first. Say hi to \(scenario.agentName).")
                    .foregroundStyle(.secondary)
                Spacer()
                Button("Start now") { model.replaceTop(with: .conversation(scenario)) }
                    .padding(.bottom, 24)
            }
        }
        .navigationTitle(scenario.name)
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingTips) {
            TipsView(tips: scenario.tips)
        }
        .task(id: phase) {
            switch phase {
            case .narrative:
                await revealNarrative()
            case .countdown:
                await runCountdown()
            }
        }
    }

    private func revealNarrative() async {
        while visibleLines < scenario.sceneNarrative.count {
            try? await Task.sleep(for: .seconds(visibleLines == 0 ? 0.4 : 2.2))
            if Task.isCancelled { return }
            withAnimation(.easeOut(duration: 0.5)) { visibleLines += 1 }
        }
    }

    private func startCountdown() {
        visibleLines = scenario.sceneNarrative.count
        phase = .countdown
    }

    private func runCountdown() async {
        while countdown > 0 {
            try? await Task.sleep(for: .seconds(1))
            if Task.isCancelled { return }
            withAnimation { countdown -= 1 }
        }
        model.replaceTop(with: .conversation(scenario))
    }
}

struct TipsView: View {
    let tips: Scenario.Tips
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section("Opening lines") {
                    ForEach(tips.openingLines, id: \.self) { Text("“\($0)”") }
                }
                Section("Do") {
                    ForEach(tips.doList, id: \.self) { Label($0, systemImage: "checkmark").foregroundStyle(.primary) }
                }
                Section("Don't") {
                    ForEach(tips.dontList, id: \.self) { Label($0, systemImage: "xmark") }
                }
            }
            .navigationTitle("Tips")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } }
            }
        }
    }
}
