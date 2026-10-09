import SwiftUI
import UIKit

struct ConversationView: View {
    @Environment(AppModel.self) private var model
    let scenario: Scenario

    @StateObject private var live: LiveConversation
    @State private var saveError: String?
    @State private var isSaving = false

    init(scenario: Scenario) {
        self.scenario = scenario
        _live = StateObject(wrappedValue: LiveConversation(scenario: scenario))
    }

    var body: some View {
        VStack(spacing: 16) {
            header

            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 10) {
                        ForEach(live.messages) { message in
                            CaptionBubble(message: message, agentName: live.agentName)
                                .id(message.id)
                        }
                    }
                    .padding(.horizontal)
                }
                .onChange(of: live.messages.last?.content) {
                    if let last = live.messages.last {
                        withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                    }
                }
            }

            footer
        }
        .navigationTitle(scenario.name)
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(live.status == .connected || isSaving)
        .task { await live.start(api: model.api) }
        .onAppear { UIApplication.shared.isIdleTimerDisabled = true }
        .onDisappear {
            UIApplication.shared.isIdleTimerDisabled = false
            if live.status == .connected || live.status == .connecting {
                Task { _ = await live.stop() }
            }
        }
        .onChange(of: live.endedRemotely) {
            if live.endedRemotely { Task { await finish() } }
        }
    }

    private var header: some View {
        VStack(spacing: 6) {
            AvatarView(url: scenario.avatarURL(baseURL: model.settings.serverURL), size: 88)
                .overlay(
                    Circle()
                        .stroke(Color.pink, lineWidth: live.agentIsSpeaking ? 4 : 0)
                        .animation(.easeInOut(duration: 0.3), value: live.agentIsSpeaking)
                )
                .padding(.top, 12)
            Text(live.agentName).font(.title2.bold())
            Text(statusText)
                .font(.subheadline.monospacedDigit())
                .foregroundStyle(.secondary)
        }
    }

    @ViewBuilder
    private var footer: some View {
        if case .failed(let message) = live.status {
            VStack(spacing: 12) {
                Text(message)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.red)
                Button("Try again") { Task { await live.start(api: model.api) } }
                    .buttonStyle(.borderedProminent)
            }
            .padding()
        } else if let saveError {
            VStack(spacing: 12) {
                Text(saveError)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.red)
                Button("Back to dashboard") { model.popToDashboard() }
            }
            .padding()
        } else {
            Button(role: .destructive) {
                Task { await finish() }
            } label: {
                Group {
                    if isSaving {
                        ProgressView()
                    } else {
                        Text("End conversation")
                    }
                }
                .frame(maxWidth: .infinity, minHeight: 32)
            }
            .buttonStyle(.borderedProminent)
            .tint(.red)
            .disabled(live.status != .connected || isSaving)
            .padding(.horizontal, 24)
            .padding(.bottom, 16)
        }
    }

    private var statusText: String {
        switch live.status {
        case .idle, .connecting: return "Connecting…"
        case .connected:
            let state = live.agentIsSpeaking ? "Speaking" : "Listening"
            return "\(Format.duration(live.elapsed)) · \(state)"
        case .ending: return "Saving…"
        case .failed: return "Couldn't connect"
        }
    }

    private func finish() async {
        guard !isSaving else { return }
        isSaving = true
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()

        let result = await live.stop()
        guard let id = result.conversationId else {
            model.popToDashboard()
            return
        }

        do {
            try await model.api.finishConversation(
                id: id,
                endedAt: Date(),
                duration: result.duration,
                messages: result.messages
            )
            if result.messages.isEmpty {
                // Nothing was said, so there is nothing to score.
                model.popToDashboard()
            } else {
                model.replaceTop(with: .review(conversationId: id))
            }
        } catch {
            saveError = "Couldn't save the conversation: \(error.localizedDescription)"
            isSaving = false
        }
    }
}

private struct CaptionBubble: View {
    let message: LiveMessage
    let agentName: String

    var body: some View {
        HStack {
            if message.isUser { Spacer(minLength: 40) }
            VStack(alignment: message.isUser ? .trailing : .leading, spacing: 2) {
                Text(message.isUser ? "You" : agentName)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(message.content)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(
                        message.isUser ? Color.pink.opacity(0.15) : Color.secondary.opacity(0.12),
                        in: RoundedRectangle(cornerRadius: 14)
                    )
            }
            if !message.isUser { Spacer(minLength: 40) }
        }
    }
}
