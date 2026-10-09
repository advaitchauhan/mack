import { NextRequest, NextResponse } from 'next/server'
import { getScenario } from '@/lib/scenarios'
import { getUser, unauthorized } from '@/lib/auth'
import { getAgentIdForScenario, getConversationToken } from '@/lib/elevenlabs'
import { prisma } from '@/lib/db'

// POST /api/elevenlabs/conversation-token
// Same as /api/elevenlabs/signed-url, but returns a WebRTC conversation token
// for the ElevenLabs Swift SDK (iOS). The prompt stays on the server.
export async function POST(request: NextRequest) {
  const user = await getUser(request)
  if (!user) return unauthorized()

  try {
    const { scenarioType } = await request.json()

    if (!scenarioType) {
      return NextResponse.json(
        { error: 'scenarioType is required' },
        { status: 400 }
      )
    }

    const scenario = getScenario(scenarioType)
    if (!scenario) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      )
    }

    const agentId = await getAgentIdForScenario(scenarioType)
    const token = await getConversationToken(agentId)

    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        scenarioType,
        startedAt: new Date(),
        duration: 0,
      },
    })

    return NextResponse.json({
      token,
      conversationId: conversation.id,
      agentName: scenario.agentConfig.name,
    })
  } catch (error) {
    console.error('Error getting conversation token:', error)
    return NextResponse.json(
      { error: 'Could not start the conversation' },
      { status: 500 }
    )
  }
}
