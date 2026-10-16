'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ImportadorPlanilha } from '../../_components/ImportadorPlanilha'

interface Previa {
  linha: number
  cargo: string
  sucessor: string
  pronto: string
}

export default function ImportarSucessaoPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <Link
          href="/gente/sucessao"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Pipeline de Sucessão
        </Link>
        <h1 className="text-2xl font-display font-bold text-white">Importar pipeline de sucessão</h1>
        <p className="text-slate-400 text-sm">
          A planilha é conferida antes de gravar. Nada entra no sistema sem você aprovar.
        </p>
      </div>

      <ImportadorPlanilha<Previa>
        endpoint="/api/gente/sucessao/importar"
        destino="/gente/sucessao"
        tipoModelo="sucessao"
        substantivo={{ singular: 'mapeamento', plural: 'mapeamentos' }}
        requisitos={
          <>
            <li>
              <span className="text-slate-400">Obrigatórias:</span> Unidade, Cargo de Sucessão e Nome
              do Sucessor.
            </li>
            <li>
              <span className="text-slate-400">Prontidão</span> vem em três colunas (agora, 1 ano, 2
              anos) e aceita SIM, NÃO ou X. O sistema toma sempre o prazo mais próximo marcado.
            </li>
            <li>
              <span className="text-slate-400">Repetição</span> é o mesmo sucessor para o mesmo cargo
              — a mesma pessoa em cargos diferentes entra várias vezes, de propósito.
            </li>
            <li>
              Um cargo sem ninguém pronto agora nem em 1 ano entra como{' '}
              <span className="text-slate-400">cargo em risco</span>.
            </li>
          </>
        }
        renderPrevia={(s) => (
          <>
            <span className="text-slate-200 flex-1 truncate">{s.cargo}</span>
            <span className="text-slate-500 truncate max-w-[140px]">{s.sucessor}</span>
            <span className="text-slate-500 w-20 text-right shrink-0">{s.pronto}</span>
          </>
        )}
      />
    </div>
  )
}
