'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronDown, ChevronRight, Settings, Loader2, X, Check, Trash2 } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

interface TaskDef {
  id: string; title: string; description?: string
  points: number; frequency: string; requireApproval: boolean; requireEvidence: boolean
}
interface Func { id: string; name: string; tasks: TaskDef[] }

const FREQ_OPTIONS = [
  { value: 'DAILY', label: 'Diária' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensal' },
]
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const EMPTY_FORM = {
  functionId: '', title: '', description: '', points: 10,
  frequency: 'DAILY', daysOfWeek: [] as number[],
  requireApproval: false, requireEvidence: false,
}

export default function CoordAtividadesPage() {
  const [functions, setFunctions] = useState<Func[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchFunctions = async () => {
    const res = await fetch('/api/coord/atividades')
    if (res.ok) setFunctions(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchFunctions() }, [])

  function openModal(functionId?: string) {
    setForm({ ...EMPTY_FORM, functionId: functionId ?? '' })
    setShowModal(true)
  }

  function toggleDay(d: number) {
    setForm(f => ({
      ...f,
      daysOfWeek: f.daysOfWeek.includes(d) ? f.daysOfWeek.filter(x => x !== d) : [...f.daysOfWeek, d],
    }))
  }

  async function deleteActivity(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/coord/atividades/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'Atividade removida' })
      fetchFunctions()
    } catch {
      toast({ title: 'Erro ao remover atividade', variant: 'destructive' })
    } finally { setDeleting(null) }
  }

  async function saveActivity() {
    if (!form.functionId || !form.title.trim()) {
      toast({ title: 'Preencha a função e o título', variant: 'destructive' }); return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/coord/atividades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast({ title: '✅ Atividade criada!', description: 'Adicionada à função com sucesso.' })
      setShowModal(false)
      fetchFunctions()
    } catch {
      toast({ title: 'Erro ao criar atividade', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Atividades</h1>
          <p className="text-slate-400 text-sm mt-0.5">Adicione atividades às funções existentes</p>
        </div>
        <button onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20">
          <Plus className="w-4 h-4" /> Nova atividade
        </button>
      </div>

      {functions.length === 0 ? (
        <div className="rounded-2xl bg-white/3 border border-white/8 p-10 text-center text-slate-400 text-sm">
          Nenhuma função cadastrada ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {functions.map(fn => (
            <div key={fn.id} className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
              <button onClick={() => setExpanded(expanded === fn.id ? null : fn.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/3 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shrink-0">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-semibold text-sm">{fn.name}</div>
                    <div className="text-slate-500 text-xs">{fn.tasks.length} atividade{fn.tasks.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={e => { e.stopPropagation(); openModal(fn.id) }}
                    className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  {expanded === fn.id
                    ? <ChevronDown className="w-4 h-4 text-slate-400" />
                    : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              <AnimatePresence initial={false}>
                {expanded === fn.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    className="overflow-hidden">
                    <div className="border-t border-white/5 divide-y divide-white/5">
                      {fn.tasks.length === 0 ? (
                        <div className="px-4 py-4 text-xs text-slate-500 text-center">
                          Nenhuma atividade. Clique em + para adicionar.
                        </div>
                      ) : fn.tasks.map(task => (
                        <div key={task.id} className="px-4 py-3 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white font-medium">{task.title}</div>
                            {task.description && <div className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</div>}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 font-medium">
                                {task.points} pts
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                                {FREQ_OPTIONS.find(f => f.value === task.frequency)?.label}
                              </span>
                              {task.requireApproval && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-400">Aprovação</span>}
                              {task.requireEvidence && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-400">Evidência</span>}
                            </div>
                          </div>
                          <button onClick={() => deleteActivity(task.id)} disabled={deleting === task.id}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50 shrink-0">
                            {deleting === task.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-white/10 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-display font-bold">Nova Atividade</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Function selector */}
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Função *</label>
                  <select value={form.functionId} onChange={e => setForm(f => ({ ...f, functionId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50">
                    <option value="">Selecione a função</option>
                    {functions.map(fn => <option key={fn.id} value={fn.id}>{fn.name}</option>)}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Título *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Ex: Relatório diário de vendas"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50" />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Descrição</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={2} placeholder="Instrução opcional para o colaborador..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 resize-none" />
                </div>

                {/* Points + Frequency */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5">Pontos</label>
                    <input type="number" min={1} value={form.points} onChange={e => setForm(f => ({ ...f, points: +e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5">Frequência</label>
                    <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50">
                      {FREQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Days */}
                {form.frequency !== 'DAILY' && (
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5">Dias da semana</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {DAYS.map((d, i) => (
                        <button key={i} onClick={() => toggleDay(i)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${form.daysOfWeek.includes(i) ? 'gradient-brand text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Toggles */}
                <div className="flex gap-3">
                  {[
                    { key: 'requireApproval', label: 'Requer aprovação' },
                    { key: 'requireEvidence', label: 'Requer evidência' },
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => setForm(f => ({ ...f, [key]: !f[key as keyof typeof f] }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-medium transition-colors ${(form as any)[key] ? 'border-brand-500/40 bg-brand-500/10 text-brand-400' : 'border-white/10 bg-white/3 text-slate-400'}`}>
                      {(form as any)[key] && <Check className="w-3 h-3" />} {label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-medium transition-colors">
                    Cancelar
                  </button>
                  <button onClick={saveActivity} disabled={saving}
                    className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-brand-500/20">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Criar atividade
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
