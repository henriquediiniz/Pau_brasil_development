'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ImportadorPlanilha } from '../../_components/ImportadorPlanilha'

interface PreviaColaborador {
  linha: number
  nome: string
  cargo: string | null
  area: string | null
}

export default function ImportarQuadroPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <Link
          href="/gente/quadro"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Quadro de pessoal
        </Link>
        <h1 className="text-2xl font-display font-bold text-white">Importar quadro (QLP)</h1>
        <p className="text-slate-400 text-sm">
          A planilha é conferida antes de gravar. Nada entra no sistema sem você aprovar.
        </p>
      </div>

      <ImportadorPlanilha<PreviaColaborador>
        endpoint="/api/gente/quadro/importar"
        destino="/gente/quadro"
        tipoModelo="quadro"
        substantivo={{ singular: 'colaborador', plural: 'colaboradores' }}
        requisitos={
          <>
            <li><span className="text-slate-400">Obrigatórias:</span> Unidade e Nome.</li>
            <li>
              <span className="text-slate-400">A unidade precisa bater</span> com uma operação
              cadastrada no portal.
            </li>
            <li>
              <span className="text-slate-400">Cabeçalhos</span> aceitam variações: Nome/Colaborador/
              Funcionário, Cargo/Função, Área.
            </li>
            <li>
              <span className="text-slate-400">Repetições</span> são detectadas por nome + operação —
              a mesma pessoa em operações diferentes entra duas vezes.
            </li>
            <li>
              Todo mundo entra como <span className="text-slate-400">ativo</span>. Quem já saiu deve
              ir pela importação de desligamentos.
            </li>
          </>
        }
        renderPrevia={(c) => (
          <>
            <span className="text-slate-200 flex-1 truncate">{c.nome}</span>
            <span className="text-slate-500 truncate max-w-[140px]">{c.cargo ?? '—'}</span>
            <span className="text-slate-500 w-28 text-right shrink-0 truncate">{c.area ?? '—'}</span>
          </>
        )}
      />
    </div>
  )
}
