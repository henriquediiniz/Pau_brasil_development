'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ImportadorPlanilha } from '../../_components/ImportadorPlanilha'
import { DesfazerImportacao } from './_components/DesfazerImportacao'

interface PreviaVaga {
  linha: number
  cargo: string
  unidadeTexto: string
  status: string
}

export default function ImportarVagasPage() {
  // Trocar o numero faz o painel relistar os lotes: depois de importar, o
  // arquivo que acabou de entrar ja aparece la para ser desfeito.
  const [recarregar, setRecarregar] = useState(0)

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <Link
          href="/gente/vagas"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Controle de Vagas
        </Link>
        <h1 className="text-2xl font-display font-bold text-white">Importar vagas</h1>
        <p className="text-slate-400 text-sm">
          A planilha é conferida antes de gravar. Nada entra no sistema sem você aprovar.
        </p>
      </div>

      <ImportadorPlanilha<PreviaVaga>
        endpoint="/api/gente/vagas/importar"
        destino="/gente/vagas"
        tipoModelo="vagas"
        substantivo={{ singular: 'vaga', plural: 'vagas' }}
        requisitos={
          <>
            <li>
              <span className="text-slate-400">Obrigatórias:</span> Unidade, Cargo e Data de Abertura.
            </li>
            <li>
              <span className="text-slate-400">A unidade precisa bater</span> com uma operação
              cadastrada no portal — a linha é recusada se não bater, para nenhuma vaga entrar sem dono.
            </li>
            <li>
              <span className="text-slate-400">Datas</span> podem vir como 12/02/2026, 2026-02-12 ou
              no formato do Excel.
            </li>
            <li>
              <span className="text-slate-400">Cabeçalhos</span> aceitam acento, maiúsculas e nomes
              alternativos (Operação/Unidade/Filial, Função/Cargo, Situação/Status).
            </li>
          </>
        }
        renderPrevia={(v) => (
          <>
            <span className="text-slate-200 flex-1 truncate">{v.cargo}</span>
            <span className="text-slate-500 truncate max-w-[140px]">{v.unidadeTexto}</span>
            <span className="text-slate-500 w-20 text-right shrink-0">{v.status}</span>
          </>
        )}
        onConcluido={() => setRecarregar((n) => n + 1)}
      />

      <DesfazerImportacao recarregar={recarregar} />
    </div>
  )
}
