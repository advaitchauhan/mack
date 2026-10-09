import Foundation

struct Scenario: Codable, Hashable, Identifiable {
    struct Tips: Codable, Hashable {
        let openingLines: [String]
        let doList: [String]
        let dontList: [String]
    }

    let type: String
    let name: String
    let avatar: String
    let description: String
    let difficulty: String
    let duration: String
    let level: Int
    let sceneNarrative: [String]
    let tips: Tips
    let agentName: String

    var id: String { type }

    /// Avatar paths are relative to the web app's public/ folder.
    func avatarURL(baseURL: URL) -> URL? {
        URL(string: avatar, relativeTo: baseURL)?.absoluteURL
    }
}

struct TranscriptMessage: Codable, Hashable, Identifiable {
    let id: String
    let speaker: String // "user" or "ai"
    let content: String
    let timestamp: Int // seconds from conversation start

    var isUser: Bool { speaker == "user" }
}

struct Feedback: Codable, Hashable {
    let overallScore: Int
    let strengths: [String]
    let improvements: [String]
    let metrics: [String: Double]

    struct Metric: Identifiable {
        let key: String
        let label: String
        var id: String { key }
    }

    static let metricOrder: [Metric] = [
        Metric(key: "initiation", label: "Initiation"),
        Metric(key: "authenticity", label: "Authenticity"),
        Metric(key: "activeListening", label: "Active listening"),
        Metric(key: "engagement", label: "Engagement"),
        Metric(key: "respectfulness", label: "Respectfulness"),
    ]
}

struct ConversationSummary: Codable, Hashable, Identifiable {
    struct ScoreOnly: Codable, Hashable {
        let overallScore: Int
    }

    let id: String
    let scenarioType: String
    let duration: Int
    let startedAt: String
    let feedback: ScoreOnly?
}

struct ConversationDetail: Codable, Hashable, Identifiable {
    let id: String
    let scenarioType: String
    let duration: Int
    let startedAt: String
    let messages: [TranscriptMessage]
    let feedback: Feedback?
}

struct ConversationToken: Codable {
    let token: String
    let conversationId: String
    let agentName: String
}

/// Public Supabase settings served by GET /api/app-config.
struct SupabaseConfig: Codable, Sendable {
    let supabaseUrl: String
    let supabaseAnonKey: String
}

/// A message captured during a live call, before it is saved.
struct LiveMessage: Identifiable, Hashable {
    let id: String
    let isUser: Bool
    let content: String
    let timestamp: Int
}

enum Format {
    static func duration(_ seconds: Int) -> String {
        String(format: "%d:%02d", seconds / 60, seconds % 60)
    }

    private static let isoFractional: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    private static let iso = ISO8601DateFormatter()

    static func date(_ iso8601: String) -> Date? {
        isoFractional.date(from: iso8601) ?? iso.date(from: iso8601)
    }

    static func iso8601(_ date: Date) -> String {
        isoFractional.string(from: date)
    }
}
