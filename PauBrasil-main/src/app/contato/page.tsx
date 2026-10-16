'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Send, CheckCircle2, Loader2 } from 'lucide-react'
import { PublicBackground } from '@/app/_components/PublicBackground'

type Assunto = 'Candidatura' | 'Parceria' | 'Imprensa' | 'Outro'
type Status = 'idle' | 'sending' | 'success' | 'error'

const ASSUNTOS: Assunto[] = ['Candidatura', 'Parceria', 'Imprensa', 'Outro']

export default function ContatoPage() {
  const [nome, setNome]       = useState('')
  const [email, setEmail]     = useState('')
  const [assunto, setAssunto] = useState<Assunto>('Outro')
  const [mensagem, setMensagem] = useState('')
  const [status, setStatus]   = useState<Status>('idle')
  const [erro, setErro]       = useState<string | null>(null)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setErro(null)

    try {
      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, assunto, mensagem }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao enviar mensagem.')
        setStatus('error')
        return
      }
      setStatus('success')
    } catch {
      setErro('Erro de rede. Verifique sua conexão e tente novamente.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen text-white">
      <PublicBackground />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#111118] border-b border-white/8 flex items-center px-6">
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <span className="font-display font-bold text-white text-sm">Grupo Pau Brasil</span>
            </div>
          </div>
          <Link href="/login" className="px-4 py-1.5 rounded-xl border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors">
            Entrar
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        {/* Hero */}
        <section className="py-12 text-center">
          <h1 className="text-4xl font-display font-black leading-tight mb-3">Fale com a gente</h1>
          <p className="text-slate-400 text-base max-w-md mx-auto leading-relaxed">
            Candidaturas, parcerias, imprensa ou qualquer outra dúvida — estamos por aqui.
          </p>
        </section>

        {/* Formulário / Sucesso */}
        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-10 text-center space-y-4"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h2 className="text-xl font-display font-bold text-white">Mensagem enviada!</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Recebemos sua mensagem e entraremos em contato em breve.
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <Link href="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Página inicial
                </Link>
                <Link href="/carreiras"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium shadow-lg shadow-brand-500/20">
                  Ver vagas <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={enviar}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium block">Nome *</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    required
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium block">E-mail *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium block">Assunto *</label>
                <select
                  value={assunto}
                  onChange={e => setAssunto(e.target.value as Assunto)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#111118] border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all appearance-none"
                >
                  {ASSUNTOS.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium block">Mensagem *</label>
                <textarea
                  value={mensagem}
                  onChange={e => setMensagem(e.target.value)}
                  required
                  rows={5}
                  placeholder="Descreva como podemos ajudar..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all resize-none"
                />
              </div>

              {erro && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                  {erro}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-3 rounded-xl gradient-brand text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0"
              >
                {status === 'sending'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                  : <><Send className="w-4 h-4" /> Enviar mensagem</>}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
