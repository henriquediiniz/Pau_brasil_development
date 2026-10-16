'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Target, Trash2, Loader2, X, ChevronDown, Building2, Users } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

interface Funcao { id: string; name: string }
interface Meta {
  id: string; titulo: string; meta: number; periodo: string
  mes: number | null; trimestre: number | null; ano: number
  funcaoId: string | null; units: string[]; funcoesMeta: string[]; ativo: boolean
  funcao: { id: string; name: string } | null
}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const TRIMESTRES = ['1º Tri','2º Tri','3º Tri','4º Tri']
const ANO_ATUAL = new Date().getFullYear()

const EMPTY = {
  titulo: '', meta: 1000, periodo: 'mensal',
  mes: new Date().getMonth() + 1, trimestre: null as number | null,
  ano: ANO_ATUAL, funcaoId: null as string | null,
  units: [] as string[], funcoesMeta: [] as string[],
}

function MultiSelect({
  label, options, selected, onChange, placeholder,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (v: string[]) => void
  placeholder: string
}) {
  function toggle(val: string) {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val])
  }

  return (
    <div>
      <label className="text-xs text-slate-400 font-medium block mb-1.5">{label}</label>
      <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1.5 max-h-36 overflow-y-auto">
        {options.length === 0 ? (
          <span className="text-xs text-slate-600">{placeholder}</span>
        ) : (
          options.map(opt => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="w-3.5 h-3.5 rounded accent-brand-500"
              />
              <span className={`text-sm transition-colors ${selected.includes(opt.value) ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                {opt.label}
              </span>
            </label>
          ))
        )}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.map(v => {
            const opt = options.find(o => o.value === v)
            return (
              <span key={v} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-xs">
                {opt?.label ?? v}
                <button type="button" onClick={() => toggle(v)} className="hover:text-white transition-colors">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function MetasPage() {
  const [metas, setMetas] = useState<Meta[]>([])
  const [funcoes, setFuncoes] = useState<Funcao[]>([])
  const [unidades, setUnidades] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const [m, f, u] = await Promise.all([
      fetch('/api/admin/metas').then(r => r.json()),
      fetch('/api/admin/funcoes').then(r => r.json()),
      fetch('/api/admin/unidades').then(r => r.json()),
    ])
    setMetas(Array.isArray(m) ? m : [])
    setFuncoes(Array.isArray(f) ? f : [])
    setUnidades(Array.isArray(u) ? u : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() { setForm({ ...EMPTY }); setShowModal(true) }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/metas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          mes: form.periodo === 'mensal' ? form.mes : null,
          trimestre: form.periodo === 'trimestral' ? form.trimestre : null,
        }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Meta criada!' })
      setShowModal(false)
      load()
    } catch {
      toast({ title: 'Erro ao salvar meta', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function toggleAtivo(meta: Meta) {
    await fetch(`/api/admin/metas/${meta.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !meta.ativo }),
    })
    load()
  }

  async function deletar(id: string) {
    if (!confirm('Excluir esta meta?')) return
    await fetch(`/api/admin/metas/${id}`, { method: 'DELETE' })
    toast({ title: 'Meta excluída' })
    load()
  }

  function periodLabel(m: Meta) {
    if (m.periodo === 'mensal') return `${MESES[(m.mes ?? 1) - 1]}/${m.ano}`
    return `${TRIMESTRES[(m.trimestre ?? 1) - 1]} ${m.ano}`
  }

  const funcaoOptions = funcoes.map(f => ({ value: f.id, label: f.name }))
  const unidadeOptions = unidades.map(u => ({ value: u, label: u }))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Metas de Pontuação</h1>
          <p className="text-slate-400 text-sm mt-0.5">Defina alvos de pontos por período, função ou unidade</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/25 hover:-translate-y-0.5 transition-all">
          <Plus className="w-4 h-4" /> Nova meta
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>
      ) : metas.length === 0 ? (
        <div className="rounded-2xl bg-white/3 border border-white/8 p-12 text-center text-slate-500">
          Nenhuma meta cadastrada ainda.
        </div>
      ) : (
        <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
          <div className="divide-y divide-white/5">
            {metas.map((meta, i) => (
              <motion.div key={meta.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 px-5 py-4">
                <div className={`w-2 h-2 rounded-full shrink-0 ${meta.ativo ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{meta.titulo}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300">
                      {meta.meta.toLocaleString('pt-BR')} pts
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                      {periodLabel(meta)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {meta.funcao ? meta.funcao.name : 'Todas as funções'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {meta.units.length > 0 ? meta.units.join(', ') : 'Todas as unidades'}
                    </span>
                    {meta.funcoesMeta.length > 0 && (
                      <span className="flex items-center gap-1 text-amber-400/70">
                        <Target className="w-3 h-3" />
                        Resp: {meta.funcoesMeta.length} função{meta.funcoesMeta.length > 1 ? 'ões' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleAtivo(meta)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${meta.ativo
                      ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5 hover:bg-emerald-400/10'
                      : 'text-slate-500 border-white/10 bg-white/5 hover:text-white'}`}>
                    {meta.ativo ? 'Ativa' : 'Inativa'}
                  </button>
                  <button onClick={() => deletar(meta.id)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-brand-400" />
                <h2 className="text-white font-semibold">Nova meta</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Título */}
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Título *</label>
                <input value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                  placeholder="Ex: Meta comercial julho"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50" />
              </div>

              {/* Meta de pontos */}
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Meta de pontos *</label>
                <input type="number" min={1} value={form.meta}
                  onChange={e => setForm(p => ({ ...p, meta: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50" />
              </div>

              {/* Período */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Período *</label>
                  <div className="relative">
                    <select value={form.periodo}
                      onChange={e => setForm(p => ({ ...p, periodo: e.target.value }))}
                      className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50">
                      <option value="mensal">Mensal</option>
                      <option value="trimestral">Trimestral</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">
                    {form.periodo === 'mensal' ? 'Mês' : 'Trimestre'} *
                  </label>
                  <div className="relative">
                    {form.periodo === 'mensal' ? (
                      <select value={form.mes ?? 1}
                        onChange={e => setForm(p => ({ ...p, mes: Number(e.target.value) }))}
                        className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50">
                        {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                      </select>
                    ) : (
                      <select value={form.trimestre ?? 1}
                        onChange={e => setForm(p => ({ ...p, trimestre: Number(e.target.value) }))}
                        className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50">
                        {TRIMESTRES.map((t, i) => <option key={i} value={i + 1}>{t}</option>)}
                      </select>
                    )}
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Ano */}
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Ano *</label>
                <div className="relative">
                  <select value={form.ano} onChange={e => setForm(p => ({ ...p, ano: Number(e.target.value) }))}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50">
                    {[ANO_ATUAL - 1, ANO_ATUAL, ANO_ATUAL + 1].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Operações */}
              <MultiSelect
                label="Operações (opcional — vazio = todas)"
                options={unidadeOptions}
                selected={form.units}
                onChange={units => setForm(p => ({ ...p, units }))}
                placeholder="Nenhuma unidade cadastrada"
              />

              {/* Funções responsáveis */}
              <MultiSelect
                label="Funções responsáveis pela meta (opcional — vazio = todas)"
                options={funcaoOptions}
                selected={form.funcoesMeta}
                onChange={funcoesMeta => setForm(p => ({ ...p, funcoesMeta }))}
                placeholder="Nenhuma função cadastrada"
              />

              {/* Função de matching (opcional) */}
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Filtro por função individual (opcional)</label>
                <div className="relative">
                  <select value={form.funcaoId ?? ''}
                    onChange={e => setForm(p => ({ ...p, funcaoId: e.target.value || null }))}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50">
                    <option value="">Todas as funções</option>
                    {funcoes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm transition-colors">
                Cancelar
              </button>
              <button onClick={save} disabled={saving || !form.titulo || !form.meta}
                className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar meta'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
