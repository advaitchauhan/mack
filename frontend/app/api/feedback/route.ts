import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import OpenAI from 'openai'
import { getScenario } from '@/lib/scenarios'

const openai = new OpenAI()

interface Message {
  speaker: string
  content: string
}

// POST /api/feedback - Generate and save feedback for a conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { conversationId, transcript, scenarioType } = body

    if (!conversationId || !transcript || !scenarioType) {
      return NextResponse.json(
        { error: 'conversationId, transcript, and scenarioType are required' },
        { status: 400 }
      )
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.feedback.findUnique({
      where: { conversationId },
    })

    if (existingFeedback) {
      return NextResponse.json(existingFeedback)
    }

    const scenario = getScenario(scenarioType)
    const scenarioName = scenario?.name || scenarioType

    // Format transcript for the prompt
    const formattedTranscript = transcript
      .map((m: Message) => `${m.speaker}: ${m.content}`)
      .join('\n')

    const prompt = `You are an expert conversation coach analyzing a practice conversation session.

SCENARIO: ${scenarioName}
CONTEXT: A user is practicing initiating conversations in a ${scenarioName.toLowerCase()} setting.

TRANSCRIPT:
${formattedTranscript}

Analyze this conversation and provide constructive feedback. Focus on:
1. How well they initiated the conversation
2. Their authenticity and confidence
3. Their listening and engagement skills
4. Their ability to build rapport
5. Any areas that could be improved

Provide a JSON response with the following structure:
{
  "overallScore": <number 0-100>,
  "strengths": [<3-5 specific things they did well>],
  "improvements": [<3-5 specific areas to improve>],
  "metrics": {
    "initiation": <number 0-100>,
    "authenticity": <number 0-100>,
    "activeListening": <number 0-100>,
    "engagement": <number 0-100>,
    "respectfulness": <number 0-100>
  }
}

Be encouraging but honest. Focus on specific, actionable feedback.
The scores should reflect genuine assessment - don't inflate scores.`

    let feedbackData

    // Check if OpenAI API key is configured
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key') {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      })

      feedbackData = JSON.parse(response.choices[0].message.content || '{}')
    } else {
      // Generate mock feedback if no API key
      console.log('No OpenAI API key configured, using mock feedback')
      feedbackData = generateMockFeedback(transcript.length)
    }

    // Save feedback to database
    const feedback = await prisma.feedback.create({
      data: {
        conversationId,
        overallScore: feedbackData.overallScore || 75,
        strengths: feedbackData.strengths || [],
        improvements: feedbackData.improvements || [],
        metrics: feedbackData.metrics || {},
      },
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Error generating feedback:', error)

    // If there's an error, still try to save some mock feedback
    try {
      const body = await request.json()
      const mockFeedback = generateMockFeedback(5)

      const feedback = await prisma.feedback.create({
        data: {
          conversationId: body.conversationId,
          overallScore: mockFeedback.overallScore,
          strengths: mockFeedback.strengths,
          improvements: mockFeedback.improvements,
          metrics: mockFeedback.metrics,
        },
      })

      return NextResponse.json(feedback)
    } catch {
      return NextResponse.json(
        { error: 'Failed to generate feedback' },
        { status: 500 }
      )
    }
  }
}

function generateMockFeedback(messageCount: number) {
  // Generate somewhat realistic mock feedback based on conversation length
  const baseScore = Math.min(60 + messageCount * 3, 90)
  const variation = () => Math.floor(Math.random() * 15) - 7

  return {
    overallScore: baseScore + variation(),
    strengths: [
      "Showed confidence in initiating the conversation",
      "Asked thoughtful follow-up questions",
      "Maintained a friendly and approachable tone",
      "Demonstrated active listening skills",
    ],
    improvements: [
      "Could share more about yourself to build mutual connection",
      "Consider asking more open-ended questions",
      "Look for opportunities to find common interests",
      "Practice transitioning topics more smoothly",
    ],
    metrics: {
      initiation: baseScore + variation(),
      authenticity: baseScore + variation(),
      activeListening: baseScore + variation(),
      engagement: baseScore + variation(),
      respectfulness: Math.min(baseScore + 10 + variation(), 100),
    },
  }
}
