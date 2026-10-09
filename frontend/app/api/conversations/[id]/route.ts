import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUser, unauthorized } from '@/lib/auth'

function notFound() {
  return NextResponse.json(
    { error: 'Conversation not found' },
    { status: 404 }
  )
}

// GET /api/conversations/[id] - Get a single conversation with messages and feedback
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser(request)
  if (!user) return unauthorized()

  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
        feedback: true,
      },
    })

    if (!conversation) return notFound()

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}

// PUT /api/conversations/[id] - Update a conversation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser(request)
  if (!user) return unauthorized()

  try {
    const existing = await prisma.conversation.findFirst({
      where: { id: params.id, userId: user.id },
      include: { _count: { select: { messages: true } } },
    })
    if (!existing) return notFound()

    const body = await request.json()
    const { audioUrl, endedAt, duration, messages, elevenLabsConversationId } = body

    // Update the conversation
    await prisma.conversation.update({
      where: { id: params.id },
      data: {
        ...(audioUrl && { audioUrl }),
        ...(endedAt && { endedAt: new Date(endedAt) }),
        ...(duration !== undefined && { duration }),
        // Links the call to ElevenLabs' post-call webhook; set once.
        ...(elevenLabsConversationId && !existing.elevenLabsConversationId && { elevenLabsConversationId }),
      },
    })

    // Add the client's messages only if the server transcript hasn't arrived yet
    if (existing._count.messages === 0 && messages && Array.isArray(messages) && messages.length > 0) {
      await prisma.message.createMany({
        data: messages.map((msg: { speaker: string; content: string; timestamp: number; audioUrl?: string }) => ({
          conversationId: params.id,
          speaker: msg.speaker,
          content: msg.content,
          timestamp: msg.timestamp,
          audioUrl: msg.audioUrl,
        })),
      })
    }

    // Fetch the updated conversation with messages
    const updatedConversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
        feedback: true,
      },
    })

    return NextResponse.json(updatedConversation)
  } catch (error) {
    console.error('Error updating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    )
  }
}

// DELETE /api/conversations/[id] - Delete a conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser(request)
  if (!user) return unauthorized()

  try {
    const { count } = await prisma.conversation.deleteMany({
      where: { id: params.id, userId: user.id },
    })
    if (count === 0) return notFound()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting conversation:', error)
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}
