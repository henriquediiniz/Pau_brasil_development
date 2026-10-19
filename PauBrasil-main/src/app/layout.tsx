import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, DM_Sans } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  // 800 fica mesmo sem `font-extrabold` no codigo: e para onde os
  // `font-black` (900) dos titulos caem sem o navegador sintetizar.
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
  preload: true,
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  // 700 entra porque `font-bold` aparece 323 vezes no codigo e DM Sans nao
  // carregava esse peso: sem o arquivo, o navegador SINTETIZA o negrito e o
  // traco sai engordado e borrado. 900 (`font-black`, 55 usos) fica de fora
  // de proposito — cair no 700 real e melhor que um 900 falsificado.
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: {
    default: 'Grupo Pau Brasil',
    template: '%s — Grupo Pau Brasil',
  },
  description: 'Portal corporativo do Grupo Pau Brasil. Colaboradores, carreiras e Universidade Pau Brasil.',
  manifest: '/manifest.json',
  openGraph: {
    siteName: 'Grupo Pau Brasil',
    locale: 'pt_BR',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PauBrasil',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#7a1520',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${plusJakarta.variable} ${dmSans.variable}`}>
      <head />
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
