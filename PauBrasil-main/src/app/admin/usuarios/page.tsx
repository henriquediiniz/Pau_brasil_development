'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import {
  Users, Plus, Search, Loader2, Pencil, X, Eye, EyeOff, Check,
  Trash2, AlertTriangle, UserCheck, ChevronDown, ChevronRight,
  Shield, ShieldCheck, ShieldAlert, BookOpen, Building2,
  CheckSquare, Send,
} from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { CadastrosPendentes } from '@/components/usuarios/CadastrosPendentes'
import { canManageTeamByNivel, isSystemAdminRole } from '@/lib/auth-helpers'
import { getInviteStatus } from '@/lib/user-status'
import { ADMIN_NIVEL_OPTIONS, getNivelLabel } from '@/lib/user-display'

interface UserItem {
  id: string
  name: string
  email: string
  role: string
  nivel: string
  isActive: boolean
  isUPBAdmin: boolean
  isEmpresaAdmin?: boolean
  company?: string
  units?: string[]
  operationIds?: string[]
  createdAt: string
  mustChangePassword?: boolean
  passwordResetExpiresAt?: string | null
  function?: { name: string }
  functionId?: string
  managerId?: string
  manager?: { name: string }
  empresaId?: string
}

interface FuncItem { id: string; name: string }
interface ManagerItem { id: string; name: string; role: string; nivel: string }
interface EmpresaItem { id: string; nome: string; operacoes: { id: string; nome: string; nomeAbrev: string | null }[] }

interface PendingItem {
  id: string; name: string; email: string; note?: string | null; status: string; createdAt: string
  empresa: { id: string; nome: string }; function?: { id: string; name: string } | null
}

const ROLE_DEFS = [
  {
    value: 'USER',
    label: 'Colaborador',
    desc: 'Acesso padrão ao portal',
    icon: Shield,
    color: 'text-slate-400',
    bg: 'bg-slate-500/10 border-slate-500/30',
    bgActive: 'bg-slate-500/20 border-slate-400/50',
  },
  {
    value: 'RH_ADMIN',
    label: 'RH Admin',
    desc: 'Gerencia usuários e cadastros',
    icon: ShieldCheck,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/30',
    bgActive: 'bg-purple-500/20 border-purple-400/50',
  },
  {
    value: 'SYS_ADMIN',
    label: 'Sys Admin',
    desc: 'Acesso total ao sistema',
    icon: ShieldAlert,
    color: 'text-brand-400',
    bg: 'bg-brand-500/10 border-brand-500/30',
    bgActive: 'bg-brand-500/20 border-brand-400/50',
  },
] as const

type RoleValue = 'USER' | 'RH_ADMIN' | 'SYS_ADMIN'

const MODULE_DEFS = [
  { key: 'isUPBAdmin' as const, label: 'Admin UPB', desc: 'Gerencia cursos, episódios e certificados', icon: BookOpen, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20', bgActive: 'bg-sky-500/20 border-sky-400/40' },
  { key: 'isEmpresaAdmin' as const, label: 'Admin de Empresa', desc: 'Configura dados e operações da empresa', icon: Building2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', bgActive: 'bg-emerald-500/20 border-emerald-400/40' },
]

type AccessFilter = 'todos' | 'admin' | 'upb'

const EMPTY_FORM = {
  name: '', email: '', password: '',
  role: 'USER' as RoleValue,
  nivel: 'COLABORADOR',
  isUPBAdmin: false, isEmpresaAdmin: false,
  functionId: '', empresaId: '', units: [] as string[], operationIds: [] as string[], managerId: '',
}

// Badges de acesso rápido exibidos na tabela
function AccessBadges({ user }: { user: UserItem }) {
  const badges: { label: string; cls: string }[] = []
  if (user.isUPBAdmin) badges.push({ label: 'UPB', cls: 'bg-sky-500/15 text-sky-400 border-sky-500/30' })
  if (user.isEmpresaAdmin) badges.push({ label: 'Empresa', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' })
  if (badges.length === 0) return <span className="text-slate-600 text-xs">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {badges.map(b => (
        <span key={b.label} className={`px-1.5 py-0.5 rounded-md border text-[10px] font-semibold tracking-wide ${b.cls}`}>
          {b.label}
        </span>
      ))}
    </div>
  )
}

// Badge de nível/role na tabela
function RoleBadge({ user }: { user: UserItem }) {
  if (user.role === 'SYS_ADMIN') return <span className="px-2 py-0.5 rounded-full border text-xs font-medium bg-brand-500/10 text-brand-400 border-brand-500/20">Admin</span>
  if (user.role === 'RH_ADMIN') return <span className="px-2 py-0.5 rounded-full border text-xs font-medium bg-purple-500/10 text-purple-400 border-purple-500/20">RH Admin</span>
  return <span className="px-2 py-0.5 rounded-full border text-xs font-medium bg-slate-500/10 text-slate-400 border-slate-500/20">{getNivelLabel(user.nivel)}</span>
}

export default function AdminUsuariosPage() {
  const { data: session } = useSession()
  const actorIsSysAdmin = session?.user?.role === 'SYS_ADMIN'

  const [users, setUsers] = useState<UserItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [functions, setFunctions] = useState<FuncItem[]>([])
  const [empresas, setEmpresas] = useState<EmpresaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('') // input controlado — só aplica no Enter/blur
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('todos')
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

  // Pending registrations state
  const [pendingCount, setPendingCount] = useState(0)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const [confirmPurge, setConfirmPurge] = useState<UserItem | null>(null)
  const [purging, setPurging] = useState(false)

  const selectedEmpresa = empresas.find(e => e.id === form.empresaId)
  const availableUnits = selectedEmpresa?.operacoes ?? []

  const managers = useMemo<ManagerItem[]>(() =>
    users
      .filter(u => canManageTeamByNivel(u.nivel))
      .map(u => ({ id: u.id, name: u.name, role: u.role, nivel: u.nivel })),
    [users]
  )

  const fetchUsers = (p = page) => {
    if (statusFilter === 'pendentes') return
    setLoading(true)
    const params = new URLSearchParams({
      page:   String(p),
      status: statusFilter,
      ...(accessFilter !== 'todos' ? { access: accessFilter } : {}),
      ...(search ? { search } : {}),
    })
    fetch(`/api/admin/usuarios?${params}`)
      .then(r => r.json())
      .then(data => {
        setUsers(data.users ?? [])
        setTotal(data.total ?? 0)
        setTotalPages(data.totalPages ?? 1)
        setLoading(false)
      })
  }

  const fetchPendingCount = () => {
    fetch('/api/admin/registros-pendentes?status=PENDING')
      .then(r => r.json())
      .then(data => setPendingCount(data.total ?? 0))
      .catch(() => {})
  }

  // A aba de pendentes carrega a própria lista (CadastrosPendentes)
  useEffect(() => {
    if (statusFilter !== 'pendentes') fetchUsers(page)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, search, accessFilter])

  useEffect(() => { fetchPendingCount() }, [])

  useEffect(() => {
    fetch('/api/admin/empresas').then(r => r.json()).then(d => setEmpresas(Array.isArray(d) ? d : []))
    fetch('/api/admin/funcoes').then(r => r.json()).then(setFunctions)
  }, [])

  function openCreate() {
    setEditingUser(null)
    setForm(EMPTY_FORM)
    setShowPwd(false)
    setShowForm(true)
  }

  function openEdit(user: UserItem) {
    setEditingUser(user)
    const role: RoleValue = isSystemAdminRole(user.role)
      ? (user.role as RoleValue)
      : 'USER'
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role,
      nivel: user.nivel ?? 'COLABORADOR',
      isUPBAdmin: user.isUPBAdmin ?? false,
      isEmpresaAdmin: user.isEmpresaAdmin ?? false,
      functionId: user.functionId ?? '',
      empresaId: user.empresaId ?? '',
      units: user.units ?? [],
      operationIds: user.operationIds ?? [],
      managerId: user.managerId ?? '',
    })
    setShowPwd(false)
    setShowForm(true)
  }

  function toggleUnit(id: string) {
    setForm(p => ({
      ...p,
      operationIds: p.operationIds.includes(id) ? p.operationIds.filter(u => u !== id) : [...p.operationIds, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const empresaNome = empresas.find(e => e.id === form.empresaId)?.nome ?? ''
      const body: Record<string, unknown> = {
        name: form.name,
        functionId: form.functionId || undefined,
        operationIds: form.operationIds,
        managerId: form.managerId || undefined,
      }

      if (actorIsSysAdmin || !editingUser) {
        body.company = empresaNome || undefined
        body.empresaId = form.empresaId || undefined
      }

      if (actorIsSysAdmin) {
        Object.assign(body, {
          role: form.role,
          nivel: form.nivel,
          isUPBAdmin: form.isUPBAdmin,
          isEmpresaAdmin: form.isEmpresaAdmin,
        })
      }

      let res: Response
      if (editingUser) {
        if (form.password) body.password = form.password
        res = await fetch(`/api/admin/usuarios/${editingUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        body.email = form.email
        body.password = form.password
        res = await fetch('/api/admin/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      const data = await res.json()
      if (!res.ok) {
        const msg = data.error?.fieldErrors
          ? Object.values(data.error.fieldErrors).flat().join(', ')
          : data.error
        throw new Error(msg || 'Erro ao salvar')
      }

      if (!editingUser && data.setupUrl && navigator.clipboard) {
        await navigator.clipboard.writeText(data.setupUrl).catch(() => {})
        toast({ title: 'Usuário criado. Link de primeiro acesso copiado.' })
      } else {
        toast({ title: editingUser ? 'Usuário atualizado!' : 'Usuário criado!' })
      }
      setShowForm(false)
      setEditingUser(null)
      fetchUsers()
    } catch (e: unknown) {
      toast({ title: (e as Error).message || 'Erro ao salvar usuário', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate() {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${confirmDelete.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao desativar')
      toast({ title: '✅ Acesso do colaborador revogado.' })
      setConfirmDelete(null)
      fetchUsers()
    } catch (e: unknown) {
      toast({ title: (e as Error).message || 'Erro ao desativar usuário', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  async function handleReativar(user: UserItem) {
    setReativando(user.id)
    try {
      const res = await fetch(`/api/admin/usuarios/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })
      if (!res.ok) throw new Error('Erro ao reativar')
      toast({ title: '✅ Colaborador reativado.' })
      fetchUsers()
    } catch {
      toast({ title: 'Erro ao reativar usuário', variant: 'destructive' })
    } finally {
      setReativando(null)
    }
  }

  async function handleReenviarConvite(user: UserItem) {
    setReenviando(user.id)
    try {
      const res = await fetch(`/api/admin/usuarios/${user.id}/reenviar-convite`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro')
      if (data.setupUrl && navigator.clipboard) {
        await navigator.clipboard.writeText(data.setupUrl).catch(() => {})
        toast({ title: '🔗 Link de convite copiado para a área de transferência.' })
      } else {
        toast({ title: '✅ Convite reenviado.' })
      }
      fetchUsers()
    } catch (e: any) {
      toast({ title: e.message ?? 'Erro ao reenviar convite', variant: 'destructive' })
    } finally {
      setReenviando(null)
    }
  }

  async function handleBulkDeactivate() {
    setBulkDeleting(true)
    try {
      const res = await fetch('/api/admin/usuarios/bulk-deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao desativar')
      toast({ title: `✅ ${data.deactivated} colaborador(es) desativado(s).` })
      setSelected(new Set())
      setConfirmBulk(false)
      fetchUsers()
    } catch (e: unknown) {
      toast({ title: (e as Error).message || 'Erro ao desativar', variant: 'destructive' })
    } finally {
      setBulkDeleting(false)
    }
  }

  async function handlePurge() {
    if (!confirmPurge) return
    setPurging(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${confirmPurge.id}/purge`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao purgar conta')
      toast({ title: `✅ Conta de ${confirmPurge.name} removida. E-mail liberado para novo cadastro.` })
      setConfirmPurge(null)
      fetchUsers()
    } catch (e: unknown) {
      toast({ title: (e as Error).message || 'Erro ao purgar conta', variant: 'destructive' })
    } finally {
      setPurging(false)
    }
  }

  // Busca e status vêm do servidor. Filtro de acesso é client-side (sobre a página atual).
  const filtered = users

  // IDs dos usuários ativos visíveis (respeitam filtros ativos)
  const filteredActiveIds = useMemo(
    () => filtered.filter(u => u.isActive).map(u => u.id),
    [filtered]
  )
  const allActiveSelected = filteredActiveIds.length > 0 && filteredActiveIds.every(id => selected.has(id))

  function toggleSelectAll() {
    if (allActiveSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredActiveIds))
    }
  }

  function toggleSelectOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const ACCESS_FILTERS: { key: AccessFilter; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'admin', label: 'Admin' },
    { key: 'upb', label: 'UPB' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Usuários</h1>
          <p className="text-slate-400 text-sm">{total} {statusFilter === 'ativos' ? 'ativos' : 'inativos'}</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 transition-all">
          <Plus className="w-4 h-4" /> Novo usuário
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {/* Ativo / Inativo / Pendentes */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-white/8 shrink-0">
            <button onClick={() => { setStatusFilter('ativos'); setPage(1); setSelected(new Set()) }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === 'ativos' ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30' : 'text-slate-500 hover:text-white'}`}>
              Ativos
            </button>
            <button onClick={() => { setStatusFilter('inativos'); setPage(1); setSelected(new Set()) }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === 'inativos' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-slate-500 hover:text-white'}`}>
              Inativos
            </button>
            <button onClick={() => { setStatusFilter('pendentes'); setPage(1); setSelected(new Set()) }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === 'pendentes' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' : 'text-slate-500 hover:text-white'}`}>
              Pendentes
              {pendingCount > 0 && <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${statusFilter === 'pendentes' ? 'bg-yellow-500/30 text-yellow-200' : 'bg-yellow-500/20 text-yellow-400'}`}>{pendingCount}</span>}
            </button>
          </div>
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1) } }}
              onBlur={() => { if (searchInput !== search) { setSearch(searchInput); setPage(1) } }}
              placeholder="Buscar por nome ou e-mail (Enter para buscar)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
          </div>
        </div>

        {/* Filtro por módulo de acesso */}
        <div className="flex gap-2 flex-wrap">
          {ACCESS_FILTERS.map(f => (
            <button key={f.key} onClick={() => setAccessFilter(f.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${accessFilter === f.key
                ? 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                : 'bg-white/3 border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'}`}>
              {f.label}
            </button>
          ))}
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

      {/* Tabela de pendentes */}
      {statusFilter === 'pendentes' && (
        <CadastrosPendentes api="/api/admin" managers={managers} mostrarEmpresa onTotal={setPendingCount} />
      )}

      {/* Tabela */}
      {statusFilter !== 'pendentes' && <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {statusFilter === 'ativos' && (
                  <th className="px-4 py-3 pl-5 w-8">
                    <input
                      type="checkbox"
                      checked={allActiveSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-white/20 bg-white/5 text-brand-500 cursor-pointer"
                      title="Selecionar todos"
                    />
                  </th>
                )}
                {['Colaborador', 'Função', 'Empresa', 'Nível / Papel', 'Acessos', ''].map(h => (
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
                      <input
                        type="checkbox"
                        checked={selected.has(user.id)}
                        onChange={() => toggleSelectOne(user.id)}
                        className="rounded border-white/20 bg-white/5 text-brand-500 cursor-pointer"
                      />
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
                          {!user.isActive && (
                            <span className="text-xs px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">Inativo</span>
                          )}
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
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-[110px] truncate">{user.company ?? '—'}</td>
                  <td className="px-4 py-3"><RoleBadge user={user} /></td>
                  <td className="px-4 py-3"><AccessBadges user={user} /></td>
                  <td className="px-4 py-3 pr-5">
                    <div className="flex items-center gap-1">
                      {user.isActive ? (
                        <>
                          <button onClick={() => openEdit(user)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors" title="Editar">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {getInviteStatus({ isActive: user.isActive, mustChangePassword: user.mustChangePassword ?? false, passwordResetExpiresAt: user.passwordResetExpiresAt ?? null }) === 'EXPIRED' && (
                            <button onClick={() => handleReenviarConvite(user)} disabled={reenviando === user.id}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors disabled:opacity-50" title="Reenviar convite">
                              {reenviando === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          <button onClick={() => setConfirmDelete(user)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Desativar">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleReativar(user)} disabled={reativando === user.id}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                            {reativando === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
                            Reativar
                          </button>
                          {actorIsSysAdmin && (
                            <button onClick={() => setConfirmPurge(user)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Purgar conta (libera e-mail)">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && !loading && (
            <div className="text-center py-8 text-slate-500 text-sm">Nenhum usuário encontrado.</div>
          )}
        </div>
      </div>}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{total} resultado{total !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); setSelected(new Set()) }}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 hover:text-white disabled:opacity-30 transition-all">
              ← Anterior
            </button>
            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); setSelected(new Set()) }}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 hover:text-white disabled:opacity-30 transition-all">
              Próxima →
            </button>
          </div>
        </div>
      )}

      {/* Modal criar/editar */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh]">

              {/* Header do modal */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/8 shrink-0">
                <h3 className="text-white font-display font-bold">
                  {editingUser ? 'Editar colaborador' : 'Novo colaborador'}
                </h3>
                <button onClick={() => { setShowForm(false); setEditingUser(null) }}
                  className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form id="user-form" onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

                {/* ── Seção 1: Identidade ─────────────────────────────────────── */}
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Identidade</p>

                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5">Nome completo *</label>
                    <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="João Silva"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                  </div>

                  {!editingUser && (
                    <div>
                      <label className="text-xs text-slate-400 font-medium block mb-1.5">E-mail corporativo *</label>
                      <input required type="email" value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="colaborador@grupopaubrasil.com.br"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5">
                      {editingUser ? 'Nova senha (deixe em branco para não alterar)' : 'Senha inicial opcional'}
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
                </div>

                <div className="border-t border-white/8" />

                {/* ── Seção 2: Perfil profissional ────────────────────────────── */}
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Perfil profissional</p>
                    <p className="text-xs text-slate-600 mt-0.5">Define onde o colaborador atua e sua hierarquia</p>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5">Empresa</label>
                    <select value={form.empresaId}
                      onChange={e => setForm(p => ({ ...p, empresaId: e.target.value, units: [], operationIds: [] }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all">
                      <option value="">Selecione...</option>
                      {empresas.map(e => <option key={e.id} value={e.id} className="bg-[#111118]">{e.nome}</option>)}
                    </select>
                  </div>

                  {form.empresaId && availableUnits.length > 0 && (
                    <div>
                      <label className="text-xs text-slate-400 font-medium block mb-1.5">
                        Operações / Unidades
                        {form.operationIds.length > 0 && <span className="ml-2 text-brand-400">{form.operationIds.length} selecionada{form.operationIds.length > 1 ? 's' : ''}</span>}
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {availableUnits.map(op => {
                          const selected = form.operationIds.includes(op.id)
                          return (
                            <button key={op.id} type="button" onClick={() => toggleUnit(op.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all
                                ${selected ? 'bg-brand-500/20 border-brand-500/40 text-brand-300' : 'bg-white/3 border-white/10 text-slate-400 hover:text-white hover:border-white/20'}`}>
                              {selected && <Check className="w-2.5 h-2.5 inline mr-1" />}
                              {op.nomeAbrev ?? op.nome}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 font-medium block mb-1.5">Nível hierárquico</label>
                      <select value={form.nivel} onChange={e => setForm(p => ({ ...p, nivel: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all">
                        {ADMIN_NIVEL_OPTIONS.map(v => (
                          <option key={v} value={v} className="bg-[#111118]">{getNivelLabel(v)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-medium block mb-1.5">Função / Cargo</label>
                      <select value={form.functionId} onChange={e => setForm(p => ({ ...p, functionId: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all">
                        <option value="">Sem função</option>
                        {functions.map(f => <option key={f.id} value={f.id} className="bg-[#111118]">{f.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5">Gestor responsável</label>
                    <select value={form.managerId} onChange={e => setForm(p => ({ ...p, managerId: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all">
                      <option value="">Sem gestor vinculado</option>
                      {managers.map(m => (
                        <option key={m.id} value={m.id} className="bg-[#111118]">
                          {m.name} · {getNivelLabel(m.nivel)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t border-white/8" />

                {/* ── Seção 3: Acessos ao sistema ─────────────────────────────── */}
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Acessos ao sistema</p>
                    <p className="text-xs text-slate-600 mt-0.5">Define o nível de permissão administrativa e módulos especiais</p>
                  </div>

                  {/* Seletor de role */}
                  <div className="grid grid-cols-3 gap-2">
                    {ROLE_DEFS.map(rd => {
                      const Icon = rd.icon
                      const active = form.role === rd.value
                      return (
                        <button key={rd.value} type="button" onClick={() => setForm(p => ({ ...p, role: rd.value as RoleValue }))}
                          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all ${active ? rd.bgActive : rd.bg + ' hover:brightness-110'}`}>
                          <Icon className={`w-4 h-4 ${rd.color}`} />
                          <span className={`text-xs font-semibold ${active ? rd.color : 'text-slate-400'}`}>{rd.label}</span>
                          <span className="text-[10px] text-slate-500 leading-tight">{rd.desc}</span>
                          {active && <Check className={`w-3 h-3 ${rd.color}`} />}
                        </button>
                      )
                    })}
                  </div>

                  {/* Módulos especiais */}
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Módulos especiais</p>
                    <div className="space-y-1.5">
                      {MODULE_DEFS.map(mod => {
                        const Icon = mod.icon
                        const active = form[mod.key]
                        return (
                          <button key={mod.key} type="button"
                            onClick={() => setForm(p => ({ ...p, [mod.key]: !p[mod.key] }))}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${active ? mod.bgActive : mod.bg + ' hover:brightness-110'}`}>
                            <Icon className={`w-4 h-4 shrink-0 ${mod.color}`} />
                            <div className="flex-1 min-w-0">
                              <span className={`text-xs font-medium ${active ? mod.color : 'text-slate-400'}`}>{mod.label}</span>
                              <p className="text-[10px] text-slate-500 truncate">{mod.desc}</p>
                            </div>
                            {active && <Check className={`w-3.5 h-3.5 shrink-0 ${mod.color}`} />}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                </div>
              </form>

              {/* Footer */}
              <div className="flex gap-3 px-5 py-3 border-t border-white/8 shrink-0">
                <button type="button" onClick={() => { setShowForm(false); setEditingUser(null) }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" form="user-form" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingUser ? 'Salvar alterações' : 'Criar colaborador'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal confirmação de desativação */}
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
                  <p className="text-slate-400 text-sm mt-1">
                    O colaborador <span className="text-white font-medium">{confirmDelete.name}</span> não conseguirá mais fazer login no sistema.
                  </p>
                  <p className="text-slate-500 text-xs mt-2">Os dados do colaborador serão mantidos no banco de dados.</p>
                </div>
                <div className="flex gap-3 w-full pt-1">
                  <button onClick={() => setConfirmDelete(null)} disabled={deleting}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-50">
                    Cancelar
                  </button>
                  <button onClick={handleDeactivate} disabled={deleting}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Revogar acesso</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <p className="text-slate-400 text-sm mt-1">
                  Nenhum deles conseguirá mais fazer login no sistema.
                </p>
                <p className="text-slate-500 text-xs mt-2">Os dados serão mantidos e podem ser reativados individualmente.</p>
              </div>
              <div className="flex gap-3 w-full pt-1">
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

      {/* Modal purgar conta */}
      <AnimatePresence>
        {confirmPurge && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-red-500/20 p-6 w-full max-w-sm shadow-2xl flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-white font-display font-bold text-lg">Purgar conta?</h3>
                <p className="text-slate-400 text-sm">
                  O registro de <span className="text-white font-medium">{confirmPurge.name}</span> será excluído permanentemente.
                </p>
                <p className="text-slate-500 text-xs pt-1">
                  O e-mail <span className="text-slate-400">{confirmPurge.email}</span> ficará livre para um novo cadastro.
                  Logs de auditoria são preservados com o nome da pessoa.
                </p>
                <p className="text-red-400/70 text-xs font-medium pt-1">Esta ação é irreversível.</p>
              </div>
              <div className="flex gap-3 w-full pt-1">
                <button onClick={() => setConfirmPurge(null)} disabled={purging}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={handlePurge} disabled={purging}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {purging ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Purgar conta</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  )
}
