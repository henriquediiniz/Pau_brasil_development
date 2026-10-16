'use client'

import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageSquarePlus, Star, Plus, Loader2 } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface AdhocFormData {
  title: string
  desc: string
  points: number
}

interface AdhocModalProps {
  isOpen: boolean
  formData: AdhocFormData
  isSubmitting: boolean
  onClose: () => void
  onFormChange: (field: keyof AdhocFormData, value: string | number) => void
  onSubmit: () => void
}

export function AdhocModal({
  isOpen,
  formData,
  isSubmitting,
  onClose,
  onFormChange,
  onSubmit
}: AdhocModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  useFocusTrap(containerRef, isOpen, onClose)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Nova Atividade"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#111118] rounded-2xl border border-white/10 p-6 max-w-sm w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-white font-display font-bold text-lg">Nova Atividade</h3>
              </div>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-indigo-400/80 bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10 mb-2">
                Use para registrar demandas que surgiram no dia e não estavam no checklist. O gestor validará a pontuação.
              </p>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">O que você fez? *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => onFormChange('title', e.target.value)}
                  placeholder="Ex: Reunião extra com fornecedor"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/50"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Detalhes (opcional)</label>
                <textarea
                  value={formData.desc}
                  onChange={e => onFormChange('desc', e.target.value)}
                  placeholder="Descreva brevemente o resultado..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5 flex items-center justify-between">
                  Sugestão de Pontos
                  <span className="text-[10px] text-slate-500 font-normal italic">sujeito a revisão</span>
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    value={formData.points || ''}
                    onChange={e => onFormChange('points', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <Star className="absolute left-3.5 top-3 w-4 h-4 text-indigo-500/60 group-focus-within:text-indigo-400 transition-colors" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 text-sm font-medium hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={onSubmit}
                  disabled={!formData.title || isSubmitting}
                  className="flex-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Criar e Finalizar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
