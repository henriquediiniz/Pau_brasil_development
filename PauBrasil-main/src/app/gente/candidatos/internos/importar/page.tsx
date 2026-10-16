'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ImportadorPlanilha } from '../../../_components/ImportadorPlanilha'

interface Previa {
  linha: number
  nome: string
  cargoAtual: string | null
  cargoPretendido: string | null
}

export default function ImportarInternosPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <Link
          href="/gente/candidatos/internos"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Candidatos Internos
        </Link>
        <h1 className="text-2xl font-display font-bold text-white">Importar candidatos internos</h1>
        <p className="text-slate-400 text-sm">
          A planilha é conferida antes de gravar. Nada entra no sistema sem você aprovar.
        </p>
      </div>

      <ImportadorPlanilha<Previa>
        endpoint="/api/gente/internos/importar"
        destino="/gente/candidatos/internos"
        tipoModelo="internos"
        substantivo={{ singular: 'candidato', plural: 'candidatos' }}
        requisitos={
          <>
            <li><span className="text-slate-400">Obrigatórias:</span> Unidade e Nome.</li>
            <li>
              <span className="text-slate-400">Possui Requisitos</span> aceita SIM, NÃO ou X. Em
              branco vira “não”.
            </li>
            <li>
              <span className="text-slate-400">Futuros Cargos</span> aceita vários, separados por
              ponto e vírgula ou vírgula.
            </li>
            <li>
              <span className="text-slate-400">Situação</span> aceita Aguardando, Promovido, Não
              atende, Desligado ou Outra. Em branco vira Aguardando.
            </li>
          </>
        }
        renderPrevia={(i) => (
          <>
            <span className="text-slate-200 flex-1 truncate">{i.nome}</span>
            <span className="text-slate-500 truncate max-w-[130px]">{i.cargoAtual ?? '—'}</span>
            <span className="text-slate-500 w-32 text-right shrink-0 truncate">
              {i.cargoPretendido ?? '—'}
            </span>
          </>
        )}
      />
    </div>
  )
}
