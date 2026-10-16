'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3, TrendingUp, Users, CheckSquare, Target, BookOpen,
  Package, Crown, Loader2, ArrowLeft, RefreshCw, AlertCircle, Plus, X, Globe, Building2, Pencil, Trash2
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface CockpitData {
  engagementRate: number
  completionRate: number
  activeUsers: number
  totalUsers: number
  tasksTotal: number
  tasksDone: number
  upbCompletions: number
  obzSubmittedThisMonth: number
  pointsByUnit: { unit: string; total: number }[]
  topUsers: { name: string; photoUrl: string | null; pts: number }[]
}

interface GlobalGoal {
  id: string
  title: string
  description?: string
  targetValue: number
  currentValue: number
  deadline?: string
  rewardPoints: number
  units: string[]
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType, label: string, value: string | number, sub?: string, color?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white/3 border border-white/8 p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">{label}</span>
        <div className={`p-2 rounded-xl ${color ?? 'bg-brand-500/10'}`}>
          <Icon className="w-4 h-4 text-brand-400" />
        </div>
      </div>
      <div className="text-3xl font-display font-black text-white tracking-tight">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </motion.div>
  )
}

export default function CockpitPage() {
  const [data, setData] = useState<CockpitData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [goal, setGoal] = useState<GlobalGoal | null>(null)
  const [goalLoading, setGoalLoading] = useState(true)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingGoal, setDeletingGoal] = useState(false)
  const [unidades, setUnidades] = useState<string[]>([])
  const [form, setForm] = useState({
    title: '', description: '', targetValue: '', currentValue: '0', deadline: '', rewardPoints: '0',
    units: [] as string[],
  })

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/cockpit')
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Sem permissão')
      }
      setData(await res.json())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadGoal() {
    setGoalLoading(true)
    try {
      const res = await fetch('/api/global-goal')
      if (res.ok) { const d = await res.json(); setGoal(d.goal) }
    } finally {
      setGoalLoading(false)
    }
  }

  function openNewGoalForm() {
    setEditingGoal(false)
    setForm({ title: '', description: '', targetValue: '', currentValue: '0', deadline: '', rewardPoints: '0', units: [] })
    setShowGoalForm(true)
  }

  function openEditGoalForm() {
    if (!goal) return
    setEditingGoal(true)
    setForm({
      title: goal.title,
      description: goal.description ?? '',
      targetValue: String(goal.targetValue),
      currentValue: String(goal.currentValue),
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
      rewardPoints: String(goal.rewardPoints),
      units: goal.units ?? [],
    })
    setShowGoalForm(true)
  }

  async function saveGoal() {
    if (!form.title || !form.targetValue) return
    setSaving(true)
    try {
      let res
      if (editingGoal && goal) {
        res = await fetch('/api/global-goal', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: goal.id, ...form })
        })
      } else {
        res = await fetch('/api/global-goal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
      }
      if (!res.ok) throw new Error('Erro ao salvar')
      const d = await res.json()
      setGoal(d.goal)
      setShowGoalForm(false)
      setEditingGoal(false)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteGoal() {
    if (!goal) return
    if (!confirm(`Remover a meta "${goal.title}"?`)) return
    setDeletingGoal(true)
    try {
      const res = await fetch(`/api/global-goal?id=${goal.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setGoal(null)
    } catch {
      alert('Erro ao remover meta')
    } finally {
      setDeletingGoal(false)
    }
  }

  async function updateGoalProgress() {
    if (!goal) return
    const value = prompt('Valor atual da meta:', String(goal.currentValue))
    if (value === null) return
    const res = await fetch('/api/global-goal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: goal.id, currentValue: parseFloat(value) })
    })
    if (res.ok) loadGoal()
  }

  useEffect(() => {
    loadData()
    loadGoal()
    fetch('/api/admin/unidades').then(r => r.ok ? r.json() : []).then(d => setUnidades(Array.isArray(d) ? d : []))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  )

  if (error) return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-2xl bg-red-500/5 border border-red-500/20 p-8 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-white font-display font-bold mb-1">Acesso Restrito</p>
        <p className="text-slate-400 text-sm mb-4">{error}</p>
        <Link href="/app/inicio" className="text-brand-400 text-sm hover:underline">← Voltar para Início</Link>
      </div>
    </div>
  )

  if (!data) return null

  const maxUnit = data.pointsByUnit[0]?.total ?? 1
  const goalPct = goal ? Math.min(100, Math.round((Number(goal.currentValue) / Number(goal.targetValue)) * 100)) : 0

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <Link href="/app/inicio" className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Início
            </Link>
          </div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-400" /> Cockpit Executivo
          </h1>
          <p className="text-slate-400 text-sm mt-1">Visão macro de engajamento e performance — mês atual</p>
        </div>
        <button onClick={loadData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-all">
          <RefreshCw className="w-3 h-3" /> Atualizar
        </button>
      </div>

      {/* Meta Global da Empresa */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-400" /> Meta Global da Empresa
          </h2>
          <div className="flex items-center gap-2">
            {goal && (
              <>
                <button onClick={openEditGoalForm}
                  className="p-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 transition-all">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={deleteGoal} disabled={deletingGoal}
                  className="p-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-40">
                  {deletingGoal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </>
            )}
            <button onClick={openNewGoalForm}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 hover:bg-purple-500/20 transition-all">
              <Plus className="w-3.5 h-3.5" /> {goal ? 'Nova Meta' : 'Criar Meta'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showGoalForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mb-5 rounded-xl bg-white/5 border border-white/10 p-4 space-y-3 overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white font-medium">
                  {editingGoal ? 'Editar meta atual' : 'Criar nova meta (substitui a atual)'}
                </span>
                <button onClick={() => { setShowGoalForm(false); setEditingGoal(false) }}><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Título *</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Ex: Redução de Custo 2025"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Valor alvo *</label>
                  <input type="number" value={form.targetValue} onChange={e => setForm(p => ({ ...p, targetValue: e.target.value }))}
                    placeholder="Ex: 1000000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Progresso Inicial</label>
                  <input type="number" value={form.currentValue} onChange={e => setForm(p => ({ ...p, currentValue: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Prazo final</label>
                  <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">Descrição</label>
                  <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Descrição visível para todos os colaboradores"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Bônus de Pontos (se atingida)</label>
                  <input type="number" value={form.rewardPoints} onChange={e => setForm(p => ({ ...p, rewardPoints: e.target.value }))}
                    placeholder="Ex: 500"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50" />
                </div>
                {unidades.length > 0 && (
                  <div className="sm:col-span-2">
                    <label className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5 block">
                      <Building2 className="w-3 h-3" /> Operações envolvidas (opcional — vazio = toda a empresa)
                    </label>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-28 overflow-y-auto">
                      {unidades.map(u => (
                        <label key={u} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={form.units.includes(u)}
                            onChange={() => setForm(p => ({
                              ...p,
                              units: p.units.includes(u) ? p.units.filter(x => x !== u) : [...p.units, u]
                            }))}
                            className="w-3.5 h-3.5 rounded accent-purple-500"
                          />
                          <span className={`text-xs truncate transition-colors ${form.units.includes(u) ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                            {u.replace('Pau Brasil ', '')}
                          </span>
                        </label>
                      ))}
                    </div>
                    {form.units.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {form.units.map(u => (
                          <span key={u} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                            {u.replace('Pau Brasil ', '')}
                            <button type="button" onClick={() => setForm(p => ({ ...p, units: p.units.filter(x => x !== u) }))}>
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button onClick={saveGoal} disabled={saving || !form.title || !form.targetValue}
                className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium disabled:opacity-50 w-full justify-center">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingGoal ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingGoal ? 'Salvar Alterações' : 'Criar Meta Global'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {goalLoading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>
        ) : goal ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium text-white text-sm">{goal.title}</div>
                {goal.description && <div className="text-xs text-slate-400 mt-0.5">{goal.description}</div>}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-slate-500">Progresso</div>
                  <div className="text-lg font-display font-black text-purple-400">{goalPct}%</div>
                </div>
                <button onClick={updateGoalProgress}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 hover:bg-purple-500/20 transition-all">
                  Atualizar
                </button>
              </div>
            </div>
            <div className="h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5 mb-2">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                initial={{ width: 0 }} animate={{ width: `${goalPct}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 flex-wrap gap-y-1">
              <span>{Number(goal.currentValue).toLocaleString('pt-BR')} / {Number(goal.targetValue).toLocaleString('pt-BR')}</span>
              {goal.deadline && <span>Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</span>}
              {goal.rewardPoints > 0 && <span>🎁 +{goal.rewardPoints} pts ao atingir</span>}
            </div>
            {goal.units?.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                {goal.units.map(u => (
                  <span key={u} className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs">
                    {u.replace('Pau Brasil ', '')}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-5 text-slate-500 text-sm">
            Nenhuma meta ativa. Crie sua primeira meta acima.
          </div>
        )}
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Taxa de Engajamento" value={`${data.engagementRate}%`}
          sub={`${data.activeUsers} de ${data.totalUsers} ativos`} />
        <StatCard icon={CheckSquare} label="Taxa de Conclusão" value={`${data.completionRate}%`}
          sub={`${data.tasksDone} de ${data.tasksTotal} tarefas`} />
        <StatCard icon={BookOpen} label="Aulas UPB Concluídas" value={data.upbCompletions} sub="este mês" />
        <StatCard icon={Package} label="Pacotes OBZ" value={data.obzSubmittedThisMonth} sub="submetidos este mês" />
      </div>

      {/* Engagement & Top Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {data.pointsByUnit.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white/3 border border-white/8 p-6">
            <h2 className="text-sm font-medium text-white mb-5 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-400" /> Pontos por Unidade
            </h2>
            <div className="space-y-3">
              {data.pointsByUnit.slice(0, 6).map((u, i) => (
                <div key={u.unit}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 truncate max-w-[60%]">{u.unit.replace('Pau Brasil ', '')}</span>
                    <span className="font-bold text-brand-400 shrink-0">{u.total.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full gradient-brand"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((u.total / maxUnit) * 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.06 }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {data.topUsers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white/3 border border-white/8 p-6">
            <h2 className="text-sm font-medium text-white mb-5 flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-400" /> Top Colaboradores do Mês
            </h2>
            <div className="space-y-3">
              {data.topUsers.map((u, i) => (
                <div key={u.name} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                    ${i === 0 ? 'bg-yellow-400/20 text-yellow-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-amber-600/20 text-amber-500' : 'bg-white/5 text-slate-500'}`}>
                    {i + 1}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-sm font-bold text-brand-400 overflow-hidden shrink-0">
                    {u.photoUrl ? <Image src={u.photoUrl} alt={u.name} width={32} height={32} className="w-full h-full object-cover" /> : u.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{u.name.split(' ').slice(0, 2).join(' ')}</div>
                  </div>
                  <div className="text-sm font-bold text-brand-400 shrink-0">{u.pts.toLocaleString('pt-BR')} pts</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Overall Health Meter */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl bg-gradient-to-br from-brand-500/10 to-transparent border border-brand-500/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-medium text-white">Termômetro de Saúde da Empresa</h2>
            <p className="text-xs text-slate-400 mt-0.5">Média dos índices de engajamento e conclusão</p>
          </div>
          <div className="text-3xl font-display font-black text-brand-400">
            {Math.round((data.engagementRate + data.completionRate) / 2)}%
          </div>
        </div>
        <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
          <motion.div className="h-full rounded-full gradient-brand shadow-[0_0_15px_rgba(0,201,81,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${Math.round((data.engagementRate + data.completionRate) / 2)}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }} />
        </div>
      </motion.div>
    </div>
  )
}
