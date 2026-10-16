'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, MapPin, ChevronRight, X } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useAnalytics } from '@/hooks/useAnalytics'
import { PublicBackground } from '@/app/_components/PublicBackground'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CareerStep { role: string; period: string }
interface Leader {
  name: string
  role: string
  area: 'vendas' | 'operacoes' | 'gente' | 'financeiro' | 'direcao' | 'fundacao' | 'socio'
  photo?: string
  career?: CareerStep[]
}

// Tipos espelho do contrato de /api/carreiras/lideres
interface LiderPublico {
  id: string
  name: string
  role: string
  photoUrl: string | null
  trajetoria: CareerStep[]
}
interface FilialPublica {
  id: string
  slug: string
  label: string
  estado: string
  color: string
  lideres: LiderPublico[]
}

// Infere a área visual a partir do cargo — permite reusar LeaderCard sem campo extra no DB
function inferArea(role: string): Leader['area'] {
  const r = role.toLowerCase()
  if (r.includes('vend') || r.includes('comercial') || r.includes('supervisor de n')) return 'vendas'
  if (r.includes('financ') || r.includes('caixa'))                                    return 'financeiro'
  if (r.includes('gente') || r.includes('cultura') || r.includes('people'))           return 'gente'
  if (r.includes('diretor') || r.includes('direção'))                                 return 'direcao'
  if (r.includes('sócio') || r.includes('socio'))                                     return 'socio'
  return 'operacoes'
}

function liderToLeader(l: LiderPublico): Leader {
  return {
    name:   l.name,
    role:   l.role,
    area:   inferArea(l.role),
    photo:  l.photoUrl ?? undefined,
    career: l.trajetoria.length > 0 ? l.trajetoria : undefined,
  }
}

// ─── Area config ──────────────────────────────────────────────────────────────
const AREA_CONFIG = {
  fundacao:   { label: 'Fundação',   color: '#ff8c2a', bg: '#1e1108', border: '#ff8c2a70', badgeBg: '#ff8c2a', badgeText: '#fff', subText: '#ffb876', divider: '#ff8c2a25' },
  socio:      { label: 'Sócio',      color: '#c084fc', bg: '#150d1e', border: '#c084fc70', badgeBg: '#9333ea', badgeText: '#fff', subText: '#d8b4fe', divider: '#c084fc25' },
  direcao:    { label: 'Diretoria',  color: '#818cf8', bg: '#0e0e1e', border: '#818cf870', badgeBg: '#4f46e5', badgeText: '#fff', subText: '#c7d2fe', divider: '#818cf825' },
  vendas:     { label: 'Vendas',     color: '#facc15', bg: '#161100', border: '#facc1570', badgeBg: '#ca8a04', badgeText: '#fff', subText: '#fef08a', divider: '#facc1525' },
  operacoes:  { label: 'Logística',  color: '#6b8cff', bg: '#080d1e', border: '#6b8cff70', badgeBg: '#1e3a8a', badgeText: '#fff', subText: '#bfcfff', divider: '#6b8cff25' },
  gente:      { label: 'Gente',      color: '#f472b6', bg: '#18060f', border: '#f472b670', badgeBg: '#db2777', badgeText: '#fff', subText: '#fbcfe8', divider: '#f472b625' },
  financeiro: { label: 'Financeiro', color: '#fbbf24', bg: '#181200', border: '#fbbf2470', badgeBg: '#d97706', badgeText: '#fff', subText: '#fde68a', divider: '#fbbf2425' },
}

// ─── Liderança Geral (founders / diretores — dados estáticos intencionais) ────
const GENERAL_LEADERS: Leader[] = [
  {
    name: 'Zenildo', role: 'Presidente', area: 'fundacao',
    career: [{ role: 'Presidente do Grupo Pau Brasil', period: 'Fundação' }],
  },
  {
    name: 'Alisson', role: 'CEO & Diretor Geral', area: 'direcao',
    career: [{ role: 'CEO e Diretor Geral', period: 'Atual' }],
  },
  {
    name: 'Geniana', role: 'Sócia · Diretora de Gente', area: 'socio',
    career: [{ role: 'Diretora de Gente & Cultura', period: 'Atual' }],
  },
  {
    name: 'Valdenio', role: 'Sócio · Diretor Financeiro', area: 'socio',
    career: [{ role: 'Diretor Financeiro', period: 'Atual' }],
  },
  {
    name: 'João Marcos', role: 'Sócio · GC da Bahia', area: 'socio',
    career: [{ role: 'Gerente Comercial — Bahia', period: 'Atual' }],
  },
  {
    name: 'Francisco Roniere', role: 'GC da Paraíba', area: 'direcao',
    career: [{ role: 'Gerente Comercial — Paraíba', period: 'Atual' }],
  },
]


// ─── Photo Lightbox ───────────────────────────────────────────────────────────
function PhotoLightbox({ photo, name, role, color, onClose }: {
  photo: string; name: string; role: string; color: string; onClose: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  useFocusTrap(containerRef, true, onClose)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
      >
        <motion.div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Foto de ${name} — ${role}`}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}
          className="relative flex flex-col items-center gap-4"
        >
          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Fechar foto"
            className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-black/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
            <X className="w-4 h-4" />
          </button>

          {/* Big photo — crachá style */}
          <div className="w-56 h-56 rounded-3xl overflow-hidden shadow-2xl"
            style={{ border: `3px solid ${color}90` }}>
            {/* clip do crachá */}
            <div className="relative w-full h-full">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-4 rounded-full z-10"
                style={{ backgroundColor: color + '60', border: `1.5px solid ${color}80` }} />
              <Image
                src={photo}
                alt={name}
                fill
                unoptimized
                className="object-cover object-top"
              />
            </div>
          </div>

          {/* Name + role */}
          <div className="text-center">
            <div className="font-display font-black text-xl text-white">{name}</div>
            <div className="text-sm mt-1 font-medium" style={{ color: color }}>{role}</div>
            <div className="text-[11px] text-slate-500 mt-1">#GentequeCrescePauBrasil</div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Leader Card ──────────────────────────────────────────────────────────────
function LeaderCard({ leader, index }: { leader: Leader; index: number }) {
  const cfg = AREA_CONFIG[leader.area]
  const initials = leader.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const hasCareer = leader.career && leader.career.length > 1
  const [lightbox, setLightbox] = useState(false)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.35, ease: 'easeOut' }}
        className="rounded-2xl p-4 flex flex-col gap-3 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm"
        style={{
          background: `linear-gradient(135deg, ${cfg.color}08, transparent)`,
          backgroundColor: cfg.bg,
          border: `1px solid ${cfg.color}30`,
          boxShadow: `0 0 20px ${cfg.color}08`,
        }}
      >
        <div className="flex items-center gap-3">
          {/* Crachá frame w-20 h-20 — button se tiver foto, div se não */}
          {leader.photo ? (
            <button
              type="button"
              onClick={() => setLightbox(true)}
              aria-label={`Ver foto de ${leader.name}`}
              className="w-20 h-20 rounded-2xl shrink-0 relative overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2"
              style={{
                backgroundColor: cfg.color + '22',
                border: `2px solid ${cfg.color}90`,
                ['--tw-ring-color' as any]: cfg.color,
              }}>
              {/* clip do crachá */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-2.5 rounded-full z-10"
                style={{ backgroundColor: cfg.color + '60', border: `1px solid ${cfg.color}80` }} />
              <Image
                src={leader.photo}
                alt={leader.name}
                fill
                unoptimized
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-end justify-center pb-1">
                <span className="text-[9px] text-white/0 hover:text-white/80 font-medium transition-colors">ampliar</span>
              </div>
            </button>
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 relative overflow-hidden"
              style={{ backgroundColor: cfg.color + '22', border: `2px solid ${cfg.color}90` }}>
              {/* clip do crachá */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-2.5 rounded-full z-10"
                style={{ backgroundColor: cfg.color + '60', border: `1px solid ${cfg.color}80` }} />
              <span className="font-display font-black text-2xl" style={{ color: cfg.color }}>{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm leading-tight text-white">{leader.name}</div>
            <div className="text-xs mt-0.5 leading-tight font-medium" style={{ color: cfg.subText }}>{leader.role}</div>
            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: cfg.badgeBg, color: cfg.badgeText }}>
              {cfg.label}
            </span>
          </div>
        </div>

        {hasCareer && (
          <div className="pt-3 space-y-1.5" style={{ borderTop: `1px solid ${cfg.divider}` }}>
            <div className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: cfg.subText + 'aa' }}>Trajetória</div>
            {leader.career!.map((step, i) => {
              const isLast = i === leader.career!.length - 1
              return (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex flex-col items-center shrink-0 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isLast ? cfg.color : cfg.color + '60' }} />
                    {!isLast && <div className="w-px h-3 mt-0.5" style={{ backgroundColor: cfg.color + '30' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] leading-tight block font-medium" style={{ color: isLast ? '#ffffff' : '#cbd5e1' }}>{step.role}</span>
                    <span className="text-[10px] leading-tight font-medium" style={{ color: cfg.subText + 'cc' }}>{step.period}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {lightbox && leader.photo && (
        <PhotoLightbox
          photo={leader.photo}
          name={leader.name}
          role={leader.role}
          color={cfg.color}
          onClose={() => setLightbox(false)}
        />
      )}
    </>
  )
}

// ─── City View ────────────────────────────────────────────────────────────────
function CityView({ cityId, cityLabel, color, lideresPublicos, onClose }: {
  cityId:         string
  cityLabel:      string
  color:          string
  lideresPublicos: LiderPublico[]
  onClose:        () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  useFocusTrap(containerRef, true, onClose)

  const leaders = lideresPublicos.map(liderToLeader)
  const byArea = leaders.reduce<Record<string, Leader[]>>((acc, l) => {
    if (!acc[l.area]) acc[l.area] = []
    acc[l.area].push(l)
    return acc
  }, {})
  const areaOrder: (keyof typeof AREA_CONFIG)[] = ['socio', 'direcao', 'vendas', 'operacoes', 'gente', 'financeiro']

  return (
    <motion.div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Liderança de ${cityLabel}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0d0d14] overflow-y-auto">
      <div className="sticky top-0 z-10 bg-[#0d0d14]/95 backdrop-blur-md border-b border-white/5 px-4 lg:px-8 h-14 flex items-center justify-between">
        <button
          onClick={onClose}
          aria-label="Voltar às cidades"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded">
          <ArrowLeft className="w-4 h-4" /> Voltar às cidades
        </button>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" style={{ color }} />
          <span className="font-display font-bold text-white">{cityLabel}</span>
          <span className="text-xs text-slate-500">· {leaders.length} líderes</span>
        </div>
        <button
          onClick={onClose}
          aria-label={`Fechar painel de ${cityLabel}`}
          className="text-slate-500 hover:text-white transition-colors p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8 space-y-10">
        {leaders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MapPin className="w-10 h-10 text-slate-700 mb-4" />
            <p className="text-slate-400 font-medium">Nenhum líder cadastrado para esta cidade ainda.</p>
          </div>
        ) : (
          areaOrder.map(area => {
            const group = byArea[area]
            if (!group?.length) return null
            const cfg = AREA_CONFIG[area]
            return (
              <div key={area}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-6 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <h3 className="text-lg font-display font-bold text-white">{cfg.label}</h3>
                  <div className="h-px flex-1 opacity-20" style={{ backgroundColor: cfg.color }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.map((leader, i) => (
                    <LeaderCard key={leader.name + i} leader={leader} index={i} />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CarreirasPage() {
  const [selectedCity, setSelectedCity] = useState<{ id: string; label: string; color: string; lideres: LiderPublico[] } | null>(null)
  const [filiais, setFiliais]           = useState<FilialPublica[]>([])
  const [loadingFiliais, setLoadingFiliais] = useState(true)
  const { track } = useAnalytics()

  useEffect(() => {
    fetch('/api/carreiras/lideres')
      .then(r => r.ok ? r.json() : [])
      .then((data: FilialPublica[]) => setFiliais(data))
      .catch(() => {})
      .finally(() => setLoadingFiliais(false))
  }, [])

  return (
    <div className="min-h-screen text-white">
      <PublicBackground />

      <header className="fixed top-0 left-0 right-0 z-30 bg-[#0d0d14]/80 backdrop-blur-xl border-b border-white/8">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
              <span className="font-bold text-xs text-white">P</span>
            </div>
            <span className="font-display font-bold text-white text-sm hidden sm:block">Grupo Pau Brasil</span>
          </div>
          <Link href="/login" className="px-3 py-1.5 rounded-lg gradient-brand text-white text-xs font-medium">Portal</Link>
        </div>
      </header>

      <main className="relative z-10 pt-14">
        {/* Hero */}
        <section className="relative py-16 px-6 text-center overflow-hidden">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-brand-400 text-xs mb-5">
              #GentequeCrescePauBrasil
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-black leading-tight">
              Gente<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-cyan-400">que Cresce</span>
            </h1>
            <p className="mt-5 text-slate-400 text-base leading-relaxed max-w-md mx-auto">
              Conheça quem lidera o Grupo Pau Brasil — das origens até o time que opera hoje em cada unidade do Nordeste.
            </p>
          </motion.div>
        </section>

        {/* ── CTA Banco de Talentos ── */}
        <section className="px-4 lg:px-8 pb-10">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative rounded-3xl overflow-hidden p-8 lg:p-10 text-center"
              style={{ background: 'linear-gradient(135deg, #0d1f10, #0d0d14, #0e0e20)', border: '1.5px solid #10b98130' }}>
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-emerald-500/6 rounded-full blur-3xl" />
              </div>
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs mb-4">
                  Banco de Talentos
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-black text-white mb-3">
                  Quer fazer parte do<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300">Grupo Pau Brasil?</span>
                </h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                  Mesmo sem vagas abertas, nossa equipe de Gente &amp; Gestão está sempre buscando talentos.
                  Envie seu currículo e entre para nosso banco de talentos.
                </p>
                <Link href="/carreiras/candidatar"
                  onClick={() => track('candidatura_cta_clicked', { source: 'carreiras_page' })}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60">
                  Enviar Currículo
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="px-4 lg:px-8 pb-16">
          <div className="max-w-5xl mx-auto">

            {/* ── Liderança Geral ── */}
            <div className="rounded-3xl p-6 lg:p-8 mb-12 backdrop-blur-md"
              style={{ background: 'linear-gradient(135deg, rgba(255,140,42,0.06), rgba(129,140,248,0.06), transparent)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 0 60px rgba(168,85,247,0.06) inset' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 rounded-full bg-gradient-to-b from-brand-400 to-purple-400" />
                <div>
                  <h2 className="text-xl font-display font-bold text-white">Liderança Geral</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Fundadores, sócios e diretores do grupo</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {GENERAL_LEADERS.map((leader, i) => {
                  const cfg = AREA_CONFIG[leader.area]
                  const initials = leader.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                  return (
                    <motion.div key={leader.name}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      whileHover={{ y: -4, scale: 1.03 }}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl text-center backdrop-blur-sm cursor-default"
                      style={{
                        background: `linear-gradient(135deg, ${cfg.color}10, ${cfg.color}04)`,
                        border: `1px solid ${cfg.color}25`,
                        boxShadow: `0 4px 24px ${cfg.color}0a`,
                      }}>
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center relative overflow-hidden"
                        style={{ backgroundColor: cfg.color + '20', border: `1.5px solid ${cfg.color}60` }}>
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-2.5 rounded-full z-10"
                          style={{ backgroundColor: cfg.color + '50', border: `1px solid ${cfg.color}70` }} />
                        {leader.photo ? (
                          <Image
                            src={leader.photo}
                            alt={leader.name}
                            fill
                            unoptimized
                            className="object-cover object-top"
                          />
                        ) : (
                          <span className="font-display font-black text-2xl" style={{ color: cfg.color }}>{initials}</span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight text-white">{leader.name}</div>
                        <div className="text-[10px] mt-0.5 leading-tight font-medium" style={{ color: cfg.subText }}>{leader.role}</div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* ── Grade de cidades ── */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 rounded-full bg-gradient-to-b from-cyan-400 to-blue-400" />
                <div>
                  <h2 className="text-xl font-display font-bold text-white">Operações por Cidade</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Selecione uma unidade para ver sua liderança</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {loadingFiliais
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="rounded-2xl p-5 animate-pulse bg-white/4 border border-white/8 h-[120px]" />
                    ))
                  : filiais.map((filial, i) => (
                  <motion.button key={filial.slug}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    whileHover={{ y: -6, scale: 1.04 }}
                    onClick={() => {
                      track('city_opened', { city: filial.slug, label: filial.label, state: filial.estado })
                      setSelectedCity({ id: filial.slug, label: filial.label, color: filial.color, lideres: filial.lideres })
                    }}
                    aria-label={`Ver liderança de ${filial.label} — ${filial.lideres.length} líderes`}
                    className="group relative rounded-2xl p-5 text-left cursor-pointer overflow-hidden backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    style={{
                      background: `linear-gradient(135deg, ${filial.color}10, ${filial.color}04)`,
                      border: `1px solid ${filial.color}30`,
                      boxShadow: `0 4px 20px ${filial.color}08`,
                      transition: 'all 0.25s ease',
                    }}>
                    {/* Glow no hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 rounded-2xl"
                      style={{ background: `radial-gradient(circle at 50% -10%, ${filial.color}20, transparent 65%)` }} />
                    {/* Brilho na borda superior */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                      style={{ background: `linear-gradient(90deg, transparent, ${filial.color}80, transparent)` }} />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <MapPin className="w-4 h-4" style={{ color: filial.color }} />
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm"
                          style={{ color: filial.color, backgroundColor: filial.color + '18', border: `1px solid ${filial.color}30` }}>{filial.estado}</span>
                      </div>
                      <div className="font-display font-bold text-white text-base">{filial.label}</div>
                      <div className="text-[11px] mt-1 font-medium" style={{ color: filial.color + 'aa' }}>{filial.lideres.length} líderes</div>
                      <div className="flex items-center gap-1 mt-3" style={{ color: filial.color }}>
                        <span className="text-[11px] font-medium">Ver liderança</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-200" />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-8 px-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Grupo Pau Brasil — #GentequeCrescePauBrasil
      </footer>

      <AnimatePresence>
        {selectedCity && (
          <CityView
            cityId={selectedCity.id}
            cityLabel={selectedCity.label}
            color={selectedCity.color}
            lideresPublicos={selectedCity.lideres}
            onClose={() => setSelectedCity(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
