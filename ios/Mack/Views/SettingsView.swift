import SwiftUI

struct SettingsView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss
    @State private var confirmingReset = false

    var body: some View {
        @Bindable var settings = model.settings
        NavigationStack {
            Form {
                Section {
                    TextField("Server URL", text: $settings.serverURLString)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    Button("Use localhost") {
                        settings.serverURLString = AppSettings.defaultServerURL
                    }
                } header: {
                    Text("Server")
                } footer: {
                    Text("The Simulator can use http://localhost:3000. On an iPhone, use your Mac's Wi-Fi IP, e.g. http://192.168.1.20:3000, and run the web app with `pnpm dev -H 0.0.0.0`.")
                }

                if model.settings.skipSignIn && !model.auth.isSignedIn {
                    Section("Account") {
                        Text("Not signed in (local testing)")
                        Button("Sign in") {
                            dismiss()
                            model.popToDashboard()
                            model.settings.skipSignIn = false
                        }
                    }
                }

                if model.auth.isSignedIn {
                    Section("Account") {
                        if let email = model.auth.session?.email {
                            LabeledContent("Signed in as", value: email)
                        }
                        Button("Sign out", role: .destructive) {
                            dismiss()
                            model.popToDashboard()
                            model.auth.signOut()
                            model.settings.skipSignIn = false
                        }
                    }
                }

                Section {
                    Button("Reset level progress", role: .destructive) {
                        confirmingReset = true
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                        Task { await model.loadScenarios() }
                    }
                }
            }
            .confirmationDialog("Reset all level progress on this device?", isPresented: $confirmingReset, titleVisibility: .visible) {
                Button("Reset", role: .destructive) { model.progress.reset() }
            }
        }
    }
}
