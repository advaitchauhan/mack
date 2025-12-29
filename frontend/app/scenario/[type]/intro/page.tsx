'use client'

import { useParams } from 'next/navigation'
import { SceneIntro } from '@/components/scene-intro'

export default function IntroPage() {
  const params = useParams()
  const scenarioType = params.type as string

  return <SceneIntro scenarioType={scenarioType} />
}
