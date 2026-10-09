# Mack for iOS

A native SwiftUI client for Mack. v1 covers the core loop: dashboard (levels + history),
scene intro with countdown, live voice conversation, and review with scores and transcript.
It talks to the same Next.js API as the web app (`frontend/`).

## Run it locally (no Apple Developer account needed)

Requirements: a Mac with Xcode 16 or newer, and the web app's `.env` set up as in
`frontend/.env.example` (Supabase, ElevenLabs, OpenAI, database).

1. For the quickest start, skip accounts: add `DEV_USER_ID=local-dev` to `frontend/.env.local`.
   On a non-production server every request then counts as that user.
2. Start the web app:

   ```sh
   cd frontend
   pnpm dev
   ```

   Check http://localhost:3000/api/scenarios and http://localhost:3000/api/app-config return JSON.

3. Open `ios/Mack.xcodeproj` in Xcode. The first open fetches the ElevenLabs Swift SDK
   (and LiveKit) through Swift Package Manager; wait for "Resolving packages" to finish.
4. Pick an iPhone simulator (e.g. iPhone 16) in the toolbar and press Run (⌘R).
5. Tap **Skip sign-in (local testing)**. Allow microphone access when asked; the Simulator uses
   your Mac's microphone.

To try real accounts instead, sign in with your email and the 6-digit code Supabase sends. That needs a
one-time Supabase setting: Authentication → Emails, add `{{ .Token }}` to the **Magic Link** and
**Confirm signup** templates (for example "Your code: {{ .Token }}"). The web app's links keep working.

### On your own iPhone (optional)

1. In Xcode, Settings → Accounts, sign in with your Apple ID. Select the Mack target → Signing &
   Capabilities → Team → your "Personal Team". If the bundle ID is taken, change
   `com.advaitchauhan.mack` to something unique.
2. Run the web app so the phone can reach it: `pnpm dev -H 0.0.0.0`.
3. In the app, tap the gear icon and set the server to `http://<your-mac-ip>:3000`
   (System Settings → Wi-Fi → Details shows the IP). Phone and Mac must be on the same Wi-Fi.
4. Free provisioning expires after 7 days; run from Xcode again to refresh.

## How it fits together

- Sign-in: the app reads the public Supabase URL and anon key from `GET /api/app-config`, signs in with
  Supabase's email code flow, keeps the session in the Keychain, and sends the access token as
  `Authorization: Bearer` on every API call (`lib/auth.ts` accepts it).
- `GET /api/scenarios` lists scenarios (no prompts).
- `POST /api/elevenlabs/conversation-token` creates the conversation and returns a short-lived
  ElevenLabs token for the scenario's agent (`getAgentIdForScenario`). The app starts the voice session
  with the ElevenLabs Swift SDK over WebRTC; the API key never leaves the server, and the prompt and
  voice live on the agent.
- Once connected, the app links the ElevenLabs conversation id (`PUT /api/conversations/:id`), so the
  post-call webhook can save the server-side transcript.
- On End, the app saves duration and its own transcript (`PUT /api/conversations/:id`), and the review
  screen asks `POST /api/feedback` for scores.
- Level progress (score 60+ unlocks the next level) is stored on the device for now.

## Not in this version yet

- Sign in with Apple (needs an Apple Developer account).
- Interview practice mode.
- `Config/Info.plist` allows plain-HTTP loads for local development. Remove that before TestFlight.
