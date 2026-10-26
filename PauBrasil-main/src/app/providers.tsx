'use client'

import { useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'

/** Registra o service worker (push e página offline). Fora de produção não registra, para não cachear o dev. */
function useServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch((error) => console.error('[sw] registro falhou', error))
  }, [])
}

export function Providers({ children }: { children: React.ReactNode }) {
  useServiceWorker()
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={false}>
        {children}
        <Toaster />
      </SessionProvider>
    </ThemeProvider>
  )
}
