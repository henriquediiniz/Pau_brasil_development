'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import useSWR, { useSWRConfig } from 'swr'
import { motion } from 'framer-motion'
import { 
  CheckCircle2, Flame, AlertCircle, Plus, CalendarClock, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import confetti from 'canvas-confetti'

import { TaskInstance } from '@/types'
import { toast } from '@/components/ui/toaster'

// Novos Componentes
import { ChecklistHeader } from '@/components/hoje/ChecklistHeader'
import { ProgressSection } from '@/components/hoje/ProgressSection'
import { TaskCard } from '@/components/hoje/TaskCard'
import { EvidenceModal } from '@/components/hoje/EvidenceModal'
import { AdhocModal } from '@/components/hoje/AdhocModal'
import { DashboardSkeleton } from '@/components/hoje/DashboardSkeleton'
import { UserService } from '@/services/UserService'
import { useFloatingPoints, FloatingPointsDisplay } from '@/components/ui/FloatingPoints'

const fetcher = (url: string) => fetch(url).then(res => res.json())

function isRolledOver(task: TaskInstance): boolean {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d     = new Date(task.date); d.setHours(0, 0, 0, 0)
  return d < today
}

export default function HojePage() {
  const { data: session } = useSession()
  const { mutate } = useSWRConfig()
  const user = session?.user

  // SWR Hooks
  const { data: tasks = [], mutate: mutateTasks, isLoading: loadingTasks } = useSWR<TaskInstance[]>('/api/checklist', fetcher)
  const { data: pointsData, mutate: mutatePoints, isLoading: loadingPoints } = useSWR('/api/pontos', fetcher)
  const { data: agendaData } = useSWR('/api/agenda', fetcher)
  const { data: metaData } = useSWR('/api/metas/minha', fetcher)
  const { data: targetData } = useSWR('/api/me/target', fetcher)

  // Estados Locais para UI e Ações
  const [completing, setCompleting]       = useState<string | null>(null)
  const [evidenceModal, setEvidenceModal] = useState<TaskInstance | null>(null)
  const [evidenceImage, setEvidenceImage] = useState<string | null>(null)
  const [evidenceNote, setEvidenceNote]   = useState('')

  const [adhocModal, setAdhocModal]   = useState(false)
  const [adhocForm, setAdhocForm]     = useState({ title: '', desc: '', points: 0 })
  const [adhocSaving, setAdhocSaving] = useState(false)
  const { items: floatingPts, fire: firePoints } = useFloatingPoints()

  // Helpers de Revalidação
  const refreshAll = () => {
    mutate('/api/checklist')
    mutate('/api/pontos')
    mutate('/api/metas/minha')
    mutate('/api/me/target')
  }

  // Handlers de Ações
  async function completeTask(taskToComplete: TaskInstance) {
    if (!taskToComplete.isAdHoc && taskToComplete.taskDefinition?.requireEvidence && !evidenceModal) {
      setEvidenceModal(taskToComplete)
      setEvidenceImage(null)
      setEvidenceNote('')
      return
    }

    const task = evidenceModal ?? taskToComplete
    const id = task.id
    
    // --- Fluxo de Optimistic UI ---
    const optimisticTasks = tasks.map(t => 
      t.id === id ? { ...t, status: 'DONE' as const } : t
    )

    navigator.vibrate?.(30)
    setCompleting(id)

    // Dispara a mutação otimista
    void mutateTasks(
      fetch(`/api/tasks/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evidenceUrl: evidenceImage ?? undefined, note: evidenceNote || undefined }),
      }).then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        
        toast({ 
          title: data.isAdHoc ? '✅ Atividade concluída!' : (data.isLate ? '✅ Pendência concluída (0 pts)' : (data.requiresApproval ? '⏳ Enviado para aprovação!' : '✅ Tarefa concluída!')),
          description: data.isAdHoc ? 'Seu gestor irá atribuir a pontuação.' : (data.isLate ? 'Atividades do dia anterior não pontuam.' : (data.requiresApproval ? 'Aguardando aprovação do gestor.' : 'Pontos adicionados ao seu saldo.'))
        })
        
        // Revalida pontos após sucesso
        mutatePoints()
        if (!data.isAdHoc && !data.isLate && !data.requiresApproval) {
          firePoints(task.taskDefinition?.points ?? 0)
        }
        return optimisticTasks // O SWR cuida da revalidação final com o dado real
      }),
      {
        optimisticData: optimisticTasks,
        rollbackOnError: true,
        revalidate: true,
      }
    )

    setEvidenceModal(null)
    setEvidenceImage(null)
    setCompleting(null)
  }

  async function submitAdhoc() {
    if (!adhocForm.title.trim()) { toast({ title: 'Informe o título da atividade', variant: 'destructive' }); return }
    setAdhocSaving(true)
    try {
      const res = await fetch('/api/tasks/adhoc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adHocTitle: adhocForm.title.trim(),
          adHocDesc:  adhocForm.desc.trim() || undefined,
          requestedPoints: adhocForm.points || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao registrar')
      }
      toast({ title: '✅ Atividade adicionada!', description: 'Aparece no seu checklist de hoje.' })
      setAdhocModal(false)
      setAdhocForm({ title: '', desc: '', points: 0 })
      refreshAll()
    } catch (e: any) {
      toast({ title: e.message || 'Erro ao registrar atividade', variant: 'destructive' })
    } finally {
      setAdhocSaving(false)
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  // Cálculos de Display via UserService
  const balance = pointsData?.balance
  const confirmedPoints = balance?.confirmed || 0
  
  const todayTasks = tasks.filter(t => !isRolledOver(t))
  const rolledOver = tasks.filter(t => isRolledOver(t))
  const doneCount  = tasks.filter(t => ['APPROVED', 'DONE'].includes(t.status)).length
  const totalCount = tasks.length
  const dailyProgress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
  
  // Celebração de Meta Atingida (Confetes)
  const [hasCelebrated, setHasCelebrated] = useState(false)
  useEffect(() => {
    if (dailyProgress === 100 && totalCount > 0 && !hasCelebrated) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#ff7d0d', '#eab308'], // Brand colors: Emerald, Laranja, Yellow
        zIndex: 9999
      })
      setHasCelebrated(true)
    } else if (dailyProgress < 100) {
      setHasCelebrated(false)
    }
  }, [dailyProgress, totalCount, hasCelebrated])

  const userLevel = UserService.getLevelByPoints(confirmedPoints)
  const levelProgress = UserService.calculateLevelProgress(confirmedPoints)

  const todayLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayStr = new Date().toISOString().slice(0, 10)
  const upcoming = (agendaData?.minhas ?? []).filter((a: any) => a.date.slice(0, 10) > todayStr).slice(0, 5)

  if (loadingTasks || loadingPoints) return <DashboardSkeleton />

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-5xl mx-auto px-4 py-8 md:py-12"
    >
      <FloatingPointsDisplay items={floatingPts} />
      <ChecklistHeader 
        userName={user?.name || 'Colaborador'} 
        userLevel={userLevel} 
        currentDate={todayLabel} 
      />

      <ProgressSection 
        levelProgress={levelProgress}
        userPoints={balance?.confirmed || 0}
        targetReward={targetData?.targetReward ? { title: targetData.targetReward.title, requiredPoints: targetData.targetReward.pointsCost } : null}
        activeGoals={metaData ? [{
          title: metaData.titulo,
          progress: metaData.pontos,
          target: metaData.meta,
          type: metaData.periodo
        }] : []}
      />

      <div className="rounded-2xl bg-white/3 border border-white/8 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-medium text-white">Progresso do dia</span>
          </div>
          <span className="text-sm font-bold text-brand-400">{dailyProgress}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full rounded-full gradient-brand" 
            initial={{ width: 0 }} 
            animate={{ width: `${dailyProgress}%` }} 
            transition={{ duration: 0.8, ease: 'easeOut' }} 
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">{doneCount} de {totalCount} tarefas concluídas</p>
      </div>

      {/* Pendências */}
      {rolledOver.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <AlertCircle className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-medium text-orange-400 uppercase tracking-wider">
              Pendências anteriores — {rolledOver.length}
            </h2>
          </div>
          <p className="text-xs text-slate-600 px-1">
            Atividades não concluídas no dia programado não pontuam.
          </p>
          <div className="space-y-3">
            {rolledOver.map((task, i) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                i={i} 
                completing={completing}
                onComplete={completeTask}
                isRolledOver={isRolledOver}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Checklist Principal */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 mb-4">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Checklist do dia</h2>
          <button 
            onClick={() => setAdhocModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-brand-400 hover:border-brand-400/30 text-xs font-medium transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Atividade avulsa
          </button>
        </div>

        {todayTasks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-dashed border-white/10 p-10 flex flex-col items-center justify-center text-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
              <CheckCircle2 className="w-8 h-8 text-brand-400/30" />
            </div>
            <h3 className="text-white font-medium text-lg">Tudo em dia!</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-[260px]">
              Nenhuma tarefa pendente para hoje. Mantenha o foco!
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {todayTasks.map((task, i) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                i={i} 
                completing={completing}
                onComplete={completeTask}
                isRolledOver={isRolledOver}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Próximas Atividades */}
      {upcoming.length > 0 && (
        <div className="space-y-2 pt-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-brand-400" />
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Em breve</h2>
            </div>
            <Link href="/app/agenda" className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors">
              Ver agenda <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="rounded-2xl bg-white/3 border border-white/8 divide-y divide-white/5 overflow-hidden">
            {upcoming.map((item: any) => {
              const d = new Date(item.date)
              const dayLabel = d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xs font-mono font-medium text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-lg shrink-0">
                    {item.horario || '--:--'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{item.adHocTitle ?? 'Atividade agendada'}</p>
                    {item.adHocDesc && <p className="text-xs text-slate-500 truncate">{item.adHocDesc}</p>}
                  </div>
                  <span className="text-xs text-slate-500 shrink-0 capitalize">{dayLabel}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modais */}
      <EvidenceModal 
        isOpen={!!evidenceModal}
        task={evidenceModal}
        evidenceImage={evidenceImage}
        evidenceNote={evidenceNote}
        completing={completing}
        onClose={() => setEvidenceModal(null)}
        onImageSelect={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          if (file.size > 5 * 1024 * 1024) { toast({ title: 'Imagem muito grande. Máximo 5MB.', variant: 'destructive' }); return }
          const reader = new FileReader()
          reader.onload = () => setEvidenceImage(reader.result as string)
          reader.readAsDataURL(file)
        }}
        onImageRemove={() => setEvidenceImage(null)}
        onNoteChange={setEvidenceNote}
        onSubmit={completeTask}
      />

      <AdhocModal 
        isOpen={adhocModal}
        formData={adhocForm}
        isSubmitting={adhocSaving}
        onClose={() => setAdhocModal(false)}
        onFormChange={(field, value) => setAdhocForm(prev => ({ ...prev, [field]: value }))}
        onSubmit={submitAdhoc}
      />
    </motion.div>
  )
}
