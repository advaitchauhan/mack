import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyWebhookSignature } from '@/lib/elevenlabs'
import { generateFeedback, saveTranscript } from '@/lib/feedback'

export const maxDuration = 60

// POST /api/webhooks/elevenlabs - ElevenLabs post-call webhook.
// Saves the final transcript and generates feedback as soon as a call ends,
// even if the browser or phone has already gone away.
export async function POST(request: NextRequest) {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const rawBody = await request.text()
  if (!verifyWebhookSignature(rawBody, request.headers.get('elevenlabs-signature'), secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)
  if (event.type !== 'post_call_transcription') {
    return NextResponse.json({ ok: true })
  }

  const data = event.data
  const conversation = await prisma.conversation.findUnique({
    where: { elevenLabsConversationId: data.conversation_id },
  })
  if (!conversation) {
    // Not a Mack conversation, or the client never reported its id.
    return NextResponse.json({ ok: true })
  }

  try {
    await saveTranscript(conversation.id, data.transcript || [], data.metadata?.call_duration_secs)
    if (!conversation.endedAt) {
      const start = data.metadata?.start_time_unix_secs
      const duration = data.metadata?.call_duration_secs
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          endedAt: start && duration ? new Date((start + duration) * 1000) : new Date(),
        },
      })
    }
    await generateFeedback(conversation.id)
  } catch (error) {
    // Still return 200 so ElevenLabs doesn't disable the webhook; the client
    // can retry feedback from the review page.
    console.error('Error handling post-call webhook:', error)
  }

  return NextResponse.json({ ok: true })
}
