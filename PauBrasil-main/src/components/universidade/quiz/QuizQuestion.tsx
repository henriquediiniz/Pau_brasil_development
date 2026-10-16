'use client'

import type { RefCallback } from 'react'
import type { QuizQuestao } from '@/hooks/universidade/useQuiz'

export function QuizQuestion({
  question,
  index,
  selectedOptionId,
  disabled,
  onSelect,
  firstInputRef,
}: {
  question: QuizQuestao
  index: number
  selectedOptionId?: string
  disabled?: boolean
  onSelect: (questionId: string, optionId: string) => void
  firstInputRef?: RefCallback<HTMLInputElement>
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-white font-medium">
        <span className="text-slate-500 mr-2">{index + 1}.</span>{question.enunciado}
      </legend>

      <div className="space-y-2">
        {question.opcoes.map((op, oi) => {
          const selected = selectedOptionId === op.id
          const inputId = `${question.id}:${op.id}`
          return (
            <label
              key={op.id}
              htmlFor={inputId}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all cursor-pointer block
                ${selected
                  ? 'bg-brand-500/15 border-brand-500/50 text-brand-300'
                  : 'bg-white/3 border-white/8 text-slate-300 hover:bg-white/6 hover:border-white/15'}
                ${disabled ? 'opacity-60 cursor-not-allowed hover:bg-white/3 hover:border-white/8' : ''}`}
            >
              <input
                id={inputId}
                ref={oi === 0 ? firstInputRef : undefined}
                className="sr-only"
                type="radio"
                name={`questao:${question.id}`}
                value={op.id}
                checked={selected}
                disabled={disabled}
                onChange={() => onSelect(question.id, op.id)}
              />

              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center
                    ${selected ? 'border-brand-400 bg-brand-500/30' : 'border-slate-600'}`}
                  aria-hidden="true"
                >
                  {selected && <div className="w-2 h-2 rounded-full bg-brand-400" />}
                </div>
                {op.texto}
              </div>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

