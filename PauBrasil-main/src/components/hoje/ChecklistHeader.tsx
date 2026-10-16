'use client'

import { motion } from 'framer-motion'
import { Calendar, UserCircle } from 'lucide-react'

interface ChecklistHeaderProps {
  userName: string
  userLevel: string
  currentDate: string
}

export function ChecklistHeader({
  userName,
  userLevel,
  currentDate
}: ChecklistHeaderProps) {
  const getLevelStyles = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'bronze': return 'text-orange-400 bg-orange-400/10 border-orange-400/20 shadow-[0_0_15px_rgba(251,146,60,0.1)]'
      case 'prata':  return 'text-slate-300 bg-slate-400/10 border-slate-400/20 shadow-[0_0_15px_rgba(148,163,184,0.1)]'
      case 'ouro':   return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.1)]'
      case 'diamante': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20 font-bold'
    }
  }

  return (
    <div className="flex flex-col gap-1 mb-10">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-[0.2em]"
      >
        <Calendar className="w-3.5 h-3.5" />
        {currentDate}
      </motion.div>
      <div className="flex items-end justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1"
        >
          <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tighter leading-tight">
            Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-emerald-300">{userName.split(' ')[0]}</span>! 👋
          </h1>
          <p className="text-slate-500 text-sm md:text-base mt-2 font-medium">
            Seu roteiro de sucesso para hoje está pronto.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${getLevelStyles(userLevel)}`}
        >
          <UserCircle className="w-4 h-4" />
          Nível {userLevel}
        </motion.div>
      </div>
    </div>
  )
}
