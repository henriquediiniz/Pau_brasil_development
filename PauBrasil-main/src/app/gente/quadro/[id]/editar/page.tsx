'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { ChevronLeft, Loader2 } from 'lucide-react'
import {
  FormularioColaborador,
  VALORES_VAZIOS,
  type ValoresColaborador,
} from '../../_components/FormularioColaborador'

const fetcher = async (url: string) => {
  const r = await fetch(url)
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? 'Falha ao carregar')
  return r.json()
}

interface ColaboradorApi {
  id: string
  operacaoId: string | null
  nome: string
  cargo: string | null
  area: string | null
  matricula: string | null
  cpf: string | null
  dataAdmissao: string | null
  ativo: boolean
}

export default function EditarColaboradorPage({ params }: { params: { id: string } }) {
  const { data, error, isLoading } = useSWR<ColaboradorApi>(
    `/api/gente/quadro/${params.id}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const iniciais: ValoresColaborador | undefined = data
    ? {
        ...VALORES_VAZIOS,
        operacaoId: data.operacaoId ?? '',
        nome: data.nome,
        cargo: data.cargo ?? '',
        area: data.area ?? '',
        matricula: data.matricula ?? '',
        cpf: data.cpf ?? '',
        // A data vem ISO completa; o input[type=date] só aceita AAAA-MM-DD.
        dataAdmissao: data.dataAdmissao ? data.dataAdmissao.slice(0, 10) : '',
        ativo: data.ativo,
      }
    : undefined

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <Link
          href="/gente/quadro"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Quadro de pessoal
        </Link>
        <h1 className="text-2xl font-display font-bold text-white">
          {data ? data.nome : 'Editar colaborador'}
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
            Colaborador não encontrado ou fora do seu escopo de operações.
          </p>
          <Link
            href="/gente/quadro"
            className="text-slate-400 text-xs hover:text-white underline mt-2 inline-block"
          >
            Voltar para a lista
          </Link>
        </div>
      )}

      {data && iniciais && (
        <FormularioColaborador modo="editar" colaboradorId={data.id} iniciais={iniciais} />
      )}
    </div>
  )
}
