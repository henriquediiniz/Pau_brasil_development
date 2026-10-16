'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { FormularioSimples, type SecaoCampos } from './FormularioSimples'

const fetcher = async (url: string) => {
  const r = await fetch(url)
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? 'Falha ao carregar')
  return r.json()
}

/** `2026-02-12T00:00:00.000Z` → `2026-02-12`, que é o que o input date espera. */
const dia = (iso: unknown) => (typeof iso === 'string' ? iso.slice(0, 10) : '')

interface Props {
  modo: 'criar' | 'editar'
  id?: string
  titulo: string
  subtitulo?: string
  voltarPara: string
  voltarLabel: string
  endpoint: string
  secoes: SecaoCampos[]
  valoresVazios: Record<string, string>
  /** Campos que são data, para converter o ISO da API no formato do input. */
  camposData?: string[]
  validar?: (valores: Record<string, string>) => Record<string, string>
  rotuloCriar?: string
}

/**
 * Casca das telas de cadastro simples: cabeçalho, carregamento do registro na
 * edição e o formulário declarativo. Evita repetir o mesmo esqueleto em cada
 * entidade do módulo.
 */
export function PaginaCadastro({
  modo,
  id,
  titulo,
  subtitulo,
  voltarPara,
  voltarLabel,
  endpoint,
  secoes,
  valoresVazios,
  camposData = [],
  validar,
  rotuloCriar,
}: Props) {
  const { data, error, isLoading } = useSWR<Record<string, unknown>>(
    modo === 'editar' && id ? `${endpoint}/${id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const iniciais =
    modo === 'criar'
      ? valoresVazios
      : data
      ? Object.fromEntries(
          Object.keys(valoresVazios).map((campo) => {
            const bruto = data[campo]
            if (camposData.includes(campo)) return [campo, dia(bruto)]
            if (typeof bruto === 'boolean') return [campo, String(bruto)]
            return [campo, bruto === null || bruto === undefined ? '' : String(bruto)]
          })
        )
      : null

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <Link
          href={voltarPara}
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          {voltarLabel}
        </Link>
        <h1 className="text-2xl font-display font-bold text-white">
          {modo === 'editar' && typeof data?.nome === 'string' ? data.nome : titulo}
        </h1>
        {subtitulo && <p className="text-slate-400 text-sm">{subtitulo}</p>}
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
            Registro não encontrado ou fora do seu escopo de operações.
          </p>
          <Link
            href={voltarPara}
            className="text-slate-400 text-xs hover:text-white underline mt-2 inline-block"
          >
            Voltar para a lista
          </Link>
        </div>
      )}

      {iniciais && (
        <FormularioSimples
          modo={modo}
          id={id}
          endpoint={endpoint}
          destino={voltarPara}
          secoes={secoes}
          iniciais={iniciais}
          validar={validar}
          rotuloCriar={rotuloCriar}
        />
      )}
    </div>
  )
}
