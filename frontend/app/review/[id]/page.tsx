'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, Share2, PlayCircle, PauseCircle, RotateCcw, Loader2, Trophy, ChevronRight } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { getScenario, getScenarioByLevel, getTotalLevels } from '@/lib/scenarios'
import { useUserProgress } from '@/components/level-select'

interface Message {
  id: string
  speaker: string
  content: string
  timestamp: number
}

interface Feedback {
  overallScore: number
  strengths: string[]
  improvements: string[]
  metrics: {
    initiation: number
    authenticity: number
    activeListening: number
    engagement: number
    respectfulness: number
  }
}

interface Conversation {
  id: string
  scenarioType: string
  audioUrl?: string
  duration: number
  startedAt: string
  endedAt?: string
  messages: Message[]
  feedback?: Feedback
}

// Mock data for demo purposes
const mockConversation: Conversation = {
  id: 'mock-1',
  scenarioType: 'coffee',
  duration: 180,
  startedAt: new Date().toISOString(),
  messages: [
    {
      id: '1',
      speaker: 'user',
      content: "Hi there! I hope I'm not interrupting. I noticed you're here alone and I just wanted to say hi. I'm Alex.",
      timestamp: 0,
    },
    {
      id: '2',
      speaker: 'ai',
      content: "Oh, hi Alex! No, you're not interrupting at all. I'm actually waiting for a friend who's running late. I'm Jessica.",
      timestamp: 8,
    },
    {
      id: '3',
      speaker: 'user',
      content: "Nice to meet you, Jessica. This place has great coffee. Is this your first time here?",
      timestamp: 18,
    },
    {
      id: '4',
      speaker: 'ai',
      content: "Nice to meet you too! Actually, I come here pretty often. I live just a few blocks away. Their caramel latte is amazing. What about you?",
      timestamp: 28,
    },
    {
      id: '5',
      speaker: 'user',
      content: "I just moved to the neighborhood last month, so I'm still discovering all the good spots. Any other recommendations?",
      timestamp: 42,
    },
    {
      id: '6',
      speaker: 'ai',
      content: "Oh, you're new here! Welcome to the neighborhood. There's a great bookstore around the corner, and the Italian place on Main Street is really good. What brought you to this area?",
      timestamp: 55,
    },
  ],
  feedback: {
    overallScore: 82,
    strengths: [
      "Strong, confident conversation initiation",
      "Polite and respectful approach",
      "Good follow-up questions showing genuine interest",
      "Natural conversation flow",
      "Asked about recommendations - shows interest in local knowledge",
    ],
    improvements: [
      "Could share more about yourself when asked",
      "Consider finding common interests to deepen the connection",
      "Look for opportunities to use humor",
      "Could have asked more open-ended questions",
    ],
    metrics: {
      initiation: 88,
      authenticity: 80,
      activeListening: 85,
      engagement: 78,
      respectfulness: 95,
    },
  },
}

export default function ReviewPage() {
  const params = useParams()
  const id = params.id as string

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [levelUnlocked, setLevelUnlocked] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const pollCountRef = useRef(0)
  const progressSavedRef = useRef(false)

  // User progress for level tracking
  const { completeLevel, currentLevel } = useUserProgress()

  // Save progress when feedback is available
  useEffect(() => {
    if (conversation?.feedback && !progressSavedRef.current) {
      const scenario = getScenario(conversation.scenarioType)
      if (scenario && scenario.level > 0) {
        const score = conversation.feedback.overallScore
        const previousLevel = currentLevel

        completeLevel(scenario.level, score)

        // Check if we unlocked a new level
        if (score >= 60 && scenario.level === previousLevel) {
          setLevelUnlocked(true)
        }

        progressSavedRef.current = true
      }
    }
  }, [conversation, completeLevel, currentLevel])

  // Generate feedback manually
  const generateFeedback = useCallback(async () => {
    if (!conversation || feedbackLoading) return

    setFeedbackLoading(true)
    setFeedbackError(null)

    try {
      const scenario = getScenario(conversation.scenarioType)
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          transcript: conversation.messages.map(m => ({
            speaker: m.speaker === 'user' ? 'You' : 'Her',
            content: m.content,
          })),
          scenarioType: conversation.scenarioType,
        }),
      })

      if (response.ok) {
        const feedback = await response.json()
        setConversation(prev => prev ? { ...prev, feedback } : null)
      } else {
        const error = await response.json()
        setFeedbackError(error.error || 'Failed to generate feedback')
      }
    } catch (error) {
      console.error('Error generating feedback:', error)
      setFeedbackError('Failed to generate feedback')
    } finally {
      setFeedbackLoading(false)
    }
  }, [conversation, feedbackLoading])

  // Fetch conversation data
  useEffect(() => {
    async function fetchConversation() {
      try {
        // Try to fetch from API
        const response = await fetch(`/api/conversations/${id}`)
        if (response.ok) {
          const data = await response.json()
          setConversation(data)

          // If no feedback yet and we have messages, start polling
          if (!data.feedback && data.messages?.length > 0) {
            setFeedbackLoading(true)
          }
        } else {
          // Use mock data if not found
          setConversation(mockConversation)
        }
      } catch (error) {
        console.error('Error fetching conversation:', error)
        // Use mock data on error
        setConversation(mockConversation)
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversation()
  }, [id])

  // Poll for feedback if it's not available yet
  useEffect(() => {
    if (!conversation || conversation.feedback || !feedbackLoading) return

    const pollForFeedback = async () => {
      try {
        const response = await fetch(`/api/conversations/${id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.feedback) {
            setConversation(data)
            setFeedbackLoading(false)
            pollCountRef.current = 0
          } else {
            pollCountRef.current++
            // Stop polling after 30 seconds (10 polls at 3s interval)
            if (pollCountRef.current >= 10) {
              setFeedbackLoading(false)
              setFeedbackError('Feedback generation timed out. Click to retry.')
            }
          }
        }
      } catch (error) {
        console.error('Error polling for feedback:', error)
      }
    }

    const interval = setInterval(pollForFeedback, 3000)
    return () => clearInterval(interval)
  }, [conversation, feedbackLoading, id])

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
    }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Conversation not found</h1>
          <Link href="/">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const scenario = getScenario(conversation.scenarioType)
  const feedback = conversation.feedback
  const totalDuration = conversation.duration || 180

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Conversation Review</h1>
          <p className="text-muted-foreground">
            {scenario?.name || conversation.scenarioType}
          </p>
        </div>
        {feedback && (
          <Badge
            className={`text-lg px-4 py-1 ${
              feedback.overallScore >= 80
                ? 'bg-green-100 text-green-800'
                : feedback.overallScore >= 60
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {feedback.overallScore}%
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - Transcript and Audio */}
        <div className="lg:col-span-2 space-y-6">
          {/* Audio player or Session Summary */}
          <Card>
            <CardContent className="p-6">
              {conversation.audioUrl ? (
                <>
                  <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg mb-4 flex flex-col items-center justify-center">
                    <audio
                      ref={audioRef}
                      src={conversation.audioUrl}
                      onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
                    />
                    <div className="text-white/60 text-center mb-4">
                      <p className="text-sm">Audio Recording</p>
                      <p className="text-xs mt-1">Click play to listen</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={togglePlayback}
                      className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
                    >
                      {isPlaying ? (
                        <>
                          <PauseCircle className="mr-2" size={18} />
                          Pause
                        </>
                      ) : (
                        <>
                          <PlayCircle className="mr-2" size={18} />
                          Play Recording
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(totalDuration)}</span>
                    </div>
                    <Progress value={(currentTime / totalDuration) * 100} className="h-2" />
                  </div>
                </>
              ) : (
                <div className="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-lg p-8">
                  <div className="grid grid-cols-2 gap-6 text-center">
                    <div>
                      <p className="text-3xl font-bold text-foreground">{formatTime(totalDuration)}</p>
                      <p className="text-sm text-muted-foreground mt-1">Duration</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">{conversation.messages.length}</p>
                      <p className="text-sm text-muted-foreground mt-1">Messages</p>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-sm text-muted-foreground">
                      Voice recording is available in a future update
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between mt-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1" disabled>
                    <Download size={16} />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1" disabled>
                    <Share2 size={16} />
                    Share
                  </Button>
                </div>
                <Link href={`/scenario/${conversation.scenarioType}/intro`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <RotateCcw size={16} />
                    Practice Again
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Transcript */}
          <Card>
            <CardHeader>
              <CardTitle>Conversation Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {conversation.messages.map((message) => (
                  <div key={message.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span
                        className={`font-medium ${
                          message.speaker === 'ai' ? 'text-rose-600' : 'text-blue-600'
                        }`}
                      >
                        {message.speaker === 'ai' ? 'Her' : 'You'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{message.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Feedback */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Conversation Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {feedback ? (
                <Tabs defaultValue="overview">
                  <TabsList className="mb-4 w-full">
                    <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                    <TabsTrigger value="metrics" className="flex-1">Metrics</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    {/* Overall score */}
                    <div>
                      <h3 className="font-medium mb-2">Overall Score</h3>
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center ${
                            feedback.overallScore >= 80
                              ? 'bg-green-100'
                              : feedback.overallScore >= 60
                              ? 'bg-amber-100'
                              : 'bg-rose-100'
                          }`}
                        >
                          <span
                            className={`text-xl font-bold ${
                              feedback.overallScore >= 80
                                ? 'text-green-600'
                                : feedback.overallScore >= 60
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {feedback.overallScore}%
                          </span>
                        </div>
                        <Progress value={feedback.overallScore} className="flex-1 h-2" />
                      </div>
                    </div>

                    {/* Strengths */}
                    <div>
                      <h3 className="font-medium mb-2 text-green-600">Strengths</h3>
                      <ul className="space-y-2">
                        {feedback.strengths.map((strength, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">+</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Areas for improvement */}
                    <div>
                      <h3 className="font-medium mb-2 text-amber-600">Areas for Growth</h3>
                      <ul className="space-y-2">
                        {feedback.improvements.map((improvement, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-amber-500 mt-0.5">→</span>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </TabsContent>

                  <TabsContent value="metrics" className="space-y-4">
                    {Object.entries(feedback.metrics).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-sm capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </h3>
                          <Badge variant="outline">{value}%</Badge>
                        </div>
                        <Progress value={value} className="h-2" />
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              ) : feedbackLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-rose-500" />
                  <p className="text-muted-foreground">Analyzing your conversation...</p>
                  <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {feedbackError ? (
                    <p className="text-amber-600 mb-2">{feedbackError}</p>
                  ) : conversation.messages.length === 0 ? (
                    <p>No transcript available for feedback generation.</p>
                  ) : (
                    <p>Feedback not yet generated.</p>
                  )}
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={generateFeedback}
                    disabled={feedbackLoading || conversation.messages.length === 0}
                  >
                    {feedbackLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Feedback'
                    )}
                  </Button>
                </div>
              )}

              {/* Level unlocked notification */}
              {levelUnlocked && scenario && scenario.level < getTotalLevels() && (
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Trophy className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">Level Unlocked!</span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                    You scored {conversation.feedback?.overallScore}% and unlocked the next level.
                  </p>
                  {getScenarioByLevel(scenario.level + 1) && (
                    <Link href={`/scenario/${getScenarioByLevel(scenario.level + 1)?.type}/intro`}>
                      <Button className="w-full gap-2" variant="default">
                        Continue to Level {scenario.level + 1}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              )}

              {/* Practice again button */}
              <div className="mt-8 pt-4 border-t">
                <Link href={`/scenario/${conversation.scenarioType}/intro`}>
                  <Button className="w-full" variant={levelUnlocked ? 'outline' : 'default'}>
                    Practice Again
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
