import type { AnalyticsProperties } from '@/lib/analytics'

type TrackFn = (event: string, props?: AnalyticsProperties) => void

export type QuizTracker = {
  loaded: (p: { temporadaId: string; totalQuestoes?: number }) => void
  loadFailed: (p: { temporadaId: string; status?: number; error?: 'network' | 'parse' | 'unknown' }) => void
  validationFailed: (p: { temporadaId: string; missing: number }) => void
  submitted: (p: { temporadaId: string; aprovado: boolean; percentual: number; acertos: number; total: number }) => void
}

export function createQuizTracker(track: TrackFn): QuizTracker {
  return {
    loaded: (p) => track('quiz_loaded', p),
    loadFailed: (p) => track('quiz_load_failed', p),
    validationFailed: (p) => track('quiz_validation_failed', p),
    submitted: (p) => track('quiz_submitted', p),
  }
}

