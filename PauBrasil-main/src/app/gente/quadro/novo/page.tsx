'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { FormularioColaborador } from '../_components/FormularioColaborador'

export default function NovoColaboradorPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <Link
          href="/gente/quadro"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Quadro de pessoal
        </Link>
        <h1 className="text-2xl font-display font-bold text-white">Novo colaborador</h1>
        <p className="text-slate-400 text-sm">
          Para carregar o quadro inteiro de uma vez, use a{' '}
          <Link href="/gente/quadro/importar" className="text-brand-400 hover:underline">
            importação de planilha
          </Link>
          .
        </p>
      </div>

      <FormularioColaborador modo="criar" />
    </div>
  )
}
