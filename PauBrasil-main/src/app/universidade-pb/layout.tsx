import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Universidade Pau Brasil',
  description: 'Conteúdo exclusivo para colaboradores do Grupo Pau Brasil.',
}

export default function UniversidadePBLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-white">
      {children}
    </div>
  )
}
