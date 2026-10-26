import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Prende o foco dentro de `containerRef` enquanto o overlay está montado.
 *
 * Comportamento:
 *   - Ao abrir: salva o elemento que tinha foco e move o foco para o primeiro
 *     elemento focável dentro do container.
 *   - Tab / Shift+Tab: circula dentro do container sem escapar.
 *   - Escape: chama `onClose`.
 *   - Ao fechar (unmount): devolve o foco ao elemento que estava ativo antes.
 *
 * Uso:
 *   const containerRef = useRef<HTMLDivElement>(null)
 *   useFocusTrap(containerRef, isOpen, onClose)
 *   <div ref={containerRef} role="dialog" aria-modal="true">...</div>
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose: () => void,
) {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement as HTMLElement

    // Foca o primeiro elemento focável no próximo tick para garantir que a
    // animação de entrada (Framer Motion) já iniciou o mount do DOM.
    const rafId = requestAnimationFrame(() => {
      const first = containerRef.current
        ?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)[0]
      first?.focus()
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
        return
      }

      if (e.key !== 'Tab') return

      const focusable = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS) ?? [],
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last  = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('keydown', handleKeyDown)
      previousFocusRef.current?.focus()
    }
  }, [isOpen, onClose, containerRef])
}
