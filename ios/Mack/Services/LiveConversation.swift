import AVFoundation
import Combine
import ElevenLabs
import Foundation

/// Runs one live voice conversation with the scenario's ElevenLabs agent.
@MainActor
final class LiveConversation: ObservableObject {
    enum Status: Equatable {
        case idle
        case connecting
        case connected
        case ending
        case failed(String)
    }

    @Published private(set) var status: Status = .idle
    @Published private(set) var messages: [LiveMessage] = []
    @Published private(set) var agentIsSpeaking = false
    @Published private(set) var elapsed = 0
    @Published private(set) var agentName: String

    /// Set when the agent hangs up or the connection drops, so the screen can finish on its own.
    @Published private(set) var endedRemotely = false

    let scenario: Scenario
    private(set) var startedAt: Date?
    /// The Mack conversation the server created for this call.
    private(set) var conversationId: String?

    private var api: APIClient?
    private var linkedElevenLabsId = false

    private var conversation: Conversation?
    private var cancellables = Set<AnyCancellable>()
    private var timer: Timer?

    init(scenario: Scenario) {
        self.scenario = scenario
        self.agentName = scenario.agentName
    }

    func start(api: APIClient) async {
        guard status == .idle || isFailed else { return }
        status = .connecting

        // A retry after a dropped call: tear down the previous session first.
        cancellables.removeAll()
        if let previous = conversation {
            conversation = nil
            await previous.endConversation()
        }

        guard await AVAudioApplication.requestRecordPermission() else {
            status = .failed("Mack needs the microphone for live conversations. Turn it on in Settings > Privacy > Microphone.")
            return
        }

        do {
            self.api = api
            let session = try await api.conversationToken(scenarioType: scenario.type)
            agentName = session.agentName
            conversationId = session.conversationId
            linkedElevenLabsId = false

            // The prompt and voice live on the scenario's agent, so no overrides are sent.
            let conversation = try await ElevenLabs.startConversation(
                conversationToken: session.token,
                config: ConversationConfig()
            )
            self.conversation = conversation
            observe(conversation)
        } catch {
            status = .failed(error.localizedDescription)
        }
    }

    /// Ends the call. Returns the transcript and timing to save.
    func stop() async -> (conversationId: String?, messages: [LiveMessage], startedAt: Date, duration: Int) {
        status = .ending
        timer?.invalidate()
        timer = nil
        if let conversation {
            await conversation.endConversation()
        }
        cancellables.removeAll()
        conversation = nil
        return (conversationId, messages, startedAt ?? Date(), elapsed)
    }

    private var isFailed: Bool {
        if case .failed = status { return true }
        return false
    }

    private func observe(_ conversation: Conversation) {
        conversation.$state
            .receive(on: DispatchQueue.main)
            .sink { [weak self] state in
                self?.handle(state)
            }
            .store(in: &cancellables)

        conversation.$messages
            .receive(on: DispatchQueue.main)
            .sink { [weak self] messages in
                self?.update(messages)
            }
            .store(in: &cancellables)

        conversation.$conversationMetadata
            .receive(on: DispatchQueue.main)
            .sink { [weak self] metadata in
                guard let metadata else { return }
                self?.link(elevenLabsConversationId: metadata.conversationId)
            }
            .store(in: &cancellables)

        conversation.$agentState
            .receive(on: DispatchQueue.main)
            .sink { [weak self] state in
                self?.agentIsSpeaking = (state == .speaking)
            }
            .store(in: &cancellables)
    }

    private func link(elevenLabsConversationId: String) {
        guard !linkedElevenLabsId, let api, let conversationId else { return }
        linkedElevenLabsId = true
        Task {
            do {
                try await api.linkElevenLabsConversation(id: conversationId, elevenLabsConversationId: elevenLabsConversationId)
            } catch {
                // Not fatal: the app's own transcript is saved when the call ends.
                print("Couldn't link ElevenLabs conversation: \(error)")
            }
        }
    }

    private func handle(_ state: ConversationState) {
        switch state {
        case .active:
            if status == .connecting {
                status = .connected
                startedAt = Date()
                startTimer()
            }
        case .ended:
            if status == .connected {
                endedRemotely = true
            } else if status == .connecting {
                status = .failed("The call ended before it started. Try again.")
            }
        case .error(let error):
            if status != .ending {
                status = .failed(error.localizedDescription)
            }
        case .idle, .connecting:
            break
        }
    }

    private func update(_ sdkMessages: [Message]) {
        let start = startedAt ?? Date()
        messages = sdkMessages
            .filter { !$0.content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
            .map { message in
                LiveMessage(
                    id: message.id,
                    isUser: message.role == .user,
                    content: message.content,
                    timestamp: max(0, Int(message.timestamp.timeIntervalSince(start)))
                )
            }
    }

    private func startTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor in
                guard let self, let startedAt = self.startedAt else { return }
                self.elapsed = Int(Date().timeIntervalSince(startedAt))
            }
        }
    }
}
