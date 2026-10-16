'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { ChevronLeft, Loader2 } from 'lucide-react'
import {
  FormularioCandidato,
  VALORES_VAZIOS,
  type ValoresCandidato,
} from '../../_components/FormularioCandidato'
import type { OrigemCurriculo, SituacaoCandidato } from '@/lib/gente/candidato'

const fetcher = async (url: string) => {
  const r = await fetch(url)
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? 'Falha ao carregar')
  return r.json()
}

const dia = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '')

interface CandidatoApi {
  id: string
  operacaoId: string | null
  vagaId: string | null
  nome: string
  cargo: string | null
  telefone: string | null
  email: string | null
  mesProcesso: string | null
  setor: 'DPO' | 'SPO' | null
  escolaridade: string | null
  habilidades: string | null
  residencia: string | null
  observacao: string | null
  origemCurriculo: OrigemCurriculo
  quemIndicou: string | null
  situacao: SituacaoCandidato
  situacaoFinal: SituacaoCandidato | null
  dataSituacaoFinal: string | null
}

function paraFormulario(c: CandidatoApi): ValoresCandidato {
  const t = (s: string | null) => s ?? ''

  return {
    ...VALORES_VAZIOS,
    operacaoId: c.operacaoId ?? '',
    vagaId: c.vagaId ?? '',
    nome: c.nome,
    cargo: t(c.cargo),
    telefone: t(c.telefone),
    email: t(c.email),
    mesProcesso: t(c.mesProcesso),
    setor: c.setor ?? '',
    escolaridade: t(c.escolaridade),
    habilidades: t(c.habilidades),
    residencia: t(c.residencia),
    observacao: t(c.observacao),
    origemCurriculo: c.origemCurriculo,
    quemIndicou: t(c.quemIndicou),
    situacao: c.situacao,
    situacaoFinal: c.situacaoFinal ?? '',
    dataSituacaoFinal: dia(c.dataSituacaoFinal),
  }
}

export default function EditarCandidatoPage({ params }: { params: { id: string } }) {
  const { data, error, isLoading } = useSWR<CandidatoApi>(
    `/api/gente/candidatos/${params.id}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <Link
          href="/gente/candidatos"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Candidatos
        </Link>
        <h1 className="text-2xl font-display font-bold text-white">
          {data ? data.nome : 'Editar candidato'}
        </h1>
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
            Candidato não encontrado ou fora do seu escopo de operações.
          </p>
          <Link
            href="/gente/candidatos"
            className="text-slate-400 text-xs hover:text-white underline mt-2 inline-block"
          >
            Voltar para a lista
          </Link>
        </div>
      )}

      {data && (
        <FormularioCandidato modo="editar" candidatoId={data.id} iniciais={paraFormulario(data)} />
      )}
    </div>
  )
}
