'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Loader2, Save } from 'lucide-react'
import { SeletorCargo } from './SeletorCargo'
import { toast } from '@/components/ui/toaster'
import { STATUS_FECHAMENTO_LABEL, type RecStatusFechamentoValue } from '@/lib/gente/vaga-sla'

interface Operacao {
  id: string
  nome: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export interface ValoresVaga {
  operacaoId: string
  cargo: string
  /** Descritivo vinculado. Vazio = cargo digitado à mão. */
  cargoId: string
  area: string
  departamento: '' | 'DPO' | 'SPO'
  quantidadeVagas: string
  salario: string
  codigo: string
  frontline: string
  dataAbertura: string
  dataPrevistaFechamento: string
  dataContratacao: string
  encerradaEm: string
  status: 'ABERTA' | 'FECHADA' | 'CANCELADA'
  statusFechamentoManual: '' | RecStatusFechamentoValue
  nomeContratado: string
  motivoSolicitacao: string
  colaboradorAnterior: string
  dataDesligamento: string
  responsavelVaga: string
  solicitanteVaga: string
  requisitosMinimos: string
  formacao: string
  localTrabalho: string
  horario: string
  informacoesComplementares: string
  andamentoProcesso: string
}

export const VALORES_VAZIOS: ValoresVaga = {
  operacaoId: '',
  cargo: '',
  cargoId: '',
  area: '',
  departamento: '',
  quantidadeVagas: '1',
  salario: '',
  codigo: '',
  frontline: '',
  dataAbertura: new Date().toISOString().slice(0, 10),
  dataPrevistaFechamento: '',
  dataContratacao: '',
  encerradaEm: '',
  status: 'ABERTA',
  statusFechamentoManual: '',
  nomeContratado: '',
  motivoSolicitacao: '',
  colaboradorAnterior: '',
  dataDesligamento: '',
  responsavelVaga: '',
  solicitanteVaga: '',
  requisitosMinimos: '',
  formacao: '',
  localTrabalho: '',
  horario: '',
  informacoesComplementares: '',
  andamentoProcesso: '',
}

interface Props {
  modo: 'criar' | 'editar'
  /** Só em 'editar'. */
  vagaId?: string
  iniciais?: ValoresVaga
  /** Se o usuário não pode ver salário, o campo não aparece nem é enviado. */
  mostrarSalario?: boolean
}

export function FormularioVaga({ modo, vagaId, iniciais, mostrarSalario = true }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<ValoresVaga>(iniciais ?? VALORES_VAZIOS)
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})

  const { data } = useSWR<{ items: Operacao[]; semEscopo?: boolean }>(
    '/api/gente/operacoes',
    fetcher,
    { revalidateOnFocus: false }
  )
  const operacoes = data?.items ?? []

  const set = <K extends keyof ValoresVaga>(campo: K, valor: ValoresVaga[K]) =>
    setForm((f) => ({ ...f, [campo]: valor }))

  function validar(): boolean {
    const novos: Record<string, string> = {}
    if (!form.operacaoId) novos.operacaoId = 'Escolha a operação'
    if (!form.cargo.trim()) novos.cargo = 'Informe o cargo'
    if (!form.dataAbertura) novos.dataAbertura = 'Informe a data de abertura'

    const qtd = Number(form.quantidadeVagas)
    if (!Number.isInteger(qtd) || qtd < 1) novos.quantidadeVagas = 'Pelo menos 1'

    if (form.salario && Number.isNaN(Number(form.salario.replace(',', '.')))) {
      novos.salario = 'Valor inválido'
    }
    if (form.dataPrevistaFechamento && form.dataPrevistaFechamento < form.dataAbertura) {
      novos.dataPrevistaFechamento = 'Não pode ser antes da abertura'
    }
    if (form.dataContratacao && form.dataContratacao < form.dataAbertura) {
      novos.dataContratacao = 'Não pode ser antes da abertura'
    }

    // Coerências que o RH costuma errar ao fechar a vaga.
    if (form.status === 'FECHADA' && !form.dataContratacao) {
      novos.dataContratacao = 'Vaga fechada precisa da data de contratação (é ela que define o prazo)'
    }
    if (form.status === 'CANCELADA' && !form.encerradaEm) {
      novos.encerradaEm = 'Informe quando a vaga foi cancelada'
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
      const data_ = (v: string) => (v === '' ? null : v)

      const corpo = {
        operacaoId: form.operacaoId,
        cargo: form.cargo.trim(),
        cargoId: form.cargoId || null,
        area: texto(form.area),
        departamento: form.departamento || null,
        quantidadeVagas: Number(form.quantidadeVagas),
        ...(mostrarSalario
          ? { salario: form.salario ? Number(form.salario.replace(',', '.')) : null }
          : {}),
        codigo: texto(form.codigo),
        frontline: texto(form.frontline),
        dataAbertura: form.dataAbertura,
        dataPrevistaFechamento: data_(form.dataPrevistaFechamento),
        dataContratacao: data_(form.dataContratacao),
        encerradaEm: data_(form.encerradaEm),
        status: form.status,
        statusFechamentoManual: form.statusFechamentoManual || null,
        nomeContratado: texto(form.nomeContratado),
        motivoSolicitacao: texto(form.motivoSolicitacao),
        colaboradorAnterior: texto(form.colaboradorAnterior),
        dataDesligamento: data_(form.dataDesligamento),
        responsavelVaga: texto(form.responsavelVaga),
        solicitanteVaga: texto(form.solicitanteVaga),
        requisitosMinimos: texto(form.requisitosMinimos),
        formacao: texto(form.formacao),
        localTrabalho: texto(form.localTrabalho),
        horario: texto(form.horario),
        informacoesComplementares: texto(form.informacoesComplementares),
        andamentoProcesso: texto(form.andamentoProcesso),
      }

      const res = await fetch(
        modo === 'criar' ? '/api/gente/vagas' : `/api/gente/vagas/${vagaId}`,
        {
          method: modo === 'criar' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(corpo),
        }
      )

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Não foi possível salvar')

      toast({ title: modo === 'criar' ? 'Vaga criada' : 'Vaga atualizada', variant: 'success' })
      router.push('/gente/vagas')
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
          Peça a um administrador para vincular as suas operações antes de cadastrar vagas.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={salvar} className="space-y-5">
      <Secao titulo="Identificação">
        <Campo label="Operação" erro={erros.operacaoId} obrigatorio>
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
        </Campo>

        <Campo label="Cargo" erro={erros.cargo} obrigatorio>
          <SeletorCargo
            cargo={form.cargo}
            cargoId={form.cargoId}
            erro={erros.cargo}
            aoDigitar={(texto) => setForm((f) => ({ ...f, cargo: texto, cargoId: '' }))}
            aoEscolher={(c) =>
              setForm((f) => ({
                ...f,
                cargo: c.cargo,
                cargoId: c.id,
                /*
                  Só preenche o que está vazio. Se o RH já ajustou a área ou os
                  requisitos desta vaga, escolher o descritivo não pode apagar
                  o que ele escreveu — o descritivo é o padrão, a vaga é o caso.
                */
                area: f.area || c.area,
                requisitosMinimos: f.requisitosMinimos || c.exigencias || '',
                formacao:
                  f.formacao ||
                  [c.formacao, c.statusCurso, c.curso].filter(Boolean).join(' · '),
              }))
            }
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Área">
            <input value={form.area} onChange={(e) => set('area', e.target.value)} className={entrada()} />
          </Campo>
          <Campo label="Departamento">
            <select
              value={form.departamento}
              onChange={(e) => set('departamento', e.target.value as ValoresVaga['departamento'])}
              className={entrada()}
            >
              <option value="">—</option>
              <option value="DPO">DPO</option>
              <option value="SPO">SPO</option>
            </select>
          </Campo>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Campo label="Quantidade" erro={erros.quantidadeVagas}>
            <input
              type="number"
              min={1}
              value={form.quantidadeVagas}
              onChange={(e) => set('quantidadeVagas', e.target.value)}
              className={entrada(erros.quantidadeVagas)}
            />
          </Campo>
          {mostrarSalario && (
            <Campo label="Salário" erro={erros.salario}>
              <input
                value={form.salario}
                onChange={(e) => set('salario', e.target.value)}
                placeholder="2500,00"
                inputMode="decimal"
                className={entrada(erros.salario)}
              />
            </Campo>
          )}
          <Campo label="Código">
            <input value={form.codigo} onChange={(e) => set('codigo', e.target.value)} className={entrada()} />
          </Campo>
        </div>
      </Secao>

      <Secao titulo="Situação e prazos">
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Status">
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value as ValoresVaga['status'])}
              className={entrada()}
            >
              <option value="ABERTA">Aberta</option>
              <option value="FECHADA">Fechada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </Campo>
          <Campo label="Frontline">
            <input value={form.frontline} onChange={(e) => set('frontline', e.target.value)} className={entrada()} />
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Data de abertura" erro={erros.dataAbertura} obrigatorio>
            <input
              type="date"
              value={form.dataAbertura}
              onChange={(e) => set('dataAbertura', e.target.value)}
              className={entrada(erros.dataAbertura)}
            />
          </Campo>
          <Campo
            label="Previsão de fechamento"
            erro={erros.dataPrevistaFechamento}
            dica="Sem previsão, o prazo padrão é de 30 dias"
          >
            <input
              type="date"
              value={form.dataPrevistaFechamento}
              onChange={(e) => set('dataPrevistaFechamento', e.target.value)}
              className={entrada(erros.dataPrevistaFechamento)}
            />
          </Campo>
        </div>

        {form.status === 'FECHADA' && (
          <div className="grid grid-cols-2 gap-3">
            <Campo
              label="Data de contratação"
              erro={erros.dataContratacao}
              obrigatorio
              dica="É ela que define se a vaga fechou no prazo"
            >
              <input
                type="date"
                value={form.dataContratacao}
                onChange={(e) => set('dataContratacao', e.target.value)}
                className={entrada(erros.dataContratacao)}
              />
            </Campo>
            <Campo label="Nome do contratado">
              <input
                value={form.nomeContratado}
                onChange={(e) => set('nomeContratado', e.target.value)}
                className={entrada()}
              />
            </Campo>
          </div>
        )}

        {form.status === 'CANCELADA' && (
          <Campo
            label="Cancelada em"
            erro={erros.encerradaEm}
            obrigatorio
            dica="Congela a contagem de dias em aberto"
          >
            <input
              type="date"
              value={form.encerradaEm}
              onChange={(e) => set('encerradaEm', e.target.value)}
              className={entrada(erros.encerradaEm)}
            />
          </Campo>
        )}

        {form.status !== 'CANCELADA' && (
          <Campo
            label="Forçar situação do prazo"
            dica="Deixe em branco para o sistema calcular. Use só quando houver acordo registrado."
          >
            <select
              value={form.statusFechamentoManual}
              onChange={(e) =>
                set('statusFechamentoManual', e.target.value as ValoresVaga['statusFechamentoManual'])
              }
              className={entrada()}
            >
              <option value="">Calcular automaticamente</option>
              {(Object.keys(STATUS_FECHAMENTO_LABEL) as RecStatusFechamentoValue[]).map((s) => (
                <option key={s} value={s}>{STATUS_FECHAMENTO_LABEL[s]}</option>
              ))}
            </select>
          </Campo>
        )}
      </Secao>

      <Secao titulo="Origem e responsáveis">
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Motivo da solicitação">
            <input
              value={form.motivoSolicitacao}
              onChange={(e) => set('motivoSolicitacao', e.target.value)}
              placeholder="Ex.: Demissão com substituição"
              className={entrada()}
            />
          </Campo>
          <Campo label="Colaborador anterior">
            <input
              value={form.colaboradorAnterior}
              onChange={(e) => set('colaboradorAnterior', e.target.value)}
              className={entrada()}
            />
          </Campo>
          <Campo label="Data de desligamento">
            <input
              type="date"
              value={form.dataDesligamento}
              onChange={(e) => set('dataDesligamento', e.target.value)}
              className={entrada()}
            />
          </Campo>
          <Campo label="Responsável pela vaga">
            <input
              value={form.responsavelVaga}
              onChange={(e) => set('responsavelVaga', e.target.value)}
              className={entrada()}
            />
          </Campo>
          <Campo label="Solicitante">
            <input
              value={form.solicitanteVaga}
              onChange={(e) => set('solicitanteVaga', e.target.value)}
              className={entrada()}
            />
          </Campo>
        </div>
      </Secao>

      <Secao titulo="Perfil e condições">
        <Campo label="Requisitos mínimos">
          <textarea
            value={form.requisitosMinimos}
            onChange={(e) => set('requisitosMinimos', e.target.value)}
            rows={2}
            className={entrada()}
          />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Formação">
            <input value={form.formacao} onChange={(e) => set('formacao', e.target.value)} className={entrada()} />
          </Campo>
          <Campo label="Horário">
            <input value={form.horario} onChange={(e) => set('horario', e.target.value)} className={entrada()} />
          </Campo>
        </div>
        <Campo label="Local de trabalho">
          <input
            value={form.localTrabalho}
            onChange={(e) => set('localTrabalho', e.target.value)}
            className={entrada()}
          />
        </Campo>
        <Campo label="Informações complementares">
          <textarea
            value={form.informacoesComplementares}
            onChange={(e) => set('informacoesComplementares', e.target.value)}
            rows={2}
            className={entrada()}
          />
        </Campo>
        <Campo label="Andamento do processo">
          <textarea
            value={form.andamentoProcesso}
            onChange={(e) => set('andamentoProcesso', e.target.value)}
            rows={2}
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
          {modo === 'criar' ? 'Criar vaga' : 'Salvar alterações'}
        </button>
        <Link
          href="/gente/vagas"
          className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}

// ─── Peças de formulário ──────────────────────────────────────────────────────

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
