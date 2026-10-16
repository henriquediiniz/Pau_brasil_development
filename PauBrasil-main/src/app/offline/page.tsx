'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">📡</div>
        <h1 className="text-2xl font-display font-bold text-white mb-3">Sem conexão</h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Você está offline. Verifique sua conexão com a internet e tente novamente.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
