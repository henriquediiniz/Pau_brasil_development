'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={false}>
        {children}
        <Toaster />
      </SessionProvider>
    </ThemeProvider>
  )
}
