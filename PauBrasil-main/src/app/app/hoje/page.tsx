'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import useSWR, { useSWRConfig } from 'swr'
import { motion } from 'framer-motion'
import { 
  CheckCircle2, Flame, AlertCircle, Plus, ChevronRight
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

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Não foi possível carregar as atividades.')
  return response.json()
}

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
  const { data: tasks = [], mutate: mutateTasks, isLoading: loadingTasks, error: tasksError } = useSWR<TaskInstance[]>('/api/checklist', fetcher)
  const { data: pointsData, isLoading: loadingPoints, error: pointsError } = useSWR('/api/pontos', fetcher)
  const { data: metaData } = useSWR('/api/metas/minha', fetcher)

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
  }

  const completingRef = useRef(false)

  // Handlers de Ações
  async function completeTask(taskToComplete: TaskInstance) {
    if (completingRef.current) return
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

    completingRef.current = true
    navigator.vibrate?.(30)
    setCompleting(id)
    try {
      await mutateTasks(
        fetch(`/api/tasks/${id}/complete`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ evidenceUrl: evidenceImage ?? undefined, note: evidenceNote || undefined }),
        }).then(async response => {
          const result = await response.json()
          if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Não foi possível concluir a atividade.')
          toast({
            title: result.isAdHoc ? 'Atividade concluída!' : result.requiresApproval ? 'Enviado para aprovação!' : 'Tarefa concluída!',
            description: result.isAdHoc ? 'Seu gestor irá atribuir a pontuação.' : result.isLate ? 'Atividades do dia anterior não pontuam.' : result.requiresApproval ? 'Aguardando aprovação do gestor.' : 'Pontos adicionados ao seu saldo.',
          })
          if (!result.isAdHoc && !result.isLate && !result.requiresApproval) firePoints(task.taskDefinition?.points ?? 0)
          return optimisticTasks
        }),
        { optimisticData: optimisticTasks, rollbackOnError: true, revalidate: true },
      )
      setEvidenceModal(null)
      setEvidenceImage(null)
      refreshAll()
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : 'Falha de conexão. Tente novamente.', variant: 'destructive' })
    } finally {
      completingRef.current = false
      setCompleting(null)
    }
  }

  async function submitAdhoc() {
    if (adhocForm.title.trim().length < 3) { toast({ title: 'Informe um título com ao menos 3 caracteres', variant: 'destructive' }); return }
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
        throw new Error(typeof data.error === 'string' ? data.error : 'Confira os dados da atividade. A pontuação deve estar entre 0 e 10.000.')
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
    if (!completing && dailyProgress === 100 && totalCount > 0 && !hasCelebrated) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7a1520', '#dcc8b1', '#bb8c08'],
        zIndex: 9999
      })
      setHasCelebrated(true)
    } else if (dailyProgress < 100) {
      setHasCelebrated(false)
    }
  }, [completing, dailyProgress, totalCount, hasCelebrated])

  const userLevel = UserService.getLevelByPoints(confirmedPoints)
  const levelProgress = UserService.calculateLevelProgress(confirmedPoints)

  const todayLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  if (tasksError || pointsError) return <div className="portal-error max-w-3xl mx-auto" role="alert"><h1>Não foi possível carregar suas atividades.</h1><p>Tente novamente para consultar o checklist e os pontos.</p><button onClick={refreshAll}>Tentar novamente</button></div>

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
        activeGoals={metaData?.meta ? [{
          title: metaData.meta.titulo,
          progress: metaData.pontos,
          target: metaData.meta.meta,
          type: metaData.meta.periodo
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
