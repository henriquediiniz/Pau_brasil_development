'use client'

import { Suspense, useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckSquare,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ALLOWED_EMAIL_DOMAIN } from '@/lib/config'
import styles from './Login.module.css'

function validateEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+$/.test(email)) return 'Informe um e-mail válido.'
  if (email.split('@')[1] !== ALLOWED_EMAIL_DOMAIN)
    return `Use seu e-mail @${ALLOWED_EMAIL_DOMAIN}.`
  return null
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loading} role="status">
          Carregando acesso ao portal…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const { status: sessionStatus } = useSession()
  const searchParams = useSearchParams()
  const setupToken = searchParams.get('setupToken')
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [emailError, setEmailError] = useState('')
  const [totpRequired, setTotpRequired] = useState(false)
  const [totpCode, setTotpCode] = useState('')

  useEffect(() => {
    if (searchParams.get('error') === 'SessionRevoked')
      setError(
        'Sua sessão foi encerrada porque seu acesso mudou. Entre novamente.',
      )
  }, [searchParams])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (loading) return
    const normalizedEmail = email.trim().toLowerCase()
    if (!setupToken) {
      const invalid = validateEmail(normalizedEmail)
      if (invalid) {
        setEmailError(invalid)
        return
      }
    }
    setLoading(true)
    setError('')
    setSuccess('')
    // Keep the submit button busy during successful navigation.
    let navigating = false
    try {
      if (setupToken) {
        const response = await fetch('/api/auth/setup-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: setupToken, password }),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok)
          throw new Error(
            typeof data.error === 'string'
              ? data.error
              : 'Não foi possível definir a senha.',
          )
        setPassword('')
        setSuccess('Senha definida. Entre com seu e-mail corporativo.')
        router.replace('/login')
        return
      }
      const result = await signIn('credentials', {
        email: normalizedEmail,
        password,
        ...(totpRequired && totpCode ? { totpToken: totpCode } : {}),
        redirect: false,
      })
      if (result?.error?.startsWith('TOTP_REQUIRED:')) {
        setTotpRequired(true)
        return
      }
      if (!result || result.error || !result.ok)
        throw new Error(
          result?.error === 'CredentialsSignin'
            ? 'Credenciais inválidas'
            : result?.error || 'Não foi possível entrar. Tente novamente.',
        )
      navigating = true
      // O servidor resolve o destino conforme o perfil e a troca obrigatória de senha.
      window.location.href = '/app/inicio'
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível conectar. Tente novamente.',
      )
    } finally {
      if (!navigating) setLoading(false)
    }
  }

  return (
    <main className={styles.login}>
      <section
        className={styles.story}
        aria-label="Portal do colaborador Pau Brasil"
      >
        <Link href="/" className={styles.brand}>
          <Image
            src="/brand/logo-branca.png"
            alt="Grupo Pau Brasil"
            width={170}
            height={138}
            priority
          />
        </Link>
        <div className={styles.storyContent}>
          <span className={styles.eyebrow}>Sua jornada no grupo</span>
          <h1>
            Gente que aprende.
            <br />
            Talentos que <span>crescem.</span>
          </h1>
          <p>
            Seu trabalho, seu desenvolvimento e suas conquistas em um só lugar.
          </p>
          <div className={styles.features}>
            <span>
              <CheckSquare size={19} /> Atividades e acompanhamento
            </span>
            <span>
              <BookOpen size={19} /> Universidade Pau Brasil
            </span>
            <span>
              <Users size={19} /> Conexão com sua equipe
            </span>
          </div>
        </div>
        <small>Grupo Pau Brasil · Raízes fortes. Novos caminhos.</small>
      </section>
      <section className={styles.formPanel}>
        <Link href="/" className={styles.back}>
          <ArrowLeft size={16} /> Voltar ao hub do grupo
        </Link>
        <div className={styles.formWrap}>
          <Image
            className={styles.mobileLogo}
            src="/brand/logo-compacta.png"
            alt="Pau Brasil"
            width={150}
            height={71}
            priority
          />
          <span className={styles.formEyebrow}>Portal do colaborador</span>
          <h2>{setupToken ? 'Defina sua senha.' : 'Bom ter você aqui.'}</h2>
          <p>
            {setupToken
              ? 'Crie sua senha para ativar o acesso.'
              : 'Entre com seu e-mail corporativo para continuar.'}
          </p>
          <div className={styles.accessNote}>
            <ShieldCheck size={18} />
            <span>Acesso exclusivo para colaboradores do grupo.</span>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            {!setupToken && (
              <div className={styles.field}>
                <label htmlFor="email">E-mail corporativo</label>
                <input
                  id="email"
                  disabled={!ready || sessionStatus === 'loading'}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setEmailError('')
                  }}
                  onBlur={() => {
                    if (email)
                      setEmailError(
                        validateEmail(email.trim().toLowerCase()) ?? '',
                      )
                  }}
                  placeholder={`seunome@${ALLOWED_EMAIL_DOMAIN}`}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                />
                {emailError && (
                  <p
                    className={styles.fieldError}
                    id="email-error"
                    role="alert"
                  >
                    {emailError}
                  </p>
                )}
              </div>
            )}
            <div className={styles.field}>
              <label htmlFor="password">
                {setupToken ? 'Nova senha' : 'Senha'}
              </label>
              <div className={styles.password}>
                <input
                  id="password"
                  disabled={!ready || sessionStatus === 'loading'}
                  type={showPw ? 'text' : 'password'}
                  autoComplete={
                    setupToken ? 'new-password' : 'current-password'
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {totpRequired && (
              <div className={styles.field}>
                <label htmlFor="totp">Código de autenticação (6 dígitos)</label>
                <input
                  id="totp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={totpCode}
                  onChange={(event) =>
                    setTotpCode(event.target.value.replace(/\D/g, ''))
                  }
                  placeholder="000000"
                  autoFocus
                />
                <p className={styles.hint}>
                  Abra seu aplicativo autenticador e insira o código.
                </p>
              </div>
            )}
            {error && (
              <div className={styles.error} role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <p className={styles.success} role="status">
                {success}
              </p>
            )}
            <button
              type="submit"
              disabled={
                !ready || sessionStatus === 'loading' || loading ||
                (!setupToken && !email.trim()) ||
                !password ||
                (totpRequired && totpCode.length !== 6)
              }
              className={styles.submit}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {setupToken ? 'Salvando…' : 'Entrando…'}
                </>
              ) : (
                <>
                  {setupToken
                    ? 'Definir senha'
                    : totpRequired
                      ? 'Verificar código'
                      : 'Entrar no Portal'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          <div className={styles.help}>
            <p>
              Precisa de ajuda para acessar?{' '}
              <Link href="/contato">Fale com a equipe.</Link>
            </p>
            {!setupToken && (
              <p>
                Ainda não tem uma conta?{' '}
                <Link href="/registro">
                  Solicitar acesso <ArrowRight size={12} />
                </Link>
              </p>
            )}
          </div>
        </div>
        <span className={styles.copyright}>
          © {new Date().getFullYear()} Grupo Pau Brasil
        </span>
      </section>
    </main>
  )
}
