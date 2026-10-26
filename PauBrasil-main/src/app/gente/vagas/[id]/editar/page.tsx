'use client';
import { use } from "react";

import Link from 'next/link'
import useSWR from 'swr'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { FormularioVaga, VALORES_VAZIOS, type ValoresVaga } from '../../_components/FormularioVaga'
import type { RecStatusFechamentoValue } from '@/lib/gente/vaga-sla'

const fetcher = async (url: string) => {
  const r = await fetch(url)
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? 'Falha ao carregar')
  return r.json()
}

/** `2026-02-12T00:00:00.000Z` → `2026-02-12`, que é o que o input date espera. */
const dia = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '')

interface VagaApi {
  id: string
  operacaoId: string | null
  cargo: string
  cargoId: string | null
  area: string | null
  departamento: 'DPO' | 'SPO' | null
  quantidadeVagas: number
  salario?: number | null
  codigo: string | null
  frontline: string | null
  dataAbertura: string
  dataPrevistaFechamento: string | null
  dataContratacao: string | null
  encerradaEm: string | null
  status: 'ABERTA' | 'FECHADA' | 'CANCELADA'
  statusFechamentoManual: RecStatusFechamentoValue | null
  nomeContratado: string | null
  motivoSolicitacao: string | null
  colaboradorAnterior: string | null
  dataDesligamento: string | null
  responsavelVaga: string | null
  solicitanteVaga: string | null
  requisitosMinimos: string | null
  formacao: string | null
  localTrabalho: string | null
  horario: string | null
  informacoesComplementares: string | null
  andamentoProcesso: string | null
}

function paraFormulario(v: VagaApi): ValoresVaga {
  const t = (s: string | null) => s ?? ''

  return {
    ...VALORES_VAZIOS,
    operacaoId: v.operacaoId ?? '',
    cargo: v.cargo,
    cargoId: v.cargoId ?? '',
    area: t(v.area),
    departamento: v.departamento ?? '',
    quantidadeVagas: String(v.quantidadeVagas),
    salario: v.salario === null || v.salario === undefined ? '' : String(v.salario),
    codigo: t(v.codigo),
    frontline: t(v.frontline),
    dataAbertura: dia(v.dataAbertura),
    dataPrevistaFechamento: dia(v.dataPrevistaFechamento),
    dataContratacao: dia(v.dataContratacao),
    encerradaEm: dia(v.encerradaEm),
    status: v.status,
    statusFechamentoManual: v.statusFechamentoManual ?? '',
    nomeContratado: t(v.nomeContratado),
    motivoSolicitacao: t(v.motivoSolicitacao),
    colaboradorAnterior: t(v.colaboradorAnterior),
    dataDesligamento: dia(v.dataDesligamento),
    responsavelVaga: t(v.responsavelVaga),
    solicitanteVaga: t(v.solicitanteVaga),
    requisitosMinimos: t(v.requisitosMinimos),
    formacao: t(v.formacao),
    localTrabalho: t(v.localTrabalho),
    horario: t(v.horario),
    informacoesComplementares: t(v.informacoesComplementares),
    andamentoProcesso: t(v.andamentoProcesso),
  }
}

export default function EditarVagaPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const { data, error, isLoading } = useSWR<VagaApi>(
    `/api/gente/vagas/${params.id}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <Link
          href="/gente/vagas"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Controle de Vagas
        </Link>
        <h1 className="text-2xl font-display font-bold text-white">
          {data ? data.cargo : 'Editar vaga'}
        </h1>
        <p className="text-slate-400 text-sm">
          Mudar o status para Fechada exige a data de contratação — é ela que define o prazo.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-16 justify-center text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando…
        </div>
      )}

      {error && (
        <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20">
          <p className="text-red-400 text-sm">
            Vaga não encontrada ou fora do seu escopo de operações.
          </p>
          <Link href="/gente/vagas" className="text-slate-400 text-xs hover:text-white underline mt-2 inline-block">
            Voltar para a lista
          </Link>
        </div>
      )}

      {data && (
        <FormularioVaga
          modo="editar"
          vagaId={data.id}
          iniciais={paraFormulario(data)}
          // A API omite `salario` de quem não pode vê-lo; nesse caso o campo
          // não aparece e também não é enviado no PATCH, para não apagar o valor.
          mostrarSalario={'salario' in data}
        />
      )}
    </div>
  )
}
