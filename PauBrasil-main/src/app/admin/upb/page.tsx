'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, Plus, Pencil, ChevronDown, ChevronRight,
  Eye, EyeOff, ArrowUp, ArrowDown, X, Check, Loader2, Power, PlayCircle,
  Lock, FileQuestion, Trash2, Users, CheckCircle2, XCircle, Building2, BarChart3, AlertCircle, Clock, Briefcase
} from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { ImageUpload } from '@/components/ui/image-upload'
import Link from 'next/link'

interface Episodio {
  id: string; titulo: string; descricao: string | null; videoUrl: string
  duracaoMin: number; ordem: number; publicado: boolean
}
interface Temporada {
  id: string; titulo: string; descricao: string | null; capa: string | null
  ordem: number; ativo: boolean; restricaoAcesso: boolean
  empresas: string[]; unidades: string[]; funcoesComAcesso: string[]
  preRequisitos: string[]; validadeDias: number | null
  episodios: Episodio[]
  _count: { certificados: number; questoes: number }
}

interface Opcao { id?: string; texto: string; correta: boolean; ordem: number }
interface Questao {
  id: string; enunciado: string; ordem: number
  opcoes: { id: string; texto: string; correta: boolean; ordem: number }[]
}

interface Matricula {
  id: string
  status: 'PENDENTE' | 'APROVADO' | 'NEGADO'
  createdAt: string
  nota: string | null
  user: { id: string; name: string; email: string }
  temporada: { id: string; titulo: string }
}

const EMPTY_T = { titulo: '', descricao: '', capa: '', restricaoAcesso: false, empresas: [] as string[], unidades: [] as string[], preRequisitos: [] as string[], validadeDias: null as number | null }
const EMPTY_E = { titulo: '', descricao: '', videoUrl: '', duracaoMin: 0, ordem: 0, temporadaId: '' }
const EMPTY_OPCAO: Opcao = { texto: '', correta: false, ordem: 0 }

interface Obrigatorio {
  id: string
  temporadaId: string
  temporadaTitulo: string
  empresas: string[]
  unidades: string[]
  funcoes: string[]
  funcoesNomes: string[]
  prazo: string
  elegíveis: number
  concluidos: number
}

interface FuncaoOpt { id: string; name: string }

const EMPTY_OBR = { temporadaId: '', empresas: [] as string[], unidades: [] as string[], funcoes: [] as string[], prazo: '' }

export default function AdminUPBPage() {
  const [tab, setTab] = useState<'cursos' | 'matriculas' | 'obrigatorios' | 'certificados'>('cursos')
  const [temporadas, setTemporadas] = useState<Temporada[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [empresasList, setEmpresasList] = useState<string[]>([])
  const [unidadesList, setUnidadesList] = useState<string[]>([])
  const [unidadesLoading, setUnidadesLoading] = useState(false)
  const [funcoesList, setFuncoesList] = useState<FuncaoOpt[]>([])

  // Temporada modal
  const [tModal, setTModal] = useState<{ mode: 'create' | 'edit'; id?: string } | null>(null)
  const [tForm, setTForm] = useState(EMPTY_T)

  // Episódio modal
  const [eModal, setEModal] = useState<{ mode: 'create' | 'edit'; id?: string; temporadaId: string } | null>(null)
  const [eForm, setEForm] = useState(EMPTY_E)

  // Questões modal
  const [qModal, setQModal] = useState<{ temporadaId: string; titulo: string } | null>(null)
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [qLoading, setQLoading] = useState(false)
  const [qForm, setQForm] = useState({ enunciado: '', ordem: 0, opcoes: [{ ...EMPTY_OPCAO }, { ...EMPTY_OPCAO }] })
  const [editingQ, setEditingQ] = useState<Questao | null>(null)
  const [qSaving, setQSaving] = useState(false)

  // Acesso por função
  const [savingFuncoes, setSavingFuncoes] = useState<string | null>(null) // temporadaId

  async function toggleFuncaoAcesso(temporada: Temporada, funcaoId: string) {
    const atual = temporada.funcoesComAcesso ?? []
    const novo = atual.includes(funcaoId) ? atual.filter(f => f !== funcaoId) : [...atual, funcaoId]
    setSavingFuncoes(temporada.id)
    try {
      const res = await fetch(`/api/admin/upb/temporadas/${temporada.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funcoesComAcesso: novo }),
      })
      if (!res.ok) throw new Error()
      await load()
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setSavingFuncoes(null)
    }
  }

  // Matrículas
  const [matriculas, setMatriculas] = useState<Matricula[]>([])
  const [mLoading, setMLoading] = useState(false)
  const [revisando, setRevisando] = useState<string | null>(null)

  // Certificados / Zerar progresso
  interface AlunoItem {
    userId: string; name: string; email: string
    status: 'CERTIFICADO' | 'EM_ANDAMENTO' | 'MATRICULADO'
    episodiosConcluidos: number; tentativas: number; aprovadoNoQuiz: boolean
    matriculaStatus: string | null
    certificadoEm: string | null; certificadoValidoAte: string | null
  }
  const [certTemporadaId, setCertTemporadaId] = useState<string>('')
  const [alunos, setAlunos] = useState<AlunoItem[]>([])
  const [alunosLoading, setAlunosLoading] = useState(false)
  const [totalEpisodios, setTotalEpisodios] = useState(0)
  const [confirmZerar, setConfirmZerar] = useState<AlunoItem | null>(null)
  const [zerando, setZerando] = useState(false)

  async function loadAlunos(temporadaId: string) {
    if (!temporadaId) { setAlunos([]); return }
    setAlunosLoading(true)
    try {
      const res = await fetch(`/api/admin/upb/temporadas/${temporadaId}/alunos`)
      if (res.ok) {
        const data = await res.json()
        setAlunos(data.alunos ?? [])
        setTotalEpisodios(data.totalEpisodios ?? 0)
      }
    } finally {
      setAlunosLoading(false)
    }
  }

  async function handleZerar() {
    if (!confirmZerar || !certTemporadaId) return
    setZerando(true)
    try {
      const res = await fetch(
        `/api/admin/upb/temporadas/${certTemporadaId}/alunos/${confirmZerar.userId}/zerar`,
        { method: 'DELETE' },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao zerar')
      toast({ title: `✅ Progresso de ${confirmZerar.name} zerado.` })
      setConfirmZerar(null)
      loadAlunos(certTemporadaId)
    } catch (e: unknown) {
      toast({ title: (e as Error).message ?? 'Erro ao zerar', variant: 'destructive' })
    } finally {
      setZerando(false)
    }
  }

  // Obrigatórios
  const [obrigatorios, setObrigatorios] = useState<Obrigatorio[]>([])
  const [obrLoading, setObrLoading] = useState(false)
  const [obrForm, setObrForm] = useState(EMPTY_OBR)
  const [obrSaving, setObrSaving] = useState(false)
  const [obrModal, setObrModal] = useState(false)
  const [editingObr, setEditingObr] = useState<Obrigatorio | null>(null)
  const empresasSelecionadas = tForm.empresas
  const empresasKey = empresasSelecionadas.join(',')

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/upb/temporadas')
    if (res.ok) setTemporadas(await res.json())
    setLoading(false)
  }, [])

  const loadMatriculas = useCallback(async () => {
    setMLoading(true)
    const res = await fetch('/api/admin/upb/matriculas')
    if (res.ok) setMatriculas(await res.json())
    setMLoading(false)
  }, [])

  const loadObrigatorios = useCallback(async () => {
    setObrLoading(true)
    const res = await fetch('/api/admin/upb/obrigatorios')
    if (res.ok) setObrigatorios(await res.json())
    setObrLoading(false)
  }, [])

  async function saveObrigatorio() {
    if (!obrForm.temporadaId || !obrForm.prazo) return
    setObrSaving(true)
    try {
      const url = editingObr ? `/api/admin/upb/obrigatorios/${editingObr.id}` : '/api/admin/upb/obrigatorios'
      const method = editingObr ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obrForm) })
      if (!res.ok) throw new Error()
      toast({ title: editingObr ? '✅ Atualizado!' : '✅ Treinamento obrigatório criado!' })
      setObrModal(false)
      setEditingObr(null)
      setObrForm(EMPTY_OBR)
      loadObrigatorios()
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setObrSaving(false)
    }
  }

  async function deleteObrigatorio(id: string) {
    await fetch(`/api/admin/upb/obrigatorios/${id}`, { method: 'DELETE' })
    loadObrigatorios()
  }

  useEffect(() => {
    load()
    fetch('/api/admin/empresas').then(r => r.ok ? r.json() : []).then(d => setEmpresasList(Array.isArray(d) ? d.map((e: any) => e.nome) : []))
    fetch('/api/admin/funcoes').then(r => r.ok ? r.json() : []).then(d => setFuncoesList(Array.isArray(d) ? d.map((f: any) => ({ id: f.id, name: f.name })) : []))
  }, [load])
  useEffect(() => { if (tab === 'matriculas') loadMatriculas() }, [tab, loadMatriculas])
  useEffect(() => { if (tab === 'obrigatorios') loadObrigatorios() }, [tab, loadObrigatorios])

  // Busca unidades das empresas selecionadas no form de temporada
  useEffect(() => {
    if (empresasSelecionadas.length === 0) { setUnidadesList([]); return }
    setUnidadesLoading(true)
    fetch(`/api/admin/unidades?empresas=${encodeURIComponent(empresasSelecionadas.join(','))}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setUnidadesList(Array.isArray(d) ? d : []) })
      .finally(() => setUnidadesLoading(false))
  }, [empresasKey, empresasSelecionadas])

  function toggle(id: string) { setOpen(p => ({ ...p, [id]: !p[id] })) }

  function openCreateT() { setTForm(EMPTY_T); setTModal({ mode: 'create' }) }
  function openEditT(t: Temporada) {
    setTForm({ titulo: t.titulo, descricao: t.descricao ?? '', capa: t.capa ?? '', restricaoAcesso: t.restricaoAcesso, empresas: t.empresas ?? [], unidades: t.unidades ?? [], preRequisitos: t.preRequisitos ?? [], validadeDias: t.validadeDias ?? null })
    setTModal({ mode: 'edit', id: t.id })
  }
  function openCreateE(temporadaId: string) {
    setEForm({ ...EMPTY_E, temporadaId })
    setEModal({ mode: 'create', temporadaId })
  }
  function openEditE(ep: Episodio, temporadaId: string) {
    setEForm({ titulo: ep.titulo, descricao: ep.descricao ?? '', videoUrl: ep.videoUrl, duracaoMin: ep.duracaoMin, ordem: ep.ordem, temporadaId })
    setEModal({ mode: 'edit', id: ep.id, temporadaId })
  }

  async function openQuestoes(t: Temporada) {
    setQModal({ temporadaId: t.id, titulo: t.titulo })
    setQLoading(true)
    setQForm({ enunciado: '', ordem: 0, opcoes: [{ ...EMPTY_OPCAO }, { ...EMPTY_OPCAO }] })
    setEditingQ(null)
    const res = await fetch(`/api/admin/upb/questoes?temporadaId=${t.id}`)
    if (res.ok) setQuestoes(await res.json())
    setQLoading(false)
  }

  async function saveTemporada() {
    setSaving(true)
    try {
      const url = tModal?.mode === 'edit' ? `/api/admin/upb/temporadas/${tModal.id}` : '/api/admin/upb/temporadas'
      const method = tModal?.mode === 'edit' ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tForm) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast({ title: tModal?.mode === 'edit' ? '✅ Temporada atualizada' : '✅ Temporada criada' })
      setTModal(null); load()
    } catch (e: any) {
      toast({ title: e.message || 'Erro', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  async function saveEpisodio() {
    setSaving(true)
    try {
      const url = eModal?.mode === 'edit' ? `/api/admin/upb/episodios/${eModal.id}` : '/api/admin/upb/episodios'
      const method = eModal?.mode === 'edit' ? 'PATCH' : 'POST'
      const body = eModal?.mode === 'edit'
        ? { titulo: eForm.titulo, descricao: eForm.descricao, videoUrl: eForm.videoUrl, duracaoMin: eForm.duracaoMin, ordem: eForm.ordem }
        : eForm
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast({ title: eModal?.mode === 'edit' ? '✅ Episódio atualizado' : '✅ Episódio criado' })
      setEModal(null); load()
    } catch (e: any) {
      toast({ title: e.message || 'Erro', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  async function saveQuestao() {
    if (!qModal) return
    if (qForm.opcoes.filter(o => o.correta).length !== 1) {
      toast({ title: 'Marque exatamente 1 opção como correta', variant: 'destructive' }); return
    }
    setQSaving(true)
    try {
      const url = editingQ ? `/api/admin/upb/questoes/${editingQ.id}` : '/api/admin/upb/questoes'
      const method = editingQ ? 'PATCH' : 'POST'
      const body = editingQ
        ? { enunciado: qForm.enunciado, ordem: qForm.ordem, opcoes: qForm.opcoes }
        : { temporadaId: qModal.temporadaId, enunciado: qForm.enunciado, ordem: qForm.ordem, opcoes: qForm.opcoes }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const d = await res.json(); throw new Error(JSON.stringify(d.error)) }
      toast({ title: editingQ ? '✅ Questão atualizada' : '✅ Questão criada' })
      setQForm({ enunciado: '', ordem: 0, opcoes: [{ ...EMPTY_OPCAO }, { ...EMPTY_OPCAO }] })
      setEditingQ(null)
      const r2 = await fetch(`/api/admin/upb/questoes?temporadaId=${qModal.temporadaId}`)
      if (r2.ok) setQuestoes(await r2.json())
      load()
    } catch (e: any) {
      toast({ title: e.message || 'Erro', variant: 'destructive' })
    } finally { setQSaving(false) }
  }

  async function deleteQuestao(id: string) {
    if (!qModal) return
    const res = await fetch(`/api/admin/upb/questoes/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Questão removida' })
      const r2 = await fetch(`/api/admin/upb/questoes?temporadaId=${qModal.temporadaId}`)
      if (r2.ok) setQuestoes(await r2.json())
      load()
    }
  }

  async function revisarMatricula(id: string, status: 'APROVADO' | 'NEGADO') {
    setRevisando(id)
    try {
      const res = await fetch(`/api/admin/upb/matriculas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Erro')
      toast({ title: status === 'APROVADO' ? '✅ Acesso aprovado' : 'Acesso negado' })
      loadMatriculas()
    } catch {
      toast({ title: 'Erro ao revisar', variant: 'destructive' })
    } finally { setRevisando(null) }
  }

  async function togglePublicado(ep: Episodio) {
    const res = await fetch(`/api/admin/upb/episodios/${ep.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicado: !ep.publicado }),
    })
    if (res.ok) { toast({ title: ep.publicado ? 'Episódio despublicado' : '✅ Episódio publicado' }); load() }
  }

  async function toggleAtivoT(t: Temporada) {
    const res = await fetch(`/api/admin/upb/temporadas/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !t.ativo }),
    })
    if (res.ok) { toast({ title: t.ativo ? 'Temporada desativada' : '✅ Temporada ativada' }); load() }
  }

  async function moverEpisodio(ep: Episodio, dir: 'up' | 'down', eps: Episodio[]) {
    const idx = eps.findIndex(e => e.id === ep.id)
    const target = dir === 'up' ? eps[idx - 1] : eps[idx + 1]
    if (!target) return
    await Promise.all([
      fetch(`/api/admin/upb/episodios/${ep.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ordem: target.ordem }) }),
      fetch(`/api/admin/upb/episodios/${target.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ordem: ep.ordem }) }),
    ])
    load()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  )

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
  const pendentes = matriculas.filter(m => m.status === 'PENDENTE').length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-6 h-6 text-brand-400" />
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Universidade Pau Brasil</h1>
            <p className="text-slate-400 text-sm">{temporadas.length} temporada{temporadas.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/upb/relatorio"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/8 hover:text-white transition-all">
            <BarChart3 className="w-4 h-4" /> Relatório
          </Link>
          {tab === 'cursos' && (
            <button onClick={openCreateT}
              className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 transition-all">
              <Plus className="w-4 h-4" /> Nova temporada
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-white/8 w-fit">
        <button onClick={() => setTab('cursos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'cursos' ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-slate-500 hover:text-white'}`}>
          Cursos
        </button>
        <button onClick={() => setTab('matriculas')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === 'matriculas' ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-slate-500 hover:text-white'}`}>
          <Users className="w-4 h-4" /> Matrículas
          {pendentes > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">{pendentes}</span>
          )}
        </button>
        <button onClick={() => setTab('obrigatorios')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === 'obrigatorios' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-slate-500 hover:text-white'}`}>
          <AlertCircle className="w-4 h-4" /> Obrigatórios
        </button>
        <button onClick={() => setTab('certificados')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === 'certificados' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-500 hover:text-white'}`}>
          <GraduationCap className="w-4 h-4" /> Certificados
        </button>
      </div>

      {/* Tab: Cursos */}
      {tab === 'cursos' && (
        <div className="space-y-3">
          {temporadas.map(t => (
            <div key={t.id} className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3">
                <button onClick={() => toggle(t.id)} className="text-slate-500 hover:text-white transition-colors">
                  {open[t.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{t.titulo}</span>
                    {!t.ativo && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20">Inativa</span>}
                    {t.restricaoAcesso && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Lock className="w-3 h-3" /> Restrito
                      </span>
                    )}
                    {t._count.questoes > 0 && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                        <FileQuestion className="w-3 h-3" /> {t._count.questoes} questões
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="text-xs text-slate-500">{t.episodios.length} ep · {t._count.certificados} certificados</span>
                    {t.empresas?.length > 0 && t.empresas.map(emp => (
                      <span key={emp} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Building2 className="w-2.5 h-2.5" />{emp}
                      </span>
                    ))}
                    {t.unidades?.length > 0 && t.unidades.map(und => (
                      <span key={und} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                        {und}
                      </span>
                    ))}
                  </div>
                </div>
                <button onClick={() => openQuestoes(t)} title="Gerenciar questões"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors">
                  <FileQuestion className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => openEditT(t)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => toggleAtivoT(t)}
                  className={`p-1.5 rounded-lg transition-colors ${t.ativo ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                  title={t.ativo ? 'Desativar' : 'Ativar'}>
                  <Power className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => openCreateE(t.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors" title="Novo episódio">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {open[t.id] && (
                <div className="border-t border-white/5 divide-y divide-white/5">
                  {t.episodios.length === 0 && (
                    <p className="px-10 py-4 text-xs text-slate-600">Nenhum episódio cadastrado.</p>
                  )}
                  {/* Acesso por Função */}
                  <div className="px-5 py-3 border-b border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="w-3.5 h-3.5 text-brand-400" />
                      <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Acesso automático por função</span>
                      {savingFuncoes === t.id && <Loader2 className="w-3 h-3 text-slate-500 animate-spin" />}
                    </div>
                    {funcoesList.length === 0 ? (
                      <p className="text-xs text-slate-600">
                        Nenhuma função cadastrada.{' '}
                        <a href="/empresa/funcoes" className="text-brand-400 hover:underline">Criar funções →</a>
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-1.5">
                          {funcoesList.map(f => {
                            const ativo = (t.funcoesComAcesso ?? []).includes(f.id)
                            return (
                              <button key={f.id} onClick={() => toggleFuncaoAcesso(t, f.id)}
                                disabled={savingFuncoes === t.id}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all disabled:opacity-50
                                  ${ativo
                                    ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                                    : 'bg-white/3 border-white/10 text-slate-500 hover:text-white hover:border-white/20'}`}>
                                {ativo && <Check className="w-2.5 h-2.5" />}
                                {f.name}
                              </button>
                            )
                          })}
                        </div>
                        {(t.funcoesComAcesso ?? []).length === 0 && (
                          <p className="text-xs text-slate-600 mt-1.5">Nenhuma função selecionada — acesso apenas por matrícula manual.</p>
                        )}
                      </>
                    )}
                  </div>

                  {t.episodios.map((ep, idx) => (
                    <div key={ep.id} className="flex items-center gap-3 px-5 pl-12 py-2.5 hover:bg-white/2 transition-colors">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moverEpisodio(ep, 'up', t.episodios)} disabled={idx === 0}
                          className="p-0.5 text-slate-600 hover:text-white disabled:opacity-20 transition-colors">
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button onClick={() => moverEpisodio(ep, 'down', t.episodios)} disabled={idx === t.episodios.length - 1}
                          className="p-0.5 text-slate-600 hover:text-white disabled:opacity-20 transition-colors">
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                      <PlayCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span className="flex-1 text-sm text-slate-300">{ep.titulo}</span>
                      <span className="text-xs text-slate-600">{ep.duracaoMin}min</span>
                      <button onClick={() => togglePublicado(ep)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all
                          ${ep.publicado
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}>
                        {ep.publicado ? <><Eye className="w-3 h-3" /> Publicado</> : <><EyeOff className="w-3 h-3" /> Rascunho</>}
                      </button>
                      <button onClick={() => openEditE(ep, t.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {temporadas.length === 0 && (
            <div className="rounded-2xl bg-white/3 border border-white/8 py-12 text-center text-slate-500 text-sm">
              Nenhuma temporada cadastrada. Crie a primeira!
            </div>
          )}
        </div>
      )}

      {/* Tab: Matrículas */}
      {tab === 'matriculas' && (
        <div className="space-y-3">
          {mLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
          ) : matriculas.length === 0 ? (
            <div className="rounded-2xl bg-white/3 border border-white/8 py-12 text-center text-slate-500 text-sm">
              Nenhuma solicitação de acesso.
            </div>
          ) : (
            matriculas.map(m => (
              <div key={m.id} className="rounded-2xl bg-white/3 border border-white/8 p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{m.user.name}</p>
                  <p className="text-slate-500 text-xs">{m.user.email}</p>
                  <p className="text-slate-400 text-xs mt-1">Curso: <span className="text-slate-300">{m.temporada.titulo}</span></p>
                  <p className="text-slate-600 text-xs">{new Date(m.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                {m.status === 'PENDENTE' ? (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => revisarMatricula(m.id, 'APROVADO')} disabled={revisando === m.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                      {revisando === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Aprovar
                    </button>
                    <button onClick={() => revisarMatricula(m.id, 'NEGADO')} disabled={revisando === m.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50">
                      <XCircle className="w-3 h-3" /> Negar
                    </button>
                  </div>
                ) : (
                  <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium
                    ${m.status === 'APROVADO'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                    {m.status === 'APROVADO' ? 'Aprovado' : 'Negado'}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Obrigatórios */}
      {tab === 'obrigatorios' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">Treinamentos com prazo obrigatório para os colaboradores.</p>
            <button onClick={() => { setEditingObr(null); setObrForm(EMPTY_OBR); setObrModal(true) }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 transition-all">
              <Plus className="w-4 h-4" /> Novo obrigatório
            </button>
          </div>

          {obrLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
          ) : obrigatorios.length === 0 ? (
            <div className="rounded-2xl bg-white/3 border border-white/8 py-12 text-center text-slate-500 text-sm">
              Nenhum treinamento obrigatório cadastrado.
            </div>
          ) : (
            <div className="space-y-3">
              {obrigatorios.map(o => {
                const dias = Math.ceil((new Date(o.prazo).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                const vencido = dias < 0
                const urgente = dias >= 0 && dias <= 3
                const pct = o.elegíveis > 0 ? Math.round((o.concluidos / o.elegíveis) * 100) : 0
                return (
                  <div key={o.id} className={`rounded-2xl bg-white/3 border p-4 space-y-3
                    ${vencido ? 'border-red-500/30' : urgente ? 'border-amber-500/30' : 'border-white/8'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm">{o.temporadaTitulo}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border
                            ${vencido ? 'bg-red-500/15 border-red-500/30 text-red-300'
                              : urgente ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                              : 'bg-white/5 border-white/10 text-slate-400'}`}>
                            <Clock className="w-3 h-3" />
                            {vencido ? `Vencido há ${Math.abs(dias)}d` : `${dias}d restantes — ${new Date(o.prazo).toLocaleDateString('pt-BR')}`}
                          </span>
                          {o.empresas.length > 0 && (
                            <span className="text-xs text-slate-500">{o.empresas.join(', ')}</span>
                          )}
                          {o.funcoesNomes.length > 0 ? (
                            <span className="text-xs text-brand-400">Funções: {o.funcoesNomes.join(', ')}</span>
                          ) : (
                            <span className="text-xs text-slate-600">Todos da empresa</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => { setEditingObr(o); setObrForm({ temporadaId: o.temporadaId, empresas: o.empresas, unidades: o.unidades, funcoes: o.funcoes, prazo: o.prazo.slice(0, 10) }); setObrModal(true) }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteObrigatorio(o.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {/* Barra de realizações */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          <span className={`font-semibold ${pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{o.concluidos}</span>
                          <span className="text-slate-500"> de {o.elegíveis} alunos realizaram</span>
                        </span>
                        <span className={`font-medium ${pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{pct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className={`h-full rounded-full origin-left transition-transform duration-300 ${pct >= 80 ? 'bg-emerald-400' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ transform: `scaleX(${pct / 100})` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Certificados */}
      {tab === 'certificados' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select
              value={certTemporadaId}
              onChange={e => { setCertTemporadaId(e.target.value); loadAlunos(e.target.value) }}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50 min-w-[260px]">
              <option value="" className="bg-[#111118]">Selecione o curso...</option>
              {temporadas.map(t => (
                <option key={t.id} value={t.id} className="bg-[#111118]">{t.titulo}</option>
              ))}
            </select>
            {certTemporadaId && (
              <span className="text-slate-500 text-sm">{alunos.length} aluno{alunos.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {!certTemporadaId ? (
            <div className="rounded-2xl bg-white/3 border border-white/8 py-14 text-center text-slate-500 text-sm">
              Selecione um curso para ver os alunos.
            </div>
          ) : alunosLoading ? (
            <div className="flex items-center justify-center py-14"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
          ) : alunos.length === 0 ? (
            <div className="rounded-2xl bg-white/3 border border-white/8 py-14 text-center text-slate-500 text-sm">
              Nenhum aluno com registro neste curso.
            </div>
          ) : (
            <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-slate-500 text-xs">
                    <th className="px-4 py-3 text-left font-medium">Aluno</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Progresso</th>
                    <th className="px-4 py-3 text-left font-medium">Certificado em</th>
                    <th className="px-4 py-3 text-right font-medium pr-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {alunos.map(a => {
                    const certExpirado = a.certificadoValidoAte && new Date(a.certificadoValidoAte) < new Date()
                    return (
                      <tr key={a.userId} className="hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-white font-medium text-sm">{a.name}</p>
                          <p className="text-slate-500 text-xs">{a.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          {a.status === 'CERTIFICADO' ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium
                              ${certExpirado
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
                              <CheckCircle2 className="w-3 h-3" />
                              {certExpirado ? 'Expirado' : 'Certificado'}
                            </span>
                          ) : a.status === 'EM_ANDAMENTO' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium bg-brand-500/10 border-brand-500/30 text-brand-300">
                              <PlayCircle className="w-3 h-3" /> Em andamento
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium bg-white/5 border-white/10 text-slate-400">
                              <Users className="w-3 h-3" /> Matriculado
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <p className="text-slate-400 text-xs">
                              {totalEpisodios > 0 ? `${a.episodiosConcluidos}/${totalEpisodios} ep.` : '—'}
                              {a.tentativas > 0 && (
                                <span className={`ml-2 ${a.aprovadoNoQuiz ? 'text-emerald-400' : 'text-red-400'}`}>
                                  · {a.tentativas} tentativa{a.tentativas !== 1 ? 's' : ''} quiz
                                </span>
                              )}
                            </p>
                            {totalEpisodios > 0 && (
                              <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div className="h-full rounded-full bg-brand-400"
                                  style={{ width: `${Math.min(100, (a.episodiosConcluidos / totalEpisodios) * 100)}%` }} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {a.certificadoEm
                            ? new Date(a.certificadoEm).toLocaleDateString('pt-BR')
                            : <span className="text-slate-600">—</span>}
                          {a.certificadoValidoAte && (
                            <p className={`text-[10px] mt-0.5 ${certExpirado ? 'text-amber-400' : 'text-slate-600'}`}>
                              Válido até {new Date(a.certificadoValidoAte).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right pr-5">
                          <button
                            onClick={() => setConfirmZerar(a)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Zerar progresso deste aluno">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal confirmar zerar */}
      <AnimatePresence>
        {confirmZerar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-amber-500/20 p-6 w-full max-w-sm shadow-2xl flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-amber-400" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-white font-display font-bold text-lg">Zerar progresso?</h3>
                <p className="text-slate-400 text-sm">
                  O aluno <span className="text-white font-medium">{confirmZerar.name}</span> perderá
                  todo o progresso neste curso.
                </p>
                <p className="text-slate-500 text-xs pt-1">
                  Certificado, episódios concluídos e tentativas de quiz serão apagados.
                  A matrícula será regredida para <strong className="text-slate-400">Pendente</strong>.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-1">
                <button onClick={() => setConfirmZerar(null)} disabled={zerando}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={handleZerar} disabled={zerando}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {zerando ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Zerar</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Temporada */}
      <AnimatePresence>
        {tModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-white/10 p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-display font-bold">{tModal.mode === 'create' ? 'Nova Temporada' : 'Editar Temporada'}</h3>
                <button onClick={() => setTModal(null)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Título *</label>
                  <input value={tForm.titulo} onChange={e => setTForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Ex: Fundamentos de Vendas" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Descrição</label>
                  <textarea value={tForm.descricao} onChange={e => setTForm(p => ({ ...p, descricao: e.target.value }))} rows={2} placeholder="Descrição da temporada..." className={`${inputCls} resize-none`} />
                </div>
                <ImageUpload
                  value={tForm.capa || undefined}
                  onChange={url => setTForm(p => ({ ...p, capa: url }))}
                  onRemove={() => setTForm(p => ({ ...p, capa: '' }))}
                  aspectRatio="16/9"
                  label="Capa da temporada"
                />
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setTForm(p => ({ ...p, restricaoAcesso: !p.restricaoAcesso }))}
                    className={`w-10 h-6 rounded-full transition-colors relative ${tForm.restricaoAcesso ? 'bg-brand-500' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${tForm.restricaoAcesso ? 'left-5' : 'left-1'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">Acesso restrito</p>
                    <p className="text-xs text-slate-500">Colaboradores precisam solicitar matrícula</p>
                  </div>
                </label>
                {empresasList.length > 0 && (
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> Empresas com acesso
                      <span className="text-slate-600">(vazio = todas)</span>
                    </label>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                      {empresasList.map(emp => (
                        <label key={emp} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={(tForm as any).empresas?.includes(emp) ?? false}
                            onChange={() => setTForm(p => {
                              const cur: string[] = (p as any).empresas ?? []
                              const novas = cur.includes(emp) ? cur.filter((e: string) => e !== emp) : [...cur, emp]
                              // limpa unidades ao trocar empresas (serão recarregadas)
                              return { ...p, empresas: novas, unidades: [] }
                            })}
                            className="w-3.5 h-3.5 rounded accent-brand-500"
                          />
                          <span className={`text-xs truncate transition-colors ${((tForm as any).empresas ?? []).includes(emp) ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                            {emp}
                          </span>
                        </label>
                      ))}
                    </div>
                    {((tForm as any).empresas ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {((tForm as any).empresas as string[]).map(emp => (
                          <span key={emp} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-xs">
                            {emp}
                            <button type="button" onClick={() => setTForm(p => ({ ...p, empresas: ((p as any).empresas as string[]).filter((e: string) => e !== emp), unidades: [] }))}>
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {((tForm as any).empresas ?? []).length > 0 && (
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5 flex items-center gap-1.5">
                      Operações com acesso
                      <span className="text-slate-600">(vazio = todas as operações da empresa)</span>
                    </label>
                    {unidadesLoading ? (
                      <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
                        <Loader2 className="w-3 h-3 animate-spin" /> Carregando operações...
                      </div>
                    ) : unidadesList.length === 0 ? (
                      <p className="text-xs text-slate-600 py-1">Nenhuma operação encontrada para a(s) empresa(s) selecionada(s).</p>
                    ) : (
                      <div className="rounded-xl bg-white/5 border border-white/10 p-3 grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                        {unidadesList.map(und => (
                          <label key={und} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={(tForm as any).unidades?.includes(und) ?? false}
                              onChange={() => setTForm(p => {
                                const cur: string[] = (p as any).unidades ?? []
                                return { ...p, unidades: cur.includes(und) ? cur.filter((u: string) => u !== und) : [...cur, und] }
                              })}
                              className="w-3.5 h-3.5 rounded accent-brand-500"
                            />
                            <span className={`text-xs truncate transition-colors ${((tForm as any).unidades ?? []).includes(und) ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                              {und}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                    {((tForm as any).unidades ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {((tForm as any).unidades as string[]).map(und => (
                          <span key={und} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-xs">
                            {und}
                            <button type="button" onClick={() => setTForm(p => ({ ...p, unidades: ((p as any).unidades as string[]).filter((u: string) => u !== und) }))}>
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* Pré-requisitos */}
                {temporadas.filter(t => tModal?.id !== t.id).length > 0 && (
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Pré-requisitos
                      <span className="text-slate-600">(vazio = nenhum)</span>
                    </label>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1.5 max-h-36 overflow-y-auto">
                      {temporadas
                        .filter(t => tModal?.id !== t.id && t.ativo)
                        .map(t => (
                          <label key={t.id} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={(tForm as any).preRequisitos?.includes(t.id) ?? false}
                              onChange={() => setTForm(p => {
                                const cur: string[] = (p as any).preRequisitos ?? []
                                return { ...p, preRequisitos: cur.includes(t.id) ? cur.filter((x: string) => x !== t.id) : [...cur, t.id] }
                              })}
                              className="w-3.5 h-3.5 rounded accent-brand-500 shrink-0"
                            />
                            <span className={`text-xs truncate transition-colors ${((tForm as any).preRequisitos ?? []).includes(t.id) ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                              {t.titulo}
                            </span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
                {/* Validade do certificado */}
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Validade do certificado (dias)
                    <span className="text-slate-600">(vazio = permanente)</span>
                  </label>
                  <input
                    type="number" min="1" max="3650"
                    placeholder="Ex: 365 para NR-11 anual"
                    value={(tForm as any).validadeDias ?? ''}
                    onChange={e => {
                      const val = e.target.value === '' ? null : parseInt(e.target.value)
                      setTForm(p => ({ ...p, validadeDias: val && val > 0 ? val : null }))
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setTModal(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-medium">Cancelar</button>
                <button onClick={saveTemporada} disabled={saving || !tForm.titulo.trim()}
                  className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Episódio */}
      <AnimatePresence>
        {eModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-white/10 p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-display font-bold">{eModal.mode === 'create' ? 'Novo Episódio' : 'Editar Episódio'}</h3>
                <button onClick={() => setEModal(null)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Título *</label>
                  <input value={eForm.titulo} onChange={e => setEForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Ex: Introdução ao módulo" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">URL do YouTube *</label>
                  <input value={eForm.videoUrl} onChange={e => setEForm(p => ({ ...p, videoUrl: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Descrição</label>
                  <textarea value={eForm.descricao} onChange={e => setEForm(p => ({ ...p, descricao: e.target.value }))} rows={2} className={`${inputCls} resize-none`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5">Duração (min)</label>
                    <input type="number" value={eForm.duracaoMin} onChange={e => setEForm(p => ({ ...p, duracaoMin: Number(e.target.value) }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5">Ordem</label>
                    <input type="number" value={eForm.ordem} onChange={e => setEForm(p => ({ ...p, ordem: Number(e.target.value) }))} className={inputCls} />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setEModal(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-medium">Cancelar</button>
                <button onClick={saveEpisodio} disabled={saving || !eForm.titulo.trim() || !eForm.videoUrl.trim()}
                  className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Questões */}
      <AnimatePresence>
        {qModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-white/10 p-6 max-w-2xl w-full shadow-2xl my-8">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-white font-display font-bold">Questões da Prova</h3>
                  <p className="text-slate-500 text-xs">{qModal.titulo}</p>
                </div>
                <button onClick={() => setQModal(null)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              {/* Lista de questões existentes */}
              {qLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 text-brand-400 animate-spin" /></div>
              ) : questoes.length > 0 ? (
                <div className="space-y-3 mb-5">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Questões cadastradas</p>
                  {questoes.map((q, qi) => (
                    <div key={q.id} className="rounded-xl bg-white/3 border border-white/8 p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-slate-500 text-xs shrink-0 mt-1">{qi + 1}.</span>
                        <p className="text-slate-200 text-sm flex-1">{q.enunciado}</p>
                        <button onClick={() => {
                          setEditingQ(q)
                          setQForm({ enunciado: q.enunciado, ordem: q.ordem, opcoes: q.opcoes.map(o => ({ texto: o.texto, correta: o.correta, ordem: o.ordem })) })
                        }} className="p-1 text-slate-500 hover:text-white transition-colors shrink-0">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => deleteQuestao(q.id)} className="p-1 text-slate-500 hover:text-red-400 transition-colors shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="pl-4 space-y-1">
                        {q.opcoes.map(op => (
                          <div key={op.id} className={`flex items-center gap-2 text-xs px-2 py-1 rounded-lg ${op.correta ? 'bg-emerald-500/10 text-emerald-300' : 'text-slate-500'}`}>
                            {op.correta ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <div className="w-3 h-3" />}
                            {op.texto}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm text-center py-4 mb-4">Nenhuma questão cadastrada ainda.</p>
              )}

              {/* Form nova/editar questão */}
              <div className="rounded-xl bg-white/3 border border-white/8 p-4 space-y-4">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
                  {editingQ ? 'Editar questão' : 'Nova questão'}
                </p>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Enunciado *</label>
                  <textarea value={qForm.enunciado} onChange={e => setQForm(p => ({ ...p, enunciado: e.target.value }))}
                    rows={2} placeholder="Digite a pergunta..." className={`${inputCls} resize-none`} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400">Opções (marque a correta)</label>
                    {qForm.opcoes.length < 6 && (
                      <button onClick={() => setQForm(p => ({ ...p, opcoes: [...p.opcoes, { texto: '', correta: false, ordem: p.opcoes.length }] }))}
                        className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
                        <Plus className="w-3 h-3" /> Adicionar opção
                      </button>
                    )}
                  </div>
                  {qForm.opcoes.map((op, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <button onClick={() => setQForm(p => ({ ...p, opcoes: p.opcoes.map((o, i) => ({ ...o, correta: i === oi })) }))}
                        className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors
                          ${op.correta ? 'border-emerald-400 bg-emerald-500/30' : 'border-slate-600 hover:border-slate-400'}`}>
                        {op.correta && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                      </button>
                      <input value={op.texto} onChange={e => setQForm(p => ({
                        ...p, opcoes: p.opcoes.map((o, i) => i === oi ? { ...o, texto: e.target.value } : o)
                      }))} placeholder={`Opção ${oi + 1}`} className={`${inputCls} flex-1`} />
                      {qForm.opcoes.length > 2 && (
                        <button onClick={() => setQForm(p => ({ ...p, opcoes: p.opcoes.filter((_, i) => i !== oi) }))}
                          className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  {editingQ && (
                    <button onClick={() => { setEditingQ(null); setQForm({ enunciado: '', ordem: 0, opcoes: [{ ...EMPTY_OPCAO }, { ...EMPTY_OPCAO }] }) }}
                      className="px-3 py-2 rounded-xl border border-white/10 text-slate-400 text-sm">
                      Cancelar
                    </button>
                  )}
                  <button onClick={saveQuestao} disabled={qSaving || !qForm.enunciado.trim() || qForm.opcoes.some(o => !o.texto.trim())}
                    className="flex-1 py-2 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                    {qSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {editingQ ? 'Salvar alterações' : 'Adicionar questão'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Modal Obrigatório */}
      <AnimatePresence>
        {obrModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-white/10 p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-display font-bold">{editingObr ? 'Editar Obrigatório' : 'Novo Treinamento Obrigatório'}</h3>
                <button onClick={() => { setObrModal(false); setEditingObr(null) }} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                {!editingObr && (
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5">Curso *</label>
                    <select value={obrForm.temporadaId} onChange={e => setObrForm(p => ({ ...p, temporadaId: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50">
                      <option value="">Selecione um curso...</option>
                      {temporadas.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Prazo *</label>
                  <input type="date" value={obrForm.prazo} onChange={e => setObrForm(p => ({ ...p, prazo: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50" />
                </div>
                {empresasList.length > 0 && (
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5">
                      Empresas obrigadas <span className="text-slate-600">(vazio = todas da temporada)</span>
                    </label>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                      {empresasList.map(emp => (
                        <label key={emp} className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox"
                            checked={obrForm.empresas.includes(emp)}
                            onChange={e => setObrForm(p => ({
                              ...p,
                              empresas: e.target.checked ? [...p.empresas, emp] : p.empresas.filter(x => x !== emp)
                            }))}
                            className="rounded border-white/20 bg-white/5 text-brand-500" />
                          <span className="text-slate-300 text-xs group-hover:text-white transition-colors truncate">{emp}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {funcoesList.length > 0 && (
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5">
                      Funções obrigadas <span className="text-slate-600">(vazio = todos da empresa)</span>
                    </label>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3 grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                      {funcoesList.map(f => (
                        <label key={f.id} className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox"
                            checked={obrForm.funcoes.includes(f.id)}
                            onChange={e => setObrForm(p => ({
                              ...p,
                              funcoes: e.target.checked ? [...p.funcoes, f.id] : p.funcoes.filter(x => x !== f.id)
                            }))}
                            className="rounded border-white/20 bg-white/5 text-brand-500" />
                          <span className="text-slate-300 text-xs group-hover:text-white transition-colors truncate">{f.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => { setObrModal(false); setEditingObr(null) }} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-medium">Cancelar</button>
                <button onClick={saveObrigatorio} disabled={obrSaving || !obrForm.temporadaId || !obrForm.prazo}
                  className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  {obrSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
