import { useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, Upload, Loader2 } from 'lucide-react'
import { TaskInstance } from '@/types'

interface EvidenceModalProps {
  isOpen: boolean
  task: TaskInstance | null
  evidenceImage: string | null
  evidenceNote: string
  completing: string | null
  onClose: () => void
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onImageRemove: () => void
  onNoteChange: (note: string) => void
  onSubmit: (task: TaskInstance) => void | Promise<void>
}

export function EvidenceModal({
  isOpen,
  task,
  evidenceImage,
  evidenceNote,
  completing,
  onClose,
  onImageSelect,
  onImageRemove,
  onNoteChange,
  onSubmit
}: EvidenceModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <AnimatePresence>
      {isOpen && task && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#111118] rounded-2xl border border-white/10 p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-display font-bold">Enviar Evidência</h3>
                <p className="text-xs text-slate-500 mt-0.5">{task.taskDefinition?.title}</p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Print / Foto *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onImageSelect}
                  className="hidden"
                />
                {evidenceImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10">
                    <Image
                      src={evidenceImage}
                      alt="Preview"
                      width={800}
                      height={480}
                      unoptimized
                      className="w-full max-h-48 object-contain bg-black/20"
                    />
                    <button
                      onClick={() => {
                        onImageRemove()
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 rounded-xl border-2 border-dashed border-white/15 hover:border-brand-500/40 hover:bg-brand-500/5 flex flex-col items-center justify-center gap-2 transition-[border-color,background-color,color] text-slate-500 hover:text-slate-300"
                  >
                    <Camera className="w-8 h-8" />
                    <span className="text-sm">Clique para selecionar</span>
                    <span className="text-xs opacity-60">PNG, JPG até 5MB</span>
                  </button>
                )}
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Observação (opcional)</label>
                <textarea
                  value={evidenceNote}
                  onChange={e => onNoteChange(e.target.value)}
                  placeholder="Descreva brevemente..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => onSubmit(task)}
                  disabled={!evidenceImage || completing === task.id}
                  className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {completing === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Enviar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
