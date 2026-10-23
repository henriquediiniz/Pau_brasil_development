'use client'

import { WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="tema-claro min-h-screen bg-[#faf9f6] text-[#1a1a1a] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <span className="mx-auto mb-6 w-16 h-16 rounded-full bg-[#7a1520]/[0.07] border border-[#7a1520]/25 flex items-center justify-center text-[#7a1520]">
          <WifiOff className="w-7 h-7" />
        </span>
        <h1 className="text-[28px] font-semibold tracking-[-0.04em] mb-3">Sem conexão</h1>
        <p className="text-[#6f5c4e] text-sm leading-relaxed">
          Você está offline. Verifique sua conexão com a internet e tente novamente.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-3 rounded-[3px] bg-[#7a1520] hover:bg-[#941d2b] text-white text-sm font-semibold transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
