'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, EyeOff, Loader2, ShieldCheck, AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Circle,
  BookOpen, User, Users,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import styles from '../login/Login.module.css'
import r from './Registro.module.css'

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
      <main className={r.done}>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className={r.doneCard}
        >
          <span className={r.doneIcon}><CheckCircle2 size={30} /></span>
          <h2>Solicitação enviada!</h2>
          <p>
            Seu cadastro foi enviado para aprovação.<br />
            Quando liberado, você poderá acessar o portal.
          </p>
          <button onClick={() => router.push('/login')} className={styles.submit}>
            Voltar ao login <ArrowRight size={18} />
          </button>
        </motion.div>
      </main>
    )
  }

  return (
    <main className={styles.login}>
      <section className={styles.story} aria-label="Portal do colaborador Pau Brasil">
        <Link href="/" className={styles.brand}>
          <Image src="/brand/logo-branca.png" alt="Grupo Pau Brasil" width={170} height={138} priority />
        </Link>
        <div className={styles.storyContent}>
          <span className={styles.eyebrow}>Portal do colaborador</span>
          <h1>
            Solicite seu acesso
            <br />
            ao <span>portal.</span>
          </h1>
          <p>Preencha o formulário e aguarde a aprovação do RH ou da TI da sua empresa.</p>
          <div className={styles.features}>
            <span><User size={19} /> Perfil e serviços do colaborador</span>
            <span><BookOpen size={19} /> Universidade Pau Brasil</span>
            <span><Users size={19} /> Conexão com sua equipe</span>
          </div>
        </div>
        <small>Grupo Pau Brasil · Raízes fortes. Novos caminhos.</small>
      </section>

      <section className={styles.formPanel}>
        <Link href="/login" className={styles.back}>
          <ArrowLeft size={16} /> Voltar ao login
        </Link>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className={styles.formWrap}
        >
          <Image className={styles.mobileLogo} src="/brand/logo-compacta.png" alt="Pau Brasil" width={150} height={71} priority />
          <span className={styles.formEyebrow}>Solicitar acesso</span>
          <h2>Crie sua conta.</h2>
          <p>Use seu e-mail corporativo. O acesso é liberado depois da aprovação.</p>

          <div className={r.steps} aria-label={`Etapa ${step} de 3`}>
            {[1, 2, 3].map((n) => (
              <span key={n} style={{ display: 'contents' }}>
                <span className={r.step} data-state={n === step ? 'active' : n < step ? 'done' : 'next'}>
                  {n < step ? <CheckCircle2 size={16} /> : n}
                </span>
                {n < 3 && <span className={r.stepLine} data-done={n < step} />}
              </span>
            ))}
          </div>

          <div className={styles.accessNote}>
            <ShieldCheck size={18} />
            <span>Restrito a <strong>@{ALLOWED_DOMAIN}</strong></span>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className={styles.field}>
                  <label htmlFor="registro-nome">Nome completo</label>
                  <input id="registro-nome" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" autoComplete="name" />
                </div>
                <div className={styles.field}>
                  <label htmlFor="registro-email">E-mail corporativo</label>
                  <input
                    id="registro-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError('') }}
                    onBlur={() => { if (email) validateEmailField() }}
                    placeholder={`seunome@${ALLOWED_DOMAIN}`}
                    autoComplete="email"
                    aria-invalid={!!emailError}
                  />
                  {emailError && <p className={styles.fieldError} role="alert">{emailError}</p>}
                </div>
                {error && <ErrorBanner>{error}</ErrorBanner>}
                <button onClick={goStep2} className={styles.submit}>
                  Próximo <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div className={`${styles.field} ${r.field}`}>
                  <label htmlFor="registro-empresa">Empresa</label>
                  <select id="registro-empresa" value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}>
                    <option value="">Selecione...</option>
                    {empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>
                </div>
                {empresaId && (
                  <div className={`${styles.field} ${r.field}`}>
                    <label htmlFor="registro-funcao">Função <span className={r.optional}>(opcional)</span></label>
                    <select id="registro-funcao" value={functionId} onChange={(e) => setFunctionId(e.target.value)} disabled={loadingFuncoes}>
                      <option value="">{loadingFuncoes ? 'Carregando...' : 'Selecione...'}</option>
                      {funcoes.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                )}
                {error && <ErrorBanner>{error}</ErrorBanner>}
                <div className={r.actions}>
                  <button onClick={() => { setError(''); setStep(1) }} className={r.secondary}>
                    <ArrowLeft size={16} /> Voltar
                  </button>
                  <button onClick={goStep3} className={styles.submit}>
                    Próximo <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <form onSubmit={handleSubmit}>
                  <div className={styles.field}>
                    <label htmlFor="registro-senha">Senha</label>
                    <div className={styles.password}>
                      <input id="registro-senha" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Crie uma senha" autoComplete="new-password" />
                      <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}>
                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {password && (
                    <div className={r.policy}>
                      {Object.entries(policy).map(([key, ok]) => (
                        <span key={key} data-ok={ok}>
                          {ok ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                          {POLICY_LABELS[key]}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={styles.field}>
                    <label htmlFor="registro-confirmar">Confirmar senha</label>
                    <div className={styles.password}>
                      <input
                        id="registro-confirmar"
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a senha"
                        autoComplete="new-password"
                        aria-invalid={!!confirmPassword && password !== confirmPassword}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}>
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className={styles.fieldError} role="alert">As senhas não coincidem</p>
                    )}
                  </div>

                  <div className={`${styles.field} ${r.field}`}>
                    <label htmlFor="registro-mensagem">Mensagem <span className={r.optional}>(opcional)</span></label>
                    <textarea
                      id="registro-mensagem"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Conte um pouco sobre você ou por que precisa de acesso..."
                      rows={3}
                      maxLength={500}
                    />
                    <p className={r.counter}>{note.length}/500</p>
                  </div>

                  {error && <ErrorBanner>{error}</ErrorBanner>}

                  <div className={r.actions}>
                    <button type="button" onClick={() => { setError(''); setStep(2) }} className={r.secondary}>
                      <ArrowLeft size={16} /> Voltar
                    </button>
                    <button type="submit" disabled={loading || !policyOk || !password || !confirmPassword} className={styles.submit}>
                      {loading ? <><Loader2 size={18} className="animate-spin" />Enviando...</> : 'Enviar solicitação'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={styles.help}>
            <p>
              Já tem uma conta? <Link href="/login">Entrar no portal <ArrowRight size={12} /></Link>
            </p>
          </div>
        </motion.div>
        <span className={styles.copyright}>© {new Date().getFullYear()} Grupo Pau Brasil</span>
      </section>
    </main>
  )
}

function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.error} role="alert">
      <AlertCircle size={18} />
      <span>{children}</span>
    </div>
  )
}
