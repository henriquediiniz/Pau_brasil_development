'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, EyeOff, Loader2, ShieldCheck, AlertCircle, ArrowLeft, CheckCircle2, Circle,
  ChevronRight, ChevronLeft,
} from 'lucide-react'
import Link from 'next/link'

const ALLOWED_DOMAIN = 'grupopaubrasil.com.br'

interface Empresa { id: string; nome: string }
interface Funcao { id: string; name: string }

function checkPolicy(pw: string, name: string, email: string) {
  const normalized = pw.toLowerCase()
  const emailUser = email.split('@')[0]?.toLowerCase() ?? ''
  const nameParts = name.toLowerCase().split(/\s+/).filter((p) => p.length >= 3)
  return {
    length: pw.length >= 10,
    lower: /[a-z]/.test(pw),
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
    noEmail: !emailUser || !normalized.includes(emailUser),
    noName: !nameParts.some((p) => normalized.includes(p)),
  }
}

const POLICY_LABELS: Record<string, string> = {
  length: 'Pelo menos 10 caracteres',
  lower: 'Letra minúscula',
  upper: 'Letra maiúscula',
  number: 'Número',
  special: 'Caractere especial (!@#...)',
  noEmail: 'Não contém e-mail',
  noName: 'Não contém nome',
}

export default function RegistroPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  // Step 2
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresaId, setEmpresaId] = useState('')
  const [funcoes, setFuncoes] = useState<Funcao[]>([])
  const [functionId, setFunctionId] = useState('')
  const [loadingFuncoes, setLoadingFuncoes] = useState(false)

  // Step 3
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    fetch('/api/public/empresas')
      .then((r) => r.json())
      .then(setEmpresas)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!empresaId) { setFuncoes([]); setFunctionId(''); return }
    setLoadingFuncoes(true)
    fetch(`/api/public/empresas/${empresaId}/funcoes`)
      .then((r) => r.json())
      .then((data) => { setFuncoes(data); setFunctionId('') })
      .catch(() => {})
      .finally(() => setLoadingFuncoes(false))
  }, [empresaId])

  function validateEmailField() {
    if (!email.includes('@')) { setEmailError('E-mail inválido'); return false }
    if (!email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
      setEmailError(`Apenas e-mails @${ALLOWED_DOMAIN}`); return false
    }
    setEmailError(''); return true
  }

  function goStep2() {
    if (!name.trim() || name.trim().length < 2) { setError('Nome deve ter pelo menos 2 caracteres'); return }
    if (!validateEmailField()) return
    setError(''); setStep(2)
  }

  function goStep3() {
    if (!empresaId) { setError('Selecione uma empresa'); return }
    setError(''); setStep(3)
  }

  const policy = checkPolicy(password, name, email)
  const policyOk = Object.values(policy).every(Boolean)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!policyOk) { setError('A senha não atende à política de segurança'); return }
    if (password !== confirmPassword) { setError('As senhas não coincidem'); return }

    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword, empresaId, functionId: functionId || undefined, note: note || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (typeof data.error === 'string') setError(data.error)
        else setError('Não foi possível enviar o cadastro. Tente novamente.')
        return
      }
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d14] p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center space-y-6"
        >
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-white">Solicitação enviada!</h2>
            <p className="text-slate-400 mt-2 leading-relaxed">
              Seu cadastro foi enviado para aprovação.<br />
              Quando liberado, você poderá acessar o portal.
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 px-6 rounded-xl gradient-brand text-white font-semibold text-sm transition-all hover:-translate-y-0.5"
          >
            Voltar ao login
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[#0d0d14]">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a00] via-[#0d0d14] to-[#0d0d14]" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
            <span className="text-white font-bold text-lg font-display">P</span>
          </div>
          <div>
            <div className="text-white font-display font-bold text-lg leading-none">Grupo Pau Brasil</div>
            <div className="text-brand-400 text-xs">Portal Corporativo</div>
          </div>
        </div>
        <div className="relative z-10 space-y-4">
          <h1 className="text-4xl font-display font-bold text-white leading-tight">
            Solicite seu acesso<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">
              ao portal.
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Preencha o formulário e aguarde aprovação do RH ou TI da sua empresa.
          </p>
        </div>
        <div className="relative z-10 text-xs text-slate-600">
          © {new Date().getFullYear()} Grupo Pau Brasil. Todos os direitos reservados.
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="mb-6">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Voltar ao login
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-white">Solicitar acesso</h2>
            <p className="text-slate-400 mt-1">Use seu e-mail corporativo</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all
                  ${s === step ? 'gradient-brand text-white' : s < step ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-slate-500'}`}>
                  {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className={`h-px flex-1 transition-all ${s < step ? 'bg-green-500/40' : 'bg-white/10'}`} style={{ width: 40 }} />}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20">
            <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0" />
            <span className="text-xs text-brand-400">Restrito a <strong>@{ALLOWED_DOMAIN}</strong></span>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Nome completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white placeholder-slate-600 text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">E-mail corporativo</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError('') }}
                    onBlur={() => { if (email) validateEmailField() }}
                    placeholder={`seunome@${ALLOWED_DOMAIN}`}
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-slate-600 text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all
                      ${emailError ? 'border-red-500/60' : 'border-white/10 hover:border-white/20'}`}
                  />
                  {emailError && (
                    <p className="flex items-center gap-1.5 text-xs text-red-400">
                      <AlertCircle className="w-3 h-3" />{emailError}
                    </p>
                  )}
                </div>
                {error && <ErrorBanner>{error}</ErrorBanner>}
                <button onClick={goStep2} className="w-full py-3 px-6 rounded-xl gradient-brand text-white font-semibold text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all mt-2">
                  Próximo <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Empresa</label>
                  <select
                    value={empresaId}
                    onChange={(e) => setEmpresaId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 appearance-none"
                  >
                    <option value="" className="bg-[#1a1a2e]">Selecione...</option>
                    {empresas.map((e) => <option key={e.id} value={e.id} className="bg-[#1a1a2e]">{e.nome}</option>)}
                  </select>
                </div>
                {empresaId && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Função <span className="text-slate-500">(opcional)</span></label>
                    <select
                      value={functionId}
                      onChange={(e) => setFunctionId(e.target.value)}
                      disabled={loadingFuncoes}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 appearance-none disabled:opacity-50"
                    >
                      <option value="" className="bg-[#1a1a2e]">{loadingFuncoes ? 'Carregando...' : 'Selecione...'}</option>
                      {funcoes.map((f) => <option key={f.id} value={f.id} className="bg-[#1a1a2e]">{f.name}</option>)}
                    </select>
                  </div>
                )}
                {error && <ErrorBanner>{error}</ErrorBanner>}
                <div className="flex gap-3 mt-2">
                  <button onClick={() => { setError(''); setStep(1) }} className="flex-1 py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-white text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                    <ChevronLeft className="w-4 h-4" /> Voltar
                  </button>
                  <button onClick={goStep3} className="flex-1 py-3 px-6 rounded-xl gradient-brand text-white font-semibold text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all">
                    Próximo <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Senha</label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••"
                        autoComplete="new-password"
                        className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white placeholder-slate-600 text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Policy checklist */}
                  {password && (
                    <div className="grid grid-cols-2 gap-1.5 p-3 rounded-lg bg-white/3 border border-white/10">
                      {Object.entries(policy).map(([key, ok]) => (
                        <div key={key} className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-green-400' : 'text-slate-500'}`}>
                          {ok ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <Circle className="w-3 h-3 shrink-0" />}
                          {POLICY_LABELS[key]}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Confirmar senha</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••"
                        autoComplete="new-password"
                        className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white placeholder-slate-600 text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="flex items-center gap-1.5 text-xs text-red-400">
                        <AlertCircle className="w-3 h-3" />As senhas não coincidem
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Mensagem <span className="text-slate-500">(opcional)</span></label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Conte um pouco sobre você ou por que precisa de acesso..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white placeholder-slate-600 text-sm outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 resize-none"
                    />
                    <p className="text-xs text-slate-600 text-right">{note.length}/500</p>
                  </div>

                  {error && <ErrorBanner>{error}</ErrorBanner>}

                  <div className="flex gap-3 mt-2">
                    <button type="button" onClick={() => { setError(''); setStep(2) }} className="flex-1 py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-white text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                      <ChevronLeft className="w-4 h-4" /> Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !policyOk || !password || !confirmPassword}
                      className="flex-1 py-3 px-6 rounded-xl gradient-brand text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none hover:-translate-y-0.5 transition-all"
                    >
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</> : 'Enviar solicitação'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
      <AlertCircle className="w-4 h-4 shrink-0" />
      {children}
    </div>
  )
}
