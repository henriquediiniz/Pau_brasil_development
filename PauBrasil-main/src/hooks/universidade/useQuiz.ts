import { useEffect, useMemo, useRef, useState } from 'react'
import type { QuizTracker } from '@/lib/quiz-tracker'

export interface QuizOpcao { id: string; texto: string; ordem: number }
export interface QuizQuestao { id: string; enunciado: string; ordem: number; opcoes: QuizOpcao[] }
export interface QuizData { temporadaId: string; titulo: string; questoes: QuizQuestao[] }
export interface QuizResultado { acertos: number; total: number; aprovado: boolean; percentual: number }

async function safeJson(res: Response): Promise<any | null> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

type SubmitResult =
  | { ok: true; result: QuizResultado }
  | { ok: false; kind: 'validation'; missingIds: string[] }
  | { ok: false; kind: 'network' | 'server'; message: string }

export function useQuiz(temporadaId: string, tracker?: QuizTracker) {
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<QuizResultado | null>(null)
  const reloadTokenRef = useRef(0)
  const [reloadToken, setReloadToken] = useState(0)

  const totalQuestions = quiz?.questoes?.length ?? 0
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])

  const missingIds = useMemo(() => {
    if (!quiz) return []
    return quiz.questoes.filter(q => !answers[q.id]).map(q => q.id)
  }, [quiz, answers])

  function reset() {
    setAnswers({})
    setResult(null)
  }

  function retryLoad() {
    reloadTokenRef.current++
    setReloadToken(reloadTokenRef.current)
  }

  function selectAnswer(questionId: string, optionId: string) {
    if (result) return
    setAnswers(prev => ({ ...prev, [questionId]: optionId }))
  }

  async function submit(): Promise<SubmitResult> {
    if (!quiz) return { ok: false, kind: 'server', message: 'Prova indisponível' }
    if (missingIds.length > 0) {
      tracker?.validationFailed({ temporadaId, missing: missingIds.length })
      return { ok: false, kind: 'validation', missingIds }
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/universidade/quiz/${temporadaId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respostas: answers }),
      })
      const data = await safeJson(res)
      if (!res.ok) {
        const msg = (data && typeof data.error === 'string' && data.error.trim()) ? data.error : 'Erro ao enviar'
        return { ok: false, kind: 'server', message: msg }
      }

      setResult(data)
      tracker?.submitted({
        temporadaId,
        aprovado: data.aprovado,
        percentual: data.percentual,
        acertos: data.acertos,
        total: data.total,
      })
      return { ok: true, result: data }
    } catch {
      tracker?.loadFailed({ temporadaId, error: 'network' })
      return { ok: false, kind: 'network', message: 'Erro de rede ao enviar' }
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    let didCancel = false
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/universidade/quiz/${temporadaId}`, { signal: controller.signal })
        const data = await safeJson(res)

        if (!res.ok) {
          const msg = (data && typeof data.error === 'string' && data.error.trim()) ? data.error : 'Erro ao carregar prova'
          if (!didCancel) setError(msg)
          tracker?.loadFailed({ temporadaId, status: res.status, error: 'unknown' })
          return
        }

        if (!didCancel) setQuiz(data)
        tracker?.loaded({
          temporadaId,
          totalQuestoes: Array.isArray(data?.questoes) ? data.questoes.length : undefined,
        })
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        if (!didCancel) setError('Erro de rede ao carregar prova')
        tracker?.loadFailed({ temporadaId, error: 'network' })
      } finally {
        if (!didCancel) setLoading(false)
      }
    }

    void load()
    return () => {
      didCancel = true
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temporadaId, tracker, reloadToken])

  return {
    quiz,
    loading,
    error,
    answers,
    submitting,
    result,
    totalQuestions,
    answeredCount,
    missingIds,
    selectAnswer,
    submit,
    reset,
    retryLoad,
  }
}

