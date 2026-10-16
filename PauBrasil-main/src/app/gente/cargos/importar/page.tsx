'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ImportadorPlanilha } from '../../_components/ImportadorPlanilha'

interface PreviaCargo {
  linha: number
  cargo: string
  area: string
  tipoVaga: string | null
  /** Já existe um descritivo com este cargo e área — será atualizado. */
  existente: boolean
}

export default function ImportarCargosPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <Link
          href="/gente/cargos"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Descrição de cargos
        </Link>
        <h1 className="text-2xl font-display font-bold text-white">Importar descrição de cargos</h1>
        <p className="text-slate-400 text-sm">
          A planilha é conferida antes de gravar. Nada entra no sistema sem você aprovar.
        </p>
      </div>

      <ImportadorPlanilha<PreviaCargo>
        endpoint="/api/gente/cargos/importar"
        destino="/gente/cargos"
        tipoModelo="cargos"
        substantivo={{ singular: 'descritivo', plural: 'descritivos' }}
        requisitos={
          <>
            <li>
              <span className="text-slate-400">Obrigatórias:</span> Cargo e Área. As demais colunas
              entram como vierem.
            </li>
            <li>
              <span className="text-slate-400">Reimportar atualiza.</span> Cargo + Área identificam o
              descritivo: mandar a planilha de novo corrige o que já existe, em vez de duplicar.
            </li>
            <li>
              <span className="text-slate-400">Sem coluna de unidade</span> — o descritivo é da
              empresa. O padrão de um cargo não muda entre Patos e Sumé.
            </li>
            <li>
              <span className="text-slate-400">Textos multilinha</span> (competências, etapas,
              testes) são preservados linha a linha.
            </li>
            <li>
              <span className="text-slate-400">&quot;N/A&quot; e &quot;NA&quot;</span> viram campo
              vazio — são preenchimento, não conteúdo do descritivo.
            </li>
            <li>
              O cabeçalho pode estar na segunda linha, abaixo das faixas
              &quot;Sobre a Vaga&quot; e &quot;Requisitos e Qualificações&quot;. O sistema procura a
              linha certa.
            </li>
          </>
        }
        renderPrevia={(c) => (
          <>
            <span className="text-slate-200 flex-1 truncate">{c.cargo}</span>
            <span className="text-slate-500 truncate max-w-[140px]">{c.area}</span>
            <span
              className={`w-24 text-right shrink-0 text-[11px] ${
                c.existente ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {c.existente ? 'atualiza' : 'novo'}
            </span>
          </>
        )}
      />
    </div>
  )
}
