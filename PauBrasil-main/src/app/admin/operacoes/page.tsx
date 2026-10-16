'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Plus, Pencil, Trash2, X, Loader2, Navigation, Check, AlertTriangle } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

interface Operation {
  id: string
  slug: string
  name: string
  latitude: number
  longitude: number
  radiusMeters: number
}

const EMPTY_FORM = { slug: '', name: '', latitude: '', longitude: '', radiusMeters: '200' }

export default function AdminOperacoesPage() {
  const [ops, setOps] = useState<Operation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Operation | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Operation | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchOps = () => {
    setLoading(true)
    fetch('/api/admin/operacoes')
      .then(r => r.json())
      .then(d => { setOps(Array.isArray(d) ? d : []); setLoading(false) })
  }

  useEffect(() => { fetchOps() }, [])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(op: Operation) {
    setEditing(op)
    setForm({
      slug: op.slug,
      name: op.name,
      latitude: String(op.latitude),
      longitude: String(op.longitude),
      radiusMeters: String(op.radiusMeters),
    })
    setShowForm(true)
  }

  function captureGPS() {
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(p => ({
          ...p,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }))
        setGpsLoading(false)
        toast({ title: '📍 Localização capturada!' })
      },
      () => {
        setGpsLoading(false)
        toast({ title: 'Não foi possível obter o GPS', variant: 'destructive' })
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        name: form.name,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        radiusMeters: parseInt(form.radiusMeters),
        ...(!editing && { slug: form.slug }),
      }
      const url = editing ? `/api/admin/operacoes/${editing.id}` : '/api/admin/operacoes'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar')
      toast({ title: editing ? '✅ Filial atualizada!' : '✅ Filial criada!' })
      setShowForm(false)
      fetchOps()
    } catch (e: any) {
      toast({ title: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/operacoes/${confirmDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao deletar')
      toast({ title: '✅ Filial removida.' })
      setConfirmDelete(null)
      fetchOps()
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
            <MapPin className="w-6 h-6 text-brand-400" /> Filiais
          </h1>
          <p className="text-slate-400 text-sm mt-1">Gerencie os locais de check-in e suas coordenadas GPS</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 transition-all">
          <Plus className="w-4 h-4" /> Nova filial
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {ops.map((op, i) => (
            <motion.div key={op.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold">{op.name}</p>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  {op.latitude.toFixed(4)}, {op.longitude.toFixed(4)} · raio {op.radiusMeters}m
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(op)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setConfirmDelete(op)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
          {ops.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">Nenhuma filial cadastrada.</div>
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
                <h3 className="text-white font-display font-bold">{editing ? 'Editar filial' : 'Nova filial'}</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                {!editing && (
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5">Slug (URL) *</label>
                    <input required value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                      placeholder="ex: patos, barra-da-estiva"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Nome da filial *</label>
                  <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="ex: Patos"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-slate-400 font-medium">Coordenadas GPS *</label>
                    <button type="button" onClick={captureGPS} disabled={gpsLoading}
                      className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 disabled:opacity-50 transition-colors">
                      {gpsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                      {gpsLoading ? 'Obtendo...' : 'Usar minha localização'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-600 block mb-1">Latitude</label>
                      <input required value={form.latitude} onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))}
                        placeholder="-7.015300"
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono placeholder-slate-700 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 block mb-1">Longitude</label>
                      <input required value={form.longitude} onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))}
                        placeholder="-37.281600"
                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono placeholder-slate-700 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                    </div>
                  </div>
                  {form.latitude && form.longitude && (
                    <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
                      <Check className="w-3 h-3" /> {parseFloat(form.latitude).toFixed(6)}, {parseFloat(form.longitude).toFixed(6)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Raio permitido (metros)</label>
                  <input type="number" min={50} max={2000} value={form.radiusMeters}
                    onChange={e => setForm(p => ({ ...p, radiusMeters: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                  <p className="text-xs text-slate-600 mt-1">Distância máxima do centro da filial. Padrão: 200m</p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? 'Salvar' : 'Criar filial'}
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
                <h3 className="text-white font-bold text-lg">Remover filial?</h3>
                <p className="text-slate-400 text-sm mt-1">
                  <span className="text-white font-medium">{confirmDelete.name}</span> será removida. O histórico de visitas é mantido.
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
