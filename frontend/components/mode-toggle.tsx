'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Shuffle } from 'lucide-react'

export type GameMode = 'linear' | 'freeplay'

interface ModeToggleProps {
  onModeChange?: (mode: GameMode) => void
}

const MODE_STORAGE_KEY = 'mack-game-mode'

export function ModeToggle({ onModeChange }: ModeToggleProps) {
  const [mode, setMode] = useState<GameMode>('linear')

  // Load saved mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY) as GameMode
    if (savedMode && (savedMode === 'linear' || savedMode === 'freeplay')) {
      setMode(savedMode)
      onModeChange?.(savedMode)
    }
  }, [onModeChange])

  const handleModeChange = (newMode: string) => {
    const gameMode = newMode as GameMode
    setMode(gameMode)
    localStorage.setItem(MODE_STORAGE_KEY, gameMode)
    onModeChange?.(gameMode)
  }

  return (
    <Tabs value={mode} onValueChange={handleModeChange} className="w-auto">
      <TabsList className="grid w-full grid-cols-2 h-9">
        <TabsTrigger value="linear" className="flex items-center gap-1.5 text-xs px-3">
          <Trophy className="h-3.5 w-3.5" />
          <span>Linear</span>
        </TabsTrigger>
        <TabsTrigger value="freeplay" className="flex items-center gap-1.5 text-xs px-3">
          <Shuffle className="h-3.5 w-3.5" />
          <span>Free Play</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

// Hook to get/set game mode with localStorage persistence
export function useGameMode() {
  const [mode, setMode] = useState<GameMode>('linear')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY) as GameMode
    if (savedMode && (savedMode === 'linear' || savedMode === 'freeplay')) {
      setMode(savedMode)
    }
    setIsLoaded(true)
  }, [])

  const updateMode = (newMode: GameMode) => {
    setMode(newMode)
    localStorage.setItem(MODE_STORAGE_KEY, newMode)
  }

  return { mode, setMode: updateMode, isLoaded }
}
