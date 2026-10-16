'use client'

import { useEffect, useRef } from 'react'
import { useMotionValue, useInView, animate } from 'framer-motion'

function AnimatedCounter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionVal = useMotionValue(0)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  useEffect(() => {
    if (!inView) return
    const controls = animate(motionVal, to, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate(v) {
        if (ref.current) ref.current.textContent = Math.round(v).toLocaleString('pt-BR') + suffix
      },
    })
    return controls.stop
  }, [inView, motionVal, to, suffix])

  return <span ref={ref}>0{suffix}</span>
}

const STATS = [
  { to: 8,    suffix: '',  label: 'Empresas do grupo' },
  { to: 1200, suffix: '+', label: 'Colaboradores'     },
  { to: 30,   suffix: '+', label: 'Anos de história'  },
]

export function AnimatedStats() {
  return (
    <div className="grid grid-cols-3 gap-6 text-center">
      {STATS.map(stat => (
        <div key={stat.label}>
          <div className="text-4xl font-display font-black text-brand-400">
            <AnimatedCounter to={stat.to} suffix={stat.suffix} />
          </div>
          <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}
