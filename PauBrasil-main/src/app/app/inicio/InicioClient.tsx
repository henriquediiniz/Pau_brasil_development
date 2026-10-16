'use client'

import useSWR, { preload } from 'swr'
import { motion } from 'framer-motion'
import {
  CheckSquare, CalendarClock, Trophy, GraduationCap, User, Star,
  Flame, ArrowRight, Target, Loader2, ShoppingBag, Clock, TrendingUp,
  Shield, Users, BarChart2, Settings, ChevronRight, Building2,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getLevel, LEVEL_COLORS, LEVEL_BG } from '@/types'
import type { Badge } from '@/lib/badges'
import { isCoordLevel } from '@/lib/auth-helpers'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const PREFETCH_MAP: Record<string, string> = {
  '/app/hoje': '/api/checklist',
  '/gestor/aprovacoes': '/api/gestor/aprovacoes',
  '/app/ranking': '/api/ranking',
}

interface Stats {
  pontos: number
  streak: number
  tarefasHoje: { total: number; feitas: number }
  meta: { titulo: string; meta: number; pontos: number; pct: number; periodo: string } | null
}

interface GlobalGoal {
  id: string
  title: string
  description: string | null
  targetValue: number
  currentValue: number
  deadline: string | null
  rewardPoints: number
  units: string[]
}

const COLAB_FEATURES = [
  { href: '/app/hoje', icon: CheckSquare, color: 'text-brand-400', bg: 'bg-brand-400/10 border-brand-400/20', title: 'Minhas tarefas', desc: 'Veja e conclua as atividades do dia para acumular pontos.' },
  { href: '/app/agenda', icon: CalendarClock, color: 'text-indigo-400', bg: 'bg-indigo-400/10 border-indigo-400/20', title: 'Agenda', desc: 'Reuniões e atividades agendadas. Aceite convites e confirme presença.' },
  { href: '/app/ranking', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', title: 'Ranking', desc: 'Compare seu desempenho com o time. Veja quem lidera hoje, na semana e no mês.' },
  { href: '/universidade', icon: GraduationCap, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20', title: 'Universidade PB', desc: 'Assista episódios, faça provas e ganhe certificados que valem pontos extras.' },
  { href: '/app/perfil', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', title: 'Minha evolução', desc: 'Acompanhe seu histórico semanal de pontos, streak e conquistas desbloqueadas.' },
  { href: '/app/conquistas', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', title: 'Conquistas', desc: 'Seus badges e certificações desbloqueados. Veja o que ainda falta conquistar.' },
  { href: '/app/loja', icon: ShoppingBag, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20', title: 'Loja de recompensas', desc: 'Troque seus pontos por produtos e benefícios exclusivos.' },
]

const COORD_FEATURES = [
  { href: '/gestor/dashboard', icon: BarChart2, color: 'text-brand-400', bg: 'bg-brand-400/10 border-brand-400/20', title: 'Dashboard da equipe', desc: 'Veja em tempo real quem concluiu as tarefas e quem precisa de apoio.' },
  { href: '/coord/aprovacoes', icon: Shield, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', title: 'Aprovações', desc: 'Revise e aprove tarefas submetidas pela sua equipe.' },
  { href: '/coord/atividades', icon: Settings, color: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/20', title: 'Atividades da equipe', desc: 'Configure e gerencie as atividades avulsas do seu time.' },
  { href: '/app/agenda', icon: CalendarClock, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20', title: 'Agenda', desc: 'Reuniões, convites e atividades agendadas para a equipe.' },
  { href: '/app/ranking', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20', title: 'Ranking', desc: 'Posição da equipe no ranking de pontos.' },
  { href: '/app/hoje', icon: CheckSquare, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', title: 'Minhas tarefas', desc: 'Suas próprias atividades do dia.' },
]

function StatCard({ icon: Icon, value, label, color, bg }: { icon: any; value: string | number; label: string; color: string; bg: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg backdrop-blur-md ${bg}`}>
      <Icon className={`w-4 h-4 ${color} mb-2`} />
      <div className={`text-2xl font-display font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}

function FeatureCard({ item, i }: { item: typeof COLAB_FEATURES[0]; i: number }) {
  const Icon = item.icon
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
      <Link href={item.href}
        onMouseEnter={() => {
          const apiUrl = PREFETCH_MAP[item.href]
          if (apiUrl) preload(apiUrl, fetcher)
        }}
        className={`group flex flex-col gap-3 rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d14] backdrop-blur-md ${item.bg}`}>
        <div className="flex items-start justify-between">
          <Icon className={`w-6 h-6 ${item.color}`} />
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{item.title}</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
        </div>
      </Link>
    </motion.div>
  )
}

export default function InicioClient({ session, fallbackData }: { session: any; fallbackData?: any }) {
  const user = session?.user
  const isCoord = user ? isCoordLevel(user) : false

  const { data, isLoading } = useSWR(
    'dashboard_inicio_data',
    async () => {
      const [pts, tasks, ev, meta, gg, bdgs] = await Promise.all([
        fetch('/api/pontos').then(r => r.json()),
        fetch('/api/checklist').then(r => r.json()),
        fetch('/api/pontos/evolucao').then(r => r.json()),
        fetch('/api/metas/minha').then(r => r.json()),
        fetch('/api/global-goal').then(r => r.json()),
        fetch('/api/conquistas').then(r => r.json()),
      ])
      const feitas = Array.isArray(tasks) ? tasks.filter((t: any) => ['DONE', 'APPROVED'].includes(t.status) && !t.rolledOver).length : 0
      const total  = Array.isArray(tasks) ? tasks.filter((t: any) => !t.rolledOver && !t.isAdHoc).length : 0
      return {
        stats: {
          pontos: pts?.balance?.confirmed ?? 0,
          streak: ev?.streak ?? 0,
          tarefasHoje: { total, feitas },
          meta: meta ? { titulo: meta.meta.titulo, meta: meta.meta.meta, pontos: meta.pontos, pct: meta.pct, periodo: meta.meta.periodo } : null,
        },
        globalGoal: gg?.goal ?? null,
        badges: Array.isArray(bdgs) ? bdgs : []
      }
    },
    { fallbackData, revalidateOnFocus: false, dedupingInterval: 60000 }
  )

  const stats: Stats | null = data?.stats ?? null
  const globalGoal: GlobalGoal | null = data?.globalGoal ?? null
  const badges: Badge[] = data?.badges ?? []

  if (isLoading && !data) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-pulse">
        <div className="h-[120px] rounded-3xl bg-white/5 border border-white/10" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl bg-white/5 border border-white/10" />)}
        </div>
        <div className="h-32 rounded-2xl bg-white/5 border border-white/10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-36 rounded-2xl bg-white/5 border border-white/10" />)}
        </div>
      </div>
    )
  }

  const level = stats ? getLevel(stats.pontos) : 'Bronze'
  const features = isCoord ? COORD_FEATURES : COLAB_FEATURES
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Hero: saudação */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden border border-white/8 bg-gradient-to-br from-brand-500/15 via-white/2 to-indigo-500/10 p-7">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl overflow-hidden gradient-brand flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/30">
            {user?.photoUrl
              ? <Image src={user.photoUrl} alt={user.name} width={64} height={64} className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-2xl font-display">{user?.name?.[0] ?? 'U'}</span>
            }
          </div>
          <div className="flex-1">
            <p className="text-slate-400 text-sm">{saudacao},</p>
            <h1 className="text-2xl font-display font-bold text-white mt-0.5">{user?.name?.split(' ')[0]} 👋</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${LEVEL_BG[level]} ${LEVEL_COLORS[level]}`}>
                <Star className="w-3 h-3" /> Nível {level}
              </div>
              {badges.filter(b => b.ganho).length > 0 && (() => {
                const earned = badges.filter(b => b.ganho)
                const visible = earned.slice(0, 4)
                const extra   = earned.length - visible.length
                return (
                  <>
                    {visible.map(b => (
                      <span key={b.id} title={b.descricao} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-xs text-slate-300 cursor-default select-none hover:bg-white/12 transition-colors">
                        {b.emoji} <span className="hidden sm:inline">{b.nome}</span>
                      </span>
                    ))}
                    <Link href="/app/conquistas" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-xs text-yellow-400 hover:bg-yellow-400/20 transition-colors font-medium">
                      {extra > 0 ? `+${extra} →` : <><Trophy className="w-3 h-3" /> ver todas</>}
                    </Link>
                  </>
                )
              })()}
            </div>
          </div>
          <Link href="/app/hoje" className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/25 hover:-translate-y-0.5 transition-all shrink-0">
            Ver minhas tarefas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      {stats && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Star} value={stats.pontos.toLocaleString('pt-BR')} label="pontos confirmados" color="text-brand-400" bg="bg-brand-500/10 border-brand-500/20" />
          <StatCard icon={Flame} value={`${stats.streak}d`} label="dias em sequência" color="text-orange-400" bg="bg-orange-400/10 border-orange-400/20" />
          <StatCard icon={CheckSquare} value={`${stats.tarefasHoje.feitas}/${stats.tarefasHoje.total}`} label="tarefas hoje" color="text-emerald-400" bg="bg-emerald-400/10 border-emerald-400/20" />
          <StatCard icon={Clock} value={new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} label="data de hoje" color="text-slate-400" bg="bg-white/5 border-white/10" />
        </motion.div>
      )}

      {/* Meta Global da Empresa */}
      {globalGoal && (() => {
        const pct = globalGoal.targetValue > 0 ? Math.min((globalGoal.currentValue / globalGoal.targetValue) * 100, 100) : 0
        const concluida = pct >= 100
        return (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl bg-white/5 backdrop-blur-xl border border-brand-500/20 p-5 shadow-lg shadow-brand-500/5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center shrink-0">
                  <Target className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-brand-400 font-medium uppercase tracking-wide">Meta Global da Empresa</p>
                  <h3 className="text-sm font-semibold text-white">{globalGoal.title}</h3>
                </div>
              </div>
              <span className={`text-sm font-bold shrink-0 ${concluida ? 'text-emerald-400' : 'text-brand-400'}`}>{pct.toFixed(0)}%</span>
            </div>
            {globalGoal.description && <p className="text-xs text-slate-500 mb-3 leading-relaxed">{globalGoal.description}</p>}
            <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: 'easeOut' }} className={`h-full rounded-full ${concluida ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]' : 'gradient-brand shadow-[0_0_10px_rgba(0,201,81,0.3)]'}`} />
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs text-slate-500">
                {globalGoal.currentValue.toLocaleString('pt-BR')} / {globalGoal.targetValue.toLocaleString('pt-BR')}
                {globalGoal.rewardPoints > 0 && <span className="ml-2 text-brand-400">· +{globalGoal.rewardPoints} pts</span>}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {globalGoal.deadline && <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(globalGoal.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>}
                {globalGoal.units.map((u: string) => <span key={u} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/25 text-brand-300"><Building2 className="w-2.5 h-2.5" />{u}</span>)}
              </div>
            </div>
          </motion.div>
        )
      })()}

      {/* Meta do período */}
      {stats?.meta && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">{stats.meta.titulo}</span>
              <span className="text-xs text-slate-500">— meta {stats.meta.periodo}</span>
            </div>
            <span className={`text-sm font-bold ${stats.meta.pct >= 100 ? 'text-emerald-400' : 'text-yellow-400'}`}>{stats.meta.pct}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${stats.meta.pct}%` }} transition={{ duration: 0.9, ease: 'easeOut' }} className={`h-full rounded-full ${stats.meta.pct >= 100 ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]' : 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.4)]'}`} />
          </div>
          <p className="text-xs text-slate-500 mt-2">{stats.meta.pontos.toLocaleString('pt-BR')} de {stats.meta.meta.toLocaleString('pt-BR')} pts</p>
        </motion.div>
      )}

      {/* Feature cards */}
      <div>
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.09 }} className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
          {isCoord ? 'Recursos disponíveis para você' : 'O que você pode fazer no portal'}
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {features.map((item, i) => <FeatureCard key={item.href} item={item} i={i} />)}
        </div>
      </div>

      {/* Tip / quick start */}
      {!isCoord && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="rounded-2xl bg-brand-500/5 border border-brand-500/15 p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><span className="text-base">💡</span> Como funciona</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Complete tarefas', desc: 'Acesse "Minhas tarefas" todos os dias e marque as atividades da sua função como concluídas.' },
              { step: '2', title: 'Acumule pontos', desc: 'Cada tarefa concluída e aprovada adiciona pontos à sua conta. Certificados UPB valem pontos extras.' },
              { step: '3', title: 'Troque por recompensas', desc: 'Com pontos suficientes, visite a Loja e resgate produtos, vouchers e benefícios exclusivos.' },
            ].map(s => (
              <div key={s.step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">{s.step}</div>
                <div>
                  <div className="text-sm font-medium text-white">{s.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}