import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser, unauthorized } from '@/lib/auth'
import { generateFeedback } from '@/lib/feedback'

// POST /api/feedback - Generate and save feedback for one of the user's conversations.
// The transcript is read on the server; clients only send the conversation id.
export async function POST(request: NextRequest) {
  const user = await getUser(request)
  if (!user) return unauthorized()

  try {
    const { conversationId } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      )
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: user.id },
      select: { id: true },
    })
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const feedback = await generateFeedback(conversation.id)
    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Error generating feedback:', error)
    return NextResponse.json(
      { error: 'Failed to generate feedback' },
      { status: 500 }
    )
  }
}
