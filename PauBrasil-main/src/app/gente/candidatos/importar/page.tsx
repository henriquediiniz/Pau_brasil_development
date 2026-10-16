'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ImportadorPlanilha } from '../../_components/ImportadorPlanilha'

interface PreviaCandidato {
  linha: number
  nome: string
  cargo: string | null
  situacao: string
  etapas: number
}

export default function ImportarCandidatosPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <Link
          href="/gente/candidatos"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Candidatos
        </Link>
        <h1 className="text-2xl font-display font-bold text-white">Importar candidatos</h1>
        <p className="text-slate-400 text-sm">
          A planilha é conferida antes de gravar. Nada entra no sistema sem você aprovar.
        </p>
      </div>

      <ImportadorPlanilha<PreviaCandidato>
        endpoint="/api/gente/candidatos/importar"
        destino="/gente/candidatos"
        tipoModelo="candidatos"
        substantivo={{ singular: 'candidato', plural: 'candidatos' }}
        requisitos={
          <>
            <li><span className="text-slate-400">Obrigatórias:</span> Unidade e Nome.</li>
            <li>
              <span className="text-slate-400">A unidade precisa bater</span> com uma operação
              cadastrada, para nenhum candidato entrar sem dono.
            </li>
            <li>
              <span className="text-slate-400">Etapas:</span> as colunas Entrevistado GG, Aprovado
              Gestor, Teste Prático, Teste Direção e Direção Teórico aceitam OK, NÃO e N/A.
            </li>
            <li>
              <span className="text-slate-400">Repetições</span> são detectadas pelo telefone; sem
              telefone, por nome + operação.
            </li>
          </>
        }
        renderPrevia={(c) => (
          <>
            <span className="text-slate-200 flex-1 truncate">{c.nome}</span>
            <span className="text-slate-500 truncate max-w-[120px]">{c.cargo ?? '—'}</span>
            <span className="text-slate-500 w-24 text-right shrink-0">
              {c.etapas} etapa{c.etapas === 1 ? '' : 's'}
            </span>
          </>
        )}
      />
    </div>
  )
}
