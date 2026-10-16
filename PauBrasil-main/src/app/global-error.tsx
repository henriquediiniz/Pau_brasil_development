'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center space-y-4 p-8 max-w-md">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-white font-bold text-lg">Algo deu errado</h2>
          <p className="text-slate-400 text-sm">
            O erro foi registrado automaticamente. Tente novamente ou entre em contato com o suporte.
          </p>
          {error.digest && (
            <p className="text-slate-600 text-xs font-mono">ID: {error.digest}</p>
          )}
          <button
            onClick={reset}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-medium transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
