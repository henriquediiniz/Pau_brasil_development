'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { FileText, Loader2, Search, Download, CheckCircle2, Star, GraduationCap, Printer } from 'lucide-react'
import Image from 'next/image'
import { getNivelLabel } from '@/lib/user-display'

interface UserOption { id: string; name: string; photoUrl: string | null; funcao?: string }

interface Relatorio {
  usuario: {
    id: string; name: string; email: string; unit?: string; company?: string
    nivel: string; photoUrl?: string; createdAt: string
    function?: { name: string }
  }
  pontos: { total: number; mes: number; semana: number }
  tarefas: {
    total: number; aprovadas: number
    historico: {
      id: string; date: string; status: string; pointsEarned: number
      taskDefinition: { title: string; function?: { name: string } }
    }[]
  }
  certificados: { id: string; emitidoEm: string; temporada: { titulo: string } }[]
  geradoEm: string
}

export default function RelatorioPage() {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<UserOption[]>([])
  const [selected, setSelected] = useState<UserOption | null>(null)
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const debounce = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (query.length < 2) { setUsers([]); return }
    clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      setSearching(true)
      const res = await fetch(`/api/usuarios/buscar?q=${encodeURIComponent(query)}`)
      if (res.ok) setUsers(await res.json())
      setSearching(false)
    }, 300)
  }, [query])

  async function selectUser(u: UserOption) {
    setSelected(u)
    setUsers([])
    setQuery('')
    setLoading(true)
    const res = await fetch(`/api/relatorio/${u.id}`)
    if (res.ok) setRelatorio(await res.json())
    setLoading(false)
  }

  function handlePrint() {
    window.print()
  }

  function downloadCSV() {
    if (!relatorio) return
    const rows = [
      ['Data', 'Tarefa', 'Função', 'Status', 'Pontos'],
      ...relatorio.tarefas.historico.map(t => [
        new Date(t.date).toLocaleDateString('pt-BR'),
        t.taskDefinition.title,
        t.taskDefinition.function?.name ?? '',
        t.status,
        t.pointsEarned,
      ]),
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_${relatorio.usuario.name.replace(/ /g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Relatório de Desempenho</h1>
        <p className="text-slate-400 text-sm mt-0.5">Selecione um colaborador para gerar o relatório</p>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus-within:border-brand-500/50 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
          {searching ? <Loader2 className="w-4 h-4 text-slate-500 animate-spin shrink-0" /> : <Search className="w-4 h-4 text-slate-500 shrink-0" />}
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar colaborador pelo nome..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-600" />
        </div>
        {users.length > 0 && (
          <div className="absolute z-10 top-full mt-1.5 left-0 right-0 rounded-xl bg-slate-900 border border-white/10 shadow-xl overflow-hidden">
            {users.map(u => (
              <button key={u.id} onClick={() => selectUser(u)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left">
                <div className="w-8 h-8 rounded-full overflow-hidden gradient-brand flex items-center justify-center shrink-0">
                  {u.photoUrl
                    ? <Image src={u.photoUrl} alt={u.name} width={32} height={32} className="w-full h-full object-cover" />
                    : <span className="text-white text-xs font-bold">{u.name[0]}</span>
                  }
                </div>
                <div>
                  <div className="text-sm text-white font-medium">{u.name}</div>
                  {u.funcao && <div className="text-xs text-slate-500">{u.funcao}</div>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      )}

      {/* Report */}
      {relatorio && !loading && (
        <>
          {/* Actions */}
          <div className="flex gap-2 justify-end print:hidden">
            <button onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-sm transition-colors">
              <Download className="w-4 h-4" /> Exportar CSV
            </button>
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/25">
              <Printer className="w-4 h-4" /> Imprimir / PDF
            </button>
          </div>

          <div ref={printRef} className="space-y-5">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-white/3 border border-white/8 p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl overflow-hidden gradient-brand flex items-center justify-center shrink-0">
                {relatorio.usuario.photoUrl
                  ? <Image src={relatorio.usuario.photoUrl} alt={relatorio.usuario.name} width={56} height={56} className="w-full h-full object-cover" />
                  : <span className="text-white font-bold text-xl">{relatorio.usuario.name[0]}</span>
                }
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-display font-bold text-white">{relatorio.usuario.name}</h2>
                <p className="text-slate-400 text-sm">
                  {relatorio.usuario.function?.name ?? getNivelLabel(relatorio.usuario.nivel)}
                  {relatorio.usuario.unit && ` · ${relatorio.usuario.unit}`}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Relatório gerado em {new Date(relatorio.geradoEm).toLocaleString('pt-BR')}
                </p>
              </div>
              <FileText className="w-6 h-6 text-slate-600 shrink-0" />
            </motion.div>

            {/* Points cards */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total acumulado', value: relatorio.pontos.total, color: 'text-brand-400', bg: 'bg-brand-400/10 border-brand-400/20' },
                { label: 'Este mês', value: relatorio.pontos.mes, color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
                { label: 'Esta semana', value: relatorio.pontos.semana, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' },
              ].map(card => (
                <div key={card.label} className={`rounded-2xl border p-4 ${card.bg}`}>
                  <Star className={`w-4 h-4 ${card.color} mb-2`} />
                  <div className={`text-2xl font-display font-bold ${card.color}`}>{card.value.toLocaleString('pt-BR')}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Task stats */}
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/3 border border-white/8 p-4 flex items-center gap-4">
                <CheckCircle2 className="w-8 h-8 text-brand-400/40 shrink-0" />
                <div>
                  <div className="text-2xl font-display font-bold text-white">{relatorio.tarefas.total}</div>
                  <div className="text-xs text-slate-500">tarefas concluídas</div>
                </div>
              </div>
              <div className="rounded-2xl bg-white/3 border border-white/8 p-4 flex items-center gap-4">
                <GraduationCap className="w-8 h-8 text-brand-400/40 shrink-0" />
                <div>
                  <div className="text-2xl font-display font-bold text-white">{relatorio.certificados.length}</div>
                  <div className="text-xs text-slate-500">certificados UPB</div>
                </div>
              </div>
            </motion.div>

            {/* Certificates */}
            {relatorio.certificados.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}
                className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
                <div className="px-5 py-3 border-b border-white/5">
                  <span className="text-sm font-medium text-white flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-brand-400" /> Certificados
                  </span>
                </div>
                <div className="divide-y divide-white/5">
                  {relatorio.certificados.map(c => (
                    <div key={c.id} className="flex items-center justify-between px-5 py-3">
                      <span className="text-sm text-white">{c.temporada.titulo}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(c.emitidoEm).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Task history */}
            {relatorio.tarefas.historico.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
                className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
                <div className="px-5 py-3 border-b border-white/5">
                  <span className="text-sm font-medium text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-400" />
                    Últimas {relatorio.tarefas.historico.length} tarefas concluídas
                  </span>
                </div>
                <div className="divide-y divide-white/5 max-h-96 overflow-y-auto print:max-h-none">
                  {relatorio.tarefas.historico.map(t => (
                    <div key={t.id} className="flex items-center gap-3 px-5 py-2.5">
                      <div className="w-16 text-xs text-slate-600 shrink-0">
                        {new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{t.taskDefinition.title}</div>
                        {t.taskDefinition.function && (
                          <div className="text-xs text-slate-600">{t.taskDefinition.function.name}</div>
                        )}
                      </div>
                      <div className="text-xs font-medium text-brand-400 shrink-0">
                        +{t.pointsEarned} pts
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
