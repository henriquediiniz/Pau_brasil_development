'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Clock, Star, Loader2, Image as ImageIcon, ExternalLink } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

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
  const [tasks, setTasks] = useState<PendingTask[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({})
  const [showReject, setShowReject] = useState<string | null>(null)

  const fetchTasks = () => {
    fetch('/api/coord/aprovacoes')
      .then(r => r.json())
      .then(data => { setTasks(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchTasks() }, [])

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
        description: action === 'approve' ? 'Pontos confirmados para o colaborador.' : 'Tarefa reprovada com sucesso.',
      })
      setTasks(prev => prev.filter(t => t.id !== id))
      setShowReject(null)
    } catch (e: any) {
      toast({ title: e.message || 'Erro ao processar', variant: 'destructive' })
    } finally {
      setProcessing(null)
    }
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
          <h1 className="text-2xl font-display font-bold text-white">Aprovações</h1>
          <p className="text-slate-400 text-sm">Tarefas aguardando sua revisão</p>
        </div>
        {tasks.length > 0 && (
          <div className="px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-sm font-medium">
            {tasks.length} pendente{tasks.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl bg-white/3 border border-white/8 p-10 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400/50 mx-auto mb-3" />
          <p className="text-slate-400">Nenhuma aprovação pendente.</p>
          <p className="text-slate-600 text-xs mt-1">Sua equipe está em dia! 🎉</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {tasks.map((task, i) => (
            <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, height: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-white/3 border border-white/8 p-5 space-y-4">

              {/* User info */}
              <div className="flex items-center gap-3">
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
              <div className="rounded-xl bg-white/3 border border-white/5 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <span className="text-sm text-white font-medium">
                    {task.taskDefinition?.title ?? task.adHocTitle ?? 'Atividade avulsa'}
                  </span>
                  {task.isAdHoc && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300">Avulsa</span>}
                </div>
                {task.note && <p className="text-xs text-slate-400 mt-1 ml-5">{task.note}</p>}
                <div className="text-xs text-slate-600 mt-1 ml-5">{new Date(task.date).toLocaleDateString('pt-BR')}</div>
              </div>

              {/* Evidence */}
              {task.evidenceUrl && (
                <div className="rounded-xl bg-blue-400/5 border border-blue-400/20 p-3">
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

              {/* Reject note */}
              <AnimatePresence>
                {showReject === task.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
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

              {/* Actions */}
              <div className="flex gap-3">
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
          ))}
        </AnimatePresence>
      )}
    </div>
  )
}
