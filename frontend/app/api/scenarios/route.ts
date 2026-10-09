import { NextResponse } from 'next/server'
import { getAllScenarios } from '@/lib/scenarios'

// GET /api/scenarios
// Public scenario fields for native clients. Prompts and hidden context stay on the server.
export async function GET() {
  const scenarios = getAllScenarios().map((s) => ({
    type: s.type,
    name: s.name,
    avatar: s.avatar,
    description: s.description,
    difficulty: s.difficulty,
    duration: s.duration,
    level: s.level,
    sceneNarrative: s.sceneNarrative,
    tips: s.tips,
    agentName: s.agentConfig.name,
  }))

  return NextResponse.json({ scenarios })
}
