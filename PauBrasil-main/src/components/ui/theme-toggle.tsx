'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const OPTIONS = [
  { value: 'light',  label: 'Claro',   Icon: Sun },
  { value: 'dark',   label: 'Escuro',  Icon: Moon },
  { value: 'system', label: 'Sistema', Icon: Monitor },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!mounted) return <div className="w-8 h-8" />

  const current = OPTIONS.find(o => o.value === theme) ?? OPTIONS[1]
  const CurrentIcon = current.Icon

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        title="Tema"
      >
        <CurrentIcon className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-10 w-36 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-50 py-1"
          >
            {OPTIONS.map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => { setTheme(value); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors
                  ${theme === value
                    ? 'text-brand-400 bg-brand-500/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
