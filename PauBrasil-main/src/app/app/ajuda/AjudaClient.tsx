'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HelpCircle, Search, GraduationCap, ChevronDown, BookOpen, Shield, Clock,
  AlertCircle, X, ArrowRight, Lightbulb, FileText,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Guia { titulo: string; descricao: string; badge?: string }
interface FaqItem { pergunta: string; resposta: string }
interface Politica { titulo: string; detalhe: string; icone?: 'clock' | 'shield' | 'alert' }

interface Modulo {
  id: string
  titulo: string
  descricao: string
  icon: React.ElementType
  color: string
  borderColor: string
  bgColor: string
  textColor: string
  guias: Guia[]
  faq: FaqItem[]
  politicas: Politica[]
}

// ─── Conteúdo ─────────────────────────────────────────────────────────────────

const MODULOS: Modulo[] = [
  {
    id: 'upb',
    titulo: 'Universidade Pau Brasil',
    descricao: 'Acesse cursos, assista episódios, faça quizzes e conquiste certificados.',
    icon: GraduationCap,
    color: 'sky',
    borderColor: 'border-sky-500/30',
    bgColor: 'bg-sky-500/10',
    textColor: 'text-sky-400',
    guias: [
      { titulo: 'Acessar seus cursos', descricao: 'Clique em "Universidade" na sidebar. Você verá todos os cursos disponíveis para sua empresa/função. Cursos com cadeado exigem matrícula aprovada.' },
      { titulo: 'Assistir episódios', descricao: 'Abra um curso e clique em um episódio. Após assistir, marque como concluído. O progresso é salvo automaticamente.' },
      { titulo: 'Fazer o quiz', descricao: 'Ao concluir todos os episódios de uma temporada, o quiz é liberado. Responda todas as questões e envie. A nota mínima para certificação é 70%.' },
      { titulo: 'Emitir o certificado', descricao: 'Ao passar no quiz, o certificado é emitido automaticamente. Acesse em "Meus Certificados" na página da Universidade.' },
      { titulo: 'Cursos obrigatórios', descricao: 'Sua empresa pode marcar cursos como obrigatórios com prazo. Você receberá notificação. O não-cumprimento dentro do prazo é reportado ao gestor.', badge: 'Obrigatório' },
    ],
    faq: [
      { pergunta: 'Quantas tentativas tenho no quiz?', resposta: 'O número de tentativas pode variar por curso. Cada tentativa é registrada. Após esgotar as tentativas, aguarde liberação do admin.' },
      { pergunta: 'O certificado tem validade?', resposta: 'Depende da configuração do curso. Cursos com validade mostram a data de expiração no certificado. Após expirar, é necessário refazer o curso.' },
      { pergunta: 'Posso acessar cursos fora da minha empresa?', resposta: 'Não. Cursos com restrição de acesso são visíveis apenas para as empresas/funções configuradas pelo admin.' },
      { pergunta: 'Preciso assistir todos os episódios para fazer o quiz?', resposta: 'Sim. O quiz só é liberado após todos os episódios da temporada serem marcados como concluídos.' },
    ],
    politicas: [
      { titulo: 'Nota mínima para certificação', detalhe: 'É necessário acertar pelo menos 70% das questões do quiz para obter o certificado.', icone: 'shield' },
      { titulo: 'Pré-requisitos', detalhe: 'Alguns cursos exigem que outros sejam concluídos antes. Verifique os pré-requisitos na descrição do curso.', icone: 'alert' },
    ],
  },
  // OBZ e Visitas foram retirados do portal; seus guias saíram junto.
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const POLITICA_ICON = {
  clock: Clock,
  shield: Shield,
  alert: AlertCircle,
}

function countItems(m: Modulo) {
  return { guias: m.guias.length, faq: m.faq.length, politicas: m.politicas.length }
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AjudaClient() {
  const [search, setSearch] = useState('')
  const [activeModulo, setActiveModulo] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Record<string, 'guias' | 'faq' | 'politicas'>>({})
  const [openFaq, setOpenFaq] = useState<Record<string, boolean>>({})
  const [stickyActive, setStickyActive] = useState<string>('')
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // IntersectionObserver para tab sticky
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    MODULOS.forEach(m => {
      const el = sectionRefs.current[m.id]
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setStickyActive(m.id) },
        { rootMargin: '-40% 0px -50% 0px' },
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  // Resultados de busca — flat sobre todo o conteúdo
  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    const results: { modulo: Modulo; tipo: string; titulo: string; descricao: string }[] = []
    for (const m of MODULOS) {
      for (const g of m.guias) {
        if (g.titulo.toLowerCase().includes(q) || g.descricao.toLowerCase().includes(q))
          results.push({ modulo: m, tipo: 'Guia', titulo: g.titulo, descricao: g.descricao })
      }
      for (const f of m.faq) {
        if (f.pergunta.toLowerCase().includes(q) || f.resposta.toLowerCase().includes(q))
          results.push({ modulo: m, tipo: 'FAQ', titulo: f.pergunta, descricao: f.resposta })
      }
      for (const p of m.politicas) {
        if (p.titulo.toLowerCase().includes(q) || p.detalhe.toLowerCase().includes(q))
          results.push({ modulo: m, tipo: 'Política', titulo: p.titulo, descricao: p.detalhe })
      }
    }
    return results.slice(0, 12)
  }, [search])

  function scrollToModulo(id: string) {
    setSearch('')
    const el = sectionRefs.current[id]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function getTab(id: string): 'guias' | 'faq' | 'politicas' {
    return activeTab[id] ?? 'guias'
  }

  function toggleFaq(key: string) {
    setOpenFaq(p => ({ ...p, [key]: !p[key] }))
  }

  const totalGuias = MODULOS.reduce((a, m) => a + m.guias.length, 0)
  const totalFaq = MODULOS.reduce((a, m) => a + m.faq.length, 0)

  return (
    <div className="space-y-10 pb-10">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/3 to-white/1 border border-white/8 p-8 lg:p-12">
        {/* Orb decorativo */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-sky-500/8 blur-3xl" />

        <div className="relative space-y-6 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-brand-400" />
            </div>
            <span className="text-brand-400 text-sm font-medium tracking-wide uppercase">Central de Ajuda</span>
          </div>

          <div>
            <h1 className="font-display font-bold text-3xl lg:text-4xl text-white leading-tight">
              Como podemos{' '}
              <span className="bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
                te ajudar?
              </span>
            </h1>
            <p className="mt-3 text-slate-400 text-base lg:text-lg leading-relaxed">
              Guias passo a passo, perguntas frequentes e políticas do portal — tudo em um só lugar.
            </p>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar guias, perguntas, políticas..."
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/50 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Pills de stats */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: `${MODULOS.length} ${MODULOS.length === 1 ? 'módulo' : 'módulos'}`, icon: BookOpen },
              { label: `${totalGuias} guias`, icon: FileText },
              { label: `${totalFaq} perguntas`, icon: Lightbulb },
            ].map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-slate-400 text-xs font-medium">
                <Icon className="w-3 h-3" /> {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Resultados de busca ──────────────────────────────────────────── */}
      <AnimatePresence>
        {search.trim() && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="space-y-3">
            <p className="text-slate-500 text-sm">{searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} para <span className="text-white">&ldquo;{search}&rdquo;</span></p>
            {searchResults.length === 0 ? (
              <div className="rounded-2xl bg-white/3 border border-white/8 py-10 text-center text-slate-500 text-sm">
                Nenhum resultado encontrado. Tente outros termos.
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((r, i) => (
                  <motion.button key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    onClick={() => scrollToModulo(r.modulo.id)}
                    className="w-full text-left rounded-xl bg-white/3 border border-white/8 px-4 py-3 hover:bg-white/5 hover:border-white/12 transition-all group">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${r.modulo.bgColor} ${r.modulo.textColor} ${r.modulo.borderColor}`}>
                        {r.tipo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{r.titulo}</p>
                        <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{r.descricao}</p>
                      </div>
                      <div className={`shrink-0 text-xs font-medium ${r.modulo.textColor} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
                        {r.modulo.titulo} <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Conteúdo principal (oculto durante busca) ────────────────────── */}
      {!search.trim() && (
        <>
          {/* Grid de módulos */}
          <div>
            <h2 className="text-white font-display font-bold text-lg mb-4">Módulos do sistema</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {MODULOS.map((m, i) => {
                const counts = countItems(m)
                const Icon = m.icon
                return (
                  <motion.button key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => scrollToModulo(m.id)}
                    className={`text-left rounded-2xl bg-white/3 border ${m.borderColor} p-4 hover:bg-white/5 hover:scale-[1.02] hover:shadow-xl transition-all group`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${m.bgColor} border ${m.borderColor} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${m.textColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold">{m.titulo}</p>
                        <p className="text-slate-500 text-xs mt-1 line-clamp-2">{m.descricao}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className="text-[10px] text-slate-600">{counts.guias} guias</span>
                          <span className="text-[10px] text-slate-700">·</span>
                          <span className="text-[10px] text-slate-600">{counts.faq} perguntas</span>
                        </div>
                      </div>
                      <ArrowRight className={`w-4 h-4 ${m.textColor} opacity-0 group-hover:opacity-100 shrink-0 mt-1 transition-opacity`} />
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Nav sticky de módulos */}
          <div className="sticky top-0 z-10 -mx-4 lg:-mx-6 px-4 lg:px-6 py-2 bg-[#0c0c12]/80 backdrop-blur-lg border-b border-white/6">
            <div className="flex gap-1 overflow-x-auto scrollbar-none">
              {MODULOS.map(m => {
                const Icon = m.icon
                return (
                  <button key={m.id} onClick={() => scrollToModulo(m.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0
                      ${stickyActive === m.id
                        ? `${m.bgColor} ${m.textColor} border ${m.borderColor}`
                        : 'text-slate-500 hover:text-white'}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {m.titulo.split(' ')[0]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Seções por módulo */}
          <div className="space-y-12">
            {MODULOS.map(m => {
              const Icon = m.icon
              const tab = getTab(m.id)
              const counts = countItems(m)

              return (
                <div key={m.id} id={m.id} ref={el => { sectionRefs.current[m.id] = el }} className="scroll-mt-24 space-y-4">
                  {/* Header do módulo */}
                  <div className="flex items-center gap-3 pb-3 border-b border-white/8">
                    <div className={`w-10 h-10 rounded-xl ${m.bgColor} border ${m.borderColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${m.textColor}`} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-white font-display font-bold text-xl">{m.titulo}</h2>
                      <p className="text-slate-500 text-sm">{m.descricao}</p>
                    </div>
                  </div>

                  {/* Sub-tabs */}
                  <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-white/8 w-fit">
                    {([
                      { key: 'guias', label: `Guias (${counts.guias})`, icon: BookOpen },
                      { key: 'faq', label: `FAQ (${counts.faq})`, icon: Lightbulb },
                      { key: 'politicas', label: `Políticas (${counts.politicas})`, icon: Shield },
                    ] as const).map(({ key, label, icon: TabIcon }) => (
                      <button key={key}
                        onClick={() => setActiveTab(p => ({ ...p, [m.id]: key }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                          ${tab === key
                            ? `${m.bgColor} ${m.textColor} border ${m.borderColor}`
                            : 'text-slate-500 hover:text-white'}`}>
                        <TabIcon className="w-3.5 h-3.5" /> {label}
                      </button>
                    ))}
                  </div>

                  {/* Conteúdo da tab */}
                  <AnimatePresence mode="wait">
                    {tab === 'guias' && (
                      <motion.div key="guias" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className="space-y-3">
                        {m.guias.map((g, i) => (
                          <div key={i} className="flex gap-4 rounded-2xl bg-white/3 border border-white/8 p-4 hover:bg-white/4 transition-colors">
                            <div className={`w-7 h-7 rounded-lg ${m.bgColor} border ${m.borderColor} flex items-center justify-center shrink-0 font-bold text-xs ${m.textColor}`}>
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-white text-sm font-semibold">{g.titulo}</p>
                                {g.badge && (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${m.bgColor} ${m.textColor} ${m.borderColor}`}>
                                    {g.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-400 text-sm mt-1 leading-relaxed">{g.descricao}</p>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {tab === 'faq' && (
                      <motion.div key="faq" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className="space-y-2">
                        {m.faq.map((f, i) => {
                          const key = `${m.id}-${i}`
                          const isOpen = openFaq[key]
                          return (
                            <div key={i} className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
                              <button onClick={() => toggleFaq(key)}
                                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-white/3 transition-colors">
                                <span className="text-white text-sm font-medium">{f.pergunta}</span>
                                <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                              </button>
                              <AnimatePresence>
                                {isOpen && (
                                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                    className="overflow-hidden">
                                    <div className="px-4 pb-4 pt-0 border-t border-white/6">
                                      <p className="text-slate-400 text-sm leading-relaxed pt-3">{f.resposta}</p>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )
                        })}
                      </motion.div>
                    )}

                    {tab === 'politicas' && (
                      <motion.div key="politicas" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className="space-y-3">
                        {m.politicas.map((p, i) => {
                          const PIcon = POLITICA_ICON[p.icone ?? 'shield']
                          return (
                            <div key={i} className="flex gap-3 rounded-2xl bg-white/3 border border-white/8 p-4">
                              <div className={`w-8 h-8 rounded-xl ${m.bgColor} border ${m.borderColor} flex items-center justify-center shrink-0`}>
                                <PIcon className={`w-4 h-4 ${m.textColor}`} />
                              </div>
                              <div>
                                <p className="text-white text-sm font-semibold">{p.titulo}</p>
                                <p className="text-slate-400 text-sm mt-1 leading-relaxed">{p.detalhe}</p>
                              </div>
                            </div>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

          {/* Footer de contato */}
          <div className="rounded-2xl bg-white/3 border border-white/8 p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center shrink-0">
              <HelpCircle className="w-6 h-6 text-brand-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Não encontrou o que precisava?</p>
              <p className="text-slate-400 text-sm mt-0.5">Entre em contato com seu gestor ou com o time de TI do Grupo Pau Brasil.</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
