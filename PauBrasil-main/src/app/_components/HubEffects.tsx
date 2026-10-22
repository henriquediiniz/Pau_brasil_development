'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import styles from './Hub.module.css'

// useLayoutEffect evita mostrar o valor final por um quadro antes da contagem; no servidor cai para useEffect.
const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect

/** Número que conta de 0 até o valor quando aparece na tela. O HTML do servidor já traz o valor final. */
export function HubCountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value)
  const ref = useRef<HTMLSpanElement>(null)

  useBeforePaint(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const element = ref.current
    if (!element) return
    setShown(0)
    let frame = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const duration = 1400
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setShown(Math.round(eased * value))
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [value])

  return (
    <>
      <span ref={ref} className={styles.countUp} aria-hidden="true">
        {shown.toLocaleString('pt-BR')}
      </span>
      <span className={styles.srOnly}>{value.toLocaleString('pt-BR')}</span>
    </>
  )
}

/** Brilho suave que acompanha o cursor no hero. Só em dispositivos com mouse. */
export function HubHeroGlow() {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const glow = ref.current
    const hero = glow?.parentElement
    if (!glow || !hero) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const box = hero.getBoundingClientRect()
        glow.style.setProperty('--gx', `${event.clientX - box.left}px`)
        glow.style.setProperty('--gy', `${event.clientY - box.top}px`)
        glow.dataset.active = 'true'
      })
    }
    const onLeave = () => {
      glow.dataset.active = 'false'
    }
    hero.addEventListener('pointermove', onMove)
    hero.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      hero.removeEventListener('pointermove', onMove)
      hero.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return <span ref={ref} className={styles.heroGlow} aria-hidden="true" />
}
