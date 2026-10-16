'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { ChevronLeft } from 'lucide-react'
import { FormularioVaga, VALORES_VAZIOS, type ValoresVaga } from '../_components/FormularioVaga'
import type { CargoOpcao } from '../_components/SeletorCargo'

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Falha ao carregar')
    return r.json()
  })

export default function NovaVagaPage() {
  return (
    /*
      useSearchParams exige Suspense no App Router. O fallback tem que ser
      estatico: usar o proprio Conteudo ali dentro nao resolve nada, porque o
      fallback tambem leria a query — foi o que o build acusou.
    */
    <Suspense fallback={<Esqueleto />}>
      <Conteudo />
    </Suspense>
  )
}

function Esqueleto() {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="h-16 rounded-2xl bg-white/3 border border-white/8 animate-pulse" />
      <div className="h-64 rounded-2xl bg-white/3 border border-white/8 animate-pulse" />
    </div>
  )
}

/**
 * Abre a vaga já vinculada ao descritivo quando vem de `?cargoId=`.
 *
 * É o caminho a partir da tela de Descritivos: o RH está olhando o cargo e
 * abre a vaga dali, sem redigitar o que já está cadastrado. O formulário
 * continua acessível vazio, para quem chega pelo Controle de Vagas.
 */
function Conteudo() {
  const params = useSearchParams()
  const cargoId = params?.get('cargoId') ?? ''

  const { data, isLoading } = useSWR<{ items: CargoOpcao[] }>(
    cargoId ? '/api/gente/cargos' : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const descritivo = data?.items.find((c) => c.id === cargoId)

  const iniciais: ValoresVaga | undefined = descritivo
    ? {
        ...VALORES_VAZIOS,
        cargo: descritivo.cargo,
        cargoId: descritivo.id,
        area: descritivo.area,
        requisitosMinimos: descritivo.exigencias ?? '',
        formacao: [descritivo.formacao, descritivo.statusCurso, descritivo.curso]
          .filter(Boolean)
          .join(' · '),
      }
    : undefined

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <Link
          href={cargoId ? '/gente/cargos' : '/gente/vagas'}
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          {cargoId ? 'Descritivos de Cargo' : 'Controle de Vagas'}
        </Link>
        <h1 className="text-2xl font-display font-bold text-white">
          {descritivo ? `Nova vaga — ${descritivo.cargo}` : 'Nova vaga'}
        </h1>
        <p className="text-slate-400 text-sm">
          {descritivo
            ? 'Área, requisitos e formação vieram do descritivo. Ajuste o que for específico desta vaga.'
            : 'O prazo e os dias em aberto são calculados automaticamente a partir das datas.'}
        </p>
      </div>

      {/*
        Enquanto o descritivo não chega, o formulário não é montado: montá-lo
        vazio e trocar os valores depois faria o RH ver campos piscando e
        perderia o que ele já tivesse digitado.
      */}
      {cargoId && isLoading ? (
        <div className="h-64 rounded-2xl bg-white/3 border border-white/8 animate-pulse" />
      ) : (
        <FormularioVaga modo="criar" iniciais={iniciais} />
      )}
    </div>
  )
}
