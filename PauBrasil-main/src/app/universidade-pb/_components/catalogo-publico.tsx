'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Lock, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'

// videoUrl é intencionalmente excluído deste tipo — jamais chega ao componente
interface Episodio {
  id: string
  titulo: string
  descricao: string | null
  duracaoMin: number
  ordem: number
}

interface Temporada {
  id: string
  titulo: string
  descricao: string | null
  capa: string | null
  episodios: Episodio[]
}

interface Props {
  temporadas: Temporada[]
}

const FALLBACK_COLORS = ['#1a1a2e', '#0f3460', '#16213e', '#1b1b2e', '#0d1b2a', '#1a0a2e']

export function CatalogoPublico({ temporadas }: Props) {
  const [selected, setSelected] = useState<Temporada | null>(null)
  const selectedIndex = selected ? temporadas.findIndex(t => t.id === selected.id) : 0

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {temporadas.map((t, i) => {
          const totalMin = t.episodios.reduce((acc, e) => acc + e.duracaoMin, 0)
          return (
            <motion.button key={t.id} onClick={() => setSelected(t)}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="text-left rounded-2xl bg-white/3 border border-white/8 overflow-hidden hover:border-brand-500/30 hover:bg-white/5 transition-all group w-full">
              {/* Capa */}
              <div className="h-[240px] relative overflow-hidden rounded-t-2xl">
                {t.capa ? (
                  <Image
                    src={t.capa}
                    alt={t.titulo}
                    fill
                    unoptimized
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}>
                    <GraduationCap className="w-10 h-10 text-white/20" />
                  </div>
                )}
                {/* Badge episódios */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-xs text-white font-medium">
                  {t.episodios.length} ep.
                </div>
                {/* Cadeado central */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <Lock className="w-4 h-4 text-white/80" />
                  </div>
                </div>
              </div>
              {/* Body */}
              <div className="p-4">
                <h3 className="text-white font-display font-bold text-sm mb-1 group-hover:text-brand-400 transition-colors">{t.titulo}</h3>
                {t.descricao && (
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-2">{t.descricao}</p>
                )}
                {totalMin > 0 && (
                  <p className="text-slate-600 text-xs">{totalMin} min de conteúdo</p>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Modal de preview */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#111118] rounded-2xl border border-white/10 max-w-lg w-full overflow-hidden shadow-2xl">

              {/* Capa do modal */}
              <div className="h-[200px] relative">
                {selected.capa ? (
                  <Image
                    src={selected.capa}
                    alt={selected.titulo}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: FALLBACK_COLORS[selectedIndex % FALLBACK_COLORS.length] }}>
                    <GraduationCap className="w-16 h-16 text-white/20" />
                  </div>
                )}
                {/* Gradiente com título */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
                  <h2 className="text-white font-display font-bold text-lg leading-tight">{selected.titulo}</h2>
                  {selected.descricao && (
                    <p className="text-slate-300 text-xs mt-1 line-clamp-2">{selected.descricao}</p>
                  )}
                </div>
                {/* Botão fechar */}
                <button onClick={() => setSelected(null)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Lista de episódios */}
              <div className="divide-y divide-white/5">
                {selected.episodios.slice(0, 5).map((ep, idx) => (
                  <div key={ep.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-slate-600 text-xs w-5 text-right shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 text-sm truncate">{ep.titulo}</p>
                    </div>
                    <span className="text-slate-600 text-xs shrink-0">{ep.duracaoMin}min</span>
                    <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  </div>
                ))}
                {selected.episodios.length > 5 && (
                  <p className="px-5 py-3 text-xs text-slate-600">
                    +{selected.episodios.length - 5} episódio{selected.episodios.length - 5 !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* CTA */}
              <div className="p-5">
                <Link href="/login"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl gradient-brand text-white font-semibold shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 transition-all">
                  Fazer login para assistir <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
