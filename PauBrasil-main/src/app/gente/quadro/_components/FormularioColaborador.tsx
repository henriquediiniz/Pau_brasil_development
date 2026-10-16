'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Loader2, Save } from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { cpfValido, normalizarCpf } from '@/lib/gente/cpf'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export interface ValoresColaborador {
  operacaoId: string
  nome: string
  cargo: string
  area: string
  matricula: string
  cpf: string
  dataAdmissao: string
  ativo: boolean
}

export const VALORES_VAZIOS: ValoresColaborador = {
  operacaoId: '',
  nome: '',
  cargo: '',
  area: '',
  matricula: '',
  cpf: '',
  dataAdmissao: '',
  ativo: true,
}

export function FormularioColaborador({
  modo,
  colaboradorId,
  iniciais,
}: {
  modo: 'criar' | 'editar'
  colaboradorId?: string
  iniciais?: ValoresColaborador
}) {
  const router = useRouter()
  const [form, setForm] = useState<ValoresColaborador>(iniciais ?? VALORES_VAZIOS)
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})

  const { data } = useSWR<{ items: { id: string; nome: string }[]; semEscopo?: boolean }>(
    '/api/gente/operacoes',
    fetcher,
    { revalidateOnFocus: false }
  )
  const operacoes = data?.items ?? []

  const set = <K extends keyof ValoresColaborador>(campo: K, valor: ValoresColaborador[K]) =>
    setForm((f) => ({ ...f, [campo]: valor }))

  async function salvar(e: React.FormEvent) {
    e.preventDefault()

    const novos: Record<string, string> = {}
    if (!form.operacaoId) novos.operacaoId = 'Escolha a operação'
    if (!form.nome.trim()) novos.nome = 'Informe o nome'
    // Vale a pena avisar aqui: digitar um CPF errado e descobrir meses depois,
    // conferindo a folha, custa muito mais que o aviso na hora.
    if (form.cpf.trim() && !cpfValido(normalizarCpf(form.cpf) ?? '')) {
      novos.cpf = 'CPF inválido — confira os dígitos'
    }
    setErros(novos)
    if (Object.keys(novos).length > 0) return

    setSalvando(true)
    try {
      const texto = (v: string) => (v.trim() === '' ? null : v.trim())

      const res = await fetch(
        modo === 'criar' ? '/api/gente/quadro' : `/api/gente/quadro/${colaboradorId}`,
        {
          method: modo === 'criar' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operacaoId: form.operacaoId,
            nome: form.nome.trim(),
            cargo: texto(form.cargo),
            area: texto(form.area),
            matricula: texto(form.matricula),
            cpf: texto(form.cpf),
            dataAdmissao: texto(form.dataAdmissao),
            ativo: form.ativo,
          }),
        }
      )

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Não foi possível salvar')

      toast({
        title: modo === 'criar' ? 'Colaborador cadastrado' : 'Colaborador atualizado',
        variant: 'success',
      })
      router.push('/gente/quadro')
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
          Peça a um administrador para vincular as suas operações.
        </p>
      </div>
    )
  }

  const entrada = (erro?: string) =>
    `w-full px-3 py-2 rounded-xl bg-white/5 border text-sm text-white placeholder:text-slate-500 focus:outline-none transition-colors ${
      erro ? 'border-red-500/40' : 'border-white/10 focus:border-brand-500/40'
    }`

  return (
    <form onSubmit={salvar} className="space-y-5">
      <fieldset className="p-4 rounded-2xl bg-white/3 border border-white/8 space-y-3">
        <legend className="px-2 text-[11px] uppercase tracking-wide text-slate-500">Lotação</legend>

        <label className="block">
          <span className="block text-xs text-slate-400 mb-1">
            Operação <span className="text-brand-400">*</span>
          </span>
          <select
            value={form.operacaoId}
            onChange={(e) => set('operacaoId', e.target.value)}
            className={entrada(erros.operacaoId)}
          >
            <option value="">Selecione…</option>
            {operacoes.map((o) => (
              <option key={o.id} value={o.id}>{o.nome}</option>
            ))}
          </select>
          {erros.operacaoId && (
            <span className="block text-[11px] text-red-400 mt-1">{erros.operacaoId}</span>
          )}
        </label>

        <label className="block">
          <span className="block text-xs text-slate-400 mb-1">
            Nome <span className="text-brand-400">*</span>
          </span>
          <input
            value={form.nome}
            onChange={(e) => set('nome', e.target.value)}
            className={entrada(erros.nome)}
          />
          {erros.nome && <span className="block text-[11px] text-red-400 mt-1">{erros.nome}</span>}
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs text-slate-400 mb-1">Cargo</span>
            <input value={form.cargo} onChange={(e) => set('cargo', e.target.value)} className={entrada()} />
          </label>
          <label className="block">
            <span className="block text-xs text-slate-400 mb-1">Área</span>
            <input value={form.area} onChange={(e) => set('area', e.target.value)} className={entrada()} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs text-slate-400 mb-1">Matrícula</span>
            <input
              value={form.matricula}
              onChange={(e) => set('matricula', e.target.value)}
              placeholder="10432"
              className={entrada()}
            />
            <span className="block text-[11px] text-slate-500 mt-1">
              Identifica a pessoa na importação, acima do nome.
            </span>
          </label>
          <label className="block">
            <span className="block text-xs text-slate-400 mb-1">Data de admissão</span>
            <input
              type="date"
              value={form.dataAdmissao}
              onChange={(e) => set('dataAdmissao', e.target.value)}
              className={entrada()}
            />
          </label>
        </div>

        <label className="block">
          <span className="block text-xs text-slate-400 mb-1">CPF</span>
          <input
            value={form.cpf}
            onChange={(e) => set('cpf', e.target.value)}
            placeholder="123.456.789-09"
            inputMode="numeric"
            className={entrada(erros.cpf)}
          />
          {erros.cpf ? (
            <span className="block text-[11px] text-red-400 mt-1">{erros.cpf}</span>
          ) : (
            <span className="block text-[11px] text-slate-500 mt-1">
              Dado pessoal. Cada consulta ao cadastro fica registrada na auditoria.
            </span>
          )}
        </label>

        {modo === 'editar' && (
          <label className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => set('ativo', e.target.checked)}
              className="accent-brand-500 mt-0.5"
            />
            <span className="text-xs text-slate-300">
              No quadro ativo
              <span className="block text-[11px] text-slate-500 mt-0.5">
                Para registrar uma saída com data e motivo, use o botão “Desligar” na lista — ele
                cria o registro de desligamento junto.
              </span>
            </span>
          </label>
        )}
      </fieldset>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={salvando}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm font-medium hover:bg-brand-500/20 disabled:opacity-40 transition-colors"
        >
          {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {modo === 'criar' ? 'Cadastrar' : 'Salvar alterações'}
        </button>
        <Link
          href="/gente/quadro"
          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
