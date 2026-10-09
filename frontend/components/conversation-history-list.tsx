'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarIcon, Clock, ChevronRight, MessageSquare } from 'lucide-react'
import { getScenario } from '@/lib/scenarios'

interface ConversationSummary {
  id: string
  scenarioType: string
  duration: number
  startedAt: string
  feedback?: {
    overallScore: number
  }
}

// Mock data for when database is not available
const mockConversations: ConversationSummary[] = [
  {
    id: 'mock-1',
    scenarioType: 'coffee',
    duration: 180,
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    feedback: { overallScore: 82 },
  },
  {
    id: 'mock-2',
    scenarioType: 'bar',
    duration: 240,
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    feedback: { overallScore: 78 },
  },
  {
    id: 'mock-3',
    scenarioType: 'transit',
    duration: 120,
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    feedback: { overallScore: 85 },
  },
]

export default function ConversationHistoryList() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchConversations() {
      try {
        const response = await fetch('/api/conversations')
        if (response.ok) {
          const data = await response.json()
          if (data.conversations && data.conversations.length > 0) {
            setConversations(data.conversations)
          } else {
            // Use mock data if no conversations in database
            setConversations(mockConversations)
          }
        } else {
          setConversations(mockConversations)
        }
      } catch (error) {
        console.error('Error fetching conversations:', error)
        setConversations(mockConversations)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins === 0) return `${secs}s`
    return secs > 0 ? `${mins}m ${secs}s` : `${mins} minutes`
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex justify-between">
                <div className="space-y-3 flex-1">
                  <div className="h-5 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
                <div className="h-8 w-8 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-sm">
            Start practicing to build your conversation history
          </p>
          <Link href="/scenario/coffee/intro">
            <Button>Start Your First Practice</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Practice History</h2>
        <p className="text-sm text-muted-foreground">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-4">
        {conversations.map((conversation) => {
          const scenario = getScenario(conversation.scenarioType)
          const score = conversation.feedback?.overallScore

          return (
            <Link href={`/review/${conversation.id}`} key={conversation.id}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          {scenario?.name || conversation.scenarioType}
                        </h3>
                        {score && (
                          <Badge
                            variant="outline"
                            className={
                              score >= 80
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : score >= 60
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }
                          >
                            {score}%
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarIcon size={14} />
                          <span>
                            {formatDistanceToNow(new Date(conversation.startedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{formatDuration(conversation.duration)}</span>
                        </div>
                      </div>
                      {scenario && (
                        <p className="text-sm text-muted-foreground">
                          {scenario.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <ChevronRight className="text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
