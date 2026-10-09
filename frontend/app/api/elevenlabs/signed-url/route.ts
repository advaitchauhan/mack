import { NextRequest, NextResponse } from 'next/server'
import { getScenario } from '@/lib/scenarios'
import { getUser, unauthorized } from '@/lib/auth'
import { getAgentIdForScenario, getSignedUrl } from '@/lib/elevenlabs'
import { prisma } from '@/lib/db'

// POST /api/elevenlabs/signed-url
// Starts a practice conversation: creates the conversation record and returns
// a signed URL for the scenario's ElevenLabs agent. The prompt stays on the server.
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
    const signedUrl = await getSignedUrl(agentId)

    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        scenarioType,
        startedAt: new Date(),
        duration: 0,
      },
    })

    return NextResponse.json({
      signedUrl,
      conversationId: conversation.id,
      scenario: {
        name: scenario.agentConfig.name,
      },
    })
  } catch (error) {
    console.error('Error getting signed URL:', error)
    return NextResponse.json(
      { error: 'Could not start the conversation' },
      { status: 500 }
    )
  }
}
