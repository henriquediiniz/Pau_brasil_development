'use client'

import { useState } from 'react'
import { AlertTriangle, Check, Globe, Loader2 } from 'lucide-react'
import { CARREIRAS_GRUPOS } from '@/lib/carreiras-areas'
import { grupoDoCargo } from '@/lib/gente/cargo-publico'

/**
 * Controle de publicação de um descritivo na página de carreiras.
 *
 * **Um controle só, e não caixa de seleção + botão salvar.** Três razões:
 *
 * 1. Publicar exige duas informações — estar publicado **e** ter um grupo,
 *    porque sem grupo não há onde encaixar o cargo na página. Uma caixa de
 *    seleção sozinha deixaria marcar "publicar" e não acontecer nada, que é o
 *    pior tipo de bug: o que não avisa.
 * 2. Com 57 descritivos numa lista rolável, um botão "salvar" no topo ou no
 *    rodapé fica longe de onde a pessoa está. Marcar vinte e perder tudo ao
 *    trocar de tela é um acidente caro e comum.
 * 3. Escolher o grupo **é** publicar. Duas decisões viram uma.
 *
 * "Fora do site" preserva o grupo escolhido antes, para republicar não custar
 * a escolha de novo.
 */

export function PublicarNoSite({
  cargoId,
  cargo,
  area,
  publicado,
  grupo,
  aoMudar,
}: {
  cargoId: string
  /** Só para o rótulo acessível. */
  cargo: string
  /** A área interna, de onde o grupo é deduzido quando não há um escolhido. */
  area: string
  publicado: boolean
  grupo: string | null
  aoMudar: () => void
}) {
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(false)
  const [salvo, setSalvo] = useState(false)

  const valor = publicado && grupo ? grupo : ''
  /*
    Desde que a pagina passou a ser montada so com descritivos, o que decide se
    o cargo aparece e ter um grupo — escolhido a mao ou deduzido da area. O
    aviso mudou junto: antes era "seu nome nao esta na lista da pagina", agora
    e "falta dizer em que grupo ele entra".
  */
  const apareceNaPagina = Boolean(grupoDoCargo({ grupoPublico: grupo, area }))

  const selecionar = async (novo: string) => {
    if (novo === valor) return

    setSalvando(true)
    setErro(false)

    try {
      const res = await fetch(`/api/gente/cargos/${cargoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          novo === ''
            ? // Tira do ar, mas guarda o grupo: republicar não deve custar a
              // escolha de novo.
              { publicarNoSite: false }
            : { publicarNoSite: true, grupoPublico: novo }
        ),
      })
      if (!res.ok) throw new Error()

      setSalvo(true)
      setTimeout(() => setSalvo(false), 1800)
      aoMudar()
    } catch {
      setErro(true)
      setTimeout(() => setErro(false), 4000)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <label className="sr-only" htmlFor={`publicar-${cargoId}`}>
        Publicação de {cargo} na página de carreiras
      </label>

      <span className="relative inline-flex items-center">
        {publicado && (
          <Globe className="w-3.5 h-3.5 text-brand-400 absolute left-2 pointer-events-none" aria-hidden />
        )}
        <select
          id={`publicar-${cargoId}`}
          value={valor}
          disabled={salvando}
          onChange={(e) => selecionar(e.target.value)}
          className={`appearance-none rounded-lg border text-xs py-1.5 pr-6 transition-colors focus:outline-none focus:border-brand-500/40 disabled:opacity-60 ${
            publicado ? 'pl-7' : 'pl-2.5'
          } ${
            erro
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : publicado
              ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
              : 'bg-white/5 border-white/10 text-slate-400'
          }`}
        >
          <option value="">Fora do site</option>
          {CARREIRAS_GRUPOS.map((g) => (
            <option key={g.slug} value={g.slug}>
              No site · {g.grupo}
            </option>
          ))}
        </select>
      </span>

      {/*
        Publicado, mas o nome nao existe na lista da pagina: o cargo nao vai
        aparecer para o candidato. Avisar aqui evita a conclusao errada de que
        o site esta quebrado.
      */}
      {publicado && !apareceNaPagina && (
        <span
          className="inline-flex items-center gap-1 text-amber-400 text-[10px] shrink-0"
          title={`"${cargo}" está publicado, mas a área "${area}" não diz em que grupo da página ele entra. Escolha o grupo aqui para ele aparecer.`}
        >
          <AlertTriangle className="w-3 h-3" />
          sem grupo
        </span>
      )}

      {/* Confirmação discreta: salvou sozinho, então precisa dizer que salvou. */}
      <span className="w-4 shrink-0" aria-live="polite">
        {salvando && <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />}
        {salvo && !salvando && <Check className="w-3.5 h-3.5 text-emerald-400" />}
        {erro && !salvando && (
          <span className="text-red-400 text-[10px]" role="alert">
            erro
          </span>
        )}
      </span>
    </div>
  )
}
