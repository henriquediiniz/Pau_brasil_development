'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Trash2, UserCheck, X } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

/**
 * Cadastros pendentes (pedidos de acesso vindos de /registro): lista, aprovar e rejeitar.
 *
 * Era o mesmo código copiado em /admin/usuarios e /empresa/usuarios; só muda a API
 * (o admin vê todas as empresas e por isso mostra a coluna Empresa).
 */
export type ApiCadastros = '/api/admin' | '/api/empresa'

interface Pendente {
  id: string
  name: string
  email: string
  note?: string | null
  createdAt: string
  empresa?: { id: string; nome: string }
  function?: { id: string; name: string } | null
}

const NIVEIS = ['COLABORADOR', 'SUPERVISOR', 'COORDENADOR', 'GERENTE', 'DIRETOR', 'PRESIDENTE']

/** Total de pendentes, para o contador da aba. */
export function useTotalPendentes(api: ApiCadastros) {
  const [total, setTotal] = useState(0)
  const atualizar = () => {
    fetch(`${api}/registros-pendentes?status=PENDING`)
      .then((r) => r.json())
      .then((data) => setTotal(data.total ?? 0))
      .catch(() => {})
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(atualizar, [api])
  return [total, setTotal, atualizar] as const
}

export function CadastrosPendentes({
  api,
  managers,
  mostrarEmpresa = false,
  onTotal,
}: {
  api: ApiCadastros
  managers: { id: string; name: string }[]
  mostrarEmpresa?: boolean
  onTotal?: (total: number) => void
}) {
  const [lista, setLista] = useState<Pendente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aprovando, setAprovando] = useState<Pendente | null>(null)
  const [formAprovar, setFormAprovar] = useState({ nivel: 'COLABORADOR', managerId: '' })
  const [salvandoAprovar, setSalvandoAprovar] = useState(false)
  const [rejeitando, setRejeitando] = useState<Pendente | null>(null)
  const [motivo, setMotivo] = useState('')
  const [salvandoRejeitar, setSalvandoRejeitar] = useState(false)

  const carregar = () => {
    setCarregando(true)
    fetch(`${api}/registros-pendentes?status=PENDING`)
      .then((r) => r.json())
      .then((data) => {
        setLista(data.registros ?? [])
        onTotal?.(data.total ?? 0)
      })
      .catch(() => {})
      .finally(() => setCarregando(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(carregar, [api])

  async function aprovar() {
    if (!aprovando) return
    setSalvandoAprovar(true)
    try {
      const res = await fetch(`${api}/registros-pendentes/${aprovando.id}/aprovar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nivel: formAprovar.nivel, operationIds: [], managerId: formAprovar.managerId || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao aprovar')
      toast({ title: `✅ ${aprovando.name} aprovado!` })
      setAprovando(null)
      carregar()
    } catch (e: any) {
      toast({ title: e.message || 'Erro ao aprovar', variant: 'destructive' })
    } finally {
      setSalvandoAprovar(false)
    }
  }

  async function rejeitar() {
    if (!rejeitando) return
    setSalvandoRejeitar(true)
    try {
      const res = await fetch(`${api}/registros-pendentes/${rejeitando.id}/rejeitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: motivo || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao rejeitar')
      toast({ title: `Cadastro de ${rejeitando.name} rejeitado.` })
      setRejeitando(null)
      setMotivo('')
      carregar()
    } catch (e: any) {
      toast({ title: e.message || 'Erro ao rejeitar', variant: 'destructive' })
    } finally {
      setSalvandoRejeitar(false)
    }
  }

  const colunas = ['Nome', 'E-mail', ...(mostrarEmpresa ? ['Empresa'] : []), 'Função', 'Mensagem', 'Data', '']

  return (
    <>
      <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
        {carregando ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
        ) : lista.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">Nenhuma solicitação pendente.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {colunas.map((h) => (
                    <th key={h} className="text-left text-xs text-slate-500 font-medium px-4 py-3 last:pr-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {lista.map((reg, i) => (
                  <motion.tr key={reg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shrink-0">
                          <span className="text-white font-bold text-xs">{reg.name[0]}</span>
                        </div>
                        <span className="text-sm text-white font-medium">{reg.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{reg.email}</td>
                    {mostrarEmpresa && <td className="px-4 py-3 text-xs text-slate-400">{reg.empresa?.nome ?? '—'}</td>}
                    <td className="px-4 py-3 text-xs text-slate-400">{reg.function?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[160px] truncate" title={reg.note ?? ''}>{reg.note || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(reg.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 pr-5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setAprovando(reg); setFormAprovar({ nivel: 'COLABORADOR', managerId: '' }) }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                          <UserCheck className="w-3 h-3" /> Aprovar
                        </button>
                        <button onClick={() => { setRejeitando(reg); setMotivo('') }}
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

      {/* Modal aprovar cadastro */}
      <AnimatePresence>
        {aprovando && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-white/10 p-6 max-w-sm w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-display font-bold">Aprovar cadastro</h3>
                <button onClick={() => setAprovando(null)} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-slate-400">{aprovando.name}</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Nível hierárquico</label>
                  <select value={formAprovar.nivel} onChange={(e) => setFormAprovar((p) => ({ ...p, nivel: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500">
                    {NIVEIS.map((v) => (
                      <option key={v} value={v} className="bg-[#111118]">{v.charAt(0) + v.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Gestor responsável <span className="text-slate-600">(opcional)</span></label>
                  <select value={formAprovar.managerId} onChange={(e) => setFormAprovar((p) => ({ ...p, managerId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500">
                    <option value="" className="bg-[#111118]">Sem gestor</option>
                    {managers.map((m) => <option key={m.id} value={m.id} className="bg-[#111118]">{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setAprovando(null)} disabled={salvandoAprovar}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={aprovar} disabled={salvandoAprovar}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {salvandoAprovar ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserCheck className="w-4 h-4" /> Confirmar</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal rejeitar cadastro */}
      <AnimatePresence>
        {rejeitando && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-red-500/20 p-6 max-w-sm w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-display font-bold">Rejeitar cadastro</h3>
                <button onClick={() => setRejeitando(null)} className="text-slate-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-slate-400">Rejeitar solicitação de <strong className="text-white">{rejeitando.name}</strong>?</p>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Motivo <span className="text-slate-600">(opcional)</span></label>
                <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} maxLength={500}
                  placeholder="Explique o motivo da rejeição..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setRejeitando(null)} disabled={salvandoRejeitar}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={rejeitar} disabled={salvandoRejeitar}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {salvandoRejeitar ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Rejeitar</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
