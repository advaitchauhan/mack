'use client'

import { useParams } from 'next/navigation'
import { VoiceConversation } from '@/components/voice-conversation'

export default function ConversationPage() {
  const params = useParams()
  const scenarioType = params.type as string

  return <VoiceConversation scenarioType={scenarioType} />
}
