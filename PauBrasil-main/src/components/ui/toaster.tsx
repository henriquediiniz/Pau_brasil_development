'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  action?: { label: string; onClick: () => void }
}

let listeners: ((toast: Toast) => void)[] = []

export function toast(t: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  listeners.forEach(fn => fn({ ...t, id }))
}

const VARIANT_STYLES: Record<NonNullable<Toast['variant']>, string> = {
  default:     'bg-[#111118]/95 border-white/10 text-white',
  destructive: 'bg-red-950/90 border-red-500/30 text-red-200',
  success:     'bg-emerald-950/90 border-emerald-500/30 text-emerald-100',
  warning:     'bg-amber-950/90 border-amber-500/30 text-amber-100',
}

const VARIANT_ICONS: Record<NonNullable<Toast['variant']>, React.ReactNode> = {
  default:     <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />,
  destructive: <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />,
  success:     <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />,
  warning:     <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />,
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const fn = (t: Toast) => {
      setToasts(prev => [...prev.slice(-3), t])
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id))
      }, 4000)
    }
    listeners.push(fn)
    return () => { listeners = listeners.filter(l => l !== fn) }
  }, [])

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const variant = t.variant ?? 'default'
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md
                ${VARIANT_STYLES[variant]}`}
            >
              {VARIANT_ICONS[variant]}
              <div className="flex-1">
                <div className="text-sm font-medium">{t.title}</div>
                {t.description && <div className="text-xs opacity-70 mt-0.5">{t.description}</div>}
              </div>
              {t.action && (
                <button
                  onClick={() => { t.action!.onClick(); setToasts(prev => prev.filter(x => x.id !== t.id)) }}
                  className="shrink-0 text-xs font-semibold px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {t.action.label}
                </button>
              )}
              <button
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                className="text-current opacity-50 hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
