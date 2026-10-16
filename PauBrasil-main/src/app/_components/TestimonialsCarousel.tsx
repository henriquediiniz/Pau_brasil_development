'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'

type Depoimento = {
  nome: string
  cargo: string
  empresa: string
  texto: string
  iniciais: string
  cor: string
}

const DEPOIMENTOS: Depoimento[] = [
  {
    nome: 'Thiago Félix',
    cargo: 'Coordenador Financeiro',
    empresa: 'Grupo Pau Brasil',
    texto: 'Comecei como jovem aprendiz e, cinco meses depois, já surgiu minha primeira oportunidade de crescimento. De analista de preço fui para coordenador de distribuição e hoje sou coordenador financeiro. A Pau Brasil soube enxergar meu potencial e me desenvolveu tanto profissional quanto pessoalmente.',
    iniciais: 'TF',
    cor: 'from-brand-500 to-brand-700',
  },
  {
    nome: 'Marcos Augusto',
    cargo: 'Gerente de Operações (GOD)',
    empresa: 'Patos',
    texto: 'Comecei como jovem aprendiz fazendo rota de bicicleta como promotor. Dez anos como GOD em Sousa construíram minha base de liderança. Hoje estou à frente das operações em Patos. A Pau Brasil não apenas contrata talentos: ela os lapida.',
    iniciais: 'MA',
    cor: 'from-purple-500 to-purple-700',
  },
  {
    nome: 'Marcos Guilherme',
    cargo: 'Gerente de Operações (GOD)',
    empresa: 'Guarabira',
    texto: 'Da puxada como jovem aprendiz, passei a coordenador de distribuição, depois coordenador financeiro. Hoje sou GOD em Guarabira. A Pau Brasil encontra diamantes brutos no sertão do Nordeste e os transforma em líderes de verdade.',
    iniciais: 'MG',
    cor: 'from-emerald-500 to-emerald-700',
  },
  {
    nome: 'Valdenio Freire',
    cargo: 'Diretor Financeiro e Sócio',
    empresa: 'Guarabira',
    texto: 'Comecei como analista, me tornei coordenador, depois gerente. Hoje sou Diretor Financeiro e sócio da operação em Guarabira. Joias encontradas no sertão do Nordeste para o mundo corporativo brasileiro: isso é o que a Pau Brasil faz com quem tem vontade de crescer.',
    iniciais: 'VF',
    cor: 'from-amber-500 to-orange-600',
  },
]

const INTERVAL = 6000

export function TestimonialsCarousel() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [direction, setDirection] = useState(1)

  const go = useCallback((next: number, dir: number) => {
    setDirection(dir)
    setCurrent(next)
  }, [])

  const prev = useCallback(() => {
    go((current - 1 + DEPOIMENTOS.length) % DEPOIMENTOS.length, -1)
  }, [current, go])

  const next = useCallback(() => {
    go((current + 1) % DEPOIMENTOS.length, 1)
  }, [current, go])

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      setDirection(1)
      setCurrent(c => (c + 1) % DEPOIMENTOS.length)
    }, INTERVAL)
    return () => clearInterval(id)
  }, [paused])

  const d = DEPOIMENTOS[current]

  return (
    <div
      className="relative max-w-2xl mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Card */}
      <div className="overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="rounded-2xl bg-white/3 border border-white/8 p-8 flex flex-col gap-5"
          >
            <Quote className="w-7 h-7 text-brand-500/40" aria-hidden="true" />
            <p className="text-slate-200 text-base leading-relaxed flex-1">&quot;{d.texto}&quot;</p>
            <div className="flex items-center gap-4 pt-4 border-t border-white/8">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${d.cor} flex items-center justify-center shrink-0`}>
                <span className="text-white font-bold text-sm">{d.iniciais}</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{d.nome}</div>
                <div className="text-xs text-slate-500">{d.cargo} · {d.empresa}</div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          type="button"
          onClick={prev}
          className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label="Depoimento anterior"
        >
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>

        <div className="flex gap-2" role="tablist" aria-label="Selecionar depoimento">
          {DEPOIMENTOS.map((dep, i) => (
            <button
              key={dep.nome}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`Depoimento de ${dep.nome}`}
              onClick={() => go(i, i > current ? 1 : -1)}
              className={`rounded-full transition-all ${
                i === current
                  ? 'w-5 h-2 bg-brand-400'
                  : 'w-2 h-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={next}
          className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label="Próximo depoimento"
        >
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  )
}
