'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Montserrat } from 'next/font/google'
import { ArrowLeft, ArrowRight, Send, CheckCircle2, Loader2 } from 'lucide-react'
import { HubFooter, HubNav } from '@/app/_components/HubShell'
import hubStyles from '@/app/_components/Hub.module.css'

const montserrat = Montserrat({ subsets: ['latin'], display: 'swap', variable: '--font-hub' })

type Assunto = 'Candidatura' | 'Parceria' | 'Imprensa' | 'Outro'
type Status = 'idle' | 'sending' | 'success' | 'error'

const ASSUNTOS: Assunto[] = ['Candidatura', 'Parceria', 'Imprensa', 'Outro']

const campo = 'w-full px-3 py-2.5 rounded-[6px] bg-white border border-[#d9cdbf] text-[#1a1a1a] text-sm placeholder-[#9a8c80] outline-none focus:border-[#7a1520] focus:ring-2 focus:ring-[#7a1520]/10 transition-all'
const rotulo = 'text-xs text-[#6f5c4e] font-semibold block'

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
    <div
      className={`tema-claro min-h-screen flex flex-col bg-[#faf9f6] text-[#1a1a1a] ${montserrat.variable}`}
      style={{ fontFamily: 'var(--font-hub), Arial, sans-serif' }}
    >
      {/* Mesmo cabeçalho e rodapé do hub; o wrapper .hub traz as cores e o sticky. */}
      <div className={hubStyles.hub} style={{ position: 'sticky', top: 0, zIndex: 40 }}>
        <HubNav />
      </div>

      <main id="conteudo" className="flex-1 w-full max-w-2xl mx-auto px-6 pt-14 pb-20">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7a1520]">
          <ArrowLeft className="w-4 h-4" /> Voltar para o início
        </Link>
        <section className="pt-10 pb-8">
          <span className="block text-xs uppercase tracking-[0.17em] font-semibold text-[#7a1520] mb-4">Contato</span>
          <h1 className="text-[36px] md:text-[44px] font-semibold leading-[1.1] tracking-[-0.045em] mb-3">Fale com a gente.</h1>
          <p className="text-[#6f5c4e] text-base max-w-md leading-relaxed">
            Candidaturas, parcerias, imprensa ou qualquer outra dúvida: estamos por aqui.
          </p>
        </section>

        {/* Formulário / Sucesso */}
        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[10px] bg-white border border-[#e7e1da] p-10 text-center space-y-4"
            >
              <span className="mx-auto w-16 h-16 rounded-full bg-[#7a1520]/[0.07] border border-[#7a1520]/25 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-[#7a1520]" />
              </span>
              <h2 className="text-xl font-semibold tracking-[-0.03em]">Mensagem enviada!</h2>
              <p className="text-[#6f5c4e] text-sm leading-relaxed">
                Recebemos sua mensagem e entraremos em contato em breve.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link href="/"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[3px] bg-white border border-[#dcc8b1] text-[#7a1520] text-sm font-semibold hover:bg-[#f4efe8] transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Página inicial
                </Link>
                <Link href="/carreiras"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[3px] bg-[#7a1520] text-white text-sm font-semibold hover:bg-[#941d2b] transition-colors">
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
              className="rounded-[10px] bg-white border border-[#e7e1da] p-6 md:p-8 space-y-5 shadow-[0_18px_40px_-28px_rgba(74,29,20,0.35)]"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label htmlFor="contato-nome" className={rotulo}>Nome *</label>
                  <input id="contato-nome" type="text" value={nome} onChange={e => setNome(e.target.value)} required
                    placeholder="Seu nome completo" className={campo} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contato-email" className={rotulo}>E-mail *</label>
                  <input id="contato-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="seu@email.com" className={campo} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contato-assunto" className={rotulo}>Assunto *</label>
                <select id="contato-assunto" value={assunto} onChange={e => setAssunto(e.target.value as Assunto)} required className={campo}>
                  {ASSUNTOS.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contato-mensagem" className={rotulo}>Mensagem *</label>
                <textarea id="contato-mensagem" value={mensagem} onChange={e => setMensagem(e.target.value)} required rows={5}
                  placeholder="Descreva como podemos ajudar..." className={campo + ' resize-none'} />
              </div>

              {erro && (
                <p role="alert" className="text-[#b42318] text-sm bg-red-50 border border-red-200 rounded-[6px] px-4 py-2.5">
                  {erro}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-3.5 rounded-[3px] bg-[#7a1520] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#941d2b] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bb8c08] focus-visible:ring-offset-2"
              >
                {status === 'sending'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                  : <><Send className="w-4 h-4" /> Enviar mensagem</>}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </main>

      <div className={hubStyles.hub}>
        <HubFooter />
      </div>
    </div>
  )
}
