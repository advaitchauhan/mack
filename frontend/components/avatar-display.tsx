'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

interface AvatarDisplayProps {
  src: string
  name: string
  isSpeaking: boolean
  isListening?: boolean
  className?: string
}

export function AvatarDisplay({
  src,
  name,
  isSpeaking,
  isListening,
  className,
}: AvatarDisplayProps) {
  return (
    <div className={cn('relative flex flex-col items-center gap-4', className)}>
      {/* Avatar container */}
      <div className="relative">
        {/* Outer pulse rings when speaking */}
        <AnimatePresence>
          {isSpeaking && (
            <>
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-rose-500/30"
              />
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.3, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                className="absolute inset-0 rounded-full bg-rose-500/20"
              />
            </>
          )}
        </AnimatePresence>

        {/* Main avatar image */}
        <motion.div
          animate={{
            scale: isSpeaking ? [1, 1.02, 1] : 1,
            boxShadow: isSpeaking
              ? '0 0 40px rgba(244, 63, 94, 0.5)'
              : '0 0 0px rgba(244, 63, 94, 0)',
          }}
          transition={{
            scale: { duration: 0.5, repeat: isSpeaking ? Infinity : 0 },
            boxShadow: { duration: 0.3 },
          }}
          className={cn(
            'relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 transition-colors duration-300',
            isSpeaking ? 'border-rose-500' : 'border-white/20'
          )}
        >
          <Image
            src={src}
            alt={name}
            fill
            className="object-cover"
            priority
          />
        </motion.div>

        {/* Speaking indicator */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2"
            >
              <div className="flex items-center gap-1 bg-rose-500 px-3 py-1 rounded-full">
                <div className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-white rounded-full"
                      animate={{
                        height: ['8px', '16px', '8px'],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs text-white font-medium ml-1">Speaking</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Name and status */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white">{name}</h2>
        <motion.p
          className="text-sm text-white/60 mt-1"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Waiting to start'}
        </motion.p>
      </div>
    </div>
  )
}
