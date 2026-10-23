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

  // Estilos inline: este componente substitui o layout raiz, então não conta com o CSS global.
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#faf9f6', color: '#1a1a1a', fontFamily: 'Montserrat, Arial, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: 32, maxWidth: 420 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: '0.17em', textTransform: 'uppercase', color: '#7a1520' }}>Grupo Pau Brasil</p>
          <h2 style={{ margin: '16px 0 10px', fontSize: 28, fontWeight: 600, letterSpacing: '-0.04em' }}>Algo deu errado.</h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#6f5c4e' }}>
            O erro foi registrado automaticamente. Tente novamente ou entre em contato com o suporte.
          </p>
          {error.digest && (
            <p style={{ margin: '12px 0 0', fontSize: 12, color: '#6f5c4e', fontFamily: 'monospace' }}>ID: {error.digest}</p>
          )}
          <button
            onClick={reset}
            style={{ marginTop: 26, padding: '14px 22px', border: 0, borderRadius: 3, background: '#7a1520', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
