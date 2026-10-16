'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FloatingItem { id: number; pts: number }

let _id = 0

export function useFloatingPoints() {
  const [items, setItems] = useState<FloatingItem[]>([])

  const fire = useCallback((pts: number) => {
    if (pts <= 0) return
    const id = ++_id
    setItems(prev => [...prev, { id, pts }])
    setTimeout(() => setItems(prev => prev.filter(i => i.id !== id)), 1400)
  }, [])

  return { items, fire }
}

export function FloatingPointsDisplay({ items }: { items: FloatingItem[] }) {
  return (
    <div className="fixed bottom-24 lg:bottom-8 right-5 z-50 pointer-events-none flex flex-col-reverse gap-1">
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 0, scale: 0.7 }}
            animate={{ opacity: 1, y: -32, scale: 1 }}
            exit={{ opacity: 0, y: -56, scale: 0.8 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="text-xl font-display font-black text-brand-400 drop-shadow-[0_0_12px_rgba(0,201,81,0.6)]"
          >
            +{item.pts} pts
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
