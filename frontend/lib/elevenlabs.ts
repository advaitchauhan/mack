import 'server-only'
import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/db'
import { getScenario } from '@/lib/scenarios'
import { getScenarioPrompt } from '@/lib/scenario-prompts'

const API_BASE = 'https://api.elevenlabs.io/v1/convai'

// Bump when the way scenario agents are built changes, to force an update.
const AGENT_TEMPLATE_VERSION = 1

function apiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key || key === 'your-elevenlabs-api-key') {
    throw new Error('ElevenLabs API key not configured')
  }
  return key
}

async function elevenlabs<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'xi-api-key': apiKey(),
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`ElevenLabs ${init.method || 'GET'} ${path} failed: ${response.status} ${await response.text()}`)
  }
  return response.json() as Promise<T>
}

function maxCallSeconds(): number {
  return parseInt(process.env.MAX_CALL_SECONDS || '600', 10)
}

// Each scenario gets its own ElevenLabs agent, cloned from the base agent
// (ELEVENLABS_AGENT_ID) with the scenario's prompt and voice baked in and
// client overrides turned off, so neither the browser nor the iOS app ever
// holds or controls the prompt. Agents are created on first use and updated
// when the scenario changes.
export async function getAgentIdForScenario(scenarioType: string): Promise<string> {
  const scenario = getScenario(scenarioType)
  const prompt = getScenarioPrompt(scenarioType)
  if (!scenario || !prompt) throw new Error(`Unknown scenario: ${scenarioType}`)

  const baseAgentId = process.env.ELEVENLABS_AGENT_ID
  if (!baseAgentId) throw new Error('ELEVENLABS_AGENT_ID not configured')

  const configHash = createHash('sha256')
    .update(JSON.stringify({
      v: AGENT_TEMPLATE_VERSION,
      baseAgentId,
      prompt,
      voiceId: scenario.agentConfig.voiceId,
      firstMessage: scenario.agentConfig.firstMessage ?? null,
      maxCallSeconds: maxCallSeconds(),
    }))
    .digest('hex')

  const existing = await prisma.scenarioAgent.findUnique({ where: { scenarioType } })
  if (existing?.configHash === configHash) return existing.agentId

  const base = await elevenlabs<{ conversation_config: any }>(`/agents/${baseAgentId}`)
  const baseConfig = base.conversation_config || {}
  const body = {
    name: `Mack - ${scenario.name}`,
    conversation_config: {
      ...baseConfig,
      agent: {
        ...baseConfig.agent,
        ...(scenario.agentConfig.firstMessage !== undefined && {
          first_message: scenario.agentConfig.firstMessage,
        }),
        prompt: { ...baseConfig.agent?.prompt, prompt },
      },
      tts: { ...baseConfig.tts, voice_id: scenario.agentConfig.voiceId },
      conversation: { ...baseConfig.conversation, max_duration_seconds: maxCallSeconds() },
    },
    platform_settings: {
      auth: { enable_auth: true },
      overrides: {
        conversation_config_override: {
          agent: { prompt: { prompt: false }, first_message: false, language: false },
          tts: { voice_id: false },
        },
      },
    },
  }

  let agentId: string
  if (existing) {
    await elevenlabs(`/agents/${existing.agentId}`, { method: 'PATCH', body: JSON.stringify(body) })
    agentId = existing.agentId
  } else {
    const created = await elevenlabs<{ agent_id: string }>('/agents/create', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    agentId = created.agent_id
  }

  await prisma.scenarioAgent.upsert({
    where: { scenarioType },
    create: { scenarioType, agentId, configHash },
    update: { agentId, configHash },
  })
  return agentId
}

export async function getSignedUrl(agentId: string): Promise<string> {
  const data = await elevenlabs<{ signed_url: string }>(
    `/conversation/get_signed_url?agent_id=${encodeURIComponent(agentId)}`
  )
  return data.signed_url
}

export interface ElevenLabsTranscriptEntry {
  role: 'user' | 'agent'
  message: string | null
  time_in_call_secs: number
}

export interface ElevenLabsConversation {
  conversation_id: string
  agent_id: string
  status: string
  transcript: ElevenLabsTranscriptEntry[]
  metadata?: { call_duration_secs?: number; start_time_unix_secs?: number }
}

export async function fetchConversation(conversationId: string): Promise<ElevenLabsConversation> {
  return elevenlabs<ElevenLabsConversation>(`/conversations/${encodeURIComponent(conversationId)}`)
}

// Verifies the `ElevenLabs-Signature` header ("t=<unix>,v0=<hex hmac>") on
// post-call webhooks. The HMAC is SHA-256 over "<t>.<raw body>".
export function verifyWebhookSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false
  const parts = Object.fromEntries(
    header.split(',').map(part => {
      const [k, ...v] = part.split('=')
      return [k.trim(), v.join('=')]
    })
  )
  const timestamp = parseInt(parts.t, 10)
  if (!timestamp || !parts.v0) return false
  // Reject anything older than 30 minutes
  if (Math.abs(Date.now() / 1000 - timestamp) > 30 * 60) return false

  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(parts.v0)
  return a.length === b.length && timingSafeEqual(a, b)
}
