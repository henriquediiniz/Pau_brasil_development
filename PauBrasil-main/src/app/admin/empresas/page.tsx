'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Plus, Loader2, X, Check, Pencil, Trash2, ChevronDown, ChevronRight, MapPin, ShieldCheck, UserPlus } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

interface Operacao {
  id: string; nome: string; nomeAbrev: string | null; ativo: boolean; ordem: number
}

interface TIUser {
  id: string; name: string; email: string
}

interface Empresa {
  id: string; nome: string; slug: string; ativo: boolean; createdAt: string
  operacoes: Operacao[]
  _count: { usuarios: number }
  usuarios: TIUser[]
}

const EMPTY_TI = { name: '', email: '', password: '' }

const EMPTY_EMP = { nome: '', slug: '' }
const EMPTY_OP  = { nome: '', nomeAbrev: '' }

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function AdminEmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Empresa form
  const [showEmpForm, setShowEmpForm] = useState(false)
  const [editEmp, setEditEmp] = useState<Empresa | null>(null)
  const [empForm, setEmpForm] = useState(EMPTY_EMP)
  const [savingEmp, setSavingEmp] = useState(false)

  // TI admin form
  const [showTiModal, setShowTiModal] = useState<string | null>(null) // empresaId
  const [tiForm, setTiForm] = useState(EMPTY_TI)
  const [savingTi, setSavingTi] = useState(false)

  // Operação form
  const [showOpForm, setShowOpForm] = useState<string | null>(null) // empresaId
  const [editOp, setEditOp] = useState<Operacao | null>(null)
  const [opForm, setOpForm] = useState(EMPTY_OP)
  const [savingOp, setSavingOp] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/empresas').then(r => r.json()).then(d => { setEmpresas(d); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  function openCreateEmp() {
    setEditEmp(null); setEmpForm(EMPTY_EMP); setShowEmpForm(true)
  }
  function openEditEmp(e: Empresa) {
    setEditEmp(e); setEmpForm({ nome: e.nome, slug: e.slug }); setShowEmpForm(true)
  }

  async function submitEmp(ev: React.FormEvent) {
    ev.preventDefault(); setSavingEmp(true)
    try {
      const slug = empForm.slug || slugify(empForm.nome)
      const res = await fetch(
        editEmp ? `/api/admin/empresas/${editEmp.id}` : '/api/admin/empresas',
        { method: editEmp ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...empForm, slug }) }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar')
      toast({ title: editEmp ? '✅ Empresa atualizada' : '✅ Empresa criada' })
      setShowEmpForm(false); load()
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }) }
    finally { setSavingEmp(false) }
  }

  async function toggleEmpAtivo(e: Empresa) {
    await fetch(`/api/admin/empresas/${e.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !e.ativo }),
    })
    load()
  }

  async function submitTi(ev: React.FormEvent, empresaId: string) {
    ev.preventDefault(); setSavingTi(true)
    try {
      const res = await fetch(`/api/admin/empresas/${empresaId}/ti`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tiForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar TI')
      toast({ title: '✅ Usuário TI criado' })
      setShowTiModal(null); setTiForm(EMPTY_TI); load()
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }) }
    finally { setSavingTi(false) }
  }

  async function revokeTi(empresaId: string, userId: string) {
    await fetch(`/api/admin/empresas/${empresaId}/ti`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isEmpresaAdmin: false }),
    })
    toast({ title: 'Acesso TI removido' })
    load()
  }

  function openCreateOp(empresaId: string) {
    setEditOp(null); setOpForm(EMPTY_OP); setShowOpForm(empresaId)
  }
  function openEditOp(empresaId: string, op: Operacao) {
    setEditOp(op); setOpForm({ nome: op.nome, nomeAbrev: op.nomeAbrev ?? '' }); setShowOpForm(empresaId)
  }

  async function submitOp(ev: React.FormEvent, empresaId: string) {
    ev.preventDefault(); setSavingOp(true)
    try {
      const url = editOp
        ? `/api/admin/empresas/${empresaId}/operacoes/${editOp.id}`
        : `/api/admin/empresas/${empresaId}/operacoes`
      const res = await fetch(url, {
        method: editOp ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro')
      toast({ title: editOp ? '✅ Operação atualizada' : '✅ Operação adicionada' })
      setShowOpForm(null); load()
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }) }
    finally { setSavingOp(false) }
  }

  async function toggleOpAtivo(empresaId: string, op: Operacao) {
    await fetch(`/api/admin/empresas/${empresaId}/operacoes/${op.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !op.ativo }),
    })
    load()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Empresas & Operações</h1>
          <p className="text-slate-400 text-sm">Cadastre as empresas e suas unidades/cidades</p>
        </div>
        <button onClick={openCreateEmp}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 transition-all">
          <Plus className="w-4 h-4" /> Nova empresa
        </button>
      </div>

      <div className="space-y-3">
        {empresas.map(emp => (
          <div key={emp.id} className={`rounded-2xl border transition-all ${emp.ativo ? 'bg-white/3 border-white/8' : 'bg-white/1 border-white/5 opacity-60'}`}>
            {/* Cabeçalho da empresa */}
            <div className="flex items-center gap-4 px-5 py-4">
              <button onClick={() => setExpanded(expanded === emp.id ? null : emp.id)}
                className="text-slate-500 hover:text-white transition-colors">
                {expanded === emp.id
                  ? <ChevronDown className="w-4 h-4" />
                  : <ChevronRight className="w-4 h-4" />}
              </button>
              <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{emp.nome}</span>
                  {!emp.ativo && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">Inativa</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {emp._count.usuarios} colaborador{emp._count.usuarios !== 1 ? 'es' : ''} ·{' '}
                  {emp.operacoes.filter(o => o.ativo).length} operaç{emp.operacoes.filter(o => o.ativo).length !== 1 ? 'ões' : 'ão'} ativa{emp.operacoes.filter(o => o.ativo).length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEditEmp(emp)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors" title="Editar">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => toggleEmpAtivo(emp)}
                  className={`p-1.5 rounded-lg transition-colors ${emp.ativo ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                  title={emp.ativo ? 'Desativar' : 'Reativar'}>
                  {emp.ativo ? <Trash2 className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Operações expandidas */}
            <AnimatePresence>
              {expanded === emp.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-white/5">
                  <div className="px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Operações / Unidades</span>
                      <button onClick={() => openCreateOp(emp.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs hover:bg-brand-500/20 transition-colors">
                        <Plus className="w-3 h-3" /> Adicionar
                      </button>
                    </div>

                    {/* Form inline de operação */}
                    <AnimatePresence>
                      {showOpForm === emp.id && (
                        <motion.form initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          onSubmit={e => submitOp(e, emp.id)}
                          className="flex gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                          <input
                            required value={opForm.nome} onChange={e => setOpForm(p => ({ ...p, nome: e.target.value }))}
                            placeholder="Nome completo (ex: Pau Brasil Patos)"
                            className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50" />
                          <input
                            value={opForm.nomeAbrev} onChange={e => setOpForm(p => ({ ...p, nomeAbrev: e.target.value }))}
                            placeholder="Abrev. (ex: Patos)"
                            className="w-28 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50" />
                          <button type="submit" disabled={savingOp}
                            className="px-3 py-1.5 rounded-lg gradient-brand text-white text-xs font-medium flex items-center gap-1 disabled:opacity-50">
                            {savingOp ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            {editOp ? 'Salvar' : 'Criar'}
                          </button>
                          <button type="button" onClick={() => { setShowOpForm(null); setEditOp(null) }}
                            className="p-1.5 text-slate-500 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </motion.form>
                      )}
                    </AnimatePresence>

                    {emp.operacoes.length === 0 ? (
                      <p className="text-xs text-slate-600 py-2">Nenhuma operação cadastrada.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {emp.operacoes.map(op => (
                          <div key={op.id}
                            className={`flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg border text-xs transition-all
                              ${op.ativo ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white/2 border-white/5 text-slate-600 line-through'}`}>
                            <MapPin className="w-2.5 h-2.5 text-brand-400 shrink-0" />
                            <span>{op.nomeAbrev || op.nome}</span>
                            <div className="flex items-center gap-0.5 ml-1">
                              <button onClick={() => openEditOp(emp.id, op)}
                                className="p-0.5 text-slate-600 hover:text-white transition-colors" title="Editar">
                                <Pencil className="w-2.5 h-2.5" />
                              </button>
                              <button onClick={() => toggleOpAtivo(emp.id, op)}
                                className={`p-0.5 transition-colors ${op.ativo ? 'text-slate-600 hover:text-red-400' : 'text-emerald-600 hover:text-emerald-400'}`}
                                title={op.ativo ? 'Desativar' : 'Reativar'}>
                                {op.ativo ? <Trash2 className="w-2.5 h-2.5" /> : <Check className="w-2.5 h-2.5" />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* TI Admins */}
                    <div className="pt-3 border-t border-white/5 mt-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">Administradores TI</span>
                        <button onClick={() => { setTiForm(EMPTY_TI); setShowTiModal(emp.id) }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs hover:bg-brand-500/20 transition-colors">
                          <UserPlus className="w-3 h-3" /> Novo TI
                        </button>
                      </div>
                      {emp.usuarios.length === 0 ? (
                        <p className="text-xs text-slate-600">Nenhum TI definido.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {emp.usuarios.map(u => (
                            <div key={u.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/3 border border-white/8 text-xs">
                              <ShieldCheck className="w-3 h-3 text-brand-400 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="text-slate-200 font-medium">{u.name}</span>
                                <span className="text-slate-500 ml-1.5">{u.email}</span>
                              </div>
                              <button onClick={() => revokeTi(emp.id, u.id)}
                                className="p-0.5 text-slate-600 hover:text-red-400 transition-colors" title="Revogar acesso TI">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Modal Novo TI */}
      <AnimatePresence>
        {showTiModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-white/10 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand-400" />
                  <h3 className="text-white font-display font-bold">Novo Usuário TI</h3>
                </div>
                <button onClick={() => setShowTiModal(null)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={e => submitTi(e, showTiModal)} className="px-5 py-4 space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Nome *</label>
                  <input required value={tiForm.name} onChange={e => setTiForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ex: João TI"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">E-mail *</label>
                  <input required type="email" value={tiForm.email} onChange={e => setTiForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="ti@grupopaubrasil.com.br"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Senha inicial *</label>
                  <input required type="password" value={tiForm.password} onChange={e => setTiForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowTiModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={savingTi}
                    className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                    {savingTi ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Empresa */}
      <AnimatePresence>
        {showEmpForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-white/10 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/8">
                <h3 className="text-white font-display font-bold">{editEmp ? 'Editar Empresa' : 'Nova Empresa'}</h3>
                <button onClick={() => setShowEmpForm(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={submitEmp} className="px-5 py-4 space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Nome da empresa *</label>
                  <input required value={empForm.nome}
                    onChange={e => setEmpForm(p => ({ ...p, nome: e.target.value, slug: slugify(e.target.value) }))}
                    placeholder="Ex: Pau Brasil Motos"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Slug (URL)</label>
                  <input value={empForm.slug} onChange={e => setEmpForm(p => ({ ...p, slug: e.target.value }))}
                    placeholder="pau-brasil-motos"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowEmpForm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={savingEmp}
                    className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                    {savingEmp ? <Loader2 className="w-4 h-4 animate-spin" /> : editEmp ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
