'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, XCircle, Clock, Star, Loader2,
  Image as ImageIcon, ExternalLink, CheckSquare, Square, Zap
} from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { Skeleton } from '@/components/ui/skeleton'

interface PendingTask {
  id: string
  date: string
  note?: string
  evidenceUrl?: string
  isAdHoc: boolean
  adHocTitle?: string
  requestedPoints?: number
  user: { id: string; name: string; email: string; company?: string; units?: string[] }
  taskDefinition: { title: string; points: number; requireEvidence: boolean } | null
}

export default function AprovacoesPage() {
  const [tasks, setTasks]         = useState<PendingTask[]>([])
  const [loading, setLoading]     = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [batchProcessing, setBatchProcessing] = useState(false)
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({})
  const [showReject, setShowReject] = useState<string | null>(null)
  const [selected, setSelected]   = useState<Set<string>>(new Set())

  const fetchTasks = () => {
    setLoading(true)
    fetch('/api/gestor/aprovacoes')
      .then(r => r.json())
      .then(data => { setTasks(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchTasks() }, [])

  // ── Single review ─────────────────────────────────────────────────────────
  async function review(id: string, action: 'approve' | 'reject') {
    setProcessing(id)
    try {
      const res = await fetch(`/api/tasks/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: rejectNote[id] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao processar')

      toast({
        title: action === 'approve' ? '✅ Aprovado!' : '❌ Reprovado',
        description: action === 'approve'
          ? 'Pontos confirmados para o colaborador.'
          : 'Tarefa reprovada com sucesso.',
      })
      setTasks(prev => prev.filter(t => t.id !== id))
      setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
      setShowReject(null)
    } catch (e: any) {
      toast({ title: e.message || 'Erro ao processar', variant: 'destructive' })
    } finally {
      setProcessing(null)
    }
  }

  // ── Batch approve ─────────────────────────────────────────────────────────
  async function batchApprove() {
    if (selected.size === 0) return
    if (!confirm(`Aprovar ${selected.size} tarefa${selected.size > 1 ? 's' : ''}? Pontos serão creditados imediatamente.`)) return
    setBatchProcessing(true)
    const ids = Array.from(selected)
      
      // Oculta os itens selecionados instantaneamente
      const optimisticTasks = tasks.filter(t => !selected.has(t.id))

      try {
        setTasks(optimisticTasks)
        let ok = 0, fail = 0
        await Promise.all(ids.map(async id => {
          try {
            const res = await fetch(`/api/tasks/${id}/review`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'approve' }),
            })
            if (res.ok) { ok++; return }
            fail++
          } catch { fail++ }
        }))
        toast({ title: `✅ ${ok} tarefa${ok !== 1 ? 's' : ''} aprovada${ok !== 1 ? 's' : ''}${fail > 0 ? ` · ${fail} com erro` : ''}` })
        if (fail > 0) fetchTasks()
        setSelected(new Set())
      } finally {
        setBatchProcessing(false)
      }
  }

  // ── Selection helpers ─────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function toggleAll() {
    if (selected.size === tasks.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(tasks.map(t => t.id)))
    }
  }

  const allSelected = tasks.length > 0 && selected.size === tasks.length

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32 rounded-lg" />
          <Skeleton className="h-3 w-48 rounded-full" />
        </div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3.5 w-32 rounded-full" />
              <Skeleton className="h-2.5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-8 rounded-full shrink-0" />
          </div>
          <Skeleton className="h-14 w-full rounded-xl" />
          <div className="flex gap-3">
            <Skeleton className="flex-1 h-10 rounded-xl" />
            <Skeleton className="flex-1 h-10 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Região ao vivo para leitores de tela */}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Aprovações</h1>
          <p className="text-slate-400 text-sm">Tarefas aguardando sua revisão</p>
        </div>
        {tasks.length > 0 && (
          <div className="px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-sm font-medium">
            {tasks.length} pendente{tasks.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Batch toolbar */}
      <AnimatePresence>
        {tasks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/3 border border-white/8">

            {/* Select all */}
            <button onClick={toggleAll}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
              {allSelected
                ? <CheckSquare className="w-4 h-4 text-brand-400" />
                : <Square className="w-4 h-4" />}
              <span>{allSelected ? 'Desselecionar' : 'Selecionar todos'}</span>
            </button>

            <div className="flex-1" />

            {selected.size > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{selected.size} selecionado{selected.size > 1 ? 's' : ''}</span>
                <button
                  onClick={batchApprove}
                  disabled={batchProcessing}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl gradient-brand text-white text-sm font-medium disabled:opacity-60 shadow-md shadow-brand-500/20 hover:-translate-y-0.5 transition-all">
                  {batchProcessing
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Zap className="w-3.5 h-3.5" />}
                  Aprovar selecionados
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {tasks.length === 0 ? (
        <div className="rounded-2xl bg-white/3 border border-white/8 p-10 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400/50 mx-auto mb-3" />
          <p className="text-slate-400">Nenhuma aprovação pendente.</p>
          <p className="text-slate-600 text-xs mt-1">Sua equipe está em dia! 🎉</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {tasks.map((task, i) => {
            const isSelected = selected.has(task.id)
            return (
              <motion.div key={task.id} layout
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0, overflow: 'hidden' }} transition={{ duration: 0.2 }}
                className={`rounded-2xl border p-5 space-y-4 transition-colors cursor-pointer
                  ${isSelected
                    ? 'bg-brand-500/5 border-brand-500/30'
                    : 'bg-white/3 border-white/8 hover:border-white/15'}`}
                onClick={() => toggleSelect(task.id)}>

                {/* User info row */}
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <div onClick={e => { e.stopPropagation(); toggleSelect(task.id) }}
                    className="shrink-0">
                    {isSelected
                      ? <CheckSquare className="w-4 h-4 text-brand-400" />
                      : <Square className="w-4 h-4 text-slate-600" />}
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
                    {task.taskDefinition ? `+${task.taskDefinition.points}` : task.requestedPoints ? `+${task.requestedPoints}` : '—'}
                  </div>
                </div>

                {/* Task */}
                <div className="rounded-xl bg-white/3 border border-white/5 p-3" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    <span className="text-sm text-white font-medium">
                      {task.taskDefinition?.title ?? task.adHocTitle ?? 'Atividade avulsa'}
                    </span>
                    {task.isAdHoc && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300">Avulsa</span>}
                  </div>
                  {task.note && <p className="text-xs text-slate-400 mt-1 ml-5">{task.note}</p>}
                  <div className="text-xs text-slate-600 mt-1 ml-5">
                    {new Date(task.date).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                {/* Evidence */}
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

                {/* Reject note textarea */}
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

                {/* Action buttons */}
                <div className="flex gap-3" onClick={e => e.stopPropagation()}>
                  {showReject === task.id ? (
                    <>
                      <button onClick={() => setShowReject(null)} disabled={!!processing}
                        className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-medium transition-colors">
                        Cancelar
                      </button>
                      <button onClick={() => review(task.id, 'reject')} disabled={processing === task.id}
                        className="flex-1 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                        {processing === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Confirmar reprovação
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setShowReject(task.id)} disabled={!!processing}
                        className="flex-1 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                        <XCircle className="w-4 h-4" /> Reprovar
                      </button>
                      <button onClick={() => review(task.id, 'approve')} disabled={processing === task.id}
                        className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 shadow-md shadow-brand-500/20 disabled:opacity-50 transition-opacity">
                        {processing === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Aprovar
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      )}
    </div>
  )
}
