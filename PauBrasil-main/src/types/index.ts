import { Role } from '@prisma/client'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
  nivel?: string
  functionId?: string | null
  company?: string | null
  units?: string[]
}

export interface UserWithBalance extends SessionUser {
  confirmedPoints: number
  pendingPoints: number
  level: Level
}

export type Level = 'Bronze' | 'Prata' | 'Ouro' | 'Diamante'

export function getLevel(points: number): Level {
  if (points >= 2000) return 'Diamante'
  if (points >= 1000) return 'Ouro'
  if (points >= 400) return 'Prata'
  return 'Bronze'
}

export const LEVEL_COLORS: Record<Level, string> = {
  Bronze: 'text-amber-700',
  Prata: 'text-slate-400',
  Ouro: 'text-yellow-400',
  Diamante: 'text-cyan-400',
}

export const LEVEL_BG: Record<Level, string> = {
  Bronze: 'bg-amber-700/10 border-amber-700/30',
  Prata: 'bg-slate-400/10 border-slate-400/30',
  Ouro: 'bg-yellow-400/10 border-yellow-400/30',
  Diamante: 'bg-cyan-400/10 border-cyan-400/30',
}

export const LEVEL_THRESHOLDS: Record<Level, number> = {
  Bronze: 0,
  Prata: 400,
  Ouro: 1000,
  Diamante: 2000,
}

export interface TaskInstance {
  id: string
  status: 'PENDING' | 'BLOCKED' | 'DONE' | 'APPROVED' | 'REJECTED'
  date: string
  taskDefinition: {
    title: string
    description?: string
    points: number
    requireApproval: boolean
    requireEvidence: boolean
    prevTasks?: { id: string; title: string; function: { name: string } }[]
  } | null
  triggeredByInstance?: {
    user: { name: string }
    taskDefinition: { title: string } | null
  } | null
  isAdHoc: boolean
  adHocTitle: string | null
  adHocDesc: string | null
  requestedPoints: number | null
  conviteDeId?: string | null
  conviteDe?: { adHocTitle: string | null; requestedPoints: number | null; user: { name: string } } | null
  conviteStatus?: string | null
}
