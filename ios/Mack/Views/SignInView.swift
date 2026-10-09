import SwiftUI

/// Email sign-in with a 6-digit code. Sign in with Apple is added once there is an Apple Developer account.
struct SignInView: View {
    @Environment(AppModel.self) private var model
    @State private var email = ""
    @State private var code = ""
    @State private var codeSent = false
    @State private var working = false
    @State private var error: String?
    @State private var showingSettings = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Mack").font(.largeTitle.bold())
                        Text("Practice real conversations. Build real confidence.")
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 8)
                }

                Section {
                    TextField("you@example.com", text: $email)
                        .keyboardType(.emailAddress)
                        .textContentType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .disabled(codeSent)

                    if codeSent {
                        TextField("6-digit code", text: $code)
                            .keyboardType(.numberPad)
                            .textContentType(.oneTimeCode)
                    }
                } header: {
                    Text("Sign in with email")
                } footer: {
                    if codeSent {
                        Text("We emailed a code to \(email).")
                    }
                }

                Section {
                    Button {
                        Task { await submit() }
                    } label: {
                        HStack {
                            Text(codeSent ? "Sign in" : "Email me a code")
                            if working {
                                Spacer()
                                ProgressView()
                            }
                        }
                    }
                    .disabled(working || !canSubmit)

                    if codeSent {
                        Button("Use a different email") {
                            codeSent = false
                            code = ""
                            error = nil
                        }
                    }
                }

                Section {
                    Button("Skip sign-in (local testing)") {
                        model.settings.skipSignIn = true
                    }
                } footer: {
                    Text("For a local server started with DEV_USER_ID in frontend/.env.local.")
                }

                if let error {
                    Section {
                        Text(error).foregroundStyle(.red)
                    }
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingSettings = true
                    } label: {
                        Image(systemName: "gearshape")
                    }
                    .accessibilityLabel("Server settings")
                }
            }
            .sheet(isPresented: $showingSettings) {
                SettingsView().environment(model)
            }
        }
    }

    private var trimmedEmail: String {
        email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }

    private var canSubmit: Bool {
        codeSent ? code.trimmingCharacters(in: .whitespaces).count >= 6 : trimmedEmail.contains("@")
    }

    private func submit() async {
        working = true
        error = nil
        defer { working = false }
        do {
            if codeSent {
                try await model.auth.verify(
                    email: trimmedEmail,
                    code: code.trimmingCharacters(in: .whitespaces),
                    serverURL: model.settings.serverURL
                )
            } else {
                try await model.auth.sendCode(to: trimmedEmail, serverURL: model.settings.serverURL)
                codeSent = true
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}
