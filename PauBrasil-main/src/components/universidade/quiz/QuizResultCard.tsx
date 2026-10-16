'use client'

import type { RefObject } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Award, RotateCcw, XCircle } from 'lucide-react'
import type { QuizResultado } from '@/hooks/universidade/useQuiz'

export function QuizResultCard({
  resultado,
  onRetry,
  resultHeadingRef,
}: {
  resultado: QuizResultado
  onRetry: () => void
  resultHeadingRef: RefObject<HTMLHeadingElement>
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl border p-6 text-center space-y-4
        ${resultado.aprovado ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}
    >
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto
          ${resultado.aprovado ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}
      >
        {resultado.aprovado
          ? <Award className="w-8 h-8 text-emerald-400" aria-hidden="true" />
          : <XCircle className="w-8 h-8 text-red-400" aria-hidden="true" />}
      </div>

      <div>
        <h2 ref={resultHeadingRef} tabIndex={-1} className="sr-only">
          Resultado da prova
        </h2>
        <p className={`text-2xl font-display font-bold ${resultado.aprovado ? 'text-emerald-400' : 'text-red-400'}`}>
          {resultado.percentual}%
        </p>
        <p className="text-slate-300 text-sm mt-1">
          {resultado.acertos} de {resultado.total} acertos
        </p>
      </div>

      {resultado.aprovado ? (
        <div className="space-y-2">
          <p className="text-emerald-300 font-medium">Parabéns! Você foi aprovado!</p>
          <p className="text-slate-400 text-sm">Seu certificado foi emitido.</p>
          <div className="flex gap-3 justify-center mt-3">
            <Link
              href="/universidade/certificados"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20"
            >
              <Award className="w-4 h-4" aria-hidden="true" /> Ver certificados
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-red-300 font-medium">Você precisa de 80% para ser aprovado.</p>
          <p className="text-slate-400 text-sm">Revise o conteúdo e tente novamente.</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 transition-colors mt-2"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" /> Tentar novamente
          </button>
        </div>
      )}
    </motion.div>
  )
}

