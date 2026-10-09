import SwiftUI

struct ReviewView: View {
    @Environment(AppModel.self) private var model
    let conversationId: String

    @State private var conversation: ConversationDetail?
    @State private var feedback: Feedback?
    @State private var error: String?
    @State private var scoring = false

    var body: some View {
        Group {
            if let conversation {
                content(conversation)
            } else if let error {
                ContentUnavailableView {
                    Label("Can't load this conversation", systemImage: "exclamationmark.triangle")
                } description: {
                    Text(error)
                } actions: {
                    Button("Try again") { Task { await load() } }
                }
            } else {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .navigationTitle("Review")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Done") { model.popToDashboard() }
            }
        }
        .task { await load() }
    }

    private func content(_ conversation: ConversationDetail) -> some View {
        let scenario = model.scenario(type: conversation.scenarioType)
        return List {
            Section {
                VStack(spacing: 6) {
                    Text(scenario?.name ?? conversation.scenarioType)
                        .font(.headline)
                    Text(Format.duration(conversation.duration))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    if let feedback {
                        Text("\(feedback.overallScore)")
                            .font(.system(size: 64, weight: .bold, design: .rounded))
                            .foregroundStyle(feedback.overallScore >= ProgressStore.unlockThreshold ? .green : .orange)
                        Text("overall score").foregroundStyle(.secondary)
                    } else if scoring {
                        ProgressView("Scoring your conversation…").padding(.vertical)
                    } else if conversation.messages.isEmpty {
                        Text("Nothing was said, so there's no score.").foregroundStyle(.secondary)
                    } else {
                        if let error {
                            Text(error)
                                .font(.footnote)
                                .foregroundStyle(.red)
                                .multilineTextAlignment(.center)
                        }
                        Button("Get feedback") { Task { await score(conversation) } }
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
            }

            if let feedback {
                Section("Breakdown") {
                    ForEach(Feedback.metricOrder) { metric in
                        if let value = feedback.metrics[metric.key] {
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text(metric.label)
                                    Spacer()
                                    Text("\(Int(value))").foregroundStyle(.secondary)
                                }
                                ProgressView(value: min(max(value, 0), 100), total: 100)
                            }
                        }
                    }
                }
                Section("What went well") {
                    ForEach(feedback.strengths, id: \.self) { Label($0, systemImage: "hand.thumbsup") }
                }
                Section("Try next time") {
                    ForEach(feedback.improvements, id: \.self) { Label($0, systemImage: "lightbulb") }
                }
            }

            Section("Transcript") {
                ForEach(conversation.messages) { message in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(message.isUser ? "You" : (scenario?.agentName ?? "Them"))
                            .font(.caption.bold())
                            .foregroundStyle(message.isUser ? Color.pink : Color.secondary)
                        Text(message.content)
                    }
                }
            }
        }
    }

    private func load() async {
        error = nil
        do {
            let loaded = try await model.api.conversation(id: conversationId)
            conversation = loaded
            feedback = loaded.feedback
            if loaded.feedback == nil && !loaded.messages.isEmpty {
                await score(loaded)
            }
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func score(_ conversation: ConversationDetail) async {
        scoring = true
        error = nil
        defer { scoring = false }
        do {
            let result = try await model.api.feedback(conversationId: conversation.id)
            feedback = result
            // The server may have swapped in ElevenLabs' own transcript while scoring.
            if let refreshed = try? await model.api.conversation(id: conversation.id) {
                self.conversation = refreshed
            }
            if let scenario = model.scenario(type: conversation.scenarioType) {
                model.progress.record(
                    level: scenario.level,
                    score: result.overallScore,
                    totalLevels: model.progressionScenarios.count
                )
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}
