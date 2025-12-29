# Product Requirements Document (PRD)

## Product Name: Mack

### Vision
A game-like web application that helps users practice social conversations through AI-powered voice simulations, building real-world confidence in a safe, judgment-free environment.

---

## Problem Statement

Many people struggle with initiating conversations in social settings. Traditional advice (books, videos) doesn't provide the practice component needed to build real confidence. Users need a way to practice actual conversations in realistic scenarios before applying skills in the real world.

---

## Target User

- Men looking to improve their social conversation skills
- Users who want to practice approaching and talking to women
- People who learn better through practice than theory

---

## Core Features

### 1. Dashboard
**Description:** Main hub for scenario selection and progress tracking.

**Requirements:**
- Display all available practice scenarios as cards
- Show conversation history with key metrics
- Quick-start button for new practice sessions
- Visual indicators for scenario difficulty/type

### 2. Immersive Scene Introduction
**Description:** Game-like narrative experience that sets the scene before the conversation begins.

**Requirements:**
- Typewriter effect for scene description text
- Scenario-specific narrative (location, what you see, what's happening)
- Visual countdown timer (5 seconds) before conversation starts
- "You're approaching in 5, 4, 3, 2, 1..." text overlay
- Smooth transition animation to conversation mode
- Optional ambient sound effects (coffee shop noise, bar chatter, etc.)

**Example Flow:**
```
[Screen fades in]
"You walk into the coffee shop. The smell of fresh espresso fills the air."
[Pause]
"You notice a girl sitting alone at a table by the window. She's looking at her phone."
[Pause]
"You order your coffee and wait. She's still there."
[Pause]
"You decide to approach..."
[Countdown appears]
"5... 4... 3... 2... 1..."
[Transition to conversation]
```

### 3. Voice Conversation Simulation
**Description:** Real-time voice conversation with AI character.

**Requirements:**
- User initiates the conversation (speaks first)
- AI responds with natural, low-latency voice (~75ms)
- Avatar image displayed with animated indicator when AI speaks
- Microphone controls (mute/unmute)
- End conversation button
- Duration timer display
- NO live transcript (immersion)
- Visual feedback for:
  - User speaking (mic active indicator)
  - AI processing (thinking indicator)
  - AI speaking (avatar animation/pulse)

### 4. Conversation Review
**Description:** Post-conversation analysis and playback.

**Requirements:**
- Full audio recording playback with scrubbing
- Complete transcript (only shown here, not during conversation)
- AI-generated feedback including:
  - Overall connection score (0-100%)
  - Specific strengths (3-5 bullet points)
  - Areas for improvement (3-5 bullet points)
  - Detailed metrics by category
- Timestamp markers in transcript
- Download/share options

### 5. Conversation History
**Description:** Access to all past practice sessions.

**Requirements:**
- List view of all completed conversations
- Show: scenario type, date, duration, score
- Click to open full review
- Sort/filter by date, score, scenario type

---

## Scenarios (MVP)

### Coffee Shop
- **Setting:** Casual coffee shop, afternoon
- **Character:** Jessica, 26, graphic designer
- **Personality:** Friendly, vibrant, came from pilates
- **Context:** Waiting for a friend who's running late
- **Mood:** Open to conversation, not overly eager

### Bar Setting
- **Setting:** Trendy bar, evening
- **Character:** Jessica, 28, marketing professional
- **Personality:** Social, confident, outgoing
- **Context:** Friends stepped away momentarily
- **Mood:** Enjoying the night, receptive

### Restaurant Group (Advanced)
- **Setting:** Nice restaurant, evening
- **Characters:** Jessica (spokesperson), Sarah, Emma - celebrating Sarah's promotion
- **Personality:** Group dynamic, supportive of each other
- **Context:** Celebratory dinner
- **Mood:** Happy, festive, slightly guarded as a group

### Public Transit
- **Setting:** City bus or train, commute time
- **Character:** Sarah, 24, graduate student
- **Personality:** Introverted, bookish, polite
- **Context:** Reading a book, heading home
- **Mood:** In her own world, but not unfriendly

### Street Approach
- **Setting:** Downtown street, daytime
- **Character:** Emma, 27, photographer
- **Personality:** Busy but approachable, direct
- **Context:** Walking to lunch
- **Mood:** Rushed but friendly

---

## User Flow

```
Dashboard
    │
    ▼
Select Scenario
    │
    ▼
Scene Introduction (Typewriter narrative)
    │
    ▼
Countdown (5, 4, 3, 2, 1...)
    │
    ▼
Voice Conversation
    │  - User speaks first
    │  - AI responds
    │  - Back and forth
    │
    ▼
End Conversation
    │
    ▼
Review & Feedback
    │
    ▼
Dashboard (History updated)
```

---

## Success Metrics

1. **Engagement:** Average session duration > 5 minutes
2. **Completion:** >80% of started conversations completed
3. **Return Rate:** Users return for multiple sessions
4. **Score Improvement:** Average scores improve over time
5. **Latency:** AI response time < 1 second

---

## Out of Scope (MVP)

- Video lessons/tutorials (course structure)
- User authentication/accounts
- Multiplayer/social features
- Mobile native apps
- Advanced analytics dashboard
- Subscription/payment system
- Live avatar video (static images only for MVP)

---

## Future Enhancements (Post-MVP)

1. **Course Structure:** Video lessons before practice
2. **Character Variations:** Same scenario, different personalities
3. **Difficulty Levels:** Easy (friendly) → Hard (challenging)
4. **Live Avatars:** HeyGen or similar for video-realistic avatars
5. **Voice Customization:** Different character voices
6. **Progress Tracking:** Detailed analytics over time
7. **Social Features:** Share progress, leaderboards
8. **Mobile App:** iOS/Android native experience
