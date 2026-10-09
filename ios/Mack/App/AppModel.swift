import Foundation
import Observation

enum Route: Hashable {
    case intro(Scenario)
    case conversation(Scenario)
    case review(conversationId: String)
}

@MainActor
@Observable
final class AppModel {
    var path: [Route] = []
    var scenarios: [Scenario] = []
    var isLoadingScenarios = false
    var scenariosError: String?

    let settings = AppSettings()
    let progress = ProgressStore()
    let auth = AuthStore()

    var api: APIClient {
        let auth = auth
        let serverURL = settings.serverURL
        return APIClient(baseURL: serverURL, accessToken: {
            try await auth.validAccessToken(serverURL: serverURL)
        })
    }

    var progressionScenarios: [Scenario] {
        scenarios.filter { $0.level > 0 }.sorted { $0.level < $1.level }
    }

    var bonusScenarios: [Scenario] {
        scenarios.filter { $0.level == 0 }.sorted { $0.name < $1.name }
    }

    var bonusUnlocked: Bool {
        let levels = progressionScenarios.map(\.level)
        return !levels.isEmpty && levels.allSatisfy { progress.isCompleted(level: $0) }
    }

    func scenario(type: String) -> Scenario? {
        scenarios.first { $0.type == type }
    }

    func loadScenarios() async {
        isLoadingScenarios = true
        scenariosError = nil
        do {
            scenarios = try await api.fetchScenarios()
        } catch {
            scenariosError = error.localizedDescription
        }
        isLoadingScenarios = false
    }

    /// Replaces the current screen, e.g. intro -> conversation -> review, so Back goes to the dashboard.
    func replaceTop(with route: Route) {
        if !path.isEmpty { path.removeLast() }
        path.append(route)
    }

    func popToDashboard() {
        path.removeAll()
    }
}
