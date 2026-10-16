'use client'

import { motion } from 'framer-motion'
import { Target, Trophy, TrendingUp, Star } from 'lucide-react'

interface ProgressSectionProps {
  levelProgress: number
  targetReward: {
    title: string
    requiredPoints: number
  } | null
  userPoints: number
  activeGoals: {
    title: string
    progress: number
    target: number
    type: string
  }[]
}

export function ProgressSection({
  levelProgress,
  targetReward,
  userPoints,
  activeGoals
}: ProgressSectionProps) {
  const nextLevelPoints = 1000 // Exemplo — idealmente viria de config
  const pointsRemaining = Math.max(0, nextLevelPoints - userPoints)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {/* Nível Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="group relative overflow-hidden bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 hover:border-brand-500/30 transition-colors"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Trophy className="w-24 h-24 text-brand-400 rotate-12" />
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-400 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
            <Trophy className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black font-display text-white tabular-nums min-w-[3ch] inline-block text-right">{levelProgress}%</span>
        </div>
        
        <h3 className="text-white font-bold text-sm mb-1 font-display tracking-tight">Próximo Nível</h3>
        <p className="text-xs text-slate-500 mb-5 font-medium">Faltam <span className="text-brand-400 font-bold">{pointsRemaining} XP</span> para subir.</p>
        
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
          {/* scaleX em vez de width: compositor thread apenas, zero reflow */}
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 relative origin-left transition-transform duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `scaleX(${levelProgress / 100})` }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[shimmer_2s_infinite] shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
          </div>
        </div>
      </motion.div>

      {/* Meta Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="group relative overflow-hidden bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 hover:border-indigo-500/30 transition-colors"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Target className="w-24 h-24 text-indigo-400 -rotate-12" />
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
            <Target className="w-6 h-6" />
          </div>
          <Star className="w-6 h-6 text-indigo-400/20" />
        </div>

        <h3 className="text-white font-bold text-sm mb-1 font-display tracking-tight">Prêmio Alvo</h3>
        <p className="text-xs text-slate-500 mb-5 line-clamp-1 font-medium italic">
          {targetReward ? `Desejo: ${targetReward.title}` : 'O que você quer resgatar hoje?'}
        </p>
        
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-3xl font-black font-display text-white tracking-tighter">
              {targetReward ? Math.min(100, Math.round((userPoints / targetReward.requiredPoints) * 100)) : 0}%
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-black">Conquista</span>
          </div>
          <div className="flex flex-col items-end">
             <span className="text-sm font-black text-indigo-400 font-display tabular-nums">
               <span className="inline-block min-w-[4ch]">{userPoints.toLocaleString()}</span>
               <span className="text-slate-600 text-[10px] font-bold"> / </span>
               <span className="inline-block min-w-[4ch]">{targetReward?.requiredPoints.toLocaleString() || 0}</span>
             </span>
             <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-black">XP Saldo</span>
          </div>
        </div>
      </motion.div>

      {/* Desempenho Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="group relative overflow-hidden bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 hover:border-emerald-500/30 transition-colors"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <TrendingUp className="w-24 h-24 text-emerald-400 rotate-6" />
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex -space-x-2">
             <div className="w-7 h-7 rounded-full border-2 border-[#09090b] bg-slate-800 shadow-lg ring-1 ring-white/5" />
             <div className="w-7 h-7 rounded-full border-2 border-[#09090b] bg-slate-700 shadow-lg ring-1 ring-white/5" />
          </div>
        </div>

        <h3 className="text-white font-bold text-sm mb-1 font-display tracking-tight">Meta Mensal</h3>
        <p className="text-xs text-slate-500 mb-5 line-clamp-1 font-medium">
          {activeGoals?.[0]?.title || 'Acelere para bater a meta!'}
        </p>
        
        <div className="flex items-center justify-between text-white font-display">
           <span className="text-3xl font-black tracking-tighter">
             {activeGoals?.[0] ? Math.round((activeGoals[0].progress / activeGoals[0].target) * 100) : 0}%
           </span>
           <div className="flex flex-col items-end">
              <span className="text-xs text-emerald-400 font-black uppercase tracking-widest">Master</span>
              <span className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-black">Rank</span>
           </div>
        </div>
      </motion.div>
    </div>
  )
}
