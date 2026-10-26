'use client'

import { useMemo, useRef, useState, use } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics'
import { createQuizTracker } from '@/lib/quiz-tracker'
import { useQuiz } from '@/hooks/universidade/useQuiz'
import { QuizQuestion } from '@/components/universidade/quiz/QuizQuestion'
import { QuizResultCard } from '@/components/universidade/quiz/QuizResultCard'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Loader2, AlertTriangle, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/toaster'

export default function QuizPage(props: { params: Promise<{ temporadaId: string }> }) {
  const params = use(props.params);
  const { track } = useAnalytics()
  const quizTracker = useMemo(() => createQuizTracker(track), [track])
  const [validationMessage, setValidationMessage] = useState<string | null>(null)
  const firstChoiceRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const resultHeadingRef = useRef<HTMLHeadingElement | null>(null)

  const {
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
  } = useQuiz(params.temporadaId, quizTracker)

  function onSelect(questaoId: string, opcaoId: string) {
    setValidationMessage(null)
    selectAnswer(questaoId, opcaoId)
  }

  async function enviar() {
    if (!quiz) return
    if (missingIds.length > 0) {
      const msg = `Responda todas as questões (faltam ${missingIds.length})`
      setValidationMessage(msg)
      toast({ title: msg, variant: 'destructive' })
      const firstMissingId = missingIds[0]
      if (firstMissingId) firstChoiceRefs.current[firstMissingId]?.focus()
      return
    }
    const r = await submit()
    if (!r.ok) {
      if (r.kind === 'validation') {
        const firstMissingId = r.missingIds[0]
        if (firstMissingId) firstChoiceRefs.current[firstMissingId]?.focus()
        return
      }
      toast({ title: r.message || 'Erro ao enviar', variant: 'destructive' })
      return
    }
    setTimeout(() => resultHeadingRef.current?.focus(), 0)
  }

  function reiniciar() {
    setValidationMessage(null)
    reset()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64" role="status" aria-live="polite">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" aria-hidden="true" />
      <span className="sr-only">Carregando prova</span>
    </div>
  )

  if (error) return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/universidade/${params.temporadaId}`} className="text-slate-500 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          <span className="sr-only">Voltar</span>
        </Link>
        <h1 className="text-xl font-display font-bold text-white">Prova Final</h1>
      </div>
      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-6 text-center space-y-3" role="alert">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" aria-hidden="true" />
        <p className="text-amber-300 font-medium">{error}</p>
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            onClick={() => retryLoad()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" /> Tentar novamente
          </button>
          <Link href={`/universidade/${params.temporadaId}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Voltar ao curso
          </Link>
        </div>
      </div>
    </div>
  )

  const progressText = `${answeredCount}/${totalQuestions} respondidas`

  if (!quiz) return null

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Link href={`/universidade/${params.temporadaId}`} className="text-slate-500 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          <span className="sr-only">Voltar ao curso</span>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-white">Prova Final</h1>
          <p className="text-slate-500 text-sm">{quiz.titulo}</p>
        </div>
        {!result && (
          <span className="text-xs text-slate-500 font-medium" aria-live="polite">
            {progressText}
          </span>
        )}
      </motion.div>

      {/* Resultado */}
      <AnimatePresence>
        {result && (
          <QuizResultCard resultado={result} onRetry={reiniciar} resultHeadingRef={resultHeadingRef} />
        )}
      </AnimatePresence>

      {/* Questões */}
      {!result && (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void enviar() }}>
          {validationMessage && (
            <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {validationMessage}
            </div>
          )}
          {quiz.questoes.map((q, qi) => (
            <motion.div key={q.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.04 }}
              className="rounded-2xl bg-white/3 border border-white/8 p-5 space-y-3">
              <QuizQuestion
                question={q}
                index={qi}
                selectedOptionId={answers[q.id]}
                disabled={submitting}
                onSelect={onSelect}
                firstInputRef={(el) => { firstChoiceRefs.current[q.id] = el }}
              />
            </motion.div>
          ))}

          <button type="submit" disabled={submitting || answeredCount < totalQuestions}
            className="w-full py-3.5 rounded-xl gradient-brand text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <span className="w-4 h-4" aria-hidden="true" />}
            {answeredCount < totalQuestions ? `Responda todas as questões (${totalQuestions - answeredCount} faltando)` : 'Enviar respostas'}
          </button>
        </form>
      )}
    </div>
  )
}
