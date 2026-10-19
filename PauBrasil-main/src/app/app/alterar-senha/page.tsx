'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

export default function AlterarSenhaPage() {
  const { update } = useSession()
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/me/alterar-senha', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword: confirm }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.error?.fieldErrors?.password?.[0]
          ?? data.error?.formErrors?.[0]
          ?? data.error
          ?? 'Erro ao alterar senha'
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
        return
      }
      setDone(true)
      await update({ mustChangePassword: false })
      setTimeout(() => router.replace('/app/inicio'), 1200)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-brand-400" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Defina sua senha</h1>
          <p className="text-slate-400 text-sm mt-2">
            Crie uma senha segura para continuar acessando o sistema.
          </p>
        </div>

        {done ? (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <p className="text-emerald-300 font-medium">Senha alterada com sucesso!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">Nova senha</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={10}
                  placeholder="Mínimo 10 caracteres"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1.5">Confirmar senha</label>
              <input
                type={showPwd ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="Repita a senha"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50"
              />
            </div>

            <ul className="text-[11px] text-slate-500 space-y-0.5 pl-1">
              <li className={password.length >= 10 ? 'text-emerald-400' : ''}>• Mínimo 10 caracteres</li>
              <li className={/[A-Z]/.test(password) ? 'text-emerald-400' : ''}>• Letra maiúscula</li>
              <li className={/[a-z]/.test(password) ? 'text-emerald-400' : ''}>• Letra minúscula</li>
              <li className={/[0-9]/.test(password) ? 'text-emerald-400' : ''}>• Número</li>
              <li className={/[^A-Za-z0-9]/.test(password) ? 'text-emerald-400' : ''}>• Caractere especial</li>
            </ul>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="w-full py-3 rounded-xl gradient-brand text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Salvando…' : 'Salvar senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
