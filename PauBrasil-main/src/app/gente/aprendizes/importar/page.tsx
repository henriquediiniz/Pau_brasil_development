'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ImportadorPlanilha } from '../../_components/ImportadorPlanilha'

interface Previa {
  linha: number
  nome: string
  fundacao: string | null
  termino: string | null
}

export default function ImportarAprendizesPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <Link
          href="/gente/aprendizes"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Jovens Aprendizes
        </Link>
        <h1 className="text-2xl font-display font-bold text-white">Importar aprendizes</h1>
        <p className="text-slate-400 text-sm">
          A planilha é conferida antes de gravar. Nada entra no sistema sem você aprovar.
        </p>
      </div>

      <ImportadorPlanilha<Previa>
        endpoint="/api/gente/aprendizes/importar"
        destino="/gente/aprendizes"
        tipoModelo="aprendizes"
        substantivo={{ singular: 'aprendiz', plural: 'aprendizes' }}
        observacaoFinal="Contratos sem data de término não entram no alerta de vencimento. Complete essas datas para o acompanhamento funcionar."
        requisitos={
          <>
            <li><span className="text-slate-400">Obrigatórias:</span> Unidade e Nome.</li>
            <li>
              <span className="text-slate-400">Término do contrato</span> não é obrigatório, mas sem
              ele o aprendiz fica fora do alerta de vencimento — que é o motivo de existir esta tela.
            </li>
            <li>
              <span className="text-slate-400">Situação</span> aceita Vigente, Encerrado ou Desligado.
              Em branco vira Vigente.
            </li>
            <li>
              A <span className="text-slate-400">faixa legal</span> (5% a 15%) é calculada sobre o
              quadro cadastrado em QLP.
            </li>
          </>
        }
        renderPrevia={(a) => (
          <>
            <span className="text-slate-200 flex-1 truncate">{a.nome}</span>
            <span className="text-slate-500 truncate max-w-[120px]">{a.fundacao ?? '—'}</span>
            <span className="text-slate-500 w-24 text-right shrink-0 tabular-nums">
              {a.termino ? a.termino.split('-').reverse().join('/') : 'sem término'}
            </span>
          </>
        )}
      />
    </div>
  )
}
