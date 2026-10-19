'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, Plus, Pencil, Trash2, X, Check, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

interface Funcao { id: string; name: string; description?: string | null; empresaId: string | null }

export default function FunctionsPage() {
  const [funcoes, setFuncoes] = useState<Funcao[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; funcao?: Funcao } | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Funcao | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    const res = await fetch('/api/admin/funcoes')
    if (res.ok) setFuncoes(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() { setForm({ name: '', description: '' }); setModal({ mode: 'create' }) }
  function openEdit(f: Funcao) { setForm({ name: f.name, description: f.description ?? '' }); setModal({ mode: 'edit', funcao: f }) }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const isEdit = modal?.mode === 'edit'
      const url = isEdit ? `/api/admin/funcoes/${modal!.funcao!.id}` : '/api/admin/funcoes'
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: isEdit ? '✅ Função atualizada!' : '✅ Função criada!' })
      setModal(null)
      load()
    } catch (e: any) {
      toast({ title: e.message || 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function deleteFuncao() {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/funcoes/${confirmDelete.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: '✅ Função removida.' })
      setConfirmDelete(null)
      load()
    } catch (e: any) {
      toast({ title: e.message || 'Erro ao excluir', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const proprias = funcoes

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Funções</h1>
          <p className="text-slate-400 text-sm">Cargos e funções dos colaboradores da empresa</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 transition-all">
          <Plus className="w-4 h-4" /> Nova função
        </button>
      </div>

      {/* Funções da empresa */}
      {proprias.length > 0 && (
        <div className="space-y-2">
          {proprias.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-white/3 border border-white/8 group hover:border-white/12 transition-colors">
              <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{f.name}</p>
                {f.description && <p className="text-slate-500 text-xs mt-0.5 truncate">{f.description}</p>}
              </div>
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(f)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setConfirmDelete(f)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {proprias.length === 0 && (
        <div className="rounded-2xl bg-white/3 border border-white/8 p-10 text-center">
          <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Nenhuma função cadastrada ainda.</p>
          <p className="text-slate-600 text-xs mt-1">Crie funções para atribuir aos colaboradores.</p>
        </div>
      )}

      {/* Modal criar/editar */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-white/10 p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-display font-bold">
                  {modal.mode === 'create' ? 'Nova Função' : 'Editar Função'}
                </h3>
                <button onClick={() => setModal(null)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Nome *</label>
                  <input
                    autoFocus value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ex: Vendedor, Estoquista, Motorista..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Descrição <span className="text-slate-600">(opcional)</span></label>
                  <textarea
                    value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={2} placeholder="Breve descrição da função..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 transition-all resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                  Cancelar
                </button>
                <button onClick={save} disabled={saving || !form.name.trim()}
                  className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmação excluir */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-red-500/20 p-6 max-w-sm w-full shadow-2xl text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-white font-display font-bold">Excluir &quot;{confirmDelete.name}&quot;?</h3>
              <p className="text-slate-400 text-sm mt-1 mb-4">Colaboradores com esta função serão desvinculados.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-medium disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={deleteFuncao} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
