'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, Clock, CheckCircle, Truck, XCircle, Loader2 } from 'lucide-react'

interface Order {
  id: string
  status: 'REQUESTED' | 'APPROVED' | 'DELIVERED' | 'CANCELED'
  pointsCost: number
  createdAt: string
  product: { title: string; description?: string }
}

const STATUS_CONFIG = {
  REQUESTED: { label: 'Solicitado',  icon: Clock,        color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  APPROVED:  { label: 'Aprovado',   icon: CheckCircle,  color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/30' },
  DELIVERED: { label: 'Entregue',   icon: Truck,        color: 'text-emerald-400',bg: 'bg-emerald-400/10 border-emerald-400/30' },
  CANCELED:  { label: 'Cancelado',  icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/30' },
}

export default function ResgatesPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/resgates').then(r => r.json()).then(data => {
      setOrders(data)
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Meus Resgates</h1>
        <p className="text-slate-400 text-sm">Histórico dos seus pedidos</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl bg-white/3 border border-white/8 p-10 text-center">
          <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Você ainda não fez nenhum resgate.</p>
          <p className="text-slate-600 text-xs mt-1">Vá até a Loja para trocar seus pontos!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => {
            const cfg = STATUS_CONFIG[order.status]
            const Icon = cfg.icon
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl bg-white/3 border border-white/8 p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl shrink-0">🎁</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{order.product.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    <span className="mx-1">·</span>
                    {order.pointsCost.toLocaleString('pt-BR')} pts
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium shrink-0 ${cfg.bg} ${cfg.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {cfg.label}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
