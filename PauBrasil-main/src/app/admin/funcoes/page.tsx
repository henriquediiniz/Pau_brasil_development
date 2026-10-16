'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Plus, ChevronDown, ChevronUp, Star, Clock, Loader2, X, Check, Pencil, Trash2, Link2 } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

interface TaskDef {
  id: string; title: string; description?: string; points: number
  frequency: string; daysOfWeek: number[]; requireApproval: boolean
  requireEvidence: boolean; active: boolean; dailyLimit?: number
  nextTaskDefinitionId?: string | null
  nextTaskDefinition?: { id: string; title: string; function: { id: string; name: string } } | null
}
interface Func { id: string; name: string; description?: string; tasks: TaskDef[] }

const FREQ_LABELS: Record<string, string> = { DAILY: 'Diária', WEEKLY: 'Semanal', MONTHLY: 'Mensal' }
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const EMPTY_TASK = {
  title: '', description: '', points: '10', frequency: 'DAILY',
  daysOfWeek: [1,2,3,4,5], requireApproval: false, requireEvidence: false,
  dailyLimit: '1', nextTaskDefinitionId: '',
}
const EMPTY_FUNC = { name: '', description: '' }

export default function AdminFuncoesPage() {
  const [functions, setFunctions] = useState<Func[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showFuncForm, setShowFuncForm] = useState(false)
  const [editingFunc, setEditingFunc] = useState<Func | null>(null)
  const [funcForm, setFuncForm] = useState(EMPTY_FUNC)
  const [savingFunc, setSavingFunc] = useState(false)
  const [deletingFuncId, setDeletingFuncId] = useState<string | null>(null)
  const [taskModal, setTaskModal] = useState<{ funcId: string; funcName: string; editing?: TaskDef } | null>(null)
  const [taskForm, setTaskForm] = useState(EMPTY_TASK)
  const [savingTask, setSavingTask] = useState(false)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)

  const fetchAll = () => {
    fetch('/api/admin/funcoes').then(r => r.json()).then(data => { setFunctions(data); setLoading(false) })
  }
  useEffect(() => { fetchAll() }, [])

  async function saveFunction(e: React.FormEvent) {
    e.preventDefault(); setSavingFunc(true)
    try {
      if (editingFunc) {
        const res = await fetch(`/api/admin/funcoes/${editingFunc.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(funcForm),
        })
        if (!res.ok) throw new Error()
        toast({ title: '✅ Função atualizada!' })
      } else {
        const res = await fetch('/api/admin/funcoes', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(funcForm),
        })
        if (!res.ok) throw new Error()
        toast({ title: '✅ Função criada!' })
      }
      setShowFuncForm(false); setFuncForm(EMPTY_FUNC); setEditingFunc(null); fetchAll()
    } catch { toast({ title: 'Erro ao salvar função', variant: 'destructive' }) } finally { setSavingFunc(false) }
  }

  function openEditFunc(func: Func) {
    setEditingFunc(func)
    setFuncForm({ name: func.name, description: func.description ?? '' })
    setShowFuncForm(true)
  }

  async function deleteFunc(func: Func) {
    if (!confirm(`Excluir a função "${func.name}"? As atividades vinculadas também serão removidas.`)) return
    setDeletingFuncId(func.id)
    try {
      const res = await fetch(`/api/admin/funcoes/${func.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: '✅ Função excluída!' }); fetchAll()
    } catch (e: any) {
      toast({ title: e.message || 'Erro ao excluir função', variant: 'destructive' })
    } finally { setDeletingFuncId(null) }
  }

  function openNewTask(func: Func) {
    setTaskModal({ funcId: func.id, funcName: func.name })
    setTaskForm(EMPTY_TASK)
  }

  function openEditTask(func: Func, task: TaskDef) {
    setTaskModal({ funcId: func.id, funcName: func.name, editing: task })
    setTaskForm({
      title: task.title, description: task.description ?? '', points: String(task.points),
      frequency: task.frequency, daysOfWeek: task.daysOfWeek ?? [1,2,3,4,5],
      requireApproval: task.requireApproval, requireEvidence: task.requireEvidence,
      dailyLimit: String(task.dailyLimit ?? 1),
      nextTaskDefinitionId: task.nextTaskDefinitionId ?? '',
    })
  }

  async function saveTask(e: React.FormEvent) {
    e.preventDefault(); if (!taskModal) return; setSavingTask(true)
    try {
      const body = {
        functionId: taskModal.funcId, title: taskForm.title, description: taskForm.description || undefined,
        frequency: taskForm.frequency, daysOfWeek: taskForm.frequency === 'MONTHLY' ? [] : taskForm.daysOfWeek,
        points: parseInt(taskForm.points), requireEvidence: taskForm.requireEvidence,
        requireApproval: taskForm.requireApproval, dailyLimit: parseInt(taskForm.dailyLimit),
        nextTaskDefinitionId: taskForm.nextTaskDefinitionId || null,
      }
      let res
      if (taskModal.editing) {
        res = await fetch(`/api/admin/atividades/${taskModal.editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      } else {
        res = await fetch('/api/admin/atividades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      }
      if (!res.ok) throw new Error()
      toast({ title: taskModal.editing ? '✅ Atividade atualizada!' : '✅ Atividade criada!' })
      setTaskModal(null); setTaskForm(EMPTY_TASK); fetchAll()
    } catch { toast({ title: 'Erro ao salvar atividade', variant: 'destructive' }) } finally { setSavingTask(false) }
  }

  async function deleteTask(task: TaskDef) {
    if (!confirm(`Excluir a atividade "${task.title}"? O histórico de execuções será preservado.`)) return
    setDeletingTaskId(task.id)
    try {
      const res = await fetch(`/api/admin/atividades/${task.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: '✅ Atividade excluída!' }); fetchAll()
    } catch {
      toast({ title: 'Erro ao excluir atividade', variant: 'destructive' })
    } finally { setDeletingTaskId(null) }
  }

  function toggleDay(day: number) {
    setTaskForm(p => ({
      ...p, daysOfWeek: p.daysOfWeek.includes(day) ? p.daysOfWeek.filter(d => d !== day) : [...p.daysOfWeek, day].sort()
    }))
  }

  if (loading) return <div className="flex items-center justify-center min-h-64"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Funções & Atividades</h1>
          <p className="text-slate-400 text-sm">{functions.length} funções configuradas</p>
        </div>
        <button onClick={() => { setEditingFunc(null); setFuncForm(EMPTY_FUNC); setShowFuncForm(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 transition-all">
          <Plus className="w-4 h-4" /> Nova função
        </button>
      </div>

      {/* Modal nova função */}
      <AnimatePresence>
        {showFuncForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#111118] rounded-2xl border border-white/10 p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-display font-bold">{editingFunc ? 'Editar Função' : 'Nova Função'}</h3>
                <button onClick={() => { setShowFuncForm(false); setEditingFunc(null) }} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={saveFunction} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Nome *</label>
                  <input required value={funcForm.name} onChange={e => setFuncForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Vendedor, Operador..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Descrição</label>
                  <textarea value={funcForm.description} onChange={e => setFuncForm(p => ({ ...p, description: e.target.value }))} placeholder="Opcional..." rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowFuncForm(false); setEditingFunc(null) }} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-medium">Cancelar</button>
                  <button type="submit" disabled={savingFunc} className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                    {savingFunc ? <Loader2 className="w-4 h-4 animate-spin" /> : editingFunc ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal criar/editar atividade */}
      <AnimatePresence>
        {taskModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#111118] rounded-2xl border border-white/10 p-6 max-w-md w-full my-4">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-white font-display font-bold">{taskModal.editing ? 'Editar Atividade' : 'Nova Atividade'}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Função: {taskModal.funcName}</p>
                </div>
                <button onClick={() => setTaskModal(null)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={saveTask} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Nome da atividade *</label>
                  <input required value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Atualizar CRM..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Descrição</label>
                  <input value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} placeholder="Opcional..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Pontos *</label>
                  <input required type="number" min="1" value={taskForm.points} onChange={e => setTaskForm(p => ({ ...p, points: e.target.value }))} placeholder="10"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Frequência</label>
                  <div className="flex gap-2">
                    {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map(freq => (
                      <button key={freq} type="button" onClick={() => setTaskForm(p => ({ ...p, frequency: freq }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${taskForm.frequency === freq ? 'gradient-brand text-white' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}>
                        {FREQ_LABELS[freq]}
                      </button>
                    ))}
                  </div>
                </div>
                {taskForm.frequency !== 'MONTHLY' && (
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5">Dias da semana</label>
                    <div className="flex gap-1.5">
                      {DAYS.map((day, idx) => (
                        <button key={idx} type="button" onClick={() => toggleDay(idx)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${taskForm.daysOfWeek.includes(idx) ? 'bg-brand-500 text-white' : 'bg-white/5 text-slate-500 hover:text-white'}`}>
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-medium block">Opções</label>
                  {[{ key: 'requireApproval', label: 'Requer aprovação do gestor' }, { key: 'requireEvidence', label: 'Requer evidência (foto/link)' }].map(opt => (
                    <label key={opt.key} className="flex items-center gap-3 cursor-pointer group">
                      <div onClick={() => setTaskForm(p => ({ ...p, [opt.key]: !(p as any)[opt.key] }))}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${(taskForm as any)[opt.key] ? 'gradient-brand border-brand-500' : 'bg-white/5 border-white/10 group-hover:border-white/20'}`}>
                        {(taskForm as any)[opt.key] && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm text-slate-300">{opt.label}</span>
                    </label>
                  ))}
                </div>
                {/* Encadeamento */}
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-brand-400" />
                    Encadear com outra atividade <span className="text-slate-600">(opcional)</span>
                  </label>
                  <select value={taskForm.nextTaskDefinitionId}
                    onChange={e => setTaskForm(p => ({ ...p, nextTaskDefinitionId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50">
                    <option value="">Nenhum — tarefa independente</option>
                    {functions.flatMap(f =>
                      f.tasks
                        .filter(t => t.id !== taskModal?.editing?.id && t.active)
                        .map(t => (
                          <option key={t.id} value={t.id}>
                            {f.name} → {t.title}
                          </option>
                        ))
                    )}
                  </select>
                  {taskForm.nextTaskDefinitionId && (
                    <p className="text-xs text-brand-400 mt-1">
                      Quando esta tarefa for concluída, a atividade selecionada será desbloqueada para a outra função.
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setTaskModal(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-medium">Cancelar</button>
                  <button type="submit" disabled={savingTask} className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                    {savingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : taskModal.editing ? 'Salvar' : 'Criar atividade'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accordion */}
      <div className="space-y-3">
        {functions.length === 0 && (
          <div className="rounded-2xl bg-white/3 border border-white/8 p-8 text-center text-slate-500 text-sm">Nenhuma função criada ainda.</div>
        )}
        {functions.map((func, i) => (
          <motion.div key={func.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
            <button onClick={() => setExpanded(expanded === func.id ? null : func.id)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/2 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                <Settings className="w-4 h-4 text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium">{func.name}</div>
                <div className="text-xs text-slate-500">{func.tasks.length} atividades · {func.description ?? 'Sem descrição'}</div>
              </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={e => { e.stopPropagation(); openEditFunc(func) }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={e => { e.stopPropagation(); deleteFunc(func) }} disabled={deletingFuncId === func.id}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40">
                {deletingFuncId === func.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
              {expanded === func.id ? <ChevronUp className="w-4 h-4 text-slate-500 ml-1" /> : <ChevronDown className="w-4 h-4 text-slate-500 ml-1" />}
            </div>
            </button>
            <AnimatePresence>
              {expanded === func.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-white/5">
                  <div className="p-4 space-y-2">
                    {func.tasks.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-3">Nenhuma atividade. Adicione abaixo.</p>
                    ) : (
                      func.tasks.map(task => (
                        <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl ${task.active ? 'bg-white/3 border border-white/5' : 'bg-white/1 border border-white/3 opacity-60'}`}>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white">{task.title}</div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="flex items-center gap-1 text-xs text-brand-400"><Star className="w-3 h-3" />{task.points} pts</span>
                              <span className="text-xs text-slate-500"><Clock className="w-3 h-3 inline mr-0.5" />{FREQ_LABELS[task.frequency]}</span>
                              {task.requireApproval && <span className="text-xs text-yellow-400">• Aprovação</span>}
                              {task.requireEvidence && <span className="text-xs text-blue-400">• Evidência</span>}
                              {task.nextTaskDefinition && (
                                <span className="text-xs text-brand-400 flex items-center gap-0.5">
                                  <Link2 className="w-2.5 h-2.5" /> → {task.nextTaskDefinition.function.name}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {task.active && <Check className="w-4 h-4 text-emerald-400" />}
                            <button onClick={() => openEditTask(func, task)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors ml-1">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteTask(task)} disabled={deletingTaskId === task.id}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-40">
                              {deletingTaskId === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    <button onClick={() => openNewTask(func)}
                      className="w-full py-2.5 rounded-xl border border-dashed border-white/10 text-slate-400 hover:text-white hover:border-brand-500/40 hover:bg-brand-500/5 text-sm transition-all flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> Adicionar atividade
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
