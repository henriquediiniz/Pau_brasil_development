'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ImportadorPlanilha } from '../../_components/ImportadorPlanilha'

interface Previa {
  linha: number
  nome: string
  funcao: string | null
  deficiencia: string | null
}

export default function ImportarPcdPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <Link
          href="/gente/pcd"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Gestão PCD
        </Link>
        <h1 className="text-2xl font-display font-bold text-white">Importar colaboradores PCD</h1>
        <p className="text-slate-400 text-sm">
          A planilha é conferida antes de gravar. Nada entra no sistema sem você aprovar.
        </p>
      </div>

      <ImportadorPlanilha<Previa>
        endpoint="/api/gente/pcd/importar"
        destino="/gente/pcd"
        tipoModelo="pcd"
        substantivo={{ singular: 'colaborador', plural: 'colaboradores' }}
        observacaoFinal="Os laudos não vêm pela planilha. Anexe cada um pela lista — é dado de saúde e trafega separado do cadastro."
        requisitos={
          <>
            <li><span className="text-slate-400">Obrigatórias:</span> Unidade e Nome.</li>
            <li>
              <span className="text-slate-400">O laudo não vem aqui.</span> Ele é dado de saúde:
              anexe registro a registro, pela lista, e cada abertura fica auditada.
            </li>
            <li>
              <span className="text-slate-400">Tipo de deficiência</span> não é obrigatório, mas sem
              ele o relatório de cota fica incompleto.
            </li>
            <li>
              A <span className="text-slate-400">cota legal</span> é calculada sobre o quadro
              cadastrado em QLP — importe o quadro antes para o número fazer sentido.
            </li>
          </>
        }
        renderPrevia={(p) => (
          <>
            <span className="text-slate-200 flex-1 truncate">{p.nome}</span>
            <span className="text-slate-500 truncate max-w-[140px]">{p.funcao ?? '—'}</span>
            <span className="text-slate-500 w-32 text-right shrink-0 truncate">
              {p.deficiencia ?? '—'}
            </span>
          </>
        )}
      />
    </div>
  )
}
