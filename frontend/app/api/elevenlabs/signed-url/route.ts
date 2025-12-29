import { NextRequest, NextResponse } from 'next/server'
import { getScenario } from '@/lib/scenarios'

// POST /api/elevenlabs/signed-url
// Get a signed URL for ElevenLabs Conversational AI
export async function POST(request: NextRequest) {
  try {
    const { scenarioType } = await request.json()

    if (!scenarioType) {
      return NextResponse.json(
        { error: 'scenarioType is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey || apiKey === 'your-elevenlabs-api-key') {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      )
    }

    const agentId = process.env.ELEVENLABS_AGENT_ID
    if (!agentId) {
      return NextResponse.json(
        { error: 'ElevenLabs Agent ID not configured. Create an agent at https://elevenlabs.io/app/conversational-ai' },
        { status: 500 }
      )
    }

    const scenario = getScenario(scenarioType)
    if (!scenario) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      )
    }

    // Get signed URL from ElevenLabs Conversational AI API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('ElevenLabs API error:', error)
      return NextResponse.json(
        { error: `Failed to get signed URL: ${error}` },
        { status: 500 }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      signedUrl: data.signed_url,
      scenario: {
        name: scenario.agentConfig.name,
        systemPrompt: scenario.agentConfig.systemPrompt,
        voiceId: scenario.agentConfig.voiceId,
      },
    })
  } catch (error) {
    console.error('Error getting signed URL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
