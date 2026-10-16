'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Users, MapPin, Building2, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Stats { total: number; ativos: number; inativos: number }
interface Operacao { id: string; nome: string; nomeAbrev: string | null }
interface EmpresaInfo { id: string; nome: string; operacoes: Operacao[] }

export default function EmpresaDashboard() {
  const { data: session } = useSession()
  const user = session?.user
  const [stats, setStats] = useState<Stats | null>(null)
  const [empresa, setEmpresa] = useState<EmpresaInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/empresa/usuarios').then(r => r.json()),
      fetch('/api/empresa/operacoes').then(r => r.json()),
    ]).then(([usuarios, operacoes]) => {
      const list = Array.isArray(usuarios) ? usuarios : []
      setStats({
        total: list.length,
        ativos: list.filter((u: any) => u.isActive).length,
        inativos: list.filter((u: any) => !u.isActive).length,
      })
      setEmpresa({
        id: user?.empresaId ?? '',
        nome: user?.company ?? 'Minha Empresa',
        operacoes: Array.isArray(operacoes) ? operacoes : [],
      })
      setLoading(false)
    })
  }, [user?.empresaId, user?.company])

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-3">
          <Building2 className="w-3 h-3" />
          Painel da Empresa
        </div>
        <h1 className="text-2xl font-display font-bold text-white">{empresa?.nome}</h1>
        <p className="text-slate-400 text-sm">Gerencie os colaboradores e operações da sua empresa</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: stats?.total ?? 0, color: 'text-white' },
          { label: 'Ativos', value: stats?.ativos ?? 0, color: 'text-emerald-400' },
          { label: 'Inativos', value: stats?.inativos ?? 0, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-white/3 border border-white/8 p-4 text-center">
            <div className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Operações */}
      {empresa && empresa.operacoes.length > 0 && (
        <div className="rounded-2xl bg-white/3 border border-white/8 p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-brand-400" />
            <span className="text-sm text-white font-medium">Operações cadastradas</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {empresa.operacoes.map(op => (
              <span key={op.id} className="px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs">
                {op.nomeAbrev || op.nome}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Links rápidos */}
      <div className="grid gap-3">
        <Link href="/empresa/usuarios"
          className="group flex items-center gap-4 p-5 rounded-2xl bg-white/3 border border-white/8 hover:border-brand-500/30 hover:bg-brand-500/5 transition-all">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-brand-400" />
          </div>
          <div className="flex-1">
            <div className="text-white font-medium">Colaboradores</div>
            <div className="text-slate-500 text-xs mt-0.5">Criar e gerenciar usuários da empresa</div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  )
}
