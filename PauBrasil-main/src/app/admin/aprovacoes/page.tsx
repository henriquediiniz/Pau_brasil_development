'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, XCircle, Clock, Loader2, Star, Zap,
  CheckSquare, Square, Image as ImageIcon, ExternalLink,
  Package, Truck, ShieldCheck,
} from 'lucide-react'
import { toast } from '@/components/ui/toaster'

// ─── Task approvals ────────────────────────────────────────────────────────────

interface PendingTask {
  id: string
  date: string
  note?: string
  evidenceUrl?: string
  isAdHoc: boolean
  adHocTitle?: string
  requestedPoints?: number | null
  user: { id: string; name: string; email: string; company?: string; units?: string[] }
  taskDefinition: { title: string; points: number; requireEvidence: boolean } | null
}

// ─── Resgate approvals ─────────────────────────────────────────────────────────

interface Order {
  id: string
  status: 'REQUESTED' | 'APPROVED' | 'DELIVERED' | 'CANCELED'
  pointsCost: number
  createdAt: string
  user: { id: string; name: string; email: string; units?: string[] }
  product: { id: string; title: string; emoji?: string }
}

export default function AdminAprovacoesPage() {
  const [tab, setTab] = useState<'tarefas' | 'resgates'>('tarefas')

  // ── Tarefas state ────────────────────────────────────────────────────────────
  const [tasks, setTasks]               = useState<PendingTask[]>([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const [processing, setProcessing]     = useState<string | null>(null)
  const [batchProcessing, setBatchProcessing] = useState(false)
  const [rejectNote, setRejectNote]     = useState<Record<string, string>>({})
  const [showReject, setShowReject]     = useState<string | null>(null)
  const [selected, setSelected]         = useState<Set<string>>(new Set())
  const [adhocPoints, setAdhocPoints]   = useState<Record<string, string>>({})

  // ── Resgates state ───────────────────────────────────────────────────────────
  const [orders, setOrders]             = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [orderProcessing, setOrderProcessing] = useState<string | null>(null)
  const [orderStatusFilter, setOrderStatusFilter] = useState<'REQUESTED' | 'APPROVED' | 'ALL'>('REQUESTED')

  // ── Load tarefas ─────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(() => {
    setTasksLoading(true)
    fetch('/api/gestor/aprovacoes')
      .then(r => r.json())
      .then(data => { setTasks(Array.isArray(data) ? data : []); setTasksLoading(false) })
      .catch(() => setTasksLoading(false))
  }, [])

  // ── Load resgates ────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(() => {
    setOrdersLoading(true)
    fetch(`/api/admin/resgates?status=${orderStatusFilter}`)
      .then(r => r.json())
      .then(data => { setOrders(Array.isArray(data) ? data : []); setOrdersLoading(false) })
      .catch(() => setOrdersLoading(false))
  }, [orderStatusFilter])

  useEffect(() => { fetchTasks() }, [fetchTasks])
  useEffect(() => { fetchOrders() }, [fetchOrders])

  // ── Task actions ─────────────────────────────────────────────────────────────
  async function reviewTask(id: string, action: 'approve' | 'reject', task?: PendingTask) {
    setProcessing(id)
    try {
      const body: Record<string, unknown> = { action, note: rejectNote[id] }
      if (action === 'approve' && task?.isAdHoc) {
        const pts = adhocPoints[id]
        if (pts !== undefined && pts !== '') body.approvedPoints = parseInt(pts)
        else if (task.requestedPoints != null) body.approvedPoints = task.requestedPoints
      }
      const res = await fetch(`/api/tasks/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao processar')
      toast({ title: action === 'approve' ? '✅ Aprovado!' : '❌ Reprovado' })
      setTasks(prev => prev.filter(t => t.id !== id))
      setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
      setShowReject(null)
    } catch (e: any) {
      toast({ title: e.message || 'Erro ao processar', variant: 'destructive' })
    } finally {
      setProcessing(null)
    }
  }

  async function batchApprove() {
    if (selected.size === 0) return
    setBatchProcessing(true)
    const ids = Array.from(selected)
    let ok = 0, fail = 0
    await Promise.all(ids.map(async id => {
      try {
        const res = await fetch(`/api/tasks/${id}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approve' }),
        })
        if (res.ok) ok++; else fail++
      } catch { fail++ }
    }))
    toast({ title: `✅ ${ok} aprovada${ok !== 1 ? 's' : ''}${fail > 0 ? ` · ${fail} com erro` : ''}` })
    setSelected(new Set())
    fetchTasks()
    setBatchProcessing(false)
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  function toggleAll() {
    setSelected(selected.size === tasks.length ? new Set() : new Set(tasks.map(t => t.id)))
  }

  // ── Order actions ────────────────────────────────────────────────────────────
  async function reviewOrder(id: string, action: 'approve' | 'deliver' | 'cancel') {
    setOrderProcessing(id)
    try {
      const res = await fetch(`/api/admin/resgates?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro')
      const labels = { approve: '✅ Resgate aprovado', deliver: '📦 Marcado como entregue', cancel: '❌ Resgate cancelado' }
      toast({ title: labels[action] })
      fetchOrders()
    } catch (e: any) {
      toast({ title: e.message || 'Erro', variant: 'destructive' })
    } finally {
      setOrderProcessing(null)
    }
  }

  const allSelected = tasks.length > 0 && selected.size === tasks.length

  const ORDER_STATUS_CONFIG = {
    REQUESTED: { label: 'Solicitado', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
    APPROVED:  { label: 'Aprovado',   color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/30' },
    DELIVERED: { label: 'Entregue',   color: 'text-emerald-400',bg: 'bg-emerald-400/10 border-emerald-400/30' },
    CANCELED:  { label: 'Cancelado',  color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/30' },
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-brand-400" />
            <h1 className="text-2xl font-display font-bold text-white">Aprovações</h1>
          </div>
          <p className="text-slate-400 text-sm">Tarefas e resgates aguardando revisão</p>
        </div>
        <div className="flex gap-2">
          {tasks.length > 0 && (
            <span className="px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-medium">
              {tasks.length} tarefa{tasks.length > 1 ? 's' : ''}
            </span>
          )}
          {orders.filter(o => o.status === 'REQUESTED').length > 0 && (
            <span className="px-3 py-1 rounded-full bg-blue-400/10 border border-blue-400/30 text-blue-400 text-xs font-medium">
              {orders.filter(o => o.status === 'REQUESTED').length} resgate{orders.filter(o => o.status === 'REQUESTED').length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/5 w-fit">
        {(['tarefas', 'resgates'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all
              ${tab === t ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
            {t === 'tarefas' ? 'Tarefas / Pontos' : 'Resgates'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ══════════════════ TAREFAS ══════════════════ */}
        {tab === 'tarefas' && (
          <motion.div key="tarefas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

            {tasksLoading ? (
              <div className="flex items-center justify-center min-h-40">
                <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="rounded-2xl bg-white/3 border border-white/8 p-10 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-400/50 mx-auto mb-3" />
                <p className="text-slate-400">Nenhuma aprovação pendente.</p>
                <p className="text-slate-600 text-xs mt-1">Equipe em dia! 🎉</p>
              </div>
            ) : (
              <>
                {/* Batch toolbar */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/3 border border-white/8">
                  <button onClick={toggleAll}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                    {allSelected ? <CheckSquare className="w-4 h-4 text-brand-400" /> : <Square className="w-4 h-4" />}
                    <span>{allSelected ? 'Desselecionar' : 'Selecionar todos'}</span>
                  </button>
                  <div className="flex-1" />
                  {selected.size > 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{selected.size} selecionado{selected.size > 1 ? 's' : ''}</span>
                      <button onClick={batchApprove} disabled={batchProcessing}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl gradient-brand text-white text-sm font-medium disabled:opacity-60 shadow-md shadow-brand-500/20">
                        {batchProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                        Aprovar selecionados
                      </button>
                    </motion.div>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {tasks.map((task, i) => {
                    const isSelected = selected.has(task.id)
                    return (
                      <motion.div key={task.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }} transition={{ delay: i * 0.04 }}
                        className={`rounded-2xl border p-5 space-y-4 cursor-pointer transition-colors
                          ${isSelected ? 'bg-brand-500/5 border-brand-500/30' : 'bg-white/3 border-white/8 hover:border-white/15'}`}
                        onClick={() => toggleSelect(task.id)}>

                        <div className="flex items-center gap-3">
                          <div onClick={e => { e.stopPropagation(); toggleSelect(task.id) }} className="shrink-0">
                            {isSelected ? <CheckSquare className="w-4 h-4 text-brand-400" /> : <Square className="w-4 h-4 text-slate-600" />}
                          </div>
                          <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-sm">{task.user.name[0]}</span>
                          </div>
                          <div>
                            <div className="text-white font-medium text-sm">{task.user.name}</div>
                            <div className="text-slate-500 text-xs">{task.user.units?.[0] ?? task.user.company ?? task.user.email}</div>
                          </div>
                          <div className="ml-auto flex items-center gap-1 text-brand-400 font-bold text-sm">
                            <Star className="w-3.5 h-3.5" />
                            {task.isAdHoc
                              ? (task.requestedPoints != null ? `${task.requestedPoints} sugerido` : '? pts')
                              : `+${task.taskDefinition?.points ?? 0}`}
                          </div>
                        </div>

                        <div className="rounded-xl bg-white/3 border border-white/5 p-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Clock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                            <span className="text-sm text-white font-medium">
                              {task.isAdHoc ? task.adHocTitle : task.taskDefinition?.title}
                            </span>
                            {task.isAdHoc && (
                              <span className="text-xs px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">Avulsa</span>
                            )}
                          </div>
                          {task.note && <p className="text-xs text-slate-400 mt-1 ml-5">{task.note}</p>}
                          <div className="text-xs text-slate-600 mt-1 ml-5">{new Date(task.date).toLocaleDateString('pt-BR')}</div>
                        </div>

                        {task.evidenceUrl && (
                          <div className="rounded-xl bg-blue-400/5 border border-blue-400/20 p-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2 text-xs text-blue-400 mb-1">
                              <ImageIcon className="w-3.5 h-3.5" /> Evidência enviada
                            </div>
                            {task.evidenceUrl.startsWith('data:image') ? (
                              <Image
                                src={task.evidenceUrl}
                                alt="Evidência"
                                width={800}
                                height={480}
                                unoptimized
                                className="w-full max-h-48 object-contain rounded-lg mt-1"
                              />
                            ) : (
                              <a href={task.evidenceUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-blue-300 underline truncate mt-0.5">
                                <ExternalLink className="w-3 h-3" /> {task.evidenceUrl}
                              </a>
                            )}
                          </div>
                        )}

                        {task.isAdHoc ? (
                          /* ── Atividade avulsa: só pontuar ── */
                          <div className="space-y-3" onClick={e => e.stopPropagation()}>
                            <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/20 p-3">
                              <label className="text-xs text-indigo-400 font-medium block mb-1.5">
                                Quantos pontos essa atividade valeu?
                                {task.requestedPoints != null && (
                                  <span className="text-slate-500 font-normal"> (colaborador sugeriu {task.requestedPoints})</span>
                                )}
                              </label>
                              <input
                                type="number" min="0" max="10000"
                                value={adhocPoints[task.id] ?? (task.requestedPoints?.toString() ?? '')}
                                onChange={e => setAdhocPoints(p => ({ ...p, [task.id]: e.target.value }))}
                                placeholder="0"
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-indigo-500/20 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/40"
                              />
                            </div>
                            <AnimatePresence>
                              {showReject === task.id && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                  <textarea
                                    value={rejectNote[task.id] ?? ''}
                                    onChange={e => setRejectNote(p => ({ ...p, [task.id]: e.target.value }))}
                                    placeholder="Motivo (opcional)..."
                                    rows={2}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-red-500/5 border border-red-500/20 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                            <div className="flex gap-3">
                              {showReject === task.id ? (
                                <>
                                  <button onClick={() => setShowReject(null)} disabled={!!processing}
                                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-medium">Cancelar</button>
                                  <button onClick={() => reviewTask(task.id, 'reject', task)} disabled={processing === task.id}
                                    className="flex-1 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                                    {processing === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    Confirmar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => setShowReject(task.id)} disabled={!!processing}
                                    className="px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                                    <XCircle className="w-4 h-4" /> Não realizada
                                  </button>
                                  <button onClick={() => reviewTask(task.id, 'approve', task)} disabled={processing === task.id}
                                    className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 shadow-md shadow-brand-500/20 disabled:opacity-50">
                                    {processing === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Atribuir pontos
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* ── Tarefa regular: aprovar / reprovar ── */
                          <>
                            <AnimatePresence>
                              {showReject === task.id && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                  onClick={e => e.stopPropagation()}>
                                  <textarea
                                    value={rejectNote[task.id] ?? ''}
                                    onChange={e => setRejectNote(p => ({ ...p, [task.id]: e.target.value }))}
                                    placeholder="Motivo da reprovação (opcional)..."
                                    rows={2}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-red-500/5 border border-red-500/20 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-red-500/30 resize-none transition-all"
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                            <div className="flex gap-3" onClick={e => e.stopPropagation()}>
                              {showReject === task.id ? (
                                <>
                                  <button onClick={() => setShowReject(null)} disabled={!!processing}
                                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-medium">Cancelar</button>
                                  <button onClick={() => reviewTask(task.id, 'reject', task)} disabled={processing === task.id}
                                    className="flex-1 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                                    {processing === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                    Confirmar reprovação
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => setShowReject(task.id)} disabled={!!processing}
                                    className="flex-1 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                                    <XCircle className="w-4 h-4" /> Reprovar
                                  </button>
                                  <button onClick={() => reviewTask(task.id, 'approve', task)} disabled={processing === task.id}
                                    className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 shadow-md shadow-brand-500/20 disabled:opacity-50">
                                    {processing === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Aprovar
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        )}

        {/* ══════════════════ RESGATES ══════════════════ */}
        {tab === 'resgates' && (
          <motion.div key="resgates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Status filter */}
            <div className="flex gap-2">
              {(['REQUESTED', 'APPROVED', 'ALL'] as const).map(s => (
                <button key={s} onClick={() => setOrderStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border
                    ${orderStatusFilter === s ? 'bg-brand-500 text-white border-brand-500' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}>
                  {s === 'REQUESTED' ? 'Solicitados' : s === 'APPROVED' ? 'Aprovados' : 'Todos'}
                </button>
              ))}
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center min-h-40">
                <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-2xl bg-white/3 border border-white/8 p-10 text-center">
                <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">Nenhum resgate neste status.</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {orders.map((order, i) => {
                  const cfg = ORDER_STATUS_CONFIG[order.status]
                  return (
                    <motion.div key={order.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }} transition={{ delay: i * 0.04 }}
                      className="rounded-2xl bg-white/3 border border-white/8 p-5">

                      <div className="flex items-start gap-4">
                        <div className="text-2xl shrink-0">{order.product.emoji ?? '🎁'}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-medium text-sm">{order.product.title}</span>
                            <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                          </div>
                          <div className="text-slate-400 text-xs mt-0.5">
                            {order.user.name} · {order.user.units?.[0] ?? order.user.email}
                          </div>
                          <div className="text-slate-600 text-xs mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {' · '}{order.pointsCost.toLocaleString('pt-BR')} pts
                          </div>
                        </div>
                      </div>

                      {(order.status === 'REQUESTED' || order.status === 'APPROVED') && (
                        <div className="flex gap-3 mt-4">
                          {order.status === 'REQUESTED' && (
                            <>
                              <button
                                onClick={() => reviewOrder(order.id, 'cancel')}
                                disabled={orderProcessing === order.id}
                                className="flex-1 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                                {orderProcessing === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                Cancelar
                              </button>
                              <button
                                onClick={() => reviewOrder(order.id, 'approve')}
                                disabled={orderProcessing === order.id}
                                className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 shadow-md shadow-brand-500/20 disabled:opacity-50">
                                {orderProcessing === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Aprovar
                              </button>
                            </>
                          )}
                          {order.status === 'APPROVED' && (
                            <button
                              onClick={() => reviewOrder(order.id, 'deliver')}
                              disabled={orderProcessing === order.id}
                              className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                              {orderProcessing === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                              Marcar como entregue
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
