import SwiftUI

struct HistoryList: View {
    @Environment(AppModel.self) private var model
    @State private var conversations: [ConversationSummary] = []
    @State private var error: String?
    @State private var loaded = false

    var body: some View {
        Group {
            if !loaded {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let error, conversations.isEmpty {
                ContentUnavailableView {
                    Label("Can't load history", systemImage: "wifi.exclamationmark")
                } description: {
                    Text(error)
                } actions: {
                    Button("Try again") { Task { await load() } }
                }
            } else if conversations.isEmpty {
                ContentUnavailableView(
                    "No conversations yet",
                    systemImage: "bubble.left.and.bubble.right",
                    description: Text("Finished practice sessions show up here.")
                )
            } else {
                List(conversations) { conversation in
                    Button {
                        model.path.append(.review(conversationId: conversation.id))
                    } label: {
                        row(conversation)
                    }
                }
                .refreshable { await load() }
            }
        }
        .task { await load() }
    }

    private func row(_ conversation: ConversationSummary) -> some View {
        let scenario = model.scenario(type: conversation.scenarioType)
        return HStack(spacing: 12) {
            AvatarView(url: scenario?.avatarURL(baseURL: model.settings.serverURL), size: 40)
            VStack(alignment: .leading, spacing: 2) {
                Text(scenario?.name ?? conversation.scenarioType).font(.headline)
                HStack(spacing: 6) {
                    if let date = Format.date(conversation.startedAt) {
                        Text(date, format: .dateTime.month().day().hour().minute())
                    }
                    Text("·")
                    Text(Format.duration(conversation.duration))
                }
                .font(.subheadline)
                .foregroundStyle(.secondary)
            }
            Spacer()
            if let score = conversation.feedback?.overallScore {
                Text("\(score)")
                    .font(.title3.bold())
                    .foregroundStyle(score >= ProgressStore.unlockThreshold ? .green : .orange)
            }
        }
        .contentShape(Rectangle())
    }

    private func load() async {
        do {
            conversations = try await model.api.listConversations()
            error = nil
        } catch {
            self.error = error.localizedDescription
        }
        loaded = true
    }
}
