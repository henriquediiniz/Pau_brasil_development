'use client'

import { Suspense, useEffect, useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { hasGamificationAccess } from '@/lib/auth-helpers'

const ALLOWED_DOMAIN = 'grupopaubrasil.com.br'

function validateEmail(email: string) {
  if (!email.includes('@')) return 'E-mail inválido'
  const domain = email.split('@')[1]
  if (domain !== ALLOWED_DOMAIN) return `Apenas e-mails @${ALLOWED_DOMAIN} são permitidos`
  return null
}

export default function LoginPage() {
  return <Suspense><LoginContent /></Suspense>
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setupToken = searchParams.get('setupToken')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [totpRequired, setTotpRequired] = useState(false)
  const [totpCode, setTotpCode] = useState('')

  useEffect(() => {
    if (searchParams.get('error') === 'SessionRevoked') {
      setError('Sua sessao foi encerrada porque seu acesso mudou. Entre novamente.')
    }
  }, [searchParams])

  const handleEmailBlur = () => {
    if (email) setEmailError(validateEmail(email) ?? '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (setupToken) {
      setLoading(true)
      setError('')
      const res = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: setupToken, password }),
      })
      const data = await res.json().catch(() => ({}))
      setLoading(false)
      if (!res.ok) {
        setError(data.error || 'Não foi possível definir a senha')
        return
      }
      setError('Senha definida. Entre com seu e-mail corporativo.')
      router.replace('/login')
      return
    }

    const err = validateEmail(email)
    if (err) { setEmailError(err); return }

    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email: email.toLowerCase(),
      password,
      ...(totpRequired && totpCode ? { totpToken: totpCode } : {}),
      redirect: false,
    })

    if (result?.error) {
      setLoading(false)
      const raw = result.error
      if (raw.startsWith('TOTP_REQUIRED:')) {
        setTotpRequired(true)
        setError('')
        return
      }
      setError(raw === 'CredentialsSignin' ? 'Credenciais inválidas' : raw)
    } else {
      const session = await getSession()
      const u = session?.user
      const hasGamification = u ? hasGamificationAccess(u) : false
      if (hasGamification) {
        window.location.href = '/app/inicio'
      } else if (u?.isEmpresaAdmin) {
        window.location.href = '/empresa'
      } else {
        window.location.href = '/universidade'
      }
    }
  }

  return (
    <div className="min-h-screen flex bg-[#0d0d14]">
      {/* Left panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a00] via-[#0d0d14] to-[#0d0d14]" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,125,13,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,125,13,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-brand-500/30">
              <span className="text-white font-bold text-lg font-display">P</span>
            </div>
            <div>
              <div className="text-white font-display font-bold text-lg leading-none">Grupo Pau Brasil</div>
              <div className="text-brand-400 text-xs">Portal Corporativo</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl font-display font-bold text-white leading-tight">
              Conquiste mais.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">
                Seja reconhecido.
              </span>
            </h1>
            <p className="mt-4 text-slate-400 text-lg leading-relaxed max-w-sm">
              Complete atividades, acumule pontos e troque por recompensas no portal de engajamento do grupo.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-6"
          >
            {[
              { label: 'Colaboradores', value: '500+' },
              { label: 'Empresas', value: '6' },
              { label: 'Recompensas', value: '30+' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-display font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="relative z-10 text-xs text-slate-600">
          © {new Date().getFullYear()} Grupo Pau Brasil. Todos os direitos reservados.
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Voltar */}
          <div className="mb-6">
            <Link href="/"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Voltar ao início
            </Link>
          </div>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div className="text-white font-display font-bold text-lg">Grupo Pau Brasil</div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-white">{setupToken ? 'Definir senha' : 'Entrar na conta'}</h2>
            <p className="text-slate-400 mt-1">{setupToken ? 'Crie sua senha para ativar o acesso' : 'Use seu e-mail corporativo para acessar'}</p>
          </div>

          {/* Domain badge */}
          <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20">
            <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0" />
            <span className="text-xs text-brand-400">Acesso restrito a <strong>@{ALLOWED_DOMAIN}</strong></span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email field */}
            {!setupToken && <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="email">
                E-mail corporativo
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError('') }}
                  onBlur={handleEmailBlur}
                  placeholder={`seunome@${ALLOWED_DOMAIN}`}
                  autoComplete="email"
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-slate-600 text-sm transition-all outline-none
                    focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500
                    ${emailError ? 'border-red-500/60' : 'border-white/10 hover:border-white/20'}`}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                />
              </div>
              <AnimatePresence>
                {emailError && (
                  <motion.p
                    id="email-error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-1.5 text-xs text-red-400"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {emailError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>}

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="password">
                {setupToken ? 'Nova senha' : 'Senha'}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={setupToken ? 'new-password' : 'current-password'}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white placeholder-slate-600 text-sm transition-all outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                  aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* TOTP step */}
            <AnimatePresence>
              {totpRequired && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Código de autenticação (6 dígitos)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCode}
                    onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-white placeholder-slate-600 text-sm font-mono tracking-widest text-center outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                  <p className="text-xs text-slate-500 mt-1 text-center">Abra o Authenticator e insira o código de 6 dígitos</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || (!setupToken && !email) || !password || (totpRequired && totpCode.length !== 6)}
              className="w-full py-3 px-6 rounded-xl gradient-brand text-white font-semibold text-sm
                shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5
                disabled:opacity-50 disabled:pointer-events-none
                transition-all duration-200 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {setupToken ? 'Salvando...' : 'Entrando...'}
                </>
              ) : (
                setupToken ? 'Definir senha' : totpRequired ? 'Verificar código' : 'Entrar no Portal'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Problemas com acesso? Contate o RH ou TI.
          </p>
          {!setupToken && (
            <p className="mt-3 text-center text-xs text-slate-500">
              Não tem conta?{' '}
              <Link href="/registro" className="text-brand-400 hover:text-brand-300 transition-colors">
                Solicitar acesso →
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  )
}
