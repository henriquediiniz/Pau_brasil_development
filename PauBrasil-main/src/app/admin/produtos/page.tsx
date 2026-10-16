'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, ToggleLeft, ToggleRight, Loader2, X, Star } from 'lucide-react'
import { toast } from '@/components/ui/toaster'

interface Product {
  id: string
  title: string
  description?: string
  pointsCost: number
  stock?: number | null
  active: boolean
  emoji?: string
}

const EMOJIS = ['🎁','🎫','🏖️','🍿','📚','⛽','🎮','☕','🛒','🎯','🏆','💳','🍕','🎬','✈️','🎧','💡','🎊','🍦','🍺','🍻','🥂','🍾','🥃','🫗','🍶','🫖','🧊','🍹','🧃','🥤','🫙']

const EMPTY_FORM = { title: '', description: '', pointsCost: '', stock: '', emoji: '🎁' }

export default function AdminProdutosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const fetchProducts = () => {
    fetch('/api/admin/produtos')
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false) })
  }

  useEffect(() => { fetchProducts() }, [])

  function openCreate() {
    setEditingProduct(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(product: Product) {
    setEditingProduct(product)
    setForm({
      title: product.title,
      description: product.description ?? '',
      pointsCost: String(product.pointsCost),
      stock: product.stock != null ? String(product.stock) : '',
      emoji: product.emoji ?? '🎁',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        title: form.title,
        description: form.description || undefined,
        pointsCost: parseInt(form.pointsCost),
        stock: form.stock ? parseInt(form.stock) : null,
        emoji: form.emoji,
      }

      let res
      if (editingProduct) {
        res = await fetch(`/api/admin/produtos/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/admin/produtos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      if (!res.ok) throw new Error()
      toast({ title: editingProduct ? '✅ Produto atualizado!' : '✅ Produto criado!' })
      setShowForm(false)
      setEditingProduct(null)
      setForm(EMPTY_FORM)
      fetchProducts()
    } catch {
      toast({ title: 'Erro ao salvar produto', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/produtos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    fetchProducts()
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
          <h1 className="text-2xl font-display font-bold text-white">Produtos da Loja</h1>
          <p className="text-slate-400 text-sm">{products.length} produtos cadastrados</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 transition-all">
          <Plus className="w-4 h-4" /> Novo produto
        </button>
      </div>

      {/* Modal criar/editar */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111118] rounded-2xl border border-white/10 p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-display font-bold">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                <button onClick={() => { setShowForm(false); setEditingProduct(null) }} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Emoji picker */}
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Ícone do produto</label>
                  <div className="relative">
                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 w-full text-left transition-all">
                      <span className="text-2xl">{form.emoji}</span>
                      <span className="text-sm text-slate-400">Clique para escolher o emoji</span>
                    </button>
                    <AnimatePresence>
                      {showEmojiPicker && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                          className="absolute top-full left-0 mt-2 z-10 bg-[#1a1a28] border border-white/10 rounded-2xl p-3 shadow-2xl">
                          <div className="grid grid-cols-5 gap-1">
                            {EMOJIS.map(emoji => (
                              <button key={emoji} type="button"
                                onClick={() => { setForm(p => ({ ...p, emoji })); setShowEmojiPicker(false) }}
                                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center hover:bg-white/10 transition-colors
                                  ${form.emoji === emoji ? 'bg-brand-500/20 ring-2 ring-brand-500' : ''}`}>
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Campos de texto */}
                {[
                  { label: 'Nome', key: 'title', placeholder: 'Ex: Vale-Refeição Extra', required: true },
                  { label: 'Descrição', key: 'description', placeholder: 'Descrição opcional...' },
                  { label: 'Custo em pontos', key: 'pointsCost', placeholder: '200', type: 'number', required: true },
                  { label: 'Estoque (opcional)', key: 'stock', placeholder: 'Deixe vazio = ilimitado', type: 'number' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5">{field.label}{field.required && ' *'}</label>
                    <input
                      type={field.type ?? 'text'}
                      placeholder={field.placeholder}
                      value={(form as any)[field.key]}
                      onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      required={field.required}
                      min={field.type === 'number' ? 1 : undefined}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                    />
                  </div>
                ))}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowForm(false); setEditingProduct(null) }}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingProduct ? 'Salvar alterações' : 'Criar produto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de produtos */}
      <div className="space-y-3">
        {products.map((product, i) => (
          <motion.div key={product.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className={`rounded-2xl border p-4 flex items-center gap-4 transition-opacity ${product.active ? 'bg-white/3 border-white/8' : 'bg-white/1 border-white/5 opacity-60'}`}>
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-lg shrink-0">
              {product.emoji ?? '🎁'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-medium truncate">{product.title}</span>
                {!product.active && <span className="text-xs px-1.5 py-0.5 rounded-md bg-slate-500/20 text-slate-500">Inativo</span>}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <div className="flex items-center gap-1 text-brand-400 text-xs font-bold">
                  <Star className="w-3 h-3" />{product.pointsCost.toLocaleString('pt-BR')}
                </div>
                {product.stock != null && <span className="text-xs text-slate-500">Estoque: {product.stock}</span>}
                {product.description && <span className="text-xs text-slate-600 truncate hidden sm:block">{product.description}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => toggleActive(product.id, product.active)}
                className={`transition-colors ${product.active ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-600 hover:text-slate-400'}`}
                aria-label={product.active ? 'Desativar' : 'Ativar'}>
                {product.active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              </button>
              <button onClick={() => openEdit(product)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Editar produto">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
