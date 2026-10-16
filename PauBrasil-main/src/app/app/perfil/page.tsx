'use client'

import { useSession, signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Building2, MapPin, Mail, LogOut, Star, Shield, Key, Eye, EyeOff, Loader2, Flame, Trophy, Lock, TrendingUp, Camera, Bell, BellOff } from 'lucide-react'
import { getLevel, LEVEL_COLORS, LEVEL_BG } from '@/types'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from '@/components/ui/toaster'
import Image from 'next/image'
import { ImageUpload } from '@/components/ui/image-upload'
import { getRoleLabel, getUnitsLabel } from '@/lib/user-display'

type Tab = 'perfil' | 'evolucao' | 'senha'

interface Semana { semana: string; pts: number }
interface EvolucaoData { semanas: Semana[]; streak: number; streakRecord: number }
interface Badge { id: string; nome: string; descricao: string; icone: string; ganho: boolean; ganhoEm?: string }

interface NetworkUser { id: string; name: string; photoUrl: string | null; role: string }
interface NetworkData { manager: NetworkUser | null; subordinates: NetworkUser[] }

const BADGE_ICONS: Record<string, string> = {
  primeiros_passos: '🎯', centuriao: '💯', mil_pontos: '⭐', elite: '🏆', lenda: '👑',
  estudante: '📖', academico: '🎓', semana_em_chamas: '🔥', constancia: '💪', aprovado_de_primeira: '✅',
}

function BarChart({ semanas }: { semanas: Semana[] }) {
  const max = Math.max(...semanas.map(s => s.pts), 1)
  return (
    <div className="flex items-end gap-1.5 h-24">
      {semanas.map((s, i) => {
        const pct = Math.max((s.pts / max) * 100, s.pts > 0 ? 4 : 0)
        const isLast = i === semanas.length - 1
        return (
          <div key={s.semana} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className={`w-full rounded-t-sm ${isLast ? 'bg-brand-500' : 'bg-brand-500/30'}`}
                style={{ minHeight: s.pts > 0 ? 3 : 0 }}
              />
            </div>
            <span className="text-[9px] text-slate-600 leading-none">{s.semana.slice(5).replace('-', '/')}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function PerfilPage() {
  return (
    <Suspense>
      <PerfilPageInner />
    </Suspense>
  )
}

function PerfilPageInner() {
  const { data: session, update: updateSession } = useSession()
  const user = session?.user
  const searchParams = useSearchParams()
  const [balance, setBalance] = useState<{ confirmed: number } | null>(null)
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) ?? 'perfil')

  // Evolução state
  const [evolucao, setEvolucao] = useState<EvolucaoData | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [loadingEvolucao, setLoadingEvolucao] = useState(false)

  // Rede state
  const [network, setNetwork] = useState<NetworkData | null>(null)

  // Password change state
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)

  useEffect(() => {
    fetch('/api/pontos').then(r => r.json()).then(d => setBalance(d.balance))
    fetch('/api/me/network').then(r => r.json()).then(d => {
      if (d.user) setNetwork({ manager: d.user.manager, subordinates: d.user.subordinates })
    })
  }, [])

  useEffect(() => {
    const t = searchParams.get('tab') as Tab
    if (t) setTab(t)
  }, [searchParams])

  useEffect(() => {
    if (tab === 'evolucao' && !evolucao) {
      setLoadingEvolucao(true)
      Promise.all([
        fetch('/api/pontos/evolucao').then(r => r.json()),
        fetch('/api/conquistas').then(r => r.json()),
      ]).then(([ev, bg]) => {
        setEvolucao(ev)
        setBadges(bg)
        setLoadingEvolucao(false)
      })
    }
  }, [tab, evolucao])

  const level = balance ? getLevel(balance.confirmed) : 'Bronze'
  const unitLabel = getUnitsLabel(user?.units)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPwd !== confirmPwd) { toast({ title: 'As senhas não coincidem', variant: 'destructive' }); return }
    if (newPwd.length < 8) { toast({ title: 'Nova senha deve ter ao menos 8 caracteres', variant: 'destructive' }); return }
    setSavingPwd(true)
    try {
      const res = await fetch('/api/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: '✅ Senha alterada com sucesso!' })
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    } catch (e: any) {
      toast({ title: e.message || 'Erro ao alterar senha', variant: 'destructive' })
    } finally {
      setSavingPwd(false)
    }
  }

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showAvatarEdit, setShowAvatarEdit] = useState(false)

  // 2FA TOTP state
  const [totpQr, setTotpQr] = useState<string | null>(null)
  const [totpConfirm, setTotpConfirm] = useState('')
  const [totpActive, setTotpActive] = useState(false)
  const [totpSaving, setTotpSaving] = useState(false)

  async function setupTotp() {
    setTotpSaving(true)
    try {
      const res = await fetch('/api/auth/totp/setup')
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setTotpQr(d.qrDataUrl)
    } catch {
      toast({ title: 'Erro ao gerar QR code', variant: 'destructive' })
    } finally {
      setTotpSaving(false)
    }
  }

  async function confirmTotp(e: React.FormEvent) {
    e.preventDefault()
    setTotpSaving(true)
    try {
      const res = await fetch('/api/auth/totp/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: totpConfirm }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setTotpActive(true)
      setTotpQr(null)
      setTotpConfirm('')
      toast({ title: '🔐 2FA ativado com sucesso!' })
    } catch (err: any) {
      toast({ title: err.message || 'Código inválido', variant: 'destructive' })
    } finally {
      setTotpSaving(false)
    }
  }

  const isAdminRole = user?.role === 'SYS_ADMIN' || user?.role === 'RH_ADMIN'

  const [pushSupported, setPushSupported] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const supported = 'serviceWorker' in navigator && 'PushManager' in window
    setPushSupported(supported)
    if (supported) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => setPushEnabled(!!sub))
      })
    }
  }, [])

  async function togglePush() {
    if (!pushSupported) return
    setPushLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      if (pushEnabled) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await sub.unsubscribe()
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
        }
        setPushEnabled(false)
        toast({ title: 'Notificações desativadas' })
      } else {
        const perm = await Notification.requestPermission()
        if (perm !== 'granted') { toast({ title: 'Permissão negada', variant: 'destructive' }); return }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        })
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub),
        })
        setPushEnabled(true)
        toast({ title: '🔔 Notificações ativadas!' })
      }
    } catch {
      toast({ title: 'Erro ao configurar notificações', variant: 'destructive' })
    } finally {
      setPushLoading(false)
    }
  }

  async function handleAvatarUpdate(url: string) {
    setUploadingAvatar(true)
    try {
      const res = await fetch('/api/me/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: url })
      })
      if (!res.ok) throw new Error('Falha ao atualizar avatar')
      
      // Update next-auth session
      await updateSession({ photoUrl: url })
      toast({ title: '✅ Foto atualizada com sucesso!' })
      setShowAvatarEdit(false)
    } catch(err) {
      toast({ title: 'Erro ao salvar avatar', variant: 'destructive' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-display font-bold text-white">Perfil</h1>

      {/* Avatar card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white/3 border border-white/8 p-6 flex flex-col md:flex-row items-center md:items-start gap-5 text-center md:text-left">
        <div className="relative group shrink-0">
          <div className="w-24 h-24 md:w-20 md:h-20 rounded-2xl gradient-brand flex items-center justify-center shadow-lg shadow-brand-500/25 overflow-hidden">
            {user?.photoUrl
              ? <Image src={user.photoUrl} alt={user.name} width={96} height={96} className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-3xl md:text-2xl font-display">{user?.name?.[0] ?? 'U'}</span>
            }
          </div>
          <button 
            onClick={() => setShowAvatarEdit(p => !p)}
            className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-500 rounded-full border-2 border-[#111118] flex items-center justify-center text-white shadow-lg hover:bg-brand-400 transition-colors"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 mt-2 md:mt-0">
          <h2 className="text-xl font-display font-bold text-white">{user?.name}</h2>
          <div className="flex items-center justify-center md:justify-start gap-2 mt-2 flex-wrap">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${LEVEL_BG[level]} ${LEVEL_COLORS[level]}`}>
              <Star className="w-3 h-3" />{level}
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400">
              <Shield className="w-3 h-3" />{getRoleLabel(user?.role)}
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showAvatarEdit && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="rounded-2xl bg-white/5 border border-white/10 p-5 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
               <h3 className="text-sm font-medium text-white flex items-center gap-2">
                 <Camera className="w-4 h-4 text-brand-400" /> Atualizar foto de perfil
               </h3>
            </div>
            {uploadingAvatar ? (
               <div className="py-8 flex flex-col items-center justify-center">
                 <Loader2 className="w-6 h-6 text-brand-400 animate-spin mb-2" />
                 <p className="text-xs text-slate-400">Salvando perfil...</p>
               </div>
            ) : (
               <ImageUpload 
                 aspectRatio="1/1" 
                 onChange={handleAvatarUpdate} 
               />
            )}
            <p className="text-[10px] text-slate-500 mt-3 text-center">Para melhor resultado, envie uma imagem quadrada com seu rosto centralizado.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/5">
        {([['perfil', 'Meus Dados', User], ['evolucao', 'Evolução', TrendingUp], ['senha', 'Senha', Key]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all
              ${tab === key ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'perfil' && (
        <>
          <div className="rounded-2xl bg-white/3 border border-white/8 overflow-hidden">
            {[
              { icon: Mail, label: 'E-mail', value: user?.email },
              { icon: Building2, label: 'Empresa', value: user?.company ?? 'Não informado' },
              { icon: MapPin, label: 'Operação / Unidade', value: unitLabel },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={item.label} className={`flex items-center gap-4 px-5 py-4 ${i > 0 ? 'border-t border-white/5' : ''}`}>
                  <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                  <div><div className="text-xs text-slate-500">{item.label}</div><div className="text-sm text-white">{item.value}</div></div>
                </div>
              )
            })}
          </div>

          {balance && (
            <div className="rounded-2xl bg-brand-500/10 border border-brand-500/20 p-5">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-brand-400" />
                <span className="text-sm text-slate-400">Pontos acumulados</span>
              </div>
              <div className="text-3xl font-display font-bold text-brand-400">{balance.confirmed.toLocaleString('pt-BR')} pts</div>
            </div>
          )}

          {pushSupported && (
            <div className="rounded-2xl bg-white/3 border border-white/8 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                    {pushEnabled ? <Bell className="w-4 h-4 text-brand-400" /> : <BellOff className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">Notificações push</p>
                    <p className="text-xs text-slate-500">{pushEnabled ? 'Ativas neste dispositivo' : 'Receba alertas mesmo com o app fechado'}</p>
                  </div>
                </div>
                <button
                  onClick={togglePush}
                  disabled={pushLoading}
                  className={`relative w-12 h-6 rounded-full transition-colors flex items-center ${pushEnabled ? 'bg-brand-500' : 'bg-white/10'} disabled:opacity-50`}
                >
                  <span className={`absolute w-5 h-5 rounded-full bg-white shadow transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          )}

          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full py-3 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
            <LogOut className="w-4 h-4" /> Sair do Portal
          </button>

          {network && (network.manager || network.subordinates.length > 0) && (
            <div className="space-y-4">
              {network.manager && (
                <div className="rounded-2xl bg-white/3 border border-white/8 p-5">
                  <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-slate-400" /> Reporta a</h3>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/10">
                    <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center overflow-hidden shrink-0">
                      {network.manager.photoUrl ? (
                        <Image src={network.manager.photoUrl} alt={network.manager.name} width={40} height={40} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-brand-400 font-bold">{network.manager.name[0]}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium group-hover:text-brand-400 transition-colors">{network.manager.name}</div>
                      <div className="text-xs text-slate-500">{getRoleLabel(network.manager.role)}</div>
                    </div>
                  </div>
                </div>
              )}

              {network.subordinates.length > 0 && (
                <div className="rounded-2xl bg-white/3 border border-white/8 p-5">
                  <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /> Meu Time ({network.subordinates.length})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {network.subordinates.map(sub => (
                      <div key={sub.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 group">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                          {sub.photoUrl ? (
                            <Image src={sub.photoUrl} alt={sub.name} width={32} height={32} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white text-xs font-bold">{sub.name[0]}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-white font-medium truncate group-hover:text-brand-400 transition-colors">{sub.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{getRoleLabel(sub.role)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'evolucao' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {loadingEvolucao ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>
          ) : evolucao && (
            <>
              {/* Streak */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-orange-500/10 border border-orange-500/20 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-slate-400">Sequência atual</span>
                  </div>
                  <div className="text-3xl font-display font-bold text-orange-400">{evolucao.streak}d</div>
                  <div className="text-xs text-slate-500 mt-0.5">dias consecutivos</div>
                </div>
                <div className="rounded-2xl bg-white/3 border border-white/8 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-slate-400">Recorde</span>
                  </div>
                  <div className="text-3xl font-display font-bold text-yellow-400">{evolucao.streakRecord}d</div>
                  <div className="text-xs text-slate-500 mt-0.5">melhor sequência</div>
                </div>
              </div>

              {/* Weekly chart */}
              <div className="rounded-2xl bg-white/3 border border-white/8 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-brand-400" />
                  <span className="text-sm font-medium text-white">Pontos nas últimas 8 semanas</span>
                </div>
                <BarChart semanas={evolucao.semanas} />
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-slate-600">8 semanas atrás</span>
                  <span className="text-[10px] text-slate-600">Esta semana</span>
                </div>
              </div>

              {/* Badges */}
              <div className="rounded-2xl bg-white/3 border border-white/8 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-4 h-4 text-brand-400" />
                  <span className="text-sm font-medium text-white">Conquistas</span>
                  <span className="ml-auto text-xs text-slate-500">{badges.filter(b => b.ganho).length}/{badges.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {badges.map(badge => (
                    <div key={badge.id}
                      className={`rounded-xl border p-3 flex items-start gap-3 transition-all ${badge.ganho
                        ? 'bg-brand-500/10 border-brand-500/20'
                        : 'bg-white/2 border-white/5 opacity-50'}`}>
                      <div className="text-2xl leading-none shrink-0">{BADGE_ICONS[badge.id] ?? '🏅'}</div>
                      <div className="min-w-0">
                        <div className={`text-xs font-semibold leading-tight ${badge.ganho ? 'text-white' : 'text-slate-500'}`}>
                          {badge.nome}
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5 leading-tight">{badge.descricao}</div>
                        {!badge.ganho && <Lock className="w-2.5 h-2.5 text-slate-700 mt-1" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {tab === 'senha' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <form onSubmit={handleChangePassword} className="rounded-2xl bg-white/3 border border-white/8 p-6 space-y-4">
            <h3 className="text-white font-medium">Alterar senha</h3>
            <p className="text-xs text-slate-500">A nova senha deve ter ao menos 8 caracteres.</p>

            {[
              { label: 'Senha atual', value: currentPwd, set: setCurrentPwd, show: showCurrent, toggle: () => setShowCurrent(p => !p) },
              { label: 'Nova senha', value: newPwd, set: setNewPwd, show: showNew, toggle: () => setShowNew(p => !p) },
              { label: 'Confirmar nova senha', value: confirmPwd, set: setConfirmPwd, show: showNew, toggle: () => setShowNew(p => !p) },
            ].map((field, i) => (
              <div key={i}>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">{field.label} *</label>
                <div className="relative">
                  <input required type={field.show ? 'text' : 'password'} value={field.value}
                    onChange={e => field.set(e.target.value)} minLength={i > 0 ? 8 : undefined}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                  <button type="button" onClick={field.toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                    {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}

            <button type="submit" disabled={savingPwd}
              className="w-full py-2.5 rounded-xl gradient-brand text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {savingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar nova senha'}
            </button>
          </form>

          {isAdminRole && (
            <div className="rounded-2xl bg-white/3 border border-white/8 p-6 space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-brand-400" />
                  <h3 className="text-white font-medium text-sm">Autenticação em 2 fatores</h3>
                </div>
                {totpActive && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">Ativo</span>
                )}
              </div>
              <p className="text-xs text-slate-500">Adiciona uma camada extra de segurança ao seu login de administrador.</p>

              {!totpQr && !totpActive && (
                <button onClick={setupTotp} disabled={totpSaving}
                  className="w-full py-2.5 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-400 text-sm font-medium hover:bg-brand-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {totpSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Configurar 2FA
                </button>
              )}

              {totpQr && (
                <form onSubmit={confirmTotp} className="space-y-4">
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={totpQr} alt="QR code 2FA" className="w-48 h-48 rounded-xl bg-white p-2" />
                  </div>
                  <p className="text-xs text-slate-400 text-center">Escaneie com Google Authenticator ou Authy e insira o código gerado:</p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpConfirm}
                    onChange={e => setTotpConfirm(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono tracking-widest text-center outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                  <button type="submit" disabled={totpSaving || totpConfirm.length !== 6}
                    className="w-full py-2.5 rounded-xl gradient-brand text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                    {totpSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar ativação'}
                  </button>
                </form>
              )}

              {totpActive && (
                <p className="text-xs text-slate-500 text-center">2FA ativo. Para desativar, entre em contato com um administrador do sistema.</p>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
