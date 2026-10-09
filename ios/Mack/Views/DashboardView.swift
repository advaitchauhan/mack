import SwiftUI

struct DashboardView: View {
    @Environment(AppModel.self) private var model
    @State private var tab: Tab = .practice
    @State private var showingSettings = false

    enum Tab: String, CaseIterable {
        case practice = "Practice"
        case history = "History"
    }

    var body: some View {
        VStack(spacing: 0) {
            Picker("Section", selection: $tab) {
                ForEach(Tab.allCases, id: \.self) { Text($0.rawValue).tag($0) }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .padding(.bottom, 8)

            switch tab {
            case .practice:
                PracticeList()
            case .history:
                HistoryList()
            }
        }
        .navigationTitle("Mack")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showingSettings = true
                } label: {
                    Image(systemName: "gearshape")
                }
                .accessibilityLabel("Settings")
            }
        }
        .sheet(isPresented: $showingSettings) {
            SettingsView()
                .environment(model)
        }
    }
}

private struct PracticeList: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        Group {
            if model.isLoadingScenarios && model.scenarios.isEmpty {
                ProgressView("Loading scenarios")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let error = model.scenariosError, model.scenarios.isEmpty {
                ContentUnavailableView {
                    Label("Can't load scenarios", systemImage: "wifi.exclamationmark")
                } description: {
                    Text(error)
                } actions: {
                    Button("Try again") { Task { await model.loadScenarios() } }
                }
            } else {
                List {
                    Section {
                        ForEach(model.progressionScenarios) { scenario in
                            let unlocked = model.progress.isUnlocked(level: scenario.level)
                            Button {
                                model.path.append(.intro(scenario))
                            } label: {
                                ScenarioRow(
                                    scenario: scenario,
                                    subtitle: "Level \(scenario.level)",
                                    locked: !unlocked,
                                    completed: model.progress.isCompleted(level: scenario.level),
                                    bestScore: model.progress.bestScore(level: scenario.level)
                                )
                            }
                            .disabled(!unlocked)
                        }
                    } header: {
                        Text("Levels")
                    } footer: {
                        Text("Score \(ProgressStore.unlockThreshold)+ to unlock the next level.")
                    }

                    if !model.bonusScenarios.isEmpty {
                        Section {
                            ForEach(model.bonusScenarios) { scenario in
                                Button {
                                    model.path.append(.intro(scenario))
                                } label: {
                                    ScenarioRow(
                                        scenario: scenario,
                                        subtitle: scenario.difficulty.capitalized,
                                        locked: !model.bonusUnlocked,
                                        completed: false,
                                        bestScore: nil
                                    )
                                }
                                .disabled(!model.bonusUnlocked)
                            }
                        } header: {
                            Text("Bonus")
                        } footer: {
                            if !model.bonusUnlocked {
                                Text("Finish every level to unlock bonus scenarios.")
                            }
                        }
                    }
                }
                .refreshable { await model.loadScenarios() }
            }
        }
    }
}

private struct ScenarioRow: View {
    @Environment(AppModel.self) private var model
    let scenario: Scenario
    let subtitle: String
    let locked: Bool
    let completed: Bool
    let bestScore: Int?

    var body: some View {
        HStack(spacing: 12) {
            AvatarView(url: scenario.avatarURL(baseURL: model.settings.serverURL), size: 52)
                .opacity(locked ? 0.4 : 1)

            VStack(alignment: .leading, spacing: 2) {
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(scenario.name)
                    .font(.headline)
                    .foregroundStyle(locked ? .secondary : .primary)
                Text(scenario.description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }

            Spacer()

            if locked {
                Image(systemName: "lock.fill").foregroundStyle(.secondary)
            } else if completed {
                VStack(spacing: 2) {
                    Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
                    if let bestScore {
                        Text("\(bestScore)").font(.caption2).foregroundStyle(.secondary)
                    }
                }
            } else {
                Image(systemName: "chevron.right").foregroundStyle(.tertiary)
            }
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
    }
}

struct AvatarView: View {
    let url: URL?
    let size: CGFloat

    var body: some View {
        AsyncImage(url: url) { image in
            image.resizable().scaledToFill()
        } placeholder: {
            Image(systemName: "person.crop.circle.fill")
                .resizable()
                .foregroundStyle(.quaternary)
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
    }
}
