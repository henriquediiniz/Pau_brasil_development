import { motion } from 'framer-motion'
import {
  CheckCircle2, Circle, Clock, Star, Loader2,
  Camera, MessageSquarePlus, Lock, Users,
} from 'lucide-react'
import { TaskInstance } from '@/types'

interface TaskCardProps {
  task: TaskInstance
  i: number
  completing: string | null
  onComplete: (task: TaskInstance) => void | Promise<void>
  isRolledOver: (task: TaskInstance) => boolean
  formatDate: (iso: string) => string
}

export function TaskCard({
  task,
  i,
  completing,
  onComplete,
  isRolledOver,
  formatDate
}: TaskCardProps) {
  const isPending    = task.status === 'PENDING'
  const isBlocked    = task.status === 'BLOCKED'
  const isDone       = task.status === 'DONE'
  const isApproved   = task.status === 'APPROVED'
  const isCompleting = completing === task.id
  const late         = isRolledOver(task)
  const isConvite    = !!task.conviteDeId

  const borderCls = isApproved
    ? 'bg-emerald-500/[0.03] border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
    : isDone
    ? 'bg-yellow-400/[0.03] border-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.05)]'
    : isBlocked
    ? 'bg-white/[0.01] border-white/5 opacity-50'
    : late
    ? 'bg-orange-500/[0.03] border-orange-500/20'
    : isConvite
    ? 'bg-purple-500/[0.03] border-purple-500/20'
    : task.isAdHoc
    ? 'bg-indigo-500/[0.03] border-indigo-500/20'
    : task.status === 'REJECTED'
    ? 'bg-red-500/[0.03] border-red-500/20'
    : 'bg-white/[0.02] border-white/10 hover:border-brand-500/40 hover:bg-brand-500/[0.05] hover:shadow-sm group relative overflow-hidden'

  const title = isConvite
    ? (task.conviteDe?.adHocTitle ?? task.adHocTitle ?? 'Reunião')
    : task.isAdHoc
    ? (task.adHocTitle ?? 'Atividade avulsa')
    : (task.taskDefinition?.title ?? '(tarefa removida)')

  const points = isConvite
    ? (task.conviteDe?.requestedPoints ?? null)
    : task.isAdHoc
    ? (task.requestedPoints ?? null)
    : task.taskDefinition?.points ?? 0

  // Quem precisa completar antes (para BLOCKED)
  const bloqueadaPor = task.taskDefinition?.prevTasks?.[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05, duration: 0.4 }}
      className={`rounded-3xl border p-5 backdrop-blur-sm transition-[border-color,background-color] duration-300 ${borderCls}`}
    >
      <div className="flex items-start gap-4">
        <button
          aria-label={`Concluir ${title}`}
          onClick={() => isPending && !completing && !isConvite && onComplete(task)}
          disabled={!isPending || !!completing || isBlocked || isConvite}
          className={`mt-1 shrink-0 transition-[color,transform] duration-300
            ${isPending && !late && !task.isAdHoc && !isConvite ? 'text-slate-600 hover:text-brand-400 hover:scale-125' : ''}
            ${isPending && late ? 'text-orange-400/60 hover:text-orange-400 hover:scale-125' : ''}
            ${isPending && task.isAdHoc && !late && !isConvite ? 'text-indigo-400/60 hover:text-indigo-400 hover:scale-125' : ''}
            ${isPending && isConvite ? 'text-purple-400/60 hover:text-purple-400 hover:scale-125' : ''}
            ${isApproved ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''}
            ${isDone ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : ''}
            ${isBlocked ? 'text-slate-700 cursor-not-allowed' : ''}
            ${task.status === 'REJECTED' ? 'text-red-400' : ''}
          `}
        >
          {isCompleting
            ? <Loader2 className="w-6 h-6 animate-spin" />
            : isBlocked
            ? <Lock className="w-6 h-6" />
            : isApproved
            ? <CheckCircle2 className="w-6 h-6" />
            : isDone
            ? <Clock className="w-6 h-6" />
            : isConvite
            ? <Users className="w-6 h-6" />
            : <Circle className="w-6 h-6" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`font-display font-bold text-base tracking-tight ${isApproved ? 'text-slate-500 line-through' : isBlocked ? 'text-slate-600' : 'text-white'}`}>
              {title}
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {isConvite && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-black uppercase tracking-widest flex items-center gap-1">
                  <Users className="w-2.5 h-2.5" /> Convite
                </span>
              )}
              {!isConvite && task.isAdHoc && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-black uppercase tracking-widest flex items-center gap-1">
                  <MessageSquarePlus className="w-2.5 h-2.5" /> Avulsa
                </span>
              )}
              {late && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-black uppercase tracking-widest">
                  Atrasada
                </span>
              )}
              {!task.isAdHoc && task.taskDefinition?.requireApproval && isPending && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/5 text-yellow-500 border border-yellow-400/10 font-black uppercase tracking-widest">Revisão</span>
              )}
              {!task.isAdHoc && task.taskDefinition?.requireEvidence && isPending && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-400 border border-blue-400/20 font-black uppercase tracking-widest flex items-center gap-1">
                  <Camera className="w-2.5 h-2.5" /> Foto
                </span>
              )}
            </div>
          </div>
          
          {isBlocked && (
            <p className="text-xs text-slate-500 font-medium mt-1">
              {bloqueadaPor 
                ? `Aguardando: ${bloqueadaPor.function.name} concluir "${bloqueadaPor.title}"`
                : 'Aguardando tarefa anterior'}
            </p>
          )}
          {isConvite && task.conviteDe && (
            <p className="text-xs text-slate-500 font-medium">por <span className="text-purple-400 font-bold">{task.conviteDe.user.name}</span></p>
          )}
          {!isBlocked && !isConvite && task.isAdHoc && task.adHocDesc && (
            <p className="text-xs text-slate-500 font-medium truncate">{task.adHocDesc}</p>
          )}
          {!task.isAdHoc && task.taskDefinition?.description && (
            <p className="text-xs text-slate-500 font-medium truncate">{task.taskDefinition.description}</p>
          )}
          {isDone && (
            <p className={`text-xs font-black uppercase tracking-widest mt-2 ${task.isAdHoc ? 'text-indigo-400' : 'text-yellow-400'}`}>
              ⏳ {task.isAdHoc ? 'Aguardando Atribuição' : 'Aguardando Aprovação'}
            </p>
          )}
        </div>

        <div className="shrink-0 pt-1">
          {isBlocked ? (
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">locked</span>
          ) : isConvite ? (
            points != null
              ? <div className="flex items-center gap-1 text-purple-400 font-black text-sm drop-shadow-[0_0_8px_rgba(168,85,247,0.3)]"><Star className="w-4 h-4 fill-purple-400" />{points}</div>
              : <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">tbd</span>
          ) : task.isAdHoc ? (
            points != null
              ? <div className="flex items-center gap-1 text-indigo-400 font-black text-sm drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]"><Star className="w-4 h-4 fill-indigo-400" />{points}<span className="text-[8px] font-normal text-slate-600 ml-0.5">EST.</span></div>
              : <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">tbd</span>
          ) : late ? (
            <div className="flex items-center gap-1 text-slate-700 font-black text-sm line-through"><Star className="w-4 h-4" />0</div>
          ) : (
            <div className="flex items-center gap-1 text-brand-400 font-black text-sm drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]"><Star className={`w-4 h-4 ${isApproved ? 'fill-brand-400' : ''}`} />{points}</div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
