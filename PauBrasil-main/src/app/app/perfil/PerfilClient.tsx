"use client"

import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import { User, Building2, MapPin, Mail, LogOut, Star, Shield, Key, Eye, EyeOff, Loader2, Camera } from 'lucide-react'
import { getLevel, LEVEL_COLORS, LEVEL_BG } from '@/types'
import { useEffect, useRef, useState } from 'react'
import { toast } from '@/components/ui/toaster'
import Image from 'next/image'
import { getRoleLabel, getUnitsLabel } from '@/lib/user-display'

type Tab = 'perfil' | 'senha'

export default function PerfilClient({ initialTab }: { initialTab?: string }) {
  const { data: session } = useSession()
  const user = session?.user

  const [balance, setBalance] = useState<{ confirmed: number } | null>(null)
  const [tab, setTab] = useState<Tab>((initialTab as Tab) ?? 'perfil')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const { update } = useSession()

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)

  useEffect(() => {
    fetch('/api/pontos')
      .then(r => r.json())
      .then(d => setBalance(d.balance))
  }, [])

  const level = balance ? getLevel(balance.confirmed) : 'Bronze'
  const unitLabel = getUnitsLabel(user?.units)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('aspectRatio', '1/1')
      const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
      const upData = await upRes.json()
      if (!upRes.ok) throw new Error(upData.error || 'Erro no upload')

      const saveRes = await fetch('/api/me/photo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: upData.url }),
      })
      if (!saveRes.ok) throw new Error('Erro ao salvar foto')

      await update({ photoUrl: upData.url })
      toast({ title: '✅ Foto atualizada!' })
    } catch (err: any) {
      toast({ title: err.message || 'Erro ao atualizar foto', variant: 'destructive' })
    } finally {
      setUploadingPhoto(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()

    if (newPwd !== confirmPwd) {
      toast({ title: 'As senhas não coincidem', variant: 'destructive' })
      return
    }

    if (newPwd.length < 8) {
      toast({ title: 'Nova senha deve ter ao menos 8 caracteres', variant: 'destructive' })
      return
    }

    setSavingPwd(true)

    try {
      const res = await fetch('/api/me/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPwd,
          newPassword: newPwd,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      toast({ title: '✅ Senha alterada com sucesso!' })

      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
    } catch (e: any) {
      toast({ title: e.message || 'Erro ao alterar senha', variant: 'destructive' })
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-display font-bold text-white">Perfil</h1>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-white/3 border border-white/8 p-6 flex items-center gap-5"
      >
        <div className="relative shrink-0 group">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-brand-500/25">
            {user?.photoUrl ? (
              <Image src={user.photoUrl} alt={user.name ?? 'Foto'} width={64} height={64} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gradient-brand flex items-center justify-center">
                <span className="text-white font-bold text-2xl font-display">{user?.name?.[0] ?? 'U'}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => photoInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            title="Alterar foto"
          >
            {uploadingPhoto ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
          </button>
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        <div>
          <h2 className="text-xl font-display font-bold text-white">
            {user?.name}
          </h2>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${LEVEL_BG[level]} ${LEVEL_COLORS[level]}`}>
              <Star className="w-3 h-3" />
              {level}
            </div>

            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400">
              <Shield className="w-3 h-3" />
              {getRoleLabel(user?.role)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/5">
        {([
          ['perfil', 'Meus Dados', User],
          ['senha', 'Alterar Senha', Key],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === key
                ? 'bg-brand-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
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
                <div
                  key={item.label}
                  className={`flex items-center gap-4 px-5 py-4 ${
                    i > 0 ? 'border-t border-white/5' : ''
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-500">{item.label}</div>
                    <div className="text-sm text-white">{item.value}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full py-3 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sair do Portal
          </button>
        </>
      )}
    </div>
  )
}
