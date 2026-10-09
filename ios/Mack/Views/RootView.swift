import SwiftUI

struct RootView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        if model.auth.isSignedIn || model.settings.skipSignIn {
            signedIn
        } else {
            SignInView()
        }
    }

    private var signedIn: some View {
        @Bindable var model = model
        return NavigationStack(path: $model.path) {
            DashboardView()
                .navigationDestination(for: Route.self) { route in
                    switch route {
                    case .intro(let scenario):
                        SceneIntroView(scenario: scenario)
                    case .conversation(let scenario):
                        ConversationView(scenario: scenario)
                    case .review(let id):
                        ReviewView(conversationId: id)
                    }
                }
        }
        .tint(.pink)
        .task {
            if self.model.scenarios.isEmpty {
                await self.model.loadScenarios()
            }
        }
    }
}
