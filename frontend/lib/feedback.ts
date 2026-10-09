import 'server-only'
import OpenAI from 'openai'
import { prisma } from '@/lib/db'
import { getScenario } from '@/lib/scenarios'
import { fetchConversation } from '@/lib/elevenlabs'

// Long transcripts are trimmed so one call can't run up a large OpenAI bill.
const MAX_TRANSCRIPT_CHARS = 20000

// Replaces a conversation's messages with ElevenLabs' own transcript, which
// is authoritative (the client's copy can be incomplete or edited).
export async function saveTranscript(
  conversationId: string,
  transcript: { role: string; message: string | null; time_in_call_secs: number }[],
  durationSecs?: number
) {
  const messages = transcript
    .filter(t => t.message && t.message.trim())
    .map(t => ({
      conversationId,
      speaker: t.role === 'user' ? 'user' : 'ai',
      content: t.message!,
      timestamp: Math.round(t.time_in_call_secs || 0),
    }))

  await prisma.$transaction([
    prisma.message.deleteMany({ where: { conversationId } }),
    prisma.message.createMany({ data: messages }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(durationSecs !== undefined && { duration: Math.round(durationSecs) }),
      },
    }),
  ])
}

// Generates and stores feedback for a conversation, once. Called from the
// ElevenLabs post-call webhook and from POST /api/feedback (web and iOS).
export async function generateFeedback(conversationId: string) {
  const existing = await prisma.feedback.findUnique({ where: { conversationId } })
  if (existing) return existing

  let conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { timestamp: 'asc' } } },
  })
  if (!conversation) throw new Error('Conversation not found')

  // Prefer ElevenLabs' transcript when the call has finished processing.
  if (conversation.elevenLabsConversationId) {
    try {
      const remote = await fetchConversation(conversation.elevenLabsConversationId)
      if (remote.status === 'done' && remote.transcript?.length) {
        await saveTranscript(conversation.id, remote.transcript, remote.metadata?.call_duration_secs)
        conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { messages: { orderBy: { timestamp: 'asc' } } },
        })
      }
    } catch (error) {
      console.error('Could not fetch ElevenLabs transcript, using saved messages:', error)
    }
  }
  if (!conversation || conversation.messages.length === 0) {
    throw new Error('Conversation has no transcript yet')
  }

  const scenario = getScenario(conversation.scenarioType)
  const scenarioName = scenario?.name || conversation.scenarioType
  const formattedTranscript = conversation.messages
    .map(m => `${m.speaker === 'user' ? 'You' : 'Her'}: ${m.content}`)
    .join('\n')
    .slice(0, MAX_TRANSCRIPT_CHARS)

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
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key') {
    const openai = new OpenAI()
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_FEEDBACK_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })
    feedbackData = JSON.parse(response.choices[0].message.content || '{}')
  } else {
    console.log('No OpenAI API key configured, using mock feedback')
    feedbackData = generateMockFeedback(conversation.messages.length)
  }

  try {
    return await prisma.feedback.create({
      data: {
        conversationId,
        overallScore: feedbackData.overallScore || 75,
        strengths: feedbackData.strengths || [],
        improvements: feedbackData.improvements || [],
        metrics: feedbackData.metrics || {},
      },
    })
  } catch (error) {
    // The webhook and the client can race; the first one wins.
    const raced = await prisma.feedback.findUnique({ where: { conversationId } })
    if (raced) return raced
    throw error
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
