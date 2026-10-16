'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ImportadorPlanilha } from '../../_components/ImportadorPlanilha'

interface PreviaDesligamento {
  linha: number
  nome: string
  cargo: string | null
  data: string
}

export default function ImportarDesligamentosPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <Link
          href="/gente/desligamentos"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Desligamentos
        </Link>
        <h1 className="text-2xl font-display font-bold text-white">Importar desligamentos</h1>
        <p className="text-slate-400 text-sm">
          A planilha é conferida antes de gravar. Nada entra no sistema sem você aprovar.
        </p>
      </div>

      <ImportadorPlanilha<PreviaDesligamento>
        endpoint="/api/gente/desligamentos/importar"
        destino="/gente/desligamentos"
        tipoModelo="desligamentos"
        substantivo={{ singular: 'desligamento', plural: 'desligamentos' }}
        observacaoFinal="O quadro de lotação não foi alterado. Se alguém da planilha ainda aparece como ativo no QLP, desligue pela tela do quadro — assim as duas pontas ficam coerentes."
        requisitos={
          <>
            <li>
              <span className="text-slate-400">Obrigatórias:</span> Unidade, Nome e Data de
              desligamento.
            </li>
            <li>
              <span className="text-slate-400">A data é o que faz o registro existir</span> — sem ela
              a linha é recusada.
            </li>
            <li>
              <span className="text-slate-400">Datas</span> podem vir como 14/06/2026, 2026-06-14 ou
              no formato do Excel.
            </li>
            <li>
              <span className="text-slate-400">Recontratação:</span> a mesma pessoa com datas
              diferentes entra duas vezes, de propósito.
            </li>
            <li>
              Importar aqui <span className="text-slate-400">não dá baixa no quadro de lotação</span>,
              porque esta planilha costuma trazer histórico antigo.
            </li>
          </>
        }
        renderPrevia={(d) => (
          <>
            <span className="text-slate-200 flex-1 truncate">{d.nome}</span>
            <span className="text-slate-500 truncate max-w-[140px]">{d.cargo ?? '—'}</span>
            <span className="text-slate-500 w-24 text-right shrink-0 tabular-nums">
              {d.data.split('-').reverse().join('/')}
            </span>
          </>
        )}
      />
    </div>
  )
}
