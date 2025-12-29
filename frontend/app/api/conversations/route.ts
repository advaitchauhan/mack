import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/conversations - Get all conversations
export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
      include: {
        feedback: {
          select: {
            overallScore: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scenarioType, startedAt } = body

    if (!scenarioType) {
      return NextResponse.json(
        { error: 'scenarioType is required' },
        { status: 400 }
      )
    }

    const conversation = await prisma.conversation.create({
      data: {
        scenarioType,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        duration: 0,
      },
    })

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}
