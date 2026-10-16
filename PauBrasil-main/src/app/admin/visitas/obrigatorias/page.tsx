'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, Plus, Pencil, Trash2, X, Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

interface Lider {
  id: string
  name: string
  leaderTitle: string | null
}

interface Operacao {
  id: string
  slug: string
  name: string
}

interface Obrigatoria {
  id: string
  userId: string
  operationSlug: string
  operationName: string
  quantidadeMinima: number
  ativo: boolean
  criadoEm: string
  user: { id: string; name: string; leaderTitle: string | null }
}

const EMPTY_FORM = { userId: '', operationSlug: '', quantidadeMinima: '1' }

export default function AdminVisitasObrigatoriasPage() {
  const [items, setItems]           = useState<Obrigatoria[]>([])
  const [lideres, setLideres]       = useState<Lider[]>([])
  const [operacoes, setOperacoes]   = useState<Operacao[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editing, setEditing]       = useState<Obrigatoria | null>(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Obrigatoria | null>(null)
  const [deleting, setDeleting]     = useState(false)
  const [toggling, setToggling]     = useState<string | null>(null)

  const fetchAll = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/visitas/obrigatorias').then(r => r.json()),
      fetch('/api/admin/visitas/obrigatorias/lideres').then(r => r.json()),
      fetch('/api/admin/operacoes').then(r => r.json()),
    ]).then(([obs, lids, ops]) => {
      setItems(Array.isArray(obs) ? obs : [])
      setLideres(Array.isArray(lids) ? lids : [])
      setOperacoes(Array.isArray(ops) ? ops : [])
      setLoading(false)
    })
  }

  useEffect(() => { fetchAll() }, [])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(ob: Obrigatoria) {
    setEditing(ob)
    setForm({ userId: ob.userId, operationSlug: ob.operationSlug, quantidadeMinima: String(ob.quantidadeMinima) })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const url    = '/api/admin/visitas/obrigatorias'
      const method = editing ? 'PATCH' : 'POST'
      const body   = editing
        ? { quantidadeMinima: parseInt(form.quantidadeMinima) }
        : { userId: form.userId, operationSlug: form.operationSlug, quantidadeMinima: parseInt(form.quantidadeMinima) }
      const endpoint = editing ? `${url}/${editing.id}` : url
      const res = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar')
      toast({ title: editing ? '✅ Obrigação atualizada!' : '✅ Obrigação criada!' })
      setShowForm(false)
      fetchAll()
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleAtivo(ob: Obrigatoria) {
    setToggling(ob.id)
    try {
      const res = await fetch(`/api/admin/visitas/obrigatorias/${ob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !ob.ativo }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar')
      fetchAll()
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' })
    } finally {
      setToggling(null)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/visitas/obrigatorias/${confirmDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao remover')
      toast({ title: '✅ Obrigação removida.' })
      setConfirmDelete(null)
      fetchAll()
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-brand-400" /> Visitas Obrigatórias
          </h1>
          <p className="text-slate-400 text-sm mt-1">Defina quais filiais cada líder deve visitar mensalmente</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 transition-all">
          <Plus className="w-4 h-4" /> Nova obrigação
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {items.map((ob, i) => (
            <motion.div key={ob.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${ob.ativo ? 'bg-white/5 border-white/10' : 'bg-white/2 border-white/5 opacity-60'}`}>
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5 text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold truncate">{ob.user.name}</p>
                  {ob.user.leaderTitle && (
                    <span className="text-xs text-slate-500 bg-white/5 px-1.5 py-0.5 rounded-md truncate">{ob.user.leaderTitle}</span>
                  )}
                  {!ob.ativo && <span className="text-xs text-slate-600 bg-white/5 px-1.5 py-0.5 rounded-md">inativo</span>}
                </div>
                <p className="text-sm text-slate-400 mt-0.5">
                  {ob.operationName} · <span className="text-brand-300 font-medium">{ob.quantidadeMinima}x/mês</span>
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleToggleAtivo(ob)} disabled={toggling === ob.id}
                  title={ob.ativo ? 'Desativar' : 'Ativar'}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50">
                  {toggling === ob.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : ob.ativo ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => openEdit(ob)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setConfirmDelete(ob)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
          {items.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">Nenhuma obrigação cadastrada.</div>
          )}
        </div>
      )}

      {/* Modal criar/editar */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/8">
                <h3 className="text-white font-display font-bold">{editing ? 'Editar obrigação' : 'Nova obrigação'}</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                {!editing && (
                  <>
                    <div>
                      <label className="text-xs text-slate-400 font-medium block mb-1.5">Líder *</label>
                      <select required value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all">
                        <option value="">Selecione um líder</option>
                        {lideres.map(l => (
                          <option key={l.id} value={l.id}>{l.name}{l.leaderTitle ? ` — ${l.leaderTitle}` : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 font-medium block mb-1.5">Filial *</label>
                      <select required value={form.operationSlug} onChange={e => setForm(p => ({ ...p, operationSlug: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all">
                        <option value="">Selecione uma filial</option>
                        {operacoes.map(op => (
                          <option key={op.id} value={op.slug}>{op.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Visitas mínimas por mês *</label>
                  <input type="number" required min={1} max={31} value={form.quantidadeMinima}
                    onChange={e => setForm(p => ({ ...p, quantidadeMinima: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                  <p className="text-xs text-slate-600 mt-1">Número mínimo de check-ins válidos (GPS + face) por mês</p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal confirmar delete */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-red-500/20 p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Remover obrigação?</h3>
                <p className="text-slate-400 text-sm mt-1">
                  <span className="text-white font-medium">{confirmDelete.user.name}</span> — {confirmDelete.operationName} será removida. O histórico de visitas é mantido.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-medium hover:text-white transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Remover</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
