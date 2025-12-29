# Technical Specification

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    (Next.js 14 + React)                     │
├─────────────────────────────────────────────────────────────┤
│  Dashboard  │  Scene Intro  │  Conversation  │  Review      │
└──────┬──────────────┬───────────────┬──────────────┬────────┘
       │              │               │              │
       ▼              ▼               ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
├─────────────────────────────────────────────────────────────┤
│  /api/conversations  │  /api/feedback  │  /api/elevenlabs   │
└──────────┬───────────────────┬────────────────┬─────────────┘
           │                   │                │
           ▼                   ▼                ▼
    ┌──────────┐        ┌──────────┐     ┌─────────────┐
    │ PostgreSQL│        │  OpenAI  │     │ ElevenLabs  │
    │ (Prisma)  │        │   API    │     │ Conv. AI    │
    └──────────┘        └──────────┘     └─────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14, React 19, TypeScript | UI framework |
| Styling | Tailwind CSS, shadcn/ui | Component library |
| State | React hooks, URL state | Local state management |
| Backend | Next.js API Routes | API endpoints |
| Database | PostgreSQL + Prisma | Data persistence |
| Voice AI | ElevenLabs Conversational AI | Real-time voice |
| Feedback | OpenAI GPT-4 | Conversation analysis |
| Audio | MediaRecorder API, Web Audio | Recording/playback |

---

## Project Structure

```
mack2/
├── frontend/
│   ├── app/
│   │   ├── page.tsx                    # Dashboard
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Global styles
│   │   │
│   │   ├── scenario/
│   │   │   └── [type]/
│   │   │       ├── intro/
│   │   │       │   └── page.tsx        # Scene introduction
│   │   │       └── conversation/
│   │   │           └── page.tsx        # Voice conversation
│   │   │
│   │   ├── review/
│   │   │   └── [id]/
│   │   │       └── page.tsx            # Conversation review
│   │   │
│   │   └── api/
│   │       ├── conversations/
│   │       │   ├── route.ts            # GET all, POST new
│   │       │   └── [id]/
│   │       │       └── route.ts        # GET, PUT, DELETE one
│   │       ├── feedback/
│   │       │   └── route.ts            # Generate feedback
│   │       └── elevenlabs/
│   │           └── session/
│   │               └── route.ts        # Get signed URL
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn components
│   │   ├── scene-intro.tsx             # Typewriter + countdown
│   │   ├── voice-conversation.tsx      # Main conversation UI
│   │   ├── avatar-display.tsx          # Animated avatar
│   │   ├── audio-player.tsx            # Review playback
│   │   └── conversation-history-list.tsx
│   │
│   ├── lib/
│   │   ├── db.ts                       # Prisma client
│   │   ├── scenarios.ts                # Scenario configs
│   │   ├── elevenlabs.ts               # ElevenLabs helpers
│   │   └── utils.ts                    # Utilities
│   │
│   ├── hooks/
│   │   ├── use-audio-recorder.ts       # Audio recording hook
│   │   └── use-elevenlabs.ts           # Voice conversation hook
│   │
│   └── types/
│       └── index.ts                    # TypeScript types
│
├── prisma/
│   ├── schema.prisma                   # Database schema
│   └── seed.ts                         # Seed data (optional)
│
├── spec/
│   ├── prompts.md                      # Original prompt
│   ├── PRD.md                          # Product requirements
│   └── TECH_SPEC.md                    # This file
│
├── .env.local                          # Environment variables
└── docker-compose.yml                  # Local PostgreSQL
```

---

## Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Conversation {
  id            String    @id @default(cuid())
  scenarioType  String    // coffee, bar, restaurant, transit, street
  audioUrl      String?   // Full conversation audio (base64 or URL)
  duration      Int       // Duration in seconds
  startedAt     DateTime
  endedAt       DateTime?

  feedback      Feedback?
  messages      Message[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  speaker        String       // "user" or "ai"
  content        String       // Transcribed text
  audioUrl       String?      // Individual message audio (optional)
  timestamp      Int          // Seconds from conversation start

  createdAt      DateTime     @default(now())
}

model Feedback {
  id             String       @id @default(cuid())
  conversationId String       @unique
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  overallScore   Int          // 0-100
  strengths      String[]     // Array of strength descriptions
  improvements   String[]     // Array of improvement suggestions
  metrics        Json         // Detailed metrics object

  createdAt      DateTime     @default(now())
}
```

---

## API Endpoints

### Conversations

```typescript
// GET /api/conversations
// Returns all conversations with basic info
Response: {
  conversations: Array<{
    id: string
    scenarioType: string
    duration: number
    startedAt: string
    feedback?: { overallScore: number }
  }>
}

// POST /api/conversations
// Create new conversation
Request: {
  scenarioType: string
  startedAt: string
}
Response: {
  id: string
  scenarioType: string
  startedAt: string
}

// GET /api/conversations/[id]
// Get full conversation with messages and feedback
Response: {
  id: string
  scenarioType: string
  audioUrl?: string
  duration: number
  startedAt: string
  endedAt?: string
  messages: Array<{
    id: string
    speaker: string
    content: string
    timestamp: number
  }>
  feedback?: {
    overallScore: number
    strengths: string[]
    improvements: string[]
    metrics: object
  }
}

// PUT /api/conversations/[id]
// Update conversation (add audio, end time, messages)
Request: {
  audioUrl?: string
  endedAt?: string
  duration?: number
  messages?: Array<{
    speaker: string
    content: string
    timestamp: number
  }>
}
```

### Feedback

```typescript
// POST /api/feedback
// Generate and save feedback for a conversation
Request: {
  conversationId: string
  transcript: Array<{
    speaker: string
    content: string
  }>
  scenarioType: string
}
Response: {
  overallScore: number
  strengths: string[]
  improvements: string[]
  metrics: object
}
```

### ElevenLabs

```typescript
// POST /api/elevenlabs/session
// Get signed URL for ElevenLabs conversation
Request: {
  scenarioType: string
}
Response: {
  signedUrl: string
  agentId: string
}
```

---

## ElevenLabs Integration

### Conversational AI Agent Setup

Each scenario requires an ElevenLabs Conversational AI agent with specific configuration:

```typescript
// lib/scenarios.ts

export interface ScenarioConfig {
  type: string
  name: string
  avatar: string
  description: string
  sceneNarrative: string[]
  agentConfig: {
    name: string
    voice: string  // ElevenLabs voice ID
    systemPrompt: string
    firstMessage?: string  // Only for AI-initiated scenarios
  }
}

export const scenarios: Record<string, ScenarioConfig> = {
  coffee: {
    type: 'coffee',
    name: 'Coffee Shop',
    avatar: '/young-woman-with-coffee-casual-friendly-smile.jpg',
    description: 'Practice approaching someone in a relaxed coffee shop setting',
    sceneNarrative: [
      "You walk into a cozy coffee shop. The aroma of fresh espresso fills the air.",
      "You notice a girl sitting alone at a table by the window, looking at her phone.",
      "You order your usual and wait. She's still there, her friend seems to be running late.",
      "This seems like the perfect moment to approach...",
    ],
    agentConfig: {
      name: 'Jessica',
      voice: 'EXAVITQu4vr4xnSDxMaL', // Sarah voice or similar
      systemPrompt: `You are Jessica, a 26-year-old woman sitting at a coffee shop.

BACKGROUND:
- You just finished a pilates class this morning and feel energized
- You're waiting for your friend who texted that she's running 15 minutes late
- You ordered a caramel latte and it's delicious
- You work as a graphic designer at a small agency
- You live a few blocks away and come here often
- You're reading something on your phone (Instagram or a design blog)

PERSONALITY:
- Friendly and warm, but not overly eager
- You appreciate genuine, confident conversation
- You're curious about people and ask questions back
- You have a subtle sense of humor
- You're comfortable with silence and don't fill every gap

CONVERSATION STYLE:
- Keep responses conversational and natural (1-3 sentences typically)
- Ask questions back to show interest
- Reference the coffee shop setting naturally
- If someone is awkward, be politely encouraging but don't carry the conversation alone
- If someone is creepy or inappropriate, politely end the conversation

REMEMBER:
- You don't know this person - they're approaching you
- React naturally as a real person would
- Be authentic, not scripted`,
    },
  },

  bar: {
    type: 'bar',
    name: 'Bar Setting',
    avatar: '/young-woman-at-bar-friendly-approachable-smile.jpg',
    description: 'Practice initiating conversations in a casual bar environment',
    sceneNarrative: [
      "You walk into a lively bar on a Friday evening. Music plays in the background.",
      "You spot an open seat at the bar next to a girl who seems to be alone.",
      "Her friends appear to have stepped away for a moment.",
      "You take a seat and order a drink. Here's your chance...",
    ],
    agentConfig: {
      name: 'Jessica',
      voice: 'EXAVITQu4vr4xnSDxMaL',
      systemPrompt: `You are Jessica, a 28-year-old woman at a bar on a Friday night.

BACKGROUND:
- You work in marketing for a tech startup
- You're out with two girlfriends who just went to the bathroom/dance floor
- You're on your second gin and tonic
- You come to this bar occasionally - it's close to your apartment
- You had a good but long week at work

PERSONALITY:
- Sociable and confident
- You enjoy meeting new people when they seem genuine
- You're witty and enjoy playful banter
- You can read people well and trust your instincts
- You're not desperate for attention - you're having a good time regardless

CONVERSATION STYLE:
- Engage naturally, reference the bar environment
- If someone seems interesting, show curiosity
- Use humor and keep things light
- If someone is boring or too intense, subtly try to wrap up
- Mention your friends might be back soon (natural out if needed)

REMEMBER:
- This is a social setting - being approached is normal
- React authentically - interest if you're interested, polite deflection if not`,
    },
  },

  restaurant: {
    type: 'restaurant',
    name: 'Restaurant Group',
    avatar: '/three-young-women-friends-smiling-at-restaurant.jpg',
    description: 'Practice approaching a group of women at a restaurant',
    sceneNarrative: [
      "You're at a nice restaurant for dinner. The atmosphere is warm and inviting.",
      "You notice a group of three women at a nearby table, clearly celebrating something.",
      "They seem to be in great spirits, laughing and toasting.",
      "One of them catches your eye. You decide to approach the group...",
    ],
    agentConfig: {
      name: 'The Group',
      voice: 'EXAVITQu4vr4xnSDxMaL',
      systemPrompt: `You are roleplaying as a group of three women at a restaurant: Jessica (the main speaker), Sarah (being celebrated), and Emma (visiting from out of town).

CONTEXT:
- You're celebrating Sarah's recent promotion at work
- Jessica and Sarah work together at the same company
- Emma is Sarah's college friend visiting for the weekend
- You've had a bottle of wine and appetizers, feeling festive

SPEAKING AS JESSICA (primary responder):
- You're the most outgoing and often speak for the group
- Introduce yourself and the others when appropriate
- Be friendly but slightly protective of your group dynamic

PERSONALITY (GROUP):
- Happy and celebrating, open to friendly interaction
- Appreciate confidence but can spot insincerity
- Will include the whole group in conversation decisions
- Might exchange glances with friends when assessing the situation

CONVERSATION STYLE:
- Mention the celebration when natural
- If someone seems genuinely nice, the group warms up
- May ask opinions of Sarah and Emma occasionally
- Keep it light - this is a celebration after all

REMEMBER:
- Group dynamics are different - you're not alone
- The guy is approaching a group which takes more confidence
- React as real friends would - supportive of each other`,
    },
  },

  transit: {
    type: 'transit',
    name: 'Public Transit',
    avatar: '/young-woman-reading-book-on-train-casual.jpg',
    description: 'Practice initiating brief conversations on a bus or train',
    sceneNarrative: [
      "You step onto the evening commuter train. It's moderately crowded.",
      "You find a seat across from a girl reading a book.",
      "She seems absorbed in her reading but occasionally glances up.",
      "The train starts moving. You have a few stops to make conversation...",
    ],
    agentConfig: {
      name: 'Sarah',
      voice: 'EXAVITQu4vr4xnSDxMaL',
      systemPrompt: `You are Sarah, a 24-year-old graduate student on a commuter train.

BACKGROUND:
- You're getting your Master's in Psychology
- You're reading a popular fiction novel (something like a Colleen Hoover book)
- You're heading home after a long day of classes and studying
- You live about 20 minutes away by train
- You're a bit tired but not exhausted

PERSONALITY:
- More introverted but not unfriendly
- Thoughtful and observant
- You appreciate respect for personal space
- Once comfortable, you can have engaging conversations
- You're intellectual and enjoy discussing ideas

CONVERSATION STYLE:
- Initially brief responses - you're reading
- If someone is genuinely interesting, you'll engage more
- Appreciate questions about your book or studies
- Keep in mind this is public transit - context matters
- Might mention your stop is coming if you need to end it

REMEMBER:
- Public transit has different social norms than bars
- Being approached while reading is slightly intrusive but not unwelcome if done well
- You're not obligated to have a long conversation`,
    },
  },

  street: {
    type: 'street',
    name: 'Street Approach',
    avatar: '/placeholder.jpg',
    description: 'Practice approaching someone walking by on the street',
    sceneNarrative: [
      "You're walking downtown on a sunny afternoon.",
      "A girl walking the opposite direction catches your attention.",
      "She has an interesting style and seems approachable.",
      "You only have a moment to make this happen...",
    ],
    agentConfig: {
      name: 'Emma',
      voice: 'EXAVITQu4vr4xnSDxMaL',
      systemPrompt: `You are Emma, a 27-year-old photographer walking downtown.

BACKGROUND:
- You're a freelance photographer, heading to grab lunch
- You're dressed in a casual but stylish way
- You're not in a huge rush but you are going somewhere
- You live in the area and are used to city life

PERSONALITY:
- Creative and observant (you're a photographer)
- Direct but friendly
- You appreciate boldness when it's genuine
- You can quickly assess situations
- Not easily flustered but also not naive

CONVERSATION STYLE:
- Keep it brief - you're on the move
- Appreciate directness and honesty
- If someone is interesting, you might pause longer
- Easy to give contact info if you're genuinely interested
- Clear about needing to go if you're not feeling it

REMEMBER:
- Street approaches are bold - acknowledge that
- You don't have much time - get to the point
- This requires confidence and you respect that`,
    },
  },
}
```

### Client-Side Integration

```typescript
// hooks/use-elevenlabs.ts

import { useCallback, useRef, useState } from 'react'

interface UseElevenLabsOptions {
  onMessage: (message: { role: 'user' | 'assistant', content: string }) => void
  onAudioStart: () => void
  onAudioEnd: () => void
  onError: (error: Error) => void
}

export function useElevenLabs(options: UseElevenLabsOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const connect = useCallback(async (scenarioType: string) => {
    // Get signed URL from our API
    const response = await fetch('/api/elevenlabs/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioType }),
    })
    const { signedUrl } = await response.json()

    // Connect to ElevenLabs WebSocket
    const ws = new WebSocket(signedUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      startListening()
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'audio') {
        // Play audio response
        playAudio(data.audio)
        setIsSpeaking(true)
        options.onAudioStart()
      }

      if (data.type === 'transcript') {
        options.onMessage({
          role: data.speaker === 'user' ? 'user' : 'assistant',
          content: data.text,
        })
      }

      if (data.type === 'audio_end') {
        setIsSpeaking(false)
        options.onAudioEnd()
      }
    }

    ws.onerror = (error) => {
      options.onError(new Error('WebSocket error'))
    }

    ws.onclose = () => {
      setIsConnected(false)
      stopListening()
    }
  }, [options])

  const startListening = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    mediaRecorderRef.current = mediaRecorder

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
        // Send audio chunk to ElevenLabs
        wsRef.current.send(event.data)
      }
    }

    mediaRecorder.start(100) // Send chunks every 100ms
    setIsListening(true)
  }

  const stopListening = () => {
    mediaRecorderRef.current?.stop()
    setIsListening(false)
  }

  const disconnect = () => {
    wsRef.current?.close()
    stopListening()
  }

  const playAudio = async (audioData: ArrayBuffer) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }

    const audioBuffer = await audioContextRef.current.decodeAudioData(audioData)
    const source = audioContextRef.current.createBufferSource()
    source.buffer = audioBuffer
    source.connect(audioContextRef.current.destination)
    source.start()
  }

  return {
    isConnected,
    isListening,
    isSpeaking,
    connect,
    disconnect,
  }
}
```

---

## Frontend Components

### Scene Intro Component

```typescript
// components/scene-intro.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { scenarios } from '@/lib/scenarios'

interface SceneIntroProps {
  scenarioType: string
}

export function SceneIntro({ scenarioType }: SceneIntroProps) {
  const router = useRouter()
  const scenario = scenarios[scenarioType]

  const [currentLine, setCurrentLine] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdown, setCountdown] = useState(5)

  // Typewriter effect for current line
  useEffect(() => {
    if (currentLine >= scenario.sceneNarrative.length) {
      setShowCountdown(true)
      return
    }

    const line = scenario.sceneNarrative[currentLine]
    let charIndex = 0
    setDisplayedText('')

    const interval = setInterval(() => {
      if (charIndex < line.length) {
        setDisplayedText(line.slice(0, charIndex + 1))
        charIndex++
      } else {
        clearInterval(interval)
        setTimeout(() => setCurrentLine(prev => prev + 1), 1500)
      }
    }, 40) // 40ms per character

    return () => clearInterval(interval)
  }, [currentLine, scenario.sceneNarrative])

  // Countdown timer
  useEffect(() => {
    if (!showCountdown) return

    if (countdown === 0) {
      router.push(`/scenario/${scenarioType}/conversation`)
      return
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [showCountdown, countdown, router, scenarioType])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <AnimatePresence mode="wait">
          {!showCountdown ? (
            <motion.p
              key={currentLine}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-2xl text-white font-light leading-relaxed"
            >
              {displayedText}
              <span className="animate-pulse">|</span>
            </motion.p>
          ) : (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-8"
            >
              <p className="text-xl text-white/80">You're approaching...</p>
              <p className="text-9xl font-bold text-white">{countdown}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
```

### Avatar Display Component

```typescript
// components/avatar-display.tsx

'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'

interface AvatarDisplayProps {
  src: string
  name: string
  isSpeaking: boolean
  className?: string
}

export function AvatarDisplay({ src, name, isSpeaking, className }: AvatarDisplayProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Pulse rings when speaking */}
      {isSpeaking && (
        <>
          <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
          <div className="absolute inset-0 rounded-full bg-rose-500/10 animate-pulse" />
        </>
      )}

      {/* Avatar image */}
      <div className={cn(
        'relative rounded-full overflow-hidden border-4 transition-all duration-300',
        isSpeaking ? 'border-rose-500 shadow-lg shadow-rose-500/50' : 'border-white/20'
      )}>
        <Image
          src={src}
          alt={name}
          width={200}
          height={200}
          className="object-cover"
        />
      </div>

      {/* Name label */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
        <span className={cn(
          'px-4 py-1 rounded-full text-sm font-medium',
          isSpeaking ? 'bg-rose-500 text-white' : 'bg-white/10 text-white/80'
        )}>
          {name}
        </span>
      </div>
    </div>
  )
}
```

---

## Feedback Generation

```typescript
// app/api/feedback/route.ts

import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/db'

const openai = new OpenAI()

export async function POST(request: Request) {
  const { conversationId, transcript, scenarioType } = await request.json()

  const prompt = `Analyze this conversation practice session and provide feedback.

SCENARIO: ${scenarioType}

TRANSCRIPT:
${transcript.map((m: any) => `${m.speaker}: ${m.content}`).join('\n')}

Provide a JSON response with:
1. overallScore (0-100): Overall connection/conversation quality
2. strengths (array of 3-5 strings): What the user did well
3. improvements (array of 3-5 strings): Areas for improvement
4. metrics (object): Scores for specific areas
   - initiation (0-100): How well they started the conversation
   - authenticity (0-100): How genuine they came across
   - activeListening (0-100): How well they listened and responded
   - engagement (0-100): How engaging the conversation was
   - respectfulness (0-100): How respectful and appropriate

Focus on actionable, specific feedback. Be encouraging but honest.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })

  const feedback = JSON.parse(response.choices[0].message.content!)

  // Save to database
  await prisma.feedback.create({
    data: {
      conversationId,
      overallScore: feedback.overallScore,
      strengths: feedback.strengths,
      improvements: feedback.improvements,
      metrics: feedback.metrics,
    },
  })

  return NextResponse.json(feedback)
}
```

---

## Environment Setup

### Required Environment Variables

```env
# .env.local

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mack"

# ElevenLabs
ELEVENLABS_API_KEY="your-elevenlabs-api-key"

# OpenAI (for feedback generation)
OPENAI_API_KEY="your-openai-api-key"
```

### Docker Compose for Local PostgreSQL

```yaml
# docker-compose.yml

version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: mack
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Dependencies

```json
{
  "dependencies": {
    "@prisma/client": "^5.7.0",
    "openai": "^4.24.0",
    "framer-motion": "^10.16.0"
  },
  "devDependencies": {
    "prisma": "^5.7.0"
  }
}
```

---

## Testing Strategy

1. **Unit Tests:** Test scenario configurations, utility functions
2. **Integration Tests:** Test API routes with mock database
3. **E2E Tests:** Full conversation flow with mocked ElevenLabs
4. **Manual Testing:** Real voice conversations in browser

---

## Deployment Considerations

### MVP (Local)
- PostgreSQL via Docker
- Next.js dev server
- Direct API keys in .env.local

### Production (Future)
- Supabase for PostgreSQL + auth
- Vercel for Next.js hosting
- Environment variables in Vercel dashboard
- Audio storage in Supabase Storage or S3
