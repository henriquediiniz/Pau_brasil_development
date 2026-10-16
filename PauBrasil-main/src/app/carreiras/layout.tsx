import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Carreiras — Grupo Pau Brasil',
  description: 'Vagas abertas e banco de talentos do Grupo Pau Brasil. Candidate-se e cresça conosco no Nordeste.',
  openGraph: {
    title: 'Carreiras — Grupo Pau Brasil',
    description: 'Vagas abertas e banco de talentos do Grupo Pau Brasil.',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function CarreirasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
