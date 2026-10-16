'use client'

import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'

/**
 * Dock de navegação, no estilo do dock do macOS: os itens crescem conforme o
 * ponteiro se aproxima.
 *
 * A ampliação é puramente decorativa — a navegação funciona igual no teclado,
 * no toque e com `prefers-reduced-motion` ligado, onde os itens simplesmente
 * não crescem. Cada item é um link de verdade, então abrir em nova aba e
 * navegar por Tab continuam funcionando.
 */

const TAMANHO_BASE = 42
const TAMANHO_AMPLIADO = 68
/** Distância em px, a partir do centro do item, em que a ampliação começa. */
const ALCANCE = 130

const MOLA = { mass: 0.1, stiffness: 150, damping: 12 } as const

interface ContextoDock {
  mouseX: MotionValue<number>
  ampliar: boolean
}

const DockContext = createContext<ContextoDock | null>(null)

function useDock() {
  const ctx = useContext(DockContext)
  if (!ctx) throw new Error('DockItem precisa estar dentro de <Dock>')
  return ctx
}

export function Dock({
  children,
  ariaLabel,
}: {
  children: ReactNode
  ariaLabel: string
}) {
  const mouseX = useMotionValue(Number.POSITIVE_INFINITY)
  const reduzirMovimento = useReducedMotion()

  return (
    <DockContext.Provider value={{ mouseX, ampliar: !reduzirMovimento }}>
      <nav
        aria-label={ariaLabel}
        /*
          `overflow-x-auto` mantém o dock utilizável no celular, onde os itens
          não cabem na largura da tela.

          O `sm:overflow-visible` não é enfeite: quando overflow-x é `auto` e
          overflow-y é `visible`, o CSS calcula overflow-y como `auto` também.
          O resultado é que o rótulo, que fica acima do item, era recortado
          pela própria caixa do dock — o tooltip existia e nunca aparecia.
          A partir de 640px os dez itens cabem (≈500px), então não há o que
          rolar e o recorte pode sair. Abaixo disso é toque, onde não há hover.
        */
        className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:overflow-visible"
      >
        <ul
          onMouseMove={(e) => mouseX.set(e.clientX)}
          onMouseLeave={() => mouseX.set(Number.POSITIVE_INFINITY)}
          className="mx-auto flex w-max items-end gap-1.5 rounded-2xl border border-white/8 bg-white/3 p-2 backdrop-blur-sm"
        >
          {children}
        </ul>
      </nav>
    </DockContext.Provider>
  )
}

export function DockItem({
  children,
  label,
}: {
  /** O link ou botão em si; ocupa todo o quadrado do item. */
  children: ReactNode
  label: string
}) {
  const { mouseX, ampliar } = useDock()
  const ref = useRef<HTMLLIElement>(null)
  const [comFoco, setComFoco] = useState(false)

  // Distância horizontal entre o ponteiro e o centro deste item.
  const distancia = useTransform(mouseX, (x) => {
    const caixa = ref.current?.getBoundingClientRect()
    if (!caixa) return Number.POSITIVE_INFINITY
    return x - caixa.x - caixa.width / 2
  })

  const tamanhoAlvo = useTransform(
    distancia,
    [-ALCANCE, 0, ALCANCE],
    [TAMANHO_BASE, TAMANHO_AMPLIADO, TAMANHO_BASE],
    { clamp: true }
  )
  const tamanho = useSpring(tamanhoAlvo, MOLA)

  return (
    <li
      ref={ref}
      className="relative flex shrink-0 items-end"
      onMouseEnter={() => setComFoco(true)}
      onMouseLeave={() => setComFoco(false)}
      onFocusCapture={() => setComFoco(true)}
      onBlurCapture={() => setComFoco(false)}
    >
      {/* O rótulo aparece no hover e também no foco por teclado. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-surface px-2 py-1 text-[11px] text-slate-200 shadow-lg transition-opacity duration-150 ${
          comFoco ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {label}
      </span>

      <motion.div
        style={ampliar ? { width: tamanho, height: tamanho } : undefined}
        className={
          ampliar
            ? 'flex items-center justify-center'
            : 'flex h-[42px] w-[42px] items-center justify-center'
        }
      >
        {children}
      </motion.div>
    </li>
  )
}
