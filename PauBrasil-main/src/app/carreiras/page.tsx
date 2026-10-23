'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUpRight, MapPin, X } from 'lucide-react'
import { Montserrat } from 'next/font/google'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useAnalytics } from '@/hooks/useAnalytics'
import { HubFooter, HubNav } from '@/app/_components/HubShell'
import hubStyles from '@/app/_components/Hub.module.css'

const montserrat = Montserrat({ subsets: ['latin'], display: 'swap', variable: '--font-hub' })

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
// Identidade do hub: todas as áreas no vinho/areia; só o rótulo muda.
const AREA_CONFIG = {
  fundacao:   { label: 'Fundação' },
  socio:      { label: 'Sócio' },
  direcao:    { label: 'Diretoria' },
  vendas:     { label: 'Vendas' },
  operacoes:  { label: 'Logística' },
  gente:      { label: 'Gente' },
  financeiro: { label: 'Financeiro' },
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

const iniciais = (nome: string) => nome.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

/** Foto ou iniciais numa placa areia, como os logos das empresas no hub. */
function Avatar({ leader, size = 'md' }: { leader: Leader; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-16 h-16 text-xl'
  return (
    <span className={`${box} relative shrink-0 overflow-hidden rounded-[10px] bg-[#f1ebe3] border border-[#e2d6cb] flex items-center justify-center font-semibold tracking-[-0.04em] text-[#7a1520]`}>
      {leader.photo
        ? <Image src={leader.photo} alt={leader.name} fill unoptimized className="object-cover object-top" />
        : iniciais(leader.name)}
    </span>
  )
}

// ─── Photo Lightbox ───────────────────────────────────────────────────────────
function PhotoLightbox({ photo, name, role, onClose }: {
  photo: string; name: string; role: string; onClose: () => void
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
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a1a1a]/85 p-6"
      >
        <motion.div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Foto de ${name} — ${role}`}
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}
          className="relative flex flex-col items-center gap-4"
        >
          <button
            onClick={onClose}
            aria-label="Fechar foto"
            className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-[#faf9f6] flex items-center justify-center text-[#1a1a1a] hover:bg-[#dcc8b1] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bb8c08]">
            <X className="w-4 h-4" />
          </button>
          <div className="relative w-64 h-64 rounded-[14px] overflow-hidden shadow-2xl border-4 border-[#faf9f6]">
            <Image src={photo} alt={name} fill unoptimized className="object-cover object-top" />
          </div>
          <div className="text-center">
            <div className="font-semibold text-xl tracking-[-0.03em] text-white">{name}</div>
            <div className="text-sm mt-1 font-medium text-[#dcc8b1]">{role}</div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Leader Card ──────────────────────────────────────────────────────────────
function LeaderCard({ leader, index }: { leader: Leader; index: number }) {
  const cfg = AREA_CONFIG[leader.area]
  const hasCareer = leader.career && leader.career.length > 1
  const [lightbox, setLightbox] = useState(false)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.35, ease: 'easeOut' }}
        className="rounded-[10px] bg-white border border-[#e7e1da] p-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-1 hover:border-[#c9ab94] hover:shadow-[0_18px_40px_-24px_rgba(74,29,20,0.4)]"
      >
        <div className="flex items-center gap-3">
          {leader.photo ? (
            <button
              type="button"
              onClick={() => setLightbox(true)}
              aria-label={`Ver foto de ${leader.name}`}
              className="rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bb8c08] focus-visible:ring-offset-2 hover:opacity-90 transition-opacity">
              <Avatar leader={leader} size="lg" />
            </button>
          ) : (
            <Avatar leader={leader} size="lg" />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm leading-tight text-[#1a1a1a]">{leader.name}</div>
            <div className="text-xs mt-1 leading-snug text-[#6f5c4e]">{leader.role}</div>
            <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#7a1520]/[0.07] border border-[#7a1520]/20 text-[#7a1520]">
              {cfg.label}
            </span>
          </div>
        </div>

        {hasCareer && (
          <div className="pt-3 space-y-1.5 border-t border-[#eee8e2]">
            <div className="text-xs uppercase tracking-[0.12em] font-semibold mb-2 text-[#6f5c4e]">Trajetória</div>
            {leader.career!.map((step, i) => {
              const isLast = i === leader.career!.length - 1
              return (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex flex-col items-center shrink-0 mt-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isLast ? 'bg-[#7a1520]' : 'bg-[#c9ab94]'}`} />
                    {!isLast && <div className="w-px h-3 mt-0.5 bg-[#e2d6cb]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs leading-tight block font-medium ${isLast ? 'text-[#1a1a1a]' : 'text-[#3f3732]'}`}>{step.role}</span>
                    <span className="text-xs leading-tight text-[#6f5c4e]">{step.period}</span>
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
          onClose={() => setLightbox(false)}
        />
      )}
    </>
  )
}

// ─── City View ────────────────────────────────────────────────────────────────
function CityView({ cityLabel, lideresPublicos, onClose }: {
  cityLabel:      string
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
      className="tema-claro fixed inset-0 z-50 bg-[#faf9f6] overflow-y-auto"
      style={{ fontFamily: 'var(--font-hub), Arial, sans-serif' }}>
      <div className="sticky top-0 z-10 bg-[#f4efe8] border-b border-[#dcc8b1] shadow-[0_6px_18px_-14px_rgba(74,29,20,0.25)] px-4 lg:px-8 h-16 flex items-center justify-between gap-3">
        <button
          onClick={onClose}
          aria-label="Voltar às cidades"
          className="flex items-center gap-2 text-[#7a1520] font-semibold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bb8c08] rounded">
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Voltar às cidades</span>
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-4 h-4 text-[#7a1520] shrink-0" />
          <span className="font-semibold text-[#1a1a1a] truncate">{cityLabel}</span>
          <span className="text-xs text-[#6f5c4e] shrink-0">· {leaders.length} líderes</span>
        </div>
        <button
          onClick={onClose}
          aria-label={`Fechar painel de ${cityLabel}`}
          className="text-[#6f5c4e] hover:text-[#7a1520] transition-colors p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bb8c08] rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-10 space-y-10">
        {leaders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MapPin className="w-10 h-10 text-[#c9ab94] mb-4" />
            <p className="text-[#6f5c4e] font-medium">Nenhum líder cadastrado para esta cidade ainda.</p>
          </div>
        ) : (
          areaOrder.map(area => {
            const group = byArea[area]
            if (!group?.length) return null
            const cfg = AREA_CONFIG[area]
            return (
              <div key={area}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs uppercase tracking-[0.17em] font-semibold text-[#7a1520]">{cfg.label}</span>
                  <div className="h-px flex-1 bg-[#e2d6cb]" />
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
  const [selectedCity, setSelectedCity] = useState<{ id: string; label: string; lideres: LiderPublico[] } | null>(null)
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
    <div
      className={`tema-claro min-h-screen flex flex-col bg-[#faf9f6] text-[#1a1a1a] ${montserrat.variable}`}
      style={{ fontFamily: 'var(--font-hub), Arial, sans-serif' }}
    >
      {/* Mesmo cabeçalho e rodapé do hub; o wrapper .hub traz as cores e o sticky. */}
      <div className={hubStyles.hub} style={{ position: 'sticky', top: 0, zIndex: 40 }}>
        <HubNav />
      </div>

      <main id="conteudo" className="relative flex-1">
        {/* Hero */}
        <section className="px-6 pt-16 pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-5xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7a1520] mb-10">
              <ArrowLeft className="w-4 h-4" /> Voltar para o início
            </Link>
            <span className="block text-xs uppercase tracking-[0.17em] font-semibold text-[#7a1520] mb-5">
              #GentequeCrescePauBrasil
            </span>
            <h1 className="text-[40px] md:text-[56px] font-semibold leading-[1.08] tracking-[-0.045em]">
              Gente que <span className="text-[#7a1520]">cresce.</span>
            </h1>
            <p className="mt-5 text-[#6f5c4e] text-base leading-relaxed max-w-lg">
              Conheça quem lidera o Grupo Pau Brasil, das origens até o time que opera hoje em cada unidade do Nordeste.
            </p>
          </motion.div>
        </section>

        {/* ── CTA Banco de Talentos ── */}
        <section className="px-4 lg:px-8 pb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-5xl mx-auto rounded-[10px] bg-[#7a1520] text-white p-8 lg:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="block text-xs uppercase tracking-[0.17em] font-semibold text-[#dcc8b1] mb-3">Banco de talentos</span>
              <h2 className="text-2xl md:text-[32px] font-semibold tracking-[-0.04em] leading-tight">
                Quer fazer parte do Grupo Pau Brasil?
              </h2>
              <p className="text-[#f0d9d2] text-sm max-w-md mt-3 leading-relaxed">
                Mesmo sem vagas abertas, nossa equipe de Gente &amp; Gestão está sempre buscando talentos.
                Envie seu currículo e entre para o nosso banco de talentos.
              </p>
            </div>
            <Link href="/carreiras/candidatar"
              onClick={() => track('candidatura_cta_clicked', { source: 'carreiras_page' })}
              className="inline-flex items-center justify-center gap-3 px-6 py-4 rounded-[3px] bg-[#faf9f6] text-[#7a1520] font-semibold text-sm hover:bg-[#dcc8b1] transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bb8c08] focus-visible:ring-offset-2 focus-visible:ring-offset-[#7a1520]">
              Enviar currículo <ArrowUpRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </section>

        <section className="px-4 lg:px-8 pb-20">
          <div className="max-w-5xl mx-auto">

            {/* ── Liderança Geral ── */}
            <div className="mb-14">
              <span className="block text-xs uppercase tracking-[0.17em] font-semibold text-[#7a1520] mb-3">Liderança geral</span>
              <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.045em] leading-tight">Fundadores, sócios e diretores</h2>
              <div className="mt-7 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {GENERAL_LEADERS.map((leader, i) => (
                  <motion.div key={leader.name}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="flex flex-col items-center gap-3 p-4 rounded-[10px] text-center bg-white border border-[#e7e1da]">
                    <Avatar leader={leader} size="lg" />
                    <div>
                      <div className="text-sm font-semibold leading-tight text-[#1a1a1a]">{leader.name}</div>
                      <div className="text-xs mt-1 leading-snug text-[#6f5c4e]">{leader.role}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── Grade de cidades ── */}
            <div>
              <span className="block text-xs uppercase tracking-[0.17em] font-semibold text-[#7a1520] mb-3">Operações por cidade</span>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
                <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.045em] leading-tight">Liderança em cada unidade</h2>
                <p className="text-sm text-[#6f5c4e]">Selecione uma unidade para ver quem lidera.</p>
              </div>
              <div className="mt-7 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {loadingFiliais
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="rounded-[10px] animate-pulse bg-[#f1ebe3] border border-[#e7e1da] h-[132px]" />
                    ))
                  : filiais.map((filial, i) => (
                  <motion.button key={filial.slug}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => {
                      track('city_opened', { city: filial.slug, label: filial.label, state: filial.estado })
                      setSelectedCity({ id: filial.slug, label: filial.label, lideres: filial.lideres })
                    }}
                    aria-label={`Ver liderança de ${filial.label} — ${filial.lideres.length} líderes`}
                    className="group rounded-[10px] p-5 text-left bg-white border border-[#e7e1da] transition-all duration-200 hover:-translate-y-1 hover:border-[#c9ab94] hover:shadow-[0_18px_40px_-24px_rgba(74,29,20,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bb8c08] focus-visible:ring-offset-2">
                    <div className="flex items-center justify-between mb-4">
                      <MapPin className="w-4 h-4 text-[#7a1520]" />
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-[#f1ebe3] text-[#6f5c4e]">{filial.estado}</span>
                    </div>
                    <div className="font-semibold text-[#1a1a1a] text-base tracking-[-0.02em]">{filial.label}</div>
                    <div className="text-xs mt-1 text-[#6f5c4e]">{filial.lideres.length} líderes</div>
                    <div className="flex items-center gap-1.5 mt-4 text-[#7a1520]">
                      <span className="text-xs font-semibold">Ver liderança</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

          </div>
        </section>
      </main>

      <div className={hubStyles.hub}>
        <HubFooter />
      </div>

      <AnimatePresence>
        {selectedCity && (
          <CityView
            cityLabel={selectedCity.label}
            lideresPublicos={selectedCity.lideres}
            onClose={() => setSelectedCity(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
