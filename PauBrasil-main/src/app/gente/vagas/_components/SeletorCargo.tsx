'use client'

import { useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { Check, ChevronDown, FileText, PenLine, Search, X } from 'lucide-react'

/**
 * Escolha do cargo da vaga a partir dos descritivos cadastrados.
 *
 * Antes era um campo de texto livre. Como todo o resto do módulo liga vaga e
 * descritivo **pelo nome digitado** — o verificador de aderência, o cruzamento
 * do Frontline e o destaque na página de carreiras — um acento a mais,
 * "Distribuicao" por "Distribuição" ou um "- Noturno" no fim desligava tudo
 * em silêncio. Escolhendo da lista, o vínculo vira `cargoId` e para de
 * depender de digitação.
 *
 * Continua possível digitar um cargo que ainda não tem descritivo: vaga
 * urgente não pode esperar o RH escrever um. Nesse caso o comportamento é o
 * de antes, e a tela diz que é o de antes.
 */

export interface CargoOpcao {
  id: string
  cargo: string
  area: string
  formacao: string | null
  statusCurso: string | null
  curso: string | null
  exigencias: string | null
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Falha ao carregar')
    return r.json()
  })

export function SeletorCargo({
  cargo,
  cargoId,
  erro,
  aoEscolher,
  aoDigitar,
}: {
  cargo: string
  cargoId: string
  erro?: string
  /** Descritivo escolhido — o chamador decide o que preencher com ele. */
  aoEscolher: (opcao: CargoOpcao) => void
  /** Texto livre: cargo sem descritivo. */
  aoDigitar: (texto: string) => void
}) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [modoLivre, setModoLivre] = useState(false)
  const campo = useRef<HTMLInputElement>(null)

  const { data } = useSWR<{ items: CargoOpcao[] }>('/api/gente/cargos', fetcher, {
    revalidateOnFocus: false,
  })

  const opcoes = useMemo(() => {
    const todos = data?.items ?? []
    if (!busca.trim()) return todos

    const q = busca.toLowerCase()
    return todos.filter((c) => c.cargo.toLowerCase().includes(q) || c.area.toLowerCase().includes(q))
  }, [data, busca])

  const entrada =
    'w-full px-3 py-2 rounded-xl bg-white/5 border text-sm text-white focus:outline-none focus:border-brand-500/40'

  // Modo livre: o campo de texto de antes, com um caminho de volta.
  if (modoLivre || (cargo && !cargoId && !aberto)) {
    return (
      <div className="space-y-1.5">
        <input
          value={cargo}
          onChange={(e) => aoDigitar(e.target.value)}
          placeholder="Motorista Caminhão Distribuição"
          className={`${entrada} ${erro ? 'border-red-500/50' : 'border-white/10'}`}
        />
        <button
          type="button"
          onClick={() => { setModoLivre(false); setAberto(true); setBusca('') }}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-[11px] transition-colors"
        >
          <FileText className="w-3 h-3" />
          Escolher de um descritivo cadastrado
        </button>
        {cargo && (
          <p className="text-amber-400 text-[11px] leading-relaxed">
            Cargo digitado à mão, sem descritivo vinculado. A conferência de aderência e o destaque
            na página de carreiras dependem do nome bater exatamente.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <button
          type="button"
          onClick={() => { setAberto((a) => !a); setTimeout(() => campo.current?.focus(), 0) }}
          aria-expanded={aberto}
          aria-haspopup="listbox"
          className={`${entrada} ${erro ? 'border-red-500/50' : 'border-white/10'} flex items-center justify-between gap-2 text-left`}
        >
          <span className={cargo ? 'text-white truncate' : 'text-slate-500'}>
            {cargo || 'Escolha o cargo…'}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
        </button>

        {aberto && (
          <div className="absolute z-30 left-0 right-0 top-full mt-1.5 rounded-xl bg-surface border border-white/10 shadow-xl overflow-hidden">
            <div className="relative border-b border-white/8">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                ref={campo}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setAberto(false)}
                placeholder="Buscar cargo ou área…"
                className="w-full pl-9 pr-8 py-2 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <ul role="listbox" className="max-h-64 overflow-y-auto">
              {opcoes.length === 0 && (
                <li className="px-3 py-3 text-slate-500 text-xs">
                  {data ? 'Nenhum descritivo com esse nome.' : 'Carregando descritivos…'}
                </li>
              )}

              {opcoes.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.id === cargoId}
                    onClick={() => { aoEscolher(c); setAberto(false); setBusca('') }}
                    className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-white text-sm truncate">{c.cargo}</span>
                      <span className="block text-slate-500 text-[11px] truncate">{c.area}</span>
                    </span>
                    {c.id === cargoId && <Check className="w-3.5 h-3.5 text-brand-400 shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => { setModoLivre(true); setAberto(false) }}
              className="w-full flex items-center gap-1.5 px-3 py-2.5 border-t border-white/8 text-slate-400 text-xs hover:bg-white/5 hover:text-white transition-colors"
            >
              <PenLine className="w-3.5 h-3.5" />
              Cargo sem descritivo — digitar à mão
            </button>
          </div>
        )}
      </div>

      {cargoId && (
        <p className="inline-flex items-center gap-1.5 text-brand-400 text-[11px]">
          <FileText className="w-3 h-3" />
          Vinculado ao descritivo — aderência e carreiras ligam sozinhos
        </p>
      )}
    </div>
  )
}
