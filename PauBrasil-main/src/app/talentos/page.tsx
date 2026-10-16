'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Download, Search, Filter, ChevronLeft, ChevronRight,
  X, FileText, ExternalLink, Loader2, MessageSquare, ArrowRight,
  CheckCircle2, Clock, XCircle, Archive, UserCheck, Trash2, Eye, LayoutGrid, List, Upload
} from 'lucide-react'
import Link from 'next/link'
import { CARREIRAS_GRUPOS, TRANSICOES_VALIDAS } from '@/lib/carreiras-areas'
import { OPERACOES_RH } from '@/lib/operacoes-rh'
import { EtapaCandidatura } from '@prisma/client'
import { KanbanBoard } from '@/components/rh/KanbanBoard'
import { toast } from '@/components/ui/toaster'
import {
  ESCOLARIDADES, FAIXAS_ETARIAS, GENEROS, calcularIdade, rotuloEscolaridade, rotuloGenero,
} from '@/lib/carreiras-perfil'
import { DIAS_RETENCAO_CV, ETAPAS_DE_SAIDA, diasParaApagar, saidaDoFunil } from '@/lib/carreiras-retencao'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CandidaturaItem {
  id: string
  nome: string
  email: string
  telefone?: string
  cidade: string
  estado: string
  cargosInteresse: string[]
  gruposInteresse: string[]
  etapa: EtapaCandidatura
  createdAt: string
  updatedAt: string
  genero?: string | null
  /** Calculada no servidor a partir da data de nascimento. */
  idade?: number | null
  escolaridade?: string | null
}

interface NotaCandidatura {
  id: string
  texto: string
  tipo: 'NOTA' | 'MUDANCA_ETAPA' | 'SISTEMA'
  etapaAnterior?: EtapaCandidatura
  etapaNova?: EtapaCandidatura
  createdAt: string
  autor: { id: string; name: string | null }
}

interface CandidaturaDetail extends CandidaturaItem {
  /** ISO da data pura (meia-noite UTC). */
  dataNascimento?: string | null
  mensagem?: string
  cvPublicId: string | null
  notas: NotaCandidatura[]
}

// ─── Etapa Config ─────────────────────────────────────────────────────────────
const ETAPA_CONFIG: Record<EtapaCandidatura, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  RECEBIDO:   { label: 'Recebido',   color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',    icon: Clock },
  TRIAGEM:    { label: 'Triagem',    color: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/20', icon: Filter },
  ENTREVISTA: { label: 'Entrevista', color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20', icon: UserCheck },
  APROVADO:   { label: 'Aprovado',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  REJEITADO:  { label: 'Rejeitado',  color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',      icon: XCircle },
  ARQUIVADO:  { label: 'Arquivado',  color: 'text-slate-400',   bg: 'bg-slate-500/10 border-slate-500/20',  icon: Archive },
}

function EtapaBadge({ etapa }: { etapa: EtapaCandidatura }) {
  const cfg = ETAPA_CONFIG[etapa]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

// ─── Perfil de triagem ────────────────────────────────────────────────────────

/** "Feminino · 27 anos · Médio completo", pulando o que falta. */
function resumoPerfil(c: { genero?: string | null; idade?: number | null; escolaridade?: string | null }) {
  return [
    rotuloGenero(c.genero),
    c.idade != null ? `${c.idade} anos` : null,
    rotuloEscolaridade(c.escolaridade),
  ].filter(Boolean).join(' · ')
}

/**
 * Gênero, idade e escolaridade na ficha — com edição.
 *
 * A edição existe para as candidaturas de antes do campo existir e para os CVs
 * importados pelo RH, que não passam pelo formulário: sem ela, essas pessoas
 * ficariam para sempre fora dos filtros de perfil.
 */
function PerfilTriagem({ candidatura, onSalvo }: {
  candidatura: CandidaturaDetail
  onSalvo: () => void
}) {
  const nascimentoIso = candidatura.dataNascimento?.slice(0, 10) ?? ''
  const [editando, setEditando] = useState(false)
  const [genero, setGenero] = useState(candidatura.genero ?? '')
  const [nascimento, setNascimento] = useState(nascimentoIso)
  const [escolaridade, setEscolaridade] = useState(candidatura.escolaridade ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // A data vem como meia-noite UTC; `calcularIdade` le em UTC, entao nao
  // escorrega para o dia anterior no fuso do Brasil.
  const idade = candidatura.dataNascimento ? calcularIdade(new Date(candidatura.dataNascimento)) : null
  const resumo = resumoPerfil({ genero: candidatura.genero, idade, escolaridade: candidatura.escolaridade })

  const abrir = () => {
    setGenero(candidatura.genero ?? '')
    setNascimento(nascimentoIso)
    setEscolaridade(candidatura.escolaridade ?? '')
    setErro('')
    setEditando(true)
  }

  const salvar = async () => {
    setSalvando(true)
    setErro('')
    const res = await fetch(`/api/admin/rh/candidaturas/${candidatura.id}/perfil`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        genero:         genero || null,
        dataNascimento: nascimento || null,
        escolaridade:   escolaridade || null,
      }),
    })
    const json = await res.json().catch(() => ({}))
    setSalvando(false)
    if (!res.ok) { setErro(json.error ?? 'Não foi possível salvar'); return }
    setEditando(false)
    onSalvo()
  }

  const cls = 'w-full bg-white/5 border border-white/12 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500/60'

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Perfil</div>
        {!editando && (
          <button onClick={abrir} className="text-[11px] text-brand-400 hover:text-brand-300 transition-colors">
            {resumo ? 'Editar' : 'Preencher'}
          </button>
        )}
      </div>

      {!editando ? (
        resumo
          ? <p className="text-xs text-slate-300">{resumo}</p>
          : <p className="text-xs text-slate-600 italic">Não informado</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="block text-[10px] text-slate-500 mb-1">Nascimento</span>
              <input type="date" className={cls} value={nascimento}
                max={new Date().toISOString().slice(0, 10)}
                onChange={e => setNascimento(e.target.value)} />
            </label>
            <label className="block">
              <span className="block text-[10px] text-slate-500 mb-1">Gênero</span>
              <select className={cls} value={genero} onChange={e => setGenero(e.target.value)}>
                <option value="">Não informado</option>
                {GENEROS.map(g => <option key={g.valor} value={g.valor}>{g.rotulo}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="block text-[10px] text-slate-500 mb-1">Escolaridade</span>
            <select className={cls} value={escolaridade} onChange={e => setEscolaridade(e.target.value)}>
              <option value="">Não informado</option>
              {ESCOLARIDADES.map(e => <option key={e.valor} value={e.valor}>{e.rotulo}</option>)}
            </select>
          </label>
          {erro && <p className="text-[11px] text-red-400">{erro}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setEditando(false)} disabled={salvando}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors">
              Cancelar
            </button>
            <button onClick={salvar} disabled={salvando}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-xs font-medium transition-colors disabled:opacity-40">
              {salvando && <Loader2 className="w-3 h-3 animate-spin" />}
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Retenção do currículo ────────────────────────────────────────────────────

/**
 * Quanto tempo o CV ainda fica guardado, para quem está fora do funil.
 *
 * O cron `/api/cron/limpar-cvs` apaga o currículo 10 dias depois da saída. O
 * RH precisa ver o prazo aqui, na ficha, enquanto ainda dá para reabrir o
 * candidato com o PDF.
 */
function AvisoRetencao({ candidatura }: { candidatura: CandidaturaDetail }) {
  if (!(ETAPAS_DE_SAIDA as readonly string[]).includes(candidatura.etapa)) return null

  const saida = saidaDoFunil(
    candidatura.notas
      .filter(n => n.tipo === 'MUDANCA_ETAPA')
      .map(n => ({ etapaAnterior: n.etapaAnterior ?? null, etapaNova: n.etapaNova ?? null, createdAt: new Date(n.createdAt) })),
    new Date(candidatura.updatedAt)
  )
  const dias = diasParaApagar(saida)

  return (
    <p className="mt-2 text-[11px] text-amber-400/90 text-center leading-relaxed">
      {dias > 0
        ? `O currículo será apagado em ${dias} dia${dias === 1 ? '' : 's'}. Reabra antes, se quiser mantê-lo.`
        : 'O currículo será apagado na próxima limpeza automática.'}
      <span className="block text-slate-600">Quem fica em Rejeitado ou Arquivado perde o CV {DIAS_RETENCAO_CV} dias após sair do funil.</span>
    </p>
  )
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
function CandidaturaDrawer({ id, onClose, onUpdated }: {
  id: string
  onClose: () => void
  onUpdated: () => void
}) {
  const [data,       setData]       = useState<CandidaturaDetail | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [nota,       setNota]       = useState('')
  const [saving,     setSaving]     = useState(false)
  const [actionError, setActionError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/rh/candidaturas/${id}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true)
    setActionError('')
    const res = await fetch(`/api/admin/rh/candidaturas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setActionError(json.error ?? 'Erro'); return false }
    await load()
    onUpdated()
    return true
  }

  const handleEtapa = (etapa: EtapaCandidatura) => {
    patch({ etapa, nota: nota.trim() || undefined })
    setNota('')
  }

  const handleNota = async () => {
    if (!nota.trim()) return
    await patch({ nota: nota.trim() })
    setNota('')
  }

  const openCv = () => {
    // Proxy autenticado — entrega o PDF diretamente com Content-Type correto
    const url = `/api/admin/rh/candidaturas/${id}/cv-url`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col bg-[#111118] border-l border-white/8 shadow-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <h2 className="font-bold text-white text-sm">Candidatura</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      ) : !data ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Não encontrado</div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* Dados básicos */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white text-base">{data.nome}</h3>
                  <a href={`mailto:${data.email}`} className="text-xs text-brand-400 hover:underline">{data.email}</a>
                  {data.telefone && <div className="text-xs text-slate-500 mt-0.5">{data.telefone}</div>}
                  <div className="text-xs text-slate-500 mt-0.5">{data.cidade}, {data.estado}</div>
                </div>
                <div className="text-right shrink-0">
                  <EtapaBadge etapa={data.etapa} />
                  <div className="text-[10px] text-slate-600 mt-1">{fmt(data.createdAt)}</div>
                </div>
              </div>
            </div>

            <PerfilTriagem candidatura={data} onSalvo={() => { load(); onUpdated() }} />

            {/* Cargos */}
            <div className="rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Cargos de Interesse</div>
              <div className="flex flex-wrap gap-1.5">
                {data.cargosInteresse.map(c => (
                  <span key={c} className="px-2 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/25 text-brand-300 text-xs">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Mensagem */}
            {data.mensagem && (
              <div className="rounded-xl border border-white/8 bg-white/3 p-4">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Mensagem</div>
                <p className="text-xs text-slate-300 leading-relaxed">{data.mensagem}</p>
              </div>
            )}

            {/* Visualizar CV */}
            <div>
              {data.cvPublicId ? (
                <>
                  <button
                    onClick={openCv}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-brand-500/30 bg-brand-500/8 text-brand-400 hover:bg-brand-500/15 transition-colors text-sm font-medium">
                    <FileText className="w-4 h-4" />
                    Visualizar Currículo
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </button>
                  <p className="mt-1 text-[10px] text-slate-600 text-center">Abre o PDF em nova aba</p>
                  <AvisoRetencao candidatura={data} />
                </>
              ) : (
                <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/8 bg-white/3 text-slate-600 text-sm">
                  <FileText className="w-4 h-4" />
                  Currículo não está mais disponível
                </div>
              )}
            </div>

            {/* Mudar etapa */}
            {TRANSICOES_VALIDAS[data.etapa]?.length > 0 && (
              <div className="rounded-xl border border-white/8 bg-white/3 p-4">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3">Mover para</div>
                <div className="flex flex-wrap gap-2">
                  {(TRANSICOES_VALIDAS[data.etapa] as EtapaCandidatura[]).map(e => {
                    const cfg = ETAPA_CONFIG[e]
                    return (
                      <button
                        key={e}
                        onClick={() => handleEtapa(e)}
                        disabled={saving}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover:scale-105 disabled:opacity-50 ${cfg.bg} ${cfg.color}`}>
                        <ArrowRight className="w-3 h-3" />
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
                {actionError && <p className="mt-2 text-[11px] text-red-400">{actionError}</p>}
              </div>
            )}

            {/* Histórico de notas */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3">Histórico</div>
              {data.notas.length === 0 ? (
                <p className="text-xs text-slate-600 italic">Nenhuma nota ainda.</p>
              ) : (
                <div className="space-y-2">
                  {data.notas.map(n => (
                    <div key={n.id} className={`rounded-lg px-3 py-2.5 border text-xs
                      ${n.tipo === 'MUDANCA_ETAPA' ? 'border-yellow-500/20 bg-yellow-500/6' :
                        n.tipo === 'SISTEMA'        ? 'border-white/8 bg-white/3' :
                                                      'border-brand-500/20 bg-brand-500/6'}`}>
                      {n.tipo === 'MUDANCA_ETAPA' && n.etapaAnterior && n.etapaNova && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <EtapaBadge etapa={n.etapaAnterior} />
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <EtapaBadge etapa={n.etapaNova} />
                        </div>
                      )}
                      <p className="text-slate-300 leading-relaxed">{n.texto}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-slate-600">
                        <span>{n.autor.name ?? 'Sistema'}</span>
                        <span>·</span>
                        <span>{fmt(n.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Adicionar nota */}
            <div className="rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Adicionar nota</div>
              <textarea
                className="w-full bg-white/5 border border-white/12 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/60 resize-none"
                rows={3}
                placeholder="Escreva uma observação..."
                value={nota}
                onChange={e => setNota(e.target.value)}
              />
              <button
                onClick={handleNota}
                disabled={saving || !nota.trim()}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-white text-xs font-medium transition-colors disabled:opacity-40">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
                Salvar nota
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RhPage() {
  const [items,     setItems]     = useState<CandidaturaItem[]>([])
  const [total,     setTotal]     = useState(0)
  const [pages,     setPages]     = useState(1)
  const [page,      setPage]      = useState(1)
  const [loading,   setLoading]   = useState(true)
  const [cleaning,  setCleaning]  = useState(false)
  const [viewMode,  setViewMode]  = useState<'TABLE' | 'KANBAN'>('TABLE')

  // Filtros
  const [q,         setQ]         = useState('')
  const [cargo,     setCargo]     = useState('')
  const [grupo,     setGrupo]     = useState('')
  const [etapa,     setEtapa]     = useState('')
  const [operacao,  setOperacao]  = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim,    setDataFim]    = useState('')
  const [tipoVaga,   setTipoVaga]   = useState('')
  const [genero,       setGenero]       = useState('')
  const [faixaEtaria,  setFaixaEtaria]  = useState('')
  const [escolaridade, setEscolaridade] = useState('')

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const TODOS_CARGOS_FLAT = CARREIRAS_GRUPOS.flatMap(g => g.cargos)

  const buildQs = useCallback((p = page) => {
    const qs = new URLSearchParams()
    if (q)          qs.set('q', q)
    if (cargo)      qs.set('cargo', cargo)
    if (grupo)      qs.set('grupo', grupo)
    if (etapa)      qs.set('etapa', etapa)
    if (operacao)   qs.set('operacao', operacao)
    if (dataInicio) qs.set('dataInicio', dataInicio)
    if (dataFim)    qs.set('dataFim', dataFim)
    if (tipoVaga)   qs.set('tipoVaga', tipoVaga)
    if (genero)       qs.set('genero', genero)
    if (faixaEtaria)  qs.set('faixaEtaria', faixaEtaria)
    if (escolaridade) qs.set('escolaridade', escolaridade)
    qs.set('page', String(p))
    return qs.toString()
  }, [q, cargo, grupo, etapa, operacao, dataInicio, dataFim, tipoVaga, genero, faixaEtaria, escolaridade, page])

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    const qs = new URLSearchParams()
    if (q)          qs.set('q', q)
    if (cargo)      qs.set('cargo', cargo)
    if (grupo)      qs.set('grupo', grupo)
    if (etapa)      qs.set('etapa', etapa)
    if (operacao)   qs.set('operacao', operacao)
    if (dataInicio) qs.set('dataInicio', dataInicio)
    if (dataFim)    qs.set('dataFim', dataFim)
    if (tipoVaga)   qs.set('tipoVaga', tipoVaga)
    if (genero)       qs.set('genero', genero)
    if (faixaEtaria)  qs.set('faixaEtaria', faixaEtaria)
    if (escolaridade) qs.set('escolaridade', escolaridade)
    qs.set('page', String(p))
    if (viewMode === 'KANBAN') qs.set('limit', '100') // Carregar mais no Kanban

    const res = await fetch(`/api/admin/rh/candidaturas?${qs}`)
    if (res.ok) {
      const data = await res.json()
      setItems(data.items)
      setTotal(data.total)
      setPages(data.pages)
      setPage(p)
    }
    setLoading(false)
  }, [q, cargo, grupo, etapa, operacao, dataInicio, dataFim, tipoVaga, genero, faixaEtaria, escolaridade, viewMode])

  useEffect(() => { load(1) }, [load, viewMode])

  const handleItemMoved = async (id: string, newEtapa: EtapaCandidatura, motivo?: string) => {
    const res = await fetch(`/api/admin/rh/candidaturas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      // O motivo vira nota no historico da candidatura, que e onde ele serve.
      body: JSON.stringify({ etapa: newEtapa, ...(motivo ? { nota: motivo } : {}) }),
    })

    /*
      Antes era `throw new Error('API failed')`, sem ninguem capturando: a
      promessa morria e a tela nao dizia nada. Era assim que "rejeitar" falhava
      em silencio e o cartao ficava onde estava.
    */
    if (!res.ok) {
      const corpo = await res.json().catch(() => ({}))
      // `toast` em vez de `alert`: o dialogo nativo trava a aba e aparece
      // colado no topo, longe do cartao que nao se moveu.
      toast({
        title: corpo.error ?? 'Não foi possível mover o candidato.',
        variant: 'destructive',
      })
      load(page)
      return
    }

    load(page)
  }

  const cleanupCvs = async () => {
    // Desde 2026-10-01 rejeitar/arquivar nao apaga o CV; esta e a unica forma.
    if (!confirm('Remover permanentemente os currículos de todas as candidaturas Rejeitadas e Arquivadas? Quem for reaberto depois ficará sem currículo.')) return
    setCleaning(true)
    const res = await fetch('/api/admin/rh/cleanup-cvs', { method: 'POST' })
    const data = await res.json()
    setCleaning(false)
    if (res.ok) alert(`${data.deleted} CV(s) removido(s) com sucesso.`)
    else alert(data.error ?? 'Erro ao limpar CVs')
  }

  const exportCsv = () => {
    const qs = new URLSearchParams()
    if (q)          qs.set('q', q)
    if (cargo)      qs.set('cargo', cargo)
    if (grupo)      qs.set('grupo', grupo)
    if (etapa)      qs.set('etapa', etapa)
    if (operacao)   qs.set('operacao', operacao)
    if (dataInicio) qs.set('dataInicio', dataInicio)
    if (dataFim)    qs.set('dataFim', dataFim)
    if (tipoVaga)   qs.set('tipoVaga', tipoVaga)
    if (genero)       qs.set('genero', genero)
    if (faixaEtaria)  qs.set('faixaEtaria', faixaEtaria)
    if (escolaridade) qs.set('escolaridade', escolaridade)
    qs.set('export', 'csv')
    window.open(`/api/admin/rh/candidaturas?${qs}`, '_blank')
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  const selCls = "bg-white/5 border border-white/12 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500/60 transition-all"

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-500/15 border border-pink-500/25 flex items-center justify-center">
            <Users className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-white">Banco de Talentos</h1>
            <p className="text-[11px] text-slate-500">{total} candidatura{total !== 1 ? 's' : ''} no total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 border border-white/12 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-md text-xs transition-colors ${viewMode === 'TABLE' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Visão Tabela"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('KANBAN')}
              className={`p-1.5 rounded-md text-xs transition-colors ${viewMode === 'KANBAN' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Visão Kanban"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={cleanupCvs}
            disabled={cleaning}
            title="Remove CVs de candidaturas Rejeitadas e Arquivadas do Cloudinary"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/15 transition-colors disabled:opacity-40">
            {cleaning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Limpar CVs
          </button>
          <button onClick={exportCsv}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/12 bg-white/5 text-xs text-slate-300 hover:text-white hover:bg-white/8 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
          <Link href="/talentos/importar"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-500/25 bg-brand-500/8 text-xs text-brand-400 hover:text-brand-300 hover:bg-brand-500/15 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Importar CVs
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass-card rounded-2xl p-4 mb-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Busca */}
        <div className="relative col-span-2 sm:col-span-3 lg:col-span-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            className="w-full bg-white/5 border border-white/12 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/60 transition-all"
            placeholder="Nome ou email..."
            value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(1)}
          />
        </div>

        <select className={selCls} value={grupo} onChange={e => setGrupo(e.target.value)}>
          <option value="">Grupo</option>
          {CARREIRAS_GRUPOS.map(g => <option key={g.slug} value={g.slug}>{g.grupo}</option>)}
        </select>

        <select className={selCls} value={cargo} onChange={e => setCargo(e.target.value)}>
          <option value="">Cargo</option>
          {TODOS_CARGOS_FLAT.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className={selCls} value={etapa} onChange={e => setEtapa(e.target.value)}>
          <option value="">Etapa</option>
          {Object.entries(ETAPA_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select className={selCls} value={operacao} onChange={e => setOperacao(e.target.value)}>
          <option value="">Operação</option>
          {Object.entries(OPERACOES_RH).map(([key, op]) => (
            <option key={key} value={key}>{op.label} / {op.uf} ({op.tipo})</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <input type="date" className={selCls + ' w-full'} value={dataInicio}
            onChange={e => setDataInicio(e.target.value)} title="Data início" />
        </div>
        <div className="flex items-center gap-1">
          <input type="date" className={selCls + ' w-full'} value={dataFim}
            onChange={e => setDataFim(e.target.value)} title="Data fim" />
        </div>

        <select className={selCls} value={tipoVaga} onChange={e => setTipoVaga(e.target.value)}>
          <option value="">Tipo vaga</option>
          <option value="pcd">PCD</option>
          <option value="mulheres">Mulheres</option>
        </select>

        {/*
          Perfil de triagem. "Não informado" acha quem se candidatou antes do
          campo existir e os CVs importados — para o RH completar a ficha.
        */}
        <select className={selCls} value={genero} onChange={e => setGenero(e.target.value)}>
          <option value="">Gênero</option>
          {GENEROS.map(g => <option key={g.valor} value={g.valor}>{g.rotulo}</option>)}
          <option value="sem">Não informado</option>
        </select>

        <select className={selCls} value={faixaEtaria} onChange={e => setFaixaEtaria(e.target.value)}>
          <option value="">Idade</option>
          {FAIXAS_ETARIAS.map(f => <option key={f.valor} value={f.valor}>{f.rotulo}</option>)}
          <option value="sem">Não informada</option>
        </select>

        <select className={selCls} value={escolaridade} onChange={e => setEscolaridade(e.target.value)}>
          <option value="">Escolaridade</option>
          {ESCOLARIDADES.map(e => <option key={e.valor} value={e.valor}>{e.rotulo}</option>)}
          <option value="sem">Não informada</option>
        </select>
      </div>

      {/* Rendering Tabela ou Kanban */}
      <div className={`glass-card rounded-2xl overflow-hidden ${viewMode === 'KANBAN' ? 'hidden' : ''}`}>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Carregando...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            Nenhuma candidatura encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Nome</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Perfil</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Cargos</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Cidade</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Data</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Etapa</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item, i) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedId(item.id)}
                    className="cursor-pointer hover:bg-white/3 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white text-sm">{item.nome}</div>
                      <div className="text-[11px] text-slate-500">{item.email}</div>
                      {/* No celular a coluna Perfil some; o resumo vem aqui. */}
                      {resumoPerfil(item) && (
                        <div className="text-[11px] text-slate-400 mt-0.5 md:hidden">{resumoPerfil(item)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {resumoPerfil(item)
                        ? <span className="text-xs text-slate-300">{resumoPerfil(item)}</span>
                        : <span className="text-xs text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {item.cargosInteresse.slice(0, 2).map(c => (
                          <span key={c} className="px-1.5 py-0.5 rounded text-[10px] bg-brand-500/10 text-brand-400 border border-brand-500/20">
                            {c}
                          </span>
                        ))}
                        {item.cargosInteresse.length > 2 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-500">+{item.cargosInteresse.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-slate-400">{item.cidade}, {item.estado}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-slate-500">{fmt(item.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <EtapaBadge etapa={item.etapa} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Eye className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors inline-block" />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewMode === 'KANBAN' && !loading && items.length > 0 && (
        <div className="mt-6">
          <KanbanBoard 
            items={items} 
            onItemClick={setSelectedId} 
            onItemMoved={handleItemMoved} 
          />
        </div>
      )}

      {/* Paginação (apenas na tabela) */}
      {viewMode === 'TABLE' && pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/8 glass-card rounded-b-2xl -mt-4 relative z-10 bg-[#111118]">
          <span className="text-xs text-slate-500">{total} resultados · página {page}/{pages}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => load(page - 1)} disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-white/8 text-slate-400 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => load(page + 1)} disabled={page >= pages}
                className="p-1.5 rounded-lg hover:bg-white/8 text-slate-400 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      {/* Drawer */}
      <AnimatePresence>
        {selectedId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <CandidaturaDrawer
              id={selectedId}
              onClose={() => setSelectedId(null)}
              onUpdated={() => load(page)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
