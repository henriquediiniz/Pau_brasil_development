'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, CheckCircle2, PlayCircle, Clock, Loader2,
  ChevronLeft, Award, X, Lock, FileQuestion, Send
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/toaster'

interface Progresso { id: string; concluidoEm: string | null }
interface Episodio {
  id: string; titulo: string; descricao: string | null; videoUrl: string
  duracaoMin: number; ordem: number; publicado: boolean
  progressos: Progresso[]
}
interface PreRequisito { temporadaId: string; titulo: string; concluido: boolean; expirado: boolean }
interface Temporada {
  id: string; titulo: string; descricao: string | null
  restricaoAcesso: boolean
  acessoBloqueado: boolean
  matriculaStatus: 'PENDENTE' | 'APROVADO' | 'NEGADO' | null
  episodios: Episodio[]
  certificado: { id: string; emitidoEm: string; validoAte?: string | null } | null
  certExpirado: boolean
  temProva: boolean
  quizAprovado: boolean
  preRequisitosStatus: PreRequisito[]
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1)
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v')
    return null
  } catch { return null }
}

export default function TemporadaPage({ params }: { params: { temporadaId: string } }) {
  const router = useRouter()
  const [temporada, setTemporada] = useState<Temporada | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeEp, setActiveEp] = useState<Episodio | null>(null)
  const [marking, setMarking] = useState(false)
  const [showCertModal, setShowCertModal] = useState(false)
  const [solicitando, setSolicitando] = useState(false)

  // Watch-time tracking
  const [watchedSeconds, setWatchedSeconds] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const playerRef   = useRef<any>(null)
  const activeEpId = activeEp?.id
  const activeVideoUrl = activeEp?.videoUrl

  const load = useCallback(async () => {
    const res = await fetch(`/api/universidade/temporadas/${params.temporadaId}`)
    if (res.ok) {
      const data = await res.json()
      setTemporada(data)
      setActiveEp((current) => current ?? data.episodios?.[0] ?? null)
    }
    setLoading(false)
  }, [params.temporadaId])

  useEffect(() => { load() }, [load])

  function startCounter() {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => setWatchedSeconds(s => s + 1), 1000)
    }
  }
  function stopCounter() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }

  // Cria o player YouTube via API oficial — o único jeito 100% confiável
  // O `key={activeEp?.id}` no container força remount a cada troca de episódio,
  // garantindo um div limpo para a API montar o iframe.
  useEffect(() => {
    const vid = activeVideoUrl ? extractYouTubeId(activeVideoUrl) : null
    if (!vid) return

    // Reseta o contador ao iniciar novo vídeo
    setWatchedSeconds(0)
    stopCounter()

    function initPlayer() {
      // Garante que o elemento ainda existe no DOM (pode ter desmontado)
      if (!document.getElementById('yt-player-container')) return

      playerRef.current = new (window as any).YT.Player('yt-player-container', {
        videoId: vid,
        width: '100%',
        height: '100%',
        playerVars: { origin: window.location.origin, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e: any) => {
            e.data === 1 ? startCounter() : stopCounter()
          },
        },
      })
    }

    if ((window as any).YT?.Player) {
      initPlayer()
    } else {
      // Injeta o script apenas uma vez
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement('script')
        s.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(s)
      }
      // Encadeia com possíveis handlers anteriores
      const prev = (window as any).onYouTubeIframeAPIReady
      ;(window as any).onYouTubeIframeAPIReady = () => {
        if (prev) prev()
        initPlayer()
      }
    }

    return () => {
      stopCounter()
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch {}
        playerRef.current = null
      }
    }
  }, [activeEpId, activeVideoUrl])

  async function marcarAssistido() {
    if (!activeEp) return
    setMarking(true)
    try {
      const res = await fetch('/api/universidade/progresso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodioId: activeEp.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: '✅ Marcado como assistido!' })
      if (data.certificado) {
        setShowCertModal(true)
      } else if (data.temProva) {
        toast({ title: '🎓 Todos os episódios concluídos! Faça a prova para obter o certificado.' })
      }
      await load()
      if (temporada) {
        const idx = temporada.episodios.findIndex(e => e.id === activeEp.id)
        if (idx < temporada.episodios.length - 1) {
          setActiveEp(temporada.episodios[idx + 1])
        }
      }
    } catch (e: any) {
      toast({ title: e.message || 'Erro ao marcar', variant: 'destructive' })
    } finally {
      setMarking(false)
    }
  }

  async function solicitarAcesso() {
    setSolicitando(true)
    try {
      const res = await fetch(`/api/universidade/acesso/${params.temporadaId}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: '✅ Solicitação enviada! Aguarde a aprovação.' })
      await load()
    } catch (e: any) {
      toast({ title: e.message || 'Erro', variant: 'destructive' })
    } finally {
      setSolicitando(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  )
  if (!temporada) return (
    <div className="text-center py-20 text-slate-500">Temporada não encontrada.</div>
  )

  // Acesso bloqueado
  if (temporada.acessoBloqueado) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/universidade" className="text-slate-500 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-display font-bold text-white">{temporada.titulo}</h1>
        </div>
        <div className="rounded-2xl bg-white/3 border border-white/8 p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
          <div>
            <h2 className="text-white font-display font-bold text-lg">Acesso restrito</h2>
            <p className="text-slate-400 text-sm mt-1">Este curso exige aprovação de matrícula para acessar o conteúdo.</p>
          </div>
          {temporada.matriculaStatus === 'PENDENTE' && (
            <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <p className="text-amber-300 text-sm font-medium">Solicitação enviada — aguardando aprovação</p>
            </div>
          )}
          {temporada.matriculaStatus === 'NEGADO' && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-red-300 text-sm font-medium">Sua solicitação foi negada.</p>
            </div>
          )}
          {!temporada.matriculaStatus && (
            <button onClick={solicitarAcesso} disabled={solicitando}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50">
              {solicitando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Solicitar acesso
            </button>
          )}
        </div>
      </div>
    )
  }

  const total = temporada.episodios.length
  const concluidos = temporada.episodios.filter(e => e.progressos[0]?.concluidoEm).length
  const pct = total > 0 ? (concluidos / total) * 100 : 0
  const activeIsConcluido = activeEp?.progressos[0]?.concluidoEm != null
  const videoId = activeEp ? extractYouTubeId(activeEp.videoUrl) : null
  const todosConcluidos = total > 0 && concluidos === total

  // Minimum watch time = full episode duration set by admin (fallback 60s if not set)
  const minWatchSeconds = activeEp && activeEp.duracaoMin > 0
    ? activeEp.duracaoMin * 60
    : 60
  // Button unlocks when: already concluded, no YouTube video (can't track), or watched enough
  const canMark = activeIsConcluido || !videoId || watchedSeconds >= minWatchSeconds
  const watchPct = Math.min((watchedSeconds / minWatchSeconds) * 100, 100)

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Back + header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Link href="/universidade" className="text-slate-500 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-white">{temporada.titulo}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-slate-500 text-xs">{concluidos}/{total} episódios</span>
            <div className="flex-1 max-w-xs h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full gradient-brand origin-left transition-transform duration-300" style={{ transform: `scaleX(${pct / 100})` }} />
            </div>
            <span className="text-slate-500 text-xs">{pct.toFixed(0)}%</span>
          </div>
        </div>
        {temporada.certExpirado && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-xs font-medium">Certificado expirado</span>
          </div>
        )}
        {temporada.certificado && !temporada.certExpirado && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#b88c0b]/10 border border-[#b88c0b]/30">
            <Award className="w-4 h-4 text-[#d4a72c]" />
            <div>
              <span className="text-[#d4a72c] text-xs font-medium">Certificado emitido</span>
              {temporada.certificado.validoAte && (
                <p className="text-[#9a7509] text-[10px] leading-none mt-0.5">
                  Válido até {new Date(temporada.certificado.validoAte).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Pré-requisitos pendentes */}
      {temporada.preRequisitosStatus.some(p => !p.concluido) && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-amber-500/8 border border-amber-500/25 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-amber-300 text-sm font-medium">Conclua os cursos pré-requisitos antes de fazer a prova:</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {temporada.preRequisitosStatus.map(p => (
              <Link
                key={p.temporadaId}
                href={`/universidade/${p.temporadaId}`}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  p.expirado
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20'
                    : p.concluido
                    ? 'bg-[#b88c0b]/10 border-[#b88c0b]/30 text-[#e0c27a]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                {p.concluido
                  ? <CheckCircle2 className="w-3 h-3" />
                  : p.expirado
                  ? <Clock className="w-3 h-3" />
                  : <Lock className="w-3 h-3" />}
                {p.titulo}
                {p.expirado && <span className="opacity-70">(expirado)</span>}
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quiz CTA — todos os ep concluídos, tem prova, ainda não aprovado */}
      {todosConcluidos && temporada.temProva && !temporada.certificado && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-brand-500/10 border border-brand-500/30 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center shrink-0">
            <FileQuestion className="w-5 h-5 text-brand-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">Parabéns! Você concluiu todos os episódios.</p>
            <p className="text-slate-400 text-xs mt-0.5">Faça a prova final e obtenha seu certificado (mínimo 80%).</p>
          </div>
          <Link href={`/universidade/${temporada.id}/quiz`}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 transition-all">
            <FileQuestion className="w-4 h-4" /> Fazer prova
          </Link>
        </motion.div>
      )}

      {/* Main split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Player — 2/3 */}
        <div className="lg:col-span-2 space-y-3">
          <div className="rounded-2xl overflow-hidden bg-black aspect-video">
            {videoId ? (
              <div key={activeEp?.id} id="yt-player-container" className="w-full h-full" />
            ) : null}
            {!videoId && (
              <div className="w-full h-full flex items-center justify-center text-slate-600">
                <PlayCircle className="w-16 h-16" />
              </div>
            )}
          </div>

          {activeEp && (
            <div className="rounded-2xl bg-white/3 border border-white/8 p-4 space-y-3">
              <div>
                <h2 className="text-white font-bold">{activeEp.titulo}</h2>
                {activeEp.descricao && <p className="text-slate-400 text-sm mt-1">{activeEp.descricao}</p>}
                {activeEp.duracaoMin > 0 && (
                  <span className="text-slate-600 text-xs flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" /> {activeEp.duracaoMin} min
                  </span>
                )}
              </div>

              {activeIsConcluido ? (
                <div className="flex items-center gap-2 text-[#d4a72c] text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Assistido
                </div>
              ) : canMark ? (
                <button onClick={marcarAssistido} disabled={marking}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50">
                  {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Marcar como assistido
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Lock className="w-3 h-3" />
                      Assista o vídeo completo para concluir
                    </span>
                    <span className="text-slate-500 tabular-nums">
                      {Math.floor(watchedSeconds / 60)}:{String(watchedSeconds % 60).padStart(2, '0')} / {activeEp?.duracaoMin ?? 0}min
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full gradient-brand"
                      initial={{ width: 0 }}
                      animate={{ width: `${watchPct}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <button disabled
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-500 text-sm font-medium cursor-not-allowed">
                    <Lock className="w-4 h-4" /> Marcar como assistido
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Episode list — 1/3 */}
        <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Episódios</p>
          </div>
          <div className="divide-y divide-white/5 overflow-y-auto max-h-[480px]">
            {temporada.episodios.map((ep, i) => {
              const concluido = ep.progressos[0]?.concluidoEm != null
              const isActive = activeEp?.id === ep.id
              return (
                <button key={ep.id} onClick={() => setActiveEp(ep)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors
                    ${isActive ? 'bg-brand-500/10 border-l-2 border-l-brand-500' : 'hover:bg-white/3'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold
                    ${concluido ? 'bg-[#b88c0b]/20 text-[#d4a72c]' : isActive ? 'bg-brand-500/20 text-brand-400' : 'bg-white/5 text-slate-500'}`}>
                    {concluido ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-brand-400' : concluido ? 'text-slate-400' : 'text-white'}`}>
                      {ep.titulo}
                    </p>
                    {ep.duracaoMin > 0 && (
                      <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{ep.duracaoMin} min
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Certificate modal */}
      <AnimatePresence>
        {showCertModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-[#111118] rounded-2xl border border-white/10 p-8 max-w-sm w-full text-center shadow-2xl">
              <button onClick={() => setShowCertModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <div className="w-20 h-20 rounded-full bg-[#b88c0b]/10 border-2 border-[#b88c0b]/40 flex items-center justify-center mx-auto mb-5">
                <Award className="w-10 h-10 text-[#d4a72c]" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">Parabéns!</h2>
              <p className="text-slate-400 text-sm mb-4">
                Você concluiu <strong className="text-white">{temporada.titulo}</strong> e ganhou seu certificado!
              </p>
              <Link href="/universidade/certificados"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20">
                <Award className="w-4 h-4" /> Ver certificados
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
