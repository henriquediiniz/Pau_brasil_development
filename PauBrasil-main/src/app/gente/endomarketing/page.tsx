'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {
  Award, CalendarDays, ChevronLeft, ExternalLink, Hash, Loader2, Pencil, Plus, Save, Trash2, X,
} from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'
import { HUB_COMPANIES } from '@/lib/hub-content'
import { CATEGORIAS_RECONHECIMENTO, CORES_CAMPANHA } from '@/lib/endomarketing-opcoes'

type Tipo = 'reconhecimentos' | 'campanhas' | 'numeros'
type Registro = Record<string, string | number | boolean | null> & { id: string }

const ABAS: { tipo: Tipo; label: string; icone: typeof Award; ajuda: string }[] = [
  { tipo: 'reconhecimentos', label: 'Mural de reconhecimento', icone: Award,
    ajuda: 'Destaques de colaboradores. Aparecem no mural da página Nossa Gente, os mais recentes primeiro.' },
  { tipo: 'campanhas', label: 'Calendário de campanhas', icone: CalendarDays,
    ajuda: 'Campanhas do ano corrente. O site destaca a que está acontecendo e as próximas.' },
  { tipo: 'numeros', label: 'Números do mês', icone: Hash,
    ajuda: 'Indicadores exibidos com contador. O site mostra sempre o mês mais recente cadastrado.' },
]

const campo =
  'w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-brand-500/40'
const rotulo = 'block text-xs font-medium text-slate-400 mb-1'

const hoje = new Date().toISOString().slice(0, 10)
const VAZIOS: Record<Tipo, Record<string, string | boolean>> = {
  reconhecimentos: { nome: '', cargo: '', company: 'bebidas', unit: '', categoria: 'destaque', motivo: '', fotoUrl: '', mes: hoje.slice(0, 7), published: true },
  campanhas: { title: '', descricao: '', inicio: hoje, fim: '', cor: 'vinho', published: true },
  numeros: { label: '', valor: '', sufixo: '', mes: hoje.slice(0, 7), ordem: '0' },
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Falha ao carregar')
    return r.json()
  })

const mesLabel = (iso: unknown) =>
  typeof iso === 'string'
    ? new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'America/Fortaleza' })
    : ''
const diaLabel = (iso: unknown) =>
  typeof iso === 'string'
    ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Fortaleza' })
    : ''

/** Converte o registro do banco para os valores do formulário. */
function paraFormulario(tipo: Tipo, r: Registro): Record<string, string | boolean> {
  const base: Record<string, string | boolean> = {}
  for (const [chave, padrao] of Object.entries(VAZIOS[tipo])) {
    const valor = r[chave]
    if (typeof padrao === 'boolean') base[chave] = Boolean(valor)
    else if (valor == null) base[chave] = ''
    else if (chave === 'mes') base[chave] = String(valor).slice(0, 7)
    else if (chave === 'inicio' || chave === 'fim') base[chave] = String(valor).slice(0, 10)
    else base[chave] = String(valor)
  }
  return base
}

export default function EndomarketingPage() {
  const [tipo, setTipo] = useState<Tipo>('reconhecimentos')
  const aba = ABAS.find((a) => a.tipo === tipo)!
  const { data, error, isLoading, mutate } = useSWR<Registro[]>(`/api/gente/endomarketing/${tipo}`, fetcher)
  const [form, setForm] = useState<Record<string, string | boolean> | null>(null)
  const [editando, setEditando] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const abrirNovo = () => { setForm({ ...VAZIOS[tipo] }); setEditando(null); setErro(null) }
  const abrirEdicao = (r: Registro) => { setForm(paraFormulario(tipo, r)); setEditando(r.id); setErro(null) }
  const fechar = () => { setForm(null); setEditando(null); setErro(null) }
  const trocarAba = (t: Tipo) => { setTipo(t); fechar() }
  const alterar = (chave: string, valor: string | boolean) => setForm((f) => (f ? { ...f, [chave]: valor } : f))

  async function salvar() {
    if (!form) return
    setSalvando(true)
    setErro(null)
    const resposta = await fetch(
      editando ? `/api/gente/endomarketing/${tipo}/${editando}` : `/api/gente/endomarketing/${tipo}`,
      { method: editando ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) },
    )
    setSalvando(false)
    if (!resposta.ok) {
      const corpo = await resposta.json().catch(() => null)
      const campos = Object.keys(corpo?.detalhes?.fieldErrors ?? {})
      setErro(campos.length ? `Confira: ${campos.join(', ')}.` : 'Não foi possível salvar.')
      return
    }
    fechar()
    mutate()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este item? Ele sai do site imediatamente.')) return
    const resposta = await fetch(`/api/gente/endomarketing/${tipo}/${id}`, { method: 'DELETE' })
    if (resposta.ok) mutate()
  }

  const entrada = (chave: string, label: string, props: Record<string, unknown> = {}) => (
    <div>
      <label className={rotulo} htmlFor={chave}>{label}</label>
      <input id={chave} className={campo} value={String(form?.[chave] ?? '')}
        onChange={(e) => alterar(chave, e.target.value)} {...props} />
    </div>
  )
  const texto = (chave: string, label: string, max: number) => (
    <div className="md:col-span-2">
      <label className={rotulo} htmlFor={chave}>{label} ({String(form?.[chave] ?? '').length}/{max})</label>
      <textarea id={chave} rows={3} maxLength={max} className={campo} value={String(form?.[chave] ?? '')}
        onChange={(e) => alterar(chave, e.target.value)} />
    </div>
  )
  const escolha = (chave: string, label: string, opcoes: [string, string][]) => (
    <div>
      <label className={rotulo} htmlFor={chave}>{label}</label>
      <select id={chave} className={campo} value={String(form?.[chave] ?? '')} onChange={(e) => alterar(chave, e.target.value)}>
        {opcoes.map(([valor, nome]) => <option key={valor} value={valor}>{nome}</option>)}
      </select>
    </div>
  )
  const publicado = (
    <label className="md:col-span-2 inline-flex items-center gap-2 text-sm text-slate-300">
      <input type="checkbox" checked={Boolean(form?.published)} onChange={(e) => alterar('published', e.target.checked)} />
      Publicado no site
    </label>
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/gente" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs mb-2 transition-colors">
            <ChevronLeft className="w-3 h-3" /> Gente
          </Link>
          <h1 className="text-2xl font-display font-bold text-white">Endomarketing</h1>
          <p className="text-slate-400 text-sm">Conteúdo da página Nossa Gente do site do grupo.</p>
        </div>
        <a href="/nossa-gente" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/8 transition-colors">
          <ExternalLink className="w-4 h-4" /> Ver no site
        </a>
      </div>

      <div role="tablist" aria-label="Tipo de conteúdo" className="flex flex-wrap gap-2">
        {ABAS.map(({ tipo: t, label, icone: Icone }) => (
          <button key={t} role="tab" aria-selected={t === tipo} onClick={() => trocarAba(t)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-colors ${
              t === tipo ? 'bg-brand-500/15 border-brand-500/30 text-brand-400' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/8'
            }`}>
            <Icone className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-slate-400 text-sm">{aba.ajuda}</p>
        {!form && (
          <button onClick={abrirNovo}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors">
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        )}
      </div>

      {form && (
        <section className="rounded-2xl bg-white/3 border border-white/8 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-white text-sm font-medium">{editando ? 'Editar' : 'Novo'} · {aba.label}</p>
            <button onClick={fechar} aria-label="Cancelar" className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {tipo === 'reconhecimentos' && (<>
              {entrada('nome', 'Nome do colaborador', { maxLength: 80 })}
              {entrada('cargo', 'Cargo', { maxLength: 80 })}
              {escolha('company', 'Empresa', HUB_COMPANIES.map((c) => [c.slug, c.name]))}
              {entrada('unit', 'Unidade', { maxLength: 60, placeholder: 'Ex.: Sousa (PB)' })}
              {escolha('categoria', 'Categoria', Object.entries(CATEGORIAS_RECONHECIMENTO))}
              {entrada('mes', 'Mês de referência', { type: 'month' })}
              {texto('motivo', 'Por que é destaque', 280)}
              <div className="md:col-span-2 max-w-xs">
                <ImageUpload value={String(form.fotoUrl || '') || undefined} aspectRatio="1/1" label="Foto (opcional)"
                  onChange={(url) => alterar('fotoUrl', url)} onRemove={() => alterar('fotoUrl', '')} />
              </div>
              {publicado}
            </>)}
            {tipo === 'campanhas' && (<>
              <div className="md:col-span-2">{entrada('title', 'Nome da campanha', { maxLength: 80, placeholder: 'Ex.: Outubro Rosa' })}</div>
              {entrada('inicio', 'Início', { type: 'date' })}
              {entrada('fim', 'Fim (opcional)', { type: 'date' })}
              {escolha('cor', 'Cor da campanha', Object.entries(CORES_CAMPANHA).map(([k, v]) => [k, v.nome]))}
              <div />
              {texto('descricao', 'Descrição', 280)}
              {publicado}
            </>)}
            {tipo === 'numeros' && (<>
              {entrada('label', 'Indicador', { maxLength: 60, placeholder: 'Ex.: horas de treinamento' })}
              {entrada('valor', 'Valor', { type: 'number', min: 0 })}
              {entrada('sufixo', 'Sufixo (opcional)', { maxLength: 12, placeholder: 'Ex.: h, %, +' })}
              {entrada('mes', 'Mês de referência', { type: 'month' })}
              {entrada('ordem', 'Ordem de exibição', { type: 'number', min: 0, max: 99 })}
            </>)}
          </div>
          {erro && <p role="alert" className="text-red-300 text-sm">{erro}</p>}
          <button onClick={salvar} disabled={salvando}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 text-sm hover:bg-brand-500/20 transition-colors disabled:opacity-50">
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
          </button>
        </section>
      )}

      {isLoading && <p className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Carregando…</p>}
      {error && <p className="text-red-400 text-sm">Não foi possível carregar.</p>}
      {data && data.length === 0 && !form && (
        <p className="rounded-2xl bg-white/3 border border-white/8 p-6 text-center text-slate-400 text-sm">Nada cadastrado ainda.</p>
      )}

      {data && data.length > 0 && (
        <ul className="rounded-2xl bg-white/3 border border-white/8 divide-y divide-white/5">
          {data.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-3">
              {tipo === 'reconhecimentos' && r.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={String(r.fotoUrl)} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : tipo === 'campanhas' ? (
                <span className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: CORES_CAMPANHA[String(r.cor) as keyof typeof CORES_CAMPANHA]?.cor }} />
              ) : null}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {tipo === 'reconhecimentos' && `${r.nome} · ${r.cargo}`}
                  {tipo === 'campanhas' && String(r.title)}
                  {tipo === 'numeros' && `${Number(r.valor).toLocaleString('pt-BR')}${r.sufixo ?? ''} ${r.label}`}
                </p>
                <p className="text-slate-500 text-xs truncate">
                  {tipo === 'reconhecimentos' && `${CATEGORIAS_RECONHECIMENTO[String(r.categoria) as keyof typeof CATEGORIAS_RECONHECIMENTO] ?? r.categoria} · ${mesLabel(r.mes)} · ${r.unit}`}
                  {tipo === 'campanhas' && `${diaLabel(r.inicio)}${r.fim ? ` a ${diaLabel(r.fim)}` : ''}`}
                  {tipo === 'numeros' && mesLabel(r.mes)}
                  {'published' in r && !r.published && ' · rascunho'}
                </p>
              </div>
              <button onClick={() => abrirEdicao(r)} aria-label="Editar" className="p-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => excluir(r.id)} aria-label="Excluir" className="p-1.5 rounded-lg border border-red-500/20 text-red-300 hover:bg-red-500/10">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
