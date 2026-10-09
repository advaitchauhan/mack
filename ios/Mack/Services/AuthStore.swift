import Foundation
import Observation
import Security

/// Supabase email sign-in with a 6-digit code, over Supabase's REST auth API.
/// Sign in with Apple joins this once there is an Apple Developer account.
@MainActor
@Observable
final class AuthStore {
    struct Session: Codable {
        var accessToken: String
        var refreshToken: String
        var expiresAt: Date
        var email: String?
    }

    private(set) var session: Session?
    var isSignedIn: Bool { session != nil }

    private var config: SupabaseConfig?
    private var refreshTask: Task<Session, Error>?

    init() {
        session = Keychain.load(Session.self, key: "mack.session")
    }

    // MARK: Sign-in flow

    func sendCode(to email: String, serverURL: URL) async throws {
        let config = try await loadConfig(serverURL: serverURL)
        _ = try await post(config, "/auth/v1/otp", body: OTPBody(email: email, create_user: true))
    }

    func verify(email: String, code: String, serverURL: URL) async throws {
        let config = try await loadConfig(serverURL: serverURL)
        let data = try await post(config, "/auth/v1/verify", body: VerifyBody(type: "email", email: email, token: code))
        store(try JSONDecoder().decode(TokenResponse.self, from: data))
    }

    func signOut() {
        session = nil
        refreshTask = nil
        Keychain.delete(key: "mack.session")
    }

    /// A valid access token for API calls, refreshed when it is about to expire.
    func validAccessToken(serverURL: URL) async throws -> String? {
        guard let session else { return nil }
        if session.expiresAt.timeIntervalSinceNow > 60 {
            return session.accessToken
        }
        if let refreshTask {
            return try await refreshTask.value.accessToken
        }
        // Loaded outside the refresh so an unreachable Mack server doesn't sign the user out.
        let config = try await loadConfig(serverURL: serverURL)
        if let refreshTask {
            return try await refreshTask.value.accessToken
        }
        let task = Task { () throws -> Session in
            let data = try await post(
                config, "/auth/v1/token?grant_type=refresh_token",
                body: RefreshBody(refresh_token: session.refreshToken)
            )
            return store(try JSONDecoder().decode(TokenResponse.self, from: data))
        }
        refreshTask = task
        defer { refreshTask = nil }
        do {
            return try await task.value.accessToken
        } catch let error as URLError {
            // Offline or Supabase unreachable: keep the session and let the caller retry.
            throw APIError(message: "Couldn't refresh your session: \(error.localizedDescription)")
        } catch {
            signOut()
            throw APIError(message: "Your session expired. Please sign in again.")
        }
    }

    // MARK: Supabase REST

    private struct OTPBody: Encodable { let email: String; let create_user: Bool }
    private struct VerifyBody: Encodable { let type: String; let email: String; let token: String }
    private struct RefreshBody: Encodable { let refresh_token: String }
    private struct AuthError: Decodable { let msg: String?; let error_description: String?; let message: String? }

    private struct TokenResponse: Decodable {
        struct User: Decodable { let email: String? }
        let access_token: String
        let refresh_token: String
        let expires_in: Double
        let user: User?
    }

    @discardableResult
    private func store(_ response: TokenResponse) -> Session {
        let session = Session(
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            expiresAt: Date().addingTimeInterval(response.expires_in),
            email: response.user?.email
        )
        self.session = session
        Keychain.save(session, key: "mack.session")
        return session
    }

    private func loadConfig(serverURL: URL) async throws -> SupabaseConfig {
        if let config { return config }
        let loaded = try await APIClient(baseURL: serverURL).appConfig()
        config = loaded
        return loaded
    }

    private func post<Body: Encodable>(_ config: SupabaseConfig, _ path: String, body: Body) async throws -> Data {
        guard let url = URL(string: config.supabaseUrl + path) else {
            throw APIError(message: "Invalid Supabase URL")
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200..<300).contains(status) else {
            let error = try? JSONDecoder().decode(AuthError.self, from: data)
            throw APIError(message: error?.msg ?? error?.error_description ?? error?.message ?? "Sign-in failed (\(status))")
        }
        return data
    }
}

enum Keychain {
    static func save<T: Encodable>(_ value: T, key: String) {
        guard let data = try? JSONEncoder().encode(value) else { return }
        delete(key: key)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock,
        ]
        SecItemAdd(query as CFDictionary, nil)
    }

    static func load<T: Decodable>(_ type: T.Type, key: String) -> T? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var result: AnyObject?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else { return nil }
        return try? JSONDecoder().decode(type, from: data)
    }

    static func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
        ]
        SecItemDelete(query as CFDictionary)
    }
}
