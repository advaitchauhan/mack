'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, PhoneOff, Volume2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AvatarDisplay } from '@/components/avatar-display'
import { getScenario } from '@/lib/scenarios'
import { useRouter } from 'next/navigation'
import { Conversation } from '@elevenlabs/client'

interface VoiceConversationProps {
  scenarioType: string
}

type ConversationStatus = 'idle' | 'connecting' | 'connected' | 'error'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export function VoiceConversation({ scenarioType }: VoiceConversationProps) {
  const router = useRouter()
  const scenario = getScenario(scenarioType)

  const [status, setStatus] = useState<ConversationStatus>('idle')
  const [mode, setMode] = useState<'listening' | 'speaking'>('listening')
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [duration, setDuration] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)

  const conversationRef = useRef<Conversation | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Start the duration timer
  useEffect(() => {
    if (status === 'connected') {
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [status])

  // Start conversation
  const startConversation = useCallback(async () => {
    setStatus('connecting')
    setError(null)

    try {
      // Get signed URL from our API
      const response = await fetch('/api/elevenlabs/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioType }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to get signed URL')
      }

      const { signedUrl, scenario: scenarioConfig } = await response.json()

      // Start ElevenLabs conversation session with scenario-specific prompt
      const conversation = await Conversation.startSession({
        signedUrl,
        overrides: {
          agent: {
            prompt: {
              prompt: scenarioConfig.systemPrompt,
            },
          },
        },
        onConnect: ({ conversationId }) => {
          console.log('Connected to ElevenLabs:', conversationId)
          setStatus('connected')
        },
        onDisconnect: (details) => {
          console.log('Disconnected:', details)
          if (details.reason === 'error') {
            setError(details.message)
            setStatus('error')
          }
        },
        onError: (message, context) => {
          console.error('ElevenLabs error:', message, context)
          setError(message)
        },
        onMessage: ({ message, role }) => {
          console.log('Message:', role, message)
          setMessages(prev => [...prev, {
            role: role === 'user' ? 'user' : 'assistant',
            content: message,
            timestamp: Math.floor((Date.now() - startTimeRef.current) / 1000),
          }])
        },
        onModeChange: ({ mode: newMode }) => {
          console.log('Mode changed:', newMode)
          setMode(newMode)
        },
        onStatusChange: ({ status: newStatus }) => {
          console.log('Status changed:', newStatus)
          if (newStatus === 'connected') {
            setStatus('connected')
          } else if (newStatus === 'connecting') {
            setStatus('connecting')
          } else if (newStatus === 'disconnected') {
            setStatus('idle')
          }
        },
      })

      conversationRef.current = conversation
    } catch (err) {
      console.error('Error starting conversation:', err)
      setError(err instanceof Error ? err.message : 'Failed to start conversation')
      setStatus('error')
    }
  }, [scenarioType])

  const [isEnding, setIsEnding] = useState(false)

  // End conversation
  const endConversation = useCallback(async () => {
    if (isEnding) return // Prevent double-clicks
    setIsEnding(true)

    // End the ElevenLabs session
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession()
      } catch (err) {
        console.error('Error ending ElevenLabs session:', err)
      }
      conversationRef.current = null
    }

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Save conversation to database
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioType,
          startedAt: new Date(startTimeRef.current || Date.now()).toISOString(),
        }),
      })

      if (response.ok) {
        const conversation = await response.json()

        // Update with messages and duration
        await fetch(`/api/conversations/${conversation.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endedAt: new Date().toISOString(),
            duration,
            messages: messages.map(m => ({
              speaker: m.role === 'user' ? 'user' : 'ai',
              content: m.content,
              timestamp: m.timestamp,
            })),
          }),
        })

        // Generate feedback in background (don't wait for it)
        if (messages.length > 0) {
          fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversationId: conversation.id,
              transcript: messages.map(m => ({
                speaker: m.role === 'user' ? 'You' : 'Her',
                content: m.content,
              })),
              scenarioType,
            }),
          }).catch(err => console.error('Error generating feedback:', err))
        }

        router.push(`/review/${conversation.id}`)
        return
      }
    } catch (err) {
      console.error('Error saving conversation:', err)
    }

    // Fallback to mock review
    router.push(`/review/conv-${Date.now()}`)
  }, [scenarioType, messages, duration, router, scenario, isEnding])

  // Toggle microphone
  const toggleMic = useCallback(() => {
    if (conversationRef.current) {
      const newMuted = !isMicMuted
      conversationRef.current.setMicMuted(newMuted)
      setIsMicMuted(newMuted)
    }
  }, [isMicMuted])

  if (!scenario) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Scenario not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="text-white">
            <h1 className="text-lg font-semibold">{scenario.name}</h1>
            <p className="text-sm text-white/60">Practice Session</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Duration */}
          {status === 'connected' && (
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-sm">{formatDuration(duration)}</span>
            </div>
          )}

          {/* End button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={endConversation}
            disabled={isEnding}
            className="gap-2"
          >
            {isEnding ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <PhoneOff size={16} />
                End
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative">
        {/* Error message */}
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Instructions overlay */}
        <AnimatePresence>
          {status === 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10"
            >
              <div className="text-center max-w-md p-8">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <Mic className="w-8 h-8 text-rose-500" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  Start the Conversation
                </h2>
                <p className="text-white/70 mb-6">
                  You'll need to approach and initiate the conversation.
                  Speak naturally as if you're really there.
                </p>
                <Button size="lg" onClick={startConversation} className="gap-2">
                  <Mic size={18} />
                  Begin Speaking
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connecting overlay */}
        <AnimatePresence>
          {status === 'connecting' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10"
            >
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/70">Connecting...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar */}
        <AvatarDisplay
          src={scenario.avatar}
          name="Her"
          isSpeaking={mode === 'speaking'}
          isListening={mode === 'listening' && status === 'connected'}
        />

        {/* Status indicator */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {status === 'connected' && (
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center gap-3"
              >
                {mode === 'listening' && (
                  <>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-green-500 rounded-full"
                          animate={{
                            height: ['4px', '20px', '4px'],
                          }}
                          transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            delay: i * 0.1,
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-green-400">Listening to you...</p>
                  </>
                )}
                {mode === 'speaking' && (
                  <>
                    <Volume2 className="w-5 h-5 text-rose-500" />
                    <p className="text-rose-400">Speaking...</p>
                  </>
                )}
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-400">Connection error</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tips */}
        <div className="absolute bottom-24 left-8 right-8 md:left-auto md:right-8 md:w-64">
          <div className="bg-white/5 backdrop-blur rounded-lg p-4 text-sm text-white/60">
            <p className="font-medium text-white/80 mb-2">Tips</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Be genuine and confident</li>
              <li>Ask open-ended questions</li>
              <li>Listen and respond naturally</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Bottom controls */}
      <footer className="px-6 py-4 border-t border-white/10">
        <div className="flex items-center justify-center gap-4">
          {/* Mute button */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMic}
            disabled={status !== 'connected'}
            className={`rounded-full w-14 h-14 ${
              isMicMuted ? 'bg-red-500 border-red-500 text-white hover:bg-red-600' : ''
            }`}
          >
            {isMicMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </Button>
        </div>
      </footer>
    </div>
  )
}
