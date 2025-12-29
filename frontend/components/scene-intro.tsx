'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { getScenario } from '@/lib/scenarios'
import { Button } from '@/components/ui/button'
import { Check, X, Lightbulb, MessageCircle } from 'lucide-react'

interface SceneIntroProps {
  scenarioType: string
}

// Feature flags
const SHOW_COUNTDOWN_TIPS = false // Set to true to show tips on countdown screen

type Phase = 'narrative' | 'countdown'

export function SceneIntro({ scenarioType }: SceneIntroProps) {
  const router = useRouter()
  const scenario = getScenario(scenarioType)

  const [currentLine, setCurrentLine] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [phase, setPhase] = useState<Phase>('narrative')
  const [countdown, setCountdown] = useState(5)
  const [isComplete, setIsComplete] = useState(false)

  // Handle the transition to conversation
  const startConversation = useCallback(() => {
    setIsComplete(true)
    // Small delay for the fade-out animation
    setTimeout(() => {
      router.push(`/scenario/${scenarioType}/conversation`)
    }, 500)
  }, [router, scenarioType])

  const [isLineComplete, setIsLineComplete] = useState(false)

  // Typewriter effect for current line
  useEffect(() => {
    if (!scenario || phase !== 'narrative') return

    if (currentLine >= scenario.sceneNarrative.length) {
      // All lines done, go to countdown with tips
      setTimeout(() => setPhase('countdown'), 500)
      return
    }

    const line = scenario.sceneNarrative[currentLine]
    let charIndex = 0
    setDisplayedText('')
    setIsLineComplete(false)

    const interval = setInterval(() => {
      if (charIndex < line.length) {
        setDisplayedText(line.slice(0, charIndex + 1))
        charIndex++
      } else {
        clearInterval(interval)
        setIsLineComplete(true)
      }
    }, 20) // 20ms per character - faster typewriter

    return () => clearInterval(interval)
  }, [currentLine, scenario, phase])

  // Go to next line
  const handleNextLine = () => {
    if (!scenario) return

    if (currentLine < scenario.sceneNarrative.length - 1) {
      setCurrentLine(prev => prev + 1)
    } else {
      setPhase('countdown')
    }
  }

  // Skip to end of current line (show full text immediately)
  const handleSkipToEnd = () => {
    if (!scenario || phase !== 'narrative') return
    setDisplayedText(scenario.sceneNarrative[currentLine])
    setIsLineComplete(true)
  }

  // Countdown timer - starts immediately when entering countdown phase
  useEffect(() => {
    if (phase !== 'countdown') return

    if (countdown === 0) {
      startConversation()
      return
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [phase, countdown, startConversation])

  if (!scenario) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Scenario not found</p>
      </div>
    )
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: isComplete ? 0 : 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-3xl w-full">
        <AnimatePresence mode="wait">
          {phase === 'narrative' && (
            <motion.div
              key="narrative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8 text-center cursor-pointer"
              onClick={isLineComplete ? handleNextLine : handleSkipToEnd}
            >
              {/* Progress dots */}
              <div className="flex justify-center gap-2 mb-8">
                {scenario.sceneNarrative.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index < currentLine
                        ? 'bg-rose-500'
                        : index === currentLine
                        ? 'bg-rose-400 animate-pulse'
                        : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              {/* Narrative text */}
              <p className="text-2xl md:text-3xl text-white font-light leading-relaxed min-h-[6rem]">
                {displayedText}
                {!isLineComplete && <span className="animate-pulse text-rose-400">|</span>}
              </p>

              {/* Next button / hint */}
              <div className="pt-6">
                {isLineComplete ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNextLine()
                      }}
                      className="text-white/70 hover:text-white hover:bg-white/10 gap-2"
                    >
                      {currentLine < scenario.sceneNarrative.length - 1 ? 'Next' : 'Continue'}
                      <span className="text-rose-400">→</span>
                    </Button>
                    <p className="text-xs text-white/30">or click anywhere</p>
                  </motion.div>
                ) : (
                  <p className="text-xs text-white/30">click to skip</p>
                )}
              </div>

              {/* Scenario name */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-sm uppercase tracking-widest text-rose-400/80">
                  {scenario.name}
                </p>
              </div>
            </motion.div>
          )}

          {phase === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className={SHOW_COUNTDOWN_TIPS ? "flex flex-col lg:flex-row gap-8 items-center" : "flex items-center justify-center"}
            >
              {/* Left side - Tips (only if feature flag is on) */}
              {SHOW_COUNTDOWN_TIPS && (
                <div className="flex-1 space-y-6 max-w-md">
                  {/* Header */}
                  <div className="text-center lg:text-left">
                    <p className="text-white/60 text-sm uppercase tracking-wider mb-2">Remember</p>
                    <h2 className="text-2xl font-semibold text-white">
                      <span className="text-rose-400">You</span> start the conversation
                    </h2>
                  </div>

                  {/* Opening Lines */}
                  <div className="bg-white/5 backdrop-blur rounded-xl p-5 border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageCircle className="w-4 h-4 text-rose-400" />
                      <h3 className="text-sm font-medium text-white/80">Example Openers</h3>
                    </div>
                    <div className="space-y-2">
                      {scenario.tips.openingLines.slice(0, 2).map((line, index) => (
                        <motion.p
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + index * 0.1 }}
                          className="text-sm text-white/60 italic"
                        >
                          "{line}"
                        </motion.p>
                      ))}
                    </div>
                  </div>

                  {/* Quick Do's and Don'ts */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs font-medium text-green-400">Do</span>
                      </div>
                      <ul className="space-y-1">
                        {scenario.tips.doList.slice(0, 2).map((item, index) => (
                          <li key={index} className="text-xs text-white/60">• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                      <div className="flex items-center gap-1.5 mb-2">
                        <X className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-xs font-medium text-red-400">Don't</span>
                      </div>
                      <ul className="space-y-1">
                        {scenario.tips.dontList.slice(0, 2).map((item, index) => (
                          <li key={index} className="text-xs text-white/60">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Pro tip */}
                  <div className="flex items-start gap-2 text-xs text-amber-200/60">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p>Speak naturally. Don't memorize - be authentic.</p>
                  </div>
                </div>
              )}

              {/* Countdown */}
              <div className={SHOW_COUNTDOWN_TIPS ? "flex-1 flex flex-col items-center justify-center" : "flex flex-col items-center justify-center"}>
                <motion.div className="text-center space-y-6">
                  <motion.p
                    className="text-xl md:text-2xl text-white/80 font-light"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    You're approaching...
                  </motion.p>

                  {/* Avatar with pulse effect */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-52 h-52 rounded-full border-2 border-rose-500/30 animate-ping" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 rounded-full border-2 border-rose-500/50 animate-pulse" />
                    </div>
                    <div className="relative w-44 h-44 rounded-full overflow-hidden border-4 border-white/20 mx-auto">
                      <Image
                        src={scenario.avatar}
                        alt="Person you're approaching"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </motion.div>

                  {/* Countdown number */}
                  <motion.div
                    key={countdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
                  >
                    <p className="text-7xl md:text-8xl font-bold text-white">
                      {countdown}
                    </p>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip button (small, subtle) - only during narrative */}
        {phase === 'narrative' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            onClick={() => setPhase('countdown')}
            className="fixed bottom-8 right-8 text-sm text-white/30 hover:text-white/60 transition-colors"
          >
            Skip intro →
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
