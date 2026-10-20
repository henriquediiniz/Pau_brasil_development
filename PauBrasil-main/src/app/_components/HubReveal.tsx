'use client'

import { useEffect } from 'react'

/** Revela os blocos marcados com data-reveal conforme entram na tela. Sem JS, tudo aparece normalmente. */
export function HubReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const root = document.querySelector<HTMLElement>('[data-hub-root]')
    if (!root) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute('data-shown', '')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )
    root.setAttribute('data-reveal-ready', '')
    root
      .querySelectorAll<HTMLElement>('[data-reveal]')
      .forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [])
  return null
}
