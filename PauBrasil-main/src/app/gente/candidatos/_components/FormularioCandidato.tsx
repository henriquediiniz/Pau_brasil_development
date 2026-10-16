'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Loader2, Save } from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import {
  ORIGEM_LABEL,
  ORIGENS,
  SITUACAO_LABEL,
  SITUACOES,
  SITUACOES_FINAIS,
  type OrigemCurriculo,
  type SituacaoCandidato,
} from '@/lib/gente/candidato'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export interface ValoresCandidato {
  operacaoId: string
  nome: string
  cargo: string
  telefone: string
  email: string
  mesProcesso: string
  setor: '' | 'DPO' | 'SPO'
  escolaridade: string
  habilidades: string
  residencia: string
  observacao: string
  origemCurriculo: OrigemCurriculo
  quemIndicou: string
  situacao: SituacaoCandidato
  situacaoFinal: '' | SituacaoCandidato
  dataSituacaoFinal: string
  vagaId: string
}

export const VALORES_VAZIOS: ValoresCandidato = {
  operacaoId: '',
  nome: '',
  cargo: '',
  telefone: '',
  email: '',
  mesProcesso: '',
  setor: '',
  escolaridade: '',
  habilidades: '',
  residencia: '',
  observacao: '',
  origemCurriculo: 'OUTRO',
  quemIndicou: '',
  situacao: 'EM_STAND_BY',
  situacaoFinal: '',
  dataSituacaoFinal: '',
  vagaId: '',
}

interface Props {
  modo: 'criar' | 'editar'
  candidatoId?: string
  iniciais?: ValoresCandidato
}

export function FormularioCandidato({ modo, candidatoId, iniciais }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<ValoresCandidato>(iniciais ?? VALORES_VAZIOS)
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})

  const { data } = useSWR<{ items: { id: string; nome: string }[]; semEscopo?: boolean }>(
    '/api/gente/operacoes',
    fetcher,
    { revalidateOnFocus: false }
  )
  const operacoes = data?.items ?? []

  const { data: vagasData } = useSWR<{ items: { id: string; cargo: string }[] }>(
    form.operacaoId ? `/api/gente/vagas?status=ABERTA&operacaoId=${form.operacaoId}&limit=100` : null,
    fetcher,
    { revalidateOnFocus: false }
  )
  const vagas = vagasData?.items ?? []

  const set = <K extends keyof ValoresCandidato>(campo: K, valor: ValoresCandidato[K]) =>
    setForm((f) => ({ ...f, [campo]: valor }))

  function validar(): boolean {
    const novos: Record<string, string> = {}
    if (!form.operacaoId) novos.operacaoId = 'Escolha a operação'
    if (!form.nome.trim()) novos.nome = 'Informe o nome'
    if (form.email && !form.email.includes('@')) novos.email = 'E-mail inválido'

    // Encerrar o processo sem data deixa o histórico sem o "quando".
    const final = form.situacaoFinal || null
    if (final && SITUACOES_FINAIS.includes(final) && !form.dataSituacaoFinal) {
      novos.dataSituacaoFinal = 'Informe a data ao encerrar o processo'
    }
    if (form.origemCurriculo === 'INDICACAO' && !form.quemIndicou.trim()) {
      novos.quemIndicou = 'Informe quem indicou'
    }

    setErros(novos)
    return Object.keys(novos).length === 0
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!validar()) return

    setSalvando(true)
    try {
      const texto = (v: string) => (v.trim() === '' ? null : v.trim())

      const res = await fetch(
        modo === 'criar' ? '/api/gente/candidatos' : `/api/gente/candidatos/${candidatoId}`,
        {
          method: modo === 'criar' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operacaoId: form.operacaoId,
            nome: form.nome.trim(),
            cargo: texto(form.cargo),
            telefone: texto(form.telefone),
            email: texto(form.email) ?? '',
            mesProcesso: texto(form.mesProcesso),
            setor: form.setor || null,
            escolaridade: texto(form.escolaridade),
            habilidades: texto(form.habilidades),
            residencia: texto(form.residencia),
            observacao: texto(form.observacao),
            origemCurriculo: form.origemCurriculo,
            quemIndicou: texto(form.quemIndicou),
            situacao: form.situacao,
            situacaoFinal: form.situacaoFinal || null,
            dataSituacaoFinal: form.dataSituacaoFinal || null,
            vagaId: form.vagaId || null,
          }),
        }
      )

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Não foi possível salvar')

      toast({
        title: modo === 'criar' ? 'Candidato cadastrado' : 'Candidato atualizado',
        variant: 'success',
      })
      router.push('/gente/candidatos')
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

  if (data?.semEscopo) {
    return (
      <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
        <p className="text-white font-medium">Nenhuma operação atribuída ao seu usuário</p>
        <p className="text-slate-400 text-sm mt-1">
          Peça a um administrador para vincular as suas operações antes de cadastrar candidatos.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={salvar} className="space-y-5">
      <Secao titulo="Pessoa">
        <Campo label="Nome" erro={erros.nome} obrigatorio>
          <input value={form.nome} onChange={(e) => set('nome', e.target.value)} className={entrada(erros.nome)} />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Telefone">
            <input
              value={form.telefone}
              onChange={(e) => set('telefone', e.target.value)}
              inputMode="tel"
              className={entrada()}
            />
          </Campo>
          <Campo label="E-mail" erro={erros.email}>
            <input
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              inputMode="email"
              className={entrada(erros.email)}
            />
          </Campo>
          <Campo label="Escolaridade">
            <input
              value={form.escolaridade}
              onChange={(e) => set('escolaridade', e.target.value)}
              className={entrada()}
            />
          </Campo>
          <Campo label="Residência">
            <input
              value={form.residencia}
              onChange={(e) => set('residencia', e.target.value)}
              placeholder="Cidade ou bairro"
              className={entrada()}
            />
          </Campo>
        </div>

        <Campo label="Habilidades">
          <textarea
            value={form.habilidades}
            onChange={(e) => set('habilidades', e.target.value)}
            rows={2}
            className={entrada()}
          />
        </Campo>
      </Secao>

      <Secao titulo="Processo">
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Operação" erro={erros.operacaoId} obrigatorio>
            <select
              value={form.operacaoId}
              onChange={(e) => { set('operacaoId', e.target.value); set('vagaId', '') }}
              className={entrada(erros.operacaoId)}
            >
              <option value="">Selecione…</option>
              {operacoes.map((o) => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Cargo pretendido">
            <input value={form.cargo} onChange={(e) => set('cargo', e.target.value)} className={entrada()} />
          </Campo>
          <Campo label="Mês do processo">
            <input
              value={form.mesProcesso}
              onChange={(e) => set('mesProcesso', e.target.value)}
              placeholder="Ex.: Fevereiro"
              className={entrada()}
            />
          </Campo>
          <Campo label="Setor">
            <select
              value={form.setor}
              onChange={(e) => set('setor', e.target.value as ValoresCandidato['setor'])}
              className={entrada()}
            >
              <option value="">—</option>
              <option value="DPO">DPO</option>
              <option value="SPO">SPO</option>
            </select>
          </Campo>
        </div>

        {form.operacaoId && vagas.length > 0 && (
          <Campo label="Vaga vinculada">
            <select value={form.vagaId} onChange={(e) => set('vagaId', e.target.value)} className={entrada()}>
              <option value="">Sem vaga</option>
              {vagas.map((v) => (
                <option key={v.id} value={v.id}>{v.cargo}</option>
              ))}
            </select>
          </Campo>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Situação">
            <select
              value={form.situacao}
              onChange={(e) => set('situacao', e.target.value as SituacaoCandidato)}
              className={entrada()}
            >
              {SITUACOES.map((s) => (
                <option key={s} value={s}>{SITUACAO_LABEL[s]}</option>
              ))}
            </select>
          </Campo>
          <Campo label="Situação final" dica="Preencha só quando o processo encerrar">
            <select
              value={form.situacaoFinal}
              onChange={(e) => set('situacaoFinal', e.target.value as ValoresCandidato['situacaoFinal'])}
              className={entrada()}
            >
              <option value="">Em aberto</option>
              {SITUACOES.map((s) => (
                <option key={s} value={s}>{SITUACAO_LABEL[s]}</option>
              ))}
            </select>
          </Campo>
        </div>

        {form.situacaoFinal && (
          <Campo label="Data da situação final" erro={erros.dataSituacaoFinal} obrigatorio>
            <input
              type="date"
              value={form.dataSituacaoFinal}
              onChange={(e) => set('dataSituacaoFinal', e.target.value)}
              className={entrada(erros.dataSituacaoFinal)}
            />
          </Campo>
        )}
      </Secao>

      <Secao titulo="Origem">
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Como chegou">
            <select
              value={form.origemCurriculo}
              onChange={(e) => set('origemCurriculo', e.target.value as OrigemCurriculo)}
              className={entrada()}
            >
              {ORIGENS.map((o) => (
                <option key={o} value={o}>{ORIGEM_LABEL[o]}</option>
              ))}
            </select>
          </Campo>
          {form.origemCurriculo === 'INDICACAO' && (
            <Campo label="Quem indicou" erro={erros.quemIndicou} obrigatorio>
              <input
                value={form.quemIndicou}
                onChange={(e) => set('quemIndicou', e.target.value)}
                className={entrada(erros.quemIndicou)}
              />
            </Campo>
          )}
        </div>

        <Campo label="Observação">
          <textarea
            value={form.observacao}
            onChange={(e) => set('observacao', e.target.value)}
            rows={3}
            className={entrada()}
          />
        </Campo>
      </Secao>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={salvando}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm font-medium hover:bg-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {modo === 'criar' ? 'Cadastrar candidato' : 'Salvar alterações'}
        </button>
        <Link
          href="/gente/candidatos"
          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
        >
          Cancelar
        </Link>
      </div>

      {modo === 'editar' && (
        <p className="text-slate-500 text-xs">
          As etapas do processo são marcadas direto na lista, abrindo o candidato.
        </p>
      )}
    </form>
  )
}

// ─── Peças ────────────────────────────────────────────────────────────────────

function entrada(erro?: string) {
  return `w-full px-3 py-2 rounded-xl bg-white/5 border text-sm text-white placeholder:text-slate-500 focus:outline-none transition-colors ${
    erro ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/10 focus:border-brand-500/40'
  }`
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="p-4 rounded-2xl bg-white/3 border border-white/8 space-y-3">
      <legend className="px-2 text-[11px] uppercase tracking-wide text-slate-500">{titulo}</legend>
      {children}
    </fieldset>
  )
}

function Campo({
  label,
  erro,
  dica,
  obrigatorio,
  children,
}: {
  label: string
  erro?: string
  dica?: string
  obrigatorio?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-xs text-slate-400 mb-1">
        {label}
        {obrigatorio && <span className="text-brand-400"> *</span>}
      </span>
      {children}
      {erro ? (
        <span className="block text-[11px] text-red-400 mt-1">{erro}</span>
      ) : dica ? (
        <span className="block text-[11px] text-slate-500 mt-1">{dica}</span>
      ) : null}
    </label>
  )
}
