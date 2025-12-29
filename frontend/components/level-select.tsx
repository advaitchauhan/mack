'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  PlayCircle,
  Lock,
  CheckCircle2,
  Clock,
  ChevronRight,
  Trophy
} from 'lucide-react'
import { getProgressionScenarios, ScenarioConfig, getTotalLevels } from '@/lib/scenarios'

// Types for progress tracking
export interface LevelProgress {
  completed: boolean
  bestScore: number | null
}

export interface UserProgress {
  currentLevel: number
  levels: Record<number, LevelProgress>
}

const PROGRESS_STORAGE_KEY = 'mack-user-progress'
const UNLOCK_THRESHOLD = 60

// Get initial progress state
function getInitialProgress(): UserProgress {
  return {
    currentLevel: 1,
    levels: {}
  }
}

// Hook to manage user progress
export function useUserProgress() {
  const [progress, setProgress] = useState<UserProgress>(getInitialProgress())
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(PROGRESS_STORAGE_KEY)
    if (saved) {
      try {
        setProgress(JSON.parse(saved))
      } catch {
        setProgress(getInitialProgress())
      }
    }
    setIsLoaded(true)
  }, [])

  const updateProgress = (newProgress: UserProgress) => {
    setProgress(newProgress)
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(newProgress))
  }

  const completeLevel = (level: number, score: number) => {
    const newProgress = { ...progress }
    const currentLevelProgress = newProgress.levels[level] || { completed: false, bestScore: null }

    // Update best score if this is better
    if (currentLevelProgress.bestScore === null || score > currentLevelProgress.bestScore) {
      currentLevelProgress.bestScore = score
    }

    // Mark as completed if score meets threshold
    if (score >= UNLOCK_THRESHOLD) {
      currentLevelProgress.completed = true

      // Unlock next level if this is the current level
      if (level === newProgress.currentLevel && level < getTotalLevels()) {
        newProgress.currentLevel = level + 1
      }
    }

    newProgress.levels[level] = currentLevelProgress
    updateProgress(newProgress)
  }

  const isLevelUnlocked = (level: number): boolean => {
    return level <= progress.currentLevel
  }

  const isLevelCompleted = (level: number): boolean => {
    return progress.levels[level]?.completed || false
  }

  const getLevelScore = (level: number): number | null => {
    return progress.levels[level]?.bestScore || null
  }

  return {
    progress,
    isLoaded,
    completeLevel,
    isLevelUnlocked,
    isLevelCompleted,
    getLevelScore,
    currentLevel: progress.currentLevel
  }
}

// Difficulty indicator component
function DifficultyDots({ score }: { score: number }) {
  const dots = Math.min(5, Math.ceil(score / 2))
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= dots ? 'bg-rose-500' : 'bg-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  )
}

// Progress bar for level completion
function LevelProgressBar({
  currentLevel,
  totalLevels,
  completedLevels
}: {
  currentLevel: number
  totalLevels: number
  completedLevels: number
}) {
  const progressPercent = (completedLevels / totalLevels) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Progress</span>
        <span className="font-medium">{completedLevels} / {totalLevels} levels</span>
      </div>
      <Progress value={progressPercent} className="h-2" />
    </div>
  )
}

// Main level select component
export function LevelSelect() {
  const {
    isLoaded,
    isLevelUnlocked,
    isLevelCompleted,
    getLevelScore,
    currentLevel
  } = useUserProgress()

  const scenarios = getProgressionScenarios()
  const totalLevels = scenarios.length
  const completedLevels = scenarios.filter(s => isLevelCompleted(s.level)).length

  // Get the current scenario to feature
  const currentScenario = scenarios.find(s => s.level === currentLevel) || scenarios[0]

  if (!isLoaded) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-48 bg-muted rounded-2xl" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress overview */}
      <LevelProgressBar
        currentLevel={currentLevel}
        totalLevels={totalLevels}
        completedLevels={completedLevels}
      />

      {/* Current level feature card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 p-6 text-white">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-0">
                Level {currentLevel} of {totalLevels}
              </Badge>
              {completedLevels === totalLevels && (
                <Badge className="bg-yellow-400/90 text-yellow-900 border-0">
                  <Trophy className="h-3 w-3 mr-1" />
                  Complete!
                </Badge>
              )}
            </div>
            <h2 className="text-2xl font-bold">{currentScenario.name}</h2>
            <p className="text-white/90 max-w-md text-sm">
              {currentScenario.description}
            </p>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {currentScenario.duration}
              </div>
              <div className="flex items-center gap-1">
                Difficulty: <DifficultyDots score={currentScenario.difficultyScore} />
              </div>
            </div>
          </div>
          <Link href={`/scenario/${currentScenario.type}/intro`}>
            <Button size="lg" variant="secondary" className="gap-2 shadow-lg">
              <PlayCircle size={20} />
              {currentLevel === 1 ? 'Start Level 1' : 'Continue'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Level list */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">All Levels</h3>
        {scenarios.map((scenario) => {
          const unlocked = isLevelUnlocked(scenario.level)
          const completed = isLevelCompleted(scenario.level)
          const score = getLevelScore(scenario.level)
          const isCurrent = scenario.level === currentLevel

          return (
            <Card
              key={scenario.type}
              className={`transition-all ${
                unlocked
                  ? 'hover:shadow-md cursor-pointer'
                  : 'opacity-60'
              } ${isCurrent ? 'ring-2 ring-rose-500' : ''}`}
            >
              <div className="flex items-center p-4 gap-4">
                {/* Level number / status */}
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
                  ${completed
                    ? 'bg-green-100 text-green-600'
                    : unlocked
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {completed ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : unlocked ? (
                    <span className="text-lg font-bold">{scenario.level}</span>
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                </div>

                {/* Scenario info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">{scenario.name}</h4>
                    {isCurrent && !completed && (
                      <Badge variant="outline" className="text-xs">Current</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {scenario.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <DifficultyDots score={scenario.difficultyScore} />
                    {score !== null && (
                      <span className="text-xs text-muted-foreground">
                        Best: {score}/100
                      </span>
                    )}
                  </div>
                </div>

                {/* Action */}
                <div className="flex-shrink-0">
                  {unlocked ? (
                    <Link href={`/scenario/${scenario.type}/intro`}>
                      <Button variant={isCurrent ? 'default' : 'ghost'} size="sm">
                        {completed ? 'Replay' : 'Play'}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="ghost" size="sm" disabled>
                      <Lock className="h-4 w-4 mr-1" />
                      Locked
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Unlock info */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <p>
          Score <span className="font-medium text-foreground">{UNLOCK_THRESHOLD}+</span> to unlock the next level.
          Higher scores mean better performance!
        </p>
      </div>
    </div>
  )
}
