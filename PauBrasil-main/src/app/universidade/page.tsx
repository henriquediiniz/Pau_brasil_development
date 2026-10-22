'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { GraduationCap, PlayCircle, CheckCircle2, ChevronRight, Loader2, Award, Lock, FileQuestion, Clock, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { toast } from '@/components/ui/toaster'

interface Temporada {
  id: string
  titulo: string
  descricao: string | null
  capa: string | null
  totalEpisodios: number
  concluidos: number
  restricaoAcesso: boolean
  temProva: boolean
  matriculaStatus: 'PENDENTE' | 'APROVADO' | 'NEGADO' | null
  certificado: { id: string; emitidoEm: string } | null
  empresas: string[]
  unidades: string[]
  obrigatorio: { prazo: string } | null
}

function diasRestantes(prazo: string): number {
  return Math.ceil((new Date(prazo).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function urgenciaCls(dias: number) {
  if (dias < 0) return { border: 'border-red-500/50', badge: 'bg-red-500/15 border-red-500/40 text-red-300', label: 'Vencido' }
  if (dias <= 3) return { border: 'border-red-500/40', badge: 'bg-red-500/15 border-red-500/40 text-red-300', label: `${dias}d restante${dias !== 1 ? 's' : ''}` }
  if (dias <= 7) return { border: 'border-amber-500/40', badge: 'bg-amber-500/15 border-amber-500/40 text-amber-300', label: `${dias}d restantes` }
  return { border: 'border-brand-500/30', badge: 'bg-brand-500/15 border-brand-500/30 text-brand-300', label: `${dias}d restantes` }
}

// Capas sem imagem: tons de vinho e grafite da identidade 2026
const FALLBACK_COLORS = ['#2a1214', '#3b1a1d', '#1f1a17', '#4a1c22', '#2b2420', '#33161a']

export default function UniversidadePage() {
  const [temporadas, setTemporadas] = useState<Temporada[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)
  const [solicitando, setSolicitando] = useState<string | null>(null)

  function load() {
    setErro(false)
    fetch('/api/universidade/temporadas')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => { setTemporadas(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setErro(true); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  async function solicitarAcesso(e: React.MouseEvent, temporadaId: string) {
    e.preventDefault()
    setSolicitando(temporadaId)
    try {
      const res = await fetch(`/api/universidade/acesso/${temporadaId}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: '✅ Solicitação enviada!' })
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Erro', variant: 'destructive' })
    } finally {
      setSolicitando(null)
    }
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40 rounded-lg" />
        <Skeleton className="h-3 w-56 rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
            {/* Capa */}
            <Skeleton className="h-[180px] w-full rounded-none" />
            {/* Conteúdo */}
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-3/4 rounded-full" />
              <Skeleton className="h-3 w-1/2 rounded-full" />
              <Skeleton className="h-3 w-full rounded-full" />
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <Skeleton className="h-2.5 w-16 rounded-full" />
                  <Skeleton className="h-2.5 w-8 rounded-full" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (erro) return (
    <div className="max-w-5xl mx-auto">
      <div className="rounded-2xl bg-red-500/5 border border-red-500/20 p-10 text-center">
        <GraduationCap className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-white font-medium mb-1">Erro ao carregar cursos</p>
        <p className="text-slate-400 text-sm mb-4">Não foi possível buscar os cursos. Tente novamente.</p>
        <button onClick={load} className="px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium">
          Tentar novamente
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center shadow-lg shadow-brand-500/30">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">Universidade Pau Brasil</h1>
              <p className="text-slate-400 text-sm">Conteúdos de desenvolvimento para a equipe</p>
            </div>
          </div>
          {temporadas.some(t => t.certificado !== null) && (
            <Link href="/universidade/certificados"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#b88c0b]/10 border border-[#b88c0b]/30 text-[#d4a72c] text-sm font-medium hover:bg-[#b88c0b]/20 transition-colors">
              <Award className="w-4 h-4" />
              Meus Certificados
            </Link>
          )}
        </div>
      </motion.div>

      {/* Seção: treinamentos obrigatórios pendentes */}
      {(() => {
        const pendentes = temporadas.filter(t => t.obrigatorio && !t.certificado)
        if (pendentes.length === 0) return null
        return (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-red-300 text-sm font-medium">
                {pendentes.length} treinamento{pendentes.length !== 1 ? 's' : ''} obrigatório{pendentes.length !== 1 ? 's' : ''} pendente{pendentes.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {pendentes.map(t => {
                const dias = diasRestantes(t.obrigatorio!.prazo)
                const u = urgenciaCls(dias)
                return (
                  <Link key={t.id} href={`/universidade/${t.id}`}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${u.badge} text-xs font-medium hover:opacity-80 transition-opacity`}>
                    <Clock className="w-3 h-3 shrink-0" />
                    {t.titulo} — {u.label}
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )
      })()}

      {temporadas.length === 0 ? (
        <div className="rounded-2xl bg-white/3 border border-white/8 p-12 text-center">
          <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Nenhuma temporada disponível no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {temporadas.map((t, i) => {
            const pct = t.totalEpisodios > 0 ? (t.concluidos / t.totalEpisodios) * 100 : 0
            const concluida = t.certificado !== null
            const bloqueado = t.restricaoAcesso && t.matriculaStatus !== 'APROVADO'
            const pendente = t.matriculaStatus === 'PENDENTE'
            const negado = t.matriculaStatus === 'NEGADO'
            const semSolicitacao = t.restricaoAcesso && !t.matriculaStatus
            const obrig = t.obrigatorio && !concluida ? urgenciaCls(diasRestantes(t.obrigatorio.prazo)) : null

            return (
              <motion.div key={t.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Link href={`/universidade/${t.id}`}
                  className={`block rounded-2xl bg-white/3 overflow-hidden transition-all group
                    border ${obrig ? obrig.border : 'border-white/8'}
                    ${bloqueado ? 'opacity-80' : 'hover:bg-white/5'}`}>
                  {/* Capa */}
                  <div className="h-[180px] relative overflow-hidden rounded-t-2xl">
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
                        <GraduationCap className="w-10 h-10 text-white/30" />
                      </div>
                    )}
                    {/* Badges */}
                    {concluida && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-[#b88c0b]/20 border border-[#b88c0b]/40 backdrop-blur-sm">
                        <Award className="w-3 h-3 text-[#d4a72c]" />
                        <span className="text-[#d4a72c] text-xs font-medium">Certificado</span>
                      </div>
                    )}
                    {bloqueado && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 border border-white/10 backdrop-blur-sm">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-400 text-xs font-medium">Restrito</span>
                      </div>
                    )}
                    {t.temProva && !concluida && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-brand-500/20 border border-brand-500/40 backdrop-blur-sm">
                        <FileQuestion className="w-3 h-3 text-brand-400" />
                        <span className="text-brand-400 text-xs font-medium">Com prova</span>
                      </div>
                    )}
                    {obrig && (
                      <div className={`absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm border ${obrig.badge}`}>
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span className="text-xs font-medium">{obrig.label}</span>
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div className="p-4 space-y-3">
                    {/* Título — linha inteira */}
                    <h2 className="text-white font-display font-bold text-sm leading-snug line-clamp-2 group-hover:text-brand-400 transition-colors">
                      {t.titulo}
                    </h2>

                    {/* Tags de empresa/unidade — linha compacta separada */}
                    {(t.empresas?.length > 0 || t.unidades?.length > 0) && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {t.empresas?.length === 1 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300 truncate max-w-[120px]">
                            {t.empresas[0]}
                          </span>
                        )}
                        {t.empresas?.length > 1 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300 whitespace-nowrap">
                            {t.empresas.length} empresas
                          </span>
                        )}
                        {t.unidades?.slice(0, 2).map(u => (
                          <span key={u} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/25 text-brand-300 truncate max-w-[80px]">
                            {u}
                          </span>
                        ))}
                        {t.unidades?.length > 2 && (
                          <span className="text-[10px] text-slate-600">+{t.unidades.length - 2}</span>
                        )}
                      </div>
                    )}

                    {t.descricao && (
                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-1">{t.descricao}</p>
                    )}

                    {/* Estado de acesso / progresso */}
                    {bloqueado ? (
                      <div>
                        {pendente && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="text-amber-300 text-xs">Aguardando aprovação</span>
                          </div>
                        )}
                        {negado && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                            <span className="text-red-300 text-xs">Acesso negado</span>
                          </div>
                        )}
                        {semSolicitacao && (
                          <button
                            onClick={(e) => solicitarAcesso(e, t.id)}
                            disabled={solicitando === t.id}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl gradient-brand text-white text-xs font-medium hover:-translate-y-0.5 transition-all disabled:opacity-50">
                            {solicitando === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lock className="w-3 h-3" />}
                            Solicitar acesso
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1">
                            <PlayCircle className="w-3.5 h-3.5" />
                            {t.concluidos}/{t.totalEpisodios} aulas
                          </span>
                          {concluida
                            ? <span className="text-[#d4a72c] flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Concluída</span>
                            : <span className="text-slate-500 flex items-center gap-1">{pct.toFixed(0)}% <ChevronRight className="w-3 h-3 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" /></span>
                          }
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className={`h-full rounded-full origin-left transition-transform duration-300 ${concluida ? 'bg-[#d4a72c]' : 'gradient-brand'}`}
                            style={{ transform: `scaleX(${Math.min(pct, 100) / 100})` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
