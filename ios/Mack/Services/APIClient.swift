import Foundation

struct APIError: LocalizedError {
    let message: String
    var errorDescription: String? { message }
}

/// Talks to the Mack Next.js API (frontend/app/api).
struct APIClient: Sendable {
    let baseURL: URL
    /// Supplies the signed-in user's Supabase access token, sent as a Bearer token.
    var accessToken: (@Sendable () async throws -> String?)? = nil

    private var decoder: JSONDecoder { JSONDecoder() }

    // MARK: Config

    func appConfig() async throws -> SupabaseConfig {
        try await send("GET", "/api/app-config")
    }

    // MARK: Scenarios

    func fetchScenarios() async throws -> [Scenario] {
        struct Response: Decodable { let scenarios: [Scenario] }
        let response: Response = try await send("GET", "/api/scenarios")
        return response.scenarios
    }

    // MARK: Live session

    /// Creates the conversation on the server and returns an ElevenLabs token for the scenario's agent.
    func conversationToken(scenarioType: String) async throws -> ConversationToken {
        try await send("POST", "/api/elevenlabs/conversation-token", body: ["scenarioType": scenarioType])
    }

    /// Links the call to ElevenLabs' post-call webhook, which saves the server-side transcript.
    func linkElevenLabsConversation(id: String, elevenLabsConversationId: String) async throws {
        let _: ConversationDetail = try await send(
            "PUT", "/api/conversations/\(id)",
            body: ["elevenLabsConversationId": elevenLabsConversationId]
        )
    }

    // MARK: Conversations

    func listConversations() async throws -> [ConversationSummary] {
        struct Response: Decodable { let conversations: [ConversationSummary] }
        let response: Response = try await send("GET", "/api/conversations")
        return response.conversations
    }

    func conversation(id: String) async throws -> ConversationDetail {
        try await send("GET", "/api/conversations/\(id)")
    }

    /// Saves the end time, duration and the app's transcript (the server keeps ElevenLabs' own if it arrived first).
    func finishConversation(id: String, endedAt: Date, duration: Int, messages: [LiveMessage]) async throws {
        struct MessageBody: Encodable { let speaker: String; let content: String; let timestamp: Int }
        struct UpdateBody: Encodable { let endedAt: String; let duration: Int; let messages: [MessageBody] }
        let update = UpdateBody(
            endedAt: Format.iso8601(endedAt),
            duration: duration,
            messages: messages.map { MessageBody(speaker: $0.isUser ? "user" : "ai", content: $0.content, timestamp: $0.timestamp) }
        )
        let _: ConversationDetail = try await send("PUT", "/api/conversations/\(id)", body: update)
    }

    /// Returns existing feedback or has the server generate it from the saved transcript.
    func feedback(conversationId: String) async throws -> Feedback {
        try await send("POST", "/api/feedback", body: ["conversationId": conversationId], timeout: 120)
    }

    // MARK: Plumbing

    private struct Empty: Encodable {}
    private struct ServerError: Decodable { let error: String }

    private func send<Response: Decodable>(_ method: String, _ path: String) async throws -> Response {
        try await send(method, path, body: Optional<Empty>.none)
    }

    private func send<Response: Decodable, Body: Encodable>(_ method: String, _ path: String, body: Body?, timeout: TimeInterval = 60) async throws -> Response {
        guard let url = URL(string: path, relativeTo: baseURL) else {
            throw APIError(message: "Invalid server URL: \(baseURL.absoluteString)")
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = timeout
        if let accessToken, let token = try await accessToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(body)
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw APIError(message: "Can't reach the Mack server at \(baseURL.absoluteString). Is `pnpm dev` running? (\(error.localizedDescription))")
        }

        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            let message = (try? decoder.decode(ServerError.self, from: data))?.error ?? "Server returned \(status)"
            throw APIError(message: message)
        }

        do {
            return try decoder.decode(Response.self, from: data)
        } catch {
            throw APIError(message: "Unexpected response from \(path): \(error.localizedDescription)")
        }
    }
}
