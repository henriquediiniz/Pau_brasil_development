'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { FormularioCandidato } from '../_components/FormularioCandidato'

export default function NovoCandidatoPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <Link
          href="/gente/candidatos"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Candidatos
        </Link>
        <h1 className="text-2xl font-display font-bold text-white">Novo candidato</h1>
        <p className="text-slate-400 text-sm">
          Se a pessoa se candidatou pelo site, traga pelo{' '}
          <Link href="/gente/candidatos/do-banco-de-talentos" className="text-brand-400 hover:underline">
            Banco de Talentos
          </Link>{' '}
          — o currículo vem junto.
        </p>
      </div>

      <FormularioCandidato modo="criar" />
    </div>
  )
}
