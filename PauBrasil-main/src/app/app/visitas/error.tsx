'use client'

import { MapPin } from 'lucide-react'

export default function VisitasError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <MapPin className="w-6 h-6 text-red-400" />
      </div>
      <p className="text-white font-medium">Erro ao carregar visitas</p>
      <p className="text-slate-500 text-sm max-w-xs">{error.message || 'Tente novamente em instantes.'}</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-400 text-sm font-medium hover:bg-brand-500/30 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  )
}
