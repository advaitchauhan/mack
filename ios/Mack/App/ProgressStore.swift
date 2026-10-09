import Foundation
import Observation

/// Linear level progression, mirroring useUserProgress() in the web app (components/level-select.tsx).
/// Stored on the device for now; moves to the server once accounts exist.
@Observable
final class ProgressStore {
    static let unlockThreshold = 60
    private static let storageKey = "mack.progress"

    struct LevelProgress: Codable {
        var completed: Bool
        var bestScore: Int?
    }

    struct State: Codable {
        var currentLevel: Int = 1
        var levels: [Int: LevelProgress] = [:]
    }

    private(set) var state: State {
        didSet { save() }
    }

    init() {
        if let data = UserDefaults.standard.data(forKey: Self.storageKey),
           let saved = try? JSONDecoder().decode(State.self, from: data) {
            state = saved
        } else {
            state = State()
        }
    }

    func isUnlocked(level: Int) -> Bool { level <= state.currentLevel }
    func isCompleted(level: Int) -> Bool { state.levels[level]?.completed ?? false }
    func bestScore(level: Int) -> Int? { state.levels[level]?.bestScore }

    func record(level: Int, score: Int, totalLevels: Int) {
        guard level > 0 else { return }
        var entry = state.levels[level] ?? LevelProgress(completed: false, bestScore: nil)
        if entry.bestScore.map({ score > $0 }) ?? true {
            entry.bestScore = score
        }
        var next = state
        if score >= Self.unlockThreshold {
            entry.completed = true
            if level == next.currentLevel && level < totalLevels {
                next.currentLevel = level + 1
            }
        }
        next.levels[level] = entry
        state = next
    }

    func reset() {
        state = State()
    }

    private func save() {
        if let data = try? JSONEncoder().encode(state) {
            UserDefaults.standard.set(data, forKey: Self.storageKey)
        }
    }
}
