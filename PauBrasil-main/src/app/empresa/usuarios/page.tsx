'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Search, Loader2, Pencil, X, Eye, EyeOff, Check, Trash2, AlertTriangle, UserCheck, CheckSquare, Send, ClipboardList } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from '@/components/ui/toaster'
import { canManageTeamByNivel, isSysAdmin } from '@/lib/auth-helpers'
import { getInviteStatus } from '@/lib/user-status'
import { EMPRESA_NIVEL_OPTIONS, getNivelLabel } from '@/lib/user-display'

interface UserItem {
  id: string; name: string; email: string; role: string; nivel: string; isActive: boolean
  isEmpresaAdmin: boolean; company?: string; units?: string[]; operationIds?: string[]
  mustChangePassword?: boolean; passwordResetExpiresAt?: string | null
  function?: { name: string }; functionId?: string; managerId?: string
  manager?: { name: string }
}

interface FuncItem { id: string; name: string }
interface Operacao { id: string; nome: string; nomeAbrev: string | null }

interface PendingItem {
  id: string; name: string; email: string; note?: string | null; status: string; createdAt: string
  empresa: { id: string; nome: string }; function?: { id: string; name: string } | null
}

const EMPTY_FORM = {
  name: '', email: '', password: '', nivel: 'COLABORADOR',
  isEmpresaAdmin: false, functionId: '', units: [] as string[], operationIds: [] as string[], managerId: '',
}

export default function EmpresaUsuariosPage() {
  const { data: session } = useSession()
  const actor = session?.user
  const canSetEmpresaAdmin = actor ? isSysAdmin(actor) : false

  const [users, setUsers] = useState<UserItem[]>([])
  const [functions, setFunctions] = useState<FuncItem[]>([])
  const [operacoes, setOperacoes] = useState<Operacao[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ativos' | 'inativos' | 'pendentes'>('ativos')
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<UserItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [reativando, setReativando] = useState<string | null>(null)
  const [reenviando, setReenviando] = useState<string | null>(null)

  const [pendingList, setPendingList] = useState<PendingItem[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingLoading, setPendingLoading] = useState(false)
  const [approveModal, setApproveModal] = useState<PendingItem | null>(null)
  const [approveForm, setApproveForm] = useState({ nivel: 'COLABORADOR', operationIds: [] as string[], managerId: '' })
  const [approving, setApproving] = useState(false)
  const [rejectModal, setRejectModal] = useState<PendingItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejecting, setRejecting] = useState(false)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const managers = useMemo<UserItem[]>(() =>
    users.filter(u => canManageTeamByNivel(u.nivel)), [users])

  const fetchAll = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/empresa/usuarios').then(r => r.json()),
      fetch('/api/admin/funcoes').then(r => r.json()),
      fetch('/api/empresa/operacoes').then(r => r.json()),
    ]).then(([u, f, o]) => {
      setUsers(Array.isArray(u) ? u : [])
      setFunctions(Array.isArray(f) ? f : [])
      setOperacoes(Array.isArray(o) ? o : [])
      setLoading(false)
    })
  }

  const fetchPending = () => {
    setPendingLoading(true)
    fetch('/api/empresa/registros-pendentes?status=PENDING')
      .then(r => r.json())
      .then(data => { setPendingList(data.registros ?? []); setPendingCount(data.total ?? 0) })
      .catch(() => {})
      .finally(() => setPendingLoading(false))
  }

  const fetchPendingCount = () => {
    fetch('/api/empresa/registros-pendentes?status=PENDING')
      .then(r => r.json())
      .then(data => setPendingCount(data.total ?? 0))
      .catch(() => {})
  }

  useEffect(() => {
    fetchPendingCount()
    fetchAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (statusFilter === 'pendentes') fetchPending()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  function openCreate() {
    setEditingUser(null); setForm(EMPTY_FORM); setShowPwd(false); setShowForm(true)
  }
  function openEdit(user: UserItem) {
    setEditingUser(user)
    setForm({ name: user.name, email: '', password: '', nivel: user.nivel ?? 'COLABORADOR',
      isEmpresaAdmin: user.isEmpresaAdmin ?? false,
      functionId: user.functionId ?? '', units: user.units ?? [], operationIds: user.operationIds ?? [], managerId: user.managerId ?? '' })
    setShowPwd(false); setShowForm(true)
  }

  function toggleUnit(id: string) {
    setForm(p => ({
      ...p, operationIds: p.operationIds.includes(id) ? p.operationIds.filter(u => u !== id) : [...p.operationIds, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try {
      type UserPayload = {
        name: string; nivel: string; isEmpresaAdmin: boolean
        functionId?: string; units: string[]; operationIds: string[]; managerId?: string
        email?: string; password?: string
      }
      const body: UserPayload = {
        name: form.name,
        nivel: form.nivel,
        isEmpresaAdmin: form.isEmpresaAdmin,
        functionId: form.functionId || undefined,
        units: form.units,
        operationIds: form.operationIds,
        managerId: form.managerId || undefined,
      }
      let res: Response
      if (editingUser) {
        if (form.password) body.password = form.password
        res = await fetch(`/api/empresa/usuarios/${editingUser.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
      } else {
        body.email = form.email; body.password = form.password
        res = await fetch('/api/empresa/usuarios', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
      }
      const data = await res.json() as { error?: string | { fieldErrors?: Record<string, string[]> } }
      if (!res.ok) throw new Error(
        typeof data.error === 'object' && data.error?.fieldErrors
          ? Object.values(data.error.fieldErrors).flat().join(', ')
          : String(data.error)
      )
      if (!editingUser && (data as any).setupUrl && navigator.clipboard) {
        await navigator.clipboard.writeText((data as any).setupUrl).catch(() => {})
        toast({ title: 'Usuário criado. Link de primeiro acesso copiado.' })
      } else {
        toast({ title: editingUser ? 'Usuário atualizado!' : 'Usuário criado!' })
      }
      setShowForm(false); fetchAll()
    } catch (e: unknown) { toast({ title: (e as Error).message || 'Erro ao salvar', variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  async function handleDeactivate() {
    if (!confirmDelete) return; setDeleting(true)
    try {
      const res = await fetch(`/api/empresa/usuarios/${confirmDelete.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Erro')
      toast({ title: '✅ Acesso revogado.' }); setConfirmDelete(null); fetchAll()
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }) }
    finally { setDeleting(false) }
  }

  async function handleReativar(user: UserItem) {
    setReativando(user.id)
    try {
      await fetch(`/api/empresa/usuarios/${user.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })
      toast({ title: '✅ Colaborador reativado.' }); fetchAll()
    } catch { toast({ title: 'Erro ao reativar', variant: 'destructive' }) }
    finally { setReativando(null) }
  }

  async function handleReenviarConvite(user: UserItem) {
    setReenviando(user.id)
    try {
      const res = await fetch(`/api/empresa/usuarios/${user.id}/reenviar-convite`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro')
      if (data.setupUrl && navigator.clipboard) {
        await navigator.clipboard.writeText(data.setupUrl).catch(() => {})
        toast({ title: '🔗 Link de convite copiado para a área de transferência.' })
      } else {
        toast({ title: '✅ Convite reenviado.' })
      }
      fetchAll()
    } catch (e: any) {
      toast({ title: e.message ?? 'Erro ao reenviar convite', variant: 'destructive' })
    } finally {
      setReenviando(null)
    }
  }

  async function handleBulkDeactivate() {
    setBulkDeleting(true)
    try {
      const res = await fetch('/api/empresa/usuarios/bulk-deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao desativar')
      toast({ title: `✅ ${data.deactivated} colaborador(es) desativado(s).` })
      setSelected(new Set())
      setConfirmBulk(false)
      fetchAll()
    } catch (e: unknown) {
      toast({ title: (e as Error).message || 'Erro ao desativar', variant: 'destructive' })
    } finally {
      setBulkDeleting(false)
    }
  }

  async function handleApprove() {
    if (!approveModal) return
    setApproving(true)
    try {
      const res = await fetch(`/api/empresa/registros-pendentes/${approveModal.id}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nivel: approveForm.nivel, operationIds: approveForm.operationIds, managerId: approveForm.managerId || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao aprovar')
      toast({ title: `✅ ${approveModal.name} aprovado!` })
      setApproveModal(null)
      fetchPending()
    } catch (e: any) {
      toast({ title: e.message || 'Erro ao aprovar', variant: 'destructive' })
    } finally {
      setApproving(false)
    }
  }

  async function handleReject() {
    if (!rejectModal) return
    setRejecting(true)
    try {
      const res = await fetch(`/api/empresa/registros-pendentes/${rejectModal.id}/rejeitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao rejeitar')
      toast({ title: `Cadastro de ${rejectModal.name} rejeitado.` })
      setRejectModal(null)
      setRejectReason('')
      fetchPending()
    } catch (e: any) {
      toast({ title: e.message || 'Erro ao rejeitar', variant: 'destructive' })
    } finally {
      setRejecting(false)
    }
  }

  const ativos = users.filter(u => u.isActive)
  const inativos = users.filter(u => !u.isActive)
  const filtered = (statusFilter === 'ativos' || statusFilter === 'inativos' ? (statusFilter === 'ativos' ? ativos : inativos) : []).filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))

  const filteredActiveIds = useMemo(
    () => filtered.filter(u => u.isActive).map(u => u.id),
    [filtered]
  )
  const allActiveSelected = filteredActiveIds.length > 0 && filteredActiveIds.every(id => selected.has(id))

  function toggleSelectAll() {
    if (allActiveSelected) setSelected(new Set())
    else setSelected(new Set(filteredActiveIds))
  }

  function toggleSelectOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) return <div className="flex items-center justify-center min-h-64"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Colaboradores</h1>
          <p className="text-slate-400 text-sm">{ativos.length} ativos · {inativos.length} inativos</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 transition-all">
          <Plus className="w-4 h-4" /> Novo colaborador
        </button>
      </div>

      {/* Modal criar/editar */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/8 shrink-0">
                <h3 className="text-white font-display font-bold">{editingUser ? 'Editar Colaborador' : 'Novo Colaborador'}</h3>
                <button onClick={() => { setShowForm(false); setEditingUser(null) }} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form id="emp-user-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Nome completo *</label>
                  <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="João Silva"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                </div>

                {!editingUser && (
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5">E-mail *</label>
                    <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="colaborador@grupopaubrasil.com.br"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">
                    {editingUser ? 'Nova senha (em branco para não alterar)' : 'Senha inicial opcional'}
                  </label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      minLength={8} placeholder="Deixe em branco para gerar convite"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                    <button type="button" onClick={() => setShowPwd(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Nível hierárquico</label>
                  <select value={form.nivel} onChange={e => setForm(p => ({ ...p, nivel: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all">
                    {EMPRESA_NIVEL_OPTIONS.map(v => <option key={v} value={v} className="bg-[#111118]">{getNivelLabel(v)}</option>)}
                  </select>
                </div>

                {/* Admin de empresa — só SYS_ADMIN pode definir */}
                {canSetEmpresaAdmin && (
                  <button type="button" onClick={() => setForm(p => ({ ...p, isEmpresaAdmin: !p.isEmpresaAdmin }))}
                    className={`w-full py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 border
                      ${form.isEmpresaAdmin ? 'bg-brand-500/10 border-brand-500/40 text-brand-400' : 'bg-white/3 border-white/10 text-slate-400 hover:text-white'}`}>
                    {form.isEmpresaAdmin && <Check className="w-3 h-3 shrink-0" />} Admin de Empresa (TI)
                  </button>
                )}

                {/* Operações */}
                {operacoes.length > 0 && (
                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5">
                      Operações / Unidades
                      {form.operationIds.length > 0 && <span className="ml-2 text-brand-400">{form.operationIds.length} selecionada{form.operationIds.length > 1 ? 's' : ''}</span>}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {operacoes.map(op => {
                        const sel = form.operationIds.includes(op.id)
                        return (
                          <button key={op.id} type="button" onClick={() => toggleUnit(op.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all
                              ${sel ? 'bg-brand-500/20 border-brand-500/40 text-brand-300' : 'bg-white/3 border-white/10 text-slate-400 hover:text-white hover:border-white/20'}`}>
                            {sel && <Check className="w-2.5 h-2.5 inline mr-1" />}
                            {op.nomeAbrev || op.nome}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Função</label>
                  <select value={form.functionId} onChange={e => setForm(p => ({ ...p, functionId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all">
                    <option value="">Sem função</option>
                    {functions.map(f => <option key={f.id} value={f.id} className="bg-[#111118]">{f.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Gestor responsável</label>
                  <select value={form.managerId} onChange={e => setForm(p => ({ ...p, managerId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all">
                    <option value="">Sem gestor</option>
                    {managers.map(m => <option key={m.id} value={m.id} className="bg-[#111118]">{m.name} · {getNivelLabel(m.nivel)}</option>)}
                  </select>
                </div>
              </form>

              <div className="flex gap-3 px-5 py-3 border-t border-white/8 shrink-0">
                <button type="button" onClick={() => { setShowForm(false); setEditingUser(null) }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" form="emp-user-form" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingUser ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmação desativar */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-red-500/20 p-6 max-w-sm w-full shadow-2xl">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-display font-bold text-lg">Revogar acesso?</h3>
                  <p className="text-slate-400 text-sm mt-1">{confirmDelete.name} não conseguirá mais fazer login.</p>
                </div>
                <div className="flex gap-3 w-full">
                  <button onClick={() => setConfirmDelete(null)} disabled={deleting}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-50">
                    Cancelar
                  </button>
                  <button onClick={handleDeactivate} disabled={deleting}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Revogar</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-white/8 shrink-0">
          <button onClick={() => { setStatusFilter('ativos'); setSelected(new Set()) }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === 'ativos' ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-slate-500 hover:text-white'}`}>
            Ativos <span className="ml-1 text-xs opacity-70">{ativos.length}</span>
          </button>
          <button onClick={() => { setStatusFilter('inativos'); setSelected(new Set()) }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === 'inativos' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-slate-500 hover:text-white'}`}>
            Inativos <span className="ml-1 text-xs opacity-70">{inativos.length}</span>
          </button>
          <button onClick={() => { setStatusFilter('pendentes'); setSelected(new Set()) }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === 'pendentes' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'text-slate-500 hover:text-white'}`}>
            Pendentes
            {pendingCount > 0 && <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${statusFilter === 'pendentes' ? 'bg-yellow-500/30 text-yellow-200' : 'bg-yellow-500/20 text-yellow-400'}`}>{pendingCount}</span>}
          </button>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50" />
        </div>
      </div>

      {/* Barra flutuante de seleção */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[#111118] border border-white/15 shadow-2xl shadow-black/60">
            <CheckSquare className="w-4 h-4 text-brand-400" />
            <span className="text-sm text-white font-medium">{selected.size} selecionado{selected.size > 1 ? 's' : ''}</span>
            <button onClick={() => setConfirmBulk(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors">
              Desativar selecionados
            </button>
            <button onClick={() => setSelected(new Set())}
              className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabela pendentes */}
      {statusFilter === 'pendentes' && (
        <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
          {pendingLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
          ) : pendingList.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">Nenhuma solicitação pendente.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Nome', 'E-mail', 'Função', 'Mensagem', 'Data', ''].map(h => (
                      <th key={h} className="text-left text-xs text-slate-500 font-medium px-4 py-3 last:pr-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pendingList.map((reg, i) => (
                    <motion.tr key={reg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-white/2 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-xs">{reg.name[0]}</span>
                          </div>
                          <div>
                            <div className="text-sm text-white font-medium">{reg.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{reg.email}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{reg.function?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[160px] truncate" title={reg.note ?? ''}>{reg.note || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(reg.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3 pr-5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { setApproveModal(reg); setApproveForm({ nivel: 'COLABORADOR', operationIds: [], managerId: '' }) }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                            <UserCheck className="w-3 h-3" /> Aprovar
                          </button>
                          <button onClick={() => { setRejectModal(reg); setRejectReason('') }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors">
                            <X className="w-3 h-3" /> Rejeitar
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tabela */}
      {statusFilter !== 'pendentes' && <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {statusFilter === 'ativos' && (
                  <th className="px-4 py-3 pl-5 w-8">
                    <input type="checkbox" checked={allActiveSelected} onChange={toggleSelectAll}
                      className="rounded border-white/20 bg-white/5 text-brand-500 cursor-pointer" title="Selecionar todos" />
                  </th>
                )}
                {['Colaborador', 'Função', 'Operações', 'Nível', ''].map(h => (
                  <th key={h} className="text-left text-xs text-slate-500 font-medium px-4 py-3 last:pr-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((user, i) => (
                <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className={`hover:bg-white/2 transition-colors ${!user.isActive ? 'opacity-60' : ''}`}>
                  {statusFilter === 'ativos' && (
                    <td className="px-4 py-3 pl-5 w-8">
                      <input type="checkbox" checked={selected.has(user.id)} onChange={() => toggleSelectOne(user.id)}
                        className="rounded border-white/20 bg-white/5 text-brand-500 cursor-pointer" />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${user.isActive ? 'gradient-brand' : 'bg-slate-700'}`}>
                        <span className="text-white font-bold text-xs">{user.name[0]}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-white font-medium">{user.name}</span>
                          {user.isEmpresaAdmin && <span className="text-xs px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">TI</span>}
                          {user.isActive && (() => {
                            const st = getInviteStatus({ isActive: user.isActive, mustChangePassword: user.mustChangePassword ?? false, passwordResetExpiresAt: user.passwordResetExpiresAt ?? null })
                            if (st === 'INVITED') return <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">Convite pendente</span>
                            if (st === 'EXPIRED') return <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">Convite expirado</span>
                            return null
                          })()}
                        </div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{user.function?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {user.units && user.units.length > 0
                      ? user.units.map(u => operacoes.find(o => o.nome === u)?.nomeAbrev || u).join(', ')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{getNivelLabel(user.nivel)}</td>
                  <td className="px-4 py-3 pr-5">
                    <div className="flex items-center gap-1">
                      {user.isActive ? (
                        <>
                          <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors" title="Editar">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {getInviteStatus({ isActive: user.isActive, mustChangePassword: user.mustChangePassword ?? false, passwordResetExpiresAt: user.passwordResetExpiresAt ?? null }) === 'EXPIRED' && (
                            <button onClick={() => handleReenviarConvite(user)} disabled={reenviando === user.id}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors disabled:opacity-50" title="Reenviar convite">
                              {reenviando === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <button onClick={() => setConfirmDelete(user)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Desativar">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleReativar(user)} disabled={reativando === user.id}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                          {reativando === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
                          Reativar
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-8 text-slate-500 text-sm">Nenhum colaborador encontrado.</div>}
        </div>
      </div>}

      {/* Modal confirmação bulk deactivate */}
      <AnimatePresence>
        {confirmBulk && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-white/10 p-6 w-full max-w-sm shadow-2xl flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div className="text-center">
                <h3 className="text-white font-display font-bold text-lg">Desativar {selected.size} colaborador{selected.size > 1 ? 'es' : ''}?</h3>
                <p className="text-slate-400 text-sm mt-1">Nenhum deles conseguirá mais fazer login no sistema.</p>
                <p className="text-slate-500 text-xs mt-2">Os dados são mantidos e podem ser reativados individualmente.</p>
              </div>
              <div className="flex gap-3 w-full">
                <button onClick={() => setConfirmBulk(false)} disabled={bulkDeleting}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={handleBulkDeactivate} disabled={bulkDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {bulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Desativar todos</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal aprovar cadastro */}
      <AnimatePresence>
        {approveModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-white/10 p-6 max-w-sm w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-display font-bold">Aprovar cadastro</h3>
                <button onClick={() => setApproveModal(null)} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-slate-400">{approveModal.name}</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Nível hierárquico</label>
                  <select value={approveForm.nivel} onChange={e => setApproveForm(p => ({ ...p, nivel: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500">
                    {['COLABORADOR','SUPERVISOR','COORDENADOR','GERENTE','DIRETOR','PRESIDENTE'].map(v => (
                      <option key={v} value={v} className="bg-[#111118]">{v.charAt(0) + v.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Gestor responsável <span className="text-slate-600">(opcional)</span></label>
                  <select value={approveForm.managerId} onChange={e => setApproveForm(p => ({ ...p, managerId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500">
                    <option value="" className="bg-[#111118]">Sem gestor</option>
                    {managers.map(m => <option key={m.id} value={m.id} className="bg-[#111118]">{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setApproveModal(null)} disabled={approving}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={handleApprove} disabled={approving}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserCheck className="w-4 h-4" /> Confirmar</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal rejeitar cadastro */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-red-500/20 p-6 max-w-sm w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-display font-bold">Rejeitar cadastro</h3>
                <button onClick={() => setRejectModal(null)} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-slate-400">Rejeitar solicitação de <strong className="text-white">{rejectModal.name}</strong>?</p>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Motivo <span className="text-slate-600">(opcional)</span></label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} maxLength={500}
                  placeholder="Explique o motivo da rejeição..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setRejectModal(null)} disabled={rejecting}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={handleReject} disabled={rejecting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {rejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Rejeitar</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
