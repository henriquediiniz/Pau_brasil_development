'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, Clock, CheckCircle, Truck, XCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Order {
  id: string
  status: 'REQUESTED' | 'APPROVED' | 'DELIVERED' | 'CANCELED'
  pointsCost: number
  createdAt: string
  user: { name: string; email: string }
  product: { title: string }
}

const STATUS_CONFIG = {
  REQUESTED: { label: 'Solicitado', icon: Clock,        color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  APPROVED:  { label: 'Aprovado',  icon: CheckCircle,  color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/30' },
  DELIVERED: { label: 'Entregue',  icon: Truck,        color: 'text-emerald-400',bg: 'bg-emerald-400/10 border-emerald-400/30' },
  CANCELED:  { label: 'Cancelado', icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/30' },
}

const NEXT_STATUSES: Record<string, string[]> = {
  REQUESTED: ['APPROVED', 'CANCELED'],
  APPROVED: ['DELIVERED', 'CANCELED'],
  DELIVERED: [],
  CANCELED: [],
}

export default function AdminPedidosPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'REQUESTED' | 'APPROVED'>('all')

  const fetchOrders = () => {
    fetch('/api/admin/pedidos')
      .then(r => r.json())
      .then(data => { setOrders(data); setLoading(false) })
  }

  useEffect(() => { fetchOrders() }, [])

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    try {
      const res = await fetch(`/api/admin/pedidos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      toast({ title: `Status atualizado para ${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label}` })
      fetchOrders()
    } catch {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    } finally {
      setUpdating(null)
    }
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Pedidos de Resgate</h1>
        <p className="text-slate-400 text-sm">{orders.length} pedidos no total</p>
      </div>

      <div className="flex gap-2">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'REQUESTED', label: 'Pendentes' },
          { key: 'APPROVED', label: 'Aprovados' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key as any)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all
              ${filter === f.key ? 'bg-brand-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-sm">Nenhum pedido.</div>
        )}
        {filtered.map((order, i) => {
          const cfg = STATUS_CONFIG[order.status]
          const Icon = cfg.icon
          const nextStatus = NEXT_STATUSES[order.status]
          return (
            <motion.div key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="rounded-2xl bg-white/3 border border-white/8 p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-white font-medium">{order.product.title}</span>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {order.user.name} · {order.pointsCost.toLocaleString('pt-BR')} pts ·{' '}
                  {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
              {nextStatus.length > 0 && (
                <div className="flex gap-2 shrink-0">
                  {nextStatus.map(status => {
                    const isCancelAction = status === 'CANCELED'
                    return (
                      <button key={status} onClick={() => updateStatus(order.id, status)} disabled={updating === order.id}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-50
                          ${isCancelAction
                            ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                            : 'gradient-brand text-white shadow-sm'}`}>
                        {updating === order.id ? '...' : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label}
                      </button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
