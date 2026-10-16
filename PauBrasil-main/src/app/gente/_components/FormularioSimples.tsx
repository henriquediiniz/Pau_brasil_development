'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Loader2, Save } from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { Campo, SemEscopo, entrada } from './campos'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export type TipoCampo = 'texto' | 'data' | 'numero' | 'select' | 'textarea' | 'checkbox' | 'lista'

export interface DefinicaoCampo {
  nome: string
  label: string
  tipo?: TipoCampo
  obrigatorio?: boolean
  dica?: string
  placeholder?: string
  opcoes?: { valor: string; label: string }[]
  /** Metade da largura numa grade de 2 colunas. */
  meio?: boolean
  /** Só aparece quando a condição for verdadeira. */
  quando?: (valores: Record<string, string>) => boolean
}

export interface SecaoCampos {
  titulo: string
  campos: DefinicaoCampo[]
}

interface Props {
  modo: 'criar' | 'editar'
  id?: string
  endpoint: string
  destino: string
  secoes: SecaoCampos[]
  iniciais: Record<string, string>
  /** Validação extra, além dos obrigatórios. */
  validar?: (valores: Record<string, string>) => Record<string, string>
  rotuloCriar?: string
}

/**
 * Formulário declarativo para os cadastros mais simples do módulo.
 *
 * Os cadastros de vaga e de candidato têm regras próprias e continuam com
 * formulário escrito à mão; estes aqui são listas de campos, e descrevê-los
 * como dados evita quatro arquivos quase idênticos.
 */
export function FormularioSimples({
  modo,
  id,
  endpoint,
  destino,
  secoes,
  iniciais,
  validar,
  rotuloCriar = 'Cadastrar',
}: Props) {
  const router = useRouter()
  const [valores, setValores] = useState<Record<string, string>>(iniciais)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)

  const { data } = useSWR<{ items: { id: string; nome: string }[]; semEscopo?: boolean }>(
    '/api/gente/operacoes',
    fetcher,
    { revalidateOnFocus: false }
  )
  const operacoes = data?.items ?? []

  const set = (nome: string, valor: string) => setValores((v) => ({ ...v, [nome]: valor }))

  const todosOsCampos = secoes.flatMap((s) => s.campos)

  async function salvar(e: React.FormEvent) {
    e.preventDefault()

    const novos: Record<string, string> = {}
    for (const campo of todosOsCampos) {
      if (campo.quando && !campo.quando(valores)) continue
      if (campo.obrigatorio && !valores[campo.nome]?.trim()) {
        novos[campo.nome] = `Informe ${campo.label.toLowerCase()}`
      }
    }
    Object.assign(novos, validar?.(valores) ?? {})

    setErros(novos)
    if (Object.keys(novos).length > 0) return

    setSalvando(true)
    try {
      // Campo vazio vira null; número vira number; checkbox vira boolean;
      // lista vira array separando por vírgula.
      const corpo: Record<string, unknown> = {}
      for (const campo of todosOsCampos) {
        const bruto = valores[campo.nome] ?? ''

        if (campo.tipo === 'checkbox') {
          corpo[campo.nome] = bruto === 'true'
        } else if (campo.tipo === 'lista') {
          // Vazio vira [] e não null: array é sempre array, e o Prisma recusa
          // null num campo de lista.
          //
          // Vírgula e ponto e vírgula separam igual: quem digita não decora
          // qual o campo aceita, e trocar um pelo outro não pode custar o
          // cadastro inteiro.
          corpo[campo.nome] = bruto.split(/[;,]/).map((v) => v.trim()).filter(Boolean)
        } else if (bruto.trim() === '') {
          corpo[campo.nome] = null
        } else if (campo.tipo === 'numero') {
          corpo[campo.nome] = Number(bruto)
        } else {
          corpo[campo.nome] = bruto.trim()
        }
      }

      const res = await fetch(modo === 'criar' ? endpoint : `${endpoint}/${id}`, {
        method: modo === 'criar' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      })
      const json = await res.json()

      if (!res.ok) {
        /*
          O servidor manda `detalhes` com o campo que recusou, e a tela jogava
          fora: sobrava "Dados inválidos" sem dizer onde. Agora o campo fica
          marcado em vermelho e o aviso nomeia os campos.
        */
        const detalhes = json.detalhes as Record<string, string[]> | undefined
        if (detalhes && typeof detalhes === 'object') {
          const porCampo: Record<string, string> = {}
          for (const [campo, msgs] of Object.entries(detalhes)) {
            if (Array.isArray(msgs) && msgs.length > 0) porCampo[campo] = msgs[0]
          }
          setErros(porCampo)

          const rotulos = Object.keys(porCampo)
            .map((nome) => todosOsCampos.find((c) => c.nome === nome)?.label ?? nome)
            .join(', ')

          throw new Error(
            rotulos ? `${json.error ?? 'Dados inválidos'}: ${rotulos}` : (json.error ?? 'Não foi possível salvar')
          )
        }

        throw new Error(json.error ?? 'Não foi possível salvar')
      }

      toast({ title: modo === 'criar' ? 'Cadastrado' : 'Atualizado', variant: 'success' })
      router.push(destino)
      router.refresh()
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : 'Não foi possível salvar',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  if (data?.semEscopo) return <SemEscopo />

  function renderCampo(campo: DefinicaoCampo) {
    const valor = valores[campo.nome] ?? ''
    const erro = erros[campo.nome]

    // `operacaoId` é sempre um select alimentado pelo escopo do usuário.
    if (campo.nome === 'operacaoId') {
      return (
        <select value={valor} onChange={(e) => set(campo.nome, e.target.value)} className={entrada(erro)}>
          <option value="">Selecione…</option>
          {operacoes.map((o) => (
            <option key={o.id} value={o.id}>{o.nome}</option>
          ))}
        </select>
      )
    }

    if (campo.tipo === 'select') {
      return (
        <select value={valor} onChange={(e) => set(campo.nome, e.target.value)} className={entrada(erro)}>
          <option value="">—</option>
          {campo.opcoes?.map((o) => (
            <option key={o.valor} value={o.valor}>{o.label}</option>
          ))}
        </select>
      )
    }

    if (campo.tipo === 'textarea') {
      return (
        <textarea
          value={valor}
          onChange={(e) => set(campo.nome, e.target.value)}
          rows={3}
          placeholder={campo.placeholder}
          className={entrada(erro)}
        />
      )
    }

    if (campo.tipo === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={valor === 'true'}
          onChange={(e) => set(campo.nome, String(e.target.checked))}
          className="accent-brand-500"
        />
      )
    }

    return (
      <input
        type={campo.tipo === 'data' ? 'date' : campo.tipo === 'numero' ? 'number' : 'text'}
        value={valor}
        onChange={(e) => set(campo.nome, e.target.value)}
        placeholder={campo.placeholder}
        className={entrada(erro)}
      />
    )
  }

  return (
    <form onSubmit={salvar} className="space-y-5">
      {secoes.map((secao) => {
        const visiveis = secao.campos.filter((c) => !c.quando || c.quando(valores))
        if (visiveis.length === 0) return null

        return (
          <fieldset key={secao.titulo} className="p-4 rounded-2xl bg-white/3 border border-white/8 space-y-3">
            <legend className="px-2 text-[11px] uppercase tracking-wide text-slate-500">
              {secao.titulo}
            </legend>

            <div className="grid grid-cols-2 gap-3">
              {visiveis.map((campo) => (
                <div key={campo.nome} className={campo.meio ? '' : 'col-span-2'}>
                  <Campo
                    label={campo.label}
                    erro={erros[campo.nome]}
                    dica={campo.dica}
                    obrigatorio={campo.obrigatorio}
                  >
                    {renderCampo(campo)}
                  </Campo>
                </div>
              ))}
            </div>
          </fieldset>
        )
      })}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={salvando}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm font-medium hover:bg-brand-500/20 disabled:opacity-40 transition-colors"
        >
          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {modo === 'criar' ? rotuloCriar : 'Salvar alterações'}
        </button>
        <Link
          href={destino}
          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
