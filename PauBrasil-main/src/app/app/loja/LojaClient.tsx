'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Loader2, ShoppingCart, Target } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

interface Product {
  id: string
  title: string
  description?: string
  pointsCost: number
  stock?: number
  active: boolean
  _count?: { orders: number }
}

interface Balance { confirmed: number }

const PRODUCT_ICONS = ['🎫', '🏖️', '🎁', '🍿', '📚', '⛽', '🎮', '☕']

export default function LojaClient({ fallbackData }: { fallbackData?: any }) {
  const { toast } = useToast()
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [pinning, setPinning] = useState<string | null>(null)

  const { data, mutate, isLoading } = useSWR(
    'dashboard_loja_data',
    async () => {
      const [prods, pts, targetData] = await Promise.all([
        fetch('/api/loja').then(r => r.json()),
        fetch('/api/pontos').then(r => r.json()),
        fetch('/api/me/target').then(r => r.json())
      ])
      return { products: prods, balance: pts.balance, targetData }
    },
    { fallbackData, revalidateOnFocus: true, dedupingInterval: 60000 }
  )

  const products: Product[] = data?.products ?? []
  const balance: Balance | null = data?.balance ?? null
  const targetId: string | null = data?.targetData?.targetReward?.id ?? null

  // 🎯 Optimistic UI para fixar a Meta
  async function handlePinTarget(productId: string | null) {
    setPinning(productId || 'unpin')
    const optimisticData = {
      ...data,
      targetData: { targetReward: productId ? { id: productId } : null }
    }
    try {
      await mutate(
        fetch('/api/me/target', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rewardId: productId })
        }).then(async res => {
          if (!res.ok) throw new Error('Falha ao fixar meta')
          toast({ title: productId ? '🎯 Meta fixada com sucesso!' : 'Meta removida.' })
          return optimisticData
        }),
        { optimisticData, rollbackOnError: true, revalidate: false }
      )
    } catch(e) {
      toast({ title: 'Erro ao fixar meta', variant: 'destructive' })
    } finally {
      setPinning(null)
    }
  }

  // 🛒 Optimistic UI para o Resgate de Produtos
  async function handleRedeem(productId: string) {
    setRedeeming(productId)
    setConfirmId(null) // Fecha o modal instantaneamente
    
    const product = products.find(p => p.id === productId)
    if (!product) { setRedeeming(null); return }

    // Deduz o saldo do usuário na hora (ilusão de zero-latency)
    const optimisticData = {
      ...data,
      balance: { confirmed: (balance?.confirmed ?? 0) - product.pointsCost },
      products: products.map(p => p.id === productId && p.stock !== undefined && p.stock !== null ? { ...p, stock: p.stock - 1 } : p)
    }

    try {
      await mutate(
        fetch('/api/loja', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        }).then(async res => {
          const resData = await res.json()
          if (!res.ok) throw new Error(resData.error)
          toast({ title: '🎉 Resgate solicitado!', description: 'Acompanhe em "Meus Resgates".' })
          return optimisticData // Confirma o estado otimista até o revalidate rodar
        }),
        { optimisticData, rollbackOnError: true, revalidate: true }
      )
    } catch (e: any) {
      toast({ title: e.message || 'Erro ao resgatar', variant: 'destructive' })
    } finally {
      setRedeeming(null)
    }
  }

  if (isLoading && !data) return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32 rounded-lg" />
          <Skeleton className="h-3 w-48 rounded-full" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/8 bg-white/3 p-5 flex flex-col space-y-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-4 w-3/4 rounded-full" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-2/3 rounded-full" />
            <div className="pt-2 space-y-2 mt-auto">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-12 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-xl" />
              </div>
              <Skeleton className="h-8 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header com saldo animado */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Loja de Recompensas</h1>
          <p className="text-slate-400 text-sm">Troque seus pontos por benefícios</p>
        </div>
        {balance && (
          <div className="text-right">
            <motion.div key={balance.confirmed} initial={{ scale: 1.1, color: '#10b981' }} animate={{ scale: 1, color: '#fb923c' }} className="flex items-center gap-1.5 font-bold">
              <Star className="w-4 h-4" />
              {balance.confirmed.toLocaleString('pt-BR')} pts
            </motion.div>
            <div className="text-xs text-slate-500">Disponível</div>
          </div>
        )}
      </div>

      {/* Dialog de Confirmação */}
      <AnimatePresence>
        {confirmId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setConfirmId(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-[#111118] rounded-2xl border border-white/10 p-6 max-w-sm w-full shadow-2xl">
              {(() => {
                const product = products.find(p => p.id === confirmId)!
                return (
                  <>
                    <div className="text-3xl mb-3 text-center">🎁</div>
                    <h3 className="text-white font-display font-bold text-lg text-center mb-1">{product.title}</h3>
                    <p className="text-slate-400 text-sm text-center mb-4">{product.description}</p>
                    <div className="flex items-center justify-center gap-1.5 text-brand-400 font-bold text-lg mb-6"><Star className="w-5 h-5" /> {product.pointsCost.toLocaleString('pt-BR')} pontos</div>
                    <div className="flex gap-3">
                      <button onClick={() => setConfirmId(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors">Cancelar</button>
                      <button onClick={() => handleRedeem(confirmId)} disabled={!!redeeming} className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                        {redeeming === confirmId ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />} Confirmar
                      </button>
                    </div>
                  </>
                )
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid de Produtos (Layout Animado) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {products.map((product, i) => {
            const canAfford = (balance?.confirmed ?? 0) >= product.pointsCost
            const outOfStock = product.stock !== null && product.stock !== undefined && product.stock <= 0

            return (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.04 }}
                className={`group rounded-2xl border p-5 flex flex-col transition-all duration-300
                  ${outOfStock ? 'opacity-50 bg-white/2 border-white/5' : 'bg-white/5 backdrop-blur-md border-white/10 hover:border-brand-500/30 hover:bg-brand-500/5 hover:-translate-y-1 hover:shadow-xl shadow-black/20'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{PRODUCT_ICONS[i % PRODUCT_ICONS.length]}</div>
                  {(product._count?.orders ?? 0) >= 5 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/25 text-brand-400 font-medium shrink-0">
                      🔥 {product._count!.orders} resgates
                    </span>
                  )}
                </div>
                <h3 className="text-white font-display font-semibold text-sm leading-tight mb-1">{product.title}</h3>
                <p className="text-slate-500 text-xs mb-auto pb-4 leading-relaxed">{product.description}</p>

                {product.stock !== null && product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
                  <div className="text-[10px] text-orange-400 font-medium mb-3">Últimas {product.stock} unidades</div>
                )}
                {product.stock !== null && product.stock !== undefined && product.stock > 5 && (
                  <div className="text-xs text-slate-600 mb-3">{product.stock} disponíveis</div>
                )}

                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-brand-400 font-bold text-sm">
                      <Star className="w-3.5 h-3.5" />{product.pointsCost.toLocaleString('pt-BR')}
                    </div>
                    <button onClick={() => setConfirmId(product.id)} disabled={!canAfford || outOfStock || !!redeeming}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all
                        ${canAfford && !outOfStock ? 'gradient-brand text-white shadow-md shadow-brand-500/20 hover:shadow-brand-500/40 focus-visible:ring-2 focus-visible:ring-brand-400' : 'bg-white/5 text-slate-600 cursor-not-allowed'}`}
                    >
                      {outOfStock ? 'Esgotado' : !canAfford ? 'Saldo insuf.' : redeeming === product.id ? 'Resgatando...' : 'Resgatar'}
                    </button>
                  </div>
                  
                  <button onClick={() => targetId === product.id ? handlePinTarget(null) : handlePinTarget(product.id)} disabled={!!pinning}
                    className={`px-3 py-2 mt-1 rounded-xl text-xs font-semibold flex justify-center items-center gap-1.5 transition-all border w-full
                      ${targetId === product.id ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20 shadow-[0_0_12px_rgba(249,115,22,0.15)]' : 'bg-white/3 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                  >
                    {pinning === product.id || (pinning === 'unpin' && targetId === product.id)
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : targetId === product.id ? <><Target className="w-3.5 h-3.5" /> Foco Atual (Remover)</> : <><Target className="w-3.5 h-3.5" /> Fixar como Meta</>
                    }
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}