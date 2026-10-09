import Foundation
import Observation

/// Local developer settings. The server URL defaults to the Next.js dev server on this Mac,
/// which the iOS Simulator can reach as localhost. On a real iPhone, use the Mac's LAN IP.
@Observable
final class AppSettings {
    static let defaultServerURL = "http://localhost:3000"
    private static let serverURLKey = "mack.serverURL"
    private static let skipSignInKey = "mack.skipSignIn"

    /// Local testing without an account. Works only against a dev server with DEV_USER_ID set.
    var skipSignIn: Bool {
        didSet { UserDefaults.standard.set(skipSignIn, forKey: Self.skipSignInKey) }
    }

    var serverURLString: String {
        didSet { UserDefaults.standard.set(serverURLString, forKey: Self.serverURLKey) }
    }

    init() {
        serverURLString = UserDefaults.standard.string(forKey: Self.serverURLKey) ?? Self.defaultServerURL
        skipSignIn = UserDefaults.standard.bool(forKey: Self.skipSignInKey)
    }

    var serverURL: URL {
        let trimmed = serverURLString.trimmingCharacters(in: .whitespacesAndNewlines)
        return URL(string: trimmed) ?? URL(string: Self.defaultServerURL)!
    }
}
